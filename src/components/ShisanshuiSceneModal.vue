<template>
  <div class="w-full h-full flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden bg-[#EFE5D3] text-[#3C2C1E]">
    <!-- Top Header Bar -->
    <div class="flex items-center justify-between pb-2.5 border-b border-[#D8C7B0] shrink-0">
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-3.5 py-1.5 rounded-xl bg-[#FAF4E8] hover:bg-[#F4ECE0] text-xs sm:text-sm font-bold text-[#3C2C1E] border border-[#D8C7B0] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
          title="返回游戏大厅"
        >
          <span>🏠</span>
          <span>返回大厅</span>
        </button>
        <div>
          <div class="flex items-center gap-2.5">
            <h2 class="text-base sm:text-lg md:text-xl font-black text-[#3C2C1E] font-serif-title">
              水镜楼 · 十三张（十三水）场景选择
            </h2>
            <span class="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-[#FAF4E8] text-[#3C2C1E] border border-[#D8C7B0] font-mono font-bold">
              头中尾三道比水 · 准入100分
            </span>
          </div>
          <p class="text-[10px] sm:text-xs text-[#6B5744] font-mono mt-0.5">
            四人场（1副牌52张全发 · 准入100分） · 八人场（2副扑克104张全发）
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-[#FAF4E8] hover:bg-[#F4ECE0] flex items-center justify-center text-sm text-[#3C2C1E] transition-colors cursor-pointer border border-[#D8C7B0]"
          title="关闭返回大厅"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 2+2 Four Cards (No Icons, Clear Typography, Spacious Layout) -->
    <div class="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 flex-1 min-h-0 my-3 items-stretch">
      <div
        v-for="s in SCENES"
        :key="s.id"
        @click="selectedScene = s.id"
        @dblclick="confirmAndEnter(s.id)"
        class="relative rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 flex items-center justify-between px-5 sm:px-8 py-3.5 sm:py-5 overflow-hidden cursor-pointer group active:scale-[0.99] select-none shadow-md"
        :class="[
          selectedScene === s.id
            ? 'border-[#5C4533] bg-gradient-to-r from-[#FFFDF8] via-[#F5ECE0] to-[#EBE0D0] ring-2 ring-[#7D6049] shadow-md'
            : 'border-[#D8C7B0] bg-[#FAF4E8] hover:border-[#BFA98F] hover:bg-[#F4ECE0]'
        ]"
      >
        <!-- Active Tag Badge in Corner -->
        <div
          v-if="selectedScene === s.id"
          class="absolute top-0 right-0 text-[10px] sm:text-xs font-black px-4 py-0.5 rounded-bl-xl shadow-xs z-10 bg-[#5C4533] text-[#FAF4E8]"
        >
          已选中 ✓
        </div>

        <!-- Left Content Area (Pure text hierarchy, no icons) -->
        <div class="min-w-0 flex-1 pr-3">
          <!-- Title Row + Tag -->
          <div class="flex items-center gap-3 flex-nowrap">
            <h3
              class="text-2xl sm:text-3xl md:text-4xl font-black font-serif-title tracking-wide whitespace-nowrap leading-none transition-colors"
              :class="
                selectedScene === s.id
                  ? 'text-[#3C2C1E]'
                  : 'text-[#5C4533] group-hover:text-[#2A1E14]'
              "
            >
              {{ s.name }}
            </h3>

            <span
              class="px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black font-mono shadow-sm shrink-0 whitespace-nowrap bg-[#EFE5D3] text-[#3C2C1E] border border-[#D8C7B0]"
            >
              {{ s.deckCountText }}
            </span>
            <span
              class="px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black font-mono shadow-sm shrink-0 whitespace-nowrap border"
              :class="(props.sceneCounts?.[s.id] || 0) >= (s.isEight ? 8 : 4) ? 'bg-red-500/15 text-red-800 border-red-400/40 animate-pulse' : 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40'"
            >
              👥 {{ formatSceneSeatDisplay(props.sceneCounts?.[s.id] || 0, s.isEight ? 8 : 4) }}
            </span>
          </div>

          <!-- Feature Description Lines -->
          <div class="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
            <span class="text-xs sm:text-sm font-bold text-[#3C2C1E] whitespace-nowrap">
              {{ s.modeDesc }}
            </span>
            <span class="text-xs sm:text-sm text-[#8C755E] hidden sm:inline">|</span>
            <span class="text-xs sm:text-sm font-medium text-[#6B5744] whitespace-nowrap">
              {{ s.ruleDesc }}
            </span>
          </div>
        </div>

        <!-- Right Content Area: Base Stake + Action Button -->
        <div class="flex items-center shrink-0 pl-4 sm:pl-6 border-l border-[#D8C7B0] gap-4 sm:gap-5">
          <div class="flex flex-col items-end justify-center">
            <span class="text-[10px] sm:text-xs text-[#6B5744] font-mono whitespace-nowrap">
              底分准入
            </span>
            <span class="text-base sm:text-xl md:text-2xl font-mono font-black text-[#3C2C1E] whitespace-nowrap mt-0.5">
              {{ s.baseStake }} 分
            </span>
          </div>

          <button
            type="button"
            @click.stop="confirmAndEnter(s.id)"
            class="px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 border"
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

    <!-- Bottom Footer Bar -->
    <div class="flex items-center justify-between pt-2.5 border-t border-[#D8C7B0] shrink-0">
      <div class="text-[10px] sm:text-xs text-[#6B5744] flex items-center gap-2 font-mono">
        <span class="text-[#3C2C1E] font-bold">提示：</span>
        <span>纯真人实时匹配。点击「进入茶馆大堂 · 等待开局」可在茶馆大堂边语音交流边等待牌友加入，满座自动发牌开局。</span>
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

export type ShisanshuiSceneMode = 'four-realtime' | 'four-booking' | 'eight-realtime' | 'eight-booking';

interface SceneItem {
  id: ShisanshuiSceneMode;
  name: string;
  isEight: boolean;
  deckCountText: string;
  modeDesc: string;
  ruleDesc: string;
  baseStake: number;
}

const props = defineProps<{
  initialScene?: ShisanshuiSceneMode;
  sceneCounts?: Record<string, number>;
}>();

const emit = defineEmits<{
  (e: 'select', mode: ShisanshuiSceneMode): void;
  (e: 'close'): void;
}>();

const selectedScene = ref<ShisanshuiSceneMode>(props.initialScene || 'four-realtime');

const SCENES: SceneItem[] = [
  {
    id: 'four-realtime',
    name: '四人实时场',
    isEight: false,
    deckCountText: '1 副牌 · 52张',
    modeDesc: '快速即配 · 实时竞技',
    ruleDesc: '4人×13张 = 52张全发 · 打枪翻倍 · 准入100分',
    baseStake: 100,
  },
  {
    id: 'four-booking',
    name: '四人预约场',
    isEight: false,
    deckCountText: '1 副牌 · 52张',
    modeDesc: '预约专列 · 每日06:00结算',
    ruleDesc: '一列火车 · 每节车厢10张牌桌 · 东南西北自主选位 · 每日06:00统一比水结算 · 准入100分',
    baseStake: 100,
  },
  {
    id: 'eight-realtime',
    name: '八人实时场',
    isEight: true,
    deckCountText: '2 副牌 · 104张',
    modeDesc: '双副争霸 · 8人同台',
    ruleDesc: '8人×13张 = 104张全发 · 五同至尊 · 7位对手比水',
    baseStake: 500,
  },
  {
    id: 'eight-booking',
    name: '八人预约场',
    isEight: true,
    deckCountText: '2 副牌 · 104张',
    modeDesc: '豪华专列 · 8方位预约盛宴',
    ruleDesc: '两副扑克盛宴(104张) · 每节车厢10张牌桌 · 8个方位任选 · 每日06:00统一结算 · 准入500分',
    baseStake: 500,
  },
];

function confirmAndEnter(mode: ShisanshuiSceneMode) {
  selectedScene.value = mode;
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
