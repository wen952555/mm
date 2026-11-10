<template>
  <div
    class="relative w-full h-full flex flex-col justify-between select-none overflow-hidden"
    :style="{
      backgroundColor: props.tableTheme.feltColor,
      background: `radial-gradient(ellipse at 50% 45%, ${props.tableTheme.highlightColor || props.tableTheme.feltColor} 0%, ${props.tableTheme.feltColor} 55%, ${props.tableTheme.edgeColor || '#140A07'} 100%)`
    }"
  >
    <!-- Background Ambient Lantern Light & Damask Texture Overlay -->
    <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,220,150,0.15)_0%,rgba(0,0,0,0.35)_75%)] z-1"></div>

    <!-- Outer Table Rosewood Bezel & Golden Corner Brackets -->
    <div class="absolute inset-1 sm:inset-2.5 rounded-[28px] sm:rounded-[36px] border-[5px] sm:border-[8px] border-[#2A140B] shadow-[inset_0_0_60px_rgba(0,0,0,0.85),0_15px_40px_rgba(0,0,0,0.9)] pointer-events-none z-20 flex flex-col justify-between p-2">
      <div class="flex justify-between w-full">
        <span class="text-amber-500/40 text-xs sm:text-sm font-mono">╔</span>
        <span class="text-amber-500/40 text-xs sm:text-sm font-mono">╗</span>
      </div>
      <div class="flex justify-between w-full">
        <span class="text-amber-500/40 text-xs sm:text-sm font-mono">╚</span>
        <span class="text-amber-500/40 text-xs sm:text-sm font-mono">╝</span>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TOP HEADER BAR                                           -->
    <!-- ======================================================== -->
    <header class="relative z-30 w-full px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between border-b border-amber-500/20 bg-gradient-to-r from-black/85 via-[#1A0E08]/90 to-black/85 backdrop-blur-md shrink-0 shadow-lg">
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Return / Leave Button -->
        <button
          type="button"
          @click="onLeave"
          class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#E6DEC8] hover:text-white text-xs font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer border border-white/10 shadow-sm"
          title="退出等候室并返回大厅"
        >
          <span>🚪</span>
          <span class="hidden sm:inline">退出等候</span>
          <span class="sm:hidden">退出</span>
        </button>

        <button
          type="button"
          @click="$emit('change-scene')"
          class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700/40 to-amber-600/40 hover:from-amber-700/60 hover:to-amber-600/60 text-amber-200 text-xs font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer border border-amber-500/40 shadow-sm"
          title="更换其他玩法场景"
        >
          <span>🔄</span>
          <span>换场</span>
        </button>

        <!-- Game & Scene Title Tag / Voice Broadcast (左上角展示；语音播放中时暂时遮挡场景名称，播放结束后自动恢复，绝不遮挡中央牌桌与牌型) -->
        <div class="flex items-center ml-1 min-h-[36px]">
          <!-- Normal Scene Display (when no voice is currently playing) -->
          <div v-if="!activePlayingVoice" class="flex items-center gap-2 transition-all">
            <span class="text-xl sm:text-2xl filter drop-shadow">{{ gameIcon }}</span>
            <div>
              <div class="flex items-center gap-1.5 sm:gap-2">
                <h2 class="text-xs sm:text-sm md:text-base font-black text-white font-serif-title drop-shadow truncate">
                  {{ gameName }} · {{ sceneDisplayName }}
                </h2>
                <span class="px-2 py-0.2 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 text-[9px] sm:text-[10px] font-mono font-bold whitespace-nowrap">
                  🛡️ 纯真人对弈
                </span>
              </div>
              <div class="text-[9px] sm:text-[10px] text-amber-200/80 font-mono flex items-center gap-1.5 sm:gap-2">
                <span>🪙 {{ gameType === 'yansan' ? '准入: 100 分' : `底分准入: ${baseStake} 分` }}</span>
                <span>•</span>
                <span>满座 {{ maxPlayers }} 人自动开局</span>
              </div>
            </div>
          </div>

          <!-- Real-Time Voice Broadcast Banner (显示在左上角暂时遮挡游戏场景名称，播放完毕后自动恢复，避免遮挡牌桌牌面) -->
          <div
            v-else
            class="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/95 via-black/95 to-emerald-950/95 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.7)] backdrop-blur-md animate-pulse z-40"
          >
            <span class="text-emerald-400 text-sm animate-bounce">🔊</span>
            <span class="text-xs sm:text-sm font-black text-amber-300 font-serif-title truncate max-w-[100px] sm:max-w-[150px]">{{ activePlayingVoice.sender }}</span>
            <span class="text-[11px] sm:text-xs text-[#E6DEC8] whitespace-nowrap">语音广播中 ({{ activePlayingVoice.duration }}s)</span>
            <div class="flex items-center gap-0.5 h-3 pl-1">
              <span class="w-1 bg-emerald-400 rounded-full h-2 animate-pulse"></span>
              <span class="w-1 bg-emerald-300 rounded-full h-3 animate-pulse"></span>
              <span class="w-1 bg-emerald-400 rounded-full h-1.5 animate-pulse"></span>
              <span class="w-1 bg-emerald-300 rounded-full h-2.5 animate-pulse"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Mic, Quick Test & Connection Status -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- Voice Mic & Push-to-Send Button (语音聊天，始终可见) -->
        <div class="relative flex items-center shrink-0">
          <button
            v-if="!isRecordingVoice"
            type="button"
            @click="startVoiceRecording"
            class="px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-amber-950/80 via-black/80 to-amber-950/80 hover:bg-black/90 border border-amber-500/60 hover:border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition-all shrink-0"
            title="点击开始语音聊天录音 (最长20秒，发送后全员收听)"
          >
            <span>🎙️</span>
            <span>语音聊天</span>
          </button>
          <div v-else class="flex items-center gap-1 shrink-0">
            <button
              type="button"
              @click="stopAndSendVoiceRecording"
              class="px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 border border-red-300 text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/50 animate-pulse active:scale-95 cursor-pointer transition-all whitespace-nowrap"
              title="点击发送语音，或20秒倒计时结束自动发送"
            >
              <span class="w-2 h-2 rounded-full bg-white animate-ping shrink-0"></span>
              <span>点击发送语音 ({{ 20 - recordingSeconds }}s)</span>
            </button>
            <button
              type="button"
              @click="cancelVoiceRecording"
              class="w-5 h-5 rounded-lg bg-black/80 hover:bg-black border border-white/20 text-[#D8C7B5] hover:text-white text-[9px] flex items-center justify-center cursor-pointer shrink-0"
              title="取消录音"
            >
              ✕
            </button>
          </div>

          <!-- Mic Permission / Error Prompt Popover -->
          <div
            v-if="micErrorTip"
            class="absolute top-9 right-0 z-50 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-950 via-stone-900 to-red-950 border border-red-400 text-red-200 text-[10px] font-bold shadow-2xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap animate-bounce"
          >
            <span>⚠️</span>
            <span>{{ micErrorTip }}</span>
            <button
              type="button"
              @click="micErrorTip = ''"
              class="w-4 h-4 rounded bg-white/20 text-white flex items-center justify-center text-[9px] cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Exit Practice Mode Button (单机试玩模式专享：替换麦克风按钮为退出试玩) -->
        <button
          v-if="props.isPracticeMode"
          type="button"
          @click="onLeave"
          class="px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-red-700 via-rose-600 to-red-600 hover:from-red-600 hover:to-rose-500 border border-red-400/60 text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-md active:scale-95 cursor-pointer transition-all shrink-0"
          title="退出单机试玩模式返回大厅"
        >
          <span>🚪</span>
          <span>退出试玩</span>
        </button>

        <!-- Connection ping -->
        <div class="px-2.5 py-1 rounded-xl bg-black/60 border border-emerald-500/30 text-[10px] sm:text-xs font-mono text-emerald-400 flex items-center gap-1.5 shrink-0 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="font-bold">{{ props.isPracticeMode ? '🎮 单机免服试玩' : '纯真人连线匹配' }}</span>
        </div>
      </div>
    </header>

    <!-- ======================================================== -->
    <!-- CENTER TABLE STAGE: WAITING SEATS DISPLAY                 -->
    <!-- ======================================================== -->
    <main class="relative z-10 flex-1 w-full max-w-[1100px] mx-auto p-2 sm:p-4 flex flex-col items-center justify-between min-h-0">
      <!-- Shisanshui Booking Train Direct Launch Banner -->
      <div
        v-if="props.gameType === 'shisanshui' && (props.sceneMode === 'four-booking' || props.sceneMode === 'eight-booking')"
        class="w-full max-w-xl mx-auto px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-950/90 via-black/90 to-amber-950/90 border border-amber-500/60 shadow-xl flex items-center justify-between gap-3 text-xs mb-1"
      >
        <div class="flex items-center gap-2">
          <span class="text-xl animate-pulse">🚂</span>
          <div>
            <div class="font-bold text-amber-300">十三张预约场为火车专列模式（每日06:00统一比水结算）</div>
            <div class="text-[10px] text-stone-300">无需等待其他牌友同时在线，您可以随时进入车厢选位出战10张牌桌！</div>
          </div>
        </div>
        <button
          type="button"
          @click="onDirectLaunchBooking"
          class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-black shadow-md cursor-pointer active:scale-95 transition-all whitespace-nowrap"
        >
          立即登车理牌 →
        </button>
      </div>

      <!-- Top Banner: Status & Seat Countdown Progress -->
      <div class="w-full max-w-xl mx-auto flex flex-col items-center gap-1 shrink-0 my-0.5">
        <div class="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-black/85 via-[#1E110A]/90 to-black/85 border border-amber-500/50 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 w-full">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="text-lg animate-bounce shrink-0">{{ isStarting ? '🚀' : '🍵' }}</span>
            <div class="text-left min-w-0">
              <div class="text-xs sm:text-sm font-black text-amber-300 font-serif-title tracking-wide truncate">
                {{ isStarting ? `🎉 全员满座 (${Math.min(currentPlayers.length, maxPlayers)}/${maxPlayers})！牌局即将自动开启` : `正在等待牌友选择相同场景入座 (${Math.min(currentPlayers.length, maxPlayers)}/${maxPlayers})` }}
              </div>
              <div class="text-[9px] sm:text-[10px] text-[#D4C3B3] font-mono mt-0.5 truncate">
                {{ isStarting ? `各席位已就位，倒计时 ${countdownSeconds} 秒后发牌...` : (props.isPracticeMode && autoMatchSeconds > 0 ? `试玩模式匹配中 · ${autoMatchSeconds}秒后自动补齐人机` : '纯真人实时排队匹配 · 满座即刻自动开战') }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <!-- 补齐人机开局按钮（仅在试玩模式下显示，真实玩家对局严禁人机补位） -->
            <button
              v-if="props.isPracticeMode && !isStarting && currentPlayers.length < maxPlayers"
              type="button"
              @click="triggerQuickMatch"
              class="px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs shadow-md border border-yellow-300 active:scale-95 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 animate-pulse"
              title="试玩模式：立即补齐人机席位并自动开局"
            >
              <span>⚡</span>
              <span>补齐人机开局</span>
            </button>
            <span class="px-2.5 py-0.5 rounded-lg bg-amber-500/25 text-amber-300 font-mono font-bold text-xs border border-amber-400/40">
              {{ Math.min(currentPlayers.length, maxPlayers) }} / {{ maxPlayers }}
            </span>
          </div>
        </div>

        <!-- Visual Progress Meter -->
        <div class="w-64 sm:w-80 h-2 bg-black/60 rounded-full overflow-hidden border border-white/15 p-0.5 shadow-inner">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="isStarting ? 'bg-gradient-to-r from-amber-400 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-gradient-to-r from-amber-600 to-amber-400'"
            :style="{ width: `${(Math.min(currentPlayers.length, maxPlayers) / maxPlayers) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Center Ornate Table Felt Area -->
      <div class="relative w-full flex-1 flex items-center justify-center min-h-0 my-0.5">
        <!-- 4-Seat Layout (For Yansan, Mahjong, and 4-Player Shisanshui) -->
        <div v-if="maxPlayers === 4" class="relative w-full max-w-3xl h-full max-h-[380px] flex items-center justify-center">
          <!-- Center Tablepiece: 聚宝台 -->
          <div class="absolute inset-x-0 inset-y-0 m-auto w-52 h-36 sm:w-60 sm:h-40 rounded-full bg-gradient-to-b from-[#FFFDF8] via-[#F4ECE0] to-[#EBE0D0] border-4 border-[#D8C7B0] shadow-md flex flex-col items-center justify-center p-3 text-center pointer-events-none">
            <!-- Concentric Bezel Accent -->
            <div class="absolute inset-1.5 rounded-full border border-[#D8C7B0]"></div>

            <span class="text-2xl sm:text-3xl filter drop-shadow-xs mb-0.5">{{ gameIcon }}</span>
            <span class="text-xs sm:text-sm font-black font-serif-title text-[#3C2C1E] tracking-wider">
              {{ sceneDisplayName }}
            </span>
            <span class="text-[9px] sm:text-[10px] text-[#6B5744] font-mono mt-0.5">
              {{ isStarting ? '即将发牌起牌 ➔' : `等待满座 ${maxPlayers} 人开局` }}
            </span>

            <!-- 4 Seat Jade Jewels Status Indicator -->
            <div class="flex items-center gap-2 mt-1.5">
              <template v-for="sIdx in 4" :key="sIdx">
                <span
                  class="w-2.5 h-2.5 rounded-full border transition-all"
                  :class="
                    getPlayerAtSeat(sIdx - 1)
                      ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.9)] scale-110'
                      : 'bg-[#2A180E] border-amber-500/40 opacity-70 animate-pulse'
                  "
                  :title="`席位 ${sIdx}: ${getPlayerAtSeat(sIdx - 1) ? '已入座' : '虚席'}`"
                ></span>
              </template>
            </div>
          </div>

          <!-- Seat 2: Top (North) -->
          <div class="absolute top-0 left-1/2 -translate-x-1/2">
            <SeatCard
              :seat-index="2"
              seat-label="北席"
              :player="getPlayerAtSeat(2)"
              :is-current-user="isPlayerMe(getPlayerAtSeat(2))"
            />
          </div>

          <!-- Seat 3: Left (West) -->
          <div class="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2">
            <SeatCard
              :seat-index="3"
              seat-label="西席"
              :player="getPlayerAtSeat(3)"
              :is-current-user="isPlayerMe(getPlayerAtSeat(3))"
            />
          </div>

          <!-- Seat 1: Right (East) -->
          <div class="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2">
            <SeatCard
              :seat-index="1"
              seat-label="东席"
              :player="getPlayerAtSeat(1)"
              :is-current-user="isPlayerMe(getPlayerAtSeat(1))"
            />
          </div>

          <!-- Seat 0: Bottom (South - Usually Current Player) -->
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2">
            <SeatCard
              :seat-index="0"
              seat-label="本家席位 (您)"
              :player="getPlayerAtSeat(0)"
              :is-current-user="isPlayerMe(getPlayerAtSeat(0))"
            />
          </div>
        </div>

        <!-- 8-Seat Layout (For 8-Player Shisanshui) -->
        <div v-else class="relative w-full max-w-4xl h-full max-h-[380px] grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 p-2 items-center justify-items-center">
          <template v-for="sIdx in 8" :key="sIdx">
            <SeatCard
              :seat-index="sIdx - 1"
              :seat-label="`席位 ${sIdx}`"
              :player="getPlayerAtSeat(sIdx - 1)"
              :is-current-user="isPlayerMe(getPlayerAtSeat(sIdx - 1))"
              :compact="true"
            />
          </template>
        </div>

        <!-- Insufficient Points Sitting Notice Overlay (积分不足不允许入座提示) -->
        <div
          v-if="isCoinsInsufficient"
          class="absolute inset-0 z-35 flex items-center justify-center p-3 pointer-events-auto bg-black/70 backdrop-blur-xs"
        >
          <div class="max-w-md w-full p-4 sm:p-5 rounded-3xl bg-[#1C120C]/95 border-2 border-amber-500/70 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-md text-center space-y-3 text-[#F5EFE6]">
            <div class="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/60 mx-auto flex items-center justify-center text-2xl text-amber-300">
              🪙
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-amber-200 font-serif-title">
                可用积分不足，暂不允许入座真实对战
              </h3>
              <p class="text-xs text-[#D8C7B5] mt-1">
                本场准入要求 <strong class="text-amber-300 font-mono">{{ baseStake }}</strong> 分，您当前结余 <strong class="text-rose-400 font-mono">{{ currentUser.coins }}</strong> 分。
              </p>
            </div>
            <div class="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed text-left">
              💡 <strong>温馨提示</strong>：联机等候室为纯真人对战，您可前往钱庄管理筹码；若想免积分练习，可随时在首页顶栏选择<strong>「单机试玩」</strong>。
            </div>
            <div class="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                @click="onLeave"
                class="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-[#C4B5A5] cursor-pointer transition-all active:scale-95"
              >
                退出等候
              </button>
              <button
                type="button"
                @click="$emit('open-points')"
                class="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-xs text-white font-bold cursor-pointer shadow-md transition-all active:scale-95"
              >
                前往钱庄 →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Interactive Greetings & Tea Bar -->
      <div class="w-full max-w-2xl mx-auto flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-2xl bg-gradient-to-r from-black/85 via-[#1A0E08]/90 to-black/85 border border-amber-500/25 backdrop-blur-md shrink-0 shadow-lg">
        <div class="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
          <span class="text-[11px] text-amber-300/80 font-serif-title whitespace-nowrap pl-1">🍵 迎客奉茶：</span>
          <button
            v-for="phrase in WAITING_GREETINGS"
            :key="phrase"
            type="button"
            @click="sendWaitingGreeting(phrase)"
            class="px-2.5 py-1 rounded-xl bg-[#28150C] hover:bg-[#3D2013] border border-amber-500/30 text-amber-200 text-[11px] whitespace-nowrap transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            {{ phrase }}
          </button>
        </div>

        <!-- Active speech bubble preview -->
        <div v-if="lastGreetingText" class="text-xs text-amber-300 font-medium px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-500/40 truncate max-w-xs animate-pulse">
          {{ lastGreetingText }}
        </div>
      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import SeatCard from './waiting/SeatCard.vue';
