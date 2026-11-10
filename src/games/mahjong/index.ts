/**
 * 经典国标麻将 (Mahjong) 独立游戏逻辑统一出口
 */
export {
  type MahjongServerTile,
  type MahjongRoomDeal,
  type MahjongMovePayload,
  type MahjongSettlementResult,
} from './types.ts';
export * from './deck.ts';
export * from './rules.ts';
export * from './scenes.ts';
export * from './settlement.ts';
export * from './audioMap.ts';
