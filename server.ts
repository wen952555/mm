import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { loadDatabase, saveDatabase } from './src/serverStorage.ts';
import {
  handleApiRoute,
  getOrInitServerCarriage,
  loadBookingCarriagesFromDisk,
  saveBookingCarriagesToDisk,
} from './src/serverApi.ts';
import { initServerCarriageTables } from './src/games/shisanshui/bookingTrain.ts';
import { initTelegramBotService } from './src/telegramBotService.ts';
import { presenceTracker } from './src/presenceTracker.ts';
import { generateRoomDeal } from './src/gameDeckService.ts';
import { createDefaultBoardState, getSceneRequiredCoins, type AuthoritativeBoardState } from './src/gameLogic/index.ts';
import { checkMahjongWin, computeMahjongSettlement } from './src/engine/mahjongRules.ts';

function executeMahjongWinSettlement(room: any, winnerSeat: number, isFourHz: boolean, pPayload?: any) {
  if (!room || !room.boardState) return;
  room.boardState.winnerSeat = winnerSeat;
  room.boardState.phase = 'ended';

  const dealObj = room.deal || {};
  const winnerHand = (dealObj.seatCards && dealObj.seatCards[winnerSeat] && dealObj.seatCards[winnerSeat].length > 0)
    ? dealObj.seatCards[winnerSeat]
    : (pPayload?.winningHand || (pPayload?.tile ? [pPayload.tile] : []));

  const remWall = dealObj.remainingWall || [];
  const sMode = room.sceneMode || 'hongzhong-6';

  const stl = computeMahjongSettlement(
    winnerSeat,
    winnerHand,
    pPayload?.winningMelds || [],
    remWall,
    sMode,
    pPayload?.seatKongScores || [0, 0, 0, 0],
    isFourHz
  );

  room.boardState.winDesc = stl.isFourHongzhong ? '摸到四张红中直接胡牌' : '自摸和牌';

  // Authoritative database coin transfer with zero-sum guarantee
  try {
    const db = loadDatabase();
    room.players?.forEach((pl: any) => {
      if (pl && typeof pl.seat === 'number' && db.profiles?.[pl.id]) {
        const delta = stl.netCoinsPerSeat[pl.seat] || 0;
        db.profiles[pl.id].coins = Math.max(0, (db.profiles[pl.id].coins || 0) + delta);
        broadcast({
          type: 'user_coins_updated',
          userId: pl.id,
          coins: db.profiles[pl.id].coins,
          delta,
        });
      }
    });
    saveDatabase(db);
  } catch (e) {
    console.error('Error settling mahjong coins in database:', e);
  }

  const huEvtPayload = {
    action: 'hu',
    seat: winnerSeat,
    absSeat: winnerSeat,
    winner: winnerSeat,
    isFourHz: stl.isFourHongzhong,
    winningHand: stl.winningHand,
    winningMelds: stl.winningMelds,
    maCount: stl.maCount,
    maTiles: stl.maTiles,
    hitMaCount: stl.hitMaCount,
    payoutPerOpponent: stl.payoutPerOpponent,
    netCoinsPerSeat: stl.netCoinsPerSeat,
    rewardCoins: stl.netCoinsPerSeat[winnerSeat],
    reason: stl.isFourHongzhong ? 'four_hongzhong' : 'zimo_hu',
  };

  broadcast({
    type: 'game_event',
    roomId: room.id,
    seat: winnerSeat,
    event: huEvtPayload,
    payload: huEvtPayload,
    boardState: room.boardState,
  });

  const targetSceneRoom = sceneWaitingRooms.get(room.id);
  if (targetSceneRoom) {
    targetSceneRoom.status = 'finished';
    const disconnectedList = targetSceneRoom.players.filter((pl: any) => pl.isDisconnected);
    if (disconnectedList.length > 0) {
      targetSceneRoom.players = targetSceneRoom.players.filter((pl: any) => !pl.isDisconnected);
      targetSceneRoom.players.forEach((pl: any, idx: number) => {
        pl.seat = idx;
        pl.isReady = false;
      });
      targetSceneRoom.status = 'waiting';
    }
  }
}

// Auto-detect and load .env from project directory, parent directory (~/.env), or HOME
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  process.env.HOME ? path.resolve(process.env.HOME, '.env') : '',
].filter(Boolean);

for (const p of possibleEnvPaths) {
  if (fs.existsSync(p)) {
    try {
      const content = fs.readFileSync(p, 'utf-8');
      const parsed = dotenv.parse(content);
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' && v.trim() !== '') {
          process.env[k] = v.trim();
        }
      }
    } catch {}
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Purge only stale/corrupted python-repackaged 4.09 MB APK files (< 4.2MB), preserving genuine >= 4.2 MB official release APKs
try {
  const candidateFiles = [
    path.resolve(process.cwd(), 'apk', 'chess-game-release.apk'),
    path.resolve(process.cwd(), 'apk', 'chess-game-debug.apk'),
    path.resolve(process.cwd(), 'apk', 'app-latest.apk'),
    path.resolve(process.cwd(), 'public', 'chess-game-release.apk'),
  ];
  for (const cf of candidateFiles) {
    if (fs.existsSync(cf)) {
      try {
        const stats = fs.statSync(cf);
        // Stale python-repackaged file is ~4,093,258 bytes. Authentic Gradle release APK is > 4.4 MB (4,600,000+ bytes)
        if (stats.size < 4200000) {
          fs.unlinkSync(cf);
          console.log(`🧹 [Server] 已自动清理旧版未签名的损坏安装包: ${path.basename(cf)} (${(stats.size / 1048576).toFixed(2)} MB)`);
        }
      } catch {}
    }
  }

  // Purge obsolete 4.09MB build info json
  const infoCandidates = [
    path.resolve(process.cwd(), 'apk', 'apk-build-info.json'),
    path.resolve(process.cwd(), 'public', 'apk-build-info.json'),
  ];
  for (const ic of infoCandidates) {
    if (fs.existsSync(ic)) {
      try {
        const raw = fs.readFileSync(ic, 'utf-8');
        if (raw.includes('4093258') || raw.includes('3.90 MB') || raw.includes('4.09')) {
          fs.unlinkSync(ic);
        }
      } catch {}
    }
  }
} catch {}

export type GameType = 'yansan' | 'shisanshui' | 'mahjong';

const app = express();

// Universal CORS Middleware for Android Capacitor Native App (https://localhost / capacitor://localhost) & Web Clients
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Range, Accept, Origin, x-telegram-bot-api-secret-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('error', (err) => {
  console.warn('[WS Server Warning]', err);
});

export type { AuthoritativeBoardState };

const rooms = new Map<string, any>([
  [
    'RM-202',
    {
      id: 'RM-202',
      title: '风雷堂 · 经典烟三四人赛',
      gameType: 'yansan',
      status: 'playing',
      players: [
        { id: 'P-4', name: '快枪手张三', rating: 2010, seat: 0 },
        { id: 'P-5', name: '关门客李四', rating: 1940, seat: 1 },
        { id: 'P-6', name: '岭南少侠', rating: 1870, seat: 2 },
      ],
      spectators: 9,
      turnSeat: 0,
      moveCount: 6,
      modeLabel: '方块四首出 · 四人争锋',
      chat: [{ id: 'c2', sender: '快枪手张三', text: '方块四直接开顺子！', timestamp: '10:04' }],
      boardState: createDefaultBoardState('RM-202', 'yansan'),
    },
  ],
  [
    'RM-204',
    {
      id: 'RM-204',
      title: '水镜阁 · 经典十三水',
      gameType: 'shisanshui',
      status: 'playing',
      players: [
        { id: 'P-11', name: '罗宋巧手', rating: 2060, seat: 0 },
        { id: 'P-12', name: '倒水掌门', rating: 1850, seat: 1 },
        { id: 'P-13', name: '十三飞龙', rating: 2200, seat: 2 },
        { id: 'P-14', name: '七星居士', rating: 1970, seat: 3 },
      ],
      spectators: 18,
      turnSeat: 0,
      moveCount: 1,
      modeLabel: '头中尾三道 · 智能理牌',
      chat: [{ id: 'c4', sender: '十三飞龙', text: '尾道葫芦中道同花，防倒水稳如磐石。', timestamp: '10:06' }],
      boardState: createDefaultBoardState('RM-204', 'shisanshui'),
    },
  ],
  [
    'RM-205',
    {
      id: 'RM-205',
      title: '雀神楼 · 经典国标麻将',
      gameType: 'mahjong',
      status: 'playing',
      players: [
        { id: 'P-15', name: '天和雀圣', rating: 2240, seat: 0 },
        { id: 'P-16', name: '清一色老叟', rating: 2110, seat: 1 },
        { id: 'P-17', name: '大三元道长', rating: 2180, seat: 2 },
        { id: 'P-18', name: '十三幺隐士', rating: 2290, seat: 3 },
      ],
      spectators: 31,
      turnSeat: 0,
      moveCount: 12,
      modeLabel: '万条筒字 · 碰杠听胡',
      chat: [{ id: 'c5', sender: '天和雀圣', text: '自摸万字清一色，听牌在手！', timestamp: '10:07' }],
      boardState: createDefaultBoardState('RM-205', 'mahjong'),
    },
  ],
]);

interface ScenePlayer {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  coins: number;
  seat: number;
  isSimulated?: boolean;
  isReady?: boolean;
  socketId?: string;
  isDisconnected?: boolean;
  isAutoManaged?: boolean;
  originalId?: string;
  originalName?: string;
}

interface SceneWaitingRoom {
  id: string;
  gameType: string;
  sceneMode: string;
  sceneName: string;
  maxPlayers: number;
  players: ScenePlayer[];
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  createdAt: number;
  lastTurnTs?: number;
  deal?: any;
}

export interface ActiveChallengeRecord {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  gameType: string;
  sceneMode: string;
  sceneName: string;
  text: string;
  status: 'open' | 'accepted' | 'overwritten' | 'transferred' | 'cancelled' | 'removed';
  acceptedBy?: { id: string; name: string };
  timestamp: string;
  createdAt: number;
}

const sceneWaitingRooms = new Map<string, SceneWaitingRoom>();
const activeChallenges: ActiveChallengeRecord[] = [];

// Set authoritative presence references
presenceTracker.setReferences({ rooms, sceneWaitingRooms, wss });

function broadcast(payload: unknown) {
  try {
    const raw = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(raw);
        } catch {}
      }
    }
  } catch {}
}

function broadcastTeahousePlayers() {
  try {
    const db = loadDatabase();
    const players = presenceTracker.getAllPlayers(db.profiles || {});
    broadcast({
      type: 'teahouse_players_update',
      count: players.length,
      onlineCount: players.filter((p: any) => p.isOnline).length,
      players,
    });
  } catch {}
}

