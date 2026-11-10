<template>
  <div class="w-full h-full flex flex-col justify-between p-2.5 sm:p-4 select-none overflow-hidden bg-[#EFE5D3] text-[#3C2C1E]">
    <!-- Top Header Bar (No red dragon icon; uses tea house emblem) -->
    <div class="flex items-center justify-between pb-2 border-b border-[#D8C7B0] shrink-0">
      <div class="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-3 py-1.5 rounded-xl bg-[#FAF4E8] hover:bg-[#F4ECE0] text-xs sm:text-sm font-bold text-[#3C2C1E] border border-[#D8C7B0] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
          title="返回游戏大厅"
        >
          <span>🏠</span>
          <span>返回大厅</span>
        </button>
        <span class="text-xl sm:text-2xl p-1 rounded-xl bg-[#FAF4E8] border border-[#D8C7B0] text-[#3C2C1E] shadow-xs" title="雀神茶社">
          🍵
        </span>
        <div>
          <h2 class="text-sm sm:text-base md:text-lg font-black text-[#3C2C1E] font-serif-title flex items-center gap-2">
            <span>雀神茶社 · 麻将玩法场景选择</span>
            <span class="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#FAF4E8] text-[#3C2C1E] border border-[#D8C7B0] font-mono font-bold">
              10分底分 · 准入100分
            </span>
          </h2>
          <p class="text-[9px] sm:text-[10px] text-[#6B5744] font-mono mt-0.5 truncate">
            全屏 2+2 四大长方条大格局 · 严禁放炮/仅限自摸/不可吃牌 · 摸4张红中直接胡牌 · 无红中自摸额外奖2码
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="$emit('close')"
          class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF4E8] hover:bg-[#F4ECE0] flex items-center justify-center text-xs sm:text-sm text-[#3C2C1E] transition-colors cursor-pointer border border-[#D8C7B0]"
          title="关闭返回大厅"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 2+2 Four Elongated Horizontal Bars (Full Screen, No Overflow, Zero Scroll) -->
    <div class="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 flex-1 min-h-0 my-2.5 items-stretch">
      <div
        v-for="s in SCENES"
        :key="s.id"
        @click="selectedScene = s.id"
        @dblclick="confirmAndEnter(s.id)"
        class="relative rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 flex items-center justify-between px-3.5 sm:px-6 py-2 sm:py-3 overflow-hidden cursor-pointer group active:scale-[0.99] select-none shadow-md"
        :class="[
          selectedScene === s.id
            ? 'border-[#5C4533] bg-gradient-to-r from-[#FFFDF8] via-[#F5ECE0] to-[#EBE0D0] ring-2 ring-[#7D6049] shadow-md'
            : 'border-[#D8C7B0] bg-[#FAF4E8] hover:border-[#BFA98F] hover:bg-[#F4ECE0]'
        ]"
      >
        <!-- Active Corner Tag -->
        <div
          v-if="selectedScene === s.id"
          class="absolute top-0 right-0 bg-[#5C4533] text-[#FAF4E8] text-[10px] font-black px-3 py-0.5 rounded-bl-xl shadow-xs"
        >
          已选中 ✓
        </div>

        <!-- 1. Left Section: Icon & Title -->
        <div class="flex items-center gap-3 sm:gap-4 min-w-0 shrink-0">
          <!-- Normal Scenes: Auspicious 福袋 (Lucky Pouch) Icon -->
          <div
            v-if="s.iconType === 'fudai'"
            class="w-12 h-12 sm:w-15 sm:h-15 rounded-2xl flex items-center justify-center border shadow-inner shrink-0 bg-gradient-to-br from-[#FFF8EE] via-[#FDF2E3] to-[#F5E1C3] border-[#D8C7B0] group-hover:scale-105 transition-transform"
            title="祥瑞福袋"
          >
            <!-- Auspicious 福袋 Vector Graphic -->
            <svg viewBox="0 0 64 64" class="w-8 h-8 sm:w-10 sm:h-10 filter drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="fudaiBodyGrad" cx="45%" cy="40%" r="55%">
                  <stop offset="0%" stop-color="#E53935" />
                  <stop offset="60%" stop-color="#C62828" />
                  <stop offset="100%" stop-color="#8E0000" />
                </radialGradient>
                <linearGradient id="fudaiGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#FFF2A3" />
                  <stop offset="50%" stop-color="#F59E0B" />
                  <stop offset="100%" stop-color="#B45309" />
                </linearGradient>
              </defs>
              <!-- Main Bag Silk Pouch -->
              <path d="M14 26 C12 39 15 56 32 56 C49 56 52 39 50 26 C48 23 44 22 32 22 C20 22 16 23 14 26 Z" fill="url(#fudaiBodyGrad)" stroke="#7F1D1D" stroke-width="1.2" />
              <!-- Top Fluted Neck Ruffles -->
              <path d="M18 22 C16 16 22 12 26 14 C29 11 35 11 38 14 C42 12 48 16 46 22 Z" fill="url(#fudaiBodyGrad)" stroke="#7F1D1D" stroke-width="0.8" />
              <!-- Golden Tie Rope -->
              <path d="M18 22 Q32 25 46 22" stroke="url(#fudaiGoldGrad)" stroke-width="2.5" stroke-linecap="round" />
              <ellipse cx="32" cy="23.5" rx="3.5" ry="3" fill="url(#fudaiGoldGrad)" stroke="#78350F" stroke-width="0.6" />
              <!-- Tassels -->
              <path d="M30 25 L27 34" stroke="url(#fudaiGoldGrad)" stroke-width="1.8" stroke-linecap="round" />
              <path d="M34 25 L37 34" stroke="url(#fudaiGoldGrad)" stroke-width="1.8" stroke-linecap="round" />
              <!-- Center Gold Medallion with "福" -->
              <circle cx="32" cy="40" r="9" fill="url(#fudaiGoldGrad)" stroke="#78350F" stroke-width="0.8" />
              <circle cx="32" cy="40" r="7.5" fill="none" stroke="#D97706" stroke-width="0.6" stroke-dasharray="2 1" />
              <text x="32" y="44" font-size="10.5" font-weight="900" font-family="serif" text-anchor="middle" fill="#991B1B">福</text>
              <!-- Gold Sparkles -->
              <circle cx="21" cy="33" r="1" fill="#FEF08A" />
              <circle cx="43" cy="32" r="1" fill="#FEF08A" />
            </svg>
          </div>

          <!-- Red Dragon Scenes: Noticeably Larger Authentic Red Dragon Mahjong Tile Icon -->
          <div
            v-else-if="s.iconType === 'hongzhong'"
            class="w-13 h-17 sm:w-16 sm:h-21 rounded-xl flex items-center justify-center p-1 sm:p-1.5 border-2 shadow-md shrink-0 bg-gradient-to-b from-[#FFFDF8] via-[#FAF6ED] to-[#EAE0D0] border-[#C2AC92] ring-2 ring-red-700/25 group-hover:scale-105 transition-transform"
            title="红中万能百搭牌"
          >
            <!-- Large Red Dragon Tile SVG -->
            <img
              src="/mahjong/03-red-dragon.svg"
              alt="红中万能牌"
              class="w-full h-full object-contain filter drop-shadow-sm select-none pointer-events-none"
            />
          </div>

          <div class="min-w-0">
            <h3 class="text-base sm:text-lg font-black text-[#3C2C1E] font-serif-title truncate group-hover:text-[#2A1E14] transition-colors">
              {{ s.name }}
            </h3>
            <div class="text-[10px] sm:text-xs font-mono font-bold mt-0.5 truncate text-[#5C4533] flex items-center gap-1.5 flex-wrap">
              <span>{{ s.badge }}</span>
              <span
                class="px-1.5 py-0.2 rounded border text-[9px]"
                :class="(props.sceneCounts?.[s.id] || 0) >= 4 ? 'bg-red-500/15 text-red-800 border-red-400/40 animate-pulse' : 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40'"
              >
                👥 {{ formatSceneSeatDisplay(props.sceneCounts?.[s.id] || 0, 4) }}
              </span>
            </div>
            <div class="text-[10px] text-[#6B5744] font-mono mt-1 hidden sm:block">
              {{ s.subHighlight }}
            </div>
          </div>
        </div>

        <!-- 2. Middle Section: Giant Number Highlight -->
        <div class="flex flex-col items-center justify-center px-2 sm:px-4 shrink-0">
          <div class="text-[10px] text-[#6B5744] font-mono">自摸开奖</div>
          <div class="text-2xl sm:text-3xl md:text-4xl font-black font-mono leading-none tracking-tight my-0.5 text-[#3C2C1E]">
            {{ s.maCount }} <span class="text-xs sm:text-sm font-bold font-sans">码</span>
          </div>
          <div class="text-[9px] sm:text-[10px] text-[#8C755E] font-mono">
            底分 10 分
          </div>
        </div>

        <!-- 3. Right Rules Summary Box (Always visible, crystal clear) -->
        <div class="flex flex-col justify-center space-y-0.5 sm:space-y-1 p-1.5 sm:p-2 rounded-xl border border-[#D8C7B0] text-[9px] sm:text-[10px] font-mono w-36 sm:w-44 lg:w-52 shrink-0 bg-[#EFE5D3]">
          <div class="flex items-center justify-between font-bold text-[#3C2C1E]">
            <span class="truncate">{{ s.specialRuleTitle }}</span>
            <span class="shrink-0 ml-1">{{ s.specialRuleValue }}</span>
          </div>
          <div v-if="s.secondRuleTitle" class="flex items-center justify-between text-emerald-800 font-bold">
            <span class="truncate">{{ s.secondRuleTitle }}</span>
            <span class="shrink-0 ml-1">{{ s.secondRuleValue }}</span>
          </div>
        </div>

        <!-- 4. Far Right: Button & Action -->
        <div class="flex flex-col items-end justify-center gap-1.5 shrink-0 pl-2">
          <span class="text-[10px] sm:text-xs font-mono font-bold text-[#5C4533]">
            🪙 100 分
          </span>
          <button
            type="button"
            @click.stop="confirmAndEnter(s.id)"
            class="px-3.5 sm:px-5 py-1.5 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap border"
            :class="
              selectedScene === s.id
                ? 'bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] border-[#7D6049] font-bold'
                : 'bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#3C2C1E] border-[#D8C7B0]'
            "
          >
            <span>{{ selectedScene === s.id ? '进入茶馆聊天室 ➔' : '选择此场' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Footer Bar (No red dragon icon) -->
    <div class="flex items-center justify-between pt-2.5 border-t border-[#D8C7B0] shrink-0">
      <div class="text-[10px] sm:text-xs text-[#6B5744] flex items-center gap-2 font-mono">
        <span class="text-[#3C2C1E] font-bold">💡 公平守则：</span>
        <span>纯真人对决。点击「进入茶馆大堂 · 等待开局」在茶馆社交大堂边语音交流边等待牌友，满四人自动发牌开局。</span>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="confirmAndEnter(selectedScene)"
          class="px-7 py-2 rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] border border-[#7D6049] font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <span>进入茶馆大堂 · 等待开局 ➔</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export type MahjongSceneMode = 'standard-6' | 'standard-10' | 'hongzhong-6' | 'hongzhong-10';

interface SceneItem {
  id: MahjongSceneMode;
  name: string;
  badge: string;
  badgeColor: string;
  iconType: 'fudai' | 'hongzhong';
  iconBg: string;
  maCount: number;
  maCountColor: string;
  subHighlight: string;
  ruleBoxBg: string;
  specialRuleTitle: string;
  specialRuleValue: string;
  specialRuleColor: string;
  secondRuleTitle?: string;
  secondRuleValue?: string;
}

const props = defineProps<{
  initialScene?: MahjongSceneMode;
  sceneCounts?: Record<string, number>;
}>();

const emit = defineEmits<{
  (e: 'select', mode: MahjongSceneMode): void;
  (e: 'close'): void;
}>();

const selectedScene = ref<MahjongSceneMode>(props.initialScene || 'hongzhong-6');

const SCENES: SceneItem[] = [
  {
    id: 'standard-6',
    name: '普通场 · 六码',
    badge: '经典国标 · 136张经典牌库',
    badgeColor: 'text-amber-400',
    iconType: 'fudai',
    iconBg: 'bg-amber-900/40 border-amber-500/40 text-amber-300',
    maCount: 6,
    maCountColor: 'text-amber-400',
    subHighlight: '一五九/红中东风中码',
    ruleBoxBg: 'bg-black/30',
    specialRuleTitle: '中码奖励',
    specialRuleValue: '+10分/每码',
    specialRuleColor: 'text-amber-300',
    secondRuleTitle: '算分模式',
    secondRuleValue: '底分+中码数×10',
  },
  {
    id: 'standard-10',
    name: '普通场 · 十码',
    badge: '十码连开 · 刺激高奖池',
    badgeColor: 'text-emerald-400',
    iconType: 'fudai',
    iconBg: 'bg-emerald-900/40 border-emerald-500/40 text-emerald-300',
    maCount: 10,
    maCountColor: 'text-emerald-400',
    subHighlight: '连开十码大赏',
    ruleBoxBg: 'bg-black/30',
    specialRuleTitle: '十码连开',
    specialRuleValue: '+10分/每码',
    specialRuleColor: 'text-emerald-300',
    secondRuleTitle: '算分模式',
    secondRuleValue: '最高赢110分/家',
  },
  {
    id: 'hongzhong-6',
    name: '红中场 · 六码',
    badge: '红中万能百搭 · 爽快自摸',
    badgeColor: 'text-rose-400',
    iconType: 'hongzhong',
    iconBg: 'bg-rose-900/40 border-rose-500/40 text-rose-300',
    maCount: 6,
    maCountColor: 'text-rose-400',
    subHighlight: '无红中自摸奖8码',
    ruleBoxBg: 'bg-rose-950/20',
    specialRuleTitle: '摸4张红中胡牌',
    specialRuleValue: '各得70分(共210分)',
    specialRuleColor: 'text-rose-300',
    secondRuleTitle: '手牌无红中自摸',
    secondRuleValue: '奖励额外+2码(共8码)',
  },
  {
    id: 'hongzhong-10',
    name: '红中场 · 十码',
    badge: '红中至尊 · 巅峰大赏',
    badgeColor: 'text-purple-400',
    iconType: 'hongzhong',
    iconBg: 'bg-purple-900/40 border-purple-500/40 text-purple-300',
    maCount: 10,
    maCountColor: 'text-purple-300',
    subHighlight: '无红中自摸奖12码',
    ruleBoxBg: 'bg-purple-950/20',
    specialRuleTitle: '摸4张红中胡牌',
    specialRuleValue: '各得110分(共330分)',
    specialRuleColor: 'text-purple-300',
    secondRuleTitle: '手牌无红中自摸',
    secondRuleValue: '奖励额外+2码(共12码)',
  },
];

function confirmAndEnter(mode: MahjongSceneMode) {
  emit('select', mode);
}

function formatSceneSeatDisplay(count: number, maxP: number = 4): string {
  if (count <= 0) return `0 / ${maxP} 等候中`;
  if (count < maxP) return `${count} / ${maxP} 等候中`;
  if (count === maxP) return `${maxP} / ${maxP} 满桌竞技`;
  const waitingInTable = ((count - 1) % maxP) + 1;
  const tableNo = Math.floor((count - 1) / maxP) + 1;
  return `${count}人在场 (第${tableNo}桌 ${waitingInTable}/${maxP})`;
}
</script>
