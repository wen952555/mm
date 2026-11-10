/**
 * Authoritative Server Game Deck & Wall Dealing Service
 * 
 * 架构已全部拆分至独立游戏文件：
 * 1. 经典烟三 (Yansan): src/games/yansan/deck.ts
 * 2. 水镜十三水 (Shisanshui): src/games/shisanshui/deck.ts
 * 3. 经典国标麻将 (Mahjong): src/games/mahjong/deck.ts
 * 4. 统一调度中心 (Common): src/games/common/dealService.ts
 */

export {
  type YansanServerCard,
  type YansanRoomDeal,
  createYansanDeal,
} from './games/yansan/index.ts';

export {
  type SSSServerCard,
  type ShisanshuiRoomDeal,
  createShisanshuiDeal,
} from './games/shisanshui/index.ts';

export {
  type MahjongServerTile,
  type MahjongRoomDeal,
  createMahjongDeal,
} from './games/mahjong/index.ts';

export {
  type AnyRoomDeal,
  generateRoomDeal,
} from './games/common/index.ts';
