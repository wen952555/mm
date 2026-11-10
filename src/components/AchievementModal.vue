<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div class="w-[94vw] max-w-2xl max-h-[92dvh] rounded-3xl bg-[#EFE5D3] border border-[#D8C7B0] p-3.5 sm:p-5 shadow-2xl flex flex-col justify-between overflow-hidden text-[#3C2C1E]">
        <!-- Header -->
        <div class="flex items-center justify-between pb-2.5 border-b border-[#D8C7B0] shrink-0 bg-[#FAF4E8] -mx-3.5 -mt-3.5 sm:-mx-5 sm:-mt-5 p-3.5 sm:p-5">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl p-1.5 rounded-xl bg-[#EFE5D3] border border-[#D8C7B0] shrink-0">🏆</span>
            <div>
              <h3 class="text-base sm:text-lg font-bold text-[#3C2C1E] font-serif-title">雀神成就与茶楼装扮</h3>
              <p class="text-[11px] sm:text-xs text-[#6B5744]">达成对局成就领取筹码奖励，更换专属 Canvas 牌桌布景</p>
            </div>
          </div>
          <button type="button" @click="$emit('close')" class="w-7 h-7 rounded-full bg-[#EFE5D3] hover:bg-[#E5D7C2] border border-[#D8C7B0] flex items-center justify-center text-xs text-[#3C2C1E] transition-colors cursor-pointer">
            ✕
          </button>
        </div>

      <!-- Tabs -->
      <div class="flex items-center gap-1.5 my-2.5 p-1 bg-[#FAF4E8] rounded-xl border border-[#D8C7B0] shrink-0">
        <button
          type="button"
          @click="activeTab = 'achieve'"
          :class="activeTab === 'achieve' ? 'bg-[#5C4533] text-[#FAF4E8] font-bold shadow-xs' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
          class="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors"
        >
          对战成就挑战 ({{ completedCount }}/{{ achievements.length }})
        </button>
        <button
          type="button"
          @click="activeTab = 'themes'"
          :class="activeTab === 'themes' ? 'bg-[#5C4533] text-[#FAF4E8] font-bold shadow-xs' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
          class="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors"
        >
          牌桌呢绒台布风格
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-3">
        <!-- Tab 1: Achievements -->
        <div v-if="activeTab === 'achieve'" class="space-y-2.5">
          <div
            v-for="ach in achievements"
            :key="ach.id"
            class="p-3.5 rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] flex items-center justify-between gap-3 text-xs shadow-xs"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl p-2 rounded-lg bg-[#EFE5D3] border border-[#D8C7B0]">{{ ach.icon }}</span>
              <div>
                <div class="font-bold text-[#3C2C1E] text-sm flex items-center gap-2">
                  {{ ach.title }}
                  <span v-if="ach.claimed" class="text-[10px] text-emerald-800 font-mono">已达成</span>
                </div>
                <div class="text-[#6B5744] text-[11px] mt-0.5">{{ ach.desc }}</div>
                <div class="text-[#5C4533] font-mono font-bold text-[11px] mt-1">奖励：+{{ ach.reward }} 分筹码</div>
              </div>
            </div>

            <button
              type="button"
              @click="claimReward(ach)"
              :disabled="ach.claimed || !ach.canClaim"
              :class="ach.claimed ? 'bg-[#EFE5D3] text-[#8C755E]' : (ach.canClaim ? 'bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] border border-[#7D6049] font-bold' : 'bg-[#EFE5D3] text-[#8C755E]')"
              class="px-3.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 border border-[#D8C7B0]"
            >
              {{ ach.claimed ? '已领取' : (ach.canClaim ? '领取奖励' : '未达成') }}
            </button>
          </div>
        </div>

        <!-- Tab 2: Themes -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="th in TABLE_THEMES"
            :key="th.id"
            @click="selectTheme(th)"
            :class="selectedThemeId === th.id ? 'border-[#5C4533] ring-2 ring-[#7D6049]' : 'border-[#D8C7B0] hover:border-[#BFA98F]'"
            class="p-4 rounded-xl bg-[#FFFDF8] border cursor-pointer transition-all flex flex-col justify-between shadow-xs"
          >
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="font-bold text-sm text-[#3C2C1E]">{{ th.name }}</span>
                <span
                  v-if="selectedThemeId === th.id"
                  class="text-[11px] px-2 py-0.5 rounded bg-[#EFE5D3] text-[#3C2C1E] font-bold border border-[#D8C7B0]"
                >
                  当前使用
                </span>
              </div>
              <div
                class="w-full h-14 rounded-lg border border-black/30 shadow-inner flex items-center justify-center text-xs font-semibold"
                :style="{ backgroundColor: th.feltColor, color: th.textColor, borderColor: th.borderColor }"
              >
                Canvas 呢面渲染预览
              </div>
            </div>
            <div class="text-[11px] text-[#6B5744] mt-3">
              全屏 Canvas 棋盘背景自适应渲染
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-3 mt-3 border-t border-[#2E2722] flex items-center justify-between">
        <span class="text-[11px] text-[#8C7A6B]">成就与桌面个性化配置即时生效</span>
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors"
        >
          完成返回
        </button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { TABLE_THEMES, TableTheme, getSavedTheme, saveTheme } from '../utils/theme';
import { soundFX } from '../utils/sound';

const props = defineProps<{
  coins: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'claim', reward: number): void;
  (e: 'theme-change', theme: TableTheme): void;
}>();

const activeTab = ref<'achieve' | 'themes'>('achieve');
const selectedThemeId = ref(getSavedTheme().id);

const STORAGE_KEY_CLAIMED_ACHS = 'rustchess_claimed_achievements_v1';

function getClaimedAchievementIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLAIMED_ACHS);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveClaimedAchievementIds(claimedSet: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY_CLAIMED_ACHS, JSON.stringify(Array.from(claimedSet)));
  } catch {}
}

