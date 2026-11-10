<template>
  <div
    :class="isRotated90 ? 'app-rotated-90' : 'app-standard'"
    class="bg-[#EFE5D3] text-[#3C2C1E] selection:bg-[#DECBA4] selection:text-[#2C1D11] select-none overflow-hidden"
  >
    <!-- 实时网络与在线状态浮动提示条 (含平滑重试倒计时、立即重连与一键单机试玩) -->
    <div
      v-if="!isOnline || (!wsConnected && !httpConnected)"
      class="bg-gradient-to-r from-red-950 via-stone-900 to-red-950 text-white text-[10px] sm:text-[11px] py-1 px-3 text-center z-50 flex items-center justify-center gap-2 shadow shrink-0 font-medium border-b border-red-500/40"
    >
      <span class="animate-pulse">🔴</span>
      <span>当前网络不稳定或未连接到服务器 ({{ reconnectCountdown }}s后自动重试)</span>
      <button
        type="button"
        @click="triggerManualReconnect"
        class="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold cursor-pointer transition-all active:scale-95"
      >
        ⚡ 立即重连
      </button>
      <button
        type="button"
        @click="showOfflineSoloModal = true"
        class="px-2 py-0.5 rounded bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 text-[10px] font-bold cursor-pointer transition-all active:scale-95 border border-amber-400/40"
      >
        🎮 离线单机试玩
      </button>
      <button
        type="button"
        @click="showServerConfigModal = true"
        class="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold underline cursor-pointer"
      >
        ⚙️ 服务器配置/测速
      </button>
    </div>

    <!-- 3D Hardware-Accelerated Special Effects & Particle Engine -->
    <Game3DEffects ref="fxRef" />

    <!-- ======================================================== -->
    <!-- TOP NAVIGATION BAR (LOBBY MODE)                          -->
    <!-- ======================================================== -->
    <!-- TOP NAVIGATION BAR (LOBBY MODE - 典雅大气高横幅规格)              -->
    <!-- ======================================================== -->
    <header
      v-if="currentView === 'lobby'"
      class="w-full px-4 sm:px-6 safe-area-x py-3 sm:py-3.5 bg-[#FAF4E8] border-b border-[#D8C7B0] shadow-xs shrink-0"
    >
      <div class="max-w-[1360px] mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        <!-- 全部功能按钮组 (统一均等间隔 gap-1.5) -->
        <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <!-- 1. 账号/登录按钮 -->
          <button
            type="button"
            @click="showAuthModal = true"
            class="h-9 sm:h-9.5 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-serif font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 border border-amber-400/50 cursor-pointer whitespace-nowrap"
            title="账号中心与登录切换"
          >
            <span class="text-xs">👤</span>
            <span>{{ userProfile.isLoggedIn ? userProfile.name : '登录' }}</span>
          </button>

          <!-- 2. 💬 牌友聊天室按钮 -->
          <button
            type="button"
            @click="enterTeahouseChatroom"
            class="h-9 sm:h-9.5 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-[#241B14] via-[#2F2218] to-[#201711] hover:from-[#32251B] hover:to-[#2B1F17] text-amber-300 font-serif font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 border border-amber-500/60 hover:border-amber-400 cursor-pointer whitespace-nowrap"
            title="进入牌友聊天室，语音交流与牌友组局"
          >
            <span class="text-xs">💬</span>
            <span>聊天室</span>
          </button>

          <!-- 3. 单机试玩按钮 -->
          <button
            type="button"
            @click="showOfflineSoloModal = true"
            class="h-9 sm:h-9.5 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] font-serif font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 border border-[#7D6049] cursor-pointer whitespace-nowrap"
            title="无需联网，随时体验本地人机对弈"
          >
            <span class="text-xs">🎮</span>
            <span>试玩</span>
          </button>

          <!-- 4. 安卓APK下载按钮 -->
          <a
            :href="directApkDownloadUrl"
            download="chess-game-release.apk"
            @click="handleDirectDownloadApk($event)"
            class="h-9 sm:h-9.5 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-serif font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 border border-emerald-500/50 cursor-pointer text-decoration-none select-none whitespace-nowrap"
            :class="{ 'opacity-80 pointer-events-none': isDownloadingApk }"
            title="点击直接下载最新 Android APK 安装包"
          >
            <span class="text-xs">{{ isDownloadingApk ? '⏳' : '📲' }}</span>
            <span>{{ isDownloadingApk ? downloadProgressText : 'APK' }}</span>
          </a>

          <!-- 6. 实时网络网速状态图标 -->
          <div
            class="h-9 sm:h-9.5 px-2.5 sm:px-3 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 shadow-sm whitespace-nowrap select-none"
            :class="networkStatusColorClass"
            :title="`实时网络状态：${networkStatusText} (${wsRtt}ms)`"
          >
            <span class="relative flex h-2 w-2 items-center justify-center shrink-0">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                :class="networkDotBgClass"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2"
                :class="networkDotBgClass"
              ></span>
            </span>
            <span class="text-xs">📶</span>
            <span>{{ networkStatusLabel }}</span>
          </div>
        </div>

        <!-- 右侧：积分管理钱庄按钮 (保持固定在最右侧) -->
        <div class="flex items-center shrink-0 pl-2">
          <button
            type="button"
            @click="openPointsModal"
            class="h-9 sm:h-9.5 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-[#241B14] via-[#2F2218] to-[#201711] hover:from-[#32251B] hover:to-[#2B1F17] text-amber-300 font-serif font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 border border-amber-500/50 hover:border-amber-400 cursor-pointer whitespace-nowrap"
            title="钱庄账户与积分管理"
          >
            <span class="text-xs text-amber-400">🪙</span>
            <span>钱庄 ({{ userProfile.coins.toLocaleString() }}分)</span>
          </button>
        </div>
      </div>
    </header>

    <!-- ======================================================== -->
    <!-- VIEW 1: GAME HALL LOBBY (仅显示所有游戏板块，横屏3列)         -->
    <!-- ======================================================== -->
    <main v-if="currentView === 'lobby'" class="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-3 flex flex-col justify-center overflow-hidden">
      <!-- 所有游戏板块 (三大经典国粹游戏，横屏三列沉浸式卡片) -->
      <div class="grid grid-cols-3 gap-3.5 sm:gap-5 w-full h-[calc(100%-8px)] max-h-[310px] items-stretch">
        <div
          v-for="g in GAME_MODULES"
          :key="g.id"
          @click="enterGame(g.id)"
          class="game-compact-card group relative rounded-2xl p-3 border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
          :class="[g.cardBg, g.cardBorder]"
          :style="{
            boxShadow: `0 8px 24px -4px ${g.glowColor}, 0 12px 18px -4px rgba(0,0,0,0.5)`
          }"
        >
          <!-- 3D 光泽高光覆盖层 -->
          <div
            class="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/15 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
          ></div>

          <!-- 背景光晕 -->
          <div
            class="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-2xl opacity-25 group-hover:opacity-50 transition-opacity pointer-events-none"
            :style="{ backgroundColor: g.accentColor }"
          ></div>

          <!-- 卡片内容 -->
          <div class="relative z-10 flex flex-col justify-between h-full space-y-1.5">
            <!-- 顶部：游戏名称与说明，及右上角专属规则按钮 -->
            <div class="min-w-0 flex items-start justify-between gap-1">
              <div class="min-w-0 flex-1">
                <h3 class="text-lg sm:text-xl md:text-2xl font-black text-[#3C2C1E] font-serif-title tracking-tight group-hover:text-[#2A1E14] transition-colors truncate">
                  {{ g.name }}
                </h3>
                <p class="text-[10px] sm:text-[11px] text-[#6B5744] mt-0.5 truncate leading-tight">
                  {{ g.tagline }}
                </p>
              </div>

              <!-- 三大游戏板块右上角规则按钮 -->
              <button
                type="button"
                @click.stop="openGameRules(g.id)"
                class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 text-amber-100 font-serif font-bold text-[10px] sm:text-xs shadow-xs border border-amber-400/60 transition-all active:scale-90 cursor-pointer shrink-0 flex items-center gap-0.5 z-20"
                :title="`查看【${g.name}】玩法规则与计分细则`"
              >
                <span>📜</span>
                <span>规则</span>
              </button>
            </div>

            <!-- 中部：SVG图片展示区 (烟三固定显示，十三张扇形显示同花顺) -->
            <div class="flex items-center justify-center py-1">
              <template v-if="g.id === 'yansan'">
                <div class="flex items-center gap-2">
                  <div class="w-16 h-24 sm:w-20 sm:h-30 rounded-md overflow-hidden shadow-md flex items-center justify-center transition-transform duration-500 group-hover:scale-105 border border-[#D8C7B0] bg-[#FFFDF8]">
                    <img src="/cards/ace_of_spades.svg" alt="黑桃A" class="w-full h-full object-cover" />
                  </div>
                  <div class="w-16 h-24 sm:w-20 sm:h-30 rounded-md overflow-hidden shadow-md flex items-center justify-center transition-transform duration-500 group-hover:scale-105 border border-[#D8C7B0] bg-[#FFFDF8]">
                    <img src="/cards/3_of_spades.svg" alt="黑桃3" class="w-full h-full object-cover" />
                  </div>
                </div>
              </template>
              <template v-else-if="g.id === 'shisanshui'">
                <div class="flex flex-col items-center justify-center gap-1.5 py-0.5 scale-100 sm:scale-105">
                  <!-- 黑桃同花顺 10 J Q K A 扇形 -->
                  <div class="flex items-center -space-x-3.5 group-hover:-space-x-2.5 transition-all duration-300">
                    <div
                      v-for="(card, idx) in ['10_of_spades', 'jack_of_spades', 'queen_of_spades', 'king_of_spades', 'ace_of_spades']"
                      :key="card"
                      class="w-[39px] h-[57px] sm:w-[45px] sm:h-[65px] rounded-[4px] overflow-hidden shadow-md border border-[#D8C7B0] bg-white flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                      :style="{
                        transform: `rotate(${(idx - 2) * 5}deg) translateY(${Math.abs(idx - 2) * 2}px)`,
                        zIndex: idx
                      }"
                    >
                      <img :src="`/cards/${card}.svg`" :alt="card" class="w-full h-full object-cover scale-[1.03]" />
                    </div>
                  </div>
                  <!-- 红桃同花顺 10 J Q K A 扇形 -->
                  <div class="flex items-center -space-x-3.5 group-hover:-space-x-2.5 transition-all duration-300">
                    <div
                      v-for="(card, idx) in ['10_of_hearts', 'jack_of_hearts', 'queen_of_hearts', 'king_of_hearts', 'ace_of_hearts']"
                      :key="card"
                      class="w-[39px] h-[57px] sm:w-[45px] sm:h-[65px] rounded-[4px] overflow-hidden shadow-md border border-[#D8C7B0] bg-white flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                      :style="{
                        transform: `rotate(${(idx - 2) * 5}deg) translateY(${Math.abs(idx - 2) * 2}px)`,
                        zIndex: idx
                      }"
                    >
                      <img :src="`/cards/${card}.svg`" :alt="card" class="w-full h-full object-cover scale-[1.03]" />
                    </div>
                  </div>
                </div>
              </template>
              <template v-else-if="g.id === 'mahjong'">
                <div class="flex items-center gap-2">
                  <div class="w-16 h-24 sm:w-20 sm:h-30 rounded-md overflow-hidden shadow-md flex items-center justify-center transition-transform duration-500 group-hover:scale-105 border border-[#D8C7B0] bg-[#FFFDF8]">
                    <img src="/mahjong/03-red-dragon.svg" alt="红中" class="w-full h-full object-cover" />
                  </div>
                  <div class="w-16 h-24 sm:w-20 sm:h-30 rounded-md overflow-hidden shadow-md flex items-center justify-center transition-transform duration-500 group-hover:scale-105 border border-[#D8C7B0] bg-[#FFFDF8]">
                    <img src="/mahjong/02-green-dragon.svg" alt="发财" class="w-full h-full object-cover" />
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden shadow-md border border-[#D8C7B0] bg-[#FFFDF8] flex items-center justify-center transition-transform duration-500 group-hover:scale-105 p-1.5">
                  <img
                    :src="getGameSvg(g.id)"
                    alt="Game SVG Asset"
                    class="w-full h-full object-contain transition-all duration-700"
                  />
                </div>
              </template>
            </div>

            <!-- 专属在线人数状态微缩条 -->
            <div
              class="w-full py-1 px-2.5 rounded-lg border flex items-center justify-between text-[10px] sm:text-[11px] shadow-xs transition-transform group-hover:scale-[1.02] bg-[#FAF4E8] border-[#D8C7B0]"
            >
              <span class="font-bold text-[#3C2C1E] flex items-center gap-1 font-serif">
                <span class="text-amber-600 animate-pulse">🔥</span>
                <span>当前在线人数</span>
              </span>
              <span class="text-[#5C4533] font-mono font-bold shrink-0 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{{ g.onlinePlayers.toLocaleString() }} 人</span>
              </span>
            </div>
          </div>

          <!-- 底部动作栏：准入与一键入座 -->
          <div class="relative z-10 pt-2 mt-2 border-t border-[#D8C7B0] flex items-center justify-between">
            <span class="text-[10px] sm:text-[11px] font-mono font-bold text-[#5C4533]">
              🪙 准入 {{ g.baseStake }} 分
            </span>
            <div class="flex items-center">
              <button
                type="button"
                @click.stop="enterGame(g.id)"
                class="px-2.5 sm:px-3 py-1 text-[11px] font-bold rounded-lg text-[#FAF4E8] shadow-sm transition-all duration-300 group-hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] border border-[#7D6049]"
              >
                <span>入座</span>
                <span class="text-[10px]">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ======================================================== -->
    <!-- VIEW 2: DEDICATED LANDSCAPE GAME ARENA (横屏竞技舞台)        -->
    <!-- ======================================================== -->
    <div
      v-else-if="currentView === 'arena'"
      class="relative w-full h-full flex flex-col select-none overflow-hidden"
      :style="{
        backgroundColor: currentTheme.feltColor,
        background: `radial-gradient(ellipse at 50% 45%, ${currentTheme.highlightColor || currentTheme.feltColor} 0%, ${currentTheme.feltColor} 55%, ${currentTheme.edgeColor || '#3F1803'} 100%)`
      }"
    >
      <!-- Overhead Ambient Table Light Spotlight Overlay -->
      <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_65%)] z-1"></div>

      <!-- In-Table Top Panoramic Felt HUD (全透明无遮挡顶沿栏) -->
      <div
        class="absolute top-0 left-0 right-0 h-10 px-3 sm:px-5 safe-area-x flex items-center justify-between z-30 transition-all bg-transparent border-b border-transparent"
      >
        <!-- Left: Game Scene Display / Voice Broadcast (左上角展示；语音播放中时暂时遮挡场景名称，播放结束后自动恢复，绝不遮挡中央牌桌与牌型) -->
        <div class="relative flex items-center min-h-[34px]">
          <!-- Normal Scene Display (when no voice is currently playing) -->
          <div
            v-if="!activePlayingVoice"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/45 border border-amber-500/30 backdrop-blur-md shadow-sm transition-all"
          >
            <span class="text-base sm:text-lg filter drop-shadow">{{ activeModuleInfo?.icon }}</span>
            <span class="font-bold text-xs sm:text-sm text-amber-200 font-serif-title drop-shadow whitespace-nowrap">
              {{ currentSceneDisplayName || activeModuleInfo?.name }}
            </span>
            <span
              v-if="isPracticeMode"
              class="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-200 font-mono border border-amber-500/40"
              title="当前为单机试玩模式，局内筹码与胜负纯属模拟，不影响真实账户积分"
            >
              🎮 单机试玩(模拟)
            </span>
          </div>

          <!-- Real-Time Voice Broadcast Banner (显示在左上角暂时遮挡游戏场景名称，播放完毕后自动恢复，避免遮挡牌桌牌面) -->
          <div
            v-else
            class="flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-xl bg-gradient-to-r from-emerald-950/95 via-black/95 to-emerald-950/95 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.7)] backdrop-blur-md animate-pulse z-40"
          >
            <span class="text-emerald-400 text-sm animate-bounce">🔊</span>
            <span class="text-xs font-black text-amber-300 font-serif-title truncate max-w-[90px] sm:max-w-[140px]">{{ activePlayingVoice.sender }}</span>
            <span class="text-[11px] text-[#E6DEC8] whitespace-nowrap">语音广播中 ({{ activePlayingVoice.duration }}s)</span>
            <div class="flex items-center gap-0.5 h-3 pl-1">
              <span class="w-1 bg-emerald-400 rounded-full h-2 animate-pulse"></span>
              <span class="w-1 bg-emerald-300 rounded-full h-3 animate-pulse"></span>
              <span class="w-1 bg-emerald-400 rounded-full h-1.5 animate-pulse"></span>
              <span class="w-1 bg-emerald-300 rounded-full h-2.5 animate-pulse"></span>
            </div>
          </div>
        </div>

        <!-- Right: Actions, Fullscreen, Coins, Audio, Danmaku & Chat -->
        <div class="flex items-center gap-1 sm:gap-1.5">

          <!-- Coins Badge (Click opens Points Management) -->
          <button
            type="button"
            @click="openPointsModal"
            class="px-2 sm:px-2.5 py-1 rounded-xl bg-black/60 border border-amber-500/50 text-amber-300 font-mono font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer shrink-0"
            title="钱庄账户"
          >
            <span>🪙</span>
            <span class="tabular-nums font-bold">{{ userProfile.coins }}</span>
          </button>

          <!-- 语音聊天按钮 (原麦克风按钮改名为语音聊天，始终可见) -->
          <div class="relative flex items-center shrink-0">
            <!-- 待机状态：点击开始录音 -->
            <button
              v-if="!isRecordingVoice"
              type="button"
              @click="startVoiceRecording"
              class="px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-amber-950/80 via-black/80 to-amber-950/80 hover:bg-black/90 border border-amber-500/60 hover:border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition-all shrink-0"
              title="点击开始语音聊天录音 (最长20秒，发送后全员收听)"
            >
              <span class="text-xs sm:text-sm">🎙️</span>
              <span class="font-serif">语音聊天</span>
            </button>

            <!-- 录音中状态：点击发送语音或20秒倒计时结束自动发送 -->
            <div v-else class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                @click="stopAndSendVoiceRecording"
                class="px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 border border-red-300 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/50 animate-pulse active:scale-95 cursor-pointer transition-all whitespace-nowrap"
                title="点击发送语音聊天，或20秒倒计时结束自动发送"
              >
                <span class="w-2 h-2 rounded-full bg-white animate-ping shrink-0"></span>
                <span>发送语音 ({{ 20 - recordingSeconds }}s)</span>
              </button>

              <button
                type="button"
                @click="cancelVoiceRecording"
                class="w-6 h-6 rounded-lg bg-black/80 hover:bg-black border border-white/20 text-[#D8C7B5] hover:text-white text-[10px] flex items-center justify-center cursor-pointer shrink-0"
                title="取消录音"
              >
                ✕
              </button>
            </div>

            <!-- 麦克风权限 / 异常提示气泡 -->
            <div
              v-if="micErrorTip"
              class="absolute top-10 right-0 z-50 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-950 via-stone-900 to-red-950 border border-red-400 text-red-200 text-[10px] font-bold shadow-2xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap animate-bounce"
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

          <!-- 卫星天线按钮 (点击打开茶楼台词语音抽屉，纯图标不显示文字) -->
          <button
            type="button"
            @click="showChatDrawer = !showChatDrawer"
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center text-xs transition-all active:scale-95 cursor-pointer shrink-0"
            :class="showChatDrawer ? 'bg-amber-600/50 text-amber-300 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-black/60 text-white/80 border-white/15 hover:border-amber-400 hover:text-white'"
            title="茶楼台词语音与弹幕"
          >
            📡
          </button>

          <!-- Quick Audio Mute -->
          <button
            type="button"
            @click="toggleSound"
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-black/60 border border-white/15 flex items-center justify-center text-xs text-white/90 active:scale-90 cursor-pointer shrink-0"
            title="静音开关"
          >
            {{ soundOn ? '🔊' : '🔇' }}
          </button>

          <!-- Fullscreen Toggle Button -->
          <button
            type="button"
            @click="toggleFullscreen"
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-black/60 border border-white/15 flex items-center justify-center text-xs text-white/90 active:scale-90 hover:text-white cursor-pointer shrink-0"
            title="点击切换全屏沉浸对战模式"
          >
            ⛶
          </button>
        </div>
      </div>

      <!-- Center Fullscreen Table Stage Area (全屏无黑边牌桌舞台) -->
      <div class="w-full h-full absolute inset-0 overflow-hidden flex flex-col items-center justify-center p-0">

        <!-- Fullscreen Floating Danmaku Stream Layer (书法古风雅致弹幕) -->
        <div v-if="danmakuEnabled" class="absolute inset-0 pointer-events-none z-35 overflow-hidden">
          <div
            v-for="dm in danmakuItems"
            :key="dm.id"
            class="danmaku-item absolute flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-black/95 via-[#22160F]/95 to-black/95 border border-amber-500/40 backdrop-blur-md whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.85)] text-xs"
            :style="{
              top: `${dm.top}%`,
              animationDuration: `${dm.duration}s`
            }"
          >
            <span class="text-sm filter drop-shadow">{{ dm.avatar || '🏮' }}</span>
            <span class="font-serif font-bold text-amber-300 text-[11px]">{{ dm.sender }}:</span>
            <span class="text-[#FDFBF7] font-serif tracking-wide">“{{ dm.text }}”</span>
            <span class="text-[10px] text-amber-400/90 animate-pulse">🔊</span>
          </div>
        </div>
        <transition name="fade">
          <div
            v-if="activeSpeechBubble"
            class="absolute top-12 z-40 pointer-events-none flex flex-col items-center animate-bounce-once"
          >
            <div class="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-[#2A180E]/95 via-[#3D2314]/95 to-[#2A180E]/95 border border-amber-500/60 shadow-[0_8px_25px_rgba(0,0,0,0.9)] flex items-center gap-2 text-xs font-serif text-amber-200">
              <span class="text-sm">🏮</span>
              <span class="tracking-wider">{{ activeSpeechBubble }}</span>
              <span class="text-xs text-amber-400">🔊</span>
            </div>
          </div>
        </transition>

        <!-- Floating Exit Practice Mode Plaque (固定在左侧/西席玩家头像框顶部的空闲位置) -->
        <button
          v-if="isPracticeMode"
          type="button"
          @click="returnToLobby"
          class="absolute left-3.5 top-12 sm:top-14 z-40 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-red-950/90 via-[#3B0D0B]/90 to-amber-950/90 hover:from-red-900 hover:to-rose-800 border border-red-500/80 text-red-100 text-xs font-serif font-bold flex items-center gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.85)] backdrop-blur-md active:scale-95 cursor-pointer transition-all group"
          title="点击退出单机试玩模式并返回游戏大厅"
        >
          <span class="text-sm filter drop-shadow group-hover:rotate-12 transition-transform">🚪</span>
          <span class="tracking-wider">退出试玩</span>
          <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping ml-0.5"></span>
        </button>

        <!-- Central Panoramic Game Table Frame (全屏伸展自适应，无多余外框挤压) -->
        <div class="w-full h-full flex flex-col items-center justify-center relative transition-all min-h-0">
          <!-- 3 Canvas Game Engines Inheriting Matching Color & Real Players -->
          <YansanCanvas
            v-if="activeGameType === 'yansan'"
            :table-theme="currentTheme"
            :is-rotated-90="isRotated90"
            :scene-mode="activeYansanScene"
            :room-players="currentWaitingRoomPlayers"
            :current-user="currentUserForTable"
            :room-id="activeRoomId"
            :initial-deal="currentRoomDeal"
            :ws="ws"
            :is-practice-mode="isPracticeMode"
            @move="onGameMove"
            @restart="onGameRestart"
            @fx="onGameFx"
            @exit="returnToLobby(true)"
          />
          <ShisanshuiCanvas
            v-else-if="activeGameType === 'shisanshui'"
            :table-theme="currentTheme"
            :is-rotated-90="isRotated90"
            :scene-mode="activeShisanshuiScene"
            :room-players="currentWaitingRoomPlayers"
            :current-user="currentUserForTable"
            :room-id="activeRoomId"
            :initial-deal="currentRoomDeal"
            :ws="ws"
            :is-practice-mode="isPracticeMode"
            @move="onGameMove"
            @restart="onGameRestart"
            @fx="onGameFx"
            @open-poster="handleOpenPoster"
            @exit="returnToLobby(true)"
          />
          <MahjongCanvas
            v-else-if="activeGameType === 'mahjong'"
            :table-theme="currentTheme"
            :is-rotated-90="isRotated90"
            :scene-mode="activeMahjongScene"
            :room-players="currentWaitingRoomPlayers"
            :current-user="currentUserForTable"
            :room-id="activeRoomId"
            :initial-deal="currentRoomDeal"
            :ws="ws"
            :is-practice-mode="isPracticeMode"
            @move="onGameMove"
            @restart="onGameRestart"
            @fx="onGameFx"
            @exit="returnToLobby(true)"
          />
        </div>

        <!-- Mini Teahouse Quick Voice Bar on Arena Table (Bottom-Right) -->
        <div class="hidden sm:flex items-center gap-2 p-1.5 rounded-2xl bg-black/75 border border-amber-900/50 backdrop-blur-md absolute bottom-2 right-2 z-30 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          <!-- 4 Quick Dialogue Voice Chips -->
          <div class="flex items-center gap-1">
            <button
              v-for="chip in QUICK_VOICE_CHIPS"
              :key="chip.label"
              type="button"
              @click="sendQuickPhrase(chip.text)"
              class="px-2 py-1 rounded-lg bg-[#2A1B12]/80 hover:bg-amber-900/60 border border-amber-500/30 hover:border-amber-400/70 text-[11px] font-serif text-amber-200 transition-all active:scale-95 flex items-center gap-1 shadow-xs cursor-pointer"
              :title="`立即语音播报：${chip.text}`"
            >
              <span>{{ chip.icon }}</span>
              <span>{{ chip.label }}</span>
            </button>
          </div>
          <!-- Quick Dialogue Input + Broadcast -->
          <form @submit.prevent="sendQuickBarChat" class="flex items-center gap-1.5 pl-1.5 border-l border-amber-900/40">
            <input
              v-model="quickBarInput"
              type="text"
              maxlength="24"
              placeholder="输入台词语音飞屏..."
              class="w-28 sm:w-36 px-2 py-1 text-[11px] rounded-lg bg-black/60 border border-amber-900/50 text-[#F5EFE6] placeholder-stone-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              class="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-[11px] whitespace-nowrap shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>📢</span>
              <span>飞屏</span>
            </button>
          </form>
        </div>

        <!-- Redesigned Classical Teahouse Dialogue Drawer (Voice Catchphrases & Danmaku Only) -->
        <div
          v-if="showChatDrawer"
          class="absolute right-0 top-0 bottom-0 w-84 sm:w-96 bg-gradient-to-b from-[#1C130D]/98 via-[#130C07]/98 to-[#0C0704]/98 backdrop-blur-2xl border-l border-amber-900/60 p-3.5 z-50 flex flex-col justify-between shadow-[0_0_60px_rgba(0,0,0,0.95)] animate-slide-left"
        >
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Teahouse Drawer Header with Danmaku Toggle Switch -->
            <div class="flex items-center justify-between pb-3 mb-2.5 border-b border-amber-900/40 shrink-0">
              <div class="flex items-center gap-2">
                <span class="text-xl filter drop-shadow">🏮</span>
                <div>
                  <h3 class="font-bold text-sm text-[#F5EFE6] font-serif tracking-wider">茶楼台词 · 经典对白原声</h3>
                  <p class="text-[10px] text-amber-300/70 font-serif">真人发音 · 飞屏弹幕 · 牌桌交锋</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <!-- Danmaku Global Toggle Button -->
                <button
                  type="button"
                  @click="danmakuEnabled = !danmakuEnabled"
                  class="px-2 py-0.5 rounded-full border text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                  :class="danmakuEnabled ? 'bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-stone-900/80 text-stone-400 border-stone-700/60'"
                  :title="danmakuEnabled ? '点击关闭全屏横向弹幕飞屏' : '点击开启全屏横向弹幕飞屏'"
                >
                  <span>{{ danmakuEnabled ? '🏮 弹幕: 开启' : '💤 弹幕: 关闭' }}</span>
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="danmakuEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'"
                  ></span>
                </button>
                <button
                  type="button"
                  @click="showChatDrawer = false"
                  class="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-[#A89887] hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Dialogue Navigation Tabs: Phrase Library vs Voiced History -->
            <div class="flex items-center gap-1.5 p-1 bg-[#0A0705] rounded-xl border border-amber-900/40 mb-3 shrink-0 text-xs">
              <button
                type="button"
                @click="activeDialogueTab = 'phrases'"
                :class="activeDialogueTab === 'phrases' ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white font-bold shadow-[0_2px_8px_rgba(217,119,6,0.4)]' : 'text-stone-400 hover:text-stone-200'"
                class="flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 font-serif cursor-pointer"
              >
                <span>🎙️</span>
                <span>经典台词分类</span>
              </button>
              <button
                type="button"
                @click="activeDialogueTab = 'history'"
                :class="activeDialogueTab === 'history' ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white font-bold shadow-[0_2px_8px_rgba(217,119,6,0.4)]' : 'text-stone-400 hover:text-stone-200'"
                class="flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 font-serif cursor-pointer"
              >
                <span>📜</span>
                <span>对白实录 ({{ recentVoicedHistory.length }})</span>
              </button>
            </div>

            <!-- Sub-view 1: Categorized Classic Tea House Dialogue Phrases -->
            <div v-if="activeDialogueTab === 'phrases'" class="flex-1 flex flex-col overflow-hidden">
              <!-- Category Filter Chips -->
              <div class="flex items-center gap-1.5 mb-2.5 shrink-0 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
                <button
                  v-for="(cat, idx) in PHRASE_CATEGORIES"
                  :key="cat.name"
                  type="button"
                  @click="activePhraseCategory = idx"
                  :class="activePhraseCategory === idx ? 'bg-amber-600/30 text-amber-200 border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.25)] font-bold' : 'bg-[#18100A] text-stone-400 border-amber-900/30 hover:text-stone-200 hover:border-amber-800/50'"
                  class="px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap font-serif flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>{{ cat.icon }}</span>
                  <span>{{ cat.name }}</span>
                </button>
              </div>

              <!-- Phrases Cards List -->
              <div class="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                <div
                  v-for="phrase in PHRASE_CATEGORIES[activePhraseCategory].list"
                  :key="phrase"
                  class="p-2.5 rounded-xl bg-gradient-to-r from-[#1E130B] to-[#160E08] hover:from-[#2A1B10] hover:to-[#20140C] border border-amber-900/40 hover:border-amber-500/50 text-left transition-all flex items-center justify-between group shadow-sm"
                >
                  <div class="flex-1 min-w-0 pr-2">
                    <div class="text-[10px] text-amber-400/80 font-serif mb-0.5 flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500/60"></span>
                      <span>{{ PHRASE_CATEGORIES[activePhraseCategory].tag }}</span>
                    </div>
                    <div class="text-xs text-[#F2ECE1] font-medium tracking-wide group-hover:text-amber-200 transition-colors">
                      “{{ phrase }}”
                    </div>
                  </div>
                  <!-- Local Audition vs Table Broadcast Buttons -->
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      @click="previewPhraseVoice(phrase)"
                      class="px-2 py-1 rounded-lg bg-black/40 hover:bg-black/70 border border-stone-700/60 hover:border-amber-400/60 text-[10px] text-stone-300 hover:text-amber-300 transition-all active:scale-90 flex items-center gap-1 cursor-pointer"
                      title="试听发音（仅自己可听，不发房间）"
                    >
                      <span>🔊</span>
                      <span class="hidden sm:inline">试听</span>
                    </button>
                    <button
                      type="button"
                      @click="sendQuickPhrase(phrase)"
                      class="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-400/50 text-white text-[10px] font-bold shadow-xs transition-all active:scale-90 flex items-center gap-1 cursor-pointer"
                      title="播报台词并飞屏弹幕"
                    >
                      <span>📢</span>
                      <span>播报</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sub-view 2: Voiced Dialogue History Log -->
            <div v-else-if="activeDialogueTab === 'history'" class="flex-1 flex flex-col overflow-hidden">
              <div v-if="recentVoicedHistory.length === 0" class="flex-1 flex flex-col items-center justify-center p-6 text-center text-stone-500">
                <span class="text-3xl mb-2 opacity-50">🍵</span>
                <p class="text-xs font-serif text-stone-400 mb-1">暂无牌桌对白实录</p>
                <p class="text-[10px] text-stone-500">在左侧台词库或下方发声，即可留下经典雅趣言录</p>
              </div>
              <div v-else class="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                <div
                  v-for="item in recentVoicedHistory"
                  :key="item.id"
                  class="p-2.5 rounded-xl border text-xs leading-relaxed transition-all"
                  :class="item.isSelf ? 'bg-[#20140B]/90 border-amber-600/40 text-amber-100' : 'bg-[#140E0A]/90 border-stone-800 text-stone-200'"
                >
                  <div class="flex items-center justify-between text-[10px] mb-1">
                    <span class="font-bold flex items-center gap-1" :class="item.isSelf ? 'text-amber-300' : 'text-stone-300'">
                      <span>{{ item.isSelf ? '🏮 [我]' : '👤' }}</span>
                      <span>{{ item.sender }}</span>
                    </span>
                    <span class="text-stone-500 font-mono text-[9px]">{{ item.timestamp }}</span>
                  </div>
                  <div class="font-serif tracking-wide text-xs pl-2 border-l-2" :class="item.isSelf ? 'border-amber-500/80 text-amber-100' : 'border-stone-600 text-stone-300'">
                    “{{ item.text }}”
                  </div>
                  <div class="mt-2 flex items-center justify-end">
                    <button
                      type="button"
                      @click="previewPhraseVoice(item.text)"
                      class="px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 border border-stone-700 text-[10px] text-amber-300/80 hover:text-amber-300 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>▶</span>
                      <span>重播此句台词</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Custom Voice Input & Danmaku Broadcast Form -->
          <form @submit.prevent="sendCustomVoicePhrase" class="pt-3 border-t border-amber-900/40 shrink-0 flex items-center gap-2">
            <input
              v-model="customVoiceInput"
              type="text"
              maxlength="30"
              placeholder="输入自拟台词，真人语音播报并飞发弹幕..."
              class="flex-1 px-3 py-2 text-xs rounded-xl bg-black/60 border border-amber-900/50 text-[#F5EFE6] placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            <button
              type="submit"
              class="px-3 py-2 text-xs font-serif font-bold rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border border-amber-400/50 transition-all whitespace-nowrap shadow-md active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>📢</span>
              <span>语音飞屏</span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- VIEW 3: MAHJONG SCENE SELECTION (点击麻将游戏板块才跳转到此界面) -->
    <!-- ======================================================== -->
    <MahjongSceneModal
      v-else-if="currentView === 'mahjong-scenes'"
      :initial-scene="activeMahjongScene"
      :scene-counts="sceneCounts"
      @select="onSelectMahjongScene"
      @close="returnToLobby"
    />

    <!-- ======================================================== -->
    <!-- VIEW 4: SHISANSHUI SCENE SELECTION (点击十三张板块才跳转到此界面) -->
    <!-- ======================================================== -->
    <ShisanshuiSceneModal
      v-else-if="currentView === 'shisanshui-scenes'"
      :initial-scene="activeShisanshuiScene"
      :scene-counts="sceneCounts"
      @select="onSelectShisanshuiScene"
      @close="returnToLobby"
    />

    <!-- ======================================================== -->
    <!-- VIEW 5: YANSAN SCENE SELECTION (点击经典烟三板块跳转到场景选择) -->
    <!-- ======================================================== -->
    <YansanSceneModal
      v-else-if="currentView === 'yansan-scenes'"
      :initial-scene="activeYansanScene"
      :scene-counts="sceneCounts"
      @select="onSelectYansanScene"
      @close="returnToLobby"
    />

    <!-- ======================================================== -->
    <!-- VIEW 6: TEAHOUSE CHATROOM (茶馆社交与选场等待大堂)            -->
    <!-- ======================================================== -->
    <TeahouseChatroom
      v-else-if="currentView === 'chatroom'"
      :current-user="userProfile"
      :ws="ws"
      :ws-connected="wsConnected"
      :active-game-type="activeGameType"
      :active-scene-mode="activeSceneMode"
      :active-scene-name="currentSceneDisplayName"
      :scene-counts="sceneCounts"
      :online-players="onlineTeahousePlayers"
      @leave="returnToLobby"
      @change-scene="onChangeSceneFromChatroom"
      @select-scene="onSelectSceneFromChatroom"
      @start-game="onFullSeatGameStart"
    />

    <!-- ======================================================== -->
    <!-- VIEW 7: SCENE MATCHING WAITING ROOM (选定场景后等待玩家入座，满座自动开局) -->
    <!-- ======================================================== -->
    <SceneWaitingRoom
      v-else-if="currentView === 'waiting-room'"
      :game-type="activeGameType"
      :scene-mode="activeSceneMode"
      :scene-name="currentSceneDisplayName"
      :base-stake="currentSceneBaseStake"
      :max-players="currentSceneMaxPlayers"
      :current-user="userProfile"
      :ws="ws"
      :ws-connected="wsConnected"
      :table-theme="currentTheme"
      :is-rotated-90="isRotated90"
      :is-practice-mode="isPracticeMode"
      @leave="returnToLobby"
      @change-scene="onChangeSceneFromWaitingRoom"
      @start-game="onFullSeatGameStart"
      @open-points="openPointsModal"
    />

    <!-- Modals -->
    <!-- 1. 注册登录弹窗 -->
    <AuthModal
      v-if="showAuthModal"
      :profile="userProfile"
      @close="showAuthModal = false"
      @update:profile="onUpdateProfile"
      @open-termux="showTermuxModal = true"
    />

    <!-- 2. 积分管理钱庄弹窗 (旋转90度横屏全屏展示 + 屏幕数字键盘) -->
    <PointsManageModal
      v-if="showPointsModal"
      :profile="userProfile"
      :is-rotated-90="isRotated90"
      @close="showPointsModal = false"
      @update:profile="onUpdateProfile"
    />

    <!-- 3. 用户战绩档案与签到弹窗 -->
    <UserProfileModal
      v-if="showProfileModal"
      :profile="userProfile"
      :records="matchRecords"
      @close="showProfileModal = false"
      @update:profile="onUpdateProfile"
      @update:records="onUpdateRecords"
      @open-poster="handleOpenPoster"
    />

    <!-- 4. 成就挑战与牌桌装扮弹窗 -->
    <AchievementModal
      v-if="showAchievementModal"
      :coins="userProfile.coins"
      @close="showAchievementModal = false"
      @claim="onClaimAchievement"
      @theme-change="onThemeChange"
    />

    <!-- 5. Android Termux 部署指南与性能监控弹窗 -->
    <TermuxDeploySection
      v-if="showTermuxModal"
      :is-modal="true"
      @close="showTermuxModal = false"
    />

    <!-- 6b. 服务器网络与节点配置弹窗 -->
    <ServerConfigModal
      v-if="showServerConfigModal"
      @close="showServerConfigModal = false"
      @server-updated="handleServerUpdated"
    />

    <!-- 8. 积分不足入座提示弹窗 (可选择进入单机试玩或前往钱庄) -->
    <InsufficientCoinsModal
      v-if="showInsufficientModal"
      :current-coins="insufficientModalData.currentCoins"
      :required-coins="insufficientModalData.requiredCoins"
      :scene-name="insufficientModalData.sceneName"
      @close="showInsufficientModal = false"
      @enter-practice="handleEnterPracticeFromModal"
      @open-points="handleOpenPointsFromModal"
    />

    <!-- 10. 大厅全游戏玩法规则与输赢计分规则模态框 (全屏无黑边铺满 + 横竖屏顺畅滑动) -->
    <Teleport to="body">
      <div
        v-if="showGameRulesModal"
        :class="isRulesModalRotated ? 'rules-modal-rotated-full' : 'rules-modal-standard-full'"
        class="select-none p-3.5 sm:p-5 text-[#3C2C1E]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-[#D8C7B0] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="text-xl sm:text-2xl p-1.5 rounded-2xl bg-amber-600/20 text-amber-900 border border-amber-600/40">
              {{ activeRulesTab === 'yansan' ? '🎴' : activeRulesTab === 'mahjong' ? '🀄' : '🃏' }}
            </span>
            <div>
              <h3 class="text-base sm:text-xl font-black text-[#3C2C1E] font-serif-title flex items-center gap-2">
                <span v-if="activeRulesTab === 'yansan'">🎴 经典烟三 · 玩法与输赢计分规则</span>
                <span v-else-if="activeRulesTab === 'mahjong'">🀄 麻将 (红中/普通) · 玩法与输赢计分规则</span>
                <span v-else>🃏 十三张 (十三水) · 玩法与输赢计分规则</span>
              </h3>
              <p class="text-[11px] sm:text-xs text-[#6B5744] mt-0.5">
                <span v-if="activeRulesTab === 'yansan'">经典方块4首发 · 黑桃3/黑桃A双煞同盟与计分规则全览</span>
                <span v-else-if="activeRulesTab === 'mahjong'">红中麻将自摸、刮风下雨杠牌、抓码与大满贯规则全览</span>
                <span v-else>十三水全垒打、打枪、特殊牌型免比与道数比牌规则全览</span>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="showGameRulesModal = false"
              class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EFE5D3] hover:bg-[#E5D7C2] border border-[#D8C7B0] flex items-center justify-center text-xs sm:text-sm font-bold text-[#3C2C1E] transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Rules Content Area (Two-Column Responsive Grid + Multi-Direction Touch Scroll) -->
        <div class="flex-1 min-h-0 overflow-y-auto overflow-x-auto touch-pan-y touch-pan-x pr-1 text-xs sm:text-sm leading-relaxed text-[#3C2C1E] mt-3">
            <!-- 1. 十三张 (十三水) 规则 -->
            <div v-if="activeRulesTab === 'shisanshui'" class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <!-- Left Column -->
              <div class="space-y-3.5">
                <!-- 基本流程 -->
                <div class="p-3.5 rounded-2xl bg-white/80 border border-[#D8C7B0] shadow-xs space-y-1.5">
                  <h4 class="font-black text-amber-900 font-serif-title flex items-center gap-1.5 text-sm sm:text-base border-b border-amber-200 pb-1">
                    <span>👑 十三张基本玩法说明</span>
                  </h4>
                  <p>• <b>人数与发牌</b>：四人场（一副 52 张）或八人包厢（两副 104 张），每位玩家分配 13 张手牌。</p>
                  <p>• <b>理牌摆法</b>：13 张手牌需分配为<b>头道（3张）</b>、<b>中道（5张）</b>、<b>尾道（5张）</b>三道。</p>
                  <p>• <b>倒水相公规则</b>：必须满足<b>尾道 ≥ 中道 ≥ 头道</b>。若违规摆放（如中道大于尾道，或头道大于中道），判定为倒水相公，三道直接判定全负并额外罚扣积分。</p>
                </div>

                <!-- 牌型大小与花色压制 -->
                <div class="p-3.5 rounded-2xl bg-white/80 border border-[#D8C7B0] shadow-xs space-y-2">
                  <h4 class="font-black text-amber-900 font-serif-title flex items-center gap-1.5 text-sm sm:text-base border-b border-amber-200 pb-1">
                    <span>⚔️ 牌型大小、花色与顺子压制规则</span>
                  </h4>
                  <p>• <b>牌型大小顺序</b>：五同（八人场） > 同花顺 > 铁支（四条） > 俘虏（葫芦） > 同花 > 顺子 > 三条 > 两对 > 对子 > 乌龙（散牌）。</p>
                  <p>• <b>花色大小顺序</b>：当牌型点数完全相同时，按花色比较：<b>黑桃 ♠ > 红桃 ♥ > 梅花 ♣ > 方块 ♦</b>。</p>
                  <p>• <b>顺子大小顺序</b>：</p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 font-mono text-xs">
                    <div class="p-2 rounded-xl bg-amber-50 border border-amber-200">
                      <b class="text-amber-900">① 至尊顺（最大）：</b> 10 - J - Q - K - A
                    </div>
                    <div class="p-2 rounded-xl bg-amber-50 border border-amber-200">
                      <b class="text-amber-900">② 次大顺（第二）：</b> A - 2 - 3 - 4 - 5
                    </div>
                    <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 col-span-1 sm:col-span-2">
                      <b class="text-amber-900">③ 普通顺：</b> 9-10-J-Q-K > ... > 3-4-5-6-7 > <b>2-3-4-5-6（最小）</b>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column -->
              <div class="space-y-3.5">
                <!-- 道数直接计分表 -->
                <div class="p-3.5 rounded-2xl bg-white/80 border border-[#D8C7B0] shadow-xs space-y-2">
                  <h4 class="font-black text-amber-900 font-serif-title flex items-center gap-1.5 text-sm sm:text-base border-b border-amber-200 pb-1">
                    <span>📊 三道胜出直接计分规则（1水 = 1分）</span>
                  </h4>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse font-sans text-xs">
                      <thead>
                        <tr class="bg-amber-100/80 text-amber-900 font-bold border-b border-amber-300">
                          <th class="p-1.5">道数</th>
                          <th class="p-1.5">胜出牌型</th>
                          <th class="p-1.5">计分水数</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-amber-100">
                        <tr>
                          <td class="p-1.5 font-bold text-amber-900">头道 (3张)</td>
                          <td class="p-1.5">冲三条 (2~A 冲三)</td>
                          <td class="p-1.5 font-bold text-emerald-700 font-mono">+3 水</td>
                        </tr>
                        <tr>
                          <td class="p-1.5 font-bold text-amber-900">头道 (3张)</td>
                          <td class="p-1.5">其他牌型 (对子、乌龙散牌)</td>
                          <td class="p-1.5 font-mono">+1 水</td>
                        </tr>
                        <tr class="bg-amber-50/50">
                          <td class="p-1.5 font-bold text-blue-900">中道 (5张)</td>
                          <td class="p-1.5">同花顺 / 五同 (八人场)</td>
                          <td class="p-1.5 font-bold text-emerald-700 font-mono">+10 水</td>
                        </tr>
                        <tr class="bg-amber-50/50">
                          <td class="p-1.5 font-bold text-blue-900">中道 (5张)</td>
                          <td class="p-1.5">铁支 (四条)</td>
                          <td class="p-1.5 font-bold text-emerald-700 font-mono">+8 水</td>
                        </tr>
                        <tr class="bg-amber-50/50">
                          <td class="p-1.5 font-bold text-blue-900">中道 (5张)</td>
                          <td class="p-1.5">俘虏 (葫芦)</td>
                          <td class="p-1.5 font-bold text-emerald-700 font-mono">+2 水</td>
                        </tr>
                        <tr class="bg-amber-50/50">
                          <td class="p-1.5 font-bold text-blue-900">中道 (5张)</td>
                          <td class="p-1.5">其他牌型 (顺子、同花、两对等)</td>
                          <td class="p-1.5 font-mono">+1 水</td>
                        </tr>
                        <tr>
                          <td class="p-1.5 font-bold text-purple-900">尾道 (5张)</td>
                          <td class="p-1.5">同花顺 / 五同 (八人场)</td>
                          <td class="p-1.5 font-bold text-emerald-700 font-mono">+5 水</td>
                        </tr>
                        <tr>
                          <td class="p-1.5 font-bold text-purple-900">尾道 (5张)</td>
                          <td class="p-1.5">铁支 (四条)</td>
                          <td class="p-1.5 font-bold text-emerald-700 font-mono">+4 水</td>
                        </tr>
                        <tr>
                          <td class="p-1.5 font-bold text-purple-900">尾道 (5张)</td>
                          <td class="p-1.5">其他牌型 (葫芦、顺子、同花等)</td>
                          <td class="p-1.5 font-mono">+1 水</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- 特殊牌型与打枪全垒打 -->
                <div class="p-3.5 rounded-2xl bg-white/80 border border-[#D8C7B0] shadow-xs space-y-2">
                  <h4 class="font-black text-amber-900 font-serif-title flex items-center gap-1.5 text-sm sm:text-base border-b border-amber-200 pb-1">
                    <span>💥 十三大特殊牌型与打枪全垒打</span>
                  </h4>
                  <p>• <b>特殊牌型免比通关</b>：至尊青龙（+36水）、一条龙（+26水）、十二皇族（+24水）、三同花顺（+20水）、三铁支（+16水）、凑一色/全大全小（+10水）、六对半/三同花/三顺子（+6水）。</p>
                  <p>• <b>打枪（2x）</b>：若玩家头中尾三道全胜某一对手，触发“打枪”，基础三道得分<b>翻倍 (2x)</b>。</p>
                  <p>• <b>全垒打（2x）</b>：若玩家打枪全场所有对手，触发“全垒打”，总得分<b>再翻倍 (2x)</b>！</p>
                </div>
              </div>
            </div>

            <!-- 2. 烟三 (三打一 / 双煞) 规则 -->
            <div v-else-if="activeRulesTab === 'yansan'" class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <!-- Left Column -->
              <div class="p-3.5 rounded-2xl bg-white/80 border border-[#D8C7B0] shadow-xs space-y-2">
                <h4 class="font-black text-amber-900 font-serif-title flex items-center gap-1.5 text-sm sm:text-base border-b border-amber-200 pb-1">
                  <span>🎴 经典烟三 (方块4首发 / 煞牌阵营) 玩法规则</span>
                </h4>
                <p>• <b>发牌与首发</b>：4名玩家各发 13 张牌。拿到<b>方块 4 (♦4)</b> 的玩家拥有首发权，出牌组合必须包含 ♦4。</p>
                <p>• <b>煞牌同盟机制</b>：</p>
                <div class="pl-2 space-y-1.5 text-xs">
                  <p>🔹 <b>双人同盟 (2v2)</b>：抓到 <b>黑桃 3 (♠3)</b> 与 <b>黑桃 A (♠A)</b> 的两名玩家自动结为同盟，另外两名玩家结为另一同盟。</p>
                  <p>🔹 <b>独煞单挑 (1v3)</b>：若同一个玩家<b>同时抓到 ♠3 与 ♠A</b>，则该玩家单独为一方（双煞独挑），独战其余 3 名玩家！</p>
                  <p>🔹 <b>强攻单挑 (1v3)</b>：若玩家手牌极其强劲，可在首轮选择“强攻”，放弃同盟直接一人独战其余 3 家。</p>
                </div>
                <p>• <b>牌型与压牌</b>：支持单张、对子、三条、顺子、连对、炸弹（四条及以上）。后家必须用同张数且更大的牌型压制，无牌可压或放弃则选择“过”。</p>
              </div>

              <!-- Right Column -->
              <div class="p-3.5 rounded-2xl bg-white/80 border border-[#D8C7B0] shadow-xs space-y-2">
                <h4 class="font-black text-amber-900 font-serif-title flex items-center gap-1.5 text-sm sm:text-base border-b border-amber-200 pb-1">
                  <span>🪙 烟三输赢计分规则 (试玩与在线场统一)</span>
                </h4>
                <p>• <b>独煞/强攻 1v3 计分规则</b>：</p>
                <div class="pl-2 space-y-1.5 text-xs">
                  <p>🏆 <b>独煞获胜（第 1 名出完手牌）</b>：独煞玩家向其余 3 名玩家<b>各收取 10 积分</b>（独煞玩家 <b>+30 分</b>，其余 3 人各 <b>-10 分</b>）。</p>
                  <p>❌ <b>独煞失败（未获得第 1 名）</b>：独煞玩家向其余 3 名玩家<b>各支付 10 积分</b>（独煞玩家 <b>-30 分</b>，其余 3 人各 <b>+10 分</b>）。</p>
                </div>
                <p>• <b>双人同盟 2v2 计分规则</b>：</p>
                <div class="pl-2 space-y-1.5 text-xs">
                  <p>🥇 <b>双胜（包揽第 1 与第 2 名出完）</b>：胜利同盟两人各 <b>+20 分</b>，失败同盟两人各 <b>-20 分</b>。</p>
                  <p>⚖️ <b>单胜 / 平局</b>：同盟仅一人获得第 1 名，若同盟另一人获得第 3 名则同盟各 <b>+10 分</b>，若得第 4 名则判定为平局 (各 <b>0 分</b>)。</p>
                </div>
              </div>
            </div>

            <!-- 3. 麻将玩法与规则 -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <!-- Left Column -->
              <div class="p-3.5 rounded-2xl bg-white/80 border border-[#D8C7B0] shadow-xs space-y-2">
                <h4 class="font-black text-amber-900 font-serif-title flex items-center gap-1.5 text-sm sm:text-base border-b border-amber-200 pb-1">
                  <span>🀄 麻将 (红中/普通) 玩法与规则说明</span>
                </h4>
                <p>• <b>人数与牌数</b>：4 人麻将竞技对局，共 108 张牌（筒、条、万），红中场加入红中百搭鬼牌。分为 6 码场与 10 码场。</p>
                <p>• <b>基本流程</b>：打色子定庄开门，四道抓牌（手牌 13 张，庄家 14 张）。依次摸牌、打牌，支持碰牌、杠牌（暗杠/明杠/补杠）与自摸胡牌（仅支持自摸和牌）。</p>
                <p>• <b>刮风下雨（杠牌加分）</b>：发生杠牌时即时计算杠牌分（下雨暗杠 +20分、刮风明杠/补杠 +10分）。</p>
                <p>• <b>红中抓码</b>：自摸胡牌后自动从牌墙翻开奖码（6 码场翻 6 码，10 码场翻 10 码），翻出“一、五、九、东风、红中”即为有效中码。</p>
                <p>• <b>四张红中天降</b>：若起手或摸齐 4 张红中，直接触发“四红中大满贯”自摸通关！</p>
              </div>

              <!-- Right Column -->
              <div class="p-3.5 rounded-2xl bg-white/80 border border-[#D8C7B0] shadow-xs space-y-2">
                <h4 class="font-black text-amber-900 font-serif-title flex items-center gap-1.5 text-sm sm:text-base border-b border-amber-200 pb-1">
                  <span>🪙 麻将输赢计分规则</span>
                </h4>
                <p>• <b>结算公式</b>：输赢得分 = <b>底分 (10分) + 命中码数 × 10分 + 杠牌得分</b>。</p>
                <p>• <b>简单计分</b>：无复杂的番数与番型计算，只要自摸胡牌即拿底分，中码越多得分越高，直观清晰！</p>
              </div>
            </div>
          </div>
      </div>
    </Teleport>

    <!-- 9. 离线单机免服试玩选择模态框 (完全无需联网，三大棋牌即开即玩) -->
    <Teleport to="body">
      <div
        v-if="showOfflineSoloModal"
        @click.self="showOfflineSoloModal = false"
        class="fixed inset-0 z-[115] bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none"
      >
        <div class="w-[94vw] max-w-lg rounded-3xl bg-[#EFE5D3] border-2 border-amber-600/50 p-5 shadow-2xl flex flex-col text-[#3C2C1E] transform rotate-90 sm:rotate-0">
          <!-- Header (右上角无X按钮) -->
          <div class="flex items-center pb-3 border-b border-[#D8C7B0] mb-3 shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-2xl p-1.5 rounded-xl bg-amber-600/20 text-amber-900 border border-amber-600/40">🎮</span>
              <div>
                <h3 class="text-base sm:text-lg font-bold text-[#3C2C1E] font-serif-title flex items-center gap-1.5">
                  <span>纯单机离线免服试玩</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                    0流量·免登录
                  </span>
                </h3>
                <p class="text-[11px] text-[#6B5744] mt-0.5">
                  内置高级规则AI算法，无网络断线或无服务器时随时畅玩
                </p>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="space-y-3 py-1">
            <!-- 烟三卡片 -->
            <button
              type="button"
              @click="startOfflineSoloGame('yansan', 'yansan-5-10')"
              class="w-full p-3 rounded-2xl bg-[#FFFDF8] hover:bg-[#FAF4E8] border border-[#D8C7B0] hover:border-amber-600 flex items-center justify-between transition-all group shadow-xs active:scale-[0.99] text-left cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">🎴</span>
                <div>
                  <div class="font-bold text-sm text-[#3C2C1E] group-hover:text-amber-900 flex items-center gap-1.5">
                    <span>经典烟三单机试玩</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono">方块4首出</span>
                  </div>
                  <div class="text-[11px] text-[#6B5744] mt-0.5">3位智能推算AI陪练，体验绝大连出与强攻决断</div>
                </div>
              </div>
              <span class="text-xs font-bold text-[#5C4533] group-hover:translate-x-0.5 transition-transform">即刻开局 ➔</span>
            </button>

            <!-- 十三水卡片 -->
            <button
              type="button"
              @click="startOfflineSoloGame('shisanshui', 'four-realtime')"
              class="w-full p-3 rounded-2xl bg-[#FFFDF8] hover:bg-[#FAF4E8] border border-[#D8C7B0] hover:border-amber-600 flex items-center justify-between transition-all group shadow-xs active:scale-[0.99] text-left cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">🃏</span>
                <div>
                  <div class="font-bold text-sm text-[#3C2C1E] group-hover:text-amber-900 flex items-center gap-1.5">
                    <span>水镜十三水单机试玩</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono">一键理牌</span>
                  </div>
                  <div class="text-[11px] text-[#6B5744] mt-0.5">头中尾三道摆放，支持特殊牌型通关免比与打枪动效</div>
                </div>
              </div>
              <span class="text-xs font-bold text-[#5C4533] group-hover:translate-x-0.5 transition-transform">即刻开局 ➔</span>
            </button>

            <!-- 麻将卡片 -->
            <button
              type="button"
              @click="startOfflineSoloGame('mahjong', 'standard-6')"
              class="w-full p-3 rounded-2xl bg-[#FFFDF8] hover:bg-[#FAF4E8] border border-[#D8C7B0] hover:border-amber-600 flex items-center justify-between transition-all group shadow-xs active:scale-[0.99] text-left cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">🀄</span>
                <div>
                  <div class="font-bold text-sm text-[#3C2C1E] group-hover:text-amber-900 flex items-center gap-1.5">
                    <span>经典国标麻将单机试玩</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono">掷骰定庄</span>
                  </div>
                  <div class="text-[11px] text-[#6B5744] mt-0.5">万条筒字四巡理牌，碰杠听胡自摸全真模拟</div>
                </div>
              </div>
              <span class="text-xs font-bold text-[#5C4533] group-hover:translate-x-0.5 transition-transform">即刻开局 ➔</span>
            </button>
          </div>

          <!-- Footer -->
          <div class="pt-3 mt-1 border-t border-[#D8C7B0] flex items-center justify-between">
            <span class="text-[10px] text-[#6B5744]">单机模式胜负筹码仅供模拟练习，不扣真实账户积分</span>
            <button
              type="button"
              @click="showOfflineSoloModal = false"
              class="px-3.5 py-1.5 rounded-xl bg-[#5C4533] hover:bg-[#433022] text-[#FAF4E8] text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 7. 极速自动匹配弹窗 (同段位智能连线) -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
        <div class="w-[94vw] max-w-lg max-h-[92dvh] flex flex-col rounded-3xl bg-[#EFE5D3] border border-[#D8C7B0] p-4 sm:p-6 shadow-2xl overflow-hidden text-[#3C2C1E]">
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-[#D8C7B0] shrink-0 bg-[#FAF4E8] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4 sm:p-6">
            <h3 class="text-base font-bold text-[#3C2C1E] font-serif-title flex items-center gap-2">
              <span>🏮</span>
              <span>开设新棋牌房间</span>
            </h3>
            <button type="button" @click="showCreateModal = false" class="text-xs text-[#3C2C1E] hover:bg-[#EFE5D3] px-2 py-1 rounded cursor-pointer border border-[#D8C7B0]">
              关闭 ✕
            </button>
          </div>

          <form @submit.prevent="createRoomSubmit" class="flex-1 overflow-y-auto space-y-3.5 pr-1 mt-2">
            <div>
              <label class="block text-xs text-[#6B5744] mb-1 font-bold">房间雅号</label>
              <input
                v-model="newRoomTitle"
                type="text"
                placeholder="例如：醉月阁 · 雀王之战"
                class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] text-[#3C2C1E] focus:outline-none focus:border-[#5C4533]"
              />
            </div>

            <div>
              <label class="block text-xs text-[#6B5744] mb-1.5 font-bold">选择棋牌种类 (3款国粹经典)</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="g in GAME_MODULES"
                  :key="g.id"
                  type="button"
                  @click="newRoomGame = g.id"
                  :class="newRoomGame === g.id ? 'bg-gradient-to-r from-[#5C4533] to-[#433022] text-[#FAF4E8] font-bold border-[#7D6049] shadow-md' : 'bg-[#FFFDF8] border-[#D8C7B0] text-[#3C2C1E] hover:bg-[#FAF4E8]'"
                  class="py-2 px-2 text-xs rounded-xl border transition-colors whitespace-nowrap text-center cursor-pointer"
                >
                  {{ g.icon }} {{ g.name }}
                </button>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2 border-t border-[#D8C7B0]">
              <button
                type="button"
                @click="showCreateModal = false"
                class="px-4 py-2 text-xs rounded-xl bg-[#FAF4E8] hover:bg-[#EFE5D3] text-[#3C2C1E] border border-[#D8C7B0] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                class="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] border border-[#7D6049] shadow-md active:scale-95 transition-all cursor-pointer"
              >
                立即开局
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- 9. 喜庆国风战绩海报生成弹窗 -->
    <VictoryPosterModal
      :show="showVictoryPosterModal"
      :data="victoryPosterData"
      @close="showVictoryPosterModal = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import AuthModal from './components/AuthModal.vue';
import PointsManageModal from './components/PointsManageModal.vue';
import UserProfileModal from './components/UserProfileModal.vue';
import AchievementModal from './components/AchievementModal.vue';
import TermuxDeploySection from './components/TermuxDeploySection.vue';
import Game3DEffects from './components/effects/Game3DEffects.vue';
import InsufficientCoinsModal from './components/InsufficientCoinsModal.vue';
import ServerConfigModal from './components/ServerConfigModal.vue';
import VictoryPosterModal, { VictoryPosterData } from './components/VictoryPosterModal.vue';
import { getRemoteServerUrl, getWebSocketUrl, isNativeApkEnvironment, resolveApiUrl } from './utils/networkConfig';

// 3 Canvas Games
import YansanCanvas from './components/canvas/YansanCanvas.vue';
import ShisanshuiCanvas from './components/canvas/ShisanshuiCanvas.vue';
import MahjongCanvas from './components/canvas/MahjongCanvas.vue';
import MahjongSceneModal, { MahjongSceneMode } from './components/MahjongSceneModal.vue';
import ShisanshuiSceneModal, { ShisanshuiSceneMode } from './components/ShisanshuiSceneModal.vue';
import YansanSceneModal, { YansanSceneMode } from './components/YansanSceneModal.vue';
import SceneWaitingRoom, { ScenePlayer } from './components/SceneWaitingRoom.vue';
import TeahouseChatroom from './components/TeahouseChatroom.vue';

import { soundFX } from './utils/sound';
import { haptics } from './utils/haptics';
import { TableTheme, getGameTheme } from './utils/theme';
import {
  loadLocalProfile,
  saveLocalProfile,
  loadLocalRecords,
  saveLocalRecords,
  recordPointsTx,
  syncWithServer,
  clearLocalAuthData,
  resetToDefaultGuestProfile,
  UserProfile,
  MatchRecord,
  saveOfflinePracticeRecord,
} from './utils/storage';
import {
  type GameType,
  type GameModuleInfo,
  GAME_MODULES,
  GAME_SVG_IMAGES,
  getSceneRequiredCoins,
  getYansanSceneTag,
  getShisanshuiSceneTag,
  getMahjongSceneTag,
  calculateGameSettlement,
} from './games/index.ts';

export type { GameType, GameModuleInfo };

const currentSvgIndex = ref(0);
let svgTimer: number | null = null;
let presenceInterval: any = null;

function updateRealPresence(data: { yansan?: number; shisanshui?: number; mahjong?: number }) {
  if (!data) return;
  const yansanMod = GAME_MODULES.find(g => g.id === 'yansan');
  const shisanshuiMod = GAME_MODULES.find(g => g.id === 'shisanshui');
  const mahjongMod = GAME_MODULES.find(g => g.id === 'mahjong');
  if (yansanMod && typeof data.yansan === 'number') yansanMod.onlinePlayers = Math.max(0, data.yansan);
  if (shisanshuiMod && typeof data.shisanshui === 'number') shisanshuiMod.onlinePlayers = Math.max(0, data.shisanshui);
  if (mahjongMod && typeof data.mahjong === 'number') mahjongMod.onlinePlayers = Math.max(0, data.mahjong);
}

async function fetchRealPresence() {
  try {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/presence`);
    const data = await res.json();
    if (data && data.success) {
      updateRealPresence(data);
    }
  } catch {}
}

onMounted(() => {
  svgTimer = window.setInterval(() => {
    currentSvgIndex.value = (currentSvgIndex.value + 1) % 100;
  }, 2200);

  // Immediately query real connected player presence and teahouse players roster
  fetchRealPresence();
  fetchTeahousePlayers();

  // Periodically refresh real connected player presence and teahouse players roster
  presenceInterval = window.setInterval(() => {
    fetchRealPresence();
    fetchTeahousePlayers();
  }, 3500);
});

onBeforeUnmount(() => {
  if (svgTimer) clearInterval(svgTimer);
  if (presenceInterval) clearInterval(presenceInterval);
  if (recordingInterval) clearInterval(recordingInterval);
  if (voiceStream) {
    try {
      voiceStream.getTracks().forEach((track: any) => track.stop());
    } catch {}
  }
  if (activePlayingAudio) {
    try {
      activePlayingAudio.pause();
      activePlayingAudio = null;
    } catch {}
  }
});

const getGameSvg = (id: GameType) => {
  const imgs = GAME_SVG_IMAGES[id] || [];
  if (imgs.length === 0) return '';
  return imgs[currentSvgIndex.value % imgs.length];
};

const QUICK_PHRASES = [
  '快点吧，我等到花儿都谢了！',
  '你的牌打得也太好了吧！',
  '手气真差，怎么一把大牌都没有！',
  '搏一搏，单车变摩托！',
  '青山不改，绿水长流，后会有期！',
  '风里雨里，牌桌等你！',
  '顺子连环，谁与争锋！',
  '哈哈，这把神仙也救不了你！',
];

interface PhraseCategory {
  name: string;
  icon: string;
  tag: string;
  list: string[];
}

const QUICK_VOICE_CHIPS = [
  { icon: '⚡', label: '催牌', text: '快点吧，我等得花儿都谢了！' },
  { icon: '👏', label: '赞牌', text: '妙啊！这手牌打得当真出神入化！' },
  { icon: '🔥', label: '叫阵', text: '诸位看招，这把谁也别想轻易脱身！' },
  { icon: '🍵', label: '承让', text: '承让承让，这把小弟先拔头筹！' },
];

interface VoicedHistoryItem {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isSelf: boolean;
}

const PHRASE_CATEGORIES: PhraseCategory[] = [
  {
    name: '催牌急招',
    icon: '⚡',
    tag: '急招',
    list: [
      '快点吧，我等得花儿都谢了！',
      '打牌如抽丝，客官您这是绣花呢！',
      '手疾眼快方能定乾坤，莫再迟疑！',
      '大军已兵临城下，阁下何不速速出招！',
      '三尺微命，一刻千金，出牌利落些！',
      '磨刀不误砍柴工，可茶水都凉透啦！',
    ],
  },
  {
    name: '赞赏佩服',
    icon: '👏',
    tag: '称绝',
    list: [
      '妙啊！这手牌打得当真出神入化！',
      '高手隐于市井，在下深感佩服！',
      '炉火纯青，神鬼莫测，甘拜下风！',
      '这招瞒天过海，当真算无遗策！',
      '好牌，好胆识，端的是牌桌帅才！',
      '客官慧眼如炬，小弟自愧不如！',
    ],
  },
  {
    name: '叹息幽默',
    icon: '😅',
    tag: '自嘲',
    list: [
      '手气欠佳，摸得一手烂牌泪两行！',
      '风水轮流转，下局定叫乾坤倒转！',
      '搏一搏单车变摩托，这把权当交学费！',
      '牌运不济时运舛，容在下喝杯热茶压惊！',
      '天不助我，今日牌神去哪吃酒了！',
      '千算万算，没算到这底牌如此坑人！',
    ],
  },
  {
    name: '叫阵争锋',
    icon: '🔥',
    tag: '叫阵',
    list: [
      '诸位看招，这把谁也别想轻易脱身！',
      '王炸在手霸气在胸，谁与我争锋！',
      '顺子连环如长龙，看尔等如何招架！',
      '敢不敢再加一倍筹码，与我决战巅峰！',
      '放马过来吧，今天谁退缩谁是孙子！',
      '我这手牌一亮，满座皆惊！',
    ],
  },
  {
    name: '茶肆雅趣',
    icon: '🍵',
    tag: '闲雅',
    list: [
      '客官上座，先奉上一盏明前龙井！',
      '风里雨里，四方茶楼牌桌静候高朋！',
      '青山不改绿水长流，江湖牌桌后会有期！',
      '牌逢知己千杯少，棋逢对手战意浓！',
      '胜固欣然败亦喜，茶香悠悠叙旧情！',
      '堂倌添茶，诸位牌友稍安勿躁！',
    ],
  },
  {
    name: '战局较量',
    icon: '🀄',
    tag: '锋芒',
    list: [
      '碰！杠！红中已现，谁敢争先！',
      '十三水倒水成灾，稳坐钓鱼台！',
      '烟三绝技，十点半点生死一线！',
      '断桥残雪，一子定音，承让承让！',
      '牌眼已开，听牌待发，只候东风！',
      '这局谁是赢家，且听铜锣一声响！',
    ],
  },
];

const activeDialogueTab = ref<'phrases' | 'history'>('phrases');
const activePhraseCategory = ref(0);
const customVoiceInput = ref('');
const recentVoicedHistory = reactive<VoicedHistoryItem[]>([]);

// Reactive states
const currentView = ref<'lobby' | 'arena' | 'mahjong-scenes' | 'shisanshui-scenes' | 'yansan-scenes' | 'waiting-room' | 'chatroom'>('lobby');
const hasSelectedScene = ref(false);
const activeGameType = ref<GameType | ''>('');
const activeRoomId = ref('RM-202');
const activeMahjongScene = ref<MahjongSceneMode>('hongzhong-6');
const activeShisanshuiScene = ref<ShisanshuiSceneMode>('four-realtime');
const activeYansanScene = ref<YansanSceneMode>('yansan-5-10');
const activeSceneMode = ref<string>('');
const currentWaitingRoomPlayers = ref<ScenePlayer[]>([]);
const isPracticeMode = ref(false);
const currentRoomDeal = ref<any>(null);
const myAssignedPlayerId = ref<string>('');
const myAssignedSeat = ref<number | null>(null);

const currentUserForTable = computed(() => {
  return {
    ...userProfile,
    id: myAssignedPlayerId.value || userProfile.id,
    seat: myAssignedSeat.value !== null ? myAssignedSeat.value : (userProfile as any).seat,
  };
});

const sceneCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {
    'yansan-5-10': 0,
    'yansan-10-20': 0,
    'yansan-20-40': 0,
    'four-realtime': 0,
    'four-booking': 0,
    'eight-realtime': 0,
    'eight-booking': 0,
    'hongzhong-6': 0,
    'hongzhong-10': 0,
    'standard-6': 0,
    'standard-10': 0,
  };

  const list = onlineTeahousePlayers.value || [];
  for (const p of list) {
    if (p && p.sceneMode && p.sceneMode !== 'hall' && p.sceneMode !== 'lobby' && p.sceneMode !== 'none' && p.sceneMode !== '') {
      counts[p.sceneMode] = (counts[p.sceneMode] || 0) + 1;
    }
  }

  // Also include players in current room if present
  if (activeSceneMode.value && activeSceneMode.value !== 'hall' && activeSceneMode.value !== 'lobby' && activeSceneMode.value !== '') {
    const activeWaitingCount = currentWaitingRoomPlayers.value.filter(p => !p.isSimulated).length;
    if (activeWaitingCount > 0) {
      counts[activeSceneMode.value] = Math.max(counts[activeSceneMode.value] || 0, activeWaitingCount);
    }
  }

  return counts;
});

const serverRegisteredPlayers = ref<any[]>([]);

async function fetchTeahousePlayers() {
  try {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/teahouse/players`);
    const data = await res.json();
    if (data && data.success && Array.isArray(data.players)) {
      serverRegisteredPlayers.value = data.players;
    }
  } catch {}
}

const onlineTeahousePlayers = computed(() => {
  const list: any[] = [];
  const myId = userProfile.id || 'P-me';
  const myPhone = userProfile.phone ? String(userProfile.phone).replace(/\D/g, '') : '';

  // 1. 本机真实玩家始终置顶，明确标注为“您”
  list.push({
    id: myId,
    name: userProfile.name || '玩家',
    avatar: userProfile.avatar || '👑',
    coins: typeof userProfile.coins === 'number' ? userProfile.coins : 2000,
    rating: userProfile.rating || 1800,
    level: userProfile.level || 1,
    phone: userProfile.phone,
    isAdmin: !!userProfile.isAdmin,
    isOnline: true,
    isSelf: true,
    gameType: activeGameType.value,
    sceneMode: activeSceneMode.value,
  });

  // 2. 加载全服服务端真正处于【在线状态】的已注册茶客 (仅保留 sp.isOnline === true)
  for (const sp of serverRegisteredPlayers.value) {
    if (!sp || sp.id === myId) continue;
    if (!sp.isOnline) continue; // 关键核心：仅包含当前真正在线连线的茶客，排除离线授权注册记录！
    const spPhone = sp.phone ? String(sp.phone).replace(/\D/g, '') : '';
    if (myPhone && spPhone && (spPhone === myPhone || myPhone.endsWith(spPhone) || spPhone.endsWith(myPhone))) {
      continue;
    }
    if (!list.some(item => item.id === sp.id)) {
      list.push({
        id: sp.id,
        name: sp.name,
        avatar: sp.avatar || '👑',
        coins: typeof sp.coins === 'number' ? sp.coins : 0,
        rating: sp.rating || 1800,
        level: sp.level || 1,
        phone: sp.phone,
        isAdmin: !!sp.isAdmin,
        isOnline: true,
        gameType: sp.gameType || 'lobby',
        sceneMode: sp.sceneMode || 'hall',
        lastSeen: sp.lastSeen,
      });
    }
  }

  // 3. 同步当前匹配等候室同席真人玩家（若有入座，更新席位与在线状态）
  for (const p of currentWaitingRoomPlayers.value) {
    if (!p.isSimulated && p.id !== myId) {
      const match = list.find(item => item.id === p.id || item.name === p.name);
      if (match) {
        match.isOnline = true;
        match.gameType = activeGameType.value;
        match.sceneMode = activeSceneMode.value;
        if (typeof p.coins === 'number') match.coins = p.coins;
      } else {
        list.push({
          id: p.id,
          name: p.name,
          avatar: p.avatar || '👑',
          coins: typeof p.coins === 'number' ? p.coins : 2000,
          rating: p.rating || 1800,
          level: 1,
          isOnline: true,
          gameType: activeGameType.value,
          sceneMode: activeSceneMode.value,
        });
      }
    }
  }

  return list;
});

const activeMahjongSceneTag = computed(() => {
  return getMahjongSceneTag(activeMahjongScene.value);
});

const activeShisanshuiSceneTag = computed(() => {
  return getShisanshuiSceneTag(activeShisanshuiScene.value);
});

const currentSceneDisplayName = computed(() => {
  if (isPracticeMode.value) {
    if (activeGameType.value === 'shisanshui') {
      return (activeSceneMode.value?.startsWith('eight') || activeShisanshuiScene.value?.startsWith('eight'))
        ? '水镜十三张 · 八人人机模拟场'
        : '水镜十三张 · 人机对战模拟场';
    }
    if (activeGameType.value === 'yansan') return '经典烟三 · 人机对战模拟场';
    if (activeGameType.value === 'mahjong') return '经典国标麻将 · 人机对战模拟场';
    return '单机试玩模拟场';
  }
  if (!activeGameType.value && !activeSceneMode.value) {
    return '未加入任何游戏';
  }
  if (activeGameType.value === 'shisanshui') {
    switch (activeShisanshuiScene.value || activeSceneMode.value) {
      case 'four-realtime':
        return '四人实时场';
      case 'four-booking':
        return '四人预约场';
      case 'eight-realtime':
        return '八人实时场';
      case 'eight-booking':
        return '八人预约场';
      default:
        return '四人实时场';
    }
  }
  if (activeGameType.value === 'mahjong') {
    switch (activeMahjongScene.value || activeSceneMode.value) {
      case 'hongzhong-6':
        return '红中6码场';
      case 'hongzhong-10':
        return '红中10码场';
      case 'standard-10':
        return '普通10码场';
      case 'standard-6':
        return '普通6码场';
      default:
        return '红中麻将';
    }
  }
  if (activeGameType.value === 'yansan') {
    const mode = activeYansanScene.value || activeSceneMode.value;
    if (mode === 'yansan-20-40') return '经典烟三 · 20--40分场';
    if (mode === 'yansan-10-20') return '经典烟三 · 10--20分场';
    return '经典烟三 · 5--10分场';
  }
  return '未加入任何游戏';
});

const currentSceneMaxPlayers = computed(() => {
  if (activeGameType.value === 'shisanshui') {
    if (activeShisanshuiScene.value === 'eight-realtime' || activeShisanshuiScene.value === 'eight-booking') {
      return 8;
    }
  }
  return 4;
});

const currentSceneBaseStake = computed(() => {
  if (activeGameType.value === 'mahjong') return 100;
  if (activeGameType.value === 'shisanshui') {
    return (activeShisanshuiScene.value === 'eight-realtime' || activeShisanshuiScene.value === 'eight-booking') ? 500 : 100;
  }
  if (activeGameType.value === 'yansan') {
    return 100;
  }
  return 100;
});

// Danmaku and Teahouse Dialogue State
const danmakuEnabled = ref(false);
const danmakuItems = reactive<{ id: string; sender: string; avatar: string; text: string; prop?: string; color: string; top: number; duration: number }[]>([]);
const quickBarInput = ref('');

// Category tabs for compact lobby
const activeCategoryTab = ref<'all' | 'racing' | 'strategy'>('all');
const filteredGameModules = computed(() => {
  if (activeCategoryTab.value === 'racing') {
    return GAME_MODULES.filter((g) => g.id === 'yansan');
  }
  if (activeCategoryTab.value === 'strategy') {
    return GAME_MODULES.filter((g) => g.id === 'shisanshui' || g.id === 'mahjong');
  }
  return GAME_MODULES;
});

// Rotated 90 degrees landscape mode (default true: 全界面旋转90度横屏模式，包括大厅)
const isRotated90 = ref(true);
const showChatDrawer = ref(false);

const showAuthModal = ref(false);
const showPointsModal = ref(false);
const showProfileModal = ref(false);
const showAchievementModal = ref(false);
const showCreateModal = ref(false);
const showMahjongSceneModal = ref(false);
const showTermuxModal = ref(false);
const showServerConfigModal = ref(false);
const showGameRulesModal = ref(false);
const isRulesModalRotated = ref(true); // 规则弹窗默认旋转90度横屏全屏展示
const activeRulesTab = ref<'shisanshui' | 'yansan' | 'mahjong'>('shisanshui');

function openGameRules(gameId: string) {
  if (gameId === 'yansan' || gameId === 'shisanshui' || gameId === 'mahjong') {
    activeRulesTab.value = gameId;
  }
  isRulesModalRotated.value = true;
  showGameRulesModal.value = true;
  if (typeof soundFX.playTap === 'function') soundFX.playTap();
}

const isDownloadingApk = ref(false);
const downloadProgressText = ref('准备下载...');
const downloadTimestamp = ref(Date.now());

const directApkDownloadUrl = computed(() => {
  return `/api/download/apk?variant=release&t=${downloadTimestamp.value}`;
});

async function handleDirectDownloadApk(event?: MouseEvent) {
  soundFX.playCardPlace();

  // 如果已经在下载中，防止重复触发
  if (isDownloadingApk.value) {
    if (event) event.preventDefault();
    return;
  }

  // 检测是否处于微信内置浏览器环境（微信会拦截所有 APK 下载）
  if (typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent)) {
    if (event) event.preventDefault();
    triggerSpeechBubble('⚠️ 微信内置浏览器会拦截 APK 安装包下载，请在右上角选择【在浏览器中打开】即可直接极速下载！');
    return;
  }

  isDownloadingApk.value = true;
  downloadProgressText.value = '准备下载...';

  // 1. 优先采用 Fetch + Blob 方案流式抓取并实时显示下载进度
  // 这种方式在电脑端、手机端、WebView、Iframe 内均 100% 成功，完全免疫 Iframe 弹窗拦截与 302 跨域问题
  try {
    const downloadUrl = `/api/download/apk?variant=release&t=${Date.now()}`;
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/vnd.android.package-archive' },
    });

    if (response.ok) {
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 4699557;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (reader) {
        if (event) event.preventDefault(); // 已由 Blob 接管下载，阻止 <a> 的默认行为避免重复触发
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.length;
            if (total > 0) {
              const pct = Math.min(99, Math.round((loaded / total) * 100));
              downloadProgressText.value = `${pct}%`;
            }
          }
        }

        const blob = new Blob(chunks, { type: 'application/vnd.android.package-archive' });
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = 'chess-game-release.apk';
        document.body.appendChild(a);
        a.click();

        downloadProgressText.value = '下载完成';
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          isDownloadingApk.value = false;
          downloadProgressText.value = '准备下载...';
        }, 2000);
        return;
      }
    }
  } catch (e) {
    console.warn('[APK Direct Download] Fetch 抓取降级，使用原生页面下载通道:', e);
  }

  // 2. 降级方案：隐藏 iframe 或同源直链下载 (不使用 target="_blank"，避免被弹窗拦截器或 Iframe 沙箱杀死)
  downloadProgressText.value = '下载中...';
  try {
    let iframe = document.getElementById('apk-download-hidden-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'apk-download-hidden-frame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
    iframe.src = `/api/download/apk?variant=release&t=${Date.now()}`;
  } catch {
    window.location.href = `/api/download/apk?variant=release&t=${Date.now()}`;
  }

  setTimeout(() => {
    isDownloadingApk.value = false;
    downloadProgressText.value = '准备下载...';
  }, 4000);
}

