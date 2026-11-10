<template>
  <div class="w-full h-full flex flex-col justify-between p-2.5 sm:p-4 select-none overflow-hidden bg-[#EFE5D3] text-[#3C2C1E]">
    <!-- Top Header Bar -->
    <div class="flex items-center justify-between pb-2 border-b border-[#D8C7B0] shrink-0">
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
            <h2 class="text-base sm:text-lg md:text-xl font-black text-[#3C2C1E] font-serif-title flex items-center gap-2">
              <span>🔥 经典烟三 · 玩法分场选择</span>
            </h2>
            <span class="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-[#FAF4E8] text-[#3C2C1E] border border-[#D8C7B0] font-mono font-bold">
              5--10 · 10--20 · 20--40分场 · 准入100分
            </span>
          </div>
          <p class="text-[10px] sm:text-xs text-[#6B5744] font-mono mt-0.5">
            纯真人实时匹配 · 准入门槛100分 · 选择分场后进入专属等候室 · 满四人全员入座后自动发牌开局
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

    <!-- 3 Cards Grid (5--10 / 10--20 / 20--40 分场) -->
    <div class="grid grid-cols-3 gap-3 sm:gap-4 flex-1 min-h-0 my-2.5 items-stretch">
      <div
        v-for="s in SCENES"
        :key="s.id"
        @click="selectedScene = s.id"
        @dblclick="confirmAndEnter(s.id)"
        class="relative rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between p-3.5 sm:p-5 overflow-hidden cursor-pointer group active:scale-[0.99] select-none shadow-md"
        :class="[
          selectedScene === s.id
            ? 'border-[#5C4533] bg-gradient-to-br from-[#FFFDF8] via-[#F5ECE0] to-[#EBE0D0] ring-2 ring-[#7D6049] shadow-md'
            : 'border-[#D8C7B0] bg-[#FAF4E8] hover:border-[#BFA98F] hover:bg-[#F4ECE0]'
        ]"
      >
        <!-- Active Tag Badge in Corner -->
        <div
          v-if="selectedScene === s.id"
          class="absolute top-0 right-0 text-[10px] sm:text-xs font-black px-3.5 py-0.5 rounded-bl-xl shadow-xs z-10 bg-[#5C4533] text-[#FAF4E8]"
        >
          已选中 ✓
        </div>

        <!-- Top Section: Icon, Title & Stake -->
        <div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 sm:gap-3">
              <span class="text-2xl sm:text-3xl filter drop-shadow-xs">{{ s.icon }}</span>
              <div>
                <h3
                  class="text-lg sm:text-xl md:text-2xl font-black font-serif-title tracking-wide transition-colors"
                  :class="selectedScene === s.id ? 'text-[#2A1E14]' : 'text-[#3C2C1E] group-hover:text-[#2A1E14]'"
                >
                  {{ s.name }}
                </h3>
                <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span class="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EFE5D3] text-[#3C2C1E] border border-[#D8C7B0] inline-block">
                    {{ s.badge }}
                  </span>
                  <span
                    class="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block"
                    :class="(props.sceneCounts?.[s.id] || 0) >= 4 ? 'bg-amber-500/15 text-amber-900 border-amber-400/50' : 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40'"
                  >
                    👥 {{ formatSceneSeatDisplay(props.sceneCounts?.[s.id] || 0, 4) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Stake Box -->
            <div class="text-right">
              <span class="text-[9px] sm:text-[10px] text-[#6B5744] font-mono block">分场倍率</span>
              <span class="text-base sm:text-lg md:text-xl font-mono font-black text-[#3C2C1E]">
                🪙 {{ s.stakeLabel }}
              </span>
            </div>
          </div>

          <!-- Feature Description Lines -->
          <div class="mt-3 space-y-1.5">
            <div class="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#3C2C1E] font-medium">
              <span class="text-[#6B5744]">●</span>
              <span>{{ s.ruleSummary }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#6B5744]">
              <span class="text-[#8C755E]">●</span>
              <span>{{ s.specialHighlight }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-800 font-bold">
              <span>●</span>
              <span>满座 4 人全员自动开牌，严禁任何假人/人机！</span>
            </div>
          </div>
        </div>

        <!-- Bottom Action Bar -->
        <div class="pt-3 border-t border-[#D8C7B0] flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-[9px] text-[#6B5744] font-mono">准入门槛</span>
            <span class="text-xs sm:text-sm font-mono font-black text-[#3C2C1E]">🪙 100 分</span>
          </div>
          <button
            type="button"
            @click.stop="confirmAndEnter(s.id)"
            class="px-3.5 sm:px-5 py-2 text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1 border"
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
    <div class="flex items-center justify-between pt-2 border-t border-[#D8C7B0] shrink-0">
      <div class="text-[10px] sm:text-xs text-[#6B5744] flex items-center gap-2 font-mono">
        <span class="text-[#3C2C1E] font-bold">💡 提示：</span>
        <span>经典烟三 5-10分、10-20分、20-40分场。选择后进入茶馆聊天室，边语音聊天边等待牌友加入，满四人自动发牌开局。</span>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="confirmAndEnter(selectedScene)"
          class="px-7 py-2 rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] border border-[#7D6049] text-[#FAF4E8] font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <span>进入茶馆大堂 · 等待开局</span>
          <span>🔥 ➔</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export type YansanSceneMode = 'yansan-5-10' | 'yansan-10-20' | 'yansan-20-40';

interface SceneItem {
  id: YansanSceneMode;
  name: string;
  badge: string;
  icon: string;
  baseStake: number;
  stakeLabel: string;
  ruleSummary: string;
  specialHighlight: string;
}

const props = defineProps<{
  initialScene?: YansanSceneMode;
  sceneCounts?: Record<string, number>;
}>();

const emit = defineEmits<{
  (e: 'select', mode: YansanSceneMode): void;
  (e: 'close'): void;
}>();

const selectedScene = ref<YansanSceneMode>(props.initialScene || 'yansan-5-10');

const SCENES: SceneItem[] = [
  {
    id: 'yansan-5-10',
    name: '5--10 分场',
    badge: '底分5分 · 顶格10分',
    icon: '🔥',
    baseStake: 100,
    stakeLabel: '5--10 分',
    ruleSummary: '方块四首出 · 四人各13张 · 底分5分 · 准入100分',
    specialHighlight: '经典入门体验 · 顺子连环跑牌 · 准入100分',
  },
  {
    id: 'yansan-10-20',
    name: '10--20 分场',
    badge: '底分10分 · 顶格20分',
    icon: '⚡',
    baseStake: 100,
    stakeLabel: '10--20 分',
    ruleSummary: '四人同台争锋 · 炸弹翻倍 · 底分10分 · 准入100分',
    specialHighlight: '进阶实力对决 · 炸弹顶大出清 · 准入100分',
  },
  {
    id: 'yansan-20-40',
    name: '20--40 分场',
    badge: '底分20分 · 顶格40分',
    icon: '👑',
    baseStake: 100,
    stakeLabel: '20--40 分',
    ruleSummary: '四人巅峰豪客对决 · 炸弹翻番 · 底分20分 · 准入100分',
    specialHighlight: '高倍巅峰争霸 · 决战云巅先跑赢 · 准入100分',
  },
];

function confirmAndEnter(mode: YansanSceneMode) {
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