const claimedSet = getClaimedAchievementIds();

const achievements = reactive([
  {
    id: 'ach_1',
    icon: '🚩',
    title: '初入江湖',
    desc: '在任意牌桌完成 1 场对决',
    reward: 500,
    canClaim: true,
    claimed: claimedSet.has('ach_1'),
  },
  {
    id: 'ach_2',
    icon: '⚡',
    title: '神行太保',
    desc: '在 经典烟三 中率先清空手牌',
    reward: 800,
    canClaim: true,
    claimed: claimedSet.has('ach_2'),
  },
  {
    id: 'ach_3',
    icon: '🔥',
    title: '连珠妙算',
    desc: '在经典烟三中打出连对或顺子率先控局',
    reward: 1000,
    canClaim: true,
    claimed: claimedSet.has('ach_3'),
  },
  {
    id: 'ach_4',
    icon: '👑',
    title: '倒水克星',
    desc: '在十三水中完成三道完美压制并通吃三家',
    reward: 1200,
    canClaim: true,
    claimed: claimedSet.has('ach_4'),
  },
  {
    id: 'ach_5',
    icon: '💎',
    title: '罗宋巧手',
    desc: '十三水完成智能理牌并成功打枪对手',
    reward: 1200,
    canClaim: true,
    claimed: claimedSet.has('ach_5'),
  },
  {
    id: 'ach_6',
    icon: '🀄',
    title: '天和雀圣',
    desc: '麻将自摸清一色满贯大胡',
    reward: 1500,
    canClaim: true,
    claimed: claimedSet.has('ach_6'),
  },
  {
    id: 'ach_7',
    icon: '💣',
    title: '烟三炸弹神手',
    desc: '在经典烟三中打出四张同点炸弹轰翻全场',
    reward: 1000,
    canClaim: true,
    claimed: claimedSet.has('ach_7'),
  },
  {
    id: 'ach_8',
    icon: '🏮',
    title: '三大宗师',
    desc: '通关体验经典烟三、十三水与麻将三大国粹并斩获胜局',
    reward: 1500,
    canClaim: true,
    claimed: claimedSet.has('ach_8'),
  },
]);

const completedCount = computed(() => achievements.filter((a) => a.claimed).length);

function claimReward(ach: any) {
  if (ach.claimed || !ach.canClaim) return;
  ach.claimed = true;
  claimedSet.add(ach.id);
  saveClaimedAchievementIds(claimedSet);
  soundFX.playVictory();
  emit('claim', ach.reward);
}

function selectTheme(th: TableTheme) {
  selectedThemeId.value = th.id;
  saveTheme(th.id);
  soundFX.playTap();
  emit('theme-change', th);
}
</script>