function handleServerUpdated(_newUrl: string) {
  connectWs();
  if (userProfile.isLoggedIn) {
    syncWithServer(userProfile, matchRecords);
  }
}
const showInsufficientModal = ref(false);
const insufficientModalData = reactive({
  gameType: 'mahjong' as GameType,
  sceneMode: 'hongzhong-6',
  sceneName: '红中麻将 · 六码',
  requiredCoins: 100,
  currentCoins: 0,
});
const fxRef = ref<any>(null);
const show3DFxPanel = ref(false);

const FX_SHOWCASE_LIST = [
  { id: 'qianggong', name: '烟三强攻独霸', icon: '🔥', desc: '红莲烈焰独战全场 · 胜负翻倍' },
  { id: 'bomb', name: '轰天炸弹震屏', icon: '💣', desc: '全屏强震冲击波与炸药星火' },
  { id: 'unbeatable', name: '全场绝大连出', icon: '👑', desc: '至尊黑桃三与绝大牌型连击' },
  { id: 'dragon', name: '青龙连环顺子', icon: '🐲', desc: '金光龙影斩光波破竹而过' },
  { id: 'stamp_red', name: '朱砂天胡神印', icon: '🀄', desc: '金石下坠震屏朱砂大印' },
  { id: 'stamp_green', name: '翡翠雀王暗杠', icon: '🀄', desc: '绿玉回弹碎屑冲击印章' },
  { id: 'dice', name: '3D 物理翻滚骰子', icon: '🎲', desc: '立体双骰抛掷物理弹跳' },
  { id: 'gunshot', name: '绝杀精准打枪', icon: '🔫', desc: '十三水瞄准锁定弹道碎屏' },
  { id: 'coins', name: '金币金元宝暴雨', icon: '🪙', desc: '重力回弹闪耀金币瀑布' },
];

