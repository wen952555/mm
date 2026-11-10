/**
 * 经典国标麻将 (Mahjong) 独立数据结构与类型定义
 */

export type MahjongSceneMode =
  | 'hongzhong-6'
  | 'hongzhong-10'
  | 'standard-10'
  | 'standard-6'
  | 'mahjong-10-20'
  | 'mahjong-20-40';

export interface MahjongServerTile {
  id: string;
  type: 'wan' | 'tiao' | 'tong' | 'zi';
  value: number; // 1..9 for wan/tiao/tong, 1..7 for zi (1=东,2=南,3=西,4=北,5=中,6=发,7=白)
  text: string;
  color?: string;
  isRedDragon?: boolean;
}

export interface MahjongRoomDeal {
  gameType: 'mahjong';
  sceneMode: string;
  dealId: string;
  dealerSeat: number; // 庄家席位 (0..3)
  dice: { d1: number; d2: number; sum: number };
  seatCards: Record<number, MahjongServerTile[]>;
  remainingWall: MahjongServerTile[];
  wallCount: number;
  createdAt: number;
}

export interface MahjongMovePayload {
  winner?: number | null;
  seat?: number;
  isRemote?: boolean;
  skipWs?: boolean;
  rewardCoins?: number;
  payoutPerOpponent?: number;
  detail?: string;
  detailText?: string;
  tile?: any;
  action?: string;
  pointsDelta?: number;
}

export interface MahjongSettlementResult {
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