import { UserProfile } from '../utils/storage';
import { TableTheme } from '../utils/theme';
import { soundFX } from '../utils/sound';
import { generateRoomDeal } from '../gameDeckService';
import { createYansanDeal } from '../games/yansan/deck';

export interface ScenePlayer {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  coins: number;
  seat: number;
  isSimulated?: boolean;
}

const props = defineProps<{
  gameType: 'yansan' | 'shisanshui' | 'mahjong';
  sceneMode: string;
  sceneName: string;
  baseStake: number;
  maxPlayers: number;
  currentUser: UserProfile;
  ws: WebSocket | null;
  wsConnected: boolean;
  tableTheme: TableTheme;
  isRotated90: boolean;
  isPracticeMode?: boolean;
}>();

const emit = defineEmits<{
  (e: 'leave'): void;
  (e: 'change-scene'): void;
  (e: 'start-game', players: ScenePlayer[], roomId?: string, deal?: any): void;
  (e: 'open-points'): void;
}>();

// Current active room & players waiting in this scene
const currentRoomId = ref('');
const currentRoomDeal = ref<any>(null);
const currentPlayers = ref<ScenePlayer[]>([]);
const isStarting = ref(false);
const countdownSeconds = ref(3);
let countdownTimer: any = null;
const autoMatchSeconds = ref(6);
let autoMatchTimer: any = null;
const lastGreetingText = ref('');
let greetingTimer: any = null;