function triggerShowcaseFx(id: string) {
  if (!fxRef.value) return;
  if (id === 'qianggong') {
    fxRef.value.triggerBomb('烟三强攻', '独战全场 · 胜负加倍');
    soundFX.speakAction('qianggong');
  } else if (id === 'bomb') {
    fxRef.value.triggerBomb('轰天炸弹', '牌局激斗 · 筹码翻倍');
  } else if (id === 'unbeatable') {
    fxRef.value.triggerDragon('全场绝大', '无人可压 · 绝大连出');
    soundFX.speakAction('unbeatable');
  } else if (id === 'dragon') {
    fxRef.value.triggerDragon('势如破竹', '连环顺子 · 一气呵成');
  } else if (id === 'stamp_red') {
    fxRef.value.triggerStamp('胡', '自摸和牌大捷', 'red');
  } else if (id === 'stamp_green') {
    fxRef.value.triggerStamp('杠', '暗杠开花 · 补牌入座', 'green');
  } else if (id === 'dice') {
    fxRef.value.triggerDice(Math.floor(1 + Math.random() * 6), Math.floor(1 + Math.random() * 6));
  } else if (id === 'gunshot') {
    fxRef.value.triggerGunshot(50, 45, '💥 绝杀打枪 +6水');
  } else if (id === 'coins') {
    fxRef.value.triggerCoins(50);
  } else if (id === 'grandslam') {
    fxRef.value.triggerGrandSlam();
  }
}

