<template>
  <div
    ref="containerRef"
    class="w-full h-full select-none absolute inset-0 overflow-hidden flex items-center justify-center"
    :style="{
      backgroundColor: props.tableTheme?.feltColor || '#E0D0B0',
      background: `radial-gradient(ellipse at 50% 45%, ${props.tableTheme?.highlightColor || '#F8F0E2'} 0%, ${props.tableTheme?.feltColor || '#E0D0B0'} 60%, ${props.tableTheme?.edgeColor || '#C8B898'} 100%)`
    }"
  >
    <!-- Fullscreen Card Table Surface with In-Table Action Overlay -->
    <div class="w-full h-full absolute inset-0 overflow-hidden flex items-center justify-center">
      <canvas
        ref="canvasRef"
        @pointerdown="onCanvasPointerDown"
        @pointermove="onCanvasPointerMove"
        @pointerup="onCanvasPointerUp"
        @pointercancel="onCanvasPointerCancel"
        class="w-full h-full absolute inset-0 block cursor-pointer"
      ></canvas>





      <!-- 预约专列顶部信息横幅 (车厢号、出战坐席、当前桌号、06:00倒计时、车厢看板入口) -->
      <div
        v-if="isBookingScene"
        class="absolute top-2 left-2 right-2 sm:left-4 sm:right-4 z-25 flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-amber-500/40 shadow-xl pointer-events-auto select-none"
      >
        <!-- Left: Carriage info & Chosen seat -->
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xl sm:text-2xl animate-pulse">🚂</span>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs sm:text-sm font-black text-amber-300 font-serif-title">
                预约专列 · 第 {{ bookingCarriage?.carriageNumber || 1 }} 车厢
              </span>
              <span
                class="px-2 py-0.2 rounded-full text-[10px] font-bold font-mono border"
                :class="bookingCarriage?.selectedSeat ? 'bg-amber-500/25 text-amber-300 border-amber-400/50' : 'bg-red-500/20 text-red-300 border-red-400/40'"
              >
                {{ bookingCarriage?.selectedSeat ? `【${bookingCarriage.selectedSeat}位】` : '待选' }}
              </span>
            </div>
            <div class="text-[10px] sm:text-[11px] text-[#E6DEC8] font-mono flex items-center gap-1.5">
              <span>桌号: <b class="text-amber-200">第 {{ currentActiveBookingTable?.tableIndex || 1 }} 桌</b></span>
              <span>•</span>
              <span>进度: <b class="text-emerald-300">{{ completedBookingTablesCount }} / 10 桌</b></span>
            </div>
          </div>
        </div>

        <!-- Right: 06:00 Countdown & Overview Button & Exit -->
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div class="px-2 sm:px-2.5 py-1 rounded-xl bg-black/50 border border-white/10 text-[10px] sm:text-xs text-amber-200 font-mono flex items-center gap-1 shadow-inner hidden md:flex">
            <span>⏱️ 06:00结算:</span>
            <span class="text-amber-300 font-bold font-mono">{{ bookingCountdownText }}</span>
          </div>

          <!-- 车厢看板入口 -->
          <button
            type="button"
            @click="openCarriageOverview"
            class="px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-amber-700/80 to-amber-600/80 hover:from-amber-600 hover:to-amber-500 text-amber-100 font-bold text-xs border border-amber-400/50 shadow-md active:scale-95 cursor-pointer transition-all flex items-center gap-1"
            title="查看当前车厢10桌提交概况与模拟结算"
          >
            <span>📜</span>
            <span class="hidden sm:inline">车厢看板</span>
          </button>

          <!-- 暂存退出 -->
          <button
            type="button"
            @click="emit('exit')"
            class="px-2 sm:px-2.5 py-1 rounded-xl bg-white/10 hover:bg-red-950/80 text-stone-300 hover:text-red-200 font-bold text-xs border border-white/15 active:scale-95 cursor-pointer transition-all"
            title="暂存当前理牌进度并返回茶楼大厅"
          >
            <span>🚪 退出</span>
          </button>
        </div>
      </div>

      <!-- 十三张理牌思考倒计时 (语音聊天按钮风格胶囊 Capsule 悬浮指示器) -->
      <div
        v-if="!hasCompared && (!isBookingScene || !mySpecialHand)"
        class="absolute left-1/2 transform -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-gradient-to-r from-red-950/90 via-red-900/95 to-amber-950/90 border border-red-500/80 shadow-[0_4px_16px_rgba(239,68,68,0.45)] backdrop-blur-md text-red-200 flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm tabular-nums select-none pointer-events-none transition-all"
        :class="[
          isBookingScene ? 'top-14 sm:top-12' : 'top-2.5 sm:top-3.5',
          { 'animate-pulse ring-2 ring-red-400 border-red-400': arrangeCountdown <= 10 }
        ]"
        title="思考理牌时间上限60秒"
      >
        <span class="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
        <span class="text-xs sm:text-sm font-black text-amber-300">⏱️ {{ arrangeCountdown }}s</span>
      </div>

      <!-- 顶部特殊牌型常驻提醒条 (若摸到特殊牌型，高亮显著提示) -->
      <div
        v-if="mySpecialHand && !hasCompared"
        class="absolute left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-950/95 via-amber-900/95 to-yellow-950/95 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)] backdrop-blur-md animate-pulse select-none"
        :class="isBookingScene ? 'top-14' : 'top-2.5'"
      >
        <span class="text-base sm:text-lg">👑</span>
        <span class="text-xs sm:text-sm font-black text-amber-300 font-serif-title">
          天降特殊牌型【{{ mySpecialHand.name }}】
        </span>
        <span class="text-[10px] sm:text-xs font-mono font-bold text-yellow-200 bg-amber-500/30 px-2 py-0.5 rounded-full border border-amber-400/50">
          +{{ mySpecialHand.bonusWater }}水 · 免比直赢
        </span>
        <button
          type="button"
          @click="showSpecialHandModal = true"
          class="ml-1 px-2.5 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-[11px] shadow transition-all active:scale-95 cursor-pointer"
        >
          查看 / 直接开牌
        </button>
      </div>

      <!-- 快捷理牌与战术浮动反馈吐司 (Toast) -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 -translate-y-2 scale-95"
      >
        <div
          v-if="actionNotification"
          class="absolute top-12 left-1/2 transform -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-black/90 border border-amber-400/80 text-amber-200 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none select-none max-w-[90vw] truncate"
        >
          <span>{{ actionNotification }}</span>
        </div>
      </transition>

      <!-- 全员开牌比水就绪等待浮动横幅 (纯真人联机必须全员开牌比水方可进入比牌画面) -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 -translate-y-2 scale-95"
      >
        <div
          v-if="isWaitingShowdown && !hasCompared"
          class="absolute top-12 left-1/2 transform -translate-x-1/2 z-35 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-950/95 via-indigo-950/95 to-slate-950/95 border-2 border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.5)] backdrop-blur-md text-blue-100 text-xs sm:text-sm font-bold flex items-center gap-2.5 select-none"
        >
          <span class="text-base sm:text-lg animate-spin">⏳</span>
          <div>
            <div class="text-blue-200 font-black flex items-center gap-1.5">
              <span>已确认理牌 · 等待其他牌友开牌比水</span>
            </div>
            <div class="text-[11px] text-blue-300/90 font-mono mt-0.5 flex items-center gap-2">
              <span>就绪进度：<b class="text-amber-300 font-extrabold">{{ submittedSeats.size }}</b> / {{ totalSeatsCount }} 人</span>
              <span class="opacity-40">|</span>
              <span>剩余思考时间：<b class="text-emerald-400 font-extrabold">{{ arrangeCountdown }}s</b></span>
            </div>
          </div>
        </div>
      </transition>

      <!-- 06:00 每日结算延时 1 分钟理牌弹幕横幅提醒 -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 -translate-y-4 scale-95"
      >
        <div
          v-if="gracePeriodActive"
          class="absolute top-14 left-1/2 transform -translate-x-1/2 z-35 px-4 py-2 rounded-2xl bg-gradient-to-r from-red-950/95 via-amber-950/95 to-red-950/95 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.7)] backdrop-blur-md text-red-100 text-xs sm:text-sm font-bold flex items-center gap-2.5 select-none animate-pulse"
        >
          <span class="text-base sm:text-lg animate-bounce">⏰</span>
          <div>
            <div class="text-red-200 font-black flex items-center gap-1.5">
              <span>每日 06:00 结算时刻已到！正在为您延时理牌</span>
              <span class="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-extrabold text-xs shadow-inner">
                剩余 {{ gracePeriodSeconds }} 秒
              </span>
            </div>
            <div class="text-[11px] text-amber-200/90 font-medium">
              请在 1 分钟内完成提交本局；超时系统将自动智能最优理牌并封盘结算！
            </div>
          </div>
        </div>
      </transition>

      <!-- In-Table Floating Strategy & Compare Controls (Left Sidebar) -->
      <div class="absolute bottom-4 left-4 z-20 flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl bg-black/75 border border-white/10 backdrop-blur-xs shadow-xl">
        <!-- 预约场：封牌提交按钮 (而非实时开牌比水) -->
        <button
          v-if="isBookingScene"
          type="button"
          @click="handleBookingSubmit"
          :disabled="isBookingTableSubmitted || isCurrentHandFoul"
          class="w-24 px-1.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white disabled:opacity-40 shadow-[0_4px_16px_rgba(16,185,129,0.6)] ring-2 ring-emerald-400 transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center leading-tight"
          :title="isCurrentHandFoul ? '当前手牌摆放倒水相公，无法提交' : '确认理牌并封盘提交至每日06:00结算'"
        >
          <span class="flex items-center gap-1">
            <span>📦</span>
            <span>封牌提交</span>
          </span>
          <span class="text-[9px] font-mono opacity-90 mt-0.5">
            第 {{ currentActiveBookingTable?.tableIndex || 1 }}/10 桌
          </span>
        </button>

        <!-- 实时场：开牌比水按钮 -->
        <button
          v-else
          type="button"
          @click="handleCompare"
          :disabled="hasCompared || isWaitingShowdown"
          class="w-24 px-1.5 py-2 text-xs font-extrabold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-40 shadow-[0_4px_16px_rgba(59,130,246,0.6)] ring-2 ring-blue-400 transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center leading-tight"
        >
          <template v-if="isWaitingShowdown">
            <span class="flex items-center gap-1 animate-pulse">
              <span>⏳</span>
              <span>等待开牌</span>
            </span>
            <span class="text-[9px] font-mono opacity-85 mt-0.5">
              就绪 {{ submittedSeats.size }}/{{ totalSeatsCount }}
            </span>
          </template>
          <template v-else>
            <span>⚔️ 开牌比水</span>
          </template>
        </button>

        <div
          v-if="mySpecialHand"
          @click="showSpecialHandModal = true"
          class="w-24 px-1.5 py-1 text-[10px] font-bold rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black border border-amber-300 shadow-md text-center leading-tight cursor-pointer animate-pulse active:scale-95 transition-all"
          title="点击查看特殊牌型详情并直接开牌"
        >
          👑 {{ mySpecialHand.name }}
          <div class="text-[9px] font-mono font-black">+{{ mySpecialHand.bonusWater }}水免比</div>
        </div>

        <button
          type="button"
          @click="applyStrategy('solid')"
          class="w-24 px-2 py-1.5 text-xs font-medium rounded-xl bg-[#1C1612] hover:bg-[#2A211B] border border-white/10 text-blue-200 transition-colors cursor-pointer"
        >
          稳健葫芦
        </button>
        <button
          type="button"
          @click="applyStrategy('flush')"
          class="w-24 px-2 py-1.5 text-xs font-medium rounded-xl bg-[#1C1612] hover:bg-[#2A211B] border border-white/10 text-blue-200 transition-colors cursor-pointer"
        >
          同花攻势
        </button>
        <button
          type="button"
          @click="applyStrategy('balanced')"
          class="w-24 px-2 py-1.5 text-xs font-medium rounded-xl bg-[#1C1612] hover:bg-[#2A211B] border border-white/10 text-blue-200 transition-colors cursor-pointer"
        >
          三道均衡
        </button>
        <div class="w-full border-t border-white/10 my-0.5"></div>
        <button
          type="button"
          @click="applyStrategy('optimal')"
          class="w-24 px-2 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
        >
          ⚡ 一键最优
        </button>
        <button
          type="button"
          @click="undo"
          :disabled="historyStack.length === 0"
          class="w-24 px-2 py-1.5 text-xs font-bold rounded-xl bg-[#26201B] hover:bg-[#322B26] text-amber-300 border border-[#3A3029] transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↶ 撤销 ({{ historyStack.length }})
        </button>
      </div>

      <!-- 特殊牌型弹窗说明与一键通关结算 -->
      <div
        v-if="showSpecialHandModal && mySpecialHand"
        class="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
      >
        <div class="max-w-md w-full bg-gradient-to-b from-[#1C1612] via-[#2A1E14] to-[#140E0A] border-2 border-amber-400 rounded-3xl p-6 shadow-[0_0_60px_rgba(245,158,11,0.5)] text-center flex flex-col items-center">
          <div class="text-5xl mb-2">👑 🐉 👑</div>
          <span class="text-xs font-mono font-extrabold text-amber-400 tracking-wider">十三水至尊荣耀 · 特殊牌型</span>
          <h2 class="text-2xl sm:text-3xl font-black text-amber-300 font-serif-title mt-1.5">
            {{ mySpecialHand.name }}
          </h2>
          <div class="mt-2.5 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-400/60 text-amber-200 font-mono font-extrabold text-sm">
            通关胜全场 +{{ mySpecialHand.bonusWater }} 水 · 免比三道
          </div>
          <p class="text-xs sm:text-sm text-[#E5D5C0] mt-3 leading-relaxed px-2 font-medium">
            {{ mySpecialHand.desc }}
          </p>

          <div class="flex items-center gap-3 mt-6 w-full">
            <button
              type="button"
              @click="confirmSpecialHandShowdown"
              class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs sm:text-sm shadow-xl ring-2 ring-amber-300 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>⚡ 特殊牌直接开牌 (+{{ mySpecialHand.bonusWater }}水)</span>
            </button>
            <button
              type="button"
              @click="showSpecialHandModal = false"
              class="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-[#E5D5C0] font-bold text-xs sm:text-sm border border-white/20 transition-all active:scale-95 cursor-pointer"
            >
              体验常规理牌
            </button>
          </div>
        </div>
      </div>

      <!-- 全新田字型比水全景总谱 (四人场田字四格同屏全展，八人场支持翻页查看后四席) -->
      <div
        v-if="hasCompared"
        class="absolute inset-0 backdrop-blur-md flex flex-col p-2 sm:p-3 z-40 overflow-hidden select-none"
        :style="{
          backgroundColor: props.tableTheme?.feltColor || '#1D4ED8',
          background: `radial-gradient(ellipse at 50% 45%, ${props.tableTheme?.highlightColor || '#3B82F6'}dd 0%, ${props.tableTheme?.feltColor || '#1D4ED8'}f2 60%, ${props.tableTheme?.edgeColor || '#1E3A8A'}fb 100%)`
        }"
      >
        <!-- 顶部控制与结算横幅 -->
        <div class="h-11 shrink-0 flex items-center justify-between border-b border-white/10 px-2 pb-1.5 gap-2">
          <!-- 左侧：标题与场次标识 -->
          <div class="flex items-center gap-2 shrink-0">
            <h3 class="text-xs sm:text-sm font-black text-black font-serif-title flex items-center gap-1.5">
              <span>⚔️</span>
              <span>比水总谱</span>
              <span class="text-[10px] text-black font-sans font-medium hidden sm:inline">(田字全景对决)</span>
            </h3>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-red-950/50 text-red-400 border border-red-500/50 font-mono font-bold">
              {{ isEightPlayer ? (showdownPage === 0 ? '八人场 · 第 1/2 页 (前四席)' : '八人场 · 第 2/2 页 (后四席)') : '四人场 · 四席田字全景' }}
            </span>
          </div>

          <!-- 中间：总净水与战报 -->
          <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] text-[#A89887] hidden sm:inline">本局总净水:</span>
              <span
                class="text-sm sm:text-base font-black font-mono tracking-tight text-black"
              >
                {{ totalScore >= 0 ? `+${totalScore}` : totalScore }}
                <span class="text-[10px] text-black font-sans font-bold">水</span>
              </span>
              <span class="text-xs font-mono font-bold text-black ml-1">
                🪙 {{ totalScore >= 0 ? `+${totalScore}` : `${totalScore}` }} 分
              </span>
            </div>

            <span v-if="isGrandSlam" class="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-black border border-amber-500 font-bold animate-pulse shrink-0 hidden md:inline">
              🔥 全垒打 (翻倍)
            </span>
          </div>

          <!-- 右侧：八人场翻页按钮、退出与继续游戏 (已移除战绩海报按钮) -->
          <div class="flex items-center gap-1.5 shrink-0">
            <!-- 八人场翻页按钮 -->
            <button
              v-if="isEightPlayer"
              type="button"
              @click="showdownPage = showdownPage === 0 ? 1 : 0"
              class="px-2.5 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400 shadow-md flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            >
              <span>📄</span>
              <span>{{ showdownPage === 0 ? '翻页后四席 (1/2 →)' : '翻页前四席 (← 2/2)' }}</span>
            </button>

            <button
              type="button"
              @click="handleLeaveToLobby"
              class="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#26201B] hover:bg-red-950/80 text-[#D6C7B2] hover:text-red-300 border border-white/15 transition-all active:scale-95 cursor-pointer"
              title="结束游戏返回大厅"
            >
              <span>🚪 结束游戏返回大厅</span>
            </button>

            <button
              type="button"
              @click="onRestartGame"
              :disabled="hasClickedReady"
              class="px-3 py-1 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              :class="hasClickedReady ? 'bg-stone-800 text-amber-300 border border-amber-500/40 cursor-not-allowed opacity-90' : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-md ring-1 ring-amber-400 active:scale-95'"
            >
              <span>{{ hasClickedReady ? `✅ 已准备 · 等待牌友 (${readyPlayersCount}/${totalSeatsCount})...` : '⚡ 继续下一局' }}</span>
            </button>
          </div>
        </div>

        <!-- 8人场处于第2页时的本家信息小横幅 (方便玩家对照自己的牌) -->
        <div
          v-if="isEightPlayer && showdownPage === 1"
          class="shrink-0 px-2.5 py-1 my-1 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[11px]"
        >
          <span class="font-bold text-black flex items-center gap-1">
            <span>👑 本家手牌提示:</span>
            <span class="text-white font-normal font-mono">头道 [{{ frontTierLabel }}] · 中道 [{{ midTierLabel }}] · 尾道 [{{ backTierLabel }}]</span>
          </span>
          <span class="font-mono font-bold text-black">总分: {{ totalScore >= 0 ? `+${totalScore}` : totalScore }} 水</span>
        </div>

        <!-- 田字型四格对决核心区 (2列 × 2行) -->
        <div class="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-2 p-0.5 mt-1">
          <div
            v-for="p in displayedShowdownPlayers"
            :key="p.seat"
            class="relative h-full min-h-0 flex flex-col rounded-xl border p-2 sm:p-2.5 overflow-hidden shadow-lg transition-all"
            :class="p.isMe ? 'border-amber-500/70 ring-1 ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]' : 'border-white/20 hover:border-white/40'"
            :style="{
              background: p.isMe
                ? `linear-gradient(135deg, ${props.tableTheme?.highlightColor || '#3B82F6'}50 0%, ${props.tableTheme?.feltColor || '#1D4ED8'}f2 100%)`
                : `linear-gradient(135deg, ${props.tableTheme?.edgeColor || '#1E3A8A'}cc 0%, ${props.tableTheme?.feltColor || '#1D4ED8'}cc 100%)`,
              borderColor: p.isMe ? '#F59E0B' : `${props.tableTheme?.highlightColor || '#3B82F6'}66`
            }"
          >
            <!-- 席位玩家标头 -->
            <div class="flex items-center justify-between pb-1 mb-1 border-b border-white/10 shrink-0 text-xs">
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-sm shrink-0">{{ p.avatar }}</span>
                <span :class="p.isMe ? 'text-black font-extrabold' : 'text-[#D6C7B2] font-bold'" class="truncate text-xs sm:text-sm font-serif-title">
                  {{ p.name }}
                </span>
                <span v-if="p.isMe" class="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400 text-black border border-amber-500 font-mono font-bold shrink-0">
                  本家
                </span>
                <span v-if="p.specialHand" class="text-[9px] px-1.5 py-0.2 rounded bg-yellow-400 text-black border border-yellow-500 font-bold shrink-0">
                  👑 {{ p.specialHand.name }} (+{{ p.specialHand.bonusWater }}水)
                </span>
                <span v-if="p.isFoul" class="text-[9px] px-1.5 py-0.2 rounded bg-red-600/30 text-red-300 border border-red-500/50 font-bold shrink-0">
                  ⚠️ 倒水
                </span>
              </div>

              <div class="flex items-center gap-1 shrink-0 ml-1">
                <span v-if="p.isShot && !p.isMe" class="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-black border border-amber-500 font-bold">
                  💥 打枪
                </span>
                <span
                  class="font-mono font-bold text-[11px] sm:text-xs px-2 py-0.5 rounded-full border shadow-xs whitespace-nowrap tabular-nums shrink-0"
                  :class="p.isMe ? (totalScore >= 0 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' : 'bg-red-950/80 text-red-300 border-red-500/50') : (p.netWater >= 0 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' : 'bg-red-950/80 text-red-300 border-red-500/50')"
                >
                  {{ p.isMe ? (totalScore >= 0 ? `+${totalScore}` : totalScore) + ' 水 (总分)' : (p.netWater > 0 ? `我胜 +${p.netWater}` : p.netWater < 0 ? `我负 ${p.netWater}` : '打和 0') + ' 水' }}
                </span>
              </div>
            </div>

            <!-- 三道牌型展示区 (头道3张、中道5张、尾道5张) -->
            <div class="flex-1 min-h-0 flex flex-col justify-between gap-1 sm:gap-1.5">
              <!-- 1. 头道 (3张) - 极致聚焦左上角牌面与花色（特大显示，下部与右部裁切） -->
              <div
                class="flex-1 min-h-0 flex items-center justify-between rounded-xl px-2 py-0 border relative overflow-hidden shadow-inner"
                :style="{
                  backgroundColor: `${props.tableTheme?.edgeColor || '#1E3A8A'}88`,
                  borderColor: `${props.tableTheme?.highlightColor || '#3B82F6'}40`
                }"
              >
                <div class="w-12 sm:w-14 shrink-0 flex flex-col justify-center leading-tight z-10 pr-0.5">
                  <span class="text-black font-black text-[11px] sm:text-xs tracking-tight">头道</span>
                  <span class="text-white/85 font-bold truncate text-[9px] sm:text-[10px] mt-0.5">{{ p.frontLabel }}</span>
                </div>

                <div class="flex-1 min-w-0 h-full relative overflow-hidden flex items-start">
                  <div
                    v-for="(c, cIdx) in p.front"
                    :key="c.id"
                    class="absolute top-0 w-11 sm:w-13 md:w-14.5 h-[195%] sm:h-[225%] md:h-[250%] min-h-[64px] sm:min-h-[76px] bg-white rounded-t-md shadow-xl overflow-hidden border border-neutral-600 ring-1 ring-black/40"
                    :style="{ left: `calc(${cIdx} * 32px)`, zIndex: cIdx + 1 }"
                  >
                    <!-- 聚焦并超大放大左上角：点数与花色占据整个视口 -->
                    <img
                      :src="getCardImagePath(c)"
                      :alt="c.label + c.suit"
                      class="w-full h-full object-contain object-left-top select-none pointer-events-none transform scale-[2.75] -translate-x-[2%] -translate-y-[2%] origin-top-left"
                    />
                  </div>
                </div>

                <div class="shrink-0 text-right ml-1 z-10">
                  <template v-if="p.isMe">
                    <span v-if="myTierBonuses.head" class="text-[9px] font-black text-black bg-amber-400 px-1.5 py-0.5 rounded border border-amber-500 shadow-xs">
                      {{ myTierBonuses.head }}
                    </span>
                  </template>
                  <template v-else-if="p.tiersDetail?.[0]">
                    <span
                      class="text-[10px] font-mono font-black px-1.5 py-0.5 rounded border shadow-xs"
                      :class="p.tiersDetail[0].winner === 'me' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' : p.tiersDetail[0].winner === 'opp' ? 'bg-red-950/90 text-red-300 border-red-500/50' : 'bg-neutral-900 text-neutral-400 border-white/15'"
                    >
                      {{ p.tiersDetail[0].winner === 'me' ? `+${p.tiersDetail[0].netWater}水` : p.tiersDetail[0].winner === 'opp' ? `${p.tiersDetail[0].netWater}水` : '0水' }}
                    </span>
                  </template>
                </div>
              </div>

              <!-- 2. 中道 (5张) - 极致聚焦左上角牌面与花色（特大显示，下部与右部裁切） -->
              <div
                class="flex-1 min-h-0 flex items-center justify-between rounded-xl px-2 py-0 border relative overflow-hidden shadow-inner"
                :style="{
                  backgroundColor: `${props.tableTheme?.edgeColor || '#1E3A8A'}88`,
                  borderColor: `${props.tableTheme?.highlightColor || '#3B82F6'}40`
                }"
              >
                <div class="w-12 sm:w-14 shrink-0 flex flex-col justify-center leading-tight z-10 pr-0.5">
                  <span class="text-blue-400 font-black text-[11px] sm:text-xs tracking-tight">中道</span>
                  <span class="text-white/85 font-bold truncate text-[9px] sm:text-[10px] mt-0.5">{{ p.midLabel }}</span>
                </div>

                <div class="flex-1 min-w-0 h-full relative overflow-hidden flex items-start">
                  <div
                    v-for="(c, cIdx) in p.mid"
                    :key="c.id"
                    class="absolute top-0 w-10 sm:w-12 md:w-13.5 h-[195%] sm:h-[225%] md:h-[250%] min-h-[64px] sm:min-h-[76px] bg-white rounded-t-md shadow-xl overflow-hidden border border-neutral-600 ring-1 ring-black/40"
                    :style="{ left: `calc(${cIdx} * 23px)`, zIndex: cIdx + 1 }"
                  >
                    <!-- 聚焦并超大放大左上角：点数与花色占据整个视口 -->
                    <img
                      :src="getCardImagePath(c)"
                      :alt="c.label + c.suit"
                      class="w-full h-full object-contain object-left-top select-none pointer-events-none transform scale-[2.75] -translate-x-[2%] -translate-y-[2%] origin-top-left"
                    />
                  </div>
                </div>

                <div class="shrink-0 text-right ml-1 z-10">
                  <template v-if="p.isMe">
                    <span v-if="myTierBonuses.mid" class="text-[9px] font-black text-blue-300 bg-blue-500/25 px-1.5 py-0.5 rounded border border-blue-400/40 shadow-xs">
                      {{ myTierBonuses.mid }}
                    </span>
                  </template>
                  <template v-else-if="p.tiersDetail?.[1]">
                    <span
                      class="text-[10px] font-mono font-black px-1.5 py-0.5 rounded border shadow-xs"
                      :class="p.tiersDetail[1].winner === 'me' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' : p.tiersDetail[1].winner === 'opp' ? 'bg-red-950/90 text-red-300 border-red-500/50' : 'bg-neutral-900 text-neutral-400 border-white/15'"
                    >
                      {{ p.tiersDetail[1].winner === 'me' ? `+${p.tiersDetail[1].netWater}水` : p.tiersDetail[1].winner === 'opp' ? `${p.tiersDetail[1].netWater}水` : '0水' }}
                    </span>
                  </template>
                </div>
              </div>

              <!-- 3. 尾道 (5张) - 极致聚焦左上角牌面与花色（特大显示，下部与右部裁切） -->
              <div
                class="flex-1 min-h-0 flex items-center justify-between rounded-xl px-2 py-0 border relative overflow-hidden shadow-inner"
                :style="{
                  backgroundColor: `${props.tableTheme?.edgeColor || '#1E3A8A'}88`,
                  borderColor: `${props.tableTheme?.highlightColor || '#3B82F6'}40`
                }"
              >
                <div class="w-12 sm:w-14 shrink-0 flex flex-col justify-center leading-tight z-10 pr-0.5">
                  <span class="text-purple-400 font-black text-[11px] sm:text-xs tracking-tight">尾道</span>
                  <span class="text-white/85 font-bold truncate text-[9px] sm:text-[10px] mt-0.5">{{ p.backLabel }}</span>
                </div>

                <div class="flex-1 min-w-0 h-full relative overflow-hidden flex items-start">
                  <div
                    v-for="(c, cIdx) in p.back"
                    :key="c.id"
                    class="absolute top-0 w-10 sm:w-12 md:w-13.5 h-[195%] sm:h-[225%] md:h-[250%] min-h-[64px] sm:min-h-[76px] bg-white rounded-t-md shadow-xl overflow-hidden border border-neutral-600 ring-1 ring-black/40"
                    :style="{ left: `calc(${cIdx} * 23px)`, zIndex: cIdx + 1 }"
                  >
                    <!-- 聚焦并超大放大左上角：点数与花色占据整个视口 -->
                    <img
                      :src="getCardImagePath(c)"
                      :alt="c.label + c.suit"
                      class="w-full h-full object-contain object-left-top select-none pointer-events-none transform scale-[2.75] -translate-x-[2%] -translate-y-[2%] origin-top-left"
                    />
                  </div>
                </div>

                <div class="shrink-0 text-right ml-1 z-10">
                  <template v-if="p.isMe">
                    <span v-if="myTierBonuses.tail" class="text-[9px] font-black text-purple-300 bg-purple-500/25 px-1.5 py-0.5 rounded border border-purple-400/40 shadow-xs">
                      {{ myTierBonuses.tail }}
                    </span>
                  </template>
                  <template v-else-if="p.tiersDetail?.[2]">
                    <span
                      class="text-[10px] font-mono font-black px-1.5 py-0.5 rounded border shadow-xs"
                      :class="p.tiersDetail[2].winner === 'me' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' : p.tiersDetail[2].winner === 'opp' ? 'bg-red-950/90 text-red-300 border-red-500/50' : 'bg-neutral-900 text-neutral-400 border-white/15'"
                    >
                      {{ p.tiersDetail[2].winner === 'me' ? `+${p.tiersDetail[2].netWater}水` : p.tiersDetail[2].winner === 'opp' ? `${p.tiersDetail[2].netWater}水` : '0水' }}
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      <!-- 十三张预约场火车专列弹窗系统 (选座、封牌提交反馈、10桌总览与06:00比水结算) -->
      <ShisanshuiBookingTrainModal
        v-if="isBookingScene"
        :show="showBookingModal"
        :modal-type="bookingModalType"
        :scene-mode="(props.sceneMode as any)"
        :carriage="bookingCarriage"
        :submitted-table="bookingSubmittedTable"
        :countdown-text="bookingCountdownText"
        :formatted-target-time="bookingTargetTime"
        :settlement-record="bookingSettlementRecord"
        @close="showBookingModal = false"
        @select-seat="onBookingSelectSeat"
        @next-table="onBookingNextTable"
        @open-overview="openCarriageOverview"
        @advance-carriage="onBookingAdvanceCarriage"
        @simulate-settle="onBookingSimulateSettle"
        @open-poster="emit('open-poster', $event)"
        @exit="emit('exit')"
      />


      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { soundFX } from '../../utils/sound';
