/**
 * 三大经典国粹棋牌 (烟三、十三水、国标麻将) 独立模块根入口
 * 
 * 目录设计规范：
 * • src/games/yansan/       - 经典烟三独立逻辑 (牌库、发牌、场景配置、牌型规则、结算推演、语音音效)
 * • src/games/shisanshui/   - 水镜十三水独立逻辑 (单/双副发牌、预约专列车厢推演、场景配置、理牌防倒水、结算、语音)
 * • src/games/mahjong/      - 经典国标麻将独立逻辑 (136张牌墙、定庄掷骰、红中/国标规则、场景配置、番种结算、语音)
 * • src/games/common/       - 通用调度适配层 (权威面板状态、准入调度、发牌调度、结算调度、模块卡片配置)
 */

export * as YansanGame from './yansan/index.ts';
export * as ShisanshuiGame from './shisanshui/index.ts';
export * as MahjongGame from './mahjong/index.ts';

// 导出所有拆分后的独立功能
export * from './yansan/index.ts';
export * from './shisanshui/index.ts';
export * from './mahjong/index.ts';
export * from './common/index.ts';