function onGameFx(type: string, payload?: any) {
  if (!fxRef.value) return;
  if (type === 'qianggong') {
    fxRef.value.triggerBomb('烟三强攻', '独战全场 · 胜负加倍');
    soundFX.speakAction('qianggong');
  } else if (type === 'bomb') {
    fxRef.value.triggerBomb('轰天炸弹', '牌局激斗 · 筹码加倍');
  } else if (type === 'unbeatable' || type === 'dragon') {
    fxRef.value.triggerDragon('势如破竹', '全场绝大 · 连出新牌');
  } else if (type === 'straight') {
    fxRef.value.triggerDragon('势如破竹', '连环顺子 · 一气呵成');
  } else if (type === 'dice') {
    fxRef.value.triggerDice(Math.floor(1 + Math.random() * 6), Math.floor(1 + Math.random() * 6));
  } else if (type === 'peng') {
    fxRef.value.triggerStamp('碰', '雀圣亮刻', 'green');
  } else if (type === 'gang') {
    fxRef.value.triggerStamp('杠', '暗杠开花', 'green');
  } else if (type === 'hu') {
    fxRef.value.triggerStamp('胡', '国标自摸和牌', 'red');
  } else if (type === 'gunshot') {
    fxRef.value.triggerGunshot(50, 40, '💥 绝杀打枪 +3水');
  } else if (type === 'grandslam') {
    fxRef.value.triggerGrandSlam();
  } else if (type === 'win') {
    // 移除撒金币动画
  }
}

