package main

import (
	"bufio"
	"crypto/sha1"
	"embed"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"
)

//go:embed all:dist
var embeddedDistFS embed.FS

// ==============================================================================
// 🀄 国粹棋牌高并发游戏服务端 (Go-Authoritative Engine)
// 语言: Go 1.21+ (零外部第三方依赖，标准库原生编译，极速构建，超低内存占用)
// 支持平台: Android Termux (ARM64), Linux (x86_64/ARM64), Docker, Windows, macOS
// 支持三大国粹棋牌: 经典烟三、水镜十三水、经典国标麻将
// ==============================================================================

const (
	wsGUID       = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
	opText       = 1
	opBinary     = 2
	opClose      = 8
	opPing       = 9
	opPong       = 10
	defaultPort  = "3000"
	databaseFile = "data/game_database.json"
)

// ------------------------------------------------------------------------------
// 数据结构定义 (与前端 Vue 3 及 TypeScript 完全保持一致)
// ------------------------------------------------------------------------------

type RoomPlayer struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Rating uint32 `json:"rating"`
	Seat   int    `json:"seat"`
}

type RoomChatMessage struct {
	ID         string  `json:"id"`
	Sender     string  `json:"sender"`
	Text       string  `json:"text"`
	Timestamp  string  `json:"timestamp"`
	Prop       *string `json:"prop,omitempty"`
	TargetSeat *int    `json:"targetSeat,omitempty"`
	Avatar     *string `json:"avatar,omitempty"`
}

type AuthoritativeBoardState struct {
	RoomID       string          `json:"roomId"`
	GameType     string          `json:"gameType"`
	Phase        string          `json:"phase"` // "idle" | "playing" | "comparing" | "ended"
	TurnSeat     int             `json:"turnSeat"`
	ActionSeq    int             `json:"actionSeq"`
	MoveCount    int             `json:"moveCount"`
	Multiplier   int             `json:"multiplier"`
	HandsCount   []int           `json:"handsCount"`
	LastCombo    json.RawMessage `json:"lastCombo,omitempty"`
	LandlordSeat        *int            `json:"landlordSeat,omitempty"`
	WinnerSeat          *int            `json:"winnerSeat,omitempty"`
	FinishedSeats       []int           `json:"finishedSeats,omitempty"`
	Settlement          interface{}     `json:"settlement,omitempty"`
	AllianceScoreResult interface{}     `json:"allianceScoreResult,omitempty"`
	UpdatedAt           int64           `json:"updatedAt"`
}

type RoomState struct {
	ID         string                   `json:"id"`
	Title      string                   `json:"title"`
	GameType   string                   `json:"gameType"`
	Status     string                   `json:"status"`
	Players    []RoomPlayer             `json:"players"`
	Spectators int                      `json:"spectators"`
	TurnSeat   int                      `json:"turnSeat"`
	MoveCount  int                      `json:"moveCount"`
	ModeLabel  string                   `json:"modeLabel"`
	Chat       []RoomChatMessage        `json:"chat"`
	BoardState *AuthoritativeBoardState `json:"boardState,omitempty"`
}

// ------------------------------------------------------------------------------
// RFC 6455 原生 WebSocket 简易高性能封装 (无需依赖 gorilla 或 x/net)
// ------------------------------------------------------------------------------

type WSConn struct {
	conn net.Conn
	bufr *bufio.Reader
	bufw *bufio.Writer
	mu   sync.Mutex
	open bool
	id   string
}

func newWSConn(conn net.Conn, br *bufio.Reader, bw *bufio.Writer, id string) *WSConn {
	return &WSConn{
		conn: conn,
		bufr: br,
		bufw: bw,
		open: true,
		id:   id,
	}
}

