/**
 * 经典烟三 (Yansan) 独立发牌与牌库逻辑
 * 权威 52 张单副扑克 (无大小王)，四位玩家各分 13 张，♦4首出，♠3与♠A暗盟
 */
import { YansanServerCard, YansanRoomDeal } from './types.ts';
import { getYansanRankWeight, getYansanCardPower } from './rules.ts';

export { getYansanRankWeight, getYansanCardPower };

export const YANSAN_SUITS: { suit: '♠' | '♥' | '♣' | '♦'; suitVal: number; isRed: boolean }[] = [
  { suit: '♠', suitVal: 4, isRed: false },
  { suit: '♥', suitVal: 3, isRed: true },
  { suit: '♣', suitVal: 2, isRed: false },
  { suit: '♦', suitVal: 1, isRed: true },
];

export const YANSAN_RANKS = [
  { rank: 3, label: '3' }, { rank: 4, label: '4' }, { rank: 5, label: '5' },
  { rank: 6, label: '6' }, { rank: 7, label: '7' }, { rank: 8, label: '8' },
  { rank: 9, label: '9' }, { rank: 10, label: '10' }, { rank: 11, label: 'J' },
  { rank: 12, label: 'Q' }, { rank: 13, label: 'K' }, { rank: 14, label: 'A' },
  { rank: 15, label: '2' },
];

export function sortYansanCards(cards: YansanServerCard[]): YansanServerCard[] {
  return [...cards].sort((a, b) => getYansanCardPower(b as any) - getYansanCardPower(a as any));
}

/**
 * 权威生成烟三发牌
 */
export function createYansanDeal(): YansanRoomDeal {
  const dealId = `ys-deal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const pool: YansanServerCard[] = [];

  for (const r of YANSAN_RANKS) {
    for (const s of YANSAN_SUITS) {
      pool.push({
        id: `${r.label}-${s.suit}`,
        rank: r.rank,
        suitVal: s.suitVal,
        label: r.label,
        suit: s.suit,
        isRed: s.isRed,
      });
    }
  }

  // Fisher-Yates 洗牌
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // 四席各分13张牌，严格保证出自同一副牌，零重复
  const seatCards: Record<number, YansanServerCard[]> = {
    0: sortYansanCards(pool.slice(0, 13)),
    1: sortYansanCards(pool.slice(13, 26)),
    2: sortYansanCards(pool.slice(26, 39)),
    3: sortYansanCards(pool.slice(39, 52)),
  };

  let starterSeat = 0;
  let spade3Seat = -1;
  let spadeASeat = -1;

  for (let s = 0; s < 4; s++) {
    const h = seatCards[s];
    if (h.some((c) => c.rank === 4 && c.suit === '♦')) {
      starterSeat = s;
    }
    if (h.some((c) => c.rank === 3 && c.suit === '♠')) {
      spade3Seat = s;
    }
    if (h.some((c) => c.rank === 14 && c.suit === '♠')) {
      spadeASeat = s;
    }
  }

  return {
    gameType: 'yansan',
    dealId,
    deck: pool,
    seatCards,
    starterSeat,
    spade3Seat: spade3Seat >= 0 ? spade3Seat : undefined,
    spadeASeat: spadeASeat >= 0 ? spadeASeat : undefined,
    createdAt: Date.now(),
  };
}