// Voice recording & broadcast state (最长20秒，发送后全员收听)
const isRecordingVoice = ref(false);
const recordingSeconds = ref(0);
const activePlayingVoice = ref<{ sender: string; duration: number } | null>(null);
const micErrorTip = ref('');
let micErrorTimer: any = null;
let voiceRecorder: MediaRecorder | null = null;
let voiceStream: MediaStream | null = null;
let recordingAudioCtx: any = null;
let voiceChunks: Blob[] = [];
let recordingInterval: any = null;
let activePlayingAudio: HTMLAudioElement | null = null;

const isCoinsInsufficient = computed(() => (props.currentUser.coins || 0) < props.baseStake);

function onDirectLaunchBooking() {
  soundFX.playCardSnap?.();
  emit('start-game', [{
    id: props.currentUser.id,
    name: props.currentUser.name,
    avatar: props.currentUser.avatar,
    rating: props.currentUser.rating,
    coins: props.currentUser.coins,
    seat: 0,
  }]);
}


const WAITING_GREETINGS = [
  '🍵 各位客官上座，慢用香茗！',
  '👏 今日雀友齐聚，幸会幸会！',
  '🏮 满座即刻开打，严阵以待！',
  '🔥 顺子在手，随时准备出招！',
  '👑 牌桌之上，全凭真功夫！',
];