func (w *WSConn) WriteMessage(opcode byte, payload []byte) error {
	w.mu.Lock()
	defer w.mu.Unlock()

	if !w.open {
		return fmt.Errorf("connection closed")
	}

	length := len(payload)
	var header []byte

	// FIN + opcode
	b0 := byte(0x80) | (opcode & 0x0F)

	if length <= 125 {
		header = []byte{b0, byte(length)}
	} else if length <= 65535 {
		header = make([]byte, 4)
		header[0] = b0
		header[1] = 126
		binary.BigEndian.PutUint16(header[2:4], uint16(length))
	} else {
		header = make([]byte, 10)
		header[0] = b0
		header[1] = 127
		binary.BigEndian.PutUint64(header[2:10], uint64(length))
	}

	if _, err := w.bufw.Write(header); err != nil {
		w.open = false
		return err
	}
	if length > 0 {
		if _, err := w.bufw.Write(payload); err != nil {
			w.open = false
			return err
		}
	}
	return w.bufw.Flush()
}

func (w *WSConn) WriteText(text string) error {
	return w.WriteMessage(opText, []byte(text))
}

func (w *WSConn) WriteJSON(v interface{}) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return w.WriteMessage(opText, data)
}

func (w *WSConn) ReadMessage() (byte, []byte, error) {
	for {
		b0, err := w.bufr.ReadByte()
		if err != nil {
			return 0, nil, err
		}
		opcode := b0 & 0x0F

		b1, err := w.bufr.ReadByte()
		if err != nil {
			return 0, nil, err
		}
		masked := (b1 & 0x80) != 0
		payloadLen := int(b1 & 0x7F)

		if payloadLen == 126 {
			var extLen uint16
			if err := binary.Read(w.bufr, binary.BigEndian, &extLen); err != nil {
				return 0, nil, err
			}
			payloadLen = int(extLen)
		} else if payloadLen == 127 {
			var extLen uint64
			if err := binary.Read(w.bufr, binary.BigEndian, &extLen); err != nil {
				return 0, nil, err
			}
			payloadLen = int(extLen)
		}

		var maskKey [4]byte
		if masked {
			if _, err := io.ReadFull(w.bufr, maskKey[:]); err != nil {
				return 0, nil, err
			}
		}

		payload := make([]byte, payloadLen)
		if _, err := io.ReadFull(w.bufr, payload); err != nil {
			return 0, nil, err
		}

		if masked {
			for i := 0; i < payloadLen; i++ {
				payload[i] ^= maskKey[i%4]
			}
		}

		switch opcode {
		case opClose:
			w.Close()
			return opClose, payload, io.EOF
		case opPing:
			_ = w.WriteMessage(opPong, payload)
			continue
		case opPong:
			continue
		case opText, opBinary:
			return opcode, payload, nil
		}
	}
}

func (w *WSConn) Close() {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.open {
		w.open = false
		_ = w.conn.Close()
	}
}

// ------------------------------------------------------------------------------
// Hub 客户端管理中心
// ------------------------------------------------------------------------------

type Hub struct {
	clients    map[string]*WSConn
	rooms      map[string]*RoomState
	mu         sync.RWMutex
	broadcast  chan []byte
	register   chan *WSConn
	unregister chan *WSConn
	bootTime   time.Time
}

func newHub() *Hub {
	h := &Hub{
		clients:    make(map[string]*WSConn),
		rooms:      make(map[string]*RoomState),
		broadcast:  make(chan []byte, 1024),
		register:   make(chan *WSConn),
		unregister: make(chan *WSConn),
		bootTime:   time.Now(),
	}
	h.seedDefaultRooms()
	return h
}

