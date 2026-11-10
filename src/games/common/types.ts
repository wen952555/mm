/**
 * 三大国粹通用定义与数据契约
 */
import type { YansanRoomDeal, YansanSettlementResult } from '../yansan/types.ts';
import type { ShisanshuiRoomDeal, ShisanshuiSettlementResult } from '../shisanshui/types.ts';
import type { MahjongRoomDeal, MahjongSettlementResult } from '../mahjong/types.ts';
import type { AuthoritativeBoardState } from '../../engine/gameStateTypes.ts';

export type GameType = 'yansan' | 'shisanshui' | 'mahjong';

export type AnyRoomDeal = YansanRoomDeal | ShisanshuiRoomDeal | MahjongRoomDeal;

export type GameSettlementResult = YansanSettlementResult | ShisanshuiSettlementResult | MahjongSettlementResult;

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
  originalName?: string;
}

export interface GameModuleInfo {
  id: GameType;
  name: string;
  icon: string;
  tagline: string;
  badgeText: string;
  badgeClass: string;
  featurePills: string[];
  tableFelt: string;
  tableName: string;
  tableRule: string;
  tableIcon: string;
  onlinePlayers: number;
  baseStake: number;
  cardBg: string;
  cardBorder: string;
  iconBoxBg: string;
  iconBoxBorder: string;
  accentColor: string;
  glowColor: string;
  buttonClass: string;
}

export type { AuthoritativeBoardState };