wss.on('connection', (ws) => {
  const socketId = Math.random().toString(36).slice(2, 10);
  (ws as any).socketId = socketId;
  (ws as any).isAlive = true;
  (ws as any).lastHeartbeat = Date.now();
  presenceTracker.recordClient(socketId, { gameType: 'lobby' });

  ws.on('pong', () => {
    (ws as any).isAlive = true;
    (ws as any).lastHeartbeat = Date.now();
  });

  ws.on('error', () => {
    // Gracefully ignore client connection reset
  });

  try {
    const presenceCounts = presenceTracker.getRealGamePresence();
    const db = loadDatabase();
    const teahousePlayers = presenceTracker.getAllPlayers(db.profiles || {});
    ws.send(
      JSON.stringify({
        type: 'lobby_snapshot',
        rooms: Array.from(rooms.values()),
        onlineCount: wss.clients.size,
        counts: presenceCounts,
        players: teahousePlayers,
        serverTs: Date.now(),
      })
    );
    ws.send(
      JSON.stringify({
        type: 'teahouse_players_update',
        count: teahousePlayers.length,
        onlineCount: teahousePlayers.filter((p: any) => p.isOnline).length,
        players: teahousePlayers,
      })
    );
  } catch {}

  // Broadcast real presence counts on new client connection
  broadcast({
    type: 'presence_counts',
    counts: presenceTracker.getRealGamePresence(),
  });
  broadcastTeahousePlayers();

  ws.on('close', () => {
    presenceTracker.removeClient((ws as any).socketId);
    broadcastTeahousePlayers();
    const sRoomId = (ws as any).sceneRoomId;
    const pId = (ws as any).scenePlayerId;
    let room = sRoomId ? sceneWaitingRooms.get(sRoomId) : undefined;
    if (!room && sRoomId) {
      room = rooms.get(sRoomId) as any;
    }
    if (sRoomId && room) {
      const isShisanshuiReservation = room.gameType === 'shisanshui' && room.sceneMode === 'reservation';

      // 局内断线自动智能托管机制 (除十三水预约场外)：若普通对局进行中(starting或playing)，开启托管完成该局
      // 规则例外：十三水预约场设定为倒计时到时间自动结算，不触发断线自动托管功能
      if ((room.status === 'starting' || room.status === 'playing') && !isShisanshuiReservation) {
        const pl = room.players.find((p: any) => p.id === pId);
        if (pl) {
          const plSeat = pl.seat;
          (pl as any).isDisconnected = true;
          (pl as any).isAutoManaged = true; // 标记自动托管状态

          const authRoom = rooms.get(sRoomId);
          if (authRoom) {
            const aPl = (authRoom.players || []).find((p: any) => p.id === pId);
            if (aPl) {
              (aPl as any).isDisconnected = true;
              (aPl as any).isAutoManaged = true;
            }
            if (!authRoom.boardState) {
              authRoom.boardState = createDefaultBoardState(authRoom.id, authRoom.gameType);
            }
            if (!authRoom.boardState.autoManagedSeats) authRoom.boardState.autoManagedSeats = {};
            authRoom.boardState.autoManagedSeats[plSeat] = true;
            // 若恰为当前出牌席位，立即加速至超时阈值，让托管秒级出牌，绝不卡桌
            if (authRoom.turnSeat === plSeat) {
              authRoom.lastTurnTs = Date.now() - 2000;
            }
          }

          console.log(`🤖 [断线自动托管] 玩家 ${pl.name} (${pl.id}) 席位 ${plSeat} 掉线，已启用智能托管完成该局对局`);
          broadcast({
            type: 'scene_room_update',
            roomId: room.id,
            gameType: room.gameType,
            sceneMode: room.sceneMode,
            players: room.players,
            maxPlayers: room.maxPlayers,
            status: room.status,
          });
          broadcast({
            type: 'game_event',
            roomId: room.id,
            seat: plSeat,
            event: {
              action: 'set_auto_host',
              seat: plSeat,
              absSeat: plSeat,
              isAutoManaged: true,
              isAutoHost: true,
              isDisconnected: true,
              playerName: pl.name,
            },
            payload: {
              action: 'set_auto_host',
              seat: plSeat,
              absSeat: plSeat,
              isAutoManaged: true,
              isAutoHost: true,
              isDisconnected: true,
              playerName: pl.name,
            },
            boardState: authRoom ? authRoom.boardState : (room as any).boardState,
          });
        }
      } else {
        // 未开局的普通等候室或十三水预约场：直接移出并重排席位方便其他玩家入座
        room.players = room.players.filter((pl: any) => pl.id !== pId);
        if (room.players.length === 0) {
          sceneWaitingRooms.delete(sRoomId);
        } else {
          room.players.forEach((pl: any, idx: number) => {
            pl.seat = idx;
          });
          if (room.status !== 'playing' && room.status !== 'starting') {
            room.status = 'waiting';
          }
          broadcast({
            type: 'scene_room_update',
            roomId: room.id,
            gameType: room.gameType,
            sceneMode: room.sceneMode,
            players: room.players,
            maxPlayers: room.maxPlayers,
            status: room.status,
          });
        }
      }
    }
    // 若断开连接的玩家有未被应战的战帖，自动清理移出，避免挂在擂台造成无效战帖残留刷屏
    for (let i = activeChallenges.length - 1; i >= 0; i--) {
      const ch = activeChallenges[i];
      if (ch.senderId === pId && !ch.acceptedBy) {
        const rmId = ch.id;
        activeChallenges.splice(i, 1);
        broadcast({
          type: 'challenge_status_update',
          challengeId: rmId,
          status: 'removed',
          senderId: pId,
          senderName: ch.senderName,
          gameType: ch.gameType,
          sceneMode: ch.sceneMode,
        });
      }
    }
    // Broadcast updated genuine player count across games
    broadcast({
      type: 'presence_counts',
      counts: presenceTracker.getRealGamePresence(),
    });
  });

  ws.on('message', (data) => {
    try {
      (ws as any).isAlive = true;
      (ws as any).lastHeartbeat = Date.now();
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ping') {
        ws.send(
          JSON.stringify({
            type: 'pong',
            clientTs: msg.clientTs,
            serverTs: Date.now(),
            onlineCount: wss.clients.size,
          })
        );
        return;
      }

      if (msg.type === 'presence_update') {
        const targetGame = msg.gameType === 'yansan' || msg.gameType === 'shisanshui' || msg.gameType === 'mahjong' ? msg.gameType : 'lobby';
        presenceTracker.updateClientGame((ws as any).socketId, targetGame, msg.sceneMode);
        if (msg.playerId) {
          presenceTracker.recordClient((ws as any).socketId, {
            gameType: targetGame,
            playerId: msg.playerId,
            playerName: msg.playerName,
            avatar: msg.avatar,
            coins: typeof msg.coins === 'number' ? msg.coins : undefined,
            rating: typeof msg.rating === 'number' ? msg.rating : undefined,
            phone: msg.phone,
            sceneMode: msg.sceneMode,
          });
        }
        broadcast({
          type: 'presence_counts',
          counts: presenceTracker.getRealGamePresence(),
        });
        broadcastTeahousePlayers();
        return;
      }

      if (msg.type === 'request_teahouse_players') {
        const db = loadDatabase();
        const players = presenceTracker.getAllPlayers(db.profiles || {});
        ws.send(JSON.stringify({
          type: 'teahouse_players_update',
          count: players.length,
          onlineCount: players.filter((p: any) => p.isOnline).length,
          players,
        }));
        return;
      }

      // ==========================================
      // 十三张预约场火车专列服务器预发牌与状态序列化存储
      // ==========================================
      if (msg.type === 'booking_get_carriage') {
        const sceneMode = msg.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
        const carriageNum = Number(msg.carriageNumber) || 1;
        const carriage = getOrInitServerCarriage(sceneMode, carriageNum);
        ws.send(
          JSON.stringify({
            type: 'booking_carriage_state',
            carriage,
            serverTs: Date.now(),
          })
        );
        return;
      }

      if (msg.type === 'booking_select_seat') {
        const sceneMode = msg.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
        const carriageNum = Number(msg.carriageNumber) || 1;
        const carriages = loadBookingCarriagesFromDisk();
        const key = `${sceneMode}_car_${carriageNum}`;
        let carriage = carriages[key] || initServerCarriageTables(carriageNum, sceneMode);

        carriage.selectedSeat = msg.seat || '东';
        if (carriage.unplayedTableIndices.length > 0 && !carriage.currentActiveTableIndex) {
          const randIdx = Math.floor(Math.random() * carriage.unplayedTableIndices.length);
          carriage.currentActiveTableIndex = carriage.unplayedTableIndices[randIdx];
        }
        carriages[key] = carriage;
        saveBookingCarriagesToDisk(carriages);

        ws.send(
          JSON.stringify({
            type: 'booking_seat_selected',
            carriage,
            activeTableIndex: carriage.currentActiveTableIndex,
            serverTs: Date.now(),
          })
        );
        return;
      }

      if (msg.type === 'booking_submit_hand' || msg.type === 'booking_submit') {
        const sceneMode = msg.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
        const carriageNum = Number(msg.carriageNumber) || 1;
        const carriages = loadBookingCarriagesFromDisk();
        const key = `${sceneMode}_car_${carriageNum}`;
        const carriage = carriages[key] || initServerCarriageTables(carriageNum, sceneMode);

        const tIdx = Number(msg.tableIndex) || carriage.currentActiveTableIndex || 1;
        const table = carriage.tables.find((t: any) => t.tableIndex === tIdx);

        if (table) {
          table.isSubmitted = true;
          table.playerSeat = msg.playerSeat || carriage.selectedSeat || '东';
          table.playerId = msg.playerId;
          table.playerName = msg.playerName;
          table.playerHand = msg.playerHand;
          table.submittedAt = Date.now();
          table.status = 'submitted';

          carriage.unplayedTableIndices = carriage.unplayedTableIndices.filter((idx: number) => idx !== tIdx);
          if (carriage.unplayedTableIndices.length === 0) {
            carriage.isCompleted = true;
          }
          carriage.currentActiveTableIndex = null;

          carriages[key] = carriage;
          saveBookingCarriagesToDisk(carriages);

          ws.send(
            JSON.stringify({
              type: 'booking_submit_ack',
              success: true,
              carriage,
              submittedTable: table,
              remainingCount: carriage.unplayedTableIndices.length,
              isCarriageCompleted: carriage.isCompleted,
              serverTs: Date.now(),
            })
          );

          broadcast({
            type: 'booking_table_updated',
            sceneMode,
            carriageNumber: carriageNum,
            tableIndex: tIdx,
            table,
          });
        }
        return;
      }

      // ==========================================
      // 局内断线快照恢复 (Reconnection State Hydration)
      // ==========================================
      if (msg.type === 'scene_reconnect') {
        const pId = msg.playerId;
        const targetRoomId = msg.roomId;
        let targetRoom: SceneWaitingRoom | undefined;
        if (targetRoomId && sceneWaitingRooms.has(targetRoomId)) {
          targetRoom = sceneWaitingRooms.get(targetRoomId);
        }
        if (!targetRoom && pId) {
          for (const r of sceneWaitingRooms.values()) {
            if (r.players.some((pl) => pl.id === pId || pl.name === msg.playerName)) {
              targetRoom = r;
              break;
            }
          }
        }
        if (targetRoom) {
          const pl = targetRoom.players.find((p) => p.id === pId || p.name === msg.playerName);
          if (pl) {
            delete (pl as any).isDisconnected;
            delete (pl as any).isAutoManaged; // 取消智能托管，恢复真人控制
            (pl as any).socketId = (ws as any).socketId;
            (ws as any).sceneRoomId = targetRoom.id;
            (ws as any).scenePlayerId = pl.id;
            const authRoom = rooms.get(targetRoom.id);
            if (authRoom) {
              const aPl = (authRoom.players || []).find((p: any) => p.id === pl.id || p.name === msg.playerName);
              if (aPl) {
                delete (aPl as any).isDisconnected;
                delete (aPl as any).isAutoManaged;
              }
              if (authRoom.boardState?.autoManagedSeats && typeof pl.seat === 'number') {
                delete authRoom.boardState.autoManagedSeats[pl.seat];
              }
            }
            ws.send(
              JSON.stringify({
                type: 'scene_reconnect_ack',
                room: targetRoom,
                boardState: authRoom ? authRoom.boardState : null,
                players: targetRoom.players,
                deal: (targetRoom as any).deal || (authRoom ? (authRoom as any).deal : null),
                serverTs: Date.now(),
              })
            );
            broadcast({
              type: 'scene_room_update',
              roomId: targetRoom.id,
              gameType: targetRoom.gameType,
              sceneMode: targetRoom.sceneMode,
              players: targetRoom.players,
              maxPlayers: targetRoom.maxPlayers,
              status: targetRoom.status,
            });
            broadcast({
              type: 'game_event',
              roomId: targetRoom.id,
              seat: pl.seat,
              event: {
                action: 'set_auto_host',
                seat: pl.seat,
                absSeat: pl.seat,
                isAutoManaged: false,
                isAutoHost: false,
                isDisconnected: false,
              },
              payload: {
                action: 'set_auto_host',
                seat: pl.seat,
                absSeat: pl.seat,
                isAutoManaged: false,
                isAutoHost: false,
                isDisconnected: false,
              },
              boardState: authRoom ? authRoom.boardState : null,
            });
            return;
          }
        }
        ws.send(
          JSON.stringify({
            type: 'scene_reconnect_ack',
            failed: true,
            reason: 'room_not_found',
          })
        );
        return;
      }

      if (msg.type === 'scene_player_ready' || msg.type === 'room_restart') {
        const targetRoomId = msg.roomId || (ws as any).sceneRoomId;
        const pId = msg.playerId || (ws as any).scenePlayerId;
        let room: SceneWaitingRoom | undefined;
        if (targetRoomId && sceneWaitingRooms.has(targetRoomId)) {
          room = sceneWaitingRooms.get(targetRoomId);
        }
        if (!room && pId) {
          for (const r of sceneWaitingRooms.values()) {
            if (r.players.some((pl) => (pl.id && pId && (pl.id === pId || pl.originalId === pId)) || (pl as any).socketId === (ws as any).socketId)) {
              room = r;
              break;
            }
          }
        }
        if (room) {
          const pl = room.players.find((p) =>
            (p.id && pId && (p.id === pId || p.originalId === pId || p.id.startsWith(pId) || pId.startsWith(p.id))) ||
            ((p as any).socketId && (p as any).socketId === (ws as any).socketId) ||
            (p.name && msg.playerName && p.name === msg.playerName)
          );
          if (pl) {
            (pl as any).isReady = Boolean(msg.isReady ?? true);
          }
          // 自动为机器人/AI 席位标记准备完成
          room.players.forEach((p: any) => {
            if (p.isAi || p.isSimulated || p.isBot || p.id?.startsWith('BOT-') || p.id?.startsWith('sim-')) {
              p.isReady = true;
            }
          });

          const readyCount = room.players.filter((p: any) => p.isReady).length;
          console.log(`🎮 [4人联机准备] 房间 ${room.id} (${room.gameType}) 玩家准备进度: ${readyCount}/${room.maxPlayers}`);

          // 广播准备进度给房内所有客户端，让全员实时更新 (1/4, 2/4, 3/4, 4/4)
          broadcast({
            type: 'scene_room_update',
            roomId: room.id,
            gameType: room.gameType,
            sceneMode: room.sceneMode,
            players: room.players,
            maxPlayers: room.maxPlayers,
            status: room.status,
          });

          // 严禁未全员就绪就开局！只有当所有有效席位均已点击准备 (readyCount >= maxPlayers) 时才切牌开启下一局
          const allReady = room.players.length >= room.maxPlayers && room.players.every((p: any) => p.isReady);
          if (allReady) {
            console.log(`🚀 [全员就绪再开] 房间 ${room.id} (${readyCount}/${room.maxPlayers}) 4人全员准备完成，生成全新发牌切片开启下一局！`);
            room.status = 'waiting';
            delete (room as any).deal;
            startRoomGameIfFull(room);
          }
        }
        return;
      }

      if (msg.type === 'scene_start_game') {
        const roomId = msg.roomId;
        if (roomId && sceneWaitingRooms.has(roomId)) {
          const room = sceneWaitingRooms.get(roomId)!;
          startRoomGameIfFull(room);
        }
        return;
      }

      function startRoomGameIfFull(room: SceneWaitingRoom) {
        if (!room) return false;

        // 1. 若玩家人数不足 maxPlayers，强制保持 waiting 状态，严禁被错误锁定为 playing/starting
        if (!Array.isArray(room.players) || room.players.length < room.maxPlayers) {
          if (room.status !== 'waiting') {
            room.status = 'waiting';
            delete (room as any).deal;
          }
          return false;
        }

        // 2. 防重复开局保护：若房间已处于 starting 或 playing 且已有有效发牌切片，立刻锁定并返回
        if ((room.status === 'starting' || room.status === 'playing') && (room as any).deal && (room as any).deal.seatCards) {
          return true;
        }

        // 3. 深度席位校验与修正：过滤有效玩家，强制按 0..maxPlayers-1 顺序严格重置席位与准备状态
        const validPlayers = room.players.filter((p: any) => p && (p.id || p.name)).slice(0, room.maxPlayers);
        if (validPlayers.length < room.maxPlayers) {
          room.status = 'waiting';
          return false;
        }

        // 满员即开规则：达到人数（烟三/十三水/麻将）全员自动就绪，严禁因准备标志阻塞开局
        validPlayers.forEach((pl: any, idx: number) => {
          pl.seat = idx;
          pl.isReady = true;
          delete (pl as any).isDisconnected;
          delete (pl as any).isAutoManaged;
          if (!pl.id) pl.id = `P-usr-${idx}-${Date.now().toString(36)}`;
          if (!pl.name) pl.name = `茶客 #${idx + 1}`;
        });
        room.players = validPlayers;

        // 4. 强制锁定状态为 starting，防止并发指令冲突
        room.status = 'starting';

        // 5. 强制产生全新发牌切片（零残留）
        delete (room as any).deal;
        const freshDeal = generateRoomDeal(room.gameType, room.sceneMode, room.maxPlayers);
        (room as any).deal = freshDeal;

        const defaultBoard = createDefaultBoardState(room.id, room.gameType);

        if (!rooms.has(room.id)) {
          rooms.set(room.id, {
            id: room.id,
            title: `${room.sceneName} · 纯真人对决`,
            gameType: room.gameType,
            status: 'starting',
            players: room.players.map((pl, idx) => ({ ...pl, seat: idx, rating: pl.rating || 1900 })),
            spectators: 0,
            turnSeat: (freshDeal as any)?.starterSeat ?? 0,
            lastTurnTs: Date.now(),
            moveCount: 0,
            deal: freshDeal,
            modeLabel: `${room.sceneName} · 实时对决`,
            chat: [],
            boardState: defaultBoard,
          });
        } else {
          const existingRoom = rooms.get(room.id);
          if (existingRoom) {
            existingRoom.status = 'starting';
            existingRoom.deal = freshDeal;
            existingRoom.turnSeat = (freshDeal as any)?.starterSeat ?? 0;
            existingRoom.lastTurnTs = Date.now();
            existingRoom.boardState = defaultBoard;
            existingRoom.players = room.players.map((pl, idx) => ({ ...pl, seat: idx, rating: pl.rating || 1900 }));
          }
        }

        console.log(`🚀 [满员自动发牌] 房间 ${room.id} (${room.gameType}-${room.sceneMode}) ${room.players.length}/${room.maxPlayers} 玩家席位校验完毕，广播 scene_room_full 锁定 UI！`);

        // 6. 广播满员进桌事件 (status: starting)，通知所有客户端 UI 平滑切换至竞技场并明确锁定 UI
        broadcast({
          type: 'scene_room_full',
          roomId: room.id,
          gameType: room.gameType,
          sceneMode: room.sceneMode,
          players: room.players,
          maxPlayers: room.maxPlayers,
          deal: freshDeal,
          turnSeat: (freshDeal as any)?.starterSeat ?? 0,
          boardState: defaultBoard,
          status: 'starting',
          lockGameLaunch: true,
          forceReset: true,
          timestamp: Date.now(),
        });

        // 7. 1400ms 后顺畅广播 scene_room_started，正式将状态锁定为 playing
        setTimeout(() => {
          if (room && sceneWaitingRooms.has(room.id)) {
            room.status = 'playing';
            const authRoom = rooms.get(room.id);
            if (authRoom) {
              authRoom.status = 'playing';
              authRoom.lastTurnTs = Date.now();
            }
            broadcast({
              type: 'scene_room_started',
              roomId: room.id,
              gameType: room.gameType,
              sceneMode: room.sceneMode,
              players: room.players,
              maxPlayers: room.maxPlayers,
              deal: freshDeal,
              turnSeat: (freshDeal as any)?.starterSeat ?? 0,
              boardState: authRoom ? authRoom.boardState : defaultBoard,
              status: 'playing',
              lockGameLaunch: true,
              forceReset: true,
              timestamp: Date.now(),
            });

            // 游戏开启后重置真人玩家准备状态，为本局结束后的“继续下一局”做准备
            room.players.forEach((p: any) => {
              if (!p.isAi && !p.isSimulated && !p.isBot && !p.id?.startsWith('BOT-') && !p.id?.startsWith('sim-')) {
                p.isReady = false;
              }
            });
          }
        }, 1400);

        return true;
      }

      if (msg.type === 'scene_fill_bots' || msg.type === 'scene_quick_match') {
        // 核心规则梳理：只有试玩模式是人机补位，真实玩家进入游戏不允许人机补位！
        // 服务端管理的 sceneWaitingRooms 均为纯真人实时排队，严禁注入任何人机/假人席位！
        console.warn(`⛔ [纯真人防假人] 拦截人机补位请求 (${msg.type})，当前房间为真实玩家匹配房间，严禁人机补位！`);
        return;
      }

      if (msg.type === 'scene_join') {
        const gType = msg.gameType || 'yansan';
        const sMode = msg.sceneMode || 'standard';
        const sName = msg.sceneName || '经典场';
        const maxP = Number(msg.maxPlayers) || ((gType === 'shisanshui' && sMode.includes('eight')) ? 8 : 4);
        const p: ScenePlayer = msg.player || {
          id: `P-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: '牌友',
          avatar: '👑',
          rating: 1900,
          coins: 2000,
          seat: 0,
        };

        // Enforce unique player ID if default/generic
        const rawId = p.id;
        if (!p.id || p.id === 'P-me' || p.id === 'P-123') {
          p.id = `P-usr-${(ws as any).socketId || Date.now()}`;
          (p as any).originalId = rawId || 'P-me';
        }
        delete (p as any).isSimulated;
        delete (p as any).isAi;

        // 校验积分门槛，防止零积分或积分不足的玩家入座
        const reqCoins = getSceneRequiredCoins(gType, sMode);
        const currentCoins = typeof p.coins === 'number' && !isNaN(p.coins) ? p.coins : 0;
        if (currentCoins < reqCoins || currentCoins <= 0) {
          ws.send(
            JSON.stringify({
              type: 'scene_join_rejected',
              reason: 'insufficient_coins',
              requiredCoins: reqCoins,
              currentCoins,
              text: `您的积分不足 (${currentCoins}/${reqCoins} 分)，无法入座此分场！`,
            })
          );
          return;
        }

        // 0. 干净清理玩家此前可能沉淀在其他不同场次/房间的旧席位残留
        const currentSocketId = (ws as any).socketId;
        for (const [otherId, otherRoom] of sceneWaitingRooms.entries()) {
          const isPlayerInOther = otherRoom.players.some(
            (pl) => (pl.id && p.id && pl.id === p.id) || (pl as any).socketId === currentSocketId
          );
          if (isPlayerInOther) {
            if (otherRoom.gameType !== gType || otherRoom.sceneMode !== sMode) {
              otherRoom.players = otherRoom.players.filter(
                (pl) => pl.id !== p.id && (pl as any).socketId !== currentSocketId
              );
              if (otherRoom.players.length === 0) {
                sceneWaitingRooms.delete(otherId);
              } else {
                otherRoom.players.forEach((pl, idx) => { pl.seat = idx; });
                if (otherRoom.status === 'waiting') {
                  broadcast({
                    type: 'scene_room_update',
                    roomId: otherRoom.id,
                    gameType: otherRoom.gameType,
                    sceneMode: otherRoom.sceneMode,
                    players: otherRoom.players,
                    maxPlayers: otherRoom.maxPlayers,
                    status: otherRoom.status,
                  });
                }
              }
            }
          }
        }

        // 严格防超载与多房间独立分配逻辑：
        // 1. 若当前连接（同一 socketId）已在某个房间中，继续沿用该房间
        let room: SceneWaitingRoom | undefined;
        for (const r of sceneWaitingRooms.values()) {
          if (r.gameType === gType && r.sceneMode === sMode) {
            const hasSameSocket = r.players.some((pl) => (pl as any).socketId === currentSocketId);
            if (hasSameSocket) {
              room = r;
              break;
            }
          }
        }

        // 2. 若玩家此前掉线断开（相同 playerId 且原 socket 已死），且原房间仍有席位且未开局，才允许认领原房间
        if (!room && p.id) {
          for (const r of sceneWaitingRooms.values()) {
            if (r.gameType === gType && r.sceneMode === sMode && (r.status === 'waiting' || r.status === 'finished')) {
              const matchedPlayer = r.players.find((pl) => pl.id === p.id);
              if (matchedPlayer) {
                let oldSocketAlive = false;
                for (const client of wss.clients) {
                  if ((client as any).socketId === (matchedPlayer as any).socketId && client.readyState === WebSocket.OPEN) {
                    oldSocketAlive = true;
                    break;
                  }
                }
                if (!oldSocketAlive && r.players.length < r.maxPlayers) {
                  room = r;
                  break;
                }
              }
            }
          }
        }

        // 3. 若未在上述房间，寻找仍有空位且正在排队的房间（必须是 status === 'waiting' 且 players.length < maxPlayers）
        // 凡是已经满员 (>= maxPlayers) 或已经处于 playing/starting 游戏中的房间，严禁任何新玩家进入！
        if (!room) {
          for (const r of sceneWaitingRooms.values()) {
            if (r.gameType === gType && r.sceneMode === sMode && r.status === 'waiting' && r.players.length < r.maxPlayers) {
              room = r;
              break;
            }
          }
        }

        // 4. 若无未满员的等候房间，立即为第5个或新玩家另外创建新房间！
        if (!room) {
          const id = `SCENE-${gType}-${sMode}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          room = {
            id,
            gameType: gType,
            sceneMode: sMode,
            sceneName: sName,
            maxPlayers: maxP,
            players: [],
            status: 'waiting',
            createdAt: Date.now(),
          };
          sceneWaitingRooms.set(id, room);
        }

        // 5. 严格多开查重与独立席位分配
        let existingIdx = room.players.findIndex((pl) => (pl as any).socketId === currentSocketId);
        if (existingIdx === -1 && p.id) {
          const sameIdPlayer = room.players.find((pl) => pl.id === p.id);
          if (sameIdPlayer) {
            let oldSocketAlive = false;
            for (const client of wss.clients) {
              if ((client as any).socketId === (sameIdPlayer as any).socketId && client.readyState === WebSocket.OPEN) {
                oldSocketAlive = true;
                break;
              }
            }
            if (oldSocketAlive) {
              // 同一设备多开测试标签页：分配独立测试身份，互不抢占席位
              p.originalId = sameIdPlayer.originalId || sameIdPlayer.id || p.id;
              p.originalName = sameIdPlayer.originalName || sameIdPlayer.name || p.name;
              p.id = `${p.id}_tab_${currentSocketId}`;
              p.name = `${p.name} #${room.players.length + 1}`;
            } else {
              // 旧连接已断开，重新认领该席位
              existingIdx = room.players.indexOf(sameIdPlayer);
            }
          }
        }

        // 6. 核心硬保障：若选中的房间已满员 (>= maxPlayers) 或已开局，且当前玩家不是该房间原有成员，绝对不能加入！
        // 必须为该玩家开辟全新房间等待其他玩家加入！
        if (existingIdx === -1 && (room.players.length >= room.maxPlayers || room.status === 'playing' || room.status === 'starting')) {
          console.log(`🀄 [房间满员硬隔离] 房间 ${room.id} (${room.gameType}) 已有 ${room.players.length}/${room.maxPlayers} 人且在游戏中，为新茶客 ${p.name}(${p.id}) 独立创建新房间等待加入！`);
          const newRoomId = `SCENE-${gType}-${sMode}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          room = {
            id: newRoomId,
            gameType: gType,
            sceneMode: sMode,
            sceneName: sName,
            maxPlayers: maxP,
            players: [],
            status: 'waiting',
            createdAt: Date.now(),
          };
          sceneWaitingRooms.set(newRoomId, room);
          existingIdx = -1;
        }

        if (existingIdx !== -1) {
          room.players[existingIdx] = { ...room.players[existingIdx], ...p, socketId: currentSocketId, isReady: true } as any;
        } else if (room.players.length < room.maxPlayers) {
          p.seat = room.players.length;
          (p as any).socketId = currentSocketId;
          (p as any).isReady = true;
          room.players.push(p);
        } else {
          console.warn(`⚠️ [安全防爆干预] 房间 ${room.id} 无法容纳第 ${room.players.length + 1} 位玩家，严禁注入满员房间！`);
        }

        (ws as any).sceneRoomId = room.id;
        (ws as any).scenePlayerId = p.id;

        presenceTracker.updateClientGame((ws as any).socketId, gType, sMode);
        presenceTracker.recordClient((ws as any).socketId, {
          gameType: gType,
          playerId: p.id,
          playerName: p.name,
          sceneMode: sMode,
        });

        // 关键修复：入座后若达到满员人数（例如4人），先执行开局发牌生成 deal 并广播 scene_room_full，
        // 确保发送给刚入座客户端的 scene_join_ack 已经携带完整的 deal 切片与 starting 状态！
        const isFullStarted = startRoomGameIfFull(room);

        try {
          ws.send(JSON.stringify({
            type: 'scene_join_ack',
            roomId: room.id,
            gameType: room.gameType,
            sceneMode: room.sceneMode,
            player: p,
            assignedPlayerId: p.id,
            assignedSeat: p.seat,
            players: room.players,
            maxPlayers: room.maxPlayers,
            status: room.status,
            deal: (room as any).deal,
          }));
        } catch {}

        broadcast({
          type: 'presence_counts',
          counts: presenceTracker.getRealGamePresence(),
        });
        broadcastTeahousePlayers();

        if (!isFullStarted) {
          room.status = 'waiting';
          delete (room as any).deal;
          broadcast({
            type: 'scene_room_update',
            roomId: room.id,
            gameType: room.gameType,
            sceneMode: room.sceneMode,
            players: room.players,
            maxPlayers: room.maxPlayers,
            status: room.status,
          });
        }

        broadcast({
          type: 'presence_counts',
          counts: presenceTracker.getRealGamePresence(),
        });
        return;
      }

      if (msg.type === 'scene_leave') {
        presenceTracker.updateClientGame((ws as any).socketId, 'lobby');
        const currentSocketId = (ws as any).socketId;
        const leavePlayerId = msg.playerId || (ws as any).scenePlayerId;
        const leavePlayerName = msg.playerName;
        const targetRoomId = msg.roomId || (ws as any).sceneRoomId;

        for (const [id, room] of sceneWaitingRooms.entries()) {
          const isTargetRoom = targetRoomId ? id === targetRoomId : room.players.some((pl) => (pl.id && leavePlayerId && pl.id === leavePlayerId) || pl.name === leavePlayerName || (pl as any).socketId === currentSocketId);

          if (isTargetRoom) {
            room.players = room.players.filter(
              (pl) => pl.id !== leavePlayerId && pl.name !== leavePlayerName && (pl as any).socketId !== currentSocketId
            );

            if (room.players.length === 0) {
              sceneWaitingRooms.delete(id);
              rooms.delete(id);
            } else {
              room.players.forEach((pl, idx) => {
                pl.seat = idx;
              });
              if (room.players.length < room.maxPlayers) {
                room.status = 'waiting';
                delete (room as any).deal;
              }
              const authRoom = rooms.get(id);
              if (authRoom) {
                authRoom.players = room.players.map((pl, idx) => ({ ...pl, seat: idx }));
                authRoom.status = room.status;
                if (room.status === 'waiting') {
                  delete (authRoom as any).deal;
                }
              }
              broadcast({
                type: 'scene_room_update',
                roomId: room.id,
                gameType: room.gameType,
                sceneMode: room.sceneMode,
                players: room.players,
                maxPlayers: room.maxPlayers,
                status: room.status,
              });
            }
          }
        }
        if (msg.roomId && rooms.has(msg.roomId)) {
          const r = rooms.get(msg.roomId);
          if (r) {
            r.players = r.players.filter((pl) => pl.id !== msg.playerId && pl.name !== msg.playerName);
            if (r.players.length === 0) {
              rooms.delete(msg.roomId);
            } else {
              r.status = 'waiting';
              delete (r as any).deal;
            }
          }
        }
        // 清理离开场景的玩家此前所发且无人应战的旧战帖，防止残留刷屏
        for (let i = activeChallenges.length - 1; i >= 0; i--) {
          const ch = activeChallenges[i];
          if ((ch.senderId === msg.playerId || ch.senderName === msg.playerName) && (!msg.sceneMode || ch.sceneMode === msg.sceneMode) && !ch.acceptedBy) {
            const removedId = ch.id;
            activeChallenges.splice(i, 1);
            broadcast({
              type: 'challenge_status_update',
              challengeId: removedId,
              status: 'removed',
              senderId: msg.playerId,
              senderName: msg.playerName,
              gameType: ch.gameType,
              sceneMode: ch.sceneMode,
            });
          }
        }
        broadcast({
          type: 'presence_counts',
          counts: presenceTracker.getRealGamePresence(),
        });
        return;
      }

      if (msg.type === 'scene_chat') {
        const isChallenge = msg.action === 'challenge';
        const targetChannel = isChallenge ? 'hall' : (msg.channel || 'hall');

        if (isChallenge && msg.gameType && msg.sceneMode) {
          const senderId = msg.senderId || 'P-guest';
          const senderName = msg.sender || '牌友';

          // 寻找该玩家之前发过的未转移旧战帖
          const previousUserChallenges = activeChallenges.filter(
            (c) => (c.senderId === senderId || c.senderName === senderName) &&
                   c.status !== 'cancelled' && c.status !== 'removed'
          );

          for (const oldCh of previousUserChallenges) {
            if (oldCh.acceptedBy) {
              // 情况 1：旧战帖已有玩家应战 -> 转移战帖给应战牌友，由其继承守擂！
              const newHost = oldCh.acceptedBy;
              oldCh.senderId = newHost.id;
              oldCh.senderName = newHost.name;
              oldCh.status = 'transferred';
              oldCh.text = `⚔️ 在【${oldCh.sceneName}】由 [${newHost.name}] 继承守擂：“谁来与我一战到底！”`;
              const oldAcceptedHost = { ...newHost };
              oldCh.acceptedBy = undefined; // 重置，以便后续其他牌友加入 newHost 的桌台

              broadcast({
                type: 'challenge_status_update',
                challengeId: oldCh.id,
                status: 'transferred',
                newSenderId: oldAcceptedHost.id,
                newSenderName: oldAcceptedHost.name,
                gameType: oldCh.gameType,
                sceneMode: oldCh.sceneMode,
                sceneName: oldCh.sceneName,
                text: oldCh.text,
              });

              broadcast({
                type: 'scene_chat_broadcast',
                gameType: oldCh.gameType,
                sceneMode: oldCh.sceneMode,
                sceneName: oldCh.sceneName,
                channel: 'hall',
                sender: '🤖 牌楼官播 BOT',
                senderId: 'BOT-SYSTEM',
                avatar: '🤖',
                text: `⚔️【擂台过继】牌友 [${senderName}] 已移步至新场景，原【${oldCh.sceneName}】战帖已顺位过继由 [${oldAcceptedHost.name}] 继承守擂！`,
                action: 'notice',
                timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              });
            } else {
              // 情况 2：旧战帖无玩家应战 -> 直接彻底清理删除该旧战帖，绝不标记覆盖作废，彻底避免刷屏满屏
              const rmIdx = activeChallenges.findIndex((c) => c.id === oldCh.id);
              if (rmIdx !== -1) {
                activeChallenges.splice(rmIdx, 1);
              }

              broadcast({
                type: 'challenge_status_update',
                challengeId: oldCh.id,
                status: 'removed',
                senderId: senderId,
                senderName: senderName,
                gameType: oldCh.gameType,
                sceneMode: oldCh.sceneMode,
              });
            }
          }

          const newCh: ActiveChallengeRecord = {
            id: msg.challengeId || `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            senderId,
            senderName,
            avatar: msg.avatar || '👑',
            gameType: msg.gameType,
            sceneMode: msg.sceneMode,
            sceneName: msg.sceneName || '经典分场',
            text: msg.text ? String(msg.text).slice(0, 200) : '摆下战帖，谁敢来与我一战到底！',
            status: 'open',
            timestamp: msg.timestamp || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            createdAt: Date.now(),
          };
          activeChallenges.unshift(newCh);
          if (activeChallenges.length > 30) activeChallenges.pop();

          msg.challengeId = newCh.id;
        }

        broadcast({
          type: 'scene_chat_broadcast',
          challengeId: msg.challengeId || null,
          gameType: msg.gameType,
          sceneMode: msg.sceneMode,
          sceneName: msg.sceneName || null,
          channel: targetChannel, // 强制将战帖广播至全楼大堂 hall 频道，确保在线所有玩家接收到！
          sender: msg.sender || '牌友',
          senderId: msg.senderId || null,
          avatar: msg.avatar || '👑',
          text: msg.text ? String(msg.text || '').slice(0, 200) : '🎤 [等候室实时语音]',
          voice: Boolean(msg.voice),
          phraseText: msg.phraseText ? String(msg.phraseText).slice(0, 200) : null,
          roleId: msg.roleId || null,
          roleName: msg.roleName || null,
          pitch: typeof msg.pitch === 'number' ? msg.pitch : 1.0,
          rate: typeof msg.rate === 'number' ? msg.rate : 1.0,
          isFemale: Boolean(msg.isFemale),
          audio: msg.audio || null,
          duration: Number(msg.duration) || 0,
          action: msg.action || null,
          targetPlayerId: msg.targetPlayerId || null,
          targetPlayerName: msg.targetPlayerName || null,
          giftAmount: Number(msg.giftAmount) || 0,
          timestamp: msg.timestamp || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          activeChallenges: activeChallenges.slice(0, 10),
        });
        return;
      }

      if (msg.type === 'scene_accept_challenge') {
        const found = activeChallenges.find(
          (c) => c.id === msg.challengeId || (c.senderName === msg.challengerName && c.sceneMode === msg.sceneMode && c.status === 'open')
        );
        if (found) {
          found.status = 'accepted';
          found.acceptedBy = { id: msg.acceptorId || 'guest', name: msg.acceptorName || '热血牌友' };

          broadcast({
            type: 'challenge_status_update',
            challengeId: found.id,
            status: 'accepted',
            acceptedBy: found.acceptedBy,
          });
        }

        if (msg.gameType && msg.sceneMode) {
          presenceTracker.updateClientGame((ws as any).socketId, msg.gameType, msg.sceneMode);
          if (msg.acceptorId) {
            presenceTracker.recordClient((ws as any).socketId, {
              gameType: msg.gameType,
              playerId: msg.acceptorId,
              playerName: msg.acceptorName,
              sceneMode: msg.sceneMode,
            });
          }
          broadcast({
            type: 'presence_counts',
            counts: presenceTracker.getRealGamePresence(),
          });
          broadcastTeahousePlayers();
        }

        // 全服大堂广播应战捷报
        broadcast({
          type: 'scene_chat_broadcast',
          gameType: msg.gameType,
          sceneMode: msg.sceneMode,
          sceneName: msg.sceneName,
          channel: 'hall',
          sender: '🤖 牌楼官播 BOT',
          senderId: 'BOT-SYSTEM',
          avatar: '🤖',
          text: `⚔️【应战捷报】牌友 [${msg.acceptorName || '热血牌友'}] 已成功响应 [${msg.challengerName || '牌友'}] 在【${msg.sceneName || '经典分场'}】的擂台战帖，已切入相同桌台！`,
          action: 'notice',
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          activeChallenges: activeChallenges.slice(0, 10),
        });
        return;
      }

      if (msg.type === 'room_create') {
        const id = `RM-${Math.floor(207 + Math.random() * 800)}`;
        const gType = msg.gameType || 'yansan';
        const newRoom = {
          id,
          title: msg.title || `${msg.playerName || '茗局雅客'}的牌局`,
          gameType: gType,
          status: 'playing',
          players: [{ id: `P-${Date.now()}`, name: msg.playerName || '茗局雅客', rating: 1900, seat: 0 }],
          spectators: 1,
          turnSeat: 0,
          moveCount: 0,
          modeLabel: '实时 WebSocket 牌桌',
          chat: [
            {
              id: `c-${Date.now()}`,
              sender: '系统司仪',
              text: `房间 ${id} 已建立，欢迎各路牌友入席！`,
              timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            },
          ],
          boardState: createDefaultBoardState(id, gType),
        };
        rooms.set(id, newRoom);
        broadcast({ type: 'room_created', room: newRoom, rooms: Array.from(rooms.values()) });
        return;
      }

      if (msg.type === 'room_join') {
        const room = rooms.get(msg.roomId);
        if (room) {
          const playerName = msg.playerName || '牌友';
          const existingPlayer = room.players.find((p: any) => p.name === playerName);
          if (!existingPlayer && room.players.length < 4) {
            room.players.push({
              id: `P-${Date.now()}`,
              name: playerName,
              rating: msg.rating || 1900,
              seat: room.players.length,
            });
          } else {
            room.spectators += 1;
          }
          broadcast({ type: 'room_updated', room, rooms: Array.from(rooms.values()) });
        }
        return;
      }

      if (msg.type === 'room_leave') {
        const room = rooms.get(msg.roomId);
        if (room) {
          room.spectators = Math.max(0, room.spectators - 1);
          broadcast({ type: 'room_updated', room, rooms: Array.from(rooms.values()) });
        }
        return;
      }

      // Authoritative Reconnect Handler
      if (msg.type === 'room_reconnect') {
        const room = rooms.get(msg.roomId);
        if (room) {
          try {
            ws.send(
              JSON.stringify({
                type: 'reconnect_ack',
                room,
                boardState: room.boardState,
                serverTs: Date.now(),
              })
            );
          } catch {}
        }
        return;
      }

      // Authoritative Game Deal Request (客户端主动拉取权威牌组/牌墙)
      if (msg.type === 'request_game_deal') {
        const targetRoomId = msg.roomId;
        let r = (sceneWaitingRooms.get(targetRoomId) as any) || rooms.get(targetRoomId);
        if (r) {
          if (!r.deal) {
            r.deal = generateRoomDeal(r.gameType, r.sceneMode, r.maxPlayers);
          }
          ws.send(JSON.stringify({
            type: 'game_deal',
            roomId: targetRoomId,
            gameType: r.gameType,
            sceneMode: r.sceneMode,
            deal: r.deal,
          }));
        }
        return;
      }

      // Authoritative Room Restart (同桌再战全员准备就绪才洗牌开局)
      if (msg.type === 'room_restart') {
        const targetRoomId = msg.roomId;
        let r = (sceneWaitingRooms.get(targetRoomId) as any) || rooms.get(targetRoomId);
        if (r) {
          const pId = msg.playerId || (ws as any).scenePlayerId;
          const pl = r.players?.find((p: any) => (p.id && pId && p.id === pId) || (p as any).socketId === (ws as any).socketId);
          if (pl) {
            pl.isReady = true;
          }
          broadcast({
            type: 'scene_room_update',
            roomId: r.id,
            gameType: r.gameType,
            sceneMode: r.sceneMode,
            players: r.players,
            maxPlayers: r.maxPlayers,
            status: r.status,
          });
          startRoomGameIfFull(r);
        }
        return;
      }

      // Authoritative Move & Event Processing
      if (msg.type === 'game_move') {
        const targetRoomId = msg.roomId;
        const room = rooms.get(targetRoomId) || (sceneWaitingRooms.get(targetRoomId) as any);
        if (room) {
          room.moveCount = (room.moveCount || 0) + 1;
          const evt = msg.event || {};
          const p = { ...evt, ...(msg.payload || {}) };
          const seat = typeof msg.seat === 'number' ? msg.seat : (typeof evt.seat === 'number' ? evt.seat : (typeof p.seat === 'number' ? p.seat : 0));
          const action = p.action || evt.action || 'play';
          const combo = p.combo || evt.combo || null;

          // Update authoritative board state
          if (!room.boardState) {
            room.boardState = createDefaultBoardState(room.id, room.gameType);
          }
          const bs = room.boardState;

          bs.actionSeq = (bs.actionSeq || 0) + 1;
          bs.moveCount = room.moveCount;
          bs.updatedAt = Date.now();
          room.lastTurnTs = Date.now();

          if (p.multiplier) bs.multiplier = Number(p.multiplier);
          if (p.nextTurn !== undefined) {
            bs.turnSeat = Number(p.nextTurn);
            room.turnSeat = bs.turnSeat;
          }
          if (combo) {
            bs.lastCombo = combo;
            if (!bs.discardsHistory) bs.discardsHistory = [];
            bs.discardsHistory.push(combo);
            if (bs.discardsHistory.length > 100) {
              bs.discardsHistory = bs.discardsHistory.slice(-100);
            }
          }
          if (p.handsCount && Array.isArray(p.handsCount)) {
            bs.handsCount = p.handsCount;
          } else if (seat < bs.handsCount.length && p.cardsCount) {
            bs.handsCount[seat] = Math.max(0, bs.handsCount[seat] - Number(p.cardsCount));
          } else if (combo?.cards?.length && seat < bs.handsCount.length) {
            bs.handsCount[seat] = Math.max(0, bs.handsCount[seat] - combo.cards.length);
          }

          if (room.gameType === 'mahjong') {
            if (!bs.extraState) bs.extraState = {};
            if (!bs.extraState.mahjongDiscards) bs.extraState.mahjongDiscards = [];
            if (!bs.extraState.mahjongMelds) bs.extraState.mahjongMelds = [[], [], [], []];
            if (bs.extraState.wallRemaining === undefined) {
              bs.extraState.wallRemaining = (room as any).deal?.remainingWall?.length ?? 83;
            }

            const tile = p.tile || evt.tile;
            if (action === 'discard') {
              if (tile) {
                const discTile = { ...tile, discardBy: seat };
                bs.extraState.mahjongDiscards.push(discTile);
                bs.extraState.lastDiscarded = discTile;
                if (!bs.discardsHistory) bs.discardsHistory = [];
                bs.discardsHistory.push({ type: 'mahjong_discard', rank: tile.value || 0, cards: [discTile], seat });

                // Keep authoritative deal.seatCards in sync
                if ((room as any).deal?.seatCards?.[seat]) {
                  const sCards = (room as any).deal.seatCards[seat];
                  const fIdx = sCards.findIndex((c: any) => c.id === tile.id || (c.type === tile.type && c.value === tile.value));
                  if (fIdx >= 0) sCards.splice(fIdx, 1);
                  else if (sCards.length > 0) sCards.pop();
                }
              }
              if (bs.handsCount && bs.handsCount[seat] > 0) {
                bs.handsCount[seat] = Math.max(0, bs.handsCount[seat] - 1);
              }
              if (p.nextTurn !== undefined) {
                bs.turnSeat = Number(p.nextTurn);
                room.turnSeat = bs.turnSeat;
              } else {
                bs.turnSeat = (seat + 1) % 4;
                room.turnSeat = bs.turnSeat;
              }
            } else if (action === 'draw') {
              if (bs.extraState.wallRemaining > 0) {
                bs.extraState.wallRemaining--;
              }
              if ((room as any).deal?.remainingWall?.length > 0) {
                const drawn = (room as any).deal.remainingWall.shift();
                if (drawn && (room as any).deal.seatCards?.[seat]) {
                  (room as any).deal.seatCards[seat].push(p.tile || drawn);
                }
              }
              bs.turnSeat = seat;
              room.turnSeat = bs.turnSeat;
              if (bs.handsCount) {
                bs.handsCount[seat] = (bs.handsCount[seat] || 13) + 1;
              }
            } else if (action === 'peng') {
              if (bs.extraState.mahjongDiscards.length > 0) {
                const lastIdx = bs.extraState.mahjongDiscards.length - 1;
                if (!tile || bs.extraState.mahjongDiscards[lastIdx].id === tile.id) {
                  bs.extraState.mahjongDiscards.pop();
                } else {
                  const fIdx = bs.extraState.mahjongDiscards.findIndex((d: any) => d.id === tile.id);
                  if (fIdx >= 0) bs.extraState.mahjongDiscards.splice(fIdx, 1);
                }
              }
              if (!bs.extraState.mahjongMelds[seat]) bs.extraState.mahjongMelds[seat] = [];
              bs.extraState.mahjongMelds[seat].push({ type: 'peng', tile, seat });
              bs.extraState.lastDiscarded = null;
              bs.turnSeat = seat;
              room.turnSeat = bs.turnSeat;
              if (bs.handsCount && bs.handsCount[seat] >= 2) {
                bs.handsCount[seat] -= 2;
              }
              if ((room as any).deal?.seatCards?.[seat]) {
                const sCards = (room as any).deal.seatCards[seat];
                let removed = 0;
                for (let i = sCards.length - 1; i >= 0 && removed < 2; i--) {
                  if (tile && sCards[i].type === tile.type && sCards[i].value === tile.value) {
                    sCards.splice(i, 1);
                    removed++;
                  }
                }
                while (removed < 2 && sCards.length > 0) {
                  sCards.pop();
                  removed++;
                }
              }
            } else if (action === 'gang') {
              if (p.isMingGang && bs.extraState.mahjongDiscards.length > 0) {
                const fIdx = bs.extraState.mahjongDiscards.findIndex((d: any) => tile && d.id === tile.id);
                if (fIdx >= 0) bs.extraState.mahjongDiscards.splice(fIdx, 1);
              }
              if (!bs.extraState.mahjongMelds[seat]) bs.extraState.mahjongMelds[seat] = [];
              bs.extraState.mahjongMelds[seat].push({ type: 'gang', tile, seat, gangType: p.gangType || 'ming' });
              if (bs.extraState.wallRemaining > 0) bs.extraState.wallRemaining--;
              if ((room as any).deal?.remainingWall?.length > 0) {
                const supp = (room as any).deal.remainingWall.shift();
                if (supp && (room as any).deal.seatCards?.[seat]) {
                  (room as any).deal.seatCards[seat].push(supp);
                }
              }
              bs.turnSeat = seat;
              room.turnSeat = bs.turnSeat;
            } else if (action === 'pass') {
              if (p.nextTurn !== undefined) {
                bs.turnSeat = Number(p.nextTurn);
                room.turnSeat = bs.turnSeat;
              }
            } else if (action === 'hu') {
              executeMahjongWinSettlement(room, seat, Boolean(p.isFourHz), p);
            }
          }

          if (action === 'set_auto_host') {
            const isAuto = Boolean(p.isAutoManaged ?? p.isAutoHost);
            if (room.players && room.players[seat]) {
              room.players[seat].isAutoManaged = isAuto;
            }
            const sRoom = sceneWaitingRooms.get(room.id);
            if (sRoom && sRoom.players && sRoom.players[seat]) {
              sRoom.players[seat].isAutoManaged = isAuto;
            }
            if (!bs.autoManagedSeats) bs.autoManagedSeats = {};
            bs.autoManagedSeats[seat] = isAuto;
            if (isAuto && room.turnSeat === seat) {
              room.lastTurnTs = Date.now() - 2000;
            }
            broadcast({
              type: 'game_event',
              roomId: room.id,
              seat,
              event: { action: 'set_auto_host', seat, absSeat: seat, isAutoManaged: isAuto, isAutoHost: isAuto },
              payload: { action: 'set_auto_host', seat, absSeat: seat, isAutoManaged: isAuto, isAutoHost: isAuto },
              boardState: bs,
            });
            return;
          }

          if (room.gameType === 'yansan') {
            if (!bs.extraState) bs.extraState = {};
            if (!bs.extraState.playedCardsHistory) bs.extraState.playedCardsHistory = [];
            if (!bs.finishedSeats) bs.finishedSeats = [];
            if (p.finishedSeats && Array.isArray(p.finishedSeats)) {
              bs.finishedSeats = [...p.finishedSeats];
            } else if (bs.handsCount && bs.handsCount[seat] === 0 && !bs.finishedSeats.includes(seat)) {
              bs.finishedSeats.push(seat);
            }
            if (action === 'play') {
              if (combo?.cards) {
                bs.extraState.playedCardsHistory.push(...combo.cards);
              }
              bs.extraState.consecutivePasses = 0;
            } else if (action === 'pass') {
              bs.extraState.consecutivePasses = (bs.extraState.consecutivePasses || 0) + 1;
              if (bs.extraState.consecutivePasses >= 3) {
                bs.lastCombo = null;
              }
            }
            if (p.nextTurn !== undefined) {
              bs.turnSeat = Number(p.nextTurn);
              room.turnSeat = bs.turnSeat;
            } else if (action !== 'finish') {
              const totalSeats = bs.handsCount?.length || 4;
              const finished = bs.finishedSeats || [];
              let nextSeat = (seat - 1 + totalSeats) % totalSeats;
              let guard = 0;
              while (finished.includes(nextSeat) && guard < totalSeats) {
                nextSeat = (nextSeat - 1 + totalSeats) % totalSeats;
                guard++;
              }
              bs.turnSeat = nextSeat;
              room.turnSeat = nextSeat;
            }
          }

          if (action === 'shisanshui_submit_hand') {
            if (!bs.shisanshuiSubmissions) {
              bs.shisanshuiSubmissions = {};
            }
            bs.shisanshuiSubmissions[seat] = {
              seat,
              tiers: p.tiers,
              rawTiers: p.rawTiers,
              isSpecial: p.isSpecial,
              submittedAt: Date.now(),
            };
            const submittedCount = Object.keys(bs.shisanshuiSubmissions).length;
            const targetCount = room.players?.length || (room.sceneMode?.includes('eight') ? 8 : 4);

            broadcast({
              type: 'game_event',
              roomId: room.id,
              seat,
              event: {
                action: 'shisanshui_submit_hand',
                seat,
                submittedCount,
                targetCount,
                rawTiers: p.rawTiers,
                tiers: p.tiers,
                isSpecial: p.isSpecial,
              },
              payload: {
                action: 'shisanshui_submit_hand',
                seat,
                submittedCount,
                targetCount,
                rawTiers: p.rawTiers,
                tiers: p.tiers,
                isSpecial: p.isSpecial,
              },
              boardState: bs,
            });

            if (submittedCount >= targetCount) {
              broadcast({
                type: 'game_event',
                roomId: room.id,
                event: {
                  action: 'shisanshui_all_submitted',
                  submissions: bs.shisanshuiSubmissions,
                },
                payload: {
                  action: 'shisanshui_all_submitted',
                  submissions: bs.shisanshuiSubmissions,
                },
                boardState: bs,
              });
            }
            return;
          }

          if (p.action === 'finish' || (p.winner !== undefined && p.winner !== null)) {
            bs.winnerSeat = p.winner !== undefined && p.winner !== null ? Number(p.winner) : null;
            bs.phase = 'ended';
            if (p.finishedSeats && Array.isArray(p.finishedSeats)) {
              bs.finishedSeats = [...p.finishedSeats];
            }
            if (p.allianceScoreResult) {
              bs.allianceScoreResult = p.allianceScoreResult;
              bs.settlement = p.allianceScoreResult;
            }

            const targetSceneRoom = sceneWaitingRooms.get(room.id);
            if (targetSceneRoom) {
              targetSceneRoom.status = 'finished';
              targetSceneRoom.players.forEach((pl) => {
                (pl as any).isReady = false;
              });

              const disconnectedList = targetSceneRoom.players.filter((pl) => (pl as any).isDisconnected);
              if (disconnectedList.length > 0) {
                console.log(`🧹 [局末席位清理] 该局游戏已结算完成，自动移出 ${disconnectedList.length} 位未重连的托管玩家`);
                targetSceneRoom.players = targetSceneRoom.players.filter((pl) => !(pl as any).isDisconnected);
                targetSceneRoom.players.forEach((pl, idx) => {
                  pl.seat = idx;
                  (pl as any).isReady = false;
                });
                targetSceneRoom.status = 'waiting';
              }

              broadcast({
                type: 'scene_room_update',
                roomId: targetSceneRoom.id,
                gameType: targetSceneRoom.gameType,
                sceneMode: targetSceneRoom.sceneMode,
                players: targetSceneRoom.players,
                maxPlayers: targetSceneRoom.maxPlayers,
                status: targetSceneRoom.status,
              });
            }
          }

          const resolvedNextTurn = p.nextTurn !== undefined ? p.nextTurn : bs.turnSeat;
          broadcast({
            type: 'game_event',
            roomId: room.id,
            seat,
            event: {
              action,
              seat,
              combo,
              nextTurn: resolvedNextTurn,
              winner: bs.winnerSeat ?? p.winner,
              finishedSeats: bs.finishedSeats || p.finishedSeats,
              allianceScoreResult: bs.allianceScoreResult || p.allianceScoreResult,
              ...p,
            },
            payload: {
              action,
              seat,
              combo,
              nextTurn: resolvedNextTurn,
              winner: bs.winnerSeat ?? p.winner,
              finishedSeats: bs.finishedSeats || p.finishedSeats,
              allianceScoreResult: bs.allianceScoreResult || p.allianceScoreResult,
              ...p,
            },
            moveCount: room.moveCount,
            boardState: bs,
          });
        }
        return;
      }

      if (msg.type === 'game_chat' || msg.type === 'room_voice') {
        const targetRoomId = msg.roomId || 'RM-202';
        const room = rooms.get(targetRoomId);
        if (msg.text || msg.audio) {
          const chatMsg = {
            id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sender: msg.sender || '牌友',
            senderId: msg.senderId || null,
            avatar: msg.avatar || '👤',
            text: msg.text ? String(msg.text).slice(0, 100) : (msg.audio ? '🎤 [牌桌实时语音]' : ''),
            prop: msg.prop || null,
            targetSeat: msg.targetSeat !== undefined ? msg.targetSeat : null,
            voice: Boolean(msg.voice),
            audio: msg.audio || null,
            duration: Number(msg.duration) || 0,
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          };
          if (room) {
            room.chat = [...room.chat.slice(-49), chatMsg];
          }
          broadcast({ type: 'chat_broadcast', roomId: targetRoomId, message: chatMsg });
        }
        return;
      }
    } catch {}
  });
});