func (h *Hub) seedDefaultRooms() {
	now := time.Now().UnixMilli()

	// RM-202 经典烟三
	h.rooms["RM-202"] = &RoomState{
		ID:        "RM-202",
		Title:     "风雷堂 · 经典烟三四人赛",
		GameType:  "yansan",
		Status:    "playing",
		Players: []RoomPlayer{
			{ID: "P-4", Name: "快枪手张三", Rating: 2010, Seat: 0},
			{ID: "P-5", Name: "关门客李四", Rating: 1940, Seat: 1},
			{ID: "P-6", Name: "岭南少侠", Rating: 1870, Seat: 2},
		},
		Spectators: 9,
		TurnSeat:   0,
		MoveCount:  6,
		ModeLabel:  "方块四首出 · 四人争锋",
		Chat: []RoomChatMessage{
			{ID: "c2", Sender: "快枪手张三", Text: "方块四直接开顺子！", Timestamp: "10:04"},
		},
		BoardState: &AuthoritativeBoardState{
			RoomID:     "RM-202",
			GameType:   "yansan",
			Phase:      "playing",
			TurnSeat:   0,
			ActionSeq:  1,
			MoveCount:  6,
			Multiplier: 1,
			HandsCount: []int{13, 13, 13, 13},
			UpdatedAt:  now,
		},
	}

	// RM-204 经典十三水
	h.rooms["RM-204"] = &RoomState{
		ID:        "RM-204",
		Title:     "水镜阁 · 经典十三水",
		GameType:  "shisanshui",
		Status:    "playing",
		Players: []RoomPlayer{
			{ID: "P-11", Name: "罗宋巧手", Rating: 2060, Seat: 0},
			{ID: "P-12", Name: "倒水掌门", Rating: 1850, Seat: 1},
			{ID: "P-13", Name: "十三飞龙", Rating: 2200, Seat: 2},
			{ID: "P-14", Name: "七星居士", Rating: 1970, Seat: 3},
		},
		Spectators: 18,
		TurnSeat:   0,
		MoveCount:  1,
		ModeLabel:  "头中尾三道 · 智能理牌",
		Chat: []RoomChatMessage{
			{ID: "c4", Sender: "十三飞龙", Text: "尾道葫芦中道同花，防倒水稳如磐石。", Timestamp: "10:06"},
		},
		BoardState: &AuthoritativeBoardState{
			RoomID:     "RM-204",
			GameType:   "shisanshui",
			Phase:      "playing",
			TurnSeat:   0,
			ActionSeq:  1,
			MoveCount:  1,
			Multiplier: 1,
			HandsCount: []int{13, 13, 13, 13},
			UpdatedAt:  now,
		},
	}

	// RM-205 经典国标麻将
	h.rooms["RM-205"] = &RoomState{
		ID:        "RM-205",
		Title:     "雀神楼 · 经典国标麻将",
		GameType:  "mahjong",
		Status:    "playing",
		Players: []RoomPlayer{
			{ID: "P-15", Name: "天和雀圣", Rating: 2240, Seat: 0},
			{ID: "P-16", Name: "清一色老叟", Rating: 2110, Seat: 1},
			{ID: "P-17", Name: "大三元道长", Rating: 2180, Seat: 2},
			{ID: "P-18", Name: "十三幺隐士", Rating: 2290, Seat: 3},
		},
		Spectators: 31,
		TurnSeat:   0,
		MoveCount:  12,
		ModeLabel:  "万条筒字 · 碰杠听胡",
		Chat: []RoomChatMessage{
			{ID: "c5", Sender: "天和雀圣", Text: "自摸万字清一色，听牌在手！", Timestamp: "10:07"},
		},
		BoardState: &AuthoritativeBoardState{
			RoomID:     "RM-205",
			GameType:   "mahjong",
			Phase:      "playing",
			TurnSeat:   0,
			ActionSeq:  1,
			MoveCount:  12,
			Multiplier: 1,
			HandsCount: []int{13, 13, 13, 13},
			UpdatedAt:  now,
		},
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.id] = client
			online := len(h.clients)
			h.mu.Unlock()

			// 发送大厅初始快照
			h.mu.RLock()
			allRooms := make([]*RoomState, 0, len(h.rooms))
			for _, r := range h.rooms {
				allRooms = append(allRooms, r)
			}
			h.mu.RUnlock()

			snapshot := map[string]interface{}{
				"type":        "lobby_snapshot",
				"rooms":       allRooms,
				"onlineCount": online,
				"serverTs":    time.Now().UnixMilli(),
			}
			_ = client.WriteJSON(snapshot)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.id]; ok {
				delete(h.clients, client.id)
				client.Close()
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, client := range h.clients {
				go func(c *WSConn) {
					_ = c.WriteMessage(opText, message)
				}(client)
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastJSON(v interface{}) {
	data, err := json.Marshal(v)
	if err == nil {
		h.broadcast <- data
	}
}

func (h *Hub) handleMessage(client *WSConn, raw []byte) {
	var msg map[string]interface{}
	if err := json.Unmarshal(raw, &msg); err != nil {
		return
	}

	msgType, _ := msg["type"].(string)
	now := time.Now().UnixMilli()

	switch msgType {
	case "ping":
		pong := map[string]interface{}{
			"type":        "pong",
			"clientTs":    msg["clientTs"],
			"serverTs":    now,
			"onlineCount": len(h.clients),
		}
		_ = client.WriteJSON(pong)

	case "room_create":
		h.mu.Lock()
		roomID := fmt.Sprintf("RM-%d", 207+rand.Intn(800))
		title, _ := msg["title"].(string)
		if title == "" {
			title = "茗局雅客的牌局"
		}
		gType, _ := msg["gameType"].(string)
		if gType == "" {
			gType = "yansan"
		}
		pName, _ := msg["playerName"].(string)
		if pName == "" {
			pName = "茗局雅客"
		}

		newRoom := &RoomState{
			ID:        roomID,
			Title:     title,
			GameType:  gType,
			Status:    "playing",
			Players: []RoomPlayer{
				{
					ID:     fmt.Sprintf("P-%d", now),
					Name:   pName,
					Rating: 1900,
					Seat:   0,
				},
			},
			Spectators: 1,
			TurnSeat:   0,
			MoveCount:  0,
			ModeLabel:  "实时 WebSocket 牌桌",
			Chat: []RoomChatMessage{
				{
					ID:        fmt.Sprintf("c-%d", now),
					Sender:    "系统司仪",
					Text:      fmt.Sprintf("房间 %s 已建立，欢迎各路牌友入席！", roomID),
					Timestamp: time.Now().Format("15:04"),
				},
			},
			BoardState: &AuthoritativeBoardState{
				RoomID:     roomID,
				GameType:   gType,
				Phase:      "playing",
				TurnSeat:   0,
				ActionSeq:  1,
				MoveCount:  0,
				Multiplier: 1,
				HandsCount: []int{13, 13, 13, 13},
				UpdatedAt:  now,
			},
		}
		h.rooms[roomID] = newRoom

		allRooms := make([]*RoomState, 0, len(h.rooms))
		for _, r := range h.rooms {
			allRooms = append(allRooms, r)
		}
		h.mu.Unlock()

		h.BroadcastJSON(map[string]interface{}{
			"type":  "room_created",
			"room":  newRoom,
			"rooms": allRooms,
		})

	case "room_join":
		roomID, _ := msg["roomId"].(string)
		h.mu.Lock()
		if room, ok := h.rooms[roomID]; ok {
			pName, _ := msg["playerName"].(string)
			if pName == "" {
				pName = "牌友"
			}
			found := false
			for _, p := range room.Players {
				if p.Name == pName {
					found = true
					break
				}
			}
			if !found && len(room.Players) < 4 {
				room.Players = append(room.Players, RoomPlayer{
					ID:     fmt.Sprintf("P-%d", now),
					Name:   pName,
					Rating: 1900,
					Seat:   len(room.Players),
				})
			} else {
				room.Spectators++
			}

			allRooms := make([]*RoomState, 0, len(h.rooms))
			for _, r := range h.rooms {
				allRooms = append(allRooms, r)
			}
			roomCopy := *room
			h.mu.Unlock()

			h.BroadcastJSON(map[string]interface{}{
				"type":  "room_updated",
				"room":  roomCopy,
				"rooms": allRooms,
			})
		} else {
			h.mu.Unlock()
		}

	case "room_leave":
		roomID, _ := msg["roomId"].(string)
		h.mu.Lock()
		if room, ok := h.rooms[roomID]; ok {
			if room.Spectators > 0 {
				room.Spectators--
			}
			allRooms := make([]*RoomState, 0, len(h.rooms))
			for _, r := range h.rooms {
				allRooms = append(allRooms, r)
			}
			roomCopy := *room
			h.mu.Unlock()

			h.BroadcastJSON(map[string]interface{}{
				"type":  "room_updated",
				"room":  roomCopy,
				"rooms": allRooms,
			})
		} else {
			h.mu.Unlock()
		}

	case "room_reconnect", "scene_reconnect":
		roomID, _ := msg["roomId"].(string)
		h.mu.RLock()
		if room, ok := h.rooms[roomID]; ok {
			roomCopy := *room
			h.mu.RUnlock()
			ackType := "reconnect_ack"
			if mType, _ := msg["type"].(string); mType == "scene_reconnect" {
				ackType = "scene_reconnect_ack"
			}
			_ = client.WriteJSON(map[string]interface{}{
				"type":       ackType,
				"room":       roomCopy,
				"boardState": roomCopy.BoardState,
				"players":    roomCopy.Players,
				"serverTs":   now,
			})
		} else {
			h.mu.RUnlock()
			if mType, _ := msg["type"].(string); mType == "scene_reconnect" {
				_ = client.WriteJSON(map[string]interface{}{
					"type":   "scene_reconnect_ack",
					"failed": true,
					"reason": "room_not_found",
				})
			}
		}

	case "game_chat":
		roomID, _ := msg["roomId"].(string)
		h.mu.Lock()
		if room, ok := h.rooms[roomID]; ok {
			text, _ := msg["text"].(string)
			sender, _ := msg["sender"].(string)
			if sender == "" {
				sender = "牌友"
			}
			chatMsg := RoomChatMessage{
				ID:        fmt.Sprintf("chat-%d", now),
				Sender:    sender,
				Text:      text,
				Timestamp: time.Now().Format("15:04"),
			}
			room.Chat = append(room.Chat, chatMsg)
			if len(room.Chat) > 50 {
				room.Chat = room.Chat[1:]
			}
			h.mu.Unlock()

			h.BroadcastJSON(map[string]interface{}{
				"type":    "chat_broadcast",
				"roomId":  roomID,
				"message": chatMsg,
			})
		} else {
			h.mu.Unlock()
		}

	case "game_move":
		roomID, _ := msg["roomId"].(string)
		h.mu.Lock()
		if room, ok := h.rooms[roomID]; ok {
			room.MoveCount++
			seat := 0
			if s, ok := msg["seat"].(float64); ok {
				seat = int(s)
			}
			payload, _ := msg["payload"].(map[string]interface{})

			if room.BoardState != nil {
				room.BoardState.ActionSeq++
				room.BoardState.MoveCount = room.MoveCount
				room.BoardState.UpdatedAt = now

				if payload != nil {
					if m, ok := payload["multiplier"].(float64); ok {
						room.BoardState.Multiplier = int(m)
					}
					if ll, ok := payload["landlord"].(float64); ok {
						lVal := int(ll)
						room.BoardState.LandlordSeat = &lVal
						room.BoardState.Phase = "playing"
					}
					if next, ok := payload["nextTurn"].(float64); ok {
						room.BoardState.TurnSeat = int(next)
						room.TurnSeat = int(next)
					}
					if winner, ok := payload["winner"].(float64); ok {
						wVal := int(winner)
						room.BoardState.WinnerSeat = &wVal
						room.BoardState.Phase = "ended"
					}
					if act, ok := payload["action"].(string); ok && act == "finish" {
						room.BoardState.Phase = "ended"
					}
					if fSeats, ok := payload["finishedSeats"].([]interface{}); ok {
						seats := make([]int, 0, len(fSeats))
						for _, fs := range fSeats {
							if n, ok := fs.(float64); ok {
								seats = append(seats, int(n))
							}
						}
						room.BoardState.FinishedSeats = seats
					}
					if allRes, ok := payload["allianceScoreResult"]; ok {
						room.BoardState.AllianceScoreResult = allRes
						room.BoardState.Settlement = allRes
					}
					if cardsPlayed, ok := payload["cardsCount"].(float64); ok {
						if seat >= 0 && seat < len(room.BoardState.HandsCount) {
							rem := room.BoardState.HandsCount[seat] - int(cardsPlayed)
							if rem < 0 {
								rem = 0
							}
							room.BoardState.HandsCount[seat] = rem
							if rem == 0 {
								found := false
								for _, fs := range room.BoardState.FinishedSeats {
									if fs == seat {
										found = true
										break
									}
								}
								if !found {
									room.BoardState.FinishedSeats = append(room.BoardState.FinishedSeats, seat)
								}
							}
						}
					}
				}
			}

			boardCopy := *room.BoardState
			moveCount := room.MoveCount
			h.mu.Unlock()

			h.BroadcastJSON(map[string]interface{}{
				"type":       "game_event",
				"roomId":     roomID,
				"seat":       seat,
				"payload":    payload,
				"moveCount":  moveCount,
				"boardState": boardCopy,
			})
		} else {
			h.mu.Unlock()
		}

	default:
		// 通用消息全局透明广播转发 (如 scene_chat, scene_join, presence_counts, scene_chat_broadcast)
		h.broadcast <- raw
	}
}

// ------------------------------------------------------------------------------
// HTTP 路由与 SPA 静态资源服务
// ------------------------------------------------------------------------------

func setupRoutes(h *Hub, distDir string) http.Handler {
	mux := http.NewServeMux()

	// 1. WebSocket 升级端点
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		if strings.ToLower(r.Header.Get("Upgrade")) != "websocket" {
			http.Error(w, "Expected websocket upgrade", http.StatusBadRequest)
			return
		}

		key := r.Header.Get("Sec-WebSocket-Key")
		if key == "" {
			http.Error(w, "Missing Sec-WebSocket-Key", http.StatusBadRequest)
			return
		}

		// 计算 Sec-WebSocket-Accept
		hSha := sha1.New()
		hSha.Write([]byte(key + wsGUID))
		accept := base64.StdEncoding.EncodeToString(hSha.Sum(nil))

		// Hijack 底层 TCP 连接
		hj, ok := w.(http.Hijacker)
		if !ok {
			http.Error(w, "Hijack failed", http.StatusInternalServerError)
			return
		}

		conn, bufrw, err := hj.Hijack()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// 发送 101 Switching Protocols 响应头
		resp := "HTTP/1.1 101 Switching Protocols\r\n" +
			"Upgrade: websocket\r\n" +
			"Connection: Upgrade\r\n" +
			"Sec-WebSocket-Accept: " + accept + "\r\n\r\n"

		if _, err := bufrw.WriteString(resp); err != nil {
			_ = conn.Close()
			return
		}
		if err := bufrw.Flush(); err != nil {
			_ = conn.Close()
			return
		}

		socketID := fmt.Sprintf("go-ws-%d-%d", time.Now().UnixNano(), rand.Intn(10000))
		wsConn := newWSConn(conn, bufrw.Reader, bufrw.Writer, socketID)
		h.register <- wsConn

		go func() {
			defer func() {
				h.unregister <- wsConn
			}()
			for {
				op, payload, err := wsConn.ReadMessage()
				if err != nil {
					break
				}
				if op == opText {
					h.handleMessage(wsConn, payload)
				}
			}
		}()
	})

	// 2. 健康检查 API
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		h.mu.RLock()
		online := len(h.clients)
		h.mu.RUnlock()
		uptime := int64(time.Since(h.bootTime).Seconds())

		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":      "ok",
			"engine":      "Go-Authoritative",
			"onlineCount": online,
			"uptimeSecs":  uptime,
		})
	})

	// 3. 房间列表 API
	mux.HandleFunc("/api/rooms", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		h.mu.RLock()
		rooms := make([]*RoomState, 0, len(h.rooms))
		for _, rm := range h.rooms {
			rooms = append(rooms, rm)
		}
		h.mu.RUnlock()
		_ = json.NewEncoder(w).Encode(rooms)
	})

	// 4. 数据库导出 API
	mux.HandleFunc("/api/database/export", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		data, err := os.ReadFile(databaseFile)
		if err != nil {
			w.Write([]byte(`{"profiles":{},"records":[]}`))
			return
		}
		w.Write(data)
	})

	// 5. 数据库用户同步 API
	mux.HandleFunc("/api/user/sync", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")

		var payload struct {
			Profile map[string]interface{} `json:"profile"`
			Records []interface{}          `json:"records"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		_ = os.MkdirAll("data", 0755)
		var currentDB map[string]interface{}
		existing, err := os.ReadFile(databaseFile)
		if err == nil {
			_ = json.Unmarshal(existing, &currentDB)
		}
		if currentDB == nil {
			currentDB = map[string]interface{}{
				"profiles": map[string]interface{}{},
				"records":  []interface{}{},
			}
		}

		if payload.Profile != nil {
			pID, _ := payload.Profile["id"].(string)
			if pID == "" {
				pID = "default"
			}
			profiles, ok := currentDB["profiles"].(map[string]interface{})
			if !ok {
				profiles = make(map[string]interface{})
				currentDB["profiles"] = profiles
			}
			profiles[pID] = payload.Profile
		}

		if payload.Records != nil {
			currentDB["records"] = payload.Records
		}

		outBytes, err := json.MarshalIndent(currentDB, "", "  ")
		var respCoins interface{}
		var respRating interface{}
		var respLevel interface{}
		if payload.Profile != nil {
			respCoins = payload.Profile["coins"]
			respRating = payload.Profile["rating"]
			respLevel = payload.Profile["level"]
		}

		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"coins":   respCoins,
			"rating":  respRating,
			"level":   respLevel,
			"profile": payload.Profile,
		})
	})

	// 6. SPA 静态前端资源托管 (优先本地热加载，无文件时直接从 //go:embed 二进制内存中读取)
	useLocal := false
	localDistDir := "dist"
	if info, err := os.Stat("dist"); err == nil && info.IsDir() {
		useLocal = true
	} else if info, err := os.Stat("../dist"); err == nil && info.IsDir() {
		localDistDir = "../dist"
		useLocal = true
	}

	var rootFS fs.FS
	if useLocal {
		rootFS = os.DirFS(localDistDir)
	} else {
		sub, err := fs.Sub(embeddedDistFS, "dist")
		if err == nil {
			rootFS = sub
		} else {
			rootFS = embeddedDistFS
		}
	}

	fileServer := http.FileServer(http.FS(rootFS))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") || r.URL.Path == "/ws" {
			http.NotFound(w, r)
			return
		}

		cleanPath := strings.TrimPrefix(filepath.Clean(r.URL.Path), "/")
		if cleanPath == "" || cleanPath == "." {
			cleanPath = "index.html"
		}

		file, err := rootFS.Open(cleanPath)
		if err == nil {
			info, statErr := file.Stat()
			_ = file.Close()
			if statErr == nil && !info.IsDir() {
				ext := strings.ToLower(filepath.Ext(cleanPath))
				switch ext {
				case ".js", ".mjs":
					w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
				case ".css":
					w.Header().Set("Content-Type", "text/css; charset=utf-8")
				case ".svg":
					w.Header().Set("Content-Type", "image/svg+xml")
				case ".json":
					w.Header().Set("Content-Type", "application/json; charset=utf-8")
				case ".mp3":
					w.Header().Set("Content-Type", "audio/mpeg")
				}
				w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
				fileServer.ServeHTTP(w, r)
				return
			}
		}

		// SPA 单页应用 Fallback：返回 index.html
		indexFile, err := rootFS.Open("index.html")
		if err == nil {
			data, readErr := io.ReadAll(indexFile)
			_ = indexFile.Close()
			if readErr == nil {
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				w.WriteHeader(http.StatusOK)
				w.Write(data)
				return
			}
		}

		fileServer.ServeHTTP(w, r)
	})

	// 通用 CORS 中间件包裹
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Range, Accept, Origin")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		mux.ServeHTTP(w, r)
	})
}

// ------------------------------------------------------------------------------
// 主程序入口
// ------------------------------------------------------------------------------

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	hub := newHub()
	go hub.run()

	handler := setupRoutes(hub)

	addr := fmt.Sprintf("0.0.0.0:%s", port)
	server := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// 优雅启停信号捕获
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		fmt.Printf("==================================================================\n")
		fmt.Printf("  🀄 国粹棋牌 Go 高性能服务端已就绪 (Go-Authoritative Engine)\n")
		fmt.Printf("  📱 监听地址: http://%s\n", addr)
		fmt.Printf("  ⚡ WebSocket 节点: ws://%s/ws\n", addr)
		fmt.Printf("  📂 静态资源目录: %s\n", distDir)
		fmt.Printf("  🚀 特性: 零 CGO 依赖、秒级构建、极低内存占用、高并发协程调度\n")
		fmt.Printf("==================================================================\n")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[Go Server Error] %v", err)
		}
	}()

	<-stopChan
	fmt.Println("\n[Go Server] 正在安全停止服务...")
	_ = server.Close()
	fmt.Println("[Go Server] 服务已退出。")
}
