import { generateRoomDeal } from '../gameDeckService.ts';
import { createDefaultBoardState, getSceneRequiredCoins, type AuthoritativeBoardState } from '../gameLogic/index.ts';

export type { AuthoritativeBoardState };
export { createDefaultBoardState, getSceneRequiredCoins };

export interface ScenePlayer {
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
}

export interface SceneWaitingRoom {
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

export class RoomManager {
  public sceneWaitingRooms = new Map<string, SceneWaitingRoom>();
  public rooms = new Map<string, any>();

  constructor() {
    this.initDefaultRooms();
  }

  private initDefaultRooms() {
    this.rooms.set('RM-202', {
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
    });

    this.rooms.set('RM-204', {
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
    });

    this.rooms.set('RM-205', {
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
    });
  }

  public startRoomGameIfFull(room: SceneWaitingRoom, broadcastFn: (payload: any) => void): boolean {
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

    if (Array.isArray(room.players) && room.players.length >= room.maxPlayers) {
      // 3. 深度席位校验与修正：过滤有效玩家，强制按 0..maxPlayers-1 顺序严格重置席位与准备状态
      const validPlayers = room.players.filter((p: any) => p && (p.id || p.name)).slice(0, room.maxPlayers);
      if (validPlayers.length < room.maxPlayers) {
        room.status = 'waiting';
        return false;
      }

      validPlayers.forEach((pl: any, idx: number) => {
        pl.seat = idx;
        pl.isReady = true;
        delete pl.isDisconnected;
        delete pl.isAutoManaged;
        if (!pl.id) pl.id = `P-usr-${idx}-${Date.now().toString(36)}`;
        if (!pl.name) pl.name = `茶客 #${idx + 1}`;
      });
      room.players = validPlayers;

      // 3. 强制锁定状态为 starting，防止并发指令冲突
      room.status = 'starting';

      // 4. 强制产生全新发牌切片（零残留）
      delete room.deal;
      const freshDeal = generateRoomDeal(room.gameType, room.sceneMode, room.maxPlayers);
      room.deal = freshDeal;

      const defaultBoard = createDefaultBoardState(room.id, room.gameType);

      if (!this.rooms.has(room.id)) {
        this.rooms.set(room.id, {
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
        const existingRoom = this.rooms.get(room.id);
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

      // 5. 广播满员进桌事件 (status: starting)，通知所有客户端 UI 平滑切换至竞技场并明确锁定 UI
      broadcastFn({
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

      // 6. 250ms 后顺畅广播 scene_room_started，正式将状态锁定为 playing
      setTimeout(() => {
        if (room && this.sceneWaitingRooms.has(room.id)) {
          room.status = 'playing';
          const authRoom = this.rooms.get(room.id);
          if (authRoom) {
            authRoom.status = 'playing';
            authRoom.lastTurnTs = Date.now();
          }
          broadcastFn({
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
        }
      }, 250);

      return true;
    }
    return false;
  }
}

export const globalRoomManager = new RoomManager();