const userProfile = reactive<UserProfile>(loadLocalProfile());
if (!userProfile.avatar || userProfile.avatar === '🀄') {
  userProfile.avatar = '👑';
}
const matchRecords = reactive<MatchRecord[]>(loadLocalRecords());
const currentTheme = ref<TableTheme>(getGameTheme('yansan'));
const soundOn = ref(true);

const rooms = ref<any[]>([]);
const chatInput = ref('');
const floatingProps = reactive<{ id: string; sender: string; icon: string; x: number; y: number }[]>([]);
const activeSpeechBubble = ref('');
let speechTimer: any = null;

// Real-Time Table Voice Recording & Broadcast State (20s limit / auto-broadcast to all players)
const isRecordingVoice = ref(false);
const recordingSeconds = ref(0);
const activePlayingVoice = ref<{ sender: string; duration: number } | null>(null);
const micErrorTip = ref('');
let micErrorTimer: any = null;
let voiceRecorder: any = null;
let voiceStream: any = null;
let recordingAudioCtx: any = null;
let voiceChunks: Blob[] = [];
let recordingInterval: any = null;
let activePlayingAudio: HTMLAudioElement | null = null;

const newRoomTitle = ref('');
const newRoomGame = ref<GameType>('yansan');

// WebSocket and Packet Tracking for Termux diagnostic
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
const wsConnected = ref(false);
const httpConnected = ref(true);
const wsRtt = ref(15);
const packetLogs = reactive<{ id: string; dir: 'IN' | 'OUT'; summary: string; ts: string }[]>([]);

const networkStatusLabel = computed(() => {
  if (!wsConnected.value) return '断线';
  return `${wsRtt.value}ms`;
});

const networkStatusText = computed(() => {
  if (!wsConnected.value) return '未连接服务器';
  if (wsRtt.value < 80) return '极速流畅';
  if (wsRtt.value < 180) return '连接良好';
  return '延迟偏高';
});

const networkStatusColorClass = computed(() => {
  if (!wsConnected.value) return 'text-rose-300 border-rose-500/60 bg-rose-950/40 hover:bg-rose-900/60';
  if (wsRtt.value < 80) return 'text-emerald-300 border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/60';
  if (wsRtt.value < 180) return 'text-amber-300 border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60';
  return 'text-orange-300 border-orange-500/60 bg-orange-950/40 hover:bg-orange-900/60';
});

const networkDotBgClass = computed(() => {
  if (!wsConnected.value) return 'bg-rose-500';
  if (wsRtt.value < 80) return 'bg-emerald-400';
  if (wsRtt.value < 180) return 'bg-amber-400';
  return 'bg-orange-500';
});

const showOfflineSoloModal = ref(false);
const reconnectCountdown = ref(5);
let reconnectInterval: any = null;

function startReconnectCountdown() {
  if (reconnectInterval) clearInterval(reconnectInterval);
  reconnectCountdown.value = 5;
  reconnectInterval = window.setInterval(() => {
    if (wsConnected.value && httpConnected.value) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
      reconnectCountdown.value = 5;
      return;
    }
    reconnectCountdown.value--;
    if (reconnectCountdown.value <= 0) {
      reconnectCountdown.value = 5;
      connectWs();
      if (userProfile.isLoggedIn) {
        fetchFreshProfile();
      }
    }
  }, 1000);
}

function triggerManualReconnect() {
  soundFX.playTap();
  reconnectCountdown.value = 5;
  connectWs();
  if (userProfile.isLoggedIn) {
    fetchFreshProfile();
  }
  triggerSpeechBubble('正在尝试立即重新连接网络...');
}

function startOfflineSoloGame(gt: GameType, sceneMode: string) {
  showOfflineSoloModal.value = false;
  soundFX.playTap();
  startPracticeGame(gt, sceneMode);
  triggerSpeechBubble('🎮 已进入离线单机试玩模式，3位智能AI陪练已就位！');
}

// 喜庆高光战绩海报状态
const showVictoryPosterModal = ref(false);
const victoryPosterData = ref<VictoryPosterData>({
  gameType: '十三水',
  gameTypeBadge: '四人场',
  playerName: '雀坛国手',
  playerAvatar: '👑',
  outcome: 'win',
  scoreDelta: 16,
  scoreUnit: '水',
  tableSummary: '头道冲三 · 中道葫芦 · 尾道同花顺',
  highlights: ['横扫全场 · 打枪全垒打 (+16水)', '三道全胜通关'],
  customSealText: '雀圣绝顶',
});

