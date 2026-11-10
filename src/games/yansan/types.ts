/**
 * 经典烟三 (Yansan) 独立数据结构与类型定义
 */

export type YansanSceneMode = 'yansan-5-10' | 'yansan-10-20' | 'yansan-20-40';

export interface YansanServerCard {
  id: string;
  rank: number; // 3..15 (15=2, 14=A, 13=K... 3=3)
  suitVal: number; // 4=♠, 3=♥, 2=♣, 1=♦
  label: string;
  suit: '♠' | '♥' | '♣' | '♦';
  isRed: boolean;
}

export interface YansanRoomDeal {
  gameType: 'yansan';
  dealId: string;
  deck: YansanServerCard[];
  seatCards: Record<number, YansanServerCard[]>;
  starterSeat: number; // 持有方块4首出的席位 (0..3)
  spade3Seat?: number; // 持有黑桃3的席位 (0..3)
  spadeASeat?: number; // 持有黑桃A的席位 (0..3)
  createdAt: number;
}

export interface YansanCardDTO {
  id: string;
  rank: number;
  suit: string;
  label: string;
  isRed: boolean;
}

export interface YansanComboDTO {
  type: string;
  rank: number;
  cards: YansanCardDTO[];
  seat: number;
  length?: number;
}

export interface YansanAllianceScoreResult {
  winnerAlliance?: string;
  summary?: string;
  scores?: Record<number, number>;
  seatScores?: number[];
  isTie?: boolean;
  detailText?: string;
}

export interface YansanMovePayload {
  winner?: number | null;
  seat?: number;
  isRemote?: boolean;
  skipWs?: boolean;
  pointsDelta?: number;
  detailText?: string;
  combo?: any;
  allianceScoreResult?: YansanAllianceScoreResult;
  cards?: any[];
}

export interface YansanSettlementResult {
  isWin: boolean;
  isTie: boolean;
  scorePoints: number;
  coinsDelta: number;
  ratingDelta: number;
  detailText: string;
  replayData: {
    summary: string;
    alliances: string;
    rounds: Array<{
      step: number;
      seatName: string;
      action: string;
      cards?: string[];
      tag: string;
    }>;
  };
}
