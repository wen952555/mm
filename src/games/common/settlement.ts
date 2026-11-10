/**
 * 对局结算与复盘推演总调度器 (Settlement Dispatcher)
 * 委派给烟三、十三水、麻将独立的结算计算与结构化牌谱生成模块
 */
import { resolveYansanMoveSettlement } from '../yansan/settlement.ts';
import { calculateShisanshuiSettlement } from '../shisanshui/settlement.ts';
import { calculateMahjongSettlement } from '../mahjong/settlement.ts';
import { GameType, GameSettlementResult } from './types.ts';

export function calculateGameSettlement(gameType: GameType, payload: any): GameSettlementResult {
  if (gameType === 'yansan') {
    return resolveYansanMoveSettlement(payload);
  }
  if (gameType === 'shisanshui') {
    return calculateShisanshuiSettlement(payload);
  }
  return calculateMahjongSettlement(payload);
}
