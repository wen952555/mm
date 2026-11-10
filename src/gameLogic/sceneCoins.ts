/**
 * Scene Required Coins Admission Logic
 * 准入分逻辑已分别拆分至三大游戏独立模块：
 * • Yansan: src/games/yansan/scenes.ts
 * • Shisanshui: src/games/shisanshui/scenes.ts
 * • Mahjong: src/games/mahjong/scenes.ts
 */
export { getSceneRequiredCoins } from '../games/common/sceneCoins.ts';
export { getYansanRequiredCoins, getYansanSceneTag } from '../games/yansan/scenes.ts';
export { getShisanshuiRequiredCoins, getShisanshuiSceneTag, isEightPlayerMode } from '../games/shisanshui/scenes.ts';
export { getMahjongRequiredCoins, getMahjongSceneTag } from '../games/mahjong/scenes.ts';