const gameName = computed(() => {
  if (props.gameType === 'mahjong') return '经典麻将';
  if (props.gameType === 'shisanshui') return '水镜十三张';
  return '经典烟三';
});

const gameIcon = computed(() => {
  if (props.gameType === 'mahjong') return '🀄';
  if (props.gameType === 'shisanshui') return '💎';
  return '🔥';
});

const sceneDisplayName = computed(() => {
  return props.sceneName || '经典对局场';
});

function getPlayerAtSeat(seatIndex: number): ScenePlayer | null {
  return currentPlayers.value.find((p) => p.seat === seatIndex) || null;
}

function isPlayerMe(p: ScenePlayer | null): boolean {
  if (!p) return false;
  return p.id === props.currentUser.id || p.name === props.currentUser.name;
}

function onLeave() {
  if (props.ws && props.ws.readyState === WebSocket.OPEN) {
    try {
      props.ws.send(JSON.stringify({
        type: 'scene_leave',
        gameType: props.gameType,
        sceneMode: props.sceneMode,
        playerId: props.currentUser.id,
      }));
    } catch {}
  }
  emit('leave');
}

function sendWaitingGreeting(text: string) {
  lastGreetingText.value = `${props.currentUser.name}: ${text}`;
  soundFX.playTap();
  if (greetingTimer) clearTimeout(greetingTimer);
  greetingTimer = setTimeout(() => {
    lastGreetingText.value = '';
  }, 4000);

  if (props.ws && props.ws.readyState === WebSocket.OPEN) {
    try {
      props.ws.send(JSON.stringify({
        type: 'scene_chat',
        gameType: props.gameType,
        sceneMode: props.sceneMode,
        sender: props.currentUser.name,
        text,
      }));
    } catch {}
  }
}


