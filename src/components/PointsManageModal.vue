<template>
  <Teleport to="body">
    <div
      :class="isRotated90 ? 'points-modal-rotated-full' : 'points-modal-standard-full'"
      class="select-none p-3 sm:p-4 text-[#3C2C1E] overflow-hidden flex flex-col"
    >
      <!-- 1. Top Header Bar (Shrink-0) -->
      <header class="flex items-center justify-between pb-2 border-b border-[#D8C7B0] shrink-0 gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 rounded-xl bg-[#EFE5D3] border border-[#D8C7B0] flex items-center justify-center text-sm text-[#3C2C1E] shadow-inner shrink-0">
            🪙
          </div>
          <div class="min-w-0">
            <h3 class="text-xs sm:text-sm font-black text-[#3C2C1E] font-serif-title leading-tight truncate flex items-center gap-1.5">
              <span>钱庄与筹码管理</span>
              <span class="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-600/20 text-amber-900 font-mono font-bold border border-amber-600/30">
                九宫格屏幕数字键盘
              </span>
            </h3>
            <p class="text-[10px] text-[#6B5744] leading-none mt-0.5 truncate">
              可用结余: <strong class="text-[#5C4533] font-mono font-bold">{{ userCoins.toLocaleString() }} 分</strong>
              <span class="ml-1 text-[#8C755E]">· LV.{{ userLevel }}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="w-7 h-7 rounded-full bg-[#EFE5D3] hover:bg-[#E5D7C2] border border-[#D8C7B0] flex items-center justify-center text-xs font-bold text-[#3C2C1E] transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs"
          title="关闭钱庄"
        >
          ✕
        </button>
      </header>

      <!-- 2. Navigation Tabs (Shrink-0) -->
      <nav class="flex items-center gap-1.5 py-1.5 shrink-0">
        <div class="flex items-center gap-1 p-0.5 bg-[#EFE5D3] rounded-xl border border-[#D8C7B0] w-full">
          <button
            type="button"
            @click="activeTab = 'transfer'"
            :class="activeTab === 'transfer' ? 'bg-gradient-to-r from-[#5C4533] to-[#433022] text-[#FAF4E8] font-bold shadow-md' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
            class="flex-1 py-1 text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <span>🎁</span>
            <span class="truncate">手机号筹码互赠</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'history'"
            :class="activeTab === 'history' ? 'bg-gradient-to-r from-[#5C4533] to-[#433022] text-[#FAF4E8] font-bold shadow-md' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
            class="flex-1 py-1 text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <span>📜</span>
            <span class="truncate">流水账册 ({{ transactions.length }})</span>
          </button>
        </div>
      </nav>

      <!-- 3. Fixed 50/50 Split Screen Container (不允许滚动，左半屏原弹窗，右半屏九宫格数字键盘) -->
      <main class="flex-1 min-h-0 overflow-hidden flex gap-2.5 pt-0.5 pb-0.5">
        <!-- ======================================================== -->
        <!-- TAB 1: 手机号筹码互赠 (TRANSFER)                          -->
        <!-- ======================================================== -->
        <template v-if="activeTab === 'transfer'">
          <!-- 左半屏 (50% Width): 手机号、受赠人、转账数量与提交按钮 -->
          <div class="w-1/2 h-full flex flex-col justify-between p-2.5 rounded-2xl bg-[#FFFDF8] border border-[#D8C7B0] shadow-xs space-y-2 overflow-hidden">
            <div class="space-y-2 overflow-hidden flex-1 flex flex-col justify-around">
              <!-- Section A: 手机号 -->
              <div>
                <div class="text-[11px] font-bold text-[#3C2C1E] flex items-center justify-between mb-1">
                  <span class="flex items-center gap-1">
                    <span>📱</span> 茶友手机号
                  </span>
                  <span class="text-[9px] text-[#6B5744]">点击输入框聚焦右侧键盘</span>
                </div>

                <div
                  @click="activeFocusField = 'phone'"
                  :class="activeFocusField === 'phone' ? 'border-2 border-amber-600 bg-amber-50/90 ring-2 ring-amber-400/40 shadow-sm' : 'border border-[#D8C7B0] bg-[#FFFDF8]'"
                  class="px-3.5 py-2.5 min-h-[46px] rounded-xl text-[#3C2C1E] font-mono shadow-inner cursor-pointer transition-all flex items-center justify-between"
                >
                  <span v-if="searchPhone" class="font-black text-base sm:text-lg tracking-widest text-[#3C2C1E]">{{ searchPhone }}</span>
                  <span v-else class="text-gray-400 font-sans text-xs">点击右侧键盘输入手机号...</span>
                  <span v-if="activeFocusField === 'phone'" class="text-[10px] px-2 py-0.5 rounded-full bg-amber-600 text-white font-sans font-bold animate-pulse shrink-0 shadow-xs">输入中</span>
                </div>

                <div v-if="searchError" class="text-[10px] text-red-700 font-medium mt-1 p-1 bg-red-50 rounded-md border border-red-200 truncate">
                  {{ searchError }}
                </div>
              </div>

              <!-- Recipient Preview Card -->
              <div v-if="searchedUser" class="p-2 rounded-xl bg-[#FAF4E8] border border-amber-500/50 flex items-center justify-between shadow-xs">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-base p-1 rounded-lg bg-[#EFE5D3] border border-[#D8C7B0] shrink-0">{{ searchedUser.avatar || '👤' }}</span>
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-[#3C2C1E] flex items-center gap-1 truncate">
                      <span class="truncate">{{ searchedUser.name }}</span>
                      <span class="text-[8px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 font-mono font-bold shrink-0">LV.{{ searchedUser.level || 1 }}</span>
                    </div>
                    <div class="text-[9px] text-[#6B5744] font-mono truncate">手机: {{ searchedUser.phone }}</div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-[9px] text-[#6B5744]">对方结余</div>
                  <div class="text-xs font-mono font-bold text-[#5C4533]">{{ searchedUser.coins.toLocaleString() }}分</div>
                </div>
              </div>

              <!-- Section B: 转账数量 -->
              <div>
                <div class="text-[11px] font-bold text-[#3C2C1E] flex items-center justify-between mb-1">
                  <span class="flex items-center gap-1">
                    <span>🪙</span> 赠送筹码数量
                  </span>
                  <span class="text-[10px] text-[#6B5744] font-mono">
                    可用: <strong class="text-[#5C4533]">{{ userCoins.toLocaleString() }}分</strong>
                  </span>
                </div>

                <div
                  @click="activeFocusField = 'amount'"
                  :class="activeFocusField === 'amount' ? 'border-2 border-amber-600 bg-amber-50/90 ring-2 ring-amber-400/40 shadow-sm' : 'border border-[#D8C7B0] bg-[#FFFDF8]'"
                  class="px-3.5 py-2 min-h-[44px] rounded-xl text-[#3C2C1E] font-mono shadow-inner cursor-pointer transition-all flex items-center justify-between"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="text-amber-700 font-bold text-base">🪙</span>
                    <span class="font-black text-lg sm:text-xl text-[#5C4533] tracking-wider">{{ transferAmount ? transferAmount.toLocaleString() : 0 }}</span>
                    <span class="text-xs text-gray-500 font-sans font-bold">分</span>
                  </div>
                  <span v-if="activeFocusField === 'amount'" class="text-[10px] px-2 py-0.5 rounded-full bg-amber-600 text-white font-sans font-bold animate-pulse shrink-0 shadow-xs">输入中</span>
                </div>

                <!-- Quick Presets -->
                <div class="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                  <button
                    v-for="amt in [100, 500, 1000, 5000]"
                    :key="amt"
                    type="button"
                    @click="setTransferAmount(amt)"
                    :class="transferAmount === amt ? 'bg-[#5C4533] text-[#FAF4E8] font-bold border-[#7D6049]' : 'bg-[#EFE5D3] text-[#3C2C1E] border-[#D8C7B0] hover:bg-[#E5D7C2]'"
                    class="px-2 py-0.5 rounded-lg text-[10px] border transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    +{{ amt }}
                  </button>
                  <button
                    type="button"
                    @click="setTransferAmount(userCoins)"
                    :class="transferAmount === userCoins ? 'bg-[#5C4533] text-[#FAF4E8] font-bold border-[#7D6049]' : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'"
                    class="px-2 py-0.5 rounded-lg text-[10px] border transition-all active:scale-95 cursor-pointer font-bold shrink-0 ml-auto"
                  >
                    全部
                  </button>
                </div>

                <div v-if="transferMessage" class="text-[10px] font-bold p-1.5 rounded-lg flex items-center gap-1 truncate" :class="transferSuccess ? 'bg-emerald-100 border border-emerald-300 text-emerald-800' : 'bg-red-100 border border-red-300 text-red-800'">
                  <span>{{ transferSuccess ? '✅' : '⚠️' }}</span>
                  <span class="truncate">{{ transferMessage }}</span>
                </div>
              </div>
            </div>

            <!-- 左半屏底部动态操作按钮 -->
            <button
              v-if="!searchedUser"
              type="button"
              @click="searchUser"
              :disabled="!searchPhone || isSearching"
              :class="(!searchPhone || isSearching)
                ? 'bg-[#EFE5D3] text-[#8C755E] cursor-not-allowed border border-[#D8C7B0]'
                : 'bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold border border-amber-500 shadow-md active:scale-98 cursor-pointer'"
              class="w-full py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 truncate shrink-0"
            >
              <span class="text-sm">🔍</span>
              <span class="truncate">
                {{ isSearching ? '正在查找茶友...' : '查找茶友手机号' }}
              </span>
            </button>

            <button
              v-else
              type="button"
              @click="submitTransfer"
              :disabled="transferAmount <= 0 || isTransferring"
              :class="(transferAmount <= 0 || isTransferring)
                ? 'bg-[#EFE5D3] text-[#8C755E] cursor-not-allowed border border-[#D8C7B0]'
                : 'bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] border border-[#7D6049] font-bold shadow-md active:scale-98 cursor-pointer'"
              class="w-full py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 truncate shrink-0"
            >
              <span class="text-sm">💸</span>
              <span class="truncate">
                {{ isTransferring ? '处理中...' : `向 ${searchedUser.name} 赠送 ${transferAmount || 0} 分` }}
              </span>
            </button>
          </div>

          <!-- 右半屏 (50% Width): 九宫格屏幕数字键盘 (加粗特大字体) -->
          <div class="w-1/2 h-full flex flex-col justify-between p-2.5 rounded-2xl bg-[#FAF4E8] border border-amber-600/40 shadow-sm overflow-hidden">
            <!-- 键盘说明 -->
            <div class="flex items-center justify-between border-b border-amber-300/60 pb-1.5 shrink-0">
              <span class="text-xs font-bold text-amber-900 flex items-center gap-1">
                <span class="text-sm">⌨️</span> 屏幕数字键盘
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold border border-amber-300">
                {{ activeFocusField === 'phone' ? '输入目标: 📱 手机号' : '输入目标: 🪙 筹码数' }}
              </span>
            </div>

            <!-- 纯净特大加粗九宫格 Grid (3列 × 4行) -->
            <div class="grid grid-cols-3 gap-2 flex-1 py-1">
              <button
                v-for="k in ['1','2','3','4','5','6','7','8','9']"
                :key="k"
                type="button"
                @click="handleKeypadPress(k)"
                class="rounded-2xl bg-white hover:bg-amber-100/90 active:bg-amber-300/80 border-2 border-amber-700/30 hover:border-amber-600 text-xl sm:text-2xl font-black font-mono text-[#2A180E] shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center"
              >
                {{ k }}
              </button>

              <button
                type="button"
                @click="handleKeypadPress('CLEAR')"
                class="rounded-2xl bg-red-100 hover:bg-red-200 active:bg-red-300 border-2 border-red-300 text-sm font-black text-red-900 shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-0.5"
              >
                <span>🧹</span> 清空
              </button>
              <button
                type="button"
                @click="handleKeypadPress('0')"
                class="rounded-2xl bg-white hover:bg-amber-100/90 active:bg-amber-300/80 border-2 border-amber-700/30 hover:border-amber-600 text-xl sm:text-2xl font-black font-mono text-[#2A180E] shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                @click="handleKeypadPress('DEL')"
                class="rounded-2xl bg-amber-200/90 hover:bg-amber-300 active:bg-amber-400 border-2 border-amber-400 text-sm font-black text-amber-950 shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-0.5"
              >
                <span>⌫</span> 退格
              </button>
            </div>
          </div>
        </template>

        <!-- ======================================================== -->
        <!-- TAB 2: 收支流水明细 (LEDGER)                             -->
        <!-- ======================================================== -->
        <template v-else-if="activeTab === 'history'">
          <div class="w-full h-full flex flex-col justify-between p-2.5 rounded-2xl bg-[#FFFDF8] border border-[#D8C7B0] overflow-hidden space-y-2">
            <!-- Filter Pills -->
            <div class="flex items-center justify-between text-xs text-[#6B5744] shrink-0">
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="historyFilter = 'all'; historyPage = 0"
                  :class="historyFilter === 'all' ? 'bg-[#5C4533] text-[#FAF4E8] font-bold' : 'bg-[#FAF4E8] text-[#3C2C1E] border border-[#D8C7B0] hover:bg-[#EFE5D3]'"
                  class="px-2.5 py-1 rounded-lg cursor-pointer transition-colors text-[11px]"
                >
                  全部
                </button>
                <button
                  type="button"
                  @click="historyFilter = 'income'; historyPage = 0"
                  :class="historyFilter === 'income' ? 'bg-emerald-700 text-white font-bold' : 'bg-[#FAF4E8] text-[#3C2C1E] border border-[#D8C7B0] hover:bg-[#EFE5D3]'"
                  class="px-2.5 py-1 rounded-lg cursor-pointer transition-colors text-[11px]"
                >
                  收入
                </button>
                <button
                  type="button"
                  @click="historyFilter = 'expense'; historyPage = 0"
                  :class="historyFilter === 'expense' ? 'bg-rose-700 text-white font-bold' : 'bg-[#FAF4E8] text-[#3C2C1E] border border-[#D8C7B0] hover:bg-[#EFE5D3]'"
                  class="px-2.5 py-1 rounded-lg cursor-pointer transition-colors text-[11px]"
                >
                  支出
                </button>
              </div>
              <span class="text-[10px] font-mono">近 7 天共 {{ filteredTransactions.length }} 笔明细</span>
            </div>

            <!-- Transaction List (2-column layout to fit screen height) -->
            <div class="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden">
              <div v-if="filteredTransactions.length === 0" class="col-span-full py-8 text-center text-xs text-[#6B5744] bg-[#FFFDF8] rounded-2xl border border-dashed border-[#D8C7B0]">
                近 7 天暂无收支明细记录
              </div>
              <div
                v-for="tx in paginatedTransactions"
                :key="tx.id"
                class="px-3 py-2 rounded-xl bg-[#FAF4E8] border border-[#D8C7B0] flex items-center justify-between text-xs hover:border-[#5C4533] transition-colors shadow-xs h-fit"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-sm shrink-0">
                    {{ tx.amount >= 0 ? '🪙' : '💸' }}
                  </span>
                  <div class="min-w-0">
                    <div class="font-semibold text-[#3C2C1E] truncate text-[11px]">{{ tx.title }}</div>
                    <div class="text-[9px] text-[#6B5744] font-mono mt-0.5">{{ tx.timestamp }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0 text-right">
                  <span
                    :class="tx.amount >= 0 ? 'text-emerald-800' : 'text-rose-800'"
                    class="font-mono font-bold text-xs tabular-nums"
                  >
                    {{ tx.amount >= 0 ? `+${tx.amount}` : tx.amount }} 分
                  </span>
                </div>
              </div>
            </div>

            <!-- Ledger Pagination Bar -->
            <div class="flex items-center justify-between text-xs text-[#6B5744] pt-1 border-t border-[#D8C7B0] shrink-0">
              <span class="font-mono text-[11px]">第 {{ historyPage + 1 }} / {{ totalHistoryPages }} 页</span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="prevHistoryPage"
                  :disabled="historyPage === 0"
                  :class="historyPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#EFE5D3] text-[#3C2C1E] cursor-pointer'"
                  class="px-3 py-1 rounded-lg border border-[#D8C7B0] text-xs transition-colors bg-[#FFFDF8]"
                >
                  ◀ 上一页
                </button>
                <button
                  type="button"
                  @click="nextHistoryPage"
                  :disabled="historyPage >= totalHistoryPages - 1"
                  :class="historyPage >= totalHistoryPages - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#EFE5D3] text-[#3C2C1E] cursor-pointer'"
                  class="px-3 py-1 rounded-lg border border-[#D8C7B0] text-xs transition-colors bg-[#FFFDF8]"
                >
                  下一页 ▶
                </button>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { soundFX } from '../utils/sound';
import { resolveApiUrl } from '../utils/networkConfig';
import {
  saveLocalProfile,
  loadPointsTransactions,
  recordPointsTx,
  PointsTransaction,
} from '../utils/storage';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  coins: number;
  rating: number;
  avatar?: string;
  level?: number;
}

const props = withDefaults(defineProps<{
  profile: UserProfile;
  isRotated90?: boolean;
}>(), {
  isRotated90: true,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:profile', profile: UserProfile): void;
}>();

const activeTab = ref<'transfer' | 'history'>('transfer');
const activeFocusField = ref<'phone' | 'amount'>('phone');

const userCoins = computed(() => props.profile.coins || 0);
const userRating = computed(() => props.profile.rating || 1200);
const userLevel = computed(() => Math.max(1, Math.floor(userRating.value / 400)));

// Transfer State
const searchPhone = ref('');
const searchError = ref('');
const searchedUser = ref<UserProfile | null>(null);
const transferAmount = ref<number>(500);
const transferMessage = ref('');
const transferSuccess = ref(false);
const isSearching = ref(false);
const isTransferring = ref(false);

function setTransferAmount(amt: number) {
  transferAmount.value = amt;
  soundFX.playTap();
}

function handleKeypadPress(key: string) {
  soundFX.playTap();

  if (activeFocusField.value === 'phone') {
    if (key === 'DEL') {
      searchPhone.value = searchPhone.value.slice(0, -1);
    } else if (key === 'CLEAR') {
      searchPhone.value = '';
    } else if (key === 'SEARCH') {
      searchUser();
    } else if (key.startsWith('+')) {
      // Ignore preset additions on phone field
    } else {
      if (searchPhone.value.length < 11) {
        searchPhone.value += key;
      }
    }
  } else if (activeFocusField.value === 'amount') {
    if (key === 'DEL') {
      transferAmount.value = Math.floor((transferAmount.value || 0) / 10);
    } else if (key === 'CLEAR') {
      transferAmount.value = 0;
    } else if (key === 'SEARCH') {
      submitTransfer();
    } else if (key.startsWith('+')) {
      const addVal = parseInt(key.replace('+', ''), 10) || 0;
      transferAmount.value = Math.min(userCoins.value, (transferAmount.value || 0) + addVal);
    } else {
      const currentStr = String(transferAmount.value || 0);
      const newStr = (currentStr === '0' ? '' : currentStr) + key;
      const parsed = parseInt(newStr, 10) || 0;
      transferAmount.value = Math.min(userCoins.value, parsed);
    }
  }
}

async function searchUser() {
  const p = searchPhone.value.trim().replace(/\D/g, '');
  if (!p) {
    searchError.value = '请输入要查找的手机号';
    searchedUser.value = null;
    return;
  }

  const myPhone = String(props.profile.phone || '').trim().replace(/\D/g, '');
  if (myPhone && p === myPhone) {
    searchError.value = '不能向自己的手机号赠送筹码';
    searchedUser.value = null;
    soundFX.playTap();
    return;
  }

  isSearching.value = true;
  searchError.value = '';
  transferMessage.value = '';

  try {
    const res = await fetch(resolveApiUrl(`/api/users/search?phone=${encodeURIComponent(p)}`));
    const data = await res.json();
    if (data && data.success && data.user) {
      searchedUser.value = {
        id: data.user.id,
        name: data.user.name || `茶客${p.slice(-4)}`,
        phone: data.user.phone || p,
        coins: typeof data.user.coins === 'number' ? data.user.coins : 0,
        rating: data.user.rating || 1800,
        avatar: data.user.avatar || '👤',
        level: data.user.level || 1,
      };
      activeFocusField.value = 'amount'; // Auto focus amount field after successful user search!
      soundFX.playTap();
    } else {
      searchedUser.value = null;
      searchError.value = (data && data.error) || '未找到该手机号对应的茶客，请确认手机号是否正确';
      soundFX.playTap();
    }
  } catch (err) {
    searchedUser.value = null;
    searchError.value = '网络连接异常，未能连接到钱庄服务，请检查网络';
  } finally {
    isSearching.value = false;
  }
}

const userKey = computed(() => props.profile.phone || props.profile.id);

const transactions = ref<PointsTransaction[]>(loadPointsTransactions(userKey.value));

onMounted(() => {
  transactions.value = loadPointsTransactions(userKey.value);
});

watch(
  [() => props.profile.coins, () => userKey.value],
  () => {
    transactions.value = loadPointsTransactions(userKey.value);
  }
);

async function submitTransfer() {
  if (!searchedUser.value || transferAmount.value <= 0 || isTransferring.value) return;
  if (transferAmount.value > userCoins.value) {
    transferMessage.value = '持有筹码不足，转账失败！';
    transferSuccess.value = false;
    soundFX.playTap();
    return;
  }

  const amt = transferAmount.value;
  isTransferring.value = true;
  transferMessage.value = '';

  try {
    const res = await fetch(resolveApiUrl('/api/points/transfer'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: props.profile.id,
        senderPhone: props.profile.phone,
        recipientId: searchedUser.value.id,
        recipientPhone: searchedUser.value.phone,
        amount: amt,
        clientCoins: userCoins.value,
      }),
    });
    const data = await res.json();
    if (!data || !data.success) {
      transferMessage.value = (data && data.error) || '赠送筹码失败，请重试';
      transferSuccess.value = false;
      soundFX.playTap();
      return;
    }

    const newCoins = typeof data.senderCoins === 'number' ? data.senderCoins : (userCoins.value - amt);
    const updated: UserProfile = { ...props.profile, coins: newCoins };
    saveLocalProfile(updated);
    emit('update:profile', updated);

    if (typeof data.recipientCoins === 'number') {
      searchedUser.value.coins = data.recipientCoins;
    }

    recordPointsTx('transfer_out', `向 ${searchedUser.value.name} (${searchedUser.value.phone}) 赠送筹码`, -amt, newCoins, userKey.value);
    transactions.value = loadPointsTransactions(userKey.value);

    transferMessage.value = `成功向 ${searchedUser.value.name} 赠送 ${amt.toLocaleString()} 分筹码！对方已实时到账。`;
    transferSuccess.value = true;
    soundFX.playVictory();
    transferAmount.value = 500;
  } catch (err) {
    transferMessage.value = '赠送请求网络超时或服务异常，请重试';
    transferSuccess.value = false;
    soundFX.playTap();
  } finally {
    isTransferring.value = false;
  }
}

// History & Ledger Filtering
const historyFilter = ref<'all' | 'income' | 'expense'>('all');
const historyPage = ref(0);
const pageSize = ref(6);

const filteredTransactions = computed(() => {
  return transactions.value.filter((tx) => {
    if (historyFilter.value === 'income') return tx.amount > 0;
    if (historyFilter.value === 'expense') return tx.amount < 0;
    return true;
  });
});

const totalHistoryPages = computed(() => {
  return Math.max(1, Math.ceil(filteredTransactions.value.length / pageSize.value));
});

const paginatedTransactions = computed(() => {
  const start = historyPage.value * pageSize.value;
  return filteredTransactions.value.slice(start, start + pageSize.value);
});

function prevHistoryPage() {
  if (historyPage.value > 0) historyPage.value--;
}

function nextHistoryPage() {
  if (historyPage.value < totalHistoryPages.value - 1) historyPage.value++;
}
</script>

<style scoped>
.points-modal-rotated-full {
  position: fixed;
  top: 0;
  left: 0;
  width: 100dvh;
  height: 100dvw;
  transform-origin: 0 0;
  transform: rotate(90deg) translateY(-100%);
  z-index: 120;
  background-color: #FAF4E8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.points-modal-standard-full {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 120;
  background-color: #FAF4E8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
