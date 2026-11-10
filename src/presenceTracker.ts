// Authoritative Real-Time Presence & Player Counting Engine
// Tracks genuine connected players across the 3 game sections:
// - 经典烟三 (烟三风云台)
// - 十三张 (深海幻蓝台)
// - 经典麻将 (幻彩紫晶池)

export type GameType = 'yansan' | 'shisanshui' | 'mahjong';

export interface ClientPresenceInfo {
  socketId: string;
  gameType: GameType | 'lobby' | null;
  playerId?: string;
  playerName?: string;
  avatar?: string;
  coins?: number;
  rating?: number;
  phone?: string;
  sceneMode?: string;
  lastSeen: number;
}

export interface TeahousePlayerItem {
  id: string;
  name: string;
  avatar: string;
  coins: number;
  rating: number;
  level: number;
  phone?: string;
  isAdmin?: boolean;
  isOnline: boolean;
  gameType: GameType | 'lobby' | null;
  sceneMode?: string;
  lastSeen?: number;
}

export interface RealPresenceCounts {
  yansan: number;
  shisanshui: number;
  mahjong: number;
  totalOnline: number;
}

class PresenceTracker {
  private clients = new Map<string, ClientPresenceInfo>();
  private sceneWaitingRoomsRef: Map<string, any> | null = null;
  private roomsRef: Map<string, any> | null = null;
  private wssRef: any = null;

  public setReferences(refs: {
    sceneWaitingRooms?: Map<string, any>;
    rooms?: Map<string, any>;
    wss?: any;
  }) {
    if (refs.sceneWaitingRooms) this.sceneWaitingRoomsRef = refs.sceneWaitingRooms;
    if (refs.rooms) this.roomsRef = refs.rooms;
    if (refs.wss) this.wssRef = refs.wss;
  }

  public recordClient(
    socketId: string,
    info?: {
      gameType?: string | null;
      playerId?: string;
      playerName?: string;
      avatar?: string;
      coins?: number;
      rating?: number;
      phone?: string;
      sceneMode?: string;
    }
  ) {
    const existing = this.clients.get(socketId) || {
      socketId,
      gameType: 'lobby',
      lastSeen: Date.now(),
    };

    if (info) {
      if (info.gameType !== undefined) {
        existing.gameType = (info.gameType as any) || 'lobby';
      }
      if (info.playerId) existing.playerId = info.playerId;
      if (info.playerName) existing.playerName = info.playerName;
      if (info.avatar) existing.avatar = info.avatar;
      if (typeof info.coins === 'number') existing.coins = info.coins;
      if (typeof info.rating === 'number') existing.rating = info.rating;
      if (info.phone) existing.phone = info.phone;
      if (info.sceneMode !== undefined) existing.sceneMode = info.sceneMode;
    }

    existing.lastSeen = Date.now();
    this.clients.set(socketId, existing);
  }

  public removeClient(socketId: string) {
    this.clients.delete(socketId);
  }

  public updateClientGame(
    socketId: string,
    gameType: GameType | 'lobby' | null,
    sceneMode?: string
  ) {
    const item = this.clients.get(socketId);
    if (item) {
      item.gameType = gameType;
      if (sceneMode !== undefined) item.sceneMode = sceneMode;
      item.lastSeen = Date.now();
    } else {
      this.clients.set(socketId, {
        socketId,
        gameType,
        sceneMode,
        lastSeen: Date.now(),
      });
    }
  }

