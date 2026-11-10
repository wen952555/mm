<template>
  <div
    class="relative rounded-2xl sm:rounded-3xl transition-all duration-300 flex flex-col items-center justify-between shadow-2xl select-none overflow-hidden"
    :class="[
      compact ? 'w-24 sm:w-28 p-1.5 min-h-[110px]' : 'w-36 sm:w-44 p-2.5 sm:p-3 min-h-[145px] sm:min-h-[160px]',
      player
        ? isCurrentUser
          ? 'bg-gradient-to-b from-[#3D1E10] via-[#241107] to-[#140803] border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_8px_30px_rgba(245,158,11,0.35)]'
          : 'bg-gradient-to-b from-[#28160D] via-[#1C0E07] to-[#100703] border-2 border-[#8C5D37]/70 shadow-[0_6px_20px_rgba(0,0,0,0.8)]'
        : 'bg-gradient-to-b from-[#180E09]/85 to-[#0D0704]/90 border border-amber-500/30 backdrop-blur-md shadow-lg opacity-90'
    ]"
  >
    <!-- Top Corner Brass Rivet / Wood Texture Accent -->
    <div class="absolute top-1 left-2 w-1 h-1 rounded-full bg-amber-400/40 shadow-xs pointer-events-none"></div>
    <div class="absolute top-1 right-2 w-1 h-1 rounded-full bg-amber-400/40 shadow-xs pointer-events-none"></div>

    <!-- Seat Direction Seal & Title Tag -->
    <div class="w-full flex items-center justify-between px-1 mb-1">
      <!-- Auspicious Direction Seal -->
      <span
        class="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black font-serif-title shadow-xs border"
        :class="
          player
            ? isCurrentUser
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-black border-amber-300'
              : 'bg-gradient-to-br from-red-700 to-red-900 text-amber-200 border-red-500/60'
            : 'bg-[#2A180E] text-amber-300/70 border-amber-500/30'
        "
        :title="seatLabel"
      >
        {{ getDirectionChar(seatLabel) }}
      </span>

      <!-- Seat Label Name -->
      <span
        class="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full"
        :class="
          player
            ? isCurrentUser
              ? 'text-amber-300 bg-amber-500/20 border border-amber-400/40 font-black'
              : 'text-amber-200/90 bg-white/5 border border-white/10'
            : 'text-[#9E8E7D] bg-black/40'
        "
      >
        {{ seatLabel }}
      </span>
    </div>

    <!-- Center Avatar / Empty Armchair Slot -->
    <div class="relative my-0.5">
      <template v-if="player">
        <!-- Player Avatar with Ornate Brass Border -->
        <div
          class="rounded-full flex items-center justify-center border-2 shadow-inner transition-transform"
          :class="[
            compact ? 'w-10 h-10 text-xl' : 'w-13 h-13 sm:w-16 sm:h-16 text-2xl sm:text-3xl',
            isCurrentUser
              ? 'bg-gradient-to-br from-amber-500/30 to-amber-700/20 border-amber-400 ring-2 ring-amber-400/40'
              : 'bg-gradient-to-br from-white/15 to-black/40 border-[#A3704C]'
          ]"
        >
          <span class="filter drop-shadow-sm">{{ getPlayerAvatar() }}</span>
        </div>
        <!-- Real-time Connected Indicator (Emerald Pearl) -->
        <span
          class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#120703] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse"
          title="实时在席连线"
        ></span>
      </template>

      <template v-else>
        <!-- Elegant Ming Tea Armchair Waiting Placeholder -->
        <div
          class="rounded-2xl flex flex-col items-center justify-center border border-amber-500/25 bg-gradient-to-b from-[#24140B]/80 to-[#140A05]/90 shadow-inner group"
          :class="compact ? 'w-10 h-10' : 'w-13 h-13 sm:w-16 sm:h-16'"
        >
          <!-- Teacup with subtle steam -->
          <span class="text-xl sm:text-2xl filter drop-shadow opacity-75 group-hover:opacity-100 transition-opacity animate-pulse">
            🍵
          </span>
        </div>
      </template>
    </div>

    <!-- Player Details / Waiting Status Text -->
    <div class="text-center w-full px-0.5 mt-0.5">
      <template v-if="player">
        <!-- Player Name -->
        <div class="font-black text-[#F5EFE6] font-serif-title truncate text-xs sm:text-sm drop-shadow leading-snug">
          {{ player.name }}
        </div>

        <!-- Coins / Score Ingot -->
        <div class="text-[9px] sm:text-[10px] text-amber-300 font-mono font-bold mt-0.5 flex items-center justify-center gap-1">
          <span class="text-[10px]">🪙</span>
          <span class="tabular-nums">{{ player.coins.toLocaleString() }} 分</span>
        </div>

        <!-- Seat Verification Badge -->
        <div class="mt-1 flex items-center justify-center gap-1">
          <span
            class="text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
            :class="
              isCurrentUser
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            "
          >
            {{ isCurrentUser ? '👑 本家席位' : '👤 贵宾茶客' }}
          </span>
          <span class="text-[8px] sm:text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
            <span class="text-[7px]">●</span> 已入席
          </span>
        </div>
      </template>

      <template v-else>
        <!-- Dignified Classical Waiting Description -->
        <div class="text-[10px] sm:text-xs font-bold text-amber-300/90 font-serif-title tracking-wide">
          虚席以待
        </div>
        <div class="text-[8px] sm:text-[9px] text-[#A89887] font-mono mt-0.5 leading-tight">
          等待茶客入座...
        </div>
        <div class="mt-1 text-[7px] sm:text-[8px] text-emerald-400/90 font-mono font-medium flex items-center justify-center gap-1">
          <span>🛡️</span>
          <span>纯真人对决</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ScenePlayer } from '../SceneWaitingRoom.vue';

const props = defineProps<{
  seatIndex: number;
  seatLabel: string;
  player: ScenePlayer | null;
  isCurrentUser: boolean;
  compact?: boolean;
}>();

function getPlayerAvatar(): string {
  if (!props.player) return '👤';
  if (props.isCurrentUser) {
    if (!props.player.avatar || props.player.avatar === '🀄') {
      return '👑';
    }
  }
  return props.player.avatar || '👤';
}

function getDirectionChar(label: string): string {
  if (label.includes('东')) return '东';
  if (label.includes('南') || label.includes('本家')) return '南';
  if (label.includes('西')) return '西';
  if (label.includes('北')) return '北';
  // Fallback to numeric seat
  const match = label.match(/\d+/);
  return match ? match[0] : '席';
}
</script>