function handleOpenPoster(payload?: Partial<VictoryPosterData>) {
  if (payload) {
    victoryPosterData.value = {
      gameType: payload.gameType || (activeGameType.value === 'yansan' ? '经典烟三' : activeGameType.value === 'mahjong' ? '经典麻将' : '十三水'),
      gameTypeBadge: payload.gameTypeBadge || currentSceneDisplayName.value,
      gameMode: payload.gameMode || currentSceneDisplayName.value,
      playerName: payload.playerName || userProfile.name || '雀坛国手',
      playerAvatar: payload.playerAvatar || userProfile.avatar || '👑',
      outcome: payload.outcome || 'win',
      scoreDelta: typeof payload.scoreDelta === 'number' ? payload.scoreDelta : 0,
      scoreUnit: payload.scoreUnit || (payload.gameType === '十三水' ? '水' : '分'),
      tableSummary: payload.tableSummary,
      opponentSummary: payload.opponentSummary,
      highlights: payload.highlights || ['牌逢敌手，棋高一着', '神技卓绝，惊艳四座'],
      customSealText: payload.customSealText,
    };
  } else {
    const lastRecord = matchRecords[0];
    if (lastRecord) {
      victoryPosterData.value = {
        gameType: lastRecord.gameType === 'yansan' ? '经典烟三' : lastRecord.gameType === 'mahjong' ? '经典麻将' : '十三水',
        gameTypeBadge: lastRecord.gameType,
        playerName: userProfile.name || '雀坛国手',
        playerAvatar: userProfile.avatar || '👑',
        outcome: lastRecord.result === 'win' ? 'win' : lastRecord.result === 'loss' ? 'lose' : 'draw',
        scoreDelta: lastRecord.scoreDelta,
        scoreUnit: lastRecord.gameType === '十三水' ? '水' : '分',
        tableSummary: `${lastRecord.date} · 房间 ${lastRecord.roomId}`,
        highlights: [lastRecord.details || '技高一筹，所向披靡'],
        customSealText: lastRecord.scoreDelta > 0 ? '雀圣绝顶' : undefined,
      };
    }
  }
  showVictoryPosterModal.value = true;
}

// 移动端/锁屏唤醒平滑恢复网络浮动标识 (Smooth Reconnection Indicator)
const showSmoothReconnectBadge = ref(false);
let smoothReconnectTimer: any = null;

function triggerSmoothReconnectBadge() {
  showSmoothReconnectBadge.value = true;
  if (smoothReconnectTimer) clearTimeout(smoothReconnectTimer);
  smoothReconnectTimer = setTimeout(() => {
    showSmoothReconnectBadge.value = false;
  }, 3200);
}

let ws: WebSocket | null = null;
let pingInterval: any = null;
let sessionCheckInterval: any = null;

function addPacketLog(dir: 'IN' | 'OUT', summary: string) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  packetLogs.unshift({ id: `${Date.now()}-${Math.random()}`, dir, summary, ts });
  if (packetLogs.length > 20) packetLogs.pop();
}

const activeModuleInfo = computed(() => {
  return GAME_MODULES.find((g) => g.id === activeGameType.value) || GAME_MODULES[0];
});

const activeRoom = computed(() => {
  return rooms.value.find((r) => r.id === activeRoomId.value) || rooms.value.find((r) => r.gameType === activeGameType.value) || rooms.value[0] || null;
});

const activeChatList = computed(() => {
  return activeRoom.value?.chat || [
    { id: 'def_1', sender: '系统司仪', text: '欢迎入席！横屏对弈视野更辽阔。', timestamp: '10:00' },
  ];
});

function getGameName(gt: GameType) {
  return GAME_MODULES.find((g) => g.id === gt)?.name || gt;
}

function scrollToTermux() {
  const el = document.getElementById('termux-section');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
    soundFX.playTap();
  }
}

function enterGame(gt: GameType) {
  if (!userProfile.isLoggedIn) {
    showAuthModal.value = true;
    soundFX.playTap();
    return;
  }
  // 所有游戏均需 100 积分准入
  if (userProfile.coins < 100) {
    promptInsufficientCoins(gt, 'default', 100);
    return;
  }
  if (gt === 'mahjong') {
    currentView.value = 'mahjong-scenes';
    soundFX.playTap();
    return;
  }
  if (gt === 'shisanshui') {
    currentView.value = 'shisanshui-scenes';
    soundFX.playTap();
    return;
  }
  if (gt === 'yansan') {
    currentView.value = 'yansan-scenes';
    soundFX.playTap();
    return;
  }
  activeGameType.value = gt;
  currentTheme.value = getGameTheme(gt);
  currentWaitingRoomPlayers.value = [];
  currentView.value = 'waiting-room';
  notifyPresence(gt);
  soundFX.playTap();
}

function getSceneRequiredCoins(gt: GameType, sceneMode: string): number {
  if (gt === 'mahjong') return 100;
  if (gt === 'shisanshui') {
    if (sceneMode === 'eight-realtime' || sceneMode === 'eight-booking') return 500;
    return 100;
  }
  if (gt === 'yansan') {
    return 100;
  }
  return 100;
}

function getSceneDisplayName(gt: GameType, sceneMode: string): string {
  if (gt === 'mahjong') {
    if (sceneMode === 'hongzhong-6') return '红中6码场';
    if (sceneMode === 'hongzhong-10') return '红中10码场';
    if (sceneMode === 'standard-10') return '普通10码场';
    return '普通6码场';
  }
  if (gt === 'shisanshui') {
    if (sceneMode === 'eight-realtime') return '八人实时场';
    if (sceneMode === 'eight-booking') return '八人预约场';
    if (sceneMode === 'four-booking') return '四人预约场';
    return '四人实时场';
  }
  if (gt === 'yansan') {
    if (sceneMode === 'yansan-20-40') return '经典烟三 · 20--40分场';
    if (sceneMode === 'yansan-10-20') return '经典烟三 · 10--20分场';
    return '经典烟三 · 5--10分场';
  }
  return '棋牌对决场';
}

function promptInsufficientCoins(gt: GameType, sceneMode: string, required: number) {
  soundFX.playTap();
  insufficientModalData.gameType = gt;
  insufficientModalData.sceneMode = sceneMode;
  insufficientModalData.sceneName = getSceneDisplayName(gt, sceneMode);
  insufficientModalData.requiredCoins = required;
  insufficientModalData.currentCoins = userProfile.coins;
  showInsufficientModal.value = true;
}

function handleEnterPracticeFromModal() {
  showInsufficientModal.value = false;
  startPracticeGame(insufficientModalData.gameType, insufficientModalData.sceneMode);
}

function handleOpenPointsFromModal() {
  showInsufficientModal.value = false;
  openPointsModal();
}

function startPracticeGame(gt: GameType, sceneMode: string) {
  isPracticeMode.value = true;
  activeGameType.value = gt;
  activeSceneMode.value = sceneMode;
  if (gt === 'mahjong') activeMahjongScene.value = sceneMode as any;
  if (gt === 'shisanshui') activeShisanshuiScene.value = sceneMode as any;
  if (gt === 'yansan') activeYansanScene.value = sceneMode as any;
  currentTheme.value = getGameTheme(gt);

  const maxPlayers = (gt === 'shisanshui' && (sceneMode === 'eight-realtime' || sceneMode === 'eight-booking')) ? 8 : 4;

  const players: ScenePlayer[] = [
    {
      id: userProfile.id || 'P-me',
      name: `${userProfile.name || '您'}(试玩)`,
      avatar: userProfile.avatar || '👤',
      rating: userProfile.rating || 1800,
      coins: userProfile.coins,
      seat: 0,
      isSimulated: true,
    }
  ];

  for (let i = 1; i < maxPlayers; i++) {
    players.push({
      id: `sim-${Date.now()}-${i}`,
      name: `人机${i}`,
      avatar: '🤖',
      rating: Math.floor(1800 + Math.random() * 300),
      coins: Math.floor(2000 + Math.random() * 3000),
      seat: i,
      isSimulated: true,
    });
  }

  currentWaitingRoomPlayers.value = players;
  currentRoomDeal.value = null;
  activeRoomId.value = `practice-${gt}-${Date.now()}`;
  currentView.value = 'arena';
  soundFX.playVictory();
}

function enterTeahouseChatroom() {
  if (!userProfile.isLoggedIn) {
    showAuthModal.value = true;
    soundFX.playTap();
    return;
  }
  if (!hasSelectedScene.value) {
    activeSceneMode.value = '';
    activeGameType.value = '';
  }
  currentView.value = 'chatroom';
  notifyPresence(activeGameType.value || 'lobby', activeSceneMode.value || '');
  fetchTeahousePlayers();
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({ type: 'request_teahouse_players' }));
    } catch {}
  }
  soundFX.playTap();
}

function onChangeSceneFromChatroom() {
  if (!isPracticeMode.value && ws && ws.readyState === WebSocket.OPEN && (activeRoomId.value || activeGameType.value)) {
    try {
      ws.send(JSON.stringify({
        type: 'scene_leave',
        roomId: activeRoomId.value,
        gameType: activeGameType.value,
        sceneMode: activeSceneMode.value,
        playerId: userProfile.id || 'P-me',
        playerName: userProfile.name,
      }));
    } catch {}
  }
  if (activeGameType.value === 'mahjong') currentView.value = 'mahjong-scenes';
  else if (activeGameType.value === 'shisanshui') currentView.value = 'shisanshui-scenes';
  else if (activeGameType.value === 'yansan') currentView.value = 'yansan-scenes';
  else currentView.value = 'yansan-scenes';
  soundFX.playTap();
}

function onSelectSceneFromChatroom(gt: string, mode: string) {
  if (!gt || !mode || mode === 'none' || mode === 'lobby') {
    if (!isPracticeMode.value && ws && ws.readyState === WebSocket.OPEN && (activeRoomId.value || activeGameType.value)) {
      try {
        ws.send(JSON.stringify({
          type: 'scene_leave',
          roomId: activeRoomId.value,
          gameType: activeGameType.value,
          sceneMode: activeSceneMode.value,
          playerId: userProfile.id || 'P-me',
          playerName: userProfile.name,
        }));
      } catch {}
    }
    hasSelectedScene.value = false;
    activeGameType.value = '';
    activeSceneMode.value = '';
    notifyPresence('lobby', '');
    return;
  }
  hasSelectedScene.value = true;
  if (gt === 'mahjong') {
    onSelectMahjongScene(mode as MahjongSceneMode);
  } else if (gt === 'shisanshui') {
    onSelectShisanshuiScene(mode as ShisanshuiSceneMode);
  } else if (gt === 'yansan') {
    onSelectYansanScene(mode as YansanSceneMode);
  }
}

function sendSceneJoinOverWs(gt: string, mode: string) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      const maxP = (gt === 'shisanshui' && (mode === 'eight-realtime' || mode === 'eight-booking')) ? 8 : 4;
      ws.send(JSON.stringify({
        type: 'scene_join',
        gameType: gt,
        sceneMode: mode,
        sceneName: currentSceneDisplayName.value,
        maxPlayers: maxP,
        player: {
          id: userProfile.id || `P-me-${Date.now()}`,
          name: userProfile.name || '玩家',
          avatar: userProfile.avatar || '👑',
          coins: typeof userProfile.coins === 'number' ? userProfile.coins : 2000,
          rating: typeof userProfile.rating === 'number' ? userProfile.rating : 1800,
        }
      }));
    } catch {}
  }
}

function onSelectMahjongScene(mode: MahjongSceneMode) {
  if (!userProfile.isLoggedIn) {
    showAuthModal.value = true;
    soundFX.playTap();
    return;
  }
  const reqCoins = getSceneRequiredCoins('mahjong', mode);
  if (userProfile.coins < reqCoins) {
    promptInsufficientCoins('mahjong', mode, reqCoins);
    return;
  }
  hasSelectedScene.value = true;
  isPracticeMode.value = false;
  activeMahjongScene.value = mode;
  activeSceneMode.value = mode;
  activeGameType.value = 'mahjong';
  currentTheme.value = getGameTheme('mahjong');
  showChatDrawer.value = false;
  currentWaitingRoomPlayers.value = [];
  currentView.value = 'chatroom';
  notifyPresence('mahjong', mode);
  sendSceneJoinOverWs('mahjong', mode);
  soundFX.playTap();
}

function onSelectShisanshuiScene(mode: ShisanshuiSceneMode) {
  if (!userProfile.isLoggedIn) {
    showAuthModal.value = true;
    soundFX.playTap();
    return;
  }
  const reqCoins = getSceneRequiredCoins('shisanshui', mode);
  if (userProfile.coins < reqCoins) {
    promptInsufficientCoins('shisanshui', mode, reqCoins);
    return;
  }
  hasSelectedScene.value = true;
  isPracticeMode.value = false;
  activeShisanshuiScene.value = mode;
  activeSceneMode.value = mode;
  activeGameType.value = 'shisanshui';
  currentTheme.value = getGameTheme('shisanshui');
  showChatDrawer.value = false;
  currentWaitingRoomPlayers.value = [];
  if (mode === 'four-booking' || mode === 'eight-booking') {
    currentView.value = 'arena';
  } else {
    currentView.value = 'chatroom';
    notifyPresence('shisanshui', mode);
    sendSceneJoinOverWs('shisanshui', mode);
  }
  soundFX.playTap();
}

function onSelectYansanScene(mode: YansanSceneMode) {
  if (!userProfile.isLoggedIn) {
    showAuthModal.value = true;
    soundFX.playTap();
    return;
  }
  const reqCoins = getSceneRequiredCoins('yansan', mode);
  if (userProfile.coins < reqCoins) {
    promptInsufficientCoins('yansan', mode, reqCoins);
    return;
  }
  hasSelectedScene.value = true;
  isPracticeMode.value = false;
  activeYansanScene.value = mode;
  activeSceneMode.value = mode;
  activeGameType.value = 'yansan';
  currentTheme.value = getGameTheme('yansan');
  showChatDrawer.value = false;
  currentWaitingRoomPlayers.value = [];
  currentView.value = 'chatroom';
  notifyPresence('yansan', mode);
  sendSceneJoinOverWs('yansan', mode);
  soundFX.playTap();
}

function onChangeSceneFromWaitingRoom() {
  if (!isPracticeMode.value && ws && ws.readyState === WebSocket.OPEN && (activeRoomId.value || activeGameType.value)) {
    try {
      ws.send(JSON.stringify({
        type: 'scene_leave',
        roomId: activeRoomId.value,
        gameType: activeGameType.value,
        sceneMode: activeSceneMode.value,
        playerId: userProfile.id || 'P-me',
        playerName: userProfile.name,
      }));
    } catch {}
  }
  if (activeGameType.value === 'mahjong') currentView.value = 'mahjong-scenes';
  else if (activeGameType.value === 'shisanshui') currentView.value = 'shisanshui-scenes';
  else currentView.value = 'yansan-scenes';
  soundFX.playTap();
}

function onFullSeatGameStart(players: ScenePlayer[], roomId?: string, deal?: any) {
  currentWaitingRoomPlayers.value = players;
  if (!isPracticeMode.value) {
    isPracticeMode.value = false;
  }
  if (roomId) {
    activeRoomId.value = roomId;
  } else {
    const match = rooms.value.find((r) => r.gameType === activeGameType.value);
    if (match) activeRoomId.value = match.id;
  }
  if (deal) {
    currentRoomDeal.value = deal;
  }
  currentView.value = 'arena';
  soundFX.playVictory();

  if (ws && ws.readyState === WebSocket.OPEN && activeRoomId.value) {
    try {
      ws.send(JSON.stringify({
        type: 'scene_start_game',
        roomId: activeRoomId.value,
        gameType: activeGameType.value,
        sceneMode: activeSceneMode.value,
      }));
    } catch {}
  }
}

function enterRoom(r: any) {
  if (!userProfile.isLoggedIn) {
    showAuthModal.value = true;
    soundFX.playTap();
    return;
  }
  const reqCoins = getSceneRequiredCoins(r.gameType, 'standard');
  if (userProfile.coins < reqCoins) {
    promptInsufficientCoins(r.gameType, 'standard', reqCoins);
    return;
  }
  isPracticeMode.value = false;
  activeRoomId.value = r.id;
  activeGameType.value = r.gameType;
  currentTheme.value = getGameTheme(r.gameType);
  showChatDrawer.value = false;
  currentView.value = 'arena';
  soundFX.playTap();
}

function switchGame(gt: GameType) {
  activeGameType.value = gt;
  currentTheme.value = getGameTheme(gt);
  const match = rooms.value.find((r) => r.gameType === gt);
  if (match) activeRoomId.value = match.id;
  soundFX.playTap();
}

function toggleRotation() {
  isRotated90.value = !isRotated90.value;
  try {
    localStorage.setItem('app_screen_rotated_90', String(isRotated90.value));
  } catch {}
  soundFX.playTap();
}

function toggleFullscreen() {
  soundFX.playTap();
  try {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  } catch {}
}

function notifyPresence(gt: GameType | 'lobby' | '', mode?: string) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(
        JSON.stringify({
          type: 'presence_update',
          gameType: gt || 'lobby',
          sceneMode: mode || '',
          playerId: userProfile.id,
          playerName: userProfile.name,
          avatar: userProfile.avatar,
          coins: userProfile.coins,
          rating: userProfile.rating,
          phone: userProfile.phone,
        })
      );
    } catch {}
  }
}

const GAME_LOCK_KEY = 'app_active_game_lock';

function saveActiveGameLock(roomId: string, gameType: string, sceneMode: string, deal?: any) {
  if (!roomId || !gameType || !sceneMode || isPracticeMode.value) return;
  try {
    const lock = {
      roomId,
      gameType,
      sceneMode,
      playerId: userProfile.id,
      playerName: userProfile.name,
      timestamp: Date.now(),
    };
    localStorage.setItem(GAME_LOCK_KEY, JSON.stringify(lock));
  } catch {}
}

function clearActiveGameLock() {
  try {
    localStorage.removeItem(GAME_LOCK_KEY);
  } catch {}
}

function getActiveGameLock() {
  try {
    const raw = localStorage.getItem(GAME_LOCK_KEY);
    if (!raw) return null;
    const lock = JSON.parse(raw);
    if (lock && lock.roomId && lock.gameType && lock.sceneMode) {
      if (Date.now() - (lock.timestamp || 0) < 2 * 3600 * 1000) {
        return lock;
      }
    }
  } catch {}
  return null;
}

function promptInGameLockAlert() {
  triggerSpeechBubble('🔒 正在联机对局中（对局已锁定），请完成本局对决后再离开！');
  try { soundFX.playPass?.(); } catch {}
}

function returnToLobby(forceExit: boolean | any = false) {
  const isForce = forceExit === true || forceExit === 'true';
  const activeLock = getActiveGameLock();
  if (!isForce && currentView.value === 'arena' && activeLock) {
    const isGameFinished = activeRoom.value?.boardState?.phase === 'ended' || activeRoom.value?.status === 'finished' || activeRoom.value?.status === 'ended' || activeRoom.value?.status === 'waiting';
    if (!isGameFinished) {
      promptInGameLockAlert();
      return;
    }
  }
  if (!isPracticeMode.value && ws && ws.readyState === WebSocket.OPEN && (activeRoomId.value || activeGameType.value)) {
    try {
      ws.send(JSON.stringify({
        type: 'scene_leave',
        roomId: activeRoomId.value,
        gameType: activeGameType.value,
        sceneMode: activeSceneMode.value,
        playerId: userProfile.id || 'P-me',
        playerName: userProfile.name,
      }));
    } catch {}
  }
  clearActiveGameLock();
  currentView.value = 'lobby';
  showChatDrawer.value = false;
  isPracticeMode.value = false;
  hasSelectedScene.value = false;
  activeGameType.value = '';
  activeSceneMode.value = '';
  currentWaitingRoomPlayers.value = [];
  notifyPresence('lobby', '');
  saveLocalProfile(userProfile);
  syncAndCheckProfile();
  soundFX.playTap();
}