// Periodic WebSocket zombie client heartbeat sweep (terminates stalled half-open TCP connections)
setInterval(() => {
  const now = Date.now();
  for (const client of wss.clients) {
    const wsAny = client as any;
    if (wsAny.lastHeartbeat && now - wsAny.lastHeartbeat > 60000) {
      client.terminate();
    } else {
      wsAny.isAlive = false;
      try {
        client.ping();
      } catch {}
    }
  }
}, 25000);

// Authoritative AFK Watchdog: fast 1.2s timeout for auto-managed players, 15s for active players
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.status === 'playing' && room.boardState && room.boardState.phase === 'playing') {
      // 1. 十三张/十三水：比水前超时保障 (60秒未全员开牌比水则自动保底交牌比水)
      if (room.gameType === 'shisanshui') {
        if (room.lastTurnTs && now - room.lastTurnTs > 60000) {
          room.lastTurnTs = now;
          const bs = room.boardState;
          if (!bs.shisanshuiSubmissions) bs.shisanshuiSubmissions = {};
          const totalSeats = room.sceneMode?.includes('eight') ? 8 : 4;
          for (let s = 0; s < totalSeats; s++) {
            if (!bs.shisanshuiSubmissions[s]) {
              bs.shisanshuiSubmissions[s] = {
                seat: s,
                autoSubmitted: true,
                submittedAt: now,
              };
            }
          }
          broadcast({
            type: 'game_event',
            roomId: room.id,
            event: {
              action: 'shisanshui_all_submitted',
              submissions: bs.shisanshuiSubmissions,
              timeout: true,
            },
            payload: {
              action: 'shisanshui_all_submitted',
              submissions: bs.shisanshuiSubmissions,
              timeout: true,
            },
            boardState: bs,
          });
        }
        continue;
      }

      // 2. 烟三与麻将超时轮转中枢
      const currentSeat = room.turnSeat || 0;
      const curPlayer = room.players?.find((p: any) => p.seat === currentSeat);
      const isPlayerAuto = Boolean(
        curPlayer?.isAutoManaged ||
        curPlayer?.isDisconnected ||
        (room.boardState?.autoManagedSeats && room.boardState.autoManagedSeats[currentSeat])
      );
      // 关键优化：已托管或断线玩家仅需 1200ms 快速出牌；未托管真人玩家给足 60000ms 思考时间
      const timeoutThreshold = isPlayerAuto ? 1200 : 60000;

      if (room.lastTurnTs && now - room.lastTurnTs > timeoutThreshold) {
        room.lastTurnTs = now;

        // 首次超时，自动为玩家打上托管标签，确保后续每一轮都进入 1.2s 快速出牌节奏，绝不卡顿等待
        if (!isPlayerAuto) {
          if (curPlayer) curPlayer.isAutoManaged = true;
          if (!room.boardState.autoManagedSeats) room.boardState.autoManagedSeats = {};
          room.boardState.autoManagedSeats[currentSeat] = true;
          broadcast({
            type: 'game_event',
            roomId: room.id,
            seat: currentSeat,
            event: { action: 'set_auto_host', seat: currentSeat, absSeat: currentSeat, isAutoManaged: true, isAutoHost: true },
            payload: { action: 'set_auto_host', seat: currentSeat, absSeat: currentSeat, isAutoManaged: true, isAutoHost: true },
            boardState: room.boardState,
          });
        }

        // 3. 麻将超时与断线托管出牌逻辑 (以真实牌墙与手牌全自动推演完成该局)
        if (room.gameType === 'mahjong') {
          let deal = (room as any).deal;
          const isHongzhongMode = room.sceneMode?.includes('hongzhong') ?? true;

          if (!deal || !deal.seatCards) {
            deal = generateRoomDeal(room.gameType, room.sceneMode, 4);
            (room as any).deal = deal;
          }

          if (!deal.seatCards[currentSeat]) {
            deal.seatCards[currentSeat] = [];
          }

          const hand: any[] = deal.seatCards[currentSeat];
          const wall: any[] = deal.remainingWall || [];
          const melds = room.boardState.extraState?.mahjongMelds?.[currentSeat] || [];

          // 步骤 1: 判断是否需要先摸牌 (当手牌为 13 张、10 张、7 张、4 张等 3k+1 时需要先摸牌)
          const totalTiles = hand.length + melds.length * 3;
          if (totalTiles % 3 === 1) {
            // 牌墙已空，判定荒庄 / 流局
            if (wall.length === 0) {
              room.boardState.phase = 'ended';
              room.boardState.isDraw = true;
              broadcast({
                type: 'game_event',
                roomId: room.id,
                seat: currentSeat,
                event: {
                  action: 'draw_stalemate',
                  isDraw: true,
                  reason: 'wall_exhausted',
                  msg: '牌墙已摸空，荒牌流局！',
                },
                payload: {
                  action: 'draw_stalemate',
                  isDraw: true,
                  reason: 'wall_exhausted',
                  msg: '牌墙已摸空，荒牌流局！',
                },
                boardState: room.boardState,
              });
              continue;
            }

            // 从牌墙摸一张牌
            const drawnTile = wall.shift()!;
            hand.push(drawnTile);
            if (!room.boardState.extraState) room.boardState.extraState = {};
            room.boardState.extraState.wallRemaining = wall.length;
            if (room.boardState.handsCount) room.boardState.handsCount[currentSeat] = hand.length;

            broadcast({
              type: 'game_event',
              roomId: room.id,
              seat: currentSeat,
              event: {
                action: 'draw',
                seat: currentSeat,
                absSeat: currentSeat,
                tile: drawnTile,
                wallRemaining: wall.length,
                autoDraw: true,
              },
              payload: {
                action: 'draw',
                seat: currentSeat,
                absSeat: currentSeat,
                tile: drawnTile,
                wallRemaining: wall.length,
                autoDraw: true,
              },
              boardState: room.boardState,
            });

            // 摸牌后检查是否胡牌 (四红中直接天胡 或 自摸和牌)
            const redDragonCount = isHongzhongMode
              ? hand.filter((t: any) => t.type === 'zi' && (t.value === 5 || t.text === '红中' || t.isRedDragon)).length
              : 0;
            const isFourHz = redDragonCount >= 4;
            const winRes = checkMahjongWin(hand as any, isHongzhongMode);

            if (isFourHz || winRes.win) {
              executeMahjongWinSettlement(room, currentSeat, isFourHz, { tile: drawnTile });
              continue;
            }
          }

          // 步骤 2: 智能优选出牌 (绝不出红中鬼牌，优先打出孤张、无连贯字牌或单张)
          let discardIdx = 0;
          const nonHzTiles = isHongzhongMode
            ? hand.map((t, idx) => ({ t, idx })).filter((item) => !(item.t.type === 'zi' && (item.t.value === 5 || item.t.text === '红中' || item.t.isRedDragon)))
            : hand.map((t, idx) => ({ t, idx }));

          if (nonHzTiles.length > 0) {
            // 优先查找孤张字牌 (东/南/西/北/发/白 仅有1张的牌)
            const ziSingles = nonHzTiles.filter((item) => {
              if (item.t.type !== 'zi') return false;
              return hand.filter((x) => x.type === 'zi' && x.value === item.t.value).length === 1;
            });
            if (ziSingles.length > 0) {
              discardIdx = ziSingles[0].idx;
            } else {
              // 查找数牌中与其他牌完全不搭（相差 >= 3 且无同值牌）的孤张
              const isolatedNum = nonHzTiles.filter((item) => {
                if (item.t.type === 'zi') return false;
                const hasSame = hand.filter((x) => x.type === item.t.type && x.value === item.t.value).length > 1;
                const hasNeighbour = hand.some((x) => x.type === item.t.type && Math.abs(x.value - item.t.value) <= 2 && x.id !== item.t.id);
                return !hasSame && !hasNeighbour;
              });
              if (isolatedNum.length > 0) {
                discardIdx = isolatedNum[0].idx;
              } else {
                discardIdx = nonHzTiles[nonHzTiles.length - 1].idx;
              }
            }
          }

          const [discardedTile] = hand.splice(discardIdx >= 0 && discardIdx < hand.length ? discardIdx : Math.max(0, hand.length - 1), 1);
          const nextSeat = (currentSeat + 1) % 4;
          room.turnSeat = nextSeat;
          room.boardState.turnSeat = nextSeat;
          room.boardState.updatedAt = now;
          room.moveCount = (room.moveCount || 0) + 1;
          room.boardState.moveCount = room.moveCount;
          room.lastTurnTs = now;

          if (!room.boardState.extraState) room.boardState.extraState = {};
          if (!room.boardState.extraState.mahjongDiscards) room.boardState.extraState.mahjongDiscards = [];

          const discTile = { ...discardedTile, discardBy: currentSeat };
          room.boardState.extraState.mahjongDiscards.push(discTile);
          room.boardState.extraState.lastDiscarded = discTile;

          if (room.boardState.handsCount) {
            room.boardState.handsCount[currentSeat] = hand.length;
          }

          broadcast({
            type: 'game_event',
            roomId: room.id,
            seat: currentSeat,
            event: {
              action: 'discard',
              seat: currentSeat,
              absSeat: currentSeat,
              tile: discTile,
              autoDiscard: true,
              nextTurn: nextSeat,
              reason: 'trustee_auto_discard',
            },
            payload: {
              action: 'discard',
              seat: currentSeat,
              absSeat: currentSeat,
              tile: discTile,
              autoDiscard: true,
              nextTurn: nextSeat,
              reason: 'trustee_auto_discard',
            },
            moveCount: room.moveCount,
            boardState: room.boardState,
          });
          continue;
        }

        // 4. 烟三超时出牌逻辑：逆时针严格旋转 (currentSeat - 1 + totalSeats) % totalSeats
        const totalSeats = room.boardState.handsCount?.length || 4;
        const nextSeat = (currentSeat - 1 + totalSeats) % totalSeats;
        room.turnSeat = nextSeat;
        room.boardState.turnSeat = nextSeat;
        room.boardState.updatedAt = now;

        const isYansanFirstMove = room.gameType === 'yansan' && (room.moveCount === 0 || !room.boardState.lastCombo);
        const isYansanLeadTurn = room.gameType === 'yansan' && (!room.boardState.lastCombo || room.boardState.lastCombo.seat === currentSeat);

        if (isYansanFirstMove || isYansanLeadTurn) {
          room.moveCount = (room.moveCount || 0) + 1;
          room.boardState.moveCount = room.moveCount;
          room.boardState.actionSeq = (room.boardState.actionSeq || 0) + 1;
          const isAbsoluteFirst = isYansanFirstMove && (room.moveCount === 1);
          const fallbackCombo = {
            type: 'single',
            rank: isAbsoluteFirst ? 4 : 5,
            suitVal: 1,
            cards: [{ id: isAbsoluteFirst ? 'd-4' : 'c-5', rank: isAbsoluteFirst ? 4 : 5, suitVal: 1, label: isAbsoluteFirst ? '4' : '5', suit: isAbsoluteFirst ? '♦' : '♣', isRed: isAbsoluteFirst }],
            label: isAbsoluteFirst ? '单张 ♦4' : '托管领出单牌',
            primaryRank: isAbsoluteFirst ? 4 : 5,
            primarySuitVal: 1,
            seat: currentSeat,
          };
          room.boardState.lastCombo = fallbackCombo;
          if (room.boardState.handsCount && room.boardState.handsCount[currentSeat] > 0) {
            room.boardState.handsCount[currentSeat] = Math.max(0, room.boardState.handsCount[currentSeat] - 1);
          }
          broadcast({
            type: 'game_event',
            roomId: room.id,
            seat: currentSeat,
            event: {
              action: 'play',
              seat: currentSeat,
              autoPlay: true,
              combo: fallbackCombo,
              cardsCount: 1,
              nextTurn: nextSeat,
              reason: isAbsoluteFirst ? 'timeout_first_move_diamond4' : 'timeout_lead_single',
            },
            payload: {
              action: 'play',
              seat: currentSeat,
              autoPlay: true,
              combo: fallbackCombo,
              cardsCount: 1,
              nextTurn: nextSeat,
              reason: isAbsoluteFirst ? 'timeout_first_move_diamond4' : 'timeout_lead_single',
            },
            moveCount: room.moveCount,
            boardState: room.boardState,
          });
        } else {
          broadcast({
            type: 'game_event',
            roomId: room.id,
            seat: currentSeat,
            event: {
              action: 'pass',
              seat: currentSeat,
              autoPass: true,
              nextTurn: nextSeat,
              reason: 'timeout_pass',
            },
            payload: {
              action: 'pass',
              seat: currentSeat,
              autoPass: true,
              nextTurn: nextSeat,
              reason: 'timeout_pass',
            },
            moveCount: room.moveCount,
            boardState: room.boardState,
          });
        }
      }
    }
  }
}, 1000);

