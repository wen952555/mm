/**
 * 权威对局发牌与牌墙生成总分发调度器 (Deal Service Dispatcher)
 * 分别委派给烟三、十三水、麻将三大游戏的独立发牌与牌库模块
 */
import { createYansanDeal } from '../yansan/deck.ts';
import { createShisanshuiDeal } from '../shisanshui/deck.ts';
import { createMahjongDeal } from '../mahjong/deck.ts';
import { AnyRoomDeal } from './types.ts';

export function generateRoomDeal(gameType: string, sceneMode: string, _maxPlayers?: number): AnyRoomDeal {
  if (gameType === 'mahjong') {
    return createMahjongDeal(sceneMode);
  }
  if (gameType === 'shisanshui') {
    return createShisanshuiDeal(sceneMode);
  }
  // 默认经典烟三
  return createYansanDeal();
}
