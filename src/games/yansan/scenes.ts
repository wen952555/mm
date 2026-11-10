/**
 * 经典烟三 (Yansan) 独立场景、倍率与准入规则配置
 */
import { YansanSceneMode } from './types.ts';

export interface YansanSceneConfig {
  mode: YansanSceneMode;
  title: string;
  subtitle: string;
  requiredCoins: number;
  baseStake: number;
  tableFelt: string;
  tag: string;
  badge: string;
  description: string;
}

export const YANSAN_SCENE_CONFIGS: Record<YansanSceneMode, YansanSceneConfig> = {
  'yansan-5-10': {
    mode: 'yansan-5-10',
    title: '初入烟雨 · 5/10分场',
    subtitle: '准入 100 积分 · 底分 5 分',
    requiredCoins: 100,
    baseStake: 5,
    tableFelt: '#E6D7B8',
    tag: '5-10分场',
    badge: '准入100分',
    description: '四人争锋 · 方块四首发 · 牌力适中新手友好',
  },
  'yansan-10-20': {
    mode: 'yansan-10-20',
    title: '风起岭南 · 10/20分场',
    subtitle: '准入 200 积分 · 底分 10 分',
    requiredCoins: 200,
    baseStake: 10,
    tableFelt: '#DECDB0',
    tag: '10-20分场',
    badge: '准入200分',
    description: '高手过招 · 黑桃三与黑桃尖暗盟攻防推演',
  },
  'yansan-20-40': {
    mode: 'yansan-20-40',
    title: '烟波浩渺 · 20/40分场',
    subtitle: '准入 500 积分 · 底分 20 分',
    requiredCoins: 500,
    baseStake: 20,
    tableFelt: '#D4C2A3',
    tag: '20-40分场',
    badge: '准入500分',
    description: '巅峰争霸 · 强攻独战全场 · 胜负成倍翻涌',
  },
};

export function getYansanRequiredCoins(sceneMode: string): number {
  if (sceneMode === 'yansan-20-40') return 500;
  if (sceneMode === 'yansan-10-20') return 200;
  return 100;
}

export function getYansanSceneTag(sceneMode: string): string {
  if (sceneMode === 'yansan-20-40') return '20-40分场';
  if (sceneMode === 'yansan-10-20') return '10-20分场';
  return '5-10分场';
}
