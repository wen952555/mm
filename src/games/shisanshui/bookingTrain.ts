/**
 * 水镜十三水 / 十三张 (Shisanshui) 预约专列车厢推演引擎
 */
import { ServerBookingCarriage, ServerBookingTable } from './types.ts';

export * from '../../engine/shisanshuiBookingTrain.ts';

const BOOKING_SUITS = [
  { suit: '♠', isRed: false },
  { suit: '♥', isRed: true },
  { suit: '♣', isRed: false },
  { suit: '♦', isRed: true },
];

const BOOKING_RANKS = [
  { rank: 2, label: '2' }, { rank: 3, label: '3' }, { rank: 4, label: '4' },
  { rank: 5, label: '5' }, { rank: 6, label: '6' }, { rank: 7, label: '7' },
  { rank: 8, label: '8' }, { rank: 9, label: '9' }, { rank: 10, label: '10' },
  { rank: 11, label: 'J' }, { rank: 12, label: 'Q' }, { rank: 13, label: 'K' },
  { rank: 14, label: 'A' },
];

export function generateServerShuffledDeck(deckCount: number, seedStr: string): any[] {
  const pool: any[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const r of BOOKING_RANKS) {
      for (const s of BOOKING_SUITS) {
        pool.push({
          id: `${r.label}-${s.suit}-${d}-${seedStr}`,
          rank: r.rank,
          suit: s.suit,
          label: r.label,
          isRed: s.isRed,
        });
      }
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/**
 * 为车厢生成包含10张牌桌的预发牌数组（每席13张手牌分配）与初始状态
 */
export function initServerCarriageTables(
  carriageNumber: number,
  sceneMode: 'four-booking' | 'eight-booking'
): ServerBookingCarriage {
  const isEight = sceneMode === 'eight-booking';
  const seats = isEight
    ? ['东', '东南', '南', '西南', '西', '西北', '北', '东北']
    : ['东', '南', '西', '北'];
  const deckCount = isEight ? 2 : 1;

  const tables: ServerBookingTable[] = [];
  for (let i = 1; i <= 10; i++) {
    const seedStr = `car${carriageNumber}-t${i}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const deck = generateServerShuffledDeck(deckCount, seedStr);
    const seatCards: Record<string, any[]> = {};
    seats.forEach((seat, idx) => {
      seatCards[seat] = deck.slice(idx * 13, (idx + 1) * 13);
    });

    tables.push({
      tableIndex: i,
      tableName: `第 ${i} 桌`,
      isSubmitted: false,
      playerSeat: '',
      status: 'waiting',
      seatCards,
      tableDeckSeed: seedStr,
    });
  }

  return {
    carriageNumber,
    sceneMode,
    createdAt: Date.now(),
    selectedSeat: null,
    unplayedTableIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    currentActiveTableIndex: null,
    isCompleted: false,
    tables,
  };
}
