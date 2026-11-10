/**
 * 水镜十三水 / 十三张 (Shisanshui) 独立场景、准入分与配置
 */
import { ShisanshuiSceneMode } from './types.ts';

export interface ShisanshuiSceneConfig {
  mode: ShisanshuiSceneMode;
  title: string;
  subtitle: string;
  requiredCoins: number;
  playerCount: number;
  tableFelt: string;
  tag: string;
  badge: string;
  description: string;
}

export const SHISANSHUI_SCENE_CONFIGS: Record<ShisanshuiSceneMode, ShisanshuiSceneConfig> = {
  'four-realtime': {
    mode: 'four-realtime',
    title: '四人经典水镜 · 实时对决',
    subtitle: '准入 100 积分 · 52张单副扑克',
    requiredCoins: 100,
    playerCount: 4,
    tableFelt: '#E0D0B0',
    tag: '四人实时',
    badge: '准入100分',
    description: '4人经典场 · 头道3张/中道5张/尾道5张 · 智能防倒水',
  },
  'eight-realtime': {
    mode: 'eight-realtime',
    title: '八人风云水镜 · 双副争霸',
    subtitle: '准入 500 积分 · 104张双副扑克全发',
    requiredCoins: 500,
    playerCount: 8,
    tableFelt: '#D6C4A1',
    tag: '八人双副',
    badge: '准入500分',
    description: '8人同桌 · 双副扑克全发 · 打枪满垒多重大乘',
  },
  'four-booking': {
    mode: 'four-booking',
    title: '四人预约专列 · 10桌车厢推演',
    subtitle: '准入 100 积分 · 10桌车厢预定',
    requiredCoins: 100,
    playerCount: 4,
    tableFelt: '#E0D0B0',
    tag: '四人车厢',
    badge: '准入100分',
    description: '四人车厢 · 预先发牌排理10桌 · 异步对局比水',
  },
  'eight-booking': {
    mode: 'eight-booking',
    title: '八人预约专列 · 双副大车厢',
    subtitle: '准入 500 积分 · 10桌八人预定',
    requiredCoins: 500,
    playerCount: 8,
    tableFelt: '#D6C4A1',
    tag: '八人车厢',
    badge: '准入500分',
    description: '八人豪华车厢 · 104张双副牌预发 · 轮动推演',
  },
  'shisanshui-10-20': {
    mode: 'shisanshui-10-20',
    title: '进阶水镜 · 10/20分场',
    subtitle: '准入 200 积分 · 水分翻倍',
    requiredCoins: 200,
    playerCount: 4,
    tableFelt: '#DECDB0',
    tag: '10-20分场',
    badge: '准入200分',
    description: '水数底分提升 · 高倍率比水博弈',
  },
  'shisanshui-20-40': {
    mode: 'shisanshui-20-40',
    title: '至尊水镜 · 20/40分场',
    subtitle: '准入 500 积分 · 豪客专场',
    requiredCoins: 500,
    playerCount: 4,
    tableFelt: '#D4C2A3',
    tag: '20-40分场',
    badge: '准入500分',
    description: '高净值茶客专场 · 特殊牌型翻江倒海',
  },
};

export function getShisanshuiRequiredCoins(sceneMode: string): number {
  if (sceneMode === 'eight-realtime' || sceneMode === 'eight-booking' || sceneMode === 'shisanshui-20-40') {
    return 500;
  }
  if (sceneMode === 'shisanshui-10-20') {
    return 200;
  }
  return 100;
}

export function getShisanshuiSceneTag(sceneMode: string): string {
  if (sceneMode === 'eight-realtime') return '八人实时';
  if (sceneMode === 'eight-booking') return '八人车厢';
  if (sceneMode === 'four-booking') return '四人车厢';
  if (sceneMode === 'shisanshui-20-40') return '20-40分场';
  if (sceneMode === 'shisanshui-10-20') return '10-20分场';
  return '四人实时';
}

export function isEightPlayerMode(sceneMode: string): boolean {
  return sceneMode === 'eight-realtime' || sceneMode === 'eight-booking';
}