let hasGameLaunched = false;

function launchGameNow(dealOverride?: any) {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  const dealToUse = dealOverride || currentRoomDeal.value;
  if (dealToUse) {
    currentRoomDeal.value = dealToUse;
  }
  if (!hasGameLaunched) {
    hasGameLaunched = true;
    soundFX.playVictory?.();
  }
  isStarting.value = true;
  emit('start-game', [...currentPlayers.value], currentRoomId.value, dealToUse);
}

function triggerAutoStartCountdown(dealOverride?: any) {
  if (dealOverride) {
    currentRoomDeal.value = dealOverride;
  }
  if (hasGameLaunched) return;
  if (isStarting.value && countdownTimer) return;
  isStarting.value = true;
  countdownSeconds.value = 2;
  soundFX.playVictory?.();
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdownSeconds.value--;
    if (countdownSeconds.value <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      launchGameNow();
    }
  }, 1000);
}

function startAutoMatchCountdown() {
  // 真实玩家入座严禁人机补位，仅试玩模式支持自动补齐人机
  if (!props.isPracticeMode) return;
  if (autoMatchTimer) clearInterval(autoMatchTimer);
  autoMatchSeconds.value = 6;
  autoMatchTimer = setInterval(() => {
    if (isStarting.value || currentPlayers.value.length >= props.maxPlayers) {
      clearInterval(autoMatchTimer);
      autoMatchTimer = null;
      return;
    }
    autoMatchSeconds.value--;
    if (autoMatchSeconds.value <= 0) {
      clearInterval(autoMatchTimer);
      autoMatchTimer = null;
      triggerQuickMatch();
    }
  }, 1000);
}

function triggerQuickMatch() {
  if (isStarting.value || currentPlayers.value.length >= props.maxPlayers) return;
  // 严格要求：只有试玩模式允许人机补位，真实玩家进入游戏严禁人机补位！
  if (!props.isPracticeMode) {
    console.warn('⛔ 真实玩家对局严禁人机补位，仅允许全真人排队！');
    return;
  }
  soundFX.playTap();

  if (autoMatchTimer) {
    clearInterval(autoMatchTimer);
    autoMatchTimer = null;
  }

  // 试玩/单机模式进行本地人机补位
  if (props.ws && props.ws.readyState === WebSocket.OPEN) {
    try {
      props.ws.send(JSON.stringify({
        type: 'scene_fill_bots',
        roomId: currentRoomId.value,
        gameType: props.gameType,
        sceneMode: props.sceneMode,
      }));
    } catch {}
  }

  const existingSeats = new Set(currentPlayers.value.map((p) => p.seat));
  const newPlayers = [...currentPlayers.value];
  let botCounter = 1;

  for (let s = 0; s < props.maxPlayers; s++) {
    if (!existingSeats.has(s)) {
      newPlayers.push({
        id: `BOT-${props.gameType}-${s}`,
        name: `人机${botCounter}`,
        avatar: '🤖',
        rating: 1880 + Math.floor(Math.random() * 150),
        coins: 3000 + Math.floor(Math.random() * 2000),
        seat: s,
        isSimulated: true,
      });
      botCounter++;
      existingSeats.add(s);
    }
  }

  currentPlayers.value = newPlayers.sort((a, b) => a.seat - b.seat);

  let deal = currentRoomDeal.value;
  if (!deal) {
    if (props.gameType === 'yansan') {
      deal = createYansanDeal();
    } else {
      deal = generateRoomDeal(props.gameType, props.sceneMode, props.maxPlayers);
    }
    currentRoomDeal.value = deal;
  }
  triggerAutoStartCountdown(deal);
}