import { haptics } from '../../utils/haptics';
import { TableTheme } from '../../utils/theme';
import { getCanvasEventCoords } from '../../utils/canvasCoords';
import { renderPlayingCard, preloadCardAssets, onCardAssetsLoaded, getCardImagePath } from '../../utils/cardAssets';
import {
  compareTwoPlayers,
  ThirteenVersusResult,
  SSSCard,
  detectSpecialHand,
  SpecialHandResult,
  getTierBonusWater,
  evaluate3CardTier,
  evaluate5CardTier,
  isFoulHand,
  checkWateringDetail,
  TierMatchDetail,
  autoArrangeThirteen,
} from '../../engine/shisanshuiRules';
import ShisanshuiBookingTrainModal from './ShisanshuiBookingTrainModal.vue';
import {
  getCurrentCarriage,
  selectCarriageSeat,
  pickNextRandomTable,
  submitCurrentTableHand,
  advanceToNextCarriage,
  calculateNext0600Countdown,
  settleCarriageTables,
  checkAndAutoSettle0600,
  BookingCarriageState,
  BookingTableState,
  BookingSettlementRecord,
  BookingSeat,
  SubmittedHandTiers,
} from '../../engine/shisanshuiBookingTrain';

interface Card {
  id: string;
  rank: number; // 2..14
  suit: '♠' | '♥' | '♣' | '♦';
  label: string;
  isRed: boolean;
}

