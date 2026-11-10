/**
 * 水镜十三水 / 十三张 (Shisanshui) 独立数据结构与类型定义
 */

export type ShisanshuiSceneMode =
  | 'four-realtime'
  | 'eight-realtime'
  | 'four-booking'
  | 'eight-booking'
  | 'shisanshui-10-20'
  | 'shisanshui-20-40';

export interface SSSServerCard {
  id: string;
  rank: number; // 2..14 (14=A)
  suitVal: number; // 4=♠, 3=♥, 2=♣, 1=♦
  label: string;
  suit: '♠' | '♥' | '♣' | '♦';
  isRed: boolean;
}

export interface ShisanshuiRoomDeal {
  gameType: 'shisanshui';
  sceneMode: string;
  dealId: string;
  deckCount: number;
  deck: SSSServerCard[];
  seatCards: Record<number, SSSServerCard[]>;
  createdAt: number;
}

export interface ServerBookingTable {
  tableIndex: number;
  tableName: string;
  isSubmitted: boolean;
  playerSeat: string;
  playerId?: string;
  playerName?: string;
  playerHand?: {
    front: any[];
    mid: any[];
    back: any[];
    frontLabel: string;
    midLabel: string;
    backLabel: string;
    specialHand?: any;
  };
  submittedAt?: number;
  status: 'waiting' | 'submitted';
  seatCards: Record<string, any[]>;
  tableDeckSeed: string;
}

export interface ServerBookingCarriage {
  carriageNumber: number;
  sceneMode: 'four-booking' | 'eight-booking';
  createdAt: number;
  selectedSeat: string | null;
  unplayedTableIndices: number[];
  currentActiveTableIndex: number | null;
  isCompleted: boolean;
  tables: ServerBookingTable[];
}

export interface ShisanshuiMovePayload {
  winner?: number | null;
  seat?: number;
  isRemote?: boolean;
  skipWs?: boolean;
  score?: number;
  detailText?: string;
  hand?: any;
  pointsDelta?: number;
}

export interface ShisanshuiSettlementResult {
  isWin: boolean;
  isTie: boolean;
  scorePoints: number;
  coinsDelta: number;
  ratingDelta: number;
  detailText: string;
  replayData: {
    summary: string;
    rounds: Array<{
      step: number;
      seatName: string;
      action: string;
      tag: string;
    }>;
  };
}