// Join scene on WebSocket
function joinSceneQueue() {
  // If coins are insufficient for baseStake准入, do NOT sit in seat 0 of real queue
  if (isCoinsInsufficient.value) {
    currentPlayers.value = [];
    return;
  }

  // Add self to local list first as seat 0
  const safeAvatar = (props.currentUser.avatar && props.currentUser.avatar !== '🀄') ? props.currentUser.avatar : '👑';
  const myPlayer: ScenePlayer = {
    id: props.currentUser.id || `P-${Date.now()}`,
    name: props.currentUser.name || '茗局雅客',
    avatar: safeAvatar,
    rating: props.currentUser.rating || 1900,
    coins: props.currentUser.coins || 3000,
    seat: 0,
  };
  currentPlayers.value = [myPlayer];

  if (props.ws && props.ws.readyState === WebSocket.OPEN) {
    try {
      props.ws.send(JSON.stringify({
        type: 'scene_join',
        gameType: props.gameType,
        sceneMode: props.sceneMode,
        sceneName: props.sceneName,
        maxPlayers: props.maxPlayers,
        player: myPlayer,
      }));
    } catch {}
  }
}

// ========================================================
// VOICE RECORDING & BROADCAST (20s Auto-Send or Push-to-Send)
// ========================================================
async function acquireMicrophoneMediaStream(): Promise<MediaStream> {
  // 1. 优先使用现代标准的 navigator.mediaDevices.getUserMedia (支持降噪与增益)
  if (navigator?.mediaDevices?.getUserMedia) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (e1) {
      console.warn('Advanced constraints not supported, fallback to basic audio: true', e1);
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    }
  }

  // 2. 兼容较旧系统或部分安卓机型 WebView 的前缀方法
  const legacyGetUserMedia =
    (navigator as any).getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia ||
    (navigator as any).msGetUserMedia;

  if (legacyGetUserMedia) {
    return new Promise((resolve, reject) => {
      legacyGetUserMedia.call(navigator, { audio: true }, resolve, reject);
    });
  }

  throw new Error('当前系统 WebView 或浏览器环境不支持录音功能');
}

async function startVoiceRecording() {
  if (isRecordingVoice.value) return;
  micErrorTip.value = '';
  try {
    const stream = await acquireMicrophoneMediaStream();
    voiceStream = stream;

    // Web Audio API 前级放大 + 动态压缩：增强人声响度 3.5 倍，同时防止近麦爆音
    let recordStream: MediaStream = stream;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const actx = new AudioContextClass();
        if (actx.state === 'suspended') {
          await actx.resume().catch(() => {});
        }
        recordingAudioCtx = actx;
        const sourceNode = actx.createMediaStreamSource(stream);
        const gainNode = actx.createGain();
        gainNode.gain.value = 3.5; // 350% 录音增益放大

        const compressor = actx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, actx.currentTime);
        compressor.knee.setValueAtTime(30, actx.currentTime);
        compressor.ratio.setValueAtTime(12, actx.currentTime);
        compressor.attack.setValueAtTime(0.003, actx.currentTime);
        compressor.release.setValueAtTime(0.25, actx.currentTime);

        sourceNode.connect(gainNode);
        gainNode.connect(compressor);

        const destNode = actx.createMediaStreamDestination();
        compressor.connect(destNode);
        if (destNode.stream && destNode.stream.getAudioTracks().length > 0) {
          recordStream = destNode.stream;
        }
      }
    } catch (e) {
      console.warn('AudioContext recording boost fallback:', e);
      recordStream = stream;
    }

    let recorder: MediaRecorder;
    try {
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        const candidates = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg;codecs=opus',
          'audio/ogg',
        ];
        for (const c of candidates) {
          if (MediaRecorder.isTypeSupported(c)) {
            mimeType = c;
            break;
          }
        }
      }
      recorder = mimeType ? new MediaRecorder(recordStream, { mimeType }) : new MediaRecorder(recordStream);
    } catch (mrErr) {
      console.warn('MediaRecorder with mimeType failed, fallback to default:', mrErr);
      recorder = new MediaRecorder(recordStream);
    }

    voiceRecorder = recorder;
    voiceChunks = [];
    voiceRecorder.ondataavailable = (e: any) => {
      if (e.data && e.data.size > 0) {
        voiceChunks.push(e.data);
      }
    };

    voiceRecorder.start(250);
    isRecordingVoice.value = true;
    recordingSeconds.value = 0;
    soundFX.startVoiceChatRecording();
    soundFX.playTap();

    if (recordingInterval) clearInterval(recordingInterval);
    recordingInterval = window.setInterval(() => {
      recordingSeconds.value += 1;
      if (recordingSeconds.value >= 20) {
        // 录音20秒未点击发送语音，自动发送！
        stopAndSendVoiceRecording();
      }
    }, 1000);
  } catch (err: any) {
    console.warn('Microphone access denied:', err);
    isRecordingVoice.value = false;
    soundFX.stopVoiceChatRecording();
    const errorMsg = String(err?.message || err);
    if (errorMsg.includes('Permission') || errorMsg.includes('denied') || errorMsg.includes('NotAllowedError')) {
      micErrorTip.value = '麦克风权限未开启，请在系统设置中允许录音权限';
      lastGreetingText.value = '⚠️ 麦克风权限已被拒绝，请在手机系统应用设置中开启录音权限';
    } else {
      micErrorTip.value = '麦克风启动失败，请检查设备录音设置';
      lastGreetingText.value = '⚠️ 麦克风无法访问：' + (errorMsg.slice(0, 35) || '请检查录音设置');
    }
    if (micErrorTimer) clearTimeout(micErrorTimer);
    micErrorTimer = setTimeout(() => {
      micErrorTip.value = '';
    }, 6000);
    soundFX.playTap();
  }
}

