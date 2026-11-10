/**
 * 经典国标麻将 (Mahjong) 独立发牌与牌墙生成逻辑
 * 权威 136 张麻将牌墙，庄家抓 14 张，三家闲家各 13 张，牌墙余 83 张
 */
import { MahjongServerTile, MahjongRoomDeal } from './types.ts';

export const MAHJONG_TYPES: Array<'wan' | 'tiao' | 'tong'> = ['wan', 'tiao', 'tong'];
export const MAHJONG_NUM_NAMES = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const MAHJONG_TYPE_NAMES: Record<string, string> = { wan: '万', tiao: '条', tong: '筒' };
export const MAHJONG_ZI_NAMES = ['', '东风', '南风', '西风', '北风', '红中', '发财', '白板'];

export function createMahjongDeal(sceneMode: string, customDealerSeat?: number): MahjongRoomDeal {
  const dealId = `mj-deal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const pool: MahjongServerTile[] = [];

  // 1. 万、条、筒 各 1..9 (各4张 = 108张)
  for (const t of MAHJONG_TYPES) {
    for (let v = 1; v <= 9; v++) {
      for (let k = 0; k < 4; k++) {
        pool.push({
          id: `${t}-${v}-${k}`,
          type: t,
          value: v,
          text: `${MAHJONG_NUM_NAMES[v]}${MAHJONG_TYPE_NAMES[t]}`,
        });
      }
    }
  }

  // 2. 字牌 1..7 (东、南、西、北、中、发、白，各4张 = 28张)
  for (let v = 1; v <= 7; v++) {
    for (let k = 0; k < 4; k++) {
      pool.push({
        id: `zi-${v}-${k}`,
        type: 'zi',
        value: v,
        text: MAHJONG_ZI_NAMES[v],
        isRedDragon: v === 5,
      });
    }
  }

  // 108 + 28 = 136 张标准国标麻将牌
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // 庄家掷双色子定开门与抓牌 (d1: 1..6, d2: 1..6)
  const d1 = Math.floor(1 + Math.random() * 6);
  const d2 = Math.floor(1 + Math.random() * 6);
  const dealerSeat = typeof customDealerSeat === 'number' ? customDealerSeat : 0;

  // 庄家抓 14 张，其余 3 席各抓 13 张 (共 53 张)
  const seatCards: Record<number, MahjongServerTile[]> = {};
  if (dealerSeat === 0) {
    seatCards[0] = pool.slice(0, 14);
    seatCards[1] = pool.slice(14, 27);
    seatCards[2] = pool.slice(27, 40);
    seatCards[3] = pool.slice(40, 53);
  } else if (dealerSeat === 1) {
    seatCards[0] = pool.slice(0, 13);
    seatCards[1] = pool.slice(13, 27);
    seatCards[2] = pool.slice(27, 40);
    seatCards[3] = pool.slice(40, 53);
  } else if (dealerSeat === 2) {
    seatCards[0] = pool.slice(0, 13);
    seatCards[1] = pool.slice(13, 26);
    seatCards[2] = pool.slice(26, 40);
    seatCards[3] = pool.slice(40, 53);
  } else {
    seatCards[0] = pool.slice(0, 13);
    seatCards[1] = pool.slice(13, 26);
    seatCards[2] = pool.slice(26, 39);
    seatCards[3] = pool.slice(39, 53);
  }

  const remainingWall = pool.slice(53); // 136 - 53 = 83 张

  return {
    gameType: 'mahjong',
    sceneMode,
    dealId,
    dealerSeat,
    dice: { d1, d2, sum: d1 + d2 },
    seatCards,
    remainingWall,
    wallCount: remainingWall.length,
    createdAt: Date.now(),
  };
}