interface PlayerTiers {
  front: Card[];
  mid: Card[];
  back: Card[];
}

interface HistorySnapshot {
  front: Card[];
  mid: Card[];
  back: Card[];
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  draggedCard: Card | null;
  draggedCards: Card[];
  sourceTier: 'front' | 'mid' | 'back' | null;
  hoverTier: 'front' | 'mid' | 'back' | null;
  hoverCardId: string | null;
  pointerDownCard: Card | null;
  pointerDownTier: 'front' | 'mid' | 'back' | null;
  pointerDownTime: number;
}

const props = defineProps<{
  tableTheme?: TableTheme;
  isRotated90?: boolean;
  sceneMode?: string;
  roomPlayers?: any[];
  currentUser?: any;
  roomId?: string;
  initialDeal?: any;
  ws?: WebSocket | null;
  isPracticeMode?: boolean;
}>();

const emit = defineEmits<{
  (e: 'move', payload: any): void;
  (e: 'restart'): void;
  (e: 'fx', payload: any): void;
  (e: 'exit'): void;
  (e: 'open-poster', payload?: any): void;
}>();

const mySeat = computed(() => {
  if (props.isPracticeMode || !props.currentUser || !props.roomPlayers || props.roomPlayers.length === 0) return 0;
  const myId = props.currentUser?.id;
  const myName = props.currentUser?.name;

  if (myId) {
    const idx = props.roomPlayers.findIndex((p: any) => {
      if (!p) return false;
      if (p.id === myId || p.originalId === myId) return true;
      if (typeof p.id === 'string' && (p.id.startsWith(myId) || (typeof myId === 'string' && myId.startsWith(p.id)))) return true;
      return false;
    });
    if (idx !== -1) return idx;
  }

  if (myName) {
    const idx = props.roomPlayers.findIndex((p: any) => {
      if (!p) return false;
      if (p.name === myName) return true;
      if (typeof p.name === 'string' && (p.name.startsWith(myName) || (typeof myName === 'string' && myName.startsWith(p.name)))) return true;
      return false;
    });
    if (idx !== -1) return idx;
  }

  if (typeof props.currentUser?.seat === 'number' && props.currentUser.seat >= 0 && props.currentUser.seat < props.roomPlayers.length) {
    const pAtSeat = props.roomPlayers[props.currentUser.seat];
    if (pAtSeat && ((myId && (pAtSeat.id === myId || pAtSeat.originalId === myId)) || (myName && pAtSeat.name === myName))) {
      return props.currentUser.seat;
    }
  }

  return 0;
});

watch(() => props.tableTheme, () => {
  drawBoard();
});

watch(() => props.sceneMode, () => {
  dealNewMatch();
});

watch([() => props.initialDeal, () => props.roomPlayers], ([deal]) => {
  if (props.isPracticeMode) return;
  if (deal && deal.seatCards) {
    const dealIdentifier = deal.dealId || deal.createdAt || (Array.isArray(deal.seatCards[0]) ? deal.seatCards[0].map((c: any) => c.id).join('-') : '');
    if (fullHand.value && fullHand.value.length > 0 && (lastAppliedDealId.value === dealIdentifier || !lastAppliedDealId.value)) {
      lastAppliedDealId.value = dealIdentifier;
      console.log('🛡️ [十三水防重置] 正在对局中且发牌一致，保持当前手牌与理牌');
      return;
    }
    dealNewMatch(false);
  }
}, { immediate: true, deep: true });

const isDealingCeremony = ref(false);

function triggerDealingCeremony() {
  isDealingCeremony.value = true;
  try { soundFX.playCardsShort?.(); } catch {}
  setTimeout(() => {
    isDealingCeremony.value = false;
  }, 1400);
}

const isEightPlayer = computed(() => {
  return props.sceneMode === 'eight-realtime' || props.sceneMode === 'eight-booking';
});

const isBookingScene = computed(() => {
  return props.sceneMode === 'four-booking' || props.sceneMode === 'eight-booking';
});

const currentSceneLabel = computed(() => {
  if (props.sceneMode === 'eight-realtime') return '八人实时场 · 两副扑克(104张全发)';
  if (props.sceneMode === 'eight-booking') return '八人预约包厢 · 两副扑克(104张全发)';
  if (props.sceneMode === 'four-booking') return '四人预约雅座 · 一副扑克(52张全发)';
  return '四人实时场 · 一副扑克(52张全发)';
});

const containerRef = ref<HTMLDivElement | null>(null);
const tableWidthPx = ref(680);
const tableHeightPx = ref(430);
let resizeObserver: ResizeObserver | null = null;
let rafId: number | null = null;
let cleanupCardLoader: (() => void) | null = null;

function updateDimensions() {
  if (!containerRef.value) return;
  const availW = containerRef.value.clientWidth || 680;
  const availH = containerRef.value.clientHeight || 430;
  const targetAspect = 680 / 430;

  let w = availW;
  let h = w / targetAspect;

  if (h > availH) {
    h = availH;
    w = h * targetAspect;
  }

  tableWidthPx.value = Math.max(280, Math.floor(w));
  tableHeightPx.value = Math.max(180, Math.floor(h));
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => drawBoard());
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
const fullHand = ref<Card[]>([]);
const frontTier = ref<Card[]>([]);
const midTier = ref<Card[]>([]);
const backTier = ref<Card[]>([]);
const selectedIds = ref<Set<string>>(new Set<string>());
const hasCompared = ref(false);
const isWaitingShowdown = ref(false);
const submittedSeats = ref<Set<number>>(new Set<number>());
const remoteSubmittedHands = ref<Map<number, { front: Card[]; mid: Card[]; back: Card[] }>>(new Map());
const arrangeCountdown = ref(60);
let arrangeTimer: any = null;

const isAllOtherPlayersBots = computed(() => {
  if (props.isPracticeMode) return true;
  if (!props.roomPlayers || props.roomPlayers.length === 0) return true;
  return props.roomPlayers.every((p: any, idx: number) => {
    if (idx === 0) return true;
    return !p || p.isAi || p.isSimulated || p.isBot || p.id?.startsWith('BOT-') || p.id?.startsWith('sim-');
  });
});

const hasClickedReady = ref(false);
const readyPlayersCount = computed(() => {
  const total = totalSeatsCount.value || 4;
  if (!props.roomPlayers || props.roomPlayers.length === 0) return hasClickedReady.value ? total : 1;
  const count = props.roomPlayers.filter((p: any, idx: number) => {
    if (!p || p.isAi || p.isSimulated || p.isBot || p.id?.startsWith('BOT-') || p.id?.startsWith('sim-')) return true;
    if (idx === mySeat.value) return hasClickedReady.value || Boolean(p.isReady);
    return Boolean(p.isReady);
  }).length;
  return Math.min(total, Math.max(1, count));
});
const showGunshotAnim = ref(false);
const isGrandSlam = ref(false);
const totalScore = ref(16);
const showdownPage = ref<number>(0);
const showSpecialHandModal = ref(false);
const actionNotification = ref<string | null>(null);
let toastTimer: any = null;

function showToast(msg: string) {
  actionNotification.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    actionNotification.value = null;
  }, 3600);
}

function confirmSpecialHandShowdown() {
  showSpecialHandModal.value = false;
  if (!isSetComplete.value) {
    applyStrategy('optimal', false);
  }
  handleCompare();
}

const frontTierLabel = ref('乌龙');
const midTierLabel = ref('顺子');
const backTierLabel = ref('葫芦');

// History stack for instant Undo
const historyStack = ref<HistorySnapshot[]>([]);

