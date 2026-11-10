/**
 * 三大国粹棋牌展示与界面样式元数据配置
 */
import { GameModuleInfo, GameType } from './types.ts';

export const GAME_MODULES: GameModuleInfo[] = [
  {
    id: 'yansan',
    name: '经典烟三',
    icon: '🔥',
    tagline: '5--10 / 10--20 / 20--40分场 · 准入100分',
    badgeText: '🔥 极速速配 · 准入100分',
    badgeClass: 'bg-[#EFE5D3] text-[#3C2C1E] border-[#D8C7B0]',
    featurePills: ['四人同台', '方块四首出', '准入100分'],
    tableFelt: '#E6D7B8',
    tableName: '当前在线人数',
    tableRule: '5--10 / 10--20 / 20--40分场 · 52张全发 · 羊皮纸呢绒',
    tableIcon: '🔥',
    onlinePlayers: 0,
    baseStake: 100,
    cardBg: 'bg-gradient-to-br from-[#FAF4E8] via-[#F4ECE0] to-[#EBE0D0] shadow-sm',
    cardBorder: 'border-[#D8C7B0] hover:border-[#BFA98F]',
    iconBoxBg: 'bg-[#EFE5D3] text-[#3C2C1E]',
    iconBoxBorder: 'border-[#D8C7B0]',
    accentColor: '#4E3827',
    glowColor: 'rgba(216, 199, 176, 0.4)',
    buttonClass: 'bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8]',
  },
  {
    id: 'shisanshui',
    name: '十三张',
    icon: '💎',
    tagline: '头中尾三道 · 智能理牌 · 准入100分',
    badgeText: '💎 三道较量 · 准入100分',
    badgeClass: 'bg-[#EFE5D3] text-[#3C2C1E] border-[#D8C7B0]',
    featurePills: ['一键智能推荐', '倒水实时预警', '准入100分'],
    tableFelt: '#E0D0B0',
    tableName: '当前在线人数',
    tableRule: '头3张/中5张/尾5张 · 羊皮纸呢绒',
    tableIcon: '🌊',
    onlinePlayers: 0,
    baseStake: 100,
    cardBg: 'bg-gradient-to-br from-[#FAF4E8] via-[#F4ECE0] to-[#EBE0D0] shadow-sm',
    cardBorder: 'border-[#D8C7B0] hover:border-[#BFA98F]',
    iconBoxBg: 'bg-[#EFE5D3] text-[#3C2C1E]',
    iconBoxBorder: 'border-[#D8C7B0]',
    accentColor: '#483624',
    glowColor: 'rgba(216, 199, 176, 0.4)',
    buttonClass: 'bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8]',
  },
  {
    id: 'mahjong',
    name: '经典麻将',
    icon: '🀄',
    tagline: '东风圈 · 碰杠听胡 · 准入100分',
    badgeText: '🀄 红中血战 · 准入100分',
    badgeClass: 'bg-[#EFE5D3] text-[#3C2C1E] border-[#D8C7B0]',
    featurePills: ['听牌智能推算', '牌墙余张透视', '准入100分'],
    tableFelt: '#E8DCC0',
    tableName: '当前在线人数',
    tableRule: '136张经典牌库 · 东风圈 · 羊皮纸呢绒',
    tableIcon: '🀄',
    onlinePlayers: 0,
    baseStake: 100,
    cardBg: 'bg-gradient-to-br from-[#FAF4E8] via-[#F4ECE0] to-[#EBE0D0] shadow-sm',
    cardBorder: 'border-[#D8C7B0] hover:border-[#BFA98F]',
    iconBoxBg: 'bg-[#EFE5D3] text-[#3C2C1E]',
    iconBoxBorder: 'border-[#D8C7B0]',
    accentColor: '#503C2A',
    glowColor: 'rgba(216, 199, 176, 0.4)',
    buttonClass: 'bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8]',
  },
];

export const GAME_SVG_IMAGES: Record<GameType, string[]> = {
  yansan: ['/cards/ace_of_spades.svg', '/cards/3_of_spades.svg'],
  shisanshui: ['/cards/ace_of_spades.svg', '/cards/ace_of_hearts.svg', '/cards/ace_of_diamonds.svg', '/cards/ace_of_clubs.svg'],
  mahjong: ['/mahjong/03-red-dragon.svg', '/mahjong/02-green-dragon.svg'],
};

export function getGameName(gameType: string): string {
  if (gameType === 'yansan') return '经典烟三';
  if (gameType === 'shisanshui') return '水镜十三水';
  if (gameType === 'mahjong') return '经典国标麻将';
  return '棋牌对决';
}