function getApiBaseUrl(): string {
  return getRemoteServerUrl();
}

function connectWs() {
  if (ws) {
    try {
      ws.close();
    } catch {}
    ws = null;
  }
  const wsUrl = getWebSocketUrl();
  try {
    ws = new WebSocket(wsUrl);
  } catch (err) {
    console.warn('[WebSocket Init Error]', err);
    return;
  }

  ws.onopen = () => {
    const wasDisconnected = !wsConnected.value;
    wsConnected.value = true;
    httpConnected.value = true;
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    reconnectCountdown.value = 5;
    addPacketLog('OUT', 'WS_HANDSHAKE_INIT');
    sendPing();
    notifyPresence(activeGameType.value || 'lobby', activeSceneMode.value || '');
    if (!isPracticeMode.value && activeRoom.value && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'room_reconnect',
        roomId: activeRoom.value.id,
        playerId: userProfile.id || 'P-me',
        playerName: userProfile.name,
      }));
      addPacketLog('OUT', `RECONNECT_SYNC: ${activeRoom.value.id}`);
    }
    const currentLock = getActiveGameLock();
    const targetRoomId = activeRoomId.value || currentLock?.roomId;
    if (!isPracticeMode.value && targetRoomId && !targetRoomId.startsWith('practice-') && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'scene_reconnect',
        roomId: targetRoomId,
        playerId: userProfile.id || 'P-me',
        playerName: userProfile.name,
      }));
      addPacketLog('OUT', `SCENE_RECONNECT_AUTO: ${targetRoomId}`);
    }
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'pong') {
        wsRtt.value = Math.max(1, Date.now() - (msg.clientTs || Date.now()));
        addPacketLog('IN', `PONG (rtt: ${wsRtt.value}ms)`);
        return;
      }

      addPacketLog('IN', `EV_${msg.type}`);

      if (msg.type === 'lobby_snapshot') {
        rooms.value = msg.rooms || [];
        if (msg.counts) {
          updateRealPresence(msg.counts);
        }
        if (Array.isArray(msg.players)) {
          serverRegisteredPlayers.value = msg.players;
        }
      } else if (msg.type === 'teahouse_players_update') {
        if (Array.isArray(msg.players)) {
          serverRegisteredPlayers.value = msg.players;
        }
      } else if (msg.type === 'presence_counts') {
        if (msg.counts) {
          updateRealPresence(msg.counts);
        }
        if (Array.isArray(msg.players)) {
          serverRegisteredPlayers.value = msg.players;
        }
      } else if (msg.type === 'scene_join_rejected') {
        promptInsufficientCoins(activeGameType.value, activeSceneMode.value, msg.requiredCoins || 100);
        returnToLobby();
      } else if (msg.type === 'scene_reconnect_ack') {
        if (isPracticeMode.value) return;
        if (!msg.failed && msg.room) {
          if (msg.room.id) activeRoomId.value = msg.room.id;
          if (msg.room.gameType) activeGameType.value = msg.room.gameType;
          if (msg.room.sceneMode) {
            activeSceneMode.value = msg.room.sceneMode;
            hasSelectedScene.value = true;
            if (msg.room.gameType === 'yansan') activeYansanScene.value = msg.room.sceneMode as any;
            if (msg.room.gameType === 'shisanshui') activeShisanshuiScene.value = msg.room.sceneMode as any;
            if (msg.room.gameType === 'mahjong') activeMahjongScene.value = msg.room.sceneMode as any;
          }
          currentWaitingRoomPlayers.value = msg.players || msg.room.players || [];
          if (msg.deal) {
            currentRoomDeal.value = msg.deal;
          }
          if (msg.boardState && activeRoom.value) {
            activeRoom.value.boardState = msg.boardState;
          }
          isPracticeMode.value = false;
          saveActiveGameLock(activeRoomId.value, activeGameType.value, activeSceneMode.value, msg.deal);
          if (currentView.value !== 'arena') {
            currentView.value = 'arena';
          }
        } else {
          clearActiveGameLock();
        }
      } else if (msg.type === 'scene_room_update') {
        if (isPracticeMode.value) return;
        if (Array.isArray(msg.players)) {
          const isMyRoom = Boolean(msg.roomId && activeRoomId.value && msg.roomId === activeRoomId.value);
          const isMeInPlayers = msg.players.some((p: any) =>
            (userProfile.id && (p.id === userProfile.id || p.originalId === userProfile.id || (typeof p.id === 'string' && p.id.startsWith(userProfile.id)))) ||
            (myAssignedPlayerId.value && (p.id === myAssignedPlayerId.value || p.originalId === myAssignedPlayerId.value || (typeof p.id === 'string' && p.id.startsWith(myAssignedPlayerId.value)))) ||
            (userProfile.name && p.name === userProfile.name)
          );
          if (!isMyRoom && !isMeInPlayers) return;
          currentWaitingRoomPlayers.value = msg.players;
          if (msg.roomId) activeRoomId.value = msg.roomId;
            if (msg.gameType) activeGameType.value = msg.gameType;
            if (msg.sceneMode) {
              activeSceneMode.value = msg.sceneMode;
              hasSelectedScene.value = true;
              if (msg.gameType === 'yansan') activeYansanScene.value = msg.sceneMode as any;
              if (msg.gameType === 'shisanshui') activeShisanshuiScene.value = msg.sceneMode as any;
              if (msg.gameType === 'mahjong') activeMahjongScene.value = msg.sceneMode as any;
            }
            if (msg.deal) currentRoomDeal.value = msg.deal;

            const matchedSelf = (msg.players || []).find((p: any) =>
              (userProfile.id && (p.id === userProfile.id || p.originalId === userProfile.id || (typeof p.id === 'string' && p.id.startsWith(userProfile.id)))) ||
              (myAssignedPlayerId.value && (p.id === myAssignedPlayerId.value || p.originalId === myAssignedPlayerId.value || (typeof p.id === 'string' && p.id.startsWith(myAssignedPlayerId.value))))
            );
            if (matchedSelf) {
              myAssignedPlayerId.value = matchedSelf.id;
              if (typeof matchedSelf.seat === 'number') {
                myAssignedSeat.value = matchedSelf.seat;
              }
            }

            const targetGame = msg.gameType || activeGameType.value;
            const targetMode = msg.sceneMode || activeSceneMode.value;
            const maxP = msg.maxPlayers || ((targetGame === 'shisanshui' && targetMode?.includes('eight')) ? 8 : 4);

            if (msg.players.length >= maxP) {
              currentTheme.value = getGameTheme(activeGameType.value);
              saveActiveGameLock(activeRoomId.value, activeGameType.value, activeSceneMode.value, msg.deal);
              if (msg.roomId) {
                const matchRoom = rooms.value.find((r) => r.id === msg.roomId);
                if (!matchRoom) {
                  rooms.value.unshift({
                    id: msg.roomId,
                    title: `${getSceneDisplayName(activeGameType.value, activeSceneMode.value)} · 纯真人争霸局`,
                    gameType: activeGameType.value,
                    status: msg.status || 'playing',
                    players: msg.players || [],
                    spectators: 0,
                    turnSeat: msg.deal?.starterSeat ?? 0,
                    moveCount: 0,
                    deal: msg.deal,
                    modeLabel: `${getSceneDisplayName(activeGameType.value, activeSceneMode.value)} · 实时对决`,
                    chat: [],
                    boardState: msg.boardState || null,
                  } as any);
                } else {
                  matchRoom.status = msg.status || 'playing';
                  if (msg.deal) matchRoom.deal = msg.deal;
                  if (msg.players) matchRoom.players = msg.players;
                }
              }
              if (currentView.value !== 'arena') {
                currentView.value = 'arena';
                soundFX.playVictory?.();
              }
            }
          }
      } else if (msg.type === 'scene_join_ack') {
        if (msg.roomId) activeRoomId.value = msg.roomId;
        if (msg.gameType) activeGameType.value = msg.gameType;
        if (msg.sceneMode) activeSceneMode.value = msg.sceneMode;
        if (msg.assignedPlayerId) myAssignedPlayerId.value = msg.assignedPlayerId;
        if (msg.assignedSeat !== undefined) myAssignedSeat.value = msg.assignedSeat;
        if (Array.isArray(msg.players)) currentWaitingRoomPlayers.value = msg.players;
        if (msg.deal) currentRoomDeal.value = msg.deal;

        const matchedAckSelf = (msg.players || []).find((p: any) =>
          (userProfile.id && (p.id === userProfile.id || p.originalId === userProfile.id || (typeof p.id === 'string' && p.id.startsWith(userProfile.id)))) ||
          (myAssignedPlayerId.value && (p.id === myAssignedPlayerId.value || p.originalId === myAssignedPlayerId.value || (typeof p.id === 'string' && p.id.startsWith(myAssignedPlayerId.value))))
        );
        if (matchedAckSelf) {
          myAssignedPlayerId.value = matchedAckSelf.id;
          if (typeof matchedAckSelf.seat === 'number') {
            myAssignedSeat.value = matchedAckSelf.seat;
          }
        }

        const targetGame = msg.gameType || activeGameType.value;
        const targetMode = msg.sceneMode || activeSceneMode.value;
        const maxP = msg.maxPlayers || ((targetGame === 'shisanshui' && targetMode?.includes('eight')) ? 8 : 4);
        if (Array.isArray(msg.players) && msg.players.length >= maxP) {
          currentTheme.value = getGameTheme(activeGameType.value);
          saveActiveGameLock(activeRoomId.value, activeGameType.value, activeSceneMode.value, msg.deal);
          if (currentView.value !== 'arena') {
            currentView.value = 'arena';
            soundFX.playVictory?.();
          }
        }
      } else if (msg.type === 'scene_room_full' || msg.type === 'scene_room_started') {
        if (isPracticeMode.value) return;
        const playersArr = msg.players || [];
        const isMyRoom = Boolean(msg.roomId && activeRoomId.value && msg.roomId === activeRoomId.value);
        const isMeInPlayers = Array.isArray(playersArr) && playersArr.some((p: any) =>
          (userProfile.id && (p.id === userProfile.id || p.originalId === userProfile.id || (typeof p.id === 'string' && (p.id.startsWith(userProfile.id) || userProfile.id.startsWith(p.id))))) ||
          (myAssignedPlayerId.value && (p.id === myAssignedPlayerId.value || p.originalId === myAssignedPlayerId.value || (typeof p.id === 'string' && (p.id.startsWith(myAssignedPlayerId.value) || myAssignedPlayerId.value.startsWith(p.id))))) ||
          (userProfile.name && (p.name === userProfile.name || (p as any).originalName === userProfile.name || (typeof p.name === 'string' && (p.name.startsWith(userProfile.name) || userProfile.name.startsWith(p.name)))))
        );
        const isMatchingScene = Boolean(msg.gameType === activeGameType.value && msg.sceneMode === activeSceneMode.value);
        if (!isMyRoom && !isMeInPlayers && (!isMatchingScene || activeRoomId.value)) return;

        if (msg.roomId) activeRoomId.value = msg.roomId;
        if (msg.gameType) activeGameType.value = msg.gameType;
        if (msg.sceneMode) {
          activeSceneMode.value = msg.sceneMode;
          hasSelectedScene.value = true;
          if (msg.gameType === 'yansan') activeYansanScene.value = msg.sceneMode as any;
          if (msg.gameType === 'shisanshui') activeShisanshuiScene.value = msg.sceneMode as any;
          if (msg.gameType === 'mahjong') activeMahjongScene.value = msg.sceneMode as any;
        }
        if (msg.players && Array.isArray(msg.players)) currentWaitingRoomPlayers.value = msg.players;
        if (msg.deal) currentRoomDeal.value = msg.deal;

        const matchedRoomSelf = (msg.players || []).find((p: any) =>
          (userProfile.id && (p.id === userProfile.id || p.originalId === userProfile.id || (typeof p.id === 'string' && (p.id.startsWith(userProfile.id) || userProfile.id.startsWith(p.id))))) ||
          (myAssignedPlayerId.value && (p.id === myAssignedPlayerId.value || p.originalId === myAssignedPlayerId.value || (typeof p.id === 'string' && (p.id.startsWith(myAssignedPlayerId.value) || myAssignedPlayerId.value.startsWith(p.id))))) ||
          (userProfile.name && (p.name === userProfile.name || (p as any).originalName === userProfile.name || (typeof p.name === 'string' && (p.name.startsWith(userProfile.name) || userProfile.name.startsWith(p.name)))))
        );
        if (matchedRoomSelf) {
          myAssignedPlayerId.value = matchedRoomSelf.id;
          if (typeof matchedRoomSelf.seat === 'number') {
            myAssignedSeat.value = matchedRoomSelf.seat;
          }
        }

          hasSelectedScene.value = true;
          isPracticeMode.value = false;
          currentTheme.value = getGameTheme(activeGameType.value);
          saveActiveGameLock(activeRoomId.value, activeGameType.value, activeSceneMode.value, msg.deal);

          // 注册或更新本地 rooms 数组，确保 activeRoom 计算属性指向正确的联机房间
          if (msg.roomId) {
            const matchRoom = rooms.value.find((r) => r.id === msg.roomId);
            if (!matchRoom) {
              rooms.value.unshift({
                id: msg.roomId,
                title: `${getSceneDisplayName(activeGameType.value, activeSceneMode.value)} · 纯真人争霸局`,
                gameType: activeGameType.value,
                status: msg.status || 'playing',
                players: msg.players || [],
                spectators: 0,
                turnSeat: msg.deal?.starterSeat ?? 0,
                moveCount: 0,
                deal: msg.deal,
                modeLabel: `${getSceneDisplayName(activeGameType.value, activeSceneMode.value)} · 实时对决`,
                chat: [],
                boardState: msg.boardState || null,
              } as any);
            } else {
              matchRoom.status = msg.status || 'playing';
              if (msg.deal) matchRoom.deal = msg.deal;
              if (msg.players) matchRoom.players = msg.players;
            }
          }

          if (currentView.value !== 'arena') {
            currentView.value = 'arena';
            soundFX.playVictory?.();
          }
      } else if (msg.type === 'game_deal') {
        if (msg.deal) currentRoomDeal.value = msg.deal;
      } else if (msg.type === 'room_created') {
        rooms.value = msg.rooms || [];
        activeRoomId.value = msg.room.id;
        activeGameType.value = msg.room.gameType;
        currentTheme.value = getGameTheme(msg.room.gameType);
      } else if (msg.type === 'reconnect_ack') {
        if (msg.room) {
          const idx = rooms.value.findIndex((r) => r.id === msg.room.id);
          if (idx !== -1) {
            rooms.value[idx] = msg.room;
          } else {
            rooms.value.push(msg.room);
          }
          if (msg.boardState && activeRoom.value) {
            activeRoom.value.boardState = msg.boardState;
          }
        }
      } else if (msg.type === 'game_event') {
        if (msg.boardState && activeRoom.value && activeRoom.value.id === msg.roomId) {
          activeRoom.value.boardState = msg.boardState;
        }
      } else if (msg.type === 'chat_broadcast') {
        if (activeRoom.value) {
          activeRoom.value.chat.push(msg.message);
        }
        const isMyOwnVoice = (msg.message?.senderId && msg.message.senderId === userProfile.id) ||
                             (msg.message?.sender && msg.message.sender === userProfile.name);
        if (msg.message.audio) {
          // 发送者本人无需二次播放自己录制的语音，仅牌桌内其他牌友收听
          if (!isMyOwnVoice) {
            playVoiceBroadcast(msg.message.audio, msg.message.sender, msg.message.duration || 1);
          }
        } else if (msg.message.voice && msg.message.text) {
          if (!isMyOwnVoice) {
            soundFX.speakVoice(msg.message.text);
          }
        }
        if (msg.message.text) {
          recentVoicedHistory.unshift({
            id: `vh-${Date.now()}-${Math.random()}`,
            text: msg.message.text,
            sender: msg.message.sender || '牌友',
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            isSelf: isMyOwnVoice,
          });
          if (recentVoicedHistory.length > 40) recentVoicedHistory.pop();
        }
        addDanmaku(msg.message.sender, msg.message.avatar || '👤', msg.message.text, msg.message.prop);
        triggerSpeechBubble(`${msg.message.sender}: ${msg.message.text}`);
      } else if (msg.type === 'user_coins_updated') {
        const cleanUserPhone = String(userProfile.phone || '').trim().replace(/\D/g, '');
        const cleanMsgPhone = String(msg.phone || '').trim().replace(/\D/g, '');
        const isMatch = (msg.userId && msg.userId === userProfile.id) ||
                        (cleanUserPhone && cleanMsgPhone && cleanUserPhone === cleanMsgPhone) ||
                        (msg.username && msg.username === userProfile.username);
        if (isMatch) {
          const delta = typeof msg.delta === 'number' ? msg.delta : (msg.coins - userProfile.coins);
          userProfile.coins = msg.coins;
          if (msg.rating) userProfile.rating = msg.rating;
          if (msg.level) userProfile.level = msg.level;
          saveLocalProfile(userProfile);
          recordPointsTx(
            delta >= 0 ? 'admin_grant' : 'admin_deduct',
            `钱庄系统/Bot筹码调配 (${delta >= 0 ? '+' : ''}${delta})`,
            delta,
            userProfile.coins
          );
          soundFX.playCoinShower();
          triggerSpeechBubble(`🪙 钱庄筹码已更新为 ${msg.coins.toLocaleString()} 分 (${delta >= 0 ? '+' : ''}${delta})`);
        }
      } else if (msg.type === 'all_users_coins_updated') {
        fetchFreshProfile();
        soundFX.playCoinShower();
      }
    } catch {}
  };

  ws.onclose = () => {
    wsConnected.value = false;
    addPacketLog('IN', 'WS_DISCONNECTED');
    startReconnectCountdown();
  };
}

function sendPing() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping', clientTs: Date.now() }));
    addPacketLog('OUT', 'PING');
  }
}