function pushHistory() {
  historyStack.value.push({
    front: [...frontTier.value],
    mid: [...midTier.value],
    back: [...backTier.value],
  });
  if (historyStack.value.length > 25) {
    historyStack.value.shift();
  }
}

function undo() {
  if (historyStack.value.length === 0) return;
  const snapshot = historyStack.value.pop()!;
  frontTier.value = [...snapshot.front];
  midTier.value = [...snapshot.mid];
  backTier.value = [...snapshot.back];
  selectedIds.value.clear();
  updateLabels();
  soundFX.playCardSnap();
  drawBoard();
}

// Map tiers for clean access
const tiersMap = {
  front: frontTier,
  mid: midTier,
  back: backTier,
};

// Drag and drop state
const dragState = ref<DragState>({
  isDragging: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  draggedCard: null,
  draggedCards: [],
  sourceTier: null,
  hoverTier: null,
  hoverCardId: null,
  pointerDownCard: null,
  pointerDownTier: null,
  pointerDownTime: 0,
});

// 3 Opponent Bot Hands and active opponent switcher
const botNames = ['西席 (罗宋巧手)', '北席 (十三飞龙)', '东席 (七星居士)'];
const botHands = ref<PlayerTiers[]>([]);
const opponentsBreakdown = ref<any[]>([]);
const activeOpponentIdx = ref(0);

const currentOpponentHands = computed<PlayerTiers>(() => {
  return botHands.value[activeOpponentIdx.value] || { front: [], mid: [], back: [] };
});

const currentOpponentInfo = computed(() => {
  return opponentsBreakdown.value[activeOpponentIdx.value] || null;
});

function scrollToOpponent(idx: number) {
  if (idx < 0 || idx >= botHands.value.length) return;
  activeOpponentIdx.value = idx;
  soundFX.playTap();
}

function compareTier(myCards: Card[], oppCards: Card[]): { text: string; delta: number } {
  if (!myCards.length || !oppCards.length) return { text: '平 0水', delta: 0 };
  const isHead = myCards.length === 3;
  const myEval = isHead ? evaluate3CardTier(myCards.map(toSSSCard)) : evaluate5CardTier(myCards.map(toSSSCard));
  const oppEval = isHead ? evaluate3CardTier(oppCards.map(toSSSCard)) : evaluate5CardTier(oppCards.map(toSSSCard));
  const myBonus = getTierBonusWater(isHead ? 'head' : 'mid', myEval).bonus;
  const oppBonus = getTierBonusWater(isHead ? 'head' : 'mid', oppEval).bonus;

  if (myEval.scoreRank > oppEval.scoreRank) {
    const net = 1 + Math.max(0, myBonus - oppBonus);
    return { text: `我胜 +${net}水`, delta: net };
  }
  if (myEval.scoreRank < oppEval.scoreRank) {
    const net = 1 + Math.max(0, oppBonus - myBonus);
    return { text: `我负 -${net}水`, delta: -net };
  }
  return { text: '平 0水', delta: 0 };
}

const isSetComplete = computed(() => (frontTier.value.length + midTier.value.length + backTier.value.length) === 13);

function toSSSCard(c: Card): SSSCard {
  return {
    id: c.id,
    rank: c.rank,
    suit: c.suit,
    suitVal: c.suit === '♠' ? 4 : c.suit === '♥' ? 3 : c.suit === '♣' ? 2 : 1,
    label: c.label,
    isRed: c.isRed,
  };
}

// Check for natural Special Hand (十三水至尊特殊牌型)
const mySpecialHand = computed(() => {
  const pool = isSetComplete.value
    ? [...frontTier.value, ...midTier.value, ...backTier.value]
    : fullHand.value;
  if (!pool || pool.length !== 13) return null;
  const cards = pool.map(toSSSCard);
  return detectSpecialHand(cards);
});

// Precise 13-Water watering diagnosis with exact reason and quick-fix target
const wateringDetail = computed(() => {
  // 牌墩数量合规时才校验倒水，理牌过程中自由放置不报错
  if (frontTier.value.length !== 3 || midTier.value.length !== 5 || backTier.value.length !== 5) {
    return {
      isWater: false,
      reason: '',
      violatingTier: null as 'front' | 'mid' | 'back' | null,
      fixAction: 'none' as const,
      fixLabel: '',
    };
  }

  // 特殊牌型免检倒水，直接通关
  if (mySpecialHand.value) {
    return {
      isWater: false,
      reason: '',
      violatingTier: null,
      fixAction: 'none' as const,
      fixLabel: '',
    };
  }

  return checkWateringDetail(
    frontTier.value.map(toSSSCard),
    midTier.value.map(toSSSCard),
    backTier.value.map(toSSSCard)
  );
});

const isWatering = computed(() => wateringDetail.value.isWater);

function findCardById(id: string): Card | null {
  for (const c of frontTier.value) if (c.id === id) return c;
  for (const c of midTier.value) if (c.id === id) return c;
  for (const c of backTier.value) if (c.id === id) return c;
  return null;
}

function getHandLabel(cards: Card[], expectedCount = 5): string {
  if (cards.length === 0) return '空';
  if (cards.length !== expectedCount) {
    return `${cards.length}张 (需${expectedCount}张)`;
  }
  if (cards.length === 3) {
    return evaluate3CardTier(cards.map(toSSSCard)).name;
  }
  return evaluate5CardTier(cards.map(toSSSCard)).name;
}

export interface ShowdownPlayer {
  seat: number;
  name: string;
  isMe: boolean;
  avatar: string;
  front: Card[];
  mid: Card[];
  back: Card[];
  netWater: number;
  isShot: boolean;
  isFoul: boolean;
  specialHand: SpecialHandResult | null;
  frontLabel: string;
  midLabel: string;
  backLabel: string;
  tiersDetail?: TierMatchDetail[];
  summary?: string;
}

const myTierBonuses = computed(() => {
  const h = evaluate3CardTier(frontTier.value.map(toSSSCard));
  const m = evaluate5CardTier(midTier.value.map(toSSSCard));
  const t = evaluate5CardTier(backTier.value.map(toSSSCard));
  return {
    head: getTierBonusWater('head', h).desc,
    mid: getTierBonusWater('mid', m).desc,
    tail: getTierBonusWater('tail', t).desc,
  };
});

const allShowdownPlayers = computed<ShowdownPlayer[]>(() => {
  const list: ShowdownPlayer[] = [];

  // 1. 本家 (我) - Seat 0
  const myCardsSSS = [...frontTier.value, ...midTier.value, ...backTier.value].map(toSSSCard);
  const mySpecial = detectSpecialHand(myCardsSSS);
  const myFoul = isFoulHand(
    frontTier.value.map(toSSSCard),
    midTier.value.map(toSSSCard),
    backTier.value.map(toSSSCard)
  );

  list.push({
    seat: 0,
    name: '我 (本家)',
    isMe: true,
    avatar: '👑',
    front: frontTier.value,
    mid: midTier.value,
    back: backTier.value,
    netWater: totalScore.value,
    isShot: opponentsBreakdown.value.some((o) => o.isShot),
    isFoul: myFoul && !mySpecial,
    specialHand: mySpecial,
    frontLabel: frontTierLabel.value,
    midLabel: midTierLabel.value,
    backLabel: backTierLabel.value,
    summary: `本局总战果：${totalScore.value >= 0 ? `+${totalScore.value}` : totalScore.value} 水`,
  });

  // 2. 对手席位
  const bNames = props.roomPlayers && props.roomPlayers.length > 1
    ? props.roomPlayers.slice(1).map((p: any, idx: number) => {
        const prefix = isEightPlayer.value ? `席位${idx + 2}` : ['西席', '北席', '东席'][idx] || `牌友${idx + 2}`;
        return `${prefix} (${p.name})`;
      })
    : (isEightPlayer.value
        ? ['一席 (牌友)', '二席 (牌友)', '三席 (牌友)', '四席 (牌友)', '五席 (牌友)', '六席 (牌友)', '七席 (牌友)']
        : ['西席 (牌友)', '北席 (牌友)', '东席 (牌友)']);

  const count = botHands.value.length;
  for (let i = 0; i < count; i++) {
    const opp = botHands.value[i];
    const oppInfo = opponentsBreakdown.value[i];
    if (!opp) continue;

    const oppCardsSSS = [...opp.front, ...opp.mid, ...opp.back].map(toSSSCard);
    const oppSpecial = detectSpecialHand(oppCardsSSS);
    const oppFoul = isFoulHand(
      opp.front.map(toSSSCard),
      opp.mid.map(toSSSCard),
      opp.back.map(toSSSCard)
    );

    list.push({
      seat: i + 1,
      name: bNames[i] || `牌友${i + 1}`,
      isMe: false,
      avatar: props.roomPlayers?.[i + 1]?.avatar || '👤',
      front: opp.front,
      mid: opp.mid,
      back: opp.back,
      netWater: oppInfo ? oppInfo.netWater : 0,
      isShot: Boolean(oppInfo?.isShot),
      isFoul: oppFoul && !oppSpecial,
      specialHand: oppSpecial,
      frontLabel: getHandLabel(opp.front),
      midLabel: getHandLabel(opp.mid),
      backLabel: getHandLabel(opp.back),
      tiersDetail: oppInfo?.tiers,
      summary: oppInfo?.summary,
    });
  }

  return list;
});

const displayedShowdownPlayers = computed<ShowdownPlayer[]>(() => {
  if (!isEightPlayer.value) {
    return allShowdownPlayers.value.slice(0, 4);
  }
  if (showdownPage.value === 0) {
    return allShowdownPlayers.value.slice(0, 4);
  } else {
    return allShowdownPlayers.value.slice(4, 8);
  }
});

const SUITS: { suit: '♠' | '♥' | '♣' | '♦'; isRed: boolean }[] = [
  { suit: '♠', isRed: false },
  { suit: '♥', isRed: true },
  { suit: '♣', isRed: false },
  { suit: '♦', isRed: true },
];

const RANKS = [
  { rank: 2, label: '2' }, { rank: 3, label: '3' }, { rank: 4, label: '4' },
  { rank: 5, label: '5' }, { rank: 6, label: '6' }, { rank: 7, label: '7' },
  { rank: 8, label: '8' }, { rank: 9, label: '9' }, { rank: 10, label: '10' },
  { rank: 11, label: 'J' }, { rank: 12, label: 'Q' }, { rank: 13, label: 'K' },
  { rank: 14, label: 'A' },
];

