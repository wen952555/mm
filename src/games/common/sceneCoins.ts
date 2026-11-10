/**
 * 场景准入底分总分发调度器 (Scene Coins Dispatcher)
 * 分别委派给烟三、十三水、麻将三大游戏的独立场景规则模块
 */
import { getYansanRequiredCoins } from '../yansan/scenes.ts';
import { getShisanshuiRequiredCoins } from '../shisanshui/scenes.ts';
import { getMahjongRequiredCoins } from '../mahjong/scenes.ts';

export function getSceneRequiredCoins(gType: string, sMode: string): number {
  if (gType === 'yansan') {
    return getYansanRequiredCoins(sMode);
  }
  if (gType === 'shisanshui') {
    return getShisanshuiRequiredCoins(sMode);
  }
  if (gType === 'mahjong') {
    return getMahjongRequiredCoins(sMode);
  }
  return 100;
}
