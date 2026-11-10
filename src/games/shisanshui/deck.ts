/**
 * 水镜十三水 / 十三张 (Shisanshui) 独立发牌与牌库逻辑
 * 4人场标准 52 张单副扑克各 13 张；8人场两副扑克 104 张全发各 13 张
 */
import { SSSServerCard, ShisanshuiRoomDeal } from './types.ts';

export const SSS_SUITS: { suit: '♠' | '♥' | '♣' | '♦'; suitVal: number; isRed: boolean }[] = [
  { suit: '♠', suitVal: 4, isRed: false },
  { suit: '♥', suitVal: 3, isRed: true },
  { suit: '♣', suitVal: 2, isRed: false },
  { suit: '♦', suitVal: 1, isRed: true },
];

export const SSS_RANKS = [
  { rank: 2, label: '2' }, { rank: 3, label: '3' }, { rank: 4, label: '4' },
  { rank: 5, label: '5' }, { rank: 6, label: '6' }, { rank: 7, label: '7' },
  { rank: 8, label: '8' }, { rank: 9, label: '9' }, { rank: 10, label: '10' },
  { rank: 11, label: 'J' }, { rank: 12, label: 'Q' }, { rank: 13, label: 'K' },
  { rank: 14, label: 'A' },
];

export function createShisanshuiDeal(sceneMode: string): ShisanshuiRoomDeal {
  const isEight = sceneMode === 'eight-realtime' || sceneMode === 'eight-booking';
  const deckCount = isEight ? 2 : 1;
  const playerCount = isEight ? 8 : 4;
  const dealId = `sss-deal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const pool: SSSServerCard[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const r of SSS_RANKS) {
      for (const s of SSS_SUITS) {
        pool.push({
          id: `${r.label}-${s.suit}-${d}`,
          rank: r.rank,
          suitVal: s.suitVal,
          label: r.label,
          suit: s.suit,
          isRed: s.isRed,
        });
      }
    }
  }

  // Fisher-Yates 洗牌
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const seatCards: Record<number, SSSServerCard[]> = {};
  for (let p = 0; p < playerCount; p++) {
    const hand = pool.slice(p * 13, (p + 1) * 13);
    hand.sort((a, b) => b.rank - a.rank || b.suitVal - a.suitVal);
    seatCards[p] = hand;
  }

  return {
    gameType: 'shisanshui',
    sceneMode,
    dealId,
    deckCount,
    deck: pool,
    seatCards,
    createdAt: Date.now(),
  };
}