  public getAllPlayers(dbProfiles: Record<string, any> = {}): TeahousePlayerItem[] {
    const list: TeahousePlayerItem[] = [];
    const now = Date.now();
    const seenIds = new Set<string>();

    // Map of active sockets keyed by playerId, playerName, or phone
    const activeSocketMap = new Map<string, ClientPresenceInfo>();
    for (const client of this.clients.values()) {
      if (client.playerId) activeSocketMap.set(client.playerId, client);
      if (client.playerName) activeSocketMap.set(client.playerName, client);
      if (client.phone) activeSocketMap.set(client.phone, client);
    }

    // 1. Process all registered profiles from database
    for (const [id, prof] of Object.entries(dbProfiles)) {
      if (!prof || prof.isBanned) continue;
      // Filter out test usernames
      if (prof.name === '测试茶客' || prof.username === 'admin') continue;

      const pId = prof.id || id;
      seenIds.add(pId);
      if (prof.phone) seenIds.add(String(prof.phone).replace(/\D/g, ''));

      const activeSock = activeSocketMap.get(pId) ||
        (prof.phone ? activeSocketMap.get(prof.phone) : undefined) ||
        (prof.name ? activeSocketMap.get(prof.name) : undefined);
      // 仅当用户拥有当前活跃的 WebSocket 连线且在心跳超时阈值内时，才判定为真正在线
      const isOnline = Boolean(activeSock && (now - (activeSock.lastSeen || 0) < 300000));

      list.push({
        id: pId,
        name: prof.name || `茶客${prof.phone ? String(prof.phone).slice(-4) : '9999'}`,
        avatar: prof.avatar || '👑',
        coins: typeof prof.coins === 'number' ? prof.coins : 0,
        rating: prof.rating || 1800,
        level: prof.level || 1,
        phone: prof.phone ? `${String(prof.phone).slice(0, 3)}****${String(prof.phone).slice(-4)}` : undefined,
        isAdmin: !!prof.isAdmin,
        isOnline: isOnline,
        gameType: activeSock ? activeSock.gameType : 'lobby',
        sceneMode: activeSock ? (activeSock.sceneMode || 'hall') : 'hall',
        lastSeen: activeSock?.lastSeen || prof.updatedAt || prof.registeredAt || 0,
      });
    }

    // 2. Process connected clients that might not yet be in dbProfiles
    for (const client of this.clients.values()) {
      // 忽略未发送身份或未登录的匿名 WebSocket 临时连线，防止产生无手机号、默认2000积分的匿名“在线牌友”幽灵条目
      if (!client.playerId && !client.playerName && !client.phone) {
        continue;
      }
      const cId = client.playerId || `sock-${client.socketId}`;
      const cName = client.playerName || '在线牌友';
      if (!seenIds.has(cId) && !seenIds.has(cName)) {
        seenIds.add(cId);
        if (cName) seenIds.add(cName);
        list.push({
          id: cId,
          name: cName,
          avatar: client.avatar || '👑',
          coins: typeof client.coins === 'number' ? client.coins : 2000,
          rating: client.rating || 1800,
          level: 1,
          phone: client.phone ? `${String(client.phone).slice(0, 3)}****${String(client.phone).slice(-4)}` : undefined,
          isOnline: true,
          gameType: client.gameType || 'lobby',
          sceneMode: client.sceneMode || 'hall',
          lastSeen: client.lastSeen || now,
        });
      }
    }

    // Sort: Online players first, then by coins descending, then by lastSeen
    list.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }
      if (b.coins !== a.coins) {
        return b.coins - a.coins;
      }
      return (b.lastSeen || 0) - (a.lastSeen || 0);
    });

    return list;
  }

  public getRealGamePresence(): RealPresenceCounts {
    const counts: RealPresenceCounts = {
      yansan: 0,
      shisanshui: 0,
      mahjong: 0,
      totalOnline: 0,
    };

    // Calculate total online
    if (this.wssRef && this.wssRef.clients) {
      counts.totalOnline = this.wssRef.clients.size;
    } else {
      counts.totalOnline = this.clients.size;
    }

    // Accumulate distinct real players for each game section
    const targetGames: GameType[] = ['yansan', 'shisanshui', 'mahjong'];

    for (const gt of targetGames) {
      const distinctUsers = new Set<string>();

      // 1. Sockets currently located in this game
      for (const [sId, c] of this.clients.entries()) {
        if (c.gameType === gt) {
          const userKey = c.playerId || c.playerName || `sock-${sId}`;
          distinctUsers.add(userKey);
        }
      }

      // 2. Active Scene Waiting Rooms for this game
      if (this.sceneWaitingRoomsRef) {
        for (const room of this.sceneWaitingRoomsRef.values()) {
          if (room && room.gameType === gt && Array.isArray(room.players)) {
            for (const p of room.players) {
              if (p && !p.isSimulated) {
                const userKey = p.id || p.name;
                if (userKey) distinctUsers.add(userKey);
              }
            }
          }
        }
      }

      // 3. Active Playing Game Rooms for this game (excluding default static demo rooms)
      if (this.roomsRef) {
        for (const room of this.roomsRef.values()) {
          // Exclude default placeholder demo rooms RM-202, RM-204, RM-205 from counting
          if (room.id === 'RM-202' || room.id === 'RM-204' || room.id === 'RM-205') {
            continue;
          }
          if (room && room.gameType === gt && Array.isArray(room.players)) {
            for (const p of room.players) {
              if (p && !p.isSimulated && p.id && !p.id.startsWith('P-sim-')) {
                const userKey = p.id || p.name;
                if (userKey) distinctUsers.add(userKey);
              }
            }
          }
        }
      }

      counts[gt] = distinctUsers.size;
    }

    return counts;
  }
}

export const presenceTracker = new PresenceTracker();