// Periodic room garbage collection: clean stale user-created rooms and empty scene waiting rooms older than 1 hour
setInterval(() => {
  const now = Date.now();
  const defaultRoomIds = new Set(['RM-202', 'RM-204', 'RM-205']);
  for (const [id, room] of rooms.entries()) {
    if (!defaultRoomIds.has(id) && room.createdAt && now - room.createdAt > 3600000 && (room.spectators <= 1 || (!room.players || room.players.length === 0))) {
      rooms.delete(id);
    }
  }
  for (const [id, sRoom] of sceneWaitingRooms.entries()) {
    if (sRoom.createdAt && now - sRoom.createdAt > 3600000 && (!sRoom.players || sRoom.players.length === 0)) {
      sceneWaitingRooms.delete(id);
    }
  }
}, 600000);

// Unified API Route Dispatcher
app.use(async (req, res, next) => {
  if (req.url && req.url.startsWith('/api/')) {
    try {
      const handled = await handleApiRoute(req, res, broadcast);
      if (handled) return;
    } catch (err) {
      console.error('[API Error]', err);
      return res.status(500).json({ error: String(err) });
    }
  }
  next();
});

// Explicit APK Direct Download Route (Ensures correct MIME, attachment filename & CORS headers)
app.get(['/chess-game-release.apk', '/app-latest.apk', '/*.apk'], (req, res, next) => {
  const reqPath = req.path;
  const fileName = path.basename(reqPath) || 'chess-game-release.apk';
  const candidates = [
    path.join(__dirname, 'dist', fileName),
    path.join(__dirname, 'dist', 'chess-game-release.apk'),
    path.join(__dirname, 'apk', fileName),
    path.join(__dirname, 'apk', 'chess-game-release.apk'),
    path.join(__dirname, 'public', fileName),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const st = fs.statSync(c);
        if (st.size >= 4200000) {
          res.writeHead(200, {
            'Content-Type': 'application/vnd.android.package-archive',
            'Content-Length': st.size,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Disposition',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          });
          return fs.createReadStream(c).pipe(res);
        }
      } catch {}
    }
  }
  next();
});

