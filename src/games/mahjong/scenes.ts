/**
 * 经典国标麻将 (Mahjong) 独立场景、准入分与配置
 */
import { MahjongSceneMode } from './types.ts';

export interface MahjongSceneConfig {
  mode: MahjongSceneMode;
  title: string;
  subtitle: string;
  requiredCoins: number;
  tableFelt: string;
  tag: string;
  badge: string;
  description: string;
}

export const MAHJONG_SCENE_CONFIGS: Record<MahjongSceneMode, MahjongSceneConfig> = {
  'hongzhong-6': {
    mode: 'hongzhong-6',
    title: '红中血战 · 6码大赏',
    subtitle: '准入 100 积分 · 红中赖子',
    requiredCoins: 100,
    tableFelt: '#E8DCC0',
    tag: '红中6码',
    badge: '准入100分',
    description: '四张红中全万能 · 摸到即和 · 抓6张飞鸟中码',
  },
  'hongzhong-10': {
    mode: 'hongzhong-10',
    title: '红中血战 · 10码通天',
    subtitle: '准入 200 积分 · 爆码翻倍',
    requiredCoins: 200,
    tableFelt: '#DFD0B2',
    tag: '红中10码',
    badge: '准入200分',
    description: '10码高奖池 · 自摸连番 · 雀圣必争之地',
  },
  'standard-10': {
    mode: 'standard-10',
    title: '经典国标 · 10番底风',
    subtitle: '准入 100 积分 · 纯正国标番种',
    requiredCoins: 100,
    tableFelt: '#E8DCC0',
    tag: '国标10番',
    badge: '准入100分',
    description: '万条筒字四海同台 · 碰杠吃听自摸',
  },
  'standard-6': {
    mode: 'standard-6',
    title: '经典国标 · 6番极速',
    subtitle: '准入 100 积分 · 极速成牌',
    requiredCoins: 100,
    tableFelt: '#E8DCC0',
    tag: '国标6番',
    badge: '准入100分',
    description: '快速胡牌 · 攻守转换节奏迅猛',
  },
  'mahjong-10-20': {
    mode: 'mahjong-10-20',
    title: '雀神阁 · 10/20分场',
    subtitle: '准入 200 积分 · 雀圣过招',
    requiredCoins: 200,
    tableFelt: '#DFD0B2',
    tag: '10-20分场',
    badge: '准入200分',
    description: '雀神争霸 · 清一色七对频现',
  },
  'mahjong-20-40': {
    mode: 'mahjong-20-40',
    title: '天和居 · 20/40分场',
    subtitle: '准入 500 积分 · 大三元之巅',
    requiredCoins: 500,
    tableFelt: '#D4C2A3',
    tag: '20-40分场',
    badge: '准入500分',
    description: '顶级牌局 · 大四喜十三幺巅峰之争',
  },
};

export function getMahjongRequiredCoins(sceneMode: string): number {
  if (sceneMode === 'mahjong-20-40') return 500;
  if (sceneMode === 'mahjong-10-20' || sceneMode === 'hongzhong-10') return 200;
  return 100;
}

export function getMahjongSceneTag(sceneMode: string): string {
  if (sceneMode === 'hongzhong-6') return '红中6码';
  if (sceneMode === 'hongzhong-10') return '红中10码';
  if (sceneMode === 'standard-10') return '国标10番';
  if (sceneMode === 'standard-6') return '国标6番';
  if (sceneMode === 'mahjong-20-40') return '20-40分场';
  if (sceneMode === 'mahjong-10-20') return '10-20分场';
  return '红中6码';
}