function stopAndSendVoiceRecording() {
  if (!isRecordingVoice.value || !voiceRecorder) return;
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
  const duration = Math.max(1, recordingSeconds.value);
  isRecordingVoice.value = false;
  recordingSeconds.value = 0;
  soundFX.stopVoiceChatRecording();

  voiceRecorder.onstop = () => {
    try {
      if (voiceStream) {
        voiceStream.getTracks().forEach((track: any) => track.stop());
        voiceStream = null;
      }
      if (recordingAudioCtx) {
        try {
          recordingAudioCtx.close();
        } catch {}
        recordingAudioCtx = null;
      }
      if (voiceChunks.length === 0) return;
      const mime = voiceRecorder?.mimeType || 'audio/webm';
      const audioBlob = new Blob(voiceChunks, { type: mime });
      voiceChunks = [];

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        sendVoiceBroadcastMessage(base64Data, duration);
      };
      reader.readAsDataURL(audioBlob);
    } catch {}
    voiceRecorder = null;
  };

  try {
    voiceRecorder.stop();
  } catch {}
  soundFX.playTap();
}

function cancelVoiceRecording() {
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
  isRecordingVoice.value = false;
  recordingSeconds.value = 0;
  soundFX.stopVoiceChatRecording();
  if (voiceRecorder) {
    try {
      voiceRecorder.stop();
    } catch {}
    voiceRecorder = null;
  }
  if (voiceStream) {
    try {
      voiceStream.getTracks().forEach((track: any) => track.stop());
    } catch {}
    voiceStream = null;
  }
  if (recordingAudioCtx) {
    try {
      recordingAudioCtx.close();
    } catch {}
    recordingAudioCtx = null;
  }
  voiceChunks = [];
  lastGreetingText.value = '已取消本次录音';
  soundFX.playTap();
}

function sendVoiceBroadcastMessage(audioDataUrl: string, duration: number) {
  if (props.ws && props.ws.readyState === WebSocket.OPEN) {
    try {
      props.ws.send(
        JSON.stringify({
          type: 'scene_chat',
          gameType: props.gameType,
          sceneMode: props.sceneMode,
          sender: props.currentUser.name || '牌友',
          senderId: props.currentUser.id,
          text: `🎤 [等候室实时语音 ${duration}s]`,
          voice: true,
          audio: audioDataUrl,
          duration,
        })
      );
    } catch {}
  }
  soundFX.playTap();
}

function playVoiceBroadcast(audioUrl: string, sender: string, duration = 2) {
  try {
    if (activePlayingAudio) {
      try {
        activePlayingAudio.pause();
      } catch {}
      activePlayingAudio = null;
    }
    soundFX.startVoiceChatPlayback();

    const audio = new Audio(audioUrl);
    audio.volume = 1.0;
    activePlayingAudio = audio;
    activePlayingVoice.value = {
      sender,
      duration: Math.max(1, duration),
    };

    // 播放端使用 Web Audio API 提供二次响度提升 (2.5倍)，确保外放与小耳机清晰大声
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const playCtx = new AudioContextClass();
        if (playCtx.state === 'suspended') {
          playCtx.resume();
        }
        const source = playCtx.createMediaElementSource(audio);
        const gainNode = playCtx.createGain();
        gainNode.gain.value = 2.5; // 250% 播放端响度增强
        source.connect(gainNode);
        gainNode.connect(playCtx.destination);
      }
    } catch (e) {
      console.warn('Playback WebAudio gain boost fallback to native audio:', e);
    }

    let hasEnded = false;
    const finishPlayback = () => {
      if (!hasEnded) {
        hasEnded = true;
        soundFX.stopVoiceChatPlayback();
      }
    };

    audio.onended = () => {
      activePlayingVoice.value = null;
      activePlayingAudio = null;
      finishPlayback();
    };
    audio.onerror = () => {
      activePlayingVoice.value = null;
      activePlayingAudio = null;
      finishPlayback();
    };
    audio.play().catch((err) => {
      console.warn('Voice auto-play policy:', err);
      finishPlayback();
    });
  } catch {
    soundFX.stopVoiceChatPlayback();
  }
}