// Static file serving or automated Vite dev middleware fallback
const distHtml = path.join(__dirname, 'dist', 'index.html');

if (fs.existsSync(distHtml)) {
  // Production mode: high-performance static caching headers for SVG assets
  app.use(
    express.static(path.join(__dirname, 'dist'), {
      maxAge: '1y',
      immutable: true,
    })
  );
  app.get('*', (_req, res) => {
    res.sendFile(distHtml);
  });
} else {
  // Guidance fallback when dist has not been cloned or built
  console.warn('⚠️ [Server] 未在项目根目录检测到 dist/index.html 生产静态资源。');
  console.warn('💡 [提示] 请确保已将包含 dist 文件夹的仓库完整推送并在 Termux 中 pull。');

  app.get('*', (_req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>国粹棋牌 · 提示</title>
        <style>
          body { background: #12100E; color: #F5EFE6; font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
          .box { background: #1C1815; border: 1px solid #D97706; border-radius: 20px; padding: 28px; max-width: 520px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
          h2 { color: #FBBF24; margin-top: 0; }
          p { font-size: 14px; line-height: 1.6; color: #D6C7B2; }
          code { background: #26201B; padding: 4px 10px; border-radius: 6px; color: #34D399; font-family: monospace; font-size: 14px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>⚠️ 尚未检测到前端 dist 静态包</h2>
          <p>若在手机 Termux 环境运行，推荐使用 <code>bash termux_install_ubuntu.sh</code> 在 Ubuntu 容器中执行 <code>npm run build</code>；或从 GitHub Releases 下载最新的 <code>dist.tar.gz</code> 解压即可畅玩！</p>
        </div>
      </body>
      </html>
    `);
  });
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌【端口冲突】端口 ${PORT} 已被后台旧服务占用！`);
    console.error('👉 解决办法：在 Termux 终端执行以下命令释放端口后再启动：');
    console.error('   pkill -9 -f "node|tsx|server"\n');
    process.exit(1);
  } else {
    console.error('[Server Error]', err);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  // 自动调度 Telegram Bot (根据 .env 的 URL 配置智能选择 Webhook 或轮询启动)
  initTelegramBotService(broadcast).catch((err) => {
    console.error('⚠️ [Telegram Bot Init Error]', err);
  });
});