function createDecks(deckCount: number, matchToken: string = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`): Card[] {
  const pool: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const r of RANKS) {
      for (const s of SUITS) {
        pool.push({
          id: `${r.label}-${s.suit}-${d}-${matchToken}`,
          rank: r.rank,
          suit: s.suit,
          label: r.label,
          isRed: s.isRed,
        });
      }
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function toCards(sssCards: SSSCard[], lookupCards: Card[]): Card[] {
  const map = new Map(lookupCards.map((c) => [c.id, c]));
  return sssCards.map((sc) => map.get(sc.id) || {
    id: sc.id,
    rank: sc.rank,
    suit: sc.suit,
    label: sc.label,
    isRed: sc.isRed,
  });
}

function partitionHandLegally(cards13: Card[], strat: 'optimal' | 'solid' | 'flush' | 'balanced' = 'optimal'): PlayerTiers {
  const result = autoArrangeThirteen(cards13.map(toSSSCard), strat);
  return {
    front: toCards(result.head, cards13),
    mid: toCards(result.mid, cards13),
    back: toCards(result.tail, cards13),
  };
}

// Booking Train state refs
const showBookingModal = ref(false);
const bookingModalType = ref<'select-seat' | 'submission-success' | 'carriage-overview' | 'settlement-result'>('select-seat');
const bookingCarriage = ref<BookingCarriageState | null>(null);
const currentActiveBookingTable = ref<BookingTableState | null>(null);
const bookingSubmittedTable = ref<BookingTableState | null>(null);
const bookingSettlementRecord = ref<BookingSettlementRecord | null>(null);
const bookingCountdownText = ref('');
const bookingTargetTime = ref('');
let bookingTimer: any = null;

// 06:00 每日结算延时理牌逻辑 refs
const gracePeriodActive = ref(false);
const gracePeriodSeconds = ref(0);
let graceTimer: any = null;
const hasHandled0600Today = ref(false);

const isBookingTableSubmitted = computed(() => {
  return !!currentActiveBookingTable.value?.isSubmitted;
});

const completedBookingTablesCount = computed(() => {
  if (!bookingCarriage.value) return 0;
  return bookingCarriage.value.tables.filter((t) => t.isSubmitted).length;
});

const isCurrentHandFoul = computed(() => {
  if (frontTier.value.length !== 3 || midTier.value.length !== 5 || backTier.value.length !== 5) {
    return false;
  }
  return isWatering.value && !mySpecialHand.value;
});

function updateBookingCountdown() {
  const cd = calculateNext0600Countdown();
  if (gracePeriodActive.value) {
    bookingCountdownText.value = `⏰ 延时理牌中: ${gracePeriodSeconds.value}秒`;
  } else {
    bookingCountdownText.value = cd.countdownText;
  }
  bookingTargetTime.value = cd.formattedTargetTime;

  if (!isBookingScene.value) return;

  // 06:00 到达判定：倒计时刚好为 0 或 23:59:59 (跨日瞬间)，或者当前时间在 06:00:00 - 06:02:00 且今天尚未触发过 06:00 结算流程
  const now = new Date();
  const isExactly0600 = cd.hours === 0 && cd.minutes === 0 && cd.seconds === 0;
  const is0600Window = now.getHours() === 6 && now.getMinutes() === 0;

  if ((isExactly0600 || is0600Window) && !hasHandled0600Today.value) {
    const isArranging = currentActiveBookingTable.value && !currentActiveBookingTable.value.isSubmitted;

    if (isArranging) {
      if (!gracePeriodActive.value) {
        start0600GracePeriod();
      }
    } else {
      hasHandled0600Today.value = true;
      const mode = props.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
      const autoRec = checkAndAutoSettle0600(mode);
      if (autoRec) {
        bookingSettlementRecord.value = autoRec;
        bookingModalType.value = 'settlement-result';
        showBookingModal.value = true;
        showToast('🌅 每日 06:00 预约场晨间战报已自动生成公布！');
      }
    }
  }
}

function start0600GracePeriod() {
  hasHandled0600Today.value = true;
  gracePeriodActive.value = true;
  gracePeriodSeconds.value = 60;

  showToast('⏰ 每日 06:00 结算时刻已到！您正在理牌中，已为您延时 1 分钟完成本局，逾期将自动最优理牌封盘结算！');
  try {
    if (typeof soundFX?.speakVoice === 'function') {
      soundFX.speakVoice('每日六点结算时刻已到，请在一分钟内完成理牌。');
    }
  } catch {}

  if (graceTimer) clearInterval(graceTimer);
  graceTimer = setInterval(() => {
    gracePeriodSeconds.value--;
    if (gracePeriodSeconds.value <= 0) {
      clearInterval(graceTimer);
      graceTimer = null;
      gracePeriodActive.value = false;

      // 超时自动智能最优理牌并提交
      showToast('⌛ 延时 1 分钟理牌已截止，系统已自动智能最优理牌并封盘结算！');
      applyStrategy('optimal', false);

      const mode = props.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
      const handTiers: SubmittedHandTiers = {
        front: [...frontTier.value],
        mid: [...midTier.value],
        back: [...backTier.value],
        frontLabel: frontTierLabel.value,
        midLabel: midTierLabel.value,
        backLabel: backTierLabel.value,
        specialHand: mySpecialHand.value,
      };

      const res = submitCurrentTableHand(mode, handTiers);
      bookingCarriage.value = res.carriage;
      bookingSubmittedTable.value = res.submittedTable;

      const autoRec = checkAndAutoSettle0600(mode);
      if (autoRec) {
        bookingSettlementRecord.value = autoRec;
        bookingModalType.value = 'settlement-result';
        showBookingModal.value = true;
      }
    }
  }, 1000);
}

function initBookingTrainMode() {
  const mode = props.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';

  // 自动检查 06:00 晨间比水结算触发条件
  const autoRec = checkAndAutoSettle0600(mode);
  if (autoRec) {
    bookingSettlementRecord.value = autoRec;
    bookingModalType.value = 'settlement-result';
    showBookingModal.value = true;
    showToast('🌅 每日 06:00 预约场晨间战报已自动生成公布！');
  }

  const carriage = getCurrentCarriage(mode);
  bookingCarriage.value = carriage;

  updateBookingCountdown();
  if (bookingTimer) clearInterval(bookingTimer);
  bookingTimer = setInterval(updateBookingCountdown, 1000);

  if (!carriage.selectedSeat) {
    bookingModalType.value = 'select-seat';
    showBookingModal.value = true;
  } else {
    if (carriage.currentActiveTableIndex) {
      const tbl = carriage.tables.find((t) => t.tableIndex === carriage.currentActiveTableIndex);
      if (tbl) {
        loadBookingTableCards(tbl);
        return;
      }
    }
    onBookingNextTable();
  }
}

function loadBookingTableCards(table: BookingTableState) {
  currentActiveBookingTable.value = table;
  const mySeat = table.playerSeat || bookingCarriage.value?.selectedSeat || '东';
  const myCards = table.seatCards[mySeat] || [];

  if (myCards.length === 13) {
    fullHand.value = [...myCards];
    frontTier.value = [];
    midTier.value = [];
    backTier.value = [];
    hasCompared.value = table.isSubmitted;
    selectedIds.value.clear();
    historyStack.value = [];
    applyStrategy('optimal', false, myCards);
    nextTick(() => drawBoard());
  }
}

function onBookingSelectSeat(seat: BookingSeat) {
  const mode = props.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
  const res = selectCarriageSeat(mode, seat);
  bookingCarriage.value = res.carriage;
  showBookingModal.value = false;
  if (res.activeTable) {
    loadBookingTableCards(res.activeTable);
    showToast(`🚂 已成功坐席【${seat}位】！分配第 ${res.activeTable.tableIndex} 桌手牌进行理牌`);
  }
}

function onBookingNextTable() {
  const mode = props.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
  const res = pickNextRandomTable(mode);
  bookingCarriage.value = res.carriage;
  showBookingModal.value = false;

  if (res.activeTable) {
    loadBookingTableCards(res.activeTable);
    showToast(`🎲 随机抽选第 ${res.activeTable.tableIndex} 桌【${bookingCarriage.value?.selectedSeat || '东'}位】手牌为您理牌出战`);
  } else if (res.carriage.isCompleted) {
    bookingModalType.value = 'carriage-overview';
    showBookingModal.value = true;
    showToast('🎉 本节车厢 10 张牌桌已全员理牌归档完成！');
  }
}

function handleBookingSubmit() {
  if (!currentActiveBookingTable.value) return;

  if (frontTier.value.length !== 3 || midTier.value.length !== 5 || backTier.value.length !== 5) {
    soundFX.playPass();
    haptics.selection();
    showToast(
      `⚠️ 牌墩数量不合规：头道需3张 (当前${frontTier.value.length}张)，中道需5张 (当前${midTier.value.length}张)，尾道需5张 (当前${backTier.value.length}张)`
    );
    return;
  }

  if (isWatering.value && !mySpecialHand.value) {
    soundFX.playDaoshui();
    haptics.selection();
    showToast(wateringDetail.value.reason || '⚠️ 当前牌型倒水相公 (尾道需 >= 中道 >= 头道)，请调整后再提交！');
    return;
  }

  // 若处于 06:00 延时理牌阶段，清除延时定时器并立即进行结算
  const wasGraceActive = gracePeriodActive.value;
  if (gracePeriodActive.value) {
    if (graceTimer) clearInterval(graceTimer);
    graceTimer = null;
    gracePeriodActive.value = false;
    gracePeriodSeconds.value = 0;
  }

  const mode = props.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
  const handTiers: SubmittedHandTiers = {
    front: [...frontTier.value],
    mid: [...midTier.value],
    back: [...backTier.value],
    frontLabel: frontTierLabel.value,
    midLabel: midTierLabel.value,
    backLabel: backTierLabel.value,
    specialHand: mySpecialHand.value,
  };

  const res = submitCurrentTableHand(mode, handTiers);
  bookingCarriage.value = res.carriage;
  bookingSubmittedTable.value = res.submittedTable;

  soundFX.playVictory();
  haptics.victory();

  if (wasGraceActive) {
    const autoRec = checkAndAutoSettle0600(mode);
    if (autoRec) {
      bookingSettlementRecord.value = autoRec;
      bookingModalType.value = 'settlement-result';
      showBookingModal.value = true;
      showToast('🌅 延时提交成功！每日 06:00 晨间战报已自动生成公布！');
      return;
    }
  }

  bookingModalType.value = 'submission-success';
  showBookingModal.value = true;
}

function openCarriageOverview() {
  const mode = props.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
  bookingCarriage.value = getCurrentCarriage(mode);
  bookingModalType.value = 'carriage-overview';
  showBookingModal.value = true;
}

function onBookingAdvanceCarriage() {
  const mode = props.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
  const newCarriage = advanceToNextCarriage(mode);
  bookingCarriage.value = newCarriage;
  bookingModalType.value = 'select-seat';
  showBookingModal.value = true;
  showToast(`🎉 轰隆隆！发车进入第 ${newCarriage.carriageNumber} 节车厢 (开启第 ${newCarriage.carriageNumber} 场次)`);
}

function onBookingSimulateSettle() {
  const mode = props.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
  const record = settleCarriageTables(mode, bookingCarriage.value?.carriageNumber, true);
  bookingSettlementRecord.value = record;
  bookingModalType.value = 'settlement-result';
  showBookingModal.value = true;
}

const lastAppliedDealId = ref<string>('');

function clearLocalSnapshot() {
  const roomId = props.roomId;
  if (!roomId) return;
  try {
    localStorage.removeItem(`shisanshui_table_snapshot_${roomId}`);
    localStorage.removeItem('shisanshui_table_snapshot_latest');
  } catch {}
}

function saveLocalSnapshot() {
  if (props.isPracticeMode) return;
  const roomId = props.roomId;
  if (!roomId) return;
  if (hasCompared.value || showSettlementModal.value) {
    clearLocalSnapshot();
    return;
  }
  if (!fullHand.value || fullHand.value.length === 0) return;

  try {
    const snap = {
      dealId: lastAppliedDealId.value,
      roomId,
      fullHand: fullHand.value,
      frontTier: frontTier.value,
      midTier: midTier.value,
      backTier: backTier.value,
      selectedSpecialHand: selectedSpecialHand.value,
      isSpecialHandClaimed: isSpecialHandClaimed.value,
      isWaitingShowdown: isWaitingShowdown.value,
      submittedSeats: Array.from(submittedSeats.value),
      bookingSubmittedTable: bookingSubmittedTable.value,
      timestamp: Date.now(),
    };
    const serialized = JSON.stringify(snap);
    localStorage.setItem(`shisanshui_table_snapshot_${roomId}`, serialized);
    localStorage.setItem('shisanshui_table_snapshot_latest', serialized);
  } catch {}
}

function tryRestoreLocalSnapshot(): boolean {
  if (props.isPracticeMode) return false;
  const roomId = props.roomId;
  if (!roomId) return false;
  try {
    const raw = localStorage.getItem(`shisanshui_table_snapshot_${roomId}`) || localStorage.getItem('shisanshui_table_snapshot_latest');
    if (!raw) return false;
    const snap = JSON.parse(raw);
    if (!snap || !Array.isArray(snap.fullHand) || snap.fullHand.length === 0) return false;
    if (Date.now() - (snap.timestamp || 0) > 2 * 3600 * 1000) {
      clearLocalSnapshot();
      return false;
    }
    const currentDeal = props.initialDeal;
    const dealIdentifier = currentDeal?.dealId || currentDeal?.createdAt || (Array.isArray(currentDeal?.seatCards?.[0]) ? currentDeal.seatCards[0].map((c: any) => c.id).join('-') : '');
    if (dealIdentifier && snap.dealId && snap.dealId !== dealIdentifier) {
      return false;
    }

    lastAppliedDealId.value = snap.dealId || dealIdentifier || '';
    fullHand.value = snap.fullHand || [];
    frontTier.value = snap.frontTier || [];
    midTier.value = snap.midTier || [];
    backTier.value = snap.backTier || [];
    selectedSpecialHand.value = snap.selectedSpecialHand || null;
    isSpecialHandClaimed.value = Boolean(snap.isSpecialHandClaimed);
    isWaitingShowdown.value = Boolean(snap.isWaitingShowdown);
    if (Array.isArray(snap.submittedSeats)) {
      submittedSeats.value = new Set(snap.submittedSeats);
    }
    if (snap.bookingSubmittedTable) {
      bookingSubmittedTable.value = snap.bookingSubmittedTable;
    }

    isDealingCeremony.value = false;
    nextTick(() => drawBoard());
    console.log(`🌊 [十三水断线重连] 瞬时恢复牌局状态：手牌 ${fullHand.value.length} 张，理牌就绪: ${isWaitingShowdown.value}`);
    return true;
  } catch (err) {
    console.warn('[Shisanshui Snapshot Restore Error]', err);
  }
  return false;
}

function handleReconnectSync(msg: any) {
  if (!msg) return;
  isDealingCeremony.value = false;
  const bs = msg.boardState;
  const deal = msg.deal;
  if (deal?.dealId) lastAppliedDealId.value = deal.dealId;

  if (bs?.shisanshuiSubmissions) {
    Object.keys(bs.shisanshuiSubmissions).forEach((s) => {
      submittedSeats.value.add(Number(s));
    });
    if (bs.shisanshuiSubmissions[mySeat.value]) {
      isWaitingShowdown.value = true;
    }
  }
  nextTick(() => drawBoard());
  saveLocalSnapshot();
}

function dealNewMatch(forceReApply = false, overrideDeal?: any) {
  const activeDeal = overrideDeal || props.initialDeal;
  if (!props.isPracticeMode && activeDeal?.seatCards) {
    const dealIdentifier = activeDeal.dealId || activeDeal.createdAt || (Array.isArray(activeDeal.seatCards[0]) ? activeDeal.seatCards[0].map((c: any) => c.id).join('-') : '');
    if (!forceReApply && lastAppliedDealId.value && lastAppliedDealId.value === dealIdentifier && fullHand.value && fullHand.value.length > 0) {
      console.log(`🛡️ [十三水网络波动防重刷] 发牌 ${dealIdentifier} 已在桌上执行，跳过重复洗牌与重置`);
      return;
    }
    lastAppliedDealId.value = dealIdentifier;
  } else if (props.isPracticeMode) {
    lastAppliedDealId.value = `practice-${Date.now()}`;
  }

  // 关键重置：开局发牌时重置准备与快照，确保“继续下一局”能无限顺畅循环
  hasClickedReady.value = false;
  clearLocalSnapshot();

  triggerDealingCeremony();
  if (isBookingScene.value) {
    initBookingTrainMode();
    return;
  }
  const deckCount = isEightPlayer.value ? 2 : 1;
  const totalSeats = isEightPlayer.value ? 8 : 4;
  const oppCount = totalSeats - 1;

  let newPlayerCards: Card[] = [];
  const opps: PlayerTiers[] = [];

  // 权威发牌检查：在联机且存在来自服务器同一副牌的 activeDeal 时，全员严格使用同一副牌切片！
  const rawDealCards = activeDeal?.seatCards;
  const hasValidDeal = !props.isPracticeMode && rawDealCards && (Array.isArray(rawDealCards) ? rawDealCards.length >= totalSeats : Object.keys(rawDealCards).length >= totalSeats);
  if (hasValidDeal) {
    const seatIdx = mySeat.value;
    newPlayerCards = (rawDealCards[seatIdx] || []).map((c: any) => ({
      id: c.id,
      rank: c.rank,
      suit: c.suit,
      label: c.label,
      isRed: c.isRed,
    }));

    // 其他席位取自服务器发牌数据
    for (let i = 0; i < totalSeats; i++) {
      if (i === seatIdx) continue;
      const rawOppCards: Card[] = (rawDealCards[i] || []).map((c: any) => ({
        id: c.id,
        rank: c.rank,
        suit: c.suit,
        label: c.label,
        isRed: c.isRed,
      }));
      const oppArrangement = autoArrangeThirteen(rawOppCards.map(toSSSCard), 'optimal');
      opps.push({
        front: toCards(oppArrangement.head, rawOppCards),
        mid: toCards(oppArrangement.mid, rawOppCards),
        back: toCards(oppArrangement.tail, rawOppCards),
      });
    }
  } else {
    // 单机/练习模式兜底：现场洗出一副 (或两副) 扑克牌
    const matchToken = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const deck = createDecks(deckCount, matchToken);
    newPlayerCards = deck.slice(0, 13);
    for (let i = 0; i < oppCount; i++) {
      const oppCards = deck.slice(13 + i * 13, 13 + (i + 1) * 13);
      const oppArrangement = autoArrangeThirteen(oppCards.map(toSSSCard), 'optimal');
      opps.push({
        front: toCards(oppArrangement.head, oppCards),
        mid: toCards(oppArrangement.mid, oppCards),
        back: toCards(oppArrangement.tail, oppCards),
      });
    }
  }

  fullHand.value = [...newPlayerCards];

  // 清空各道旧牌，确保绝对不沿用上一把手牌
  frontTier.value = [];
  midTier.value = [];
  backTier.value = [];

  // 重置比水与结算状态
  hasCompared.value = false;
  isWaitingShowdown.value = false;
  submittedSeats.value.clear();
  remoteSubmittedHands.value.clear();
  totalScore.value = 0;
  isGrandSlam.value = false;
  showGunshotAnim.value = false;
  showSpecialHandModal.value = false;
  opponentsBreakdown.value = [];
  selectedIds.value.clear();
  historyStack.value = [];
  activeOpponentIdx.value = 0;
  showdownPage.value = 0;

  if (arrangeTimer) {
    clearInterval(arrangeTimer);
    arrangeTimer = null;
  }
  arrangeCountdown.value = 60;
  if (!isBookingScene.value) {
    arrangeTimer = setInterval(() => {
      if (hasCompared.value) {
        if (arrangeTimer) {
          clearInterval(arrangeTimer);
          arrangeTimer = null;
        }
        return;
      }
      arrangeCountdown.value--;
      if (arrangeCountdown.value <= 0) {
        if (arrangeTimer) {
          clearInterval(arrangeTimer);
          arrangeTimer = null;
        }
        if (!hasCompared.value) {
          if (!isWaitingShowdown.value) {
            if (!isSetComplete.value) {
              applyStrategy('optimal', false);
            }
            handleCompare();
          }
          executeShowdown();
        }
      }
    }, 1000);
  }

  botHands.value = opps;

  // 1. 优先将全新洗出的 13 张手牌进行一键最优排布（确保扑克牌立即显示在牌桌上）
  applyStrategy('optimal', false, newPlayerCards);

  // 2. 安全播放开局清脆洗牌发牌声效（音效异常绝不阻塞扑克牌渲染）
  try {
    if (typeof soundFX?.playCardsShort === 'function') {
      soundFX.playCardsShort();
    } else if (typeof soundFX?.playCardSnap === 'function') {
      soundFX.playCardSnap();
    }
  } catch {}

  // 3. 若开局检测到特殊牌型，仅播放音效提醒，绝不自动打开弹窗遮挡扑克牌，保持手动理牌视角完全开阔
  const special = detectSpecialHand(newPlayerCards.map(toSSSCard));
  if (special) {
    try { soundFX?.playVictory?.(); } catch {}
    haptics.victory();
    showSpecialHandModal.value = false;
  }

  nextTick(() => {
    updateDimensions();
    drawBoard();
    requestAnimationFrame(() => {
      drawBoard();
    });
  });
}

function openVictoryPoster() {
  const isWin = totalScore.value > 0;
  const isLoss = totalScore.value < 0;
  const outcome: 'win' | 'lose' | 'draw' = isWin ? 'win' : isLoss ? 'lose' : 'draw';
  const highlights: string[] = [];
  if (mySpecialHand.value) {
    highlights.push(`天降特殊牌型【${mySpecialHand.value.name}】(+${mySpecialHand.value.bonusWater}水)`);
  }
  if (isGrandSlam.value) {
    highlights.push('横扫全场 · 打枪全垒打 (水数翻倍)');
  }
  if (frontTierLabel.value) {
    highlights.push(`头道出招: ${frontTierLabel.value}`);
  }
  if (midTierLabel.value) {
    highlights.push(`中道绝学: ${midTierLabel.value}`);
  }
  if (backTierLabel.value) {
    highlights.push(`尾道镇场: ${backTierLabel.value}`);
  }

  emit('open-poster', {
    gameType: '十三水',
    gameTypeBadge: isEightPlayer.value ? '八人场' : '四人场',
    gameMode: currentSceneLabel.value,
    playerName: props.currentUser?.name || '雀坛国手',
    playerAvatar: props.currentUser?.avatar || '👑',
    outcome,
    scoreDelta: totalScore.value,
    scoreUnit: '水',
    tableSummary: `头道[${frontTierLabel.value}] · 中道[${midTierLabel.value}] · 尾道[${backTierLabel.value}]`,
    opponentSummary: `对战 ${displayedShowdownPlayers.value.filter((p) => !p.isMe).length} 位牌友`,
    highlights,
    customSealText: isGrandSlam.value ? '全垒大捷' : mySpecialHand.value ? '至尊龙威' : totalScore.value > 10 ? '横扫千军' : undefined,
  });
}

function handleLeaveToLobby() {
  if (props.ws && props.ws.readyState === WebSocket.OPEN && !props.isPracticeMode) {
    try {
      props.ws.send(
        JSON.stringify({
          type: 'scene_leave',
          roomId: props.roomId,
          playerId: props.currentUser?.id,
          playerName: props.currentUser?.name,
          gameType: 'shisanshui',
          sceneMode: props.sceneMode,
        })
      );
    } catch {}
  }
  emit('exit');
}

function onRestartGame() {
  soundFX.playTap();
  if (props.isPracticeMode || isAllOtherPlayersBots.value) {
    hasClickedReady.value = false;
    dealNewMatch(true);
    emit('restart');
    return;
  }

  hasClickedReady.value = true;
  if (props.ws && props.ws.readyState === WebSocket.OPEN) {
    try {
      props.ws.send(JSON.stringify({
        type: 'scene_player_ready',
        roomId: props.roomId,
        playerId: props.currentUser?.id,
        isReady: true,
      }));
      props.ws.send(JSON.stringify({
        type: 'room_restart',
        roomId: props.roomId,
        gameType: 'shisanshui',
        sceneMode: props.sceneMode,
      }));
    } catch {}
  }
}

function applyStrategy(strat: 'optimal' | 'solid' | 'flush' | 'balanced', recordHistory = true, inputCards?: Card[]) {
  if (recordHistory) pushHistory();
  const currentPool = inputCards || (
    (frontTier.value.length + midTier.value.length + backTier.value.length === 13)
      ? [...frontTier.value, ...midTier.value, ...backTier.value]
      : fullHand.value
  );
  const cards13 = currentPool.length === 13 ? currentPool : fullHand.value;
  const allCardsSSS = cards13.map(toSSSCard);
  const result = autoArrangeThirteen(allCardsSSS, strat);

  frontTier.value = toCards(result.head, cards13);
  midTier.value = toCards(result.mid, cards13);
  backTier.value = toCards(result.tail, cards13);

  updateLabels();
  soundFX.playCardSnap();

  // 变换牌型不显示弹幕/Toast提示牌型，保持对局沉浸清爽

  nextTick(() => {
    drawBoard();
  });
}

function updateLabels() {
  frontTierLabel.value = getHandLabel(frontTier.value, 3);
  midTierLabel.value = getHandLabel(midTier.value, 5);
  backTierLabel.value = getHandLabel(backTier.value, 5);
}

/**
 * Whole Tier Swap: Fast swap between Mid and Back (5 cards vs 5 cards)
 */
function swapTiers(tierA: 'front' | 'mid' | 'back', tierB: 'front' | 'mid' | 'back') {
  if (tierA === tierB) return;
  pushHistory();

  if ((tierA === 'mid' && tierB === 'back') || (tierA === 'back' && tierB === 'mid')) {
    const tmp = [...midTier.value];
    midTier.value = [...backTier.value];
    backTier.value = tmp;
  } else {
    // Front vs Mid or Front vs Back: balance pool
    const otherTier = tierA === 'front' ? tierB : tierA;
    const pool = [...frontTier.value, ...tiersMap[otherTier].value].sort((a, b) => b.rank - a.rank);
    if (otherTier === 'mid') {
      midTier.value = pool.slice(0, 5);
      frontTier.value = pool.slice(5, 8);
    } else {
      backTier.value = pool.slice(0, 5);
      frontTier.value = pool.slice(5, 8);
    }
  }

  selectedIds.value.clear();
  soundFX.playCardSnap();
  updateLabels();
  drawBoard();
}

/**
 * Sorts single tier descending by rank
 */
function sortTier(tierName: 'front' | 'mid' | 'back') {
  pushHistory();
  tiersMap[tierName].value.sort((a, b) => b.rank - a.rank);
  soundFX.playCardSnap();
  updateLabels();
  drawBoard();
}

/**
 * One-click intelligent anti-watering auto balance
 */
function autoFixWatering() {
  pushHistory();
  const detail = wateringDetail.value;
  if (detail.fixAction === 'swap_mid_back') {
    const tmp = [...midTier.value];
    midTier.value = [...backTier.value];
    backTier.value = tmp;
  } else if (detail.fixAction === 'rebalance_front_mid') {
    const pool = [...midTier.value, ...frontTier.value].sort((a, b) => b.rank - a.rank);
    midTier.value = pool.slice(0, 5);
    frontTier.value = pool.slice(5, 8);
    const midEval = evaluate5CardTier(midTier.value.map(toSSSCard));
    const backEval = evaluate5CardTier(backTier.value.map(toSSSCard));
    if (midEval.scoreRank > backEval.scoreRank) {
      const tmp = [...midTier.value];
      midTier.value = [...backTier.value];
      backTier.value = tmp;
    }
  } else {
    applyStrategy('optimal', false);
  }

  // 若依然处于倒水状态，启用全手牌一键最优理牌确保绝对不倒水
  if (wateringDetail.value.isWater) {
    applyStrategy('optimal', false);
  }

  updateLabels();
  soundFX.playCardSnap();
  drawBoard();
}

/**
 * Precision 1-to-1 card swap between two tiers or reordering within the same tier
 */
function swapCardsDirectly(
  cardA: Card,
  fromTierA: 'front' | 'mid' | 'back',
  cardB: Card,
  fromTierB: 'front' | 'mid' | 'back'
) {
  pushHistory();
  const listA = tiersMap[fromTierA].value;
  const listB = tiersMap[fromTierB].value;

  const idxA = listA.findIndex((c) => c.id === cardA.id);
  const idxB = listB.findIndex((c) => c.id === cardB.id);

  if (fromTierA === fromTierB) {
    if (idxA !== -1 && idxB !== -1) {
      const tmp = listA[idxA];
      listA[idxA] = listA[idxB];
      listA[idxB] = tmp;
    }
  } else {
    if (idxA !== -1 && idxB !== -1) {
      listA[idxA] = cardB;
      listB[idxB] = cardA;
    }
  }

  selectedIds.value.clear();
  updateLabels();
  soundFX.playCardSnap();
  haptics.playCard();
  drawBoard();
}

/**
 * Reorders cards in the same tier by dragging one card and inserting near another
 */
function reorderCardInTier(tierName: 'front' | 'mid' | 'back', cardId: string, targetCardId: string) {
  const list = [...tiersMap[tierName].value];
  const fromIdx = list.findIndex((c) => c.id === cardId);
  const toIdx = list.findIndex((c) => c.id === targetCardId);
  if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
    pushHistory();
    const [card] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, card);
    tiersMap[tierName].value = list;
    soundFX.playCardSnap();
    haptics.playCard();
    updateLabels();
    drawBoard();
  }
}

/**
 * Moves currently selected cards to target tier (自由理牌：牌墩不限制扑克牌数量)
 */
function moveSelectedCardsTo(targetTierName: 'front' | 'mid' | 'back') {
  if (selectedIds.value.size === 0) return;

  const movingCards: { card: Card; fromTier: 'front' | 'mid' | 'back' }[] = [];
  (['front', 'mid', 'back'] as const).forEach((t) => {
    if (t !== targetTierName) {
      tiersMap[t].value.forEach((c) => {
        if (selectedIds.value.has(c.id)) {
          movingCards.push({ card: c, fromTier: t });
        }
      });
    }
  });

  if (movingCards.length === 0) {
    selectedIds.value.clear();
    drawBoard();
    return;
  }

  pushHistory();

  for (const { card, fromTier } of movingCards) {
    const srcList = tiersMap[fromTier].value;
    const sIdx = srcList.findIndex((c) => c.id === card.id);
    if (sIdx !== -1) {
      srcList.splice(sIdx, 1);
    }
    tiersMap[targetTierName].value.push(card);
  }

  selectedIds.value.clear();
  soundFX.playCardSnap();
  haptics.playCard();
  updateLabels();
  drawBoard();
}

function drawBoard() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = tableWidthPx.value;
  const height = tableHeightPx.value;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Background with luxury sapphire table felt gradient
  const highlight = props.tableTheme?.highlightColor || '#F8FAFC';
  const felt = props.tableTheme?.feltColor || '#E5E7EB';
  const edge = props.tableTheme?.edgeColor || '#D1D5DB';

  const grad = ctx.createRadialGradient(width / 2, height / 2 - 20, 20, width / 2, height / 2, Math.max(width, height));
  grad.addColorStop(0, highlight);
  grad.addColorStop(0.35, felt);
  grad.addColorStop(0.85, edge);
  grad.addColorStop(1, edge);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle luxury table felt inner rim
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 0);
  ctx.stroke();

  // Ambient spotlight
  const spotGrad = ctx.createRadialGradient(width / 2, height / 2 - 20, 0, width / 2, height / 2 - 20, Math.min(width, height) / 1.5);
  spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  spotGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)');
  spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = spotGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Top In-Canvas HUD Controls: Undo & Watering Warning
  // 1. Undo Button - Moved to DOM

  // 2. Watering Diagnosis Banner (interactive click-to-fix)
  if (isWatering.value) {
    const bannerX = 120;
    const bannerY = 7;
    const bannerW = Math.max(200, width - 120 - 95);
    const bannerH = 24;
    ctx.save();
    ctx.fillStyle = 'rgba(185, 28, 28, 0.85)';
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(wateringDetail.value.reason, bannerX + 8, bannerY + bannerH / 2);

    // Click to fix badge
    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`⚡ ${wateringDetail.value.fixLabel}`, bannerX + bannerW - 8, bannerY + bannerH / 2);
    ctx.restore();
  } else if (mySpecialHand.value) {
    const bannerX = 120;
    const bannerY = 7;
    const bannerW = Math.max(200, width - 120 - 95);
    const bannerH = 24;
    ctx.save();
    ctx.fillStyle = 'rgba(217, 119, 6, 0.88)';
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`👑 特殊牌型：【${mySpecialHand.value.name}】(+${mySpecialHand.value.bonusWater}水)`, bannerX + 8, bannerY + bannerH / 2);

    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('⚡ 免比通关 · 点击开牌', bannerX + bannerW - 8, bannerY + bannerH / 2);
    ctx.restore();
  }

  // Draw 3 Tiers Slots
  const drawTierSlot = (
    y: number,
    title: string,
    cards: Card[],
    maxCount: number,
    label: string,
    slotName: 'front' | 'mid' | 'back'
  ) => {
    const isHovered = dragState.value.isDragging && dragState.value.hoverTier === slotName;
    const hasSelection = selectedIds.value.size > 0;
    const hasCardsFromOtherTier = Array.from(selectedIds.value).some((id) => !cards.some((c) => c.id === id));
    const canAcceptMoving = hasSelection && hasCardsFromOtherTier;
    const isViolating = isWatering.value && wateringDetail.value.violatingTier === slotName;

    // Slot surface
    ctx.save();
    if (isHovered) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
      ctx.shadowBlur = 10;
    } else if (canAcceptMoving) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
    } else if (isViolating) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
    }

    ctx.beginPath();
    ctx.roundRect(120, y, width - 132, 118, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Title & count
    const isCompliant = cards.length === maxCount;
    const countNote = isCompliant ? '✓' : (cards.length > maxCount ? `超${cards.length - maxCount}张` : `缺${maxCount - cards.length}张`);
    const titleText = `${title} (${cards.length}/${maxCount}) · ${countNote}`;
    ctx.fillStyle = isCompliant ? '#FDE047' : '#FCA5A5';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(titleText, width - 24, y + 22);

    // Hand label or move indicator
    ctx.font = '600 11px sans-serif';
    if (canAcceptMoving) {
      ctx.fillStyle = '#FBBF24';
      ctx.fillText(`👉 点击换入[${title}] (${selectedIds.value.size}张)`, width - 24, y + 40);
    } else {
      ctx.fillStyle = isViolating ? '#F87171' : (isCompliant ? '#6EE7B7' : '#FCA5A5');
      ctx.fillText(`【${label}】`, width - 24, y + 40);
    }

    // In-Canvas quick tier action buttons (Swap/Sort)
    if (slotName === 'mid' || slotName === 'back') {
      const btnW = 86;
      const btnH = 20;
      const btnX = width - btnW - 24;
      const btnY = y + 50;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#93C5FD';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slotName === 'mid' ? '🔄 中尾对调' : '🔄 尾中对调', btnX + btnW / 2, btnY + btnH / 2);
      ctx.restore();
    } else if (slotName === 'front') {
      const btnW = 60;
      const btnH = 20;
      const btnX = width - btnW - 24;
      const btnY = y + 50;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#93C5FD';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('↕ 排序', btnX + btnW / 2, btnY + btnH / 2);
      ctx.restore();
    }

    // When cards from another tier are selected: draw prominent target move button
    if (canAcceptMoving) {
      const moveBtnW = 106;
      const moveBtnH = 22;
      const moveBtnX = width - moveBtnW - 24;
      const moveBtnY = y + 76;

      ctx.save();
      ctx.fillStyle = '#F59E0B';
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(moveBtnX, moveBtnY, moveBtnW, moveBtnH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`📥 移入${title} (${selectedIds.value.size}张)`, moveBtnX + moveBtnW / 2, moveBtnY + moveBtnH / 2);
      ctx.restore();
    }

    // Stacked cards rendering (动态平铺压缩，牌墩不限张数)
    const cardW = 62;
    const cardH = 96;
    const startX = 130;
    const slotAreaWidth = width - 132;
    const denom = Math.max(cards.length - 1, maxCount - 1, 1);
    const overlap = Math.max(14, Math.min(50, (slotAreaWidth - startX - cardW - 80) / denom));

    for (let i = 0; i < Math.max(cards.length, maxCount); i++) {
      const cx = startX + i * overlap;
      const c = cards[i];

      if (c) {
        const isSel = selectedIds.value.has(c.id);
        const isHoverTarget =
          dragState.value.isDragging &&
          dragState.value.hoverCardId === c.id &&
          dragState.value.draggedCard?.id !== c.id;
        const isBeingDragged =
          dragState.value.isDragging && dragState.value.draggedCard?.id === c.id;

        const cy = y + (isSel ? 2 : 12);

        if (isBeingDragged) {
          // Render placeholder in the original slot
          ctx.save();
          ctx.globalAlpha = 0.35;
          renderPlayingCard(ctx, c, cx, cy, cardW, cardH, {
            isSelected: false,
            borderRadius: 4,
            shadow: false,
            borderColor: 'rgba(255, 255, 255, 0.4)',
            borderWidth: 1,
          });
          ctx.restore();
        } else {
          renderPlayingCard(ctx, c, cx, cy, cardW, cardH, {
            isSelected: isSel,
            borderRadius: 4,
            shadow: true,
            borderColor: isHoverTarget ? '#FBBF24' : (isSel ? '#EF4444' : undefined),
            borderWidth: isHoverTarget ? 3.5 : (isSel ? 3.5 : 1),
          });

          // Selected card visual indicators
          if (isSel) {
            ctx.save();
            ctx.strokeStyle = '#EF4444';
            ctx.lineWidth = 3.5;
            ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cardW, cardH, 4);
            ctx.stroke();

            ctx.fillStyle = '#DC2626';
            ctx.beginPath();
            ctx.arc(cx + cardW - 8, cy + 8, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Target swap highlight icon
          if (isHoverTarget) {
            ctx.save();
            ctx.fillStyle = '#F59E0B';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 6;
            ctx.fillText('⇄', cx + cardW / 2, cy + cardH / 2);
            ctx.restore();
          }
        }
      } else {
        const cy = y + 12;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx, cy, cardW, cardH, 4);
        ctx.fill();
        ctx.stroke();
      }
    }
  };

  drawTierSlot(40, '头道', frontTier.value, 3, frontTierLabel.value, 'front');
  drawTierSlot(165, '中道', midTier.value, 5, midTierLabel.value, 'mid');
  drawTierSlot(290, '尾道', backTier.value, 5, backTierLabel.value, 'back');

  // Floating Dragged Card(s) Rendering
  if (dragState.value.isDragging && dragState.value.draggedCard) {
    const cardW = 62;
    const cardH = 96;
    const fx = dragState.value.currentX - cardW / 2;
    const fy = dragState.value.currentY - cardH / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;

    // Slight dynamic rotation for natural card physics
    ctx.translate(fx + cardW / 2, fy + cardH / 2);
    ctx.rotate(0.04);
    ctx.translate(-(fx + cardW / 2), -(fy + cardH / 2));

    renderPlayingCard(ctx, dragState.value.draggedCard, fx, fy, cardW, cardH, {
      isSelected: true,
      shadow: true,
      borderRadius: 4,
      borderColor: '#F59E0B',
      borderWidth: 3,
    });
    ctx.restore();
  }
}

function onCanvasPointerDown(e: PointerEvent) {
  if (hasCompared.value) return;
  const canvas = canvasRef.value;
  if (!canvas) return;

  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {}

  const width = tableWidthPx.value;
  const height = tableHeightPx.value;
  const { x, y } = getCanvasEventCoords(canvas, e.clientX, e.clientY, props.isRotated90, width, height);

  // 2. Watering Diagnosis Banner Tap (Click to Fix)
  if (isWatering.value) {
    const bannerX = 120;
    const bannerY = 7;
    const bannerW = Math.max(200, width - 120 - 95);
    const bannerH = 24;
    if (x >= bannerX && x <= bannerX + bannerW && y >= bannerY && y <= bannerY + bannerH) {
      autoFixWatering();
      return;
    }
  }

  // 3. Quick Action Buttons on Tiers
  // Front sort button
  if (x >= width - 84 && x <= width - 24 && y >= 40 + 50 && y <= 40 + 70) {
    sortTier('front');
    return;
  }
  // Mid swap with back button
  if (x >= width - 110 && x <= width - 24 && y >= 165 + 50 && y <= 165 + 70) {
    swapTiers('mid', 'back');
    return;
  }
  // Back swap with mid button
  if (x >= width - 110 && x <= width - 24 && y >= 290 + 50 && y <= 290 + 70) {
    swapTiers('mid', 'back');
    return;
  }

  // 4. Cards hit detection
  const tiers = [
    { list: frontTier.value, y: 40, max: 3, name: 'front' as const, title: '头道' },
    { list: midTier.value, y: 165, max: 5, name: 'mid' as const, title: '中道' },
    { list: backTier.value, y: 290, max: 5, name: 'back' as const, title: '尾道' },
  ];

  const slotAreaWidth = width - 132;
  const cardW = 62;
  const cardH = 96;
  const startX = 130;

  let hitCard: Card | null = null;
  let hitTier: typeof tiers[0] | null = null;

  for (const t of tiers) {
    const denom = Math.max(t.list.length - 1, t.max - 1, 1);
    const overlap = Math.max(14, Math.min(50, (slotAreaWidth - startX - cardW - 80) / denom));
    for (let i = t.list.length - 1; i >= 0; i--) {
      const cx = startX + i * overlap;
      const isSel = selectedIds.value.has(t.list[i].id);
      const cy = t.y + (isSel ? 2 : 12);
      const hitW = (i === t.list.length - 1) ? cardW : overlap;

      if (x >= cx && x <= cx + hitW && y >= cy && y <= cy + cardH) {
        hitCard = t.list[i];
        hitTier = t;
        break;
      }
    }
    if (hitCard) break;
  }

  dragState.value = {
    isDragging: false,
    startX: x,
    startY: y,
    currentX: x,
    currentY: y,
    draggedCard: hitCard,
    draggedCards: hitCard ? [hitCard] : [],
    sourceTier: hitTier ? hitTier.name : null,
    hoverTier: null,
    hoverCardId: null,
    pointerDownCard: hitCard,
    pointerDownTier: hitTier ? hitTier.name : null,
    pointerDownTime: Date.now(),
  };

  // If didn't hit card, check if tapped inside a tier slot (置牌框) or move button
  if (!hitCard) {
    for (const t of tiers) {
      if (x >= 12 && x <= width - 12 && y >= t.y && y <= t.y + 118) {
        if (selectedIds.value.size > 0) {
          moveSelectedCardsTo(t.name);
          return;
        }
      }
    }
    // Tapped table empty area -> clear selection
    if (selectedIds.value.size > 0) {
      selectedIds.value.clear();
      soundFX.playTap();
      drawBoard();
    }
  }
}

function onCanvasPointerMove(e: PointerEvent) {
  if (hasCompared.value) return;
  const canvas = canvasRef.value;
  if (!canvas) return;

  const width = tableWidthPx.value;
  const height = tableHeightPx.value;
  const { x, y } = getCanvasEventCoords(canvas, e.clientX, e.clientY, props.isRotated90, width, height);

  if (dragState.value.pointerDownCard) {
    const dx = x - dragState.value.startX;
    const dy = y - dragState.value.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!dragState.value.isDragging && dist > 5) {
      dragState.value.isDragging = true;
      soundFX.playTap();
    }

    if (dragState.value.isDragging) {
      dragState.value.currentX = x;
      dragState.value.currentY = y;

      const tiers = [
        { list: frontTier.value, y: 40, max: 3, name: 'front' as const },
        { list: midTier.value, y: 165, max: 5, name: 'mid' as const },
        { list: backTier.value, y: 290, max: 5, name: 'back' as const },
      ];

      let foundHoverTier: 'front' | 'mid' | 'back' | null = null;
      let foundHoverCardId: string | null = null;
      const slotAreaWidth = width - 132;
      const cardW = 62;
      const cardH = 96;
      const startX = 130;

      for (const t of tiers) {
        if (y >= t.y - 10 && y <= t.y + 128 && x >= 115 && x <= width) {
          foundHoverTier = t.name;
          const denom = Math.max(t.list.length - 1, t.max - 1, 1);
          const overlap = Math.max(14, Math.min(50, (slotAreaWidth - startX - cardW - 80) / denom));

          for (let i = t.list.length - 1; i >= 0; i--) {
            const cx = startX + i * overlap;
            const isSel = selectedIds.value.has(t.list[i].id);
            const cy = t.y + (isSel ? 2 : 12);
            const hitW = (i === t.list.length - 1) ? cardW : overlap;

            if (x >= cx && x <= cx + hitW && y >= cy && y <= cy + cardH) {
              foundHoverCardId = t.list[i].id;
              break;
            }
          }
          break;
        }
      }

      dragState.value.hoverTier = foundHoverTier;
      dragState.value.hoverCardId = foundHoverCardId;
      drawBoard();
    }
  }
}

function onCanvasPointerUp(e: PointerEvent) {
  if (hasCompared.value) return;
  const canvas = canvasRef.value;
  if (!canvas) return;

  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch {}

  if (dragState.value.isDragging) {
    const draggedCard = dragState.value.draggedCard;
    const sourceTier = dragState.value.sourceTier;
    const hoverTier = dragState.value.hoverTier;
    const hoverCardId = dragState.value.hoverCardId;

    if (draggedCard && sourceTier && hoverTier) {
      if (sourceTier === hoverTier) {
        // Drag within the SAME tier: Reorder cards!
        if (hoverCardId && hoverCardId !== draggedCard.id) {
          reorderCardInTier(sourceTier, draggedCard.id, hoverCardId);
        }
      } else {
        // Cross-tier drop!
        if (hoverCardId) {
          // Precision swap with target card!
          const targetCard = findCardById(hoverCardId);
          if (targetCard) {
            swapCardsDirectly(draggedCard, sourceTier, targetCard, hoverTier);
          }
        } else {
          // Drop into empty slot of hoverTier
          if (!selectedIds.value.has(draggedCard.id)) {
            selectedIds.value.clear();
            selectedIds.value.add(draggedCard.id);
          }
          moveSelectedCardsTo(hoverTier);
        }
      }
    }

    dragState.value.isDragging = false;
    dragState.value.pointerDownCard = null;
    dragState.value.draggedCard = null;
    drawBoard();
    return;
  }

  // Not dragging -> Pure Tap/Click on a card: Toggle card multi-selection
  const tappedCard = dragState.value.pointerDownCard;
  dragState.value.pointerDownCard = null;

  if (tappedCard) {
    if (selectedIds.value.has(tappedCard.id)) {
      selectedIds.value.delete(tappedCard.id);
    } else {
      selectedIds.value.add(tappedCard.id);
    }
    soundFX.playTap();
    haptics.tap();
    drawBoard();
  }
}

function onCanvasPointerCancel(e: PointerEvent) {
  dragState.value.isDragging = false;
  dragState.value.pointerDownCard = null;
  dragState.value.draggedCard = null;
  drawBoard();
}

function executeShowdown() {
  if (hasCompared.value) return;
  clearLocalSnapshot();
  if (arrangeTimer) {
    clearInterval(arrangeTimer);
    arrangeTimer = null;
  }
  isWaitingShowdown.value = false;
  showGunshotAnim.value = false;
  soundFX.playCardSnap(true);

  const myHand = {
    head: frontTier.value.map(toSSSCard),
    mid: midTier.value.map(toSSSCard),
    tail: backTier.value.map(toSSSCard),
  };

  const bNames = isEightPlayer.value
    ? ['一席 (罗宋巧手)', '二席 (十三飞龙)', '三席 (七星居士)', '四席 (青龙剑客)', '五席 (百花仙子)', '六席 (金牌赌神)', '七席 (八方豪侠)']
    : ['西席 (罗宋巧手)', '北席 (十三飞龙)', '东席 (七星居士)'];

  const oppCount = isEightPlayer.value ? 7 : 3;
  let totalNet = 0;
  let wonOpponentCount = 0;
  let shotCount = 0;
  const oppResults = [];

  for (let i = 0; i < oppCount; i++) {
    const oppSeat = i + 1;
    let oppFront = botHands.value[i]?.front || [];
    let oppMid = botHands.value[i]?.mid || [];
    let oppBack = botHands.value[i]?.back || [];

    // 若联机真人玩家已提交理牌，优先使用真人玩家真实提交的各墩牌型！
    if (remoteSubmittedHands.value.has(oppSeat)) {
      const rem = remoteSubmittedHands.value.get(oppSeat)!;
      if (rem.front && rem.mid && rem.back) {
        oppFront = rem.front;
        oppMid = rem.mid;
        oppBack = rem.back;
      }
    }

    const oppHand = {
      head: oppFront.map(toSSSCard),
      mid: oppMid.map(toSSSCard),
      tail: oppBack.map(toSSSCard),
    };

    const oppDisplayName = props.roomPlayers?.[oppSeat]?.name
      ? `${bNames[i] || `牌友${oppSeat}`} (${props.roomPlayers[oppSeat].name})`
      : (bNames[i] || `牌友${oppSeat}`);

    const vsResult = compareTwoPlayers(myHand, oppHand, oppSeat, oppDisplayName);
    if (vsResult.finalWater > 0) wonOpponentCount++;
    if (vsResult.isShot && vsResult.finalWater > 0) shotCount++;

    oppResults.push({
      seat: oppSeat,
      name: oppDisplayName,
      netWater: vsResult.finalWater,
      rawWater: vsResult.rawWater,
      isShot: vsResult.isShot,
      isFoulOpp: vsResult.isFoulOpp,
      tiers: vsResult.tiers,
      summary: vsResult.summary,
      specialMe: vsResult.specialMe,
      specialOpp: vsResult.specialOpp,
      handSummary: `头:${getHandLabel(oppFront)} 中:${getHandLabel(oppMid)} 尾:${getHandLabel(oppBack)}`,
    });
    totalNet += vsResult.finalWater;
  }

  // 触发全垒打判定：打枪全场所有对手
  isGrandSlam.value = shotCount === oppCount && oppCount > 0;
  if (isGrandSlam.value) {
    totalNet *= 2; 
    for (const res of oppResults) {
      res.netWater *= 2;
      res.summary += ' · 【触发全垒打再翻倍！】';
      if (res.tiers) {
        res.tiers.forEach((t: any) => {
          t.netWater *= 2;
          t.baseWater *= 2;
          t.bonusWater *= 2;
        });
      }
    }
    haptics.victory();
    soundFX.speakAction('grand_slam');
  } else if (shotCount > 0) {
    soundFX.speakAction('gunshot');
  } else {
    soundFX.speakVoice('开牌比水完毕。');
  }

  totalScore.value = totalNet;
  opponentsBreakdown.value = oppResults;
  hasCompared.value = true;
  soundFX.playVictory();
  if (totalNet > 0) {
    haptics.victory();
  }
  emit('move', { score: totalScore.value, winner: totalNet > 0 ? 0 : (totalNet === 0 ? -1 : 1) });
}

function handleCompare() {
  if (hasCompared.value || isWaitingShowdown.value) return;

  // 1. 开始比水才检查各牌墩扑克牌数量是否合规
  if (frontTier.value.length !== 3 || midTier.value.length !== 5 || backTier.value.length !== 5) {
    soundFX.playPass();
    haptics.selection();
    showToast(
      `⚠️ 牌墩数量不合规：头道需3张 (当前${frontTier.value.length}张)，中道需5张 (当前${midTier.value.length}张)，尾道需5张 (当前${backTier.value.length}张)`
    );
    return;
  }

  // 2. 检查是否倒水相公 (特殊牌型免检倒水)
  if (isWatering.value && !mySpecialHand.value) {
    soundFX.playDaoshui();
    haptics.selection();
    showToast(wateringDetail.value.reason || '⚠️ 当前牌型倒水相公 (尾道需 >= 中道 >= 头道)，请调整后再比水！');
    return;
  }

  // 3. 区分单机/练习与纯真人联机实时场：
  const isMultiplayerRealtime = !props.isPracticeMode && Boolean(props.ws) && !isBookingScene.value;

  if (!isMultiplayerRealtime) {
    executeShowdown();
    return;
  }

  // 纯真人联机：向服务器广播自己已理好手牌并确认开牌比水
  isWaitingShowdown.value = true;
  submittedSeats.value.add(mySeat.value);
  soundFX.playTap();
  haptics.selection();

  try {
    props.ws?.send(
      JSON.stringify({
        type: 'game_move',
        roomId: props.roomId,
        seat: mySeat.value,
        payload: {
          action: 'shisanshui_submit_hand',
          seat: mySeat.value,
          tiers: {
            head: frontTier.value.map(toSSSCard),
            mid: midTier.value.map(toSSSCard),
            tail: backTier.value.map(toSSSCard),
          },
          rawTiers: {
            front: frontTier.value,
            mid: midTier.value,
            back: backTier.value,
          },
          isSpecial: !!mySpecialHand.value,
        },
        event: {
          action: 'shisanshui_submit_hand',
          seat: mySeat.value,
        },
      })
    );
  } catch {}

  const requiredCount = totalSeatsCount.value;
  if (submittedSeats.value.size >= requiredCount) {
    executeShowdown();
  }
}

watch([frontTier, midTier, backTier, isWaitingShowdown], () => {
  saveLocalSnapshot();
}, { deep: true });

function onWsMessage(ev: MessageEvent) {
  if (props.isPracticeMode) return;
  try {
    const msg = JSON.parse(ev.data);
    if (msg.roomId && props.roomId && msg.roomId !== props.roomId) return;
    if (msg.type === 'scene_reconnect_ack') {
      handleReconnectSync(msg);
    } else if (msg.type === 'game_deal') {
      if (msg.deal) {
        dealNewMatch(true, msg.deal);
      }
    } else if (msg.type === 'scene_room_full' || msg.type === 'scene_room_started') {
      if (msg.deal) {
        const dealIdentifier = msg.deal.dealId || msg.deal.createdAt || (Array.isArray(msg.deal.seatCards?.[0]) ? msg.deal.seatCards[0].map((c: any) => c.id).join('-') : '');
        if (dealIdentifier && dealIdentifier === lastAppliedDealId.value && fullHand.value && fullHand.value.length > 0 && !hasCompared.value) {
          console.log('🛡️ [十三水联机防抖] 该局手牌已就绪，保持对局状态');
          return;
        }
        dealNewMatch(true, msg.deal);
      }
    } else if (msg.type === 'game_event') {
      const evt = msg.event || msg.payload;
      if (!evt) return;

      if (evt.action === 'shisanshui_submit_hand') {
        const s = Number(evt.seat);
        submittedSeats.value.add(s);
        if (evt.rawTiers) {
          remoteSubmittedHands.value.set(s, evt.rawTiers);
        }
        const requiredCount = totalSeatsCount.value;
        if (submittedSeats.value.size >= requiredCount && isWaitingShowdown.value && !hasCompared.value) {
          executeShowdown();
        }
      } else if (evt.action === 'shisanshui_all_submitted') {
        if (evt.submissions) {
          for (const [sKey, sub] of Object.entries(evt.submissions as any)) {
            const sNum = Number(sKey);
            submittedSeats.value.add(sNum);
            if ((sub as any).rawTiers) {
              remoteSubmittedHands.value.set(sNum, (sub as any).rawTiers);
            }
          }
        }
        if (!hasCompared.value) {
          if (!isWaitingShowdown.value) {
            if (!isSetComplete.value) {
              applyStrategy('optimal', false);
            }
            isWaitingShowdown.value = true;
          }
          executeShowdown();
        }
      }
    }
  } catch {}
}

onMounted(() => {
  cleanupCardLoader = onCardAssetsLoaded(() => {
    nextTick(() => drawBoard());
  });
  preloadCardAssets();
  updateDimensions();
  const restored = tryRestoreLocalSnapshot();
  if (!restored) {
    dealNewMatch();
  }
  if (props.ws) {
    props.ws.addEventListener('message', onWsMessage);
  }
  window.addEventListener('resize', updateDimensions);
  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  if (cleanupCardLoader) cleanupCardLoader();
  if (bookingTimer) clearInterval(bookingTimer);
  if (graceTimer) clearInterval(graceTimer);
  if (arrangeTimer) clearInterval(arrangeTimer);
  if (props.ws) {
    props.ws.removeEventListener('message', onWsMessage);
  }
  window.removeEventListener('resize', updateDimensions);
  resizeObserver?.disconnect();
  if (rafId) cancelAnimationFrame(rafId);
});
</script>