// WebSocket message listener
function handleWsMessage(event: MessageEvent) {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'scene_join_ack') {
      if (msg.gameType === props.gameType && msg.sceneMode === props.sceneMode) {
        if (msg.roomId) currentRoomId.value = msg.roomId;
        if (msg.deal) currentRoomDeal.value = msg.deal;
        if (Array.isArray(msg.players)) {
          currentPlayers.value = msg.players.slice(0, props.maxPlayers);
          if (currentPlayers.value.length >= props.maxPlayers) {
            triggerAutoStartCountdown(msg.deal);
          }
        }
      }
    } else if (msg.type === 'scene_room_update') {
      if (msg.gameType === props.gameType && msg.sceneMode === props.sceneMode) {
        const isMyRoom = Boolean(msg.roomId && currentRoomId.value && msg.roomId === currentRoomId.value);
        const isMeInPlayers = Array.isArray(msg.players) && msg.players.some((p: any) =>
          (props.currentUser?.id && (p.id === props.currentUser.id || p.originalId === props.currentUser.id || (typeof p.id === 'string' && p.id.startsWith(props.currentUser.id))))
        );
        if (currentRoomId.value) {
          if (!isMyRoom) return;
        } else {
          if (!isMeInPlayers) return;
        }

        if (msg.roomId) {
          currentRoomId.value = msg.roomId;
        }
        if (msg.deal) {
          currentRoomDeal.value = msg.deal;
        }
        if (Array.isArray(msg.players)) {
          currentPlayers.value = msg.players.slice(0, props.maxPlayers);
          if (currentPlayers.value.length >= props.maxPlayers) {
            triggerAutoStartCountdown(msg.deal);
          }
        }
      }
    } else if (msg.type === 'scene_room_full' || msg.type === 'scene_room_started' || msg.type === 'game_deal') {
      if (msg.gameType === props.gameType && msg.sceneMode === props.sceneMode) {
        const isMyRoom = Boolean(msg.roomId && currentRoomId.value && msg.roomId === currentRoomId.value);
        const isMeInPlayers = Array.isArray(msg.players) && msg.players.some((p: any) =>
          (props.currentUser?.id && (p.id === props.currentUser.id || p.originalId === props.currentUser.id || (typeof p.id === 'string' && (p.id.startsWith(props.currentUser.id) || props.currentUser.id.startsWith(p.id))))) ||
          (props.currentUser?.name && (p.name === props.currentUser.name || (p as any).originalName === props.currentUser.name || (typeof p.name === 'string' && (p.name.startsWith(props.currentUser.name) || props.currentUser.name.startsWith(p.name)))))
        );
        if (!isMyRoom && !isMeInPlayers && currentRoomId.value) return;

        if (msg.roomId) {
          currentRoomId.value = msg.roomId;
        }
        if (msg.deal) {
          currentRoomDeal.value = msg.deal;
        }
        if (Array.isArray(msg.players)) {
          currentPlayers.value = msg.players.slice(0, props.maxPlayers);
        }
        if (msg.type === 'scene_room_started') {
          launchGameNow(msg.deal);
        } else {
          triggerAutoStartCountdown(msg.deal);
        }
      }
    } else if (msg.type === 'scene_chat_broadcast') {
      if (msg.gameType === props.gameType && msg.sceneMode === props.sceneMode) {
        const isMyOwnVoice = (msg.senderId && msg.senderId === props.currentUser.id) ||
                             (msg.sender && msg.sender === props.currentUser.name);
        if (msg.audio) {
          // 仅当接收到的语音广播来源于房间内【其他牌友】时才播报录音组件，发送者本人无需二次收听
          if (!isMyOwnVoice) {
            playVoiceBroadcast(msg.audio, msg.sender, msg.duration || 1);
            soundFX.playTap();
          }
        } else if (msg.voice && msg.text) {
          if (!isMyOwnVoice) {
            soundFX.speakVoice(msg.text);
            soundFX.playTap();
          }
        }
        if (!isMyOwnVoice) {
          lastGreetingText.value = `${msg.sender}: ${msg.text}`;
          if (greetingTimer) clearTimeout(greetingTimer);
          greetingTimer = setTimeout(() => {
            lastGreetingText.value = '';
          }, 4000);
        }
      }
    } else if (msg.type === 'chat_broadcast') {
      const isMyOwnVoice = (msg.message?.senderId && msg.message.senderId === props.currentUser.id) ||
                           (msg.message?.sender && msg.message.sender === props.currentUser.name);
      if (msg.message?.audio && !isMyOwnVoice) {
        playVoiceBroadcast(msg.message.audio, msg.message.sender, msg.message.duration || 1);
      }
    }
  } catch {}
}

onMounted(() => {
  joinSceneQueue();
  if (props.isPracticeMode) {
    startAutoMatchCountdown();
  }
  if (props.ws) {
    props.ws.addEventListener('message', handleWsMessage);
  }
});

onBeforeUnmount(() => {
  if (autoMatchTimer) clearInterval(autoMatchTimer);
  if (countdownTimer) clearInterval(countdownTimer);
  if (greetingTimer) clearTimeout(greetingTimer);
  if (recordingInterval) clearInterval(recordingInterval);
  if (voiceStream) {
    try {
      voiceStream.getTracks().forEach((track: any) => track.stop());
    } catch {}
  }
  if (recordingAudioCtx) {
    try {
      recordingAudioCtx.close();
    } catch {}
    recordingAudioCtx = null;
  }
  if (activePlayingAudio) {
    try {
      activePlayingAudio.pause();
    } catch {}
  }
  if (props.ws) {
    props.ws.removeEventListener('message', handleWsMessage);
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