function addDanmaku(sender: string, avatar: string, text: string, prop?: string) {
  if (!danmakuEnabled.value) return;
  const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#A855F7', '#F97316'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const top = Math.floor(12 + Math.random() * 68);
  const duration = 6.5 + Math.random() * 4;
  const dm = {
    id: `dm-${Date.now()}-${Math.random()}`,
    sender,
    avatar: avatar || '🏮',
    text,
    prop,
    color,
    top,
    duration,
  };
  danmakuItems.push(dm);
  setTimeout(() => {
    const idx = danmakuItems.findIndex((d) => d.id === dm.id);
    if (idx !== -1) danmakuItems.splice(idx, 1);
  }, duration * 1000 + 400);
}

function triggerFloatingProp(sender: string, icon: string) {
  const id = `${Date.now()}-${Math.random()}`;
  const x = Math.floor(20 + Math.random() * 55);
  const y = Math.floor(25 + Math.random() * 40);
  floatingProps.push({ id, sender, icon, x, y });
  setTimeout(() => {
    const idx = floatingProps.findIndex((p) => p.id === id);
    if (idx !== -1) floatingProps.splice(idx, 1);
  }, 2600);
}

function triggerSpeechBubble(text: string) {
  activeSpeechBubble.value = text;
  if (speechTimer) clearTimeout(speechTimer);
  speechTimer = setTimeout(() => {
    activeSpeechBubble.value = '';
  }, 3500);
}

function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  sendQuickPhrase(text);
  chatInput.value = '';
}

function previewPhraseVoice(phrase: string) {
  soundFX.playTap();
  soundFX.speakVoice(phrase);
}

function sendCustomVoicePhrase() {
  const text = customVoiceInput.value.trim();
  if (!text) return;
  sendQuickPhrase(text);
  customVoiceInput.value = '';
}

function sendQuickBarChat() {
  const text = quickBarInput.value.trim();
  if (!text) return;
  sendQuickPhrase(text);
  quickBarInput.value = '';
}

function sendQuickPhrase(phrase: string) {
  if (!phrase || !phrase.trim()) return;
  const cleanText = phrase.trim();

  // 记录到本地对白实录
  recentVoicedHistory.unshift({
    id: `vh-${Date.now()}-${Math.random()}`,
    text: cleanText,
    sender: userProfile.name,
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isSelf: true,
  });
  if (recentVoicedHistory.length > 40) recentVoicedHistory.pop();

  // 若处于联机房间，向房间内所有牌友广播台词语音与弹幕
  if (activeRoom.value && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'game_chat',
      roomId: activeRoom.value.id,
      sender: userProfile.name,
      avatar: userProfile.avatar,
      text: cleanText,
      voice: true,
    }));
    addPacketLog('OUT', `VOICE: ${cleanText.slice(0, 10)}`);
  }

  // 本地即时发音、飞屏弹幕与桌面气泡
  soundFX.speakVoice(cleanText);
  addDanmaku(userProfile.name, userProfile.avatar, cleanText);
  triggerSpeechBubble(`${userProfile.name}: ${cleanText}`);
  soundFX.playTap();
}

function sendCategorizedPhrase(phrase: string) {
  sendQuickPhrase(phrase);
}

// Table Top Banner Voice Recording & Broadcast Engine
// ==========================================
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
    // 开始录音时立即暂停出牌语音播报，避免出牌语音被录音麦克风录入产生杂音
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
      micErrorTip.value = '麦克风权限未开启，请在系统设置允许录音权限';
      triggerSpeechBubble('⚠️ 麦克风权限已被拒绝，请在手机系统应用管理中开启录音权限');
    } else {
      micErrorTip.value = '麦克风启动失败，请检查录音设置';
      triggerSpeechBubble('⚠️ 麦克风无法访问：' + (errorMsg.slice(0, 35) || '请检查录音权限'));
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
  // 录音结束，恢复出牌语音播报
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
  triggerSpeechBubble('已取消本次录音');
  soundFX.playTap();
}

function sendVoiceBroadcastMessage(audioDataUrl: string, duration: number) {
  const roomId = activeRoomId.value || 'RM-202';
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'game_chat',
        roomId,
        sender: userProfile.name || '牌友',
        senderId: userProfile.id,
        avatar: userProfile.avatar || '👤',
        text: `🎤 [牌桌实时语音 ${duration}s]`,
        voice: true,
        audio: audioDataUrl,
        duration,
      })
    );
    addPacketLog('OUT', `VOICE_MSG: ${duration}s`);
  } else {
    playVoiceBroadcast(audioDataUrl, userProfile.name || '我', duration);
  }
}

function playVoiceBroadcast(audioUrl: string, sender: string, duration = 2) {
  try {
    if (activePlayingAudio) {
      try {
        activePlayingAudio.pause();
      } catch {}
      activePlayingAudio = null;
    }
    // 播放其他玩家语音时，立即暂停出牌语音播报，确保玩家能听清语音消息
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

function createRoomSubmit() {
  if (!userProfile.isLoggedIn) {
    showAuthModal.value = true;
    soundFX.playTap();
    return;
  }
  const reqCoins = getSceneRequiredCoins(newRoomGame.value, 'standard');
  if (userProfile.coins < reqCoins) {
    showCreateModal.value = false;
    promptInsufficientCoins(newRoomGame.value, 'standard', reqCoins);
    return;
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'room_create',
      title: newRoomTitle.value.trim() || `${userProfile.name}的雅座`,
      gameType: newRoomGame.value,
      playerName: userProfile.name,
    }));
    addPacketLog('OUT', `ROOM_CREATE: ${newRoomGame.value}`);
  }
  activeGameType.value = newRoomGame.value;
  currentTheme.value = getGameTheme(newRoomGame.value);
  showCreateModal.value = false;
  newRoomTitle.value = '';
  currentView.value = 'arena';
}

let lastSettledMatchKey = '';
let lastSettledMatchTime = 0;

function onGameMove(payload: any) {
  const currentRoomIdVal = activeRoomId.value || activeRoom.value?.id;

  // 1. 严格过滤非本家出牌广播与内部防回环：避免其他客户端或内部动画回调将远端事件反向广播回 WebSocket 导致死循环
  const myUserSeat = currentWaitingRoomPlayers.value.findIndex(
    (p) => (userProfile.id && p.id === userProfile.id) || (userProfile.name && p.name === userProfile.name)
  );
  const selfSeat = myUserSeat >= 0 ? myUserSeat : 0;

  // 若该动作为远端动作、已跳过标记、或席位与当前客户端自身席位不一致，坚决不向服务器回传
  const isSelfMove = typeof payload?.seat !== 'number' || payload.seat === selfSeat;
  const shouldSkipWs = payload?.isRemote || payload?.skipWs || !isSelfMove;

  // 烟三与麻将游戏自身在出牌/碰杠/摸牌时已直接通过 props.ws 发送走子报文，此处若为中间走子(winner为null)则无需二次补发
  const isDirectMidMove = (activeGameType.value === 'yansan' || activeGameType.value === 'mahjong') && (payload?.winner === null || payload?.winner === undefined);

  if (!shouldSkipWs && !isDirectMidMove && ws && ws.readyState === WebSocket.OPEN && currentRoomIdVal) {
    ws.send(JSON.stringify({
      type: 'game_move',
      roomId: currentRoomIdVal,
      seat: selfSeat,
      payload: {
        ...payload,
        seat: selfSeat,
      },
      event: {
        ...payload,
        seat: selfSeat,
      }
    }));
    addPacketLog('OUT', `MOVE: seat ${selfSeat}`);
  }

  // Handle outcome
  if (payload && payload.winner !== undefined && payload.winner !== null) {
    const roundKey = `${activeGameType.value}_${currentRoomIdVal || 'local'}_${payload.finishedSeats?.join('-') || payload.winner}_${payload.allianceScoreResult?.summary || payload.rewardCoins || ''}`;
    const now = Date.now();
    if (lastSettledMatchKey === roundKey && now - lastSettledMatchTime < 3500) {
      console.warn('🛡️ [全局对局结算防重] 3.5秒内已处理过本局结算，防止重复结算与多次扣减积分');
      return;
    }
    lastSettledMatchKey = roundKey;
    lastSettledMatchTime = now;

    const { isWin, isTie, scorePoints, coinsDelta, ratingDelta, detailText, replayData } =
      calculateGameSettlement(activeGameType.value, payload);

    // 专属输赢分语音播报（仅玩家本地设备能够听到，试玩演练模式也播报给玩家提供完整局内反馈）
    soundFX.speakScoreResult(scorePoints, isWin, isTie);

    // 【单机试玩模拟对局结算】：人机试玩模式仅模拟真实场景供玩家演练推演，坚决不写入玩家的真实积分与钱庄筹码资产
    if (isPracticeMode.value) {
      try {
        const practiceRec: MatchRecord = {
          id: `practice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          gameType: activeGameType.value,
          gameName: `${getGameName(activeGameType.value)} (单机试玩)`,
          result: isWin ? 'win' : (isTie ? 'draw' : 'lose'),
          coinsDelta,
          ratingDelta,
          details: `${detailText} [人机试玩模拟]`,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          updatedAt: Date.now(),
        };
        saveOfflinePracticeRecord(practiceRec);
      } catch {}

      console.info('[人机试玩模式] 对局结束，模拟结算已完成（按规则不写入玩家真实积分）：', {
        simulatedCoinsDelta: coinsDelta,
        scorePoints,
        gameType: activeGameType.value,
      });
      return;
    }

    userProfile.coins = Math.max(0, userProfile.coins + coinsDelta);
    userProfile.rating = Math.max(1000, userProfile.rating + ratingDelta);
    userProfile.level = Math.max(1, Math.min(10, Math.floor(userProfile.rating / 500)));

    if (!userProfile.stats[activeGameType.value]) {
      userProfile.stats[activeGameType.value] = { played: 0, won: 0, highestScore: 0 };
    }
    const stat = userProfile.stats[activeGameType.value]!;
    stat.played += 1;
    if (isWin) {
      stat.won += 1;
      stat.highestScore = Math.max(stat.highestScore, Math.abs(coinsDelta));
    }

    recordPointsTx(
      coinsDelta >= 0 ? 'game_win' : 'game_loss',
      `${getGameName(activeGameType.value)}对局结算`,
      coinsDelta,
      userProfile.coins,
      userProfile.phone || userProfile.id
    );

    const rec: MatchRecord = {
      id: `REC-${Date.now()}`,
      gameType: activeGameType.value,
      gameName: getGameName(activeGameType.value),
      result: isWin ? 'win' : (isTie ? 'draw' : 'lose'),
      coinsDelta,
      ratingDelta,
      details: detailText,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      replayData,
    };

    matchRecords.unshift(rec);
    if (matchRecords.length > 50) matchRecords.pop();
    if (activeRoom.value) {
      activeRoom.value.status = 'finished';
      if (activeRoom.value.boardState) {
        activeRoom.value.boardState.phase = 'ended';
      }
    }
    saveLocalProfile(userProfile);
    saveLocalRecords(matchRecords, userProfile.phone || userProfile.id);
    syncAndCheckProfile();
  }
}

async function syncAndCheckProfile() {
  const res = await syncWithServer(userProfile, matchRecords);
  if (res && res.notFound) {
    const guest = resetToDefaultGuestProfile();
    Object.assign(userProfile, guest);
    showAuthModal.value = true;
  }
}

async function fetchFreshProfile() {
  if (userProfile.isLoggedIn && userProfile.id && userProfile.sessionToken) {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/auth/check-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userProfile.id, sessionToken: userProfile.sessionToken }),
      });
      if (res.ok) {
        httpConnected.value = true;
      }
      const data = await res.json();
      if (data.success && data.sessionExpired) {
        const guest = resetToDefaultGuestProfile();
        Object.assign(userProfile, guest);
        showAuthModal.value = true;
        soundFX.playTap();
      } else if (data.success && typeof data.coins === 'number' && data.coins !== userProfile.coins) {
        const diff = data.coins - userProfile.coins;
        userProfile.coins = data.coins;
        if (data.rating) userProfile.rating = data.rating;
        if (data.level) userProfile.level = data.level;
        saveLocalProfile(userProfile);
        recordPointsTx(
          diff >= 0 ? 'admin_grant' : 'admin_deduct',
          `钱庄同步筹码 (${diff >= 0 ? '+' : ''}${diff})`,
          diff,
          userProfile.coins,
          userProfile.phone || userProfile.id
        );
      }
    } catch {}
  }
}

function openPointsModal() {
  showPointsModal.value = true;
  soundFX.playTap();
  fetchFreshProfile();
}

function onGameRestart() {
  soundFX.playTap();
  if (isPracticeMode.value) {
    // 试玩/人机模式：各端组件已在本地独立重开并现场洗牌，严禁向联机 WebSocket 服务端发送重开房间信令
    return;
  }
  if (ws && ws.readyState === WebSocket.OPEN && activeRoomId.value) {
    try {
      ws.send(JSON.stringify({
        type: 'room_restart',
        roomId: activeRoomId.value,
        gameType: activeGameType.value,
        sceneMode: activeSceneMode.value,
        playerId: userProfile.id || 'P-me',
        playerName: userProfile.name,
      }));
    } catch {}
  }
}

function onUpdateProfile(p: UserProfile) {
  Object.assign(userProfile, p);
  saveLocalProfile(userProfile);
  const freshRecords = loadLocalRecords(userProfile.phone || userProfile.id);
  matchRecords.splice(0, matchRecords.length, ...freshRecords);
  syncAndCheckProfile();
}

function onUpdateRecords(r: MatchRecord[]) {
  matchRecords.splice(0, matchRecords.length, ...r);
  saveLocalRecords(matchRecords, userProfile.phone || userProfile.id);
  syncAndCheckProfile();
}

function onClaimAchievement(reward: number) {
  userProfile.coins += reward;
  recordPointsTx('admin_grant', '雀神成就奖励领取', reward, userProfile.coins, userProfile.phone || userProfile.id);
  saveLocalProfile(userProfile);
  syncAndCheckProfile();
}

function onThemeChange(th: TableTheme) {
  currentTheme.value = th;
  soundFX.playTap();
}

function toggleSound() {
  soundOn.value = !soundOn.value;
  soundFX.enabled = soundOn.value;
  if (soundOn.value) soundFX.playTap();
}

function onVisibilityChange() {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectWs();
    } else {
      triggerSmoothReconnectBadge();
      if (activeRoom.value) {
        ws.send(JSON.stringify({
          type: 'room_reconnect',
          roomId: activeRoom.value.id,
          playerId: userProfile.id || 'P-me',
          playerName: userProfile.name,
        }));
        addPacketLog('OUT', `WAKE_SYNC: ${activeRoom.value.id}`);
      }
      if ((currentView.value === 'waiting-room' || currentView.value === 'arena') && activeRoomId.value) {
        ws.send(JSON.stringify({
          type: 'scene_reconnect',
          roomId: activeRoomId.value,
          playerId: userProfile.id || 'P-me',
          playerName: userProfile.name,
        }));
        addPacketLog('OUT', `WAKE_SCENE_RECONNECT: ${activeRoomId.value}`);
      }
    }
  }
}

onMounted(() => {
  // 校验是否存在对局锁定 (防止刷页面脱离牌局)
  const existingLock = getActiveGameLock();
  if (existingLock) {
    activeRoomId.value = existingLock.roomId;
    activeGameType.value = existingLock.gameType;
    activeSceneMode.value = existingLock.sceneMode;
    hasSelectedScene.value = true;
    isPracticeMode.value = false;
    if (existingLock.gameType === 'yansan') activeYansanScene.value = existingLock.sceneMode as any;
    if (existingLock.gameType === 'shisanshui') activeShisanshuiScene.value = existingLock.sceneMode as any;
    if (existingLock.gameType === 'mahjong') activeMahjongScene.value = existingLock.sceneMode as any;
    currentTheme.value = getGameTheme(existingLock.gameType);
    currentView.value = 'arena';
    console.log('🔒 [对局锁定恢复] 页面刷新重载，自动强行回到进行中的对局！', existingLock);
  }

  try {
    const savedRot = localStorage.getItem('app_screen_rotated_90');
    if (savedRot !== null) {
      isRotated90.value = savedRot === 'true';
    } else {
      isRotated90.value = true; // 默认横屏对战
    }
    if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
      (window.screen.orientation as any).lock?.('landscape').catch(() => {});
    }
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const autoGame = urlParams.get('auto_game') as GameType | null;
      const autoScene = urlParams.get('auto_scene');
      if (autoGame && autoScene) {
        activeGameType.value = autoGame;
        activeSceneMode.value = autoScene;
        if (autoGame === 'mahjong') activeMahjongScene.value = autoScene as any;
        if (autoGame === 'shisanshui') activeShisanshuiScene.value = autoScene as any;
        if (autoGame === 'yansan') activeYansanScene.value = autoScene as any;
        currentTheme.value = getGameTheme(autoGame);
        currentWaitingRoomPlayers.value = [];
        currentView.value = 'waiting-room';
      }
    }
  } catch {}
  connectWs();
  pingInterval = setInterval(sendPing, 5000);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { isOnline.value = true; connectWs(); });
    window.addEventListener('offline', () => { isOnline.value = false; });
  }

  // Immediate check & balance refresh on initial mount
  fetchFreshProfile();
  sessionCheckInterval = setInterval(fetchFreshProfile, 20000);
});

onBeforeUnmount(() => {
  if (pingInterval) clearInterval(pingInterval);
  if (sessionCheckInterval) clearInterval(sessionCheckInterval);
  if (speechTimer) clearTimeout(speechTimer);
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }
  ws?.close();
});
</script>

<style scoped>
/* Rotated 90-degree Master Landscape Container (全界面包括大厅与游戏舞台旋转90度横屏) */
.rules-modal-rotated-full {
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

.rules-modal-standard-full {
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

.app-rotated-90 {
  position: fixed;
  top: 0;
  left: 0;
  width: 100dvh;
  height: 100dvw;
  transform-origin: 0 0;
  transform: rotate(90deg) translateY(-100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 10;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.app-standard {
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.game-compact-card {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.game-compact-card:hover {
  transform: translateY(-4px);
}

@keyframes slideLeft {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-left {
  animation: slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes danmakuSlide {
  0% {
    transform: translateX(100vw);
  }
  100% {
    transform: translateX(-150%);
  }
}

.danmaku-item {
  animation-name: danmakuSlide;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes bounceOnce {
  0% {
    transform: translateY(-20px) scale(0.9);
    opacity: 0;
  }
  60% {
    transform: translateY(4px) scale(1.02);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.animate-bounce-once {
  animation: bounceOnce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

/* Scrollbar styling for Teahouse Dialogue Library */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(180, 83, 9, 0.4);
  border-radius: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(245, 158, 11, 0.6);
}
</style>
