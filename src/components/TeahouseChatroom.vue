<template>
  <div
    class="relative w-full h-full flex flex-col justify-between select-none overflow-hidden bg-[#EFE5D3] text-[#3C2C1E]"
    style="background: radial-gradient(ellipse at 50% 45%, #FAF4E8 0%, #EFE5D3 60%, #D8C7B0 100%);"
  >
    <!-- Background Ambient Pattern Overlay -->
    <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,220,150,0.20)_0%,rgba(0,0,0,0.06)_80%)] z-1"></div>

    <!-- ======================================================== -->
    <!-- TOP HEADER BAR                                           -->
    <!-- ======================================================== -->
    <header class="relative z-30 w-full px-3 sm:px-6 py-2 flex items-center justify-between border-b border-[#D8C7B0] bg-[#FAF4E8]/95 backdrop-blur-md shrink-0 shadow-xs">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <!-- Return / Leave Button -->
        <button
          type="button"
          @click="$emit('leave')"
          class="px-3 py-1.5 rounded-xl bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#3C2C1E] text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer border border-[#D8C7B0] shadow-xs shrink-0"
          title="返回游戏大厅"
        >
          <span>🏠</span>
          <span class="hidden sm:inline">返回大厅</span>
        </button>

        <!-- Current Active Scene Selection Badge & Quick Switch Button -->
        <!-- 1. Player has NOT joined any game scene (大堂闲聊/等待应战) -->
        <div v-if="!hasJoinedScene" class="flex items-center gap-2 pl-1 border-l border-[#D8C7B0] min-w-0">
          <div
            @click="showSceneSwitchModal = true"
            class="flex items-center gap-2 px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-300/90 shadow-xs cursor-pointer hover:border-amber-500 hover:shadow-sm transition-all min-w-0 group"
            title="点击选择游戏分场选台入座"
          >
            <span class="text-base sm:text-lg shrink-0">🍵</span>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] sm:text-xs font-serif text-[#78350F] font-bold whitespace-nowrap">大堂闲坐 ·</span>
                <h2 class="text-xs sm:text-sm font-black text-[#451A03] font-serif-title truncate bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-400/50">
                  当前未加入任何游戏
                </h2>
                <span class="hidden md:inline-flex px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-serif font-bold bg-amber-200/70 text-amber-900 border border-amber-300 whitespace-nowrap">
                  闲聊观局中
                </span>
              </div>
              <p class="text-[9px] sm:text-[10px] text-amber-800 font-serif font-bold truncate mt-0.5">
                💡 提醒：请加入游戏或等待接受应战
              </p>
            </div>
          </div>

          <!-- Select Game Scene Button -->
          <button
            type="button"
            @click="showSceneSwitchModal = true"
            class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-amber-50 text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer border border-amber-400 shadow-md whitespace-nowrap shrink-0 animate-pulse"
            title="选择游戏玩法与分场选台入局"
          >
            <span>🎯</span>
            <span>选择分场</span>
          </button>
        </div>

        <!-- 2. Player HAS joined a game scene (已加入指定分场) -->
        <div v-else class="flex items-center gap-2 pl-1 border-l border-[#D8C7B0] min-w-0">
          <div
            @click="showSceneSwitchModal = true"
            class="flex items-center gap-2 px-3 py-1 sm:py-1.5 rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] shadow-xs cursor-pointer hover:border-amber-600 transition-all min-w-0"
            title="点击切换其他玩法分场"
          >
            <span class="text-base sm:text-lg animate-pulse shrink-0">{{ activeGameIcon }}</span>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] sm:text-xs font-serif text-[#6B5744] whitespace-nowrap">您已加入</span>
                <h2 class="text-xs sm:text-sm font-black text-[#2A1E14] font-serif-title truncate bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                  {{ activeSceneDisplayName }}
                </h2>
                <span
                  class="px-2 py-0.2 rounded-full text-[9px] sm:text-[10px] font-mono font-bold border whitespace-nowrap"
                  :class="activeTableCount >= currentSceneMax ? 'bg-amber-500/20 text-amber-900 border-amber-400/50' : 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40'"
                >
                  👥 牌桌: {{ activeTableCount }} / {{ currentSceneMax }} 人在座
                </span>
              </div>
              <p class="text-[9px] sm:text-[10px] text-amber-900/90 font-serif font-bold truncate mt-0.5">
                ⏳ 等待其他玩家加入自动进入牌桌 · 本场共 {{ activeSceneCount }} 人在线
              </p>
            </div>
          </div>

          <!-- Change Scene & Leave Seat Buttons -->
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              @click="showSceneSwitchModal = true"
              class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] text-xs font-black transition-all flex items-center gap-1 active:scale-95 cursor-pointer border border-[#7D6049] shadow-xs whitespace-nowrap shrink-0"
              title="点击切换其他玩法分场"
            >
              <span>🔄</span>
              <span>换场</span>
            </button>
            <button
              type="button"
              @click="quickEnterScene('', '')"
              class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-800 to-rose-900 hover:from-red-700 hover:to-rose-800 text-red-100 text-xs font-black transition-all flex items-center gap-1 active:scale-95 cursor-pointer border border-red-500/80 shadow-xs whitespace-nowrap shrink-0 animate-pulse"
              title="点击离座退出当前游戏分场"
            >
              <span>🚪</span>
              <span>退出座位</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Settings & Connection Status -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Mic Permission / Error Prompt Popover -->
        <div
          v-if="micErrorTip"
          class="relative px-3 py-1.5 rounded-xl bg-red-950 border border-red-400 text-red-200 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap animate-bounce"
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

        <!-- Connection status -->
        <div class="hidden sm:flex px-2.5 py-1 rounded-xl bg-[#FAF4E8] border border-[#D8C7B0] text-[10px] sm:text-xs font-mono text-[#5C4533] items-center gap-1.5 shrink-0 shadow-xs">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="font-bold">🟢 牌楼连线</span>
        </div>
      </div>
    </header>

    <!-- ======================================================== -->
    <!-- MAIN CHATROOM BODY: CHAT STREAM + CARD FRIENDS ROSTER     -->
    <!-- ======================================================== -->
    <main class="relative z-10 flex-1 w-full max-w-[1360px] mx-auto p-2 sm:p-3 flex gap-3 min-h-0 overflow-hidden">
      
      <!-- Left / Center Column: Real-Time Chat Stream & Bottom Dock -->
      <div class="flex-1 flex flex-col justify-between bg-[#FAF4E8] rounded-2xl sm:rounded-3xl border border-[#D8C7B0] shadow-md p-2.5 sm:p-3 min-h-0 overflow-hidden">
        


        <!-- Voice Broadcast Playing Banner -->
        <div
          v-if="activePlayingVoice"
          class="mb-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 border border-emerald-400 text-amber-300 text-xs font-bold flex items-center justify-between shadow-md animate-pulse shrink-0"
        >
          <div class="flex items-center gap-2 truncate">
            <span class="text-emerald-400 animate-bounce">🔊</span>
            <span class="font-black text-amber-300 font-serif-title">{{ activePlayingVoice.sender }}</span>
            <span class="text-stone-300 font-normal">正在播放语音广播 ({{ activePlayingVoice.duration }}s)</span>
          </div>
          <div class="flex items-center gap-1 h-3 shrink-0">
            <span class="w-1 bg-emerald-400 rounded-full h-2 animate-pulse"></span>
            <span class="w-1 bg-emerald-300 rounded-full h-3 animate-pulse"></span>
            <span class="w-1 bg-emerald-400 rounded-full h-1.5 animate-pulse"></span>
            <span class="w-1 bg-emerald-300 rounded-full h-2.5 animate-pulse"></span>
          </div>
        </div>

        <!-- Messages Scrollable Stream -->
        <div
          ref="messageContainerRef"
          @scroll="handleChatScroll"
          class="relative flex-1 overflow-y-auto space-y-2.5 pr-1 font-serif text-xs sm:text-sm min-h-0"
        >
          <!-- BOT Full-Server Broadcast Top Banner -->
          <div
            v-if="latestBotBroadcastText"
            @click="currentChannel = 'notice'"
            class="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#2B1E15] via-[#20150D] to-[#2B1E15] border border-amber-500/50 text-amber-200 text-xs leading-relaxed shadow-md cursor-pointer hover:border-amber-400 transition-all shrink-0"
            title="点击切换到【📢 牌楼通报】查看全部全服广播"
          >
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-1.5 font-black text-amber-300 font-serif-title">
                <span class="text-sm animate-pulse">🤖</span>
                <span>牌楼官播 BOT</span>
                <span class="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-mono border border-amber-500/40">全服广播</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="props.currentUser?.isAdmin"
                  type="button"
                  @click.stop="deleteLatestBotBroadcast"
                  class="px-2 py-0.5 rounded bg-red-900/80 hover:bg-red-800 text-red-100 text-[10px] font-bold border border-red-400 cursor-pointer active:scale-95 transition-all"
                  title="删除此条全服广播"
                >
                  🗑️ 删除广播
                </button>
                <span class="text-[10px] text-amber-400/80 font-mono flex items-center gap-1">
                  <span>查看全部</span>
                  <span>➔</span>
                </span>
              </div>
            </div>
            <div class="text-[#F5EFE6] font-serif font-bold text-xs truncate">
              {{ latestBotBroadcastText }}
            </div>
          </div>

          <!-- Messages List -->
          <div
            v-for="m in filteredMessages"
            :key="m.id"
            class="transition-all"
          >
            <!-- 1. System / BOT Broadcast Message Type -->
            <div
              v-if="m.type === 'notice' || m.sender.includes('BOT') || m.sender === '茶楼通告' || m.sender === '系统'"
              class="my-2 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#2F2116] via-[#241910] to-[#2F2116] border border-amber-500/50 text-amber-200 text-xs shadow-md font-serif"
            >
              <div class="flex items-center justify-between mb-1 pb-1 border-b border-amber-900/40">
                <div class="flex items-center gap-1.5 font-black text-amber-300 font-serif-title">
                  <span class="text-sm">🤖</span>
                  <span>{{ m.sender || '🤖 牌楼官播 BOT' }}</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-mono border border-amber-500/40 animate-pulse">全服广播</span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="props.currentUser?.isAdmin"
                    type="button"
                    @click.stop="deleteBroadcastMessage(m.id)"
                    class="px-2 py-0.5 rounded bg-red-900/80 hover:bg-red-800 text-red-100 text-[10px] font-bold border border-red-400 cursor-pointer active:scale-95 transition-all"
                    title="管理员删除此广播"
                  >
                    🗑️ 删除广播
                  </button>
                  <span class="text-[10px] text-stone-400 font-mono">{{ m.timestamp }}</span>
                </div>
              </div>
              <div class="text-[#F5EFE6] font-bold leading-relaxed tracking-wide">
                {{ m.text }}
              </div>
            </div>

            <!-- 2. Interactive Action Message (敬茶、抱拳、战帖、喝彩) -->
            <div
              v-else-if="m.action"
              v-show="m.challengeStatus !== 'overwritten' && m.challengeStatus !== 'removed'"
              class="my-1.5 p-2.5 rounded-2xl border text-xs flex items-center justify-between gap-2 shadow-xs transition-all"
              :class="m.action === 'challenge'
                ? 'bg-gradient-to-r from-red-950/20 via-amber-900/15 to-red-950/20 border-red-500/40 text-red-950'
                : 'bg-[#FFFDF8] border-[#D8C7B0] text-[#3C2C1E]'"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-xl shrink-0">{{ getActionIcon(m.action) }}</span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="font-black font-serif-title">{{ m.sender }}</span>
                    <span v-if="m.targetPlayerName" class="text-[#6B5744]">对 <strong class="text-[#2A1E14]">{{ m.targetPlayerName }}</strong></span>
                    <span class="text-[10px] text-stone-500 font-mono">{{ m.timestamp }}</span>
                    <span v-if="m.challengeStatus === 'transferred'" class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-900 text-[9px] font-mono font-bold border border-amber-400/50">已顺位继承守擂</span>
                    <span v-else-if="m.challengeStatus === 'accepted'" class="px-1.5 py-0.2 rounded bg-emerald-600/15 text-emerald-900 text-[9px] font-mono font-bold border border-emerald-500/30">已应战</span>
                  </div>
                  <div class="font-serif break-words mt-0.5 text-[#2A1E14]">
                    {{ m.text }}
                  </div>
                </div>
              </div>

              <!-- Challenge action quick join button -->
              <template v-if="m.action === 'challenge' && m.gameType && m.sceneMode">
                <button
                  v-if="!m.isSelf && m.challengeStatus !== 'accepted'"
                  type="button"
                  @click="acceptPlayerChallenge(m)"
                  class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-700 via-amber-700 to-red-700 hover:from-red-600 hover:to-amber-600 text-amber-100 text-xs font-black border border-amber-300 shadow-md active:scale-95 cursor-pointer whitespace-nowrap shrink-0 animate-pulse"
                  title="点击立即应战并入座相同游戏分场"
                >
                  ⚔️ 立即应战
                </button>
                <span
                  v-else-if="m.challengeStatus === 'accepted'"
                  class="px-2 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[10px] font-mono shrink-0 border border-emerald-300"
                >
                  已应战
                </span>
              </template>
            </div>

            <!-- 3. Standard Text or Voice Message -->
            <div
              v-else
              class="flex items-start gap-2.5 p-2 sm:p-2.5 rounded-2xl border transition-all"
              :class="[
                m.isSelf ? 'bg-[#FFFDF8] border-[#C2AC92] ml-6' : 'bg-[#EFE5D3]/70 border-[#D8C7B0] mr-6',
                m.text && m.text.includes('@' + props.currentUser.name) ? 'ring-2 ring-amber-500/60' : ''
              ]"
            >
              <span
                @click="openPlayerModalByName(m.sender, m.avatar)"
                class="text-xl sm:text-2xl shrink-0 filter drop-shadow-xs cursor-pointer hover:scale-110 transition-transform"
                title="点击查看牌友名帖"
              >
                {{ m.avatar || '👑' }}
              </span>

              <div class="min-w-0 flex-1">
                <!-- Header: Sender, Role Badge, Time -->
                <div class="flex items-center justify-between text-[10px] sm:text-xs text-[#6B5744] font-mono mb-0.5">
                  <div class="flex items-center gap-1.5 truncate">
                    <span
                      @click="openPlayerModalByName(m.sender, m.avatar)"
                      class="font-black text-[#3C2C1E] font-serif-title cursor-pointer hover:underline truncate"
                    >
                      {{ m.sender }}
                    </span>
                    <span v-if="m.isSelf" class="px-1 py-0.2 rounded bg-[#5C4533] text-[#FAF4E8] text-[9px]">您</span>
                    <span
                      v-if="m.channel === 'scene'"
                      class="px-1 py-0.2 rounded bg-amber-600/20 text-amber-900 text-[9px] font-mono"
                    >
                      本场
                    </span>
                  </div>
                  <span class="shrink-0">{{ m.timestamp }}</span>
                </div>

                <!-- Voice Message Bubble -->
                <div v-if="m.voice && m.audio" class="pt-0.5">
                  <button
                    type="button"
                    @click="playVoiceMessage(m)"
                    class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#241B14] via-[#352519] to-[#241B14] hover:from-[#3D2C1E] hover:to-[#2F2116] border border-amber-500/60 text-amber-300 text-xs font-serif font-black flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer transition-all"
                  >
                    <span class="text-sm">{{ activePlayingAudioMessageId === m.id ? '⏸️' : '▶️' }}</span>
                    <span>语音消息 ({{ m.duration || 2 }}s)</span>
                    <span class="flex items-center gap-0.5 h-3">
                      <span class="w-0.5 bg-amber-400 rounded-full" :class="activePlayingAudioMessageId === m.id ? 'h-3 animate-bounce' : 'h-1.5'"></span>
                      <span class="w-0.5 bg-amber-300 rounded-full" :class="activePlayingAudioMessageId === m.id ? 'h-3.5 animate-bounce delay-75' : 'h-2.5'"></span>
                      <span class="w-0.5 bg-amber-400 rounded-full" :class="activePlayingAudioMessageId === m.id ? 'h-2 animate-bounce delay-150' : 'h-1.5'"></span>
                    </span>
                  </button>
                </div>

                <!-- Regular Text Message Body -->
                <div v-else class="text-[#2A1E14] font-serif tracking-wide leading-relaxed break-words">
                  <div>{{ m.text }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="filteredMessages.length === 0" class="py-8 text-center text-[#8C755E] text-xs font-serif">
            <span>🍵 当前频道暂无发言记录</span>
          </div>
        </div>

        <!-- Floating "Back to Bottom" Pill Button -->
        <button
          v-if="showScrollToBottom"
          type="button"
          @click="scrollToBottom(true)"
          class="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-gradient-to-r from-[#5C4533] to-[#433022] text-[#FAF4E8] text-xs font-serif font-bold shadow-lg border border-[#D8C7B0] flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          <span>⬇️</span>
          <span>新消息直达</span>
        </button>

        <!-- ======================================================== -->
        <!-- INTEGRATED ACTION BANNER: 🎙️语音对讲 + ⚙️聊天设置        -->
        <!-- ======================================================== -->
        <div class="pt-2 border-t border-[#D8C7B0] shrink-0 bg-[#FAF4E8]">
          <div class="w-full flex items-center gap-2">
            <!-- 语音对讲按钮 -->
            <button
              v-if="!isRecordingVoice"
              type="button"
              @click="startVoiceRecording"
              class="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#241B14] via-[#2F2218] to-[#201711] hover:from-[#32251B] hover:to-[#2B1F17] border border-amber-500/60 hover:border-amber-400 text-amber-300 font-serif font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer transition-all"
              title="按住发送实时麦克风语音对讲"
            >
              <span class="text-base">🎙️</span>
              <span>语音对讲 (20s)</span>
            </button>
            <div v-else class="flex-1 flex items-center gap-1">
              <button
                type="button"
                @click="stopAndSendVoiceRecording"
                class="flex-1 py-2 px-2 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 border border-red-300 text-white font-serif font-black text-xs flex items-center justify-center gap-1 shadow-md shadow-red-600/40 animate-pulse active:scale-95 cursor-pointer transition-all whitespace-nowrap"
              >
                <span class="flex items-center gap-0.5 h-3">
                  <span class="w-1 bg-white rounded-full animate-bounce h-2"></span>
                  <span class="w-1 bg-white rounded-full animate-bounce h-3.5 delay-75"></span>
                </span>
                <span>发送 ({{ 20 - recordingSeconds }}s)</span>
              </button>
              <button
                type="button"
                @click="cancelVoiceRecording"
                class="w-8 h-9 rounded-2xl bg-black/80 hover:bg-black border border-white/20 text-[#D8C7B5] hover:text-white text-xs flex items-center justify-center cursor-pointer shrink-0"
                title="取消录音"
              >
                ✕
              </button>
            </div>

            <!-- 聊天设置按钮 -->
            <button
              type="button"
              @click="showSettingsModal = !showSettingsModal"
              class="px-3 py-2.5 rounded-2xl bg-[#EFE5D3] hover:bg-[#E5D7C2] border border-[#D8C7B0] text-[#3C2C1E] font-serif font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer transition-all shrink-0 whitespace-nowrap"
              title="聊天室设置"
            >
              <span>⚙️</span>
              <span>聊天设置</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: 各游戏场景内玩家数量显示 (REAL-TIME SCENE PLAYER COUNTS) -->
      <div class="w-68 sm:w-80 bg-[#FAF4E8] rounded-2xl sm:rounded-3xl border border-[#D8C7B0] shadow-md p-2.5 sm:p-3 flex flex-col justify-between shrink-0 min-h-0 overflow-hidden">
        <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <!-- Panel Header: 各游戏场景在座人数 -->
          <div class="pb-2 border-b border-[#D8C7B0] mb-2 shrink-0 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-base sm:text-lg shrink-0">🎴</span>
                <h3 class="font-black text-xs sm:text-sm text-[#3C2C1E] font-serif-title truncate">
                  场景实时人数
                </h3>
                <span class="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-900 border border-amber-400/40 text-[10px] font-mono font-bold shrink-0">
                  {{ totalInScenesCount }}人在座
                </span>
              </div>
              <span class="text-[10px] text-emerald-800 font-bold font-mono flex items-center gap-1 shrink-0">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                实时连线
              </span>
            </div>

            <!-- Scene Category Filter Chips -->
            <div class="flex items-center gap-1">
              <button
                type="button"
                @click="sceneCategoryTab = 'all'"
                class="flex-1 py-1 rounded-lg text-[10px] font-serif font-bold transition-all cursor-pointer text-center"
                :class="sceneCategoryTab === 'all' ? 'bg-[#5C4533] text-[#FAF4E8] shadow-xs' : 'bg-[#EFE5D3] text-[#6B5744] hover:bg-[#E5D7C2]'"
              >
                在座({{ activeScenesCount }})
              </button>
              <button
                type="button"
                @click="sceneCategoryTab = 'yansan'"
                class="flex-1 py-1 rounded-lg text-[10px] font-serif font-bold transition-all cursor-pointer text-center"
                :class="sceneCategoryTab === 'yansan' ? 'bg-[#5C4533] text-[#FAF4E8] shadow-xs' : 'bg-[#EFE5D3] text-[#6B5744] hover:bg-[#E5D7C2]'"
              >
                🔥烟三
              </button>
              <button
                type="button"
                @click="sceneCategoryTab = 'shisanshui'"
                class="flex-1 py-1 rounded-lg text-[10px] font-serif font-bold transition-all cursor-pointer text-center"
                :class="sceneCategoryTab === 'shisanshui' ? 'bg-[#5C4533] text-[#FAF4E8] shadow-xs' : 'bg-[#EFE5D3] text-[#6B5744] hover:bg-[#E5D7C2]'"
              >
                💎十三水
              </button>
              <button
                type="button"
                @click="sceneCategoryTab = 'mahjong'"
                class="flex-1 py-1 rounded-lg text-[10px] font-serif font-bold transition-all cursor-pointer text-center"
                :class="sceneCategoryTab === 'mahjong' ? 'bg-[#5C4533] text-[#FAF4E8] shadow-xs' : 'bg-[#EFE5D3] text-[#6B5744] hover:bg-[#E5D7C2]'"
              >
                🀄麻将
              </button>
            </div>
          </div>

          <!-- Scene Player Counts List -->
          <div class="flex-1 space-y-2 overflow-y-auto pr-1">
            <div
              v-for="s in displayedSceneList"
              :key="s.mode"
              @click="props.activeSceneMode !== s.mode ? quickEnterScene(s.gameType, s.mode) : null"
              class="p-2 sm:p-2.5 rounded-2xl border transition-all flex flex-col gap-1.5"
              :class="[
                props.activeSceneMode === s.mode
                  ? 'bg-gradient-to-br from-[#FFFDF8] to-[#F7EEDF] border-amber-600 ring-2 ring-amber-500/50 shadow-md cursor-default'
                  : 'bg-[#FFFDF8] hover:bg-[#EFE5D3]/70 border-[#D8C7B0] hover:border-[#C2AC92] shadow-2xs active:scale-[0.98] cursor-pointer'
              ]"
            >
              <!-- Card Top: Name + Badge + Player Count -->
              <div class="flex items-center justify-between gap-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-base shrink-0">{{ s.icon }}</span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1">
                      <span class="font-black text-xs text-[#2A1E14] font-serif-title truncate group-hover:text-amber-950">
                        {{ s.name }}
                      </span>
                      <span
                        v-if="props.activeSceneMode === s.mode"
                        class="px-1.5 py-0.2 rounded-full bg-amber-600 text-amber-100 text-[9px] font-mono font-bold shrink-0 shadow-xs"
                      >
                        在座
                      </span>
                    </div>
                    <div class="text-[9px] text-[#8C755E] font-serif truncate mt-0.5">
                      {{ s.desc }}
                    </div>
                  </div>
                </div>

                <!-- Occupancy Count & Status Tag -->
                <div class="flex flex-col items-end shrink-0">
                  <span
                    class="text-xs font-mono font-black tabular-nums"
                    :class="s.count >= s.max ? 'text-red-700' : (s.count > 0 ? 'text-amber-900' : 'text-stone-500')"
                  >
                    👥 {{ s.count }} / {{ s.max }}
                  </span>
                  <span
                    class="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold border mt-0.5"
                    :class="s.statusBadgeClass"
                  >
                    {{ s.statusText }}
                  </span>
                </div>
              </div>

              <!-- Occupancy Progress Bar -->
              <div class="w-full bg-[#EFE5D3] rounded-full h-1.5 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="s.count >= s.max ? 'bg-red-600' : (s.count > 0 ? 'bg-amber-600' : 'bg-stone-300')"
                  :style="{ width: `${Math.min(100, Math.round((s.count / s.max) * 100))}%` }"
                ></div>
              </div>

              <!-- Card Bottom: Seated Players Previews & Action -->
              <div class="flex items-center justify-between text-[10px] pt-1 border-t border-[#D8C7B0]/60">
                <div class="flex items-center gap-1 min-w-0 flex-1">
                  <template v-if="s.players.length > 0">
                    <span class="text-[#8C755E] text-[9px] shrink-0 font-serif">在席:</span>
                    <div class="flex items-center -space-x-1 overflow-hidden shrink-0">
                      <span
                        v-for="(p, pIdx) in s.players.slice(0, 3)"
                        :key="p.id || pIdx"
                        class="w-4.5 h-4.5 rounded-full bg-[#EFE5D3] border border-white flex items-center justify-center text-[9px] shadow-xs shrink-0"
                        :title="p.name"
                      >
                        {{ p.avatar || '👑' }}
                      </span>
                    </div>
                    <span class="text-[#6B5744] text-[9px] truncate font-serif">
                      {{ s.players.map((p: any) => p.name).join('、') }}
                    </span>
                  </template>
                  <span v-else class="text-stone-400 text-[9px] font-serif">
                    虚位以待，首发摆擂
                  </span>
                </div>

                <button
                  v-if="props.activeSceneMode !== s.mode"
                  type="button"
                  @click.stop="quickEnterScene(s.gameType, s.mode)"
                  class="px-2 py-0.5 rounded-lg text-[9px] font-serif font-bold transition-all active:scale-95 cursor-pointer shrink-0 ml-1 bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#3C2C1E] border border-[#D8C7B0]"
                >
                  选台入座 ➔
                </button>
                <span
                  v-else
                  class="px-2 py-0.5 rounded-lg text-[9px] font-serif font-bold text-amber-800 bg-amber-100/90 border border-amber-300/80 shrink-0 ml-1"
                >
                  当前在座
                </span>
              </div>
            </div>

            <!-- Empty filter result -->
            <div v-if="displayedSceneList.length === 0" class="py-8 text-center text-[#8C755E] text-xs font-serif">
              🍵 暂无玩家在座的游戏场景
            </div>
          </div>
        </div>

        <!-- Footer Scene Quick Stats -->
        <div class="pt-2 border-t border-[#D8C7B0] shrink-0">
          <div class="flex items-center justify-between text-[10px] text-[#6B5744] font-serif">
            <span class="flex items-center gap-1">
              <span>🍵</span>
              <span>大堂闲坐品茗:</span>
              <strong class="font-mono text-[#2A1E14]">{{ lobbyPlayerCount }} 人</strong>
            </span>
            <span class="text-[9px] text-[#8C755E]">点击卡片极速入座</span>
          </div>
        </div>
      </div>
    </main>

    <!-- ======================================================== -->
    <!-- PLAYER PROFILE MODAL (牌友名帖)                           -->
    <!-- ======================================================== -->
    <!-- ======================================================== -->
    <!-- PLAYER PROFILE MODAL (牌友名帖)                           -->
    <!-- ======================================================== -->
    <Transition name="fade">
      <div
        v-if="selectedPlayerModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-hidden"
        @click.self="selectedPlayerModal = null"
      >
        <div class="w-full max-w-sm max-h-[85vh] rounded-3xl bg-[#FAF4E8] border-2 border-[#C2AC92] p-4 sm:p-5 shadow-2xl flex flex-col min-h-0 overflow-hidden animate-scaleUp">
          <div class="flex items-center justify-between pb-3 border-b border-[#D8C7B0] shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-2xl filter drop-shadow-xs">{{ selectedPlayerModal.avatar || '👑' }}</span>
              <div>
                <h3 class="font-black text-base text-[#2A1E14] font-serif-title">{{ selectedPlayerModal.name }}</h3>
                <span class="text-[10px] text-[#6B5744] font-mono">UID: {{ (selectedPlayerModal.id || 'P-1008').slice(-6) }}</span>
              </div>
            </div>
            <button
              type="button"
              @click="selectedPlayerModal = null"
              class="w-7 h-7 rounded-xl bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#5C4533] flex items-center justify-center cursor-pointer text-xs shrink-0 font-bold active:scale-95"
            >
              ✕
            </button>
          </div>

          <div class="flex-1 overflow-y-auto my-3 space-y-3 pr-1 min-h-0">
            <!-- Player Details -->
            <div class="p-3 rounded-2xl bg-[#EFE5D3]/60 border border-[#D8C7B0] space-y-1.5 text-xs font-serif">
              <div class="flex justify-between">
                <span class="text-[#6B5744]">🪙 钱庄筹码:</span>
                <span class="font-mono font-bold text-[#2A1E14]">{{ (selectedPlayerModal.coins || 0).toLocaleString() }} 分</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#6B5744]">🎴 所在分场:</span>
                <span class="font-bold text-amber-900">{{ getPlayerSceneTag(selectedPlayerModal.gameType, selectedPlayerModal.sceneMode) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#6B5744]">🏆 牌坛信誉:</span>
                <span class="font-mono font-bold text-emerald-800">100% 优良牌友</span>
              </div>
            </div>

            <!-- Action Buttons Grid -->
            <div class="grid grid-cols-2 gap-2 text-xs font-serif font-black">
              <button
                type="button"
                @click="sendPlayerDirectAction('tea', selectedPlayerModal)"
                class="py-2.5 px-3 rounded-xl bg-[#EFE5D3] hover:bg-amber-100 text-[#3C2C1E] border border-[#D8C7B0] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
              >
                <span>🍵</span>
                <span>向 TA 敬茶</span>
              </button>
              <button
                type="button"
                @click="sendPlayerDirectAction('salute', selectedPlayerModal)"
                class="py-2.5 px-3 rounded-xl bg-[#EFE5D3] hover:bg-amber-100 text-[#3C2C1E] border border-[#D8C7B0] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
              >
                <span>👏</span>
                <span>向 TA 抱拳</span>
              </button>
              <button
                v-if="selectedPlayerModal.sceneMode && selectedPlayerModal.sceneMode !== activeSceneMode"
                type="button"
                @click="followPlayerScene(selectedPlayerModal)"
                class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] text-[#FAF4E8] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs col-span-2"
              >
                <span>👥</span>
                <span>跟着入座</span>
              </button>
              <button
                v-else
                type="button"
                @click="sendPlayerDirectAction('cheer', selectedPlayerModal)"
                class="py-2.5 px-3 rounded-xl bg-[#EFE5D3] hover:bg-amber-100 text-[#3C2C1E] border border-[#D8C7B0] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs col-span-2"
              >
                <span>🪭</span>
                <span>摇扇喝彩</span>
              </button>
            </div>
          </div>

          <div class="pt-2 border-t border-[#D8C7B0] shrink-0 text-right">
            <button
              type="button"
              @click="selectedPlayerModal = null"
              class="px-4 py-1.5 rounded-xl bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#3C2C1E] text-xs font-black border border-[#D8C7B0] cursor-pointer active:scale-95 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ======================================================== -->
    <!-- QUICK SCENE SWITCH MODAL (全新响应式设计：不切割弹窗)         -->
    <!-- ======================================================== -->
    <Transition name="fade">
      <div
        v-if="showSceneSwitchModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-hidden"
        @click.self="showSceneSwitchModal = false"
      >
        <div class="w-full max-w-xl max-h-[88vh] rounded-3xl bg-[#FAF4E8] border-2 border-[#C2AC92] p-3.5 sm:p-5 shadow-2xl flex flex-col min-h-0 overflow-hidden animate-scaleUp">
          
          <!-- Header -->
          <div class="flex items-center justify-between pb-2.5 border-b border-[#D8C7B0] shrink-0">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-xl sm:text-2xl shrink-0">🍵</span>
              <div class="min-w-0">
                <h3 class="font-black text-sm sm:text-base text-[#2A1E14] font-serif-title truncate">选台入座 · 切换游戏分场</h3>
                <p class="text-[10px] sm:text-xs text-[#6B5744] font-serif truncate">入座后本桌集结满 4 人将自动发牌进入对局</p>
              </div>
            </div>
            <button
              type="button"
              @click="showSceneSwitchModal = false"
              class="w-8 h-8 rounded-xl bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#5C4533] flex items-center justify-center cursor-pointer text-sm font-bold shrink-0 ml-2 shadow-xs transition-all active:scale-95"
              title="关闭弹窗"
            >
              ✕
            </button>
          </div>

          <!-- Quick Game Type Filter Tabs -->
          <div class="flex items-center gap-1 sm:gap-1.5 my-2.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
            <button
              type="button"
              @click="modalCategoryTab = 'all'"
              class="px-2.5 py-1 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0"
              :class="modalCategoryTab === 'all' ? 'bg-[#5C4533] text-[#FAF4E8] border-[#3C2C1E] shadow-xs' : 'bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#6B5744] border-[#D8C7B0]'"
            >
              全部分场
            </button>
            <button
              type="button"
              @click="modalCategoryTab = 'yansan'"
              class="px-2.5 py-1 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0"
              :class="modalCategoryTab === 'yansan' ? 'bg-[#5C4533] text-[#FAF4E8] border-[#3C2C1E] shadow-xs' : 'bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#6B5744] border-[#D8C7B0]'"
            >
              🔥 经典烟三
            </button>
            <button
              type="button"
              @click="modalCategoryTab = 'shisanshui'"
              class="px-2.5 py-1 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0"
              :class="modalCategoryTab === 'shisanshui' ? 'bg-[#5C4533] text-[#FAF4E8] border-[#3C2C1E] shadow-xs' : 'bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#6B5744] border-[#D8C7B0]'"
            >
              💎 十三水
            </button>
            <button
              type="button"
              @click="modalCategoryTab = 'mahjong'"
              class="px-2.5 py-1 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0"
              :class="modalCategoryTab === 'mahjong' ? 'bg-[#5C4533] text-[#FAF4E8] border-[#3C2C1E] shadow-xs' : 'bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#6B5744] border-[#D8C7B0]'"
            >
              🀄 经典麻将
            </button>
          </div>

          <!-- Main Scrollable Body Area -->
          <div class="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0">
            
            <!-- 大堂闲坐 / 观局品茗选项 -->
            <div
              v-if="modalCategoryTab === 'all'"
              @click="selectSceneFromModal('', '')"
              class="p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group active:scale-[0.99]"
              :class="!hasJoinedScene ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-amber-50 border-amber-500 shadow-md ring-2 ring-amber-400/40' : 'bg-gradient-to-r from-amber-50 to-orange-50/80 hover:from-amber-100 hover:to-orange-100/90 text-[#4A3828] border-amber-300 shadow-2xs'"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="text-2xl shrink-0 filter drop-shadow-xs">🍵</span>
                <div class="min-w-0">
                  <div class="font-black text-xs sm:text-sm font-serif-title flex items-center gap-1.5">
                    <span>大堂品茗闲聊 (不上桌)</span>
                    <span v-if="!hasJoinedScene" class="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 text-[9px] font-mono font-bold">当前在大堂</span>
                  </div>
                  <div class="text-[10px] sm:text-xs opacity-90 font-serif mt-0.5 truncate">在大堂自由聊天、发布叫阵战帖，或等待接受其他牌友邀战</div>
                </div>
              </div>
              <span
                class="text-[10px] sm:text-xs font-bold font-serif px-2.5 py-1 rounded-xl shrink-0 transition-transform group-hover:scale-105"
                :class="!hasJoinedScene ? 'bg-amber-300 text-amber-950 font-black shadow-xs' : 'bg-amber-200/80 text-amber-900 border border-amber-300'"
              >
                {{ !hasJoinedScene ? '✓ 当前状态' : '点击回到大堂' }}
              </span>
            </div>

            <!-- 经典烟三 scenes -->
            <div v-if="modalCategoryTab === 'all' || modalCategoryTab === 'yansan'" class="space-y-1.5">
              <div class="text-xs font-black text-[#5C4533] font-serif-title flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm">🔥</span>
                  <span>经典烟三 (Classic Yansan)</span>
                </div>
                <span class="text-[10px] font-mono text-[#8C755E]">3 款精选分场</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  v-for="s in YANSAN_SCENES"
                  :key="s.mode"
                  type="button"
                  @click="selectSceneFromModal('yansan', s.mode)"
                  class="p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group active:scale-95 shadow-2xs"
                  :class="activeGameType === 'yansan' && activeSceneMode === s.mode ? 'bg-gradient-to-br from-[#5C4533] to-[#3C2C1E] text-[#FAF4E8] border-amber-500/80 shadow-md ring-2 ring-amber-500/50' : 'bg-[#FFFDF8] hover:bg-[#EFE5D3] border-[#D8C7B0] text-[#3C2C1E]'"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-black text-xs sm:text-sm font-serif-title">{{ s.name }}</span>
                    <span
                      class="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-full border"
                      :class="activeGameType === 'yansan' && activeSceneMode === s.mode ? 'bg-amber-600 text-amber-100 border-amber-400' : 'bg-amber-100 text-amber-900 border-amber-300'"
                    >
                      {{ activeGameType === 'yansan' && activeSceneMode === s.mode ? '当前在座' : '选台' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-[10px] font-mono mt-1 opacity-85">
                    <span>👥 {{ formatSceneSeatDisplay(props.sceneCounts[s.mode] || 0, 4) }}</span>
                    <span class="font-sans">➔</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- 水镜十三水 scenes -->
            <div v-if="modalCategoryTab === 'all' || modalCategoryTab === 'shisanshui'" class="space-y-1.5">
              <div class="text-xs font-black text-[#5C4533] font-serif-title flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm">💎</span>
                  <span>水镜十三水 (Chinese Poker)</span>
                </div>
                <span class="text-[10px] font-mono text-[#8C755E]">4 款对战分场</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  v-for="s in SHISANSHUI_SCENES"
                  :key="s.mode"
                  type="button"
                  @click="selectSceneFromModal('shisanshui', s.mode)"
                  class="p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group active:scale-95 shadow-2xs"
                  :class="activeGameType === 'shisanshui' && activeSceneMode === s.mode ? 'bg-gradient-to-br from-[#5C4533] to-[#3C2C1E] text-[#FAF4E8] border-amber-500/80 shadow-md ring-2 ring-amber-500/50' : 'bg-[#FFFDF8] hover:bg-[#EFE5D3] border-[#D8C7B0] text-[#3C2C1E]'"
                >
                  <div>
                    <div class="font-black text-xs sm:text-sm font-serif-title">{{ s.name }}</div>
                    <div class="text-[10px] font-mono opacity-80 mt-0.5">👥 {{ formatSceneSeatDisplay(props.sceneCounts[s.mode] || 0, s.mode?.includes('eight') ? 8 : 4) }}</div>
                  </div>
                  <span
                    class="text-[10px] font-bold font-mono px-2 py-1 rounded-xl border shrink-0"
                    :class="activeGameType === 'shisanshui' && activeSceneMode === s.mode ? 'bg-amber-600 text-amber-100 border-amber-400' : 'bg-amber-100 text-amber-900 border-amber-300'"
                  >
                    {{ activeGameType === 'shisanshui' && activeSceneMode === s.mode ? '当前在座' : '选择入座' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- 国标麻将 scenes -->
            <div v-if="modalCategoryTab === 'all' || modalCategoryTab === 'mahjong'" class="space-y-1.5">
              <div class="text-xs font-black text-[#5C4533] font-serif-title flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm">🀄</span>
                  <span>国标经典麻将 (Mahjong)</span>
                </div>
                <span class="text-[10px] font-mono text-[#8C755E]">4 款玩法分场</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  v-for="s in MAHJONG_SCENES"
                  :key="s.mode"
                  type="button"
                  @click="selectSceneFromModal('mahjong', s.mode)"
                  class="p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group active:scale-95 shadow-2xs"
                  :class="activeGameType === 'mahjong' && activeSceneMode === s.mode ? 'bg-gradient-to-br from-[#5C4533] to-[#3C2C1E] text-[#FAF4E8] border-amber-500/80 shadow-md ring-2 ring-amber-500/50' : 'bg-[#FFFDF8] hover:bg-[#EFE5D3] border-[#D8C7B0] text-[#3C2C1E]'"
                >
                  <div>
                    <div class="font-black text-xs sm:text-sm font-serif-title">{{ s.name }}</div>
                    <div class="text-[10px] font-mono opacity-80 mt-0.5">👥 {{ formatSceneSeatDisplay(props.sceneCounts[s.mode] || 0, 4) }}</div>
                  </div>
                  <span
                    class="text-[10px] font-bold font-mono px-2 py-1 rounded-xl border shrink-0"
                    :class="activeGameType === 'mahjong' && activeSceneMode === s.mode ? 'bg-amber-600 text-amber-100 border-amber-400' : 'bg-amber-100 text-amber-900 border-amber-300'"
                  >
                    {{ activeGameType === 'mahjong' && activeSceneMode === s.mode ? '当前在座' : '选择入座' }}
                  </span>
                </button>
              </div>
            </div>

          </div>

          <!-- Bottom Footer Bar -->
          <div class="pt-2.5 border-t border-[#D8C7B0] shrink-0 flex items-center justify-between">
            <div class="text-[10px] text-[#6B5744] font-serif truncate">
              💡 入座后满 4 人将自动开始对局
            </div>
            <button
              type="button"
              @click="showSceneSwitchModal = false"
              class="px-3.5 py-1.5 rounded-xl bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#3C2C1E] text-xs font-black border border-[#D8C7B0] cursor-pointer active:scale-95 transition-all shadow-2xs"
            >
              关闭
            </button>
          </div>

        </div>
      </div>
    </Transition>

    <!-- ======================================================== -->
    <!-- CHAT SETTINGS MODAL                                      -->
    <!-- ======================================================== -->
    <Transition name="fade">
      <div
        v-if="showSettingsModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden"
        @click.self="showSettingsModal = false"
      >
        <div class="w-full max-w-sm max-h-[85vh] rounded-3xl bg-[#FAF4E8] border-2 border-[#C2AC92] p-4 sm:p-5 shadow-2xl flex flex-col min-h-0 overflow-hidden space-y-3 animate-scaleUp">
          <div class="flex items-center justify-between pb-2.5 border-b border-[#D8C7B0] shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-lg">⚙️</span>
              <h3 class="font-black text-base text-[#2A1E14] font-serif-title">牌友聊天室设置</h3>
            </div>
            <button
              type="button"
              @click="showSettingsModal = false"
              class="w-7 h-7 rounded-xl bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#5C4533] flex items-center justify-center cursor-pointer text-xs font-bold active:scale-95"
            >
              ✕
            </button>
          </div>

          <div class="flex-1 overflow-y-auto space-y-3 text-xs font-serif pr-1 min-h-0">
            <!-- 自动播放收到的语音广播 -->
            <label class="flex items-center justify-between p-3 rounded-2xl bg-[#EFE5D3]/60 border border-[#D8C7B0] cursor-pointer">
              <div>
                <div class="font-black text-[#2A1E14]">🔊 自动收听新语音广播</div>
                <div class="text-[10px] text-[#6B5744]">当其他牌友发送语音时自动开麦播放</div>
              </div>
              <input
                v-model="autoPlayVoice"
                type="checkbox"
                class="w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
            </label>

            <!-- 消息提示音开关 -->
            <label class="flex items-center justify-between p-3 rounded-2xl bg-[#EFE5D3]/60 border border-[#D8C7B0] cursor-pointer">
              <div>
                <div class="font-black text-[#2A1E14]">🔔 消息互动提示音</div>
                <div class="text-[10px] text-[#6B5744]">发送与接收台词、敬茶等动作时播放音效</div>
              </div>
              <input
                v-model="soundPromptEnabled"
                type="checkbox"
                class="w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
            </label>

            <!-- 清空聊天记录 -->
            <button
              type="button"
              @click="clearChatMessages"
              class="w-full py-2.5 px-3 rounded-xl bg-red-950/10 hover:bg-red-950/20 text-red-900 border border-red-300 font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <span>🧹</span>
              <span>清空本地聊天记录</span>
            </button>
          </div>

          <div class="pt-2 border-t border-[#D8C7B0] shrink-0 text-right">
            <button
              type="button"
              @click="showSettingsModal = false"
              class="px-4 py-1.5 rounded-xl bg-[#EFE5D3] hover:bg-[#E5D7C2] text-[#3C2C1E] text-xs font-black border border-[#D8C7B0] cursor-pointer active:scale-95 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { UserProfile } from '../utils/storage';
import { soundFX } from '../utils/sound';

export interface ScenePlayer {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  coins: number;
  seat: number;
  isSimulated?: boolean;
}

export interface ChatMessageItem {
  id: string;
  sender: string;
  senderId?: string;
  avatar: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
  channel?: 'hall' | 'scene' | 'notice';
  voice?: boolean;
  audio?: string;
  duration?: number;
  phraseText?: string;
  roleId?: string;
  roleName?: string;
  roleIcon?: string;
  pitch?: number;
  rate?: number;
  isFemale?: boolean;
  action?: 'tea' | 'salute' | 'cheer' | 'challenge' | 'gift' | null;
  targetPlayerName?: string;
  gameType?: string;
  sceneMode?: string;
  sceneName?: string;
  challengeId?: string;
  challengeStatus?: 'open' | 'accepted' | 'overwritten' | 'transferred' | 'removed';
  acceptedBy?: { id: string; name: string };
  type?: 'message' | 'notice';
}

const props = defineProps<{
  currentUser: UserProfile;
  ws: WebSocket | null;
  wsConnected: boolean;
  activeGameType?: 'yansan' | 'shisanshui' | 'mahjong' | '' | string | null;
  activeSceneMode?: string | null;
  activeSceneName?: string | null;
  sceneCounts: Record<string, number>;
  onlinePlayers: any[];
}>();

const emit = defineEmits<{
  (e: 'leave'): void;
  (e: 'change-scene'): void;
  (e: 'select-scene', gameType: string, sceneMode: string): void;
  (e: 'start-game', players: ScenePlayer[], roomId?: string, deal?: any): void;
}>();

// UI States
const messageContainerRef = ref<HTMLDivElement | null>(null);
const isStarting = ref(false);
const countdownSeconds = ref(3);
let countdownTimer: any = null;
const matchedSceneTitle = ref('');

// Channels
const currentChannel = ref<'hall' | 'scene' | 'notice'>('hall');
const unreadCountHall = ref(0);
const unreadCountScene = ref(0);
const showScrollToBottom = ref(false);

// Active Bottom Panel Popover: 'challenge' | 'phrases' | null
const activeBottomPanel = ref<'challenge' | 'phrases' | null>(null);

// Scene Category Filter Tab: 'all' | 'yansan' | 'shisanshui' | 'mahjong'
const sceneCategoryTab = ref<'all' | 'yansan' | 'shisanshui' | 'mahjong'>('all');

// Modals
const showSettingsModal = ref(false);
const showSceneSwitchModal = ref(false);
const modalCategoryTab = ref<'all' | 'yansan' | 'shisanshui' | 'mahjong'>('all');
const selectedPlayerModal = ref<any | null>(null);

// Settings
const autoPlayVoice = ref(true);
const soundPromptEnabled = ref(true);

// Replay status tracking
const activePlayingPhraseId = ref<string | null>(null);

// Current room deal cache
const currentRoomId = ref('');
const currentRoomDeal = ref<any>(null);
const currentPlayers = ref<ScenePlayer[]>([]);

// Chat stream state (empty start, dynamically filled by Telegram BOT broadcasts or chat)
const chatMessages = ref<ChatMessageItem[]>([]);

const latestBotBroadcastText = computed(() => {
  const botMsgs = chatMessages.value.filter(m => m.type === 'notice' || m.sender.includes('BOT') || m.channel === 'notice');
  if (botMsgs.length > 0) {
    return botMsgs[botMsgs.length - 1].text;
  }
  return '';
});

function deleteBroadcastMessage(msgId: string) {
  chatMessages.value = chatMessages.value.filter(m => m.id !== msgId);
  if (soundPromptEnabled.value) soundFX.playTap();
}

function deleteLatestBotBroadcast() {
  const botMsgs = chatMessages.value.filter(m => m.type === 'notice' || m.sender.includes('BOT') || m.channel === 'notice');
  if (botMsgs.length > 0) {
    const last = botMsgs[botMsgs.length - 1];
    deleteBroadcastMessage(last.id);
  }
}

// Voice recording & broadcast state
const isRecordingVoice = ref(false);
const recordingSeconds = ref(0);
const activePlayingVoice = ref<{ sender: string; duration: number } | null>(null);
const activePlayingAudioMessageId = ref<string | null>(null);
const micErrorTip = ref('');
let voiceRecorder: MediaRecorder | null = null;
let voiceStream: MediaStream | null = null;
let recordingAudioCtx: any = null;
let voiceChunks: Blob[] = [];
let recordingInterval: any = null;
let activePlayingAudio: HTMLAudioElement | null = null;

const hasJoinedScene = computed(() => {
  return Boolean(
    props.activeSceneMode &&
    props.activeSceneMode !== 'none' &&
    props.activeSceneMode !== 'lobby' &&
    props.activeSceneMode !== '' &&
    props.activeGameType &&
    props.activeGameType !== ''
  );
});

const activeGameIcon = computed(() => {
  if (!hasJoinedScene.value) return '🍵';
  if (props.activeGameType === 'mahjong') return '🀄';
  if (props.activeGameType === 'shisanshui') return '💎';
  return '🔥';
});

const activeSceneDisplayName = computed(() => {
  if (!hasJoinedScene.value) {
    return '未加入任何游戏';
  }
  if (props.activeGameType === 'mahjong') {
    if (props.activeSceneMode === 'hongzhong-6') return '红中麻将 · 六码场';
    if (props.activeSceneMode === 'hongzhong-10') return '红中麻将 · 十码场';
    if (props.activeSceneMode === 'standard-10') return '普通麻将 · 十码场';
    return '普通麻将 · 六码场';
  }
  if (props.activeGameType === 'shisanshui') {
    if (props.activeSceneMode === 'eight-realtime') return '十三水 · 八人实时';
    if (props.activeSceneMode === 'eight-booking') return '十三水 · 八人预约';
    if (props.activeSceneMode === 'four-booking') return '十三水 · 四人预约';
    return '十三水 · 四人实时';
  }
  if (props.activeGameType === 'yansan') {
    if (props.activeSceneMode === 'yansan-20-40') return '经典烟三 · 20--40分场';
    if (props.activeSceneMode === 'yansan-10-20') return '经典烟三 · 10--20分场';
    return '经典烟三 · 5--10分场';
  }
  return props.activeSceneName || '未加入任何游戏';
});

const currentSceneMax = computed(() => {
  return (props.activeGameType === 'shisanshui' && props.activeSceneMode?.includes('eight')) ? 8 : 4;
});

const activeTableCount = computed(() => {
  if (!hasJoinedScene.value) return 0;
  if (currentPlayers.value && currentPlayers.value.length > 0) {
    return Math.min(currentSceneMax.value, currentPlayers.value.length);
  }
  return 1;
});

const activeSceneCount = computed(() => {
  if (!hasJoinedScene.value || !props.activeSceneMode) return 0;
  return props.sceneCounts[props.activeSceneMode] || 0;
});

function formatSceneSeatDisplay(count: number, maxP: number = 4): string {
  if (count <= 0) return `0 / ${maxP} 等候中`;
  if (count < maxP) return `${count} / ${maxP} 等候中`;
  if (count === maxP) return `${maxP} / ${maxP} 满桌竞技`;
  const waitingInTable = ((count - 1) % maxP) + 1;
  const tableNo = Math.floor((count - 1) / maxP) + 1;
  return `${count}人在场 (第${tableNo}桌 ${waitingInTable}/${maxP})`;
}

// Filtered chat messages based on active channel
const filteredMessages = computed(() => {
  const activeList = chatMessages.value.filter(
    (m) => m.challengeStatus !== 'overwritten' && m.challengeStatus !== 'removed'
  );
  if (currentChannel.value === 'hall') {
    return activeList.filter(m => m.channel !== 'notice' && !m.sender.includes('BOT'));
  }
  if (currentChannel.value === 'scene') {
    return activeList.filter(m => {
      return m.channel === 'scene' || (m.sceneMode === props.activeSceneMode);
    });
  }
  return activeList.filter(m => m.type === 'notice' || m.channel === 'notice' || m.action === 'challenge' || m.sender.includes('BOT'));
});

interface SceneOverviewItem {
  gameType: string;
  gameName: string;
  icon: string;
  mode: string;
  name: string;
  max: number;
  desc: string;
}

const ALL_SCENE_DEFINITIONS: SceneOverviewItem[] = [
  // 经典烟三
  { gameType: 'yansan', gameName: '经典烟三', icon: '🔥', mode: 'yansan-5-10', name: '烟三 · 5--10分场', max: 4, desc: '经典防关博弈' },
  { gameType: 'yansan', gameName: '经典烟三', icon: '🔥', mode: 'yansan-10-20', name: '烟三 · 10--20分场', max: 4, desc: '高手进阶切磋' },
  { gameType: 'yansan', gameName: '经典烟三', icon: '🔥', mode: 'yansan-20-40', name: '烟三 · 20--40分场', max: 4, desc: '至尊牌王决巅' },

  // 水镜十三水
  { gameType: 'shisanshui', gameName: '水镜十三水', icon: '💎', mode: 'four-realtime', name: '十三水 · 四人实时', max: 4, desc: '四人经典实时对决' },
  { gameType: 'shisanshui', gameName: '水镜十三水', icon: '💎', mode: 'eight-realtime', name: '十三水 · 八人争霸', max: 8, desc: '八门夺魁实时混战' },
  { gameType: 'shisanshui', gameName: '水镜十三水', icon: '💎', mode: 'four-booking', name: '十三水 · 四人预约', max: 4, desc: '四人专列10桌预发牌' },
  { gameType: 'shisanshui', gameName: '水镜十三水', icon: '💎', mode: 'eight-booking', name: '十三水 · 八人预约', max: 8, desc: '八人专列双副牌争霸' },

  // 国标经典麻将
  { gameType: 'mahjong', gameName: '国标麻将', icon: '🀄', mode: 'hongzhong-6', name: '红中麻将 · 六码场', max: 4, desc: '万条筒红中癞子' },
  { gameType: 'mahjong', gameName: '国标麻将', icon: '🀄', mode: 'hongzhong-10', name: '红中麻将 · 十码场', max: 4, desc: '十码红中高倍翻盘' },
  { gameType: 'mahjong', gameName: '国标麻将', icon: '🀄', mode: 'standard-6', name: '经典国标 · 六码场', max: 4, desc: '传统碰杠听胡' },
  { gameType: 'mahjong', gameName: '国标麻将', icon: '🀄', mode: 'standard-10', name: '经典国标 · 十码场', max: 4, desc: '十码经典刺激对局' },
];

const allSceneListWithStats = computed(() => {
  const onlineList = props.onlinePlayers || [];
  return ALL_SCENE_DEFINITIONS.map((s) => {
    const playersInThisScene = onlineList.filter((p: any) => p.sceneMode === s.mode && p.isOnline !== false);
    const count = Math.max(props.sceneCounts[s.mode] || 0, playersInThisScene.length);
    
    let statusText = '虚位以待';
    let statusBadgeClass = 'bg-emerald-500/10 text-emerald-800 border-emerald-300';
    if (count >= s.max) {
      statusText = '已满席';
      statusBadgeClass = 'bg-red-500/15 text-red-800 border-red-300';
    } else if (count > 0) {
      statusText = `差 ${s.max - count} 人`;
      statusBadgeClass = 'bg-amber-500/15 text-amber-900 border-amber-300 animate-pulse';
    }

    return {
      ...s,
      count,
      players: playersInThisScene,
      statusText,
      statusBadgeClass,
    };
  });
});

const activeScenesCount = computed(() => {
  return allSceneListWithStats.value.filter(
    (s) => s.count > 0 || s.players.length > 0 || (props.activeSceneMode && s.mode === props.activeSceneMode)
  ).length;
});

const displayedSceneList = computed(() => {
  // 聊天室场景实时人数只显示有玩家在的场景（或当前玩家自身所在场景）
  let list = allSceneListWithStats.value.filter(
    (s) => s.count > 0 || s.players.length > 0 || (props.activeSceneMode && s.mode === props.activeSceneMode)
  );

  if (sceneCategoryTab.value !== 'all') {
    list = list.filter((s) => s.gameType === sceneCategoryTab.value);
  }
  return list;
});

const totalInScenesCount = computed(() => {
  return ALL_SCENE_DEFINITIONS.reduce((acc, curr) => acc + (props.sceneCounts[curr.mode] || 0), 0);
});

const lobbyPlayerCount = computed(() => {
  const onlineList = props.onlinePlayers || [];
  return onlineList.filter(
    (p: any) => !p.sceneMode || p.sceneMode === 'hall' || p.sceneMode === 'lobby' || p.sceneMode === 'none' || p.sceneMode === ''
  ).length;
});

function quickEnterScene(gameType: string, sceneMode: string) {
  if (soundPromptEnabled.value) soundFX.playTap();
  if (!gameType && !sceneMode) {
    // 明确点击顶部横幅退出座位按钮，触发离座离场
    emit('select-scene', '', '');
    return;
  }
  if (props.activeSceneMode === sceneMode) {
    // 已经在当前场景中，无需重复处理，也不触发退出（顶部横幅已有专门的退出座位按钮）
    return;
  }
  emit('select-scene', gameType, sceneMode);
}

function getActionIcon(action?: string | null): string {
  if (action === 'tea') return '🍵';
  if (action === 'salute') return '👏';
  if (action === 'cheer') return '🪭';
  if (action === 'challenge') return '⚔️';
  if (action === 'gift') return '🧧';
  return '🏮';
}

function getPlayerSceneTag(gt?: string, mode?: string): string {
  if (!mode) return '大堂观局品茗';
  if (gt === 'mahjong' || mode.includes('hongzhong') || mode.includes('standard')) {
    if (mode.includes('hongzhong-6')) return '麻将·红中6码';
    if (mode.includes('hongzhong-10')) return '麻将·红中10码';
    return '麻将·普通场';
  }
  if (gt === 'shisanshui' || mode.includes('four') || mode.includes('eight')) {
    if (mode.includes('eight')) return '十三水·八人场';
    return '十三水·四人场';
  }
  if (gt === 'yansan' || mode.includes('yansan')) {
    if (mode.includes('20-40')) return '烟三·20-40分';
    if (mode.includes('10-20')) return '烟三·10-20分';
    return '烟三·5-10分';
  }
  return '在线组局';
}

function getSceneBadgeClass(gt?: string, mode?: string): string {
  if (!mode) return 'bg-[#EFE5D3] text-[#6B5744] border-[#D8C7B0]';
  if (mode === props.activeSceneMode) {
    return 'bg-amber-500/20 text-amber-900 border-amber-500/50 font-bold';
  }
  return 'bg-[#FAF4E8] text-[#3C2C1E] border-[#D8C7B0]';
}

function handleChatScroll() {
  if (!messageContainerRef.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.value;
  showScrollToBottom.value = scrollHeight - (scrollTop + clientHeight) > 120;
}

function scrollToBottom(force = false) {
  nextTick(() => {
    if (messageContainerRef.value) {
      if (force || !showScrollToBottom.value) {
        messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
        showScrollToBottom.value = false;
      }
    }
  });
}

function previewPhraseVoice(phraseText: string, roleObj?: VoiceRolePhrase) {
  if (soundPromptEnabled.value) soundFX.playTap();
  const pitch = roleObj?.pitch ?? 1.0;
  const rate = roleObj?.rate ?? 1.0;
  const isFemale = roleObj?.isFemale ?? false;
  soundFX.speakVoice(phraseText, pitch, rate, isFemale);
}

function replayPhraseVoice(m: ChatMessageItem) {
  activePlayingPhraseId.value = m.id;
  const text = m.phraseText || m.text.replace(/^[\[【][^\]】]+[\]】]\s*[“"']?/, '').replace(/[”"']\s*$/, '').trim();
  soundFX.speakVoice(text, m.pitch ?? 1.0, m.rate ?? 1.0, m.isFemale ?? false);
  setTimeout(() => {
    if (activePlayingPhraseId.value === m.id) {
      activePlayingPhraseId.value = null;
    }
  }, 3000);
}

function isPhraseMessage(text?: string): boolean {
  if (!text) return false;
  return (text.startsWith('[') && text.includes('音]') && text.includes('“')) ||
         text.includes('花儿都谢了') ||
         text.includes('牌打得太好') ||
         text.includes('风水轮流转') ||
         text.includes('专心打牌') ||
         text.includes('纵横牌坛') ||
         text.includes('血战到底');
}

function sendProvocativeSpokenPhrase(phraseText: string) {
  soundFX.speakVoice(phraseText);
  sendChatMessage(phraseText);
}

function sendSpokenPhraseWithVoiceRole(phraseText: string, roleObj: VoiceRolePhrase) {
  // 1. 本地立即触发真人快捷短语语音播报
  soundFX.speakVoice(phraseText, roleObj.pitch, roleObj.rate, roleObj.isFemale);
  if (soundPromptEnabled.value) soundFX.playTap();

  const displayTitle = `[${roleObj.roleIcon} ${roleObj.roleName}] “${phraseText}”`;
  const ts = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const msgObj: ChatMessageItem = {
    id: `m-${Date.now()}-${Math.random()}`,
    sender: props.currentUser.name || '牌友',
    avatar: props.currentUser.avatar || '👑',
    text: displayTitle,
    phraseText,
    roleId: roleObj.id,
    roleName: roleObj.roleName,
    roleIcon: roleObj.roleIcon,
    pitch: roleObj.pitch,
    rate: roleObj.rate,
    isFemale: roleObj.isFemale,
    voice: true,
    timestamp: ts,
    isSelf: true,
    channel: currentChannel.value === 'scene' ? 'scene' : 'hall',
    gameType: props.activeGameType,
    sceneMode: props.activeSceneMode,
  };
  chatMessages.value.push(msgObj);
  scrollToBottom(true);

  if (props.ws && props.ws.readyState === WebSocket.OPEN) {
    try {
      props.ws.send(JSON.stringify({
        type: 'scene_chat',
        gameType: props.activeGameType,
        sceneMode: props.activeSceneMode,
        channel: currentChannel.value === 'scene' ? 'scene' : 'hall',
        sender: props.currentUser.name,
        senderId: props.currentUser.id,
        avatar: props.currentUser.avatar || '👑',
        text: displayTitle,
        phraseText,
        voice: true,
        roleId: roleObj.id,
        roleName: roleObj.roleName,
        pitch: roleObj.pitch,
        rate: roleObj.rate,
        isFemale: roleObj.isFemale,
      }));
    } catch {}
  }
}

function sendChallengeOption(challengeText: string) {
  const cleanChallenge = challengeText.replace(/[⚔️🍵👏\s]/g, '');
  soundFX.speakVoice(cleanChallenge, 0.82, 1.02, false);
  sendActionMessage('challenge', challengeText, undefined, undefined, cleanChallenge);
}

function openPlayerModal(p: any) {
  selectedPlayerModal.value = p;
  if (soundPromptEnabled.value) soundFX.playTap();
}

function openPlayerModalByName(senderName: string, avatar?: string) {
  const found = (props.onlinePlayers || []).find(p => p.name === senderName);
  if (found) {
    openPlayerModal(found);
  } else {
    selectedPlayerModal.value = {
      id: `P-${senderName}`,
      name: senderName,
      avatar: avatar || '👑',
      coins: 8888,
      gameType: props.activeGameType,
      sceneMode: props.activeSceneMode,
    };
  }
}

function followPlayerScene(p: any) {
  if (p.gameType && p.sceneMode) {
    if (soundPromptEnabled.value) soundFX.playTap();
    selectedPlayerModal.value = null;
    showSceneSwitchModal.value = false;
    emit('select-scene', p.gameType, p.sceneMode);
  }
}

function selectSceneFromModal(gameType: string, sceneMode: string) {
  if (soundPromptEnabled.value) soundFX.playTap();
  showSceneSwitchModal.value = false;
  if (props.activeSceneMode === sceneMode && sceneMode !== '') {
    // 已经在该分场中，关闭弹窗即可，不误触退出座位
    return;
  }
  emit('select-scene', gameType, sceneMode);
}

function triggerChallengePost() {
  if (!hasJoinedScene.value) {
    micErrorTip.value = '⚠️ 请先选择游戏分场（例如：经典烟三 5--10分场）选台入座，再下战帖邀战！';
    showSceneSwitchModal.value = true;
    if (soundPromptEnabled.value) soundFX.playTap();
    return;
  }
  micErrorTip.value = '';
  if (soundPromptEnabled.value) soundFX.playVictory();

  const sceneName = activeSceneDisplayName.value;
  const challengeText = `⚔️ 在【${sceneName}】摆下战帖：“谁敢来与我一战到底！”`;

  sendActionMessage('challenge', challengeText, undefined, undefined);
}

function triggerActionToast(actionType: 'tea' | 'salute' | 'cheer' | 'challenge') {
  if (actionType === 'challenge') {
    triggerChallengePost();
    return;
  }
  let text = '';
  if (actionType === 'tea') {
    text = `🍵 向全场牌友敬上武夷大红袍，预祝满堂牌客旗开得胜！`;
    if (soundPromptEnabled.value) soundFX.playClink();
  } else if (actionType === 'salute') {
    text = `👏 拱手抱拳致意：“各位牌友幸会，今日手气正旺，过招请多指教！”`;
    if (soundPromptEnabled.value) soundFX.playTap();
  } else if (actionType === 'cheer') {
    text = `🪭 摇动金丝折扇，为全场牌友喝彩助威，手气连连！`;
    if (soundPromptEnabled.value) soundFX.playTap();
  }

  sendActionMessage(actionType, text, undefined, undefined);
}

function sendPlayerDirectAction(actionType: 'tea' | 'salute' | 'cheer' | 'challenge', targetPlayer: any) {
  if (actionType === 'challenge') {
    if (!hasJoinedScene.value) {
      micErrorTip.value = '⚠️ 请先选择游戏分场选台入座，再向牌友发送战帖！';
      showSceneSwitchModal.value = true;
      if (soundPromptEnabled.value) soundFX.playTap();
      return;
    }
    const sceneName = activeSceneDisplayName.value;
    const text = `⚔️ 向牌友 [${targetPlayer.name}] 发下【${sceneName}】战帖：可敢来与我一战到底？`;
    if (soundPromptEnabled.value) soundFX.playVictory();
    sendActionMessage('challenge', text, targetPlayer.name, targetPlayer.id);
    selectedPlayerModal.value = null;
    return;
  }

  let text = '';
  if (actionType === 'tea') {
    text = `🍵 特向牌友 [${targetPlayer.name}] 敬上一杯龙井：“阁下慢用，预祝旗开得胜！”`;
    if (soundPromptEnabled.value) soundFX.playClink();
  } else if (actionType === 'salute') {
    text = `👏 抱拳向牌友 [${targetPlayer.name}] 致意：“牌桌见真章，愿与阁下切磋一把！”`;
    if (soundPromptEnabled.value) soundFX.playTap();
  } else if (actionType === 'cheer') {
    text = `🪭 摇扇向牌友 [${targetPlayer.name}] 喝彩，祝阁下手气通天！`;
    if (soundPromptEnabled.value) soundFX.playTap();
  }

  sendActionMessage(actionType, text, targetPlayer.name, targetPlayer.id);
  selectedPlayerModal.value = null;
}

function acceptPlayerChallenge(m: ChatMessageItem) {
  if (!m.gameType || !m.sceneMode) return;
  if (soundPromptEnabled.value) soundFX.playVictory();

  // 1. Emit select-scene to join that exact game section & scene
  emit('select-scene', m.gameType, m.sceneMode);

  // 本地立即标记该战帖已被我应战
  m.challengeStatus = 'accepted';
  m.acceptedBy = { id: props.currentUser.id, name: props.currentUser.name };

  // 2. Notify server about accepting challenge
  if (props.ws && props.ws.readyState === WebSocket.OPEN) {
    try {
      props.ws.send(JSON.stringify({
        type: 'scene_accept_challenge',
        challengeId: m.challengeId || m.id,
        challengerName: m.sender,
        challengerId: m.senderId,
        acceptorName: props.currentUser.name,
        acceptorId: props.currentUser.id,
        gameType: m.gameType,
        sceneMode: m.sceneMode,
        sceneName: m.sceneName || getPlayerSceneTag(m.gameType, m.sceneMode),
      }));
    } catch {}
  }

  micErrorTip.value = `⚔️ 已成功应战！即刻与 [${m.sender}] 汇合入座【${m.sceneName || getPlayerSceneTag(m.gameType, m.sceneMode)}】！`;
  setTimeout(() => { micErrorTip.value = ''; }, 4000);
}

function sendActionMessage(action: 'tea' | 'salute' | 'cheer' | 'challenge' | 'gift', text: string, targetName?: string, targetId?: string) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const isChallenge = action === 'challenge';
  const targetChannel = isChallenge ? 'hall' : (currentChannel.value === 'scene' ? 'scene' : 'hall');
  const challengeId = isChallenge ? `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : undefined;

  // 如果是发新战帖：旧战帖若无人应战，必须直接清理删除，绝不标记覆盖作废，彻底防止刷屏满屏
  if (isChallenge) {
    chatMessages.value = chatMessages.value.filter((oldMsg) => {
      if (
        oldMsg.action === 'challenge' &&
        (oldMsg.sender === props.currentUser.name || oldMsg.senderId === props.currentUser.id)
      ) {
        if (oldMsg.acceptedBy) {
          // 已有牌友应战的战帖：转移给应战者继承守擂
          oldMsg.sender = oldMsg.acceptedBy.name;
          oldMsg.senderId = oldMsg.acceptedBy.id;
          oldMsg.challengeStatus = 'transferred';
          oldMsg.text = `⚔️ 在【${oldMsg.sceneName || '经典分场'}】由 [${oldMsg.acceptedBy.name}] 继承守擂：“谁来与我一战到底！”`;
          oldMsg.isSelf = false;
          return true;
        }
        // 未被应战的旧战帖：直接彻底清理删除，不显示作废，避免刷屏满屏
        return false;
      }
      return true;
    });
  }

  const msgObj: ChatMessageItem = {
    id: `m-${Date.now()}-${Math.random()}`,
    sender: props.currentUser.name || '牌友',
    senderId: props.currentUser.id,
    avatar: props.currentUser.avatar || '👑',
    text,
    timestamp: ts,
    isSelf: true,
    channel: targetChannel,
    action,
    targetPlayerName: targetName,
    gameType: props.activeGameType,
    sceneMode: props.activeSceneMode,
    sceneName: activeSceneDisplayName.value,
    challengeId,
    challengeStatus: isChallenge ? 'open' : undefined,
  };
  chatMessages.value.push(msgObj);
  scrollToBottom(true);

  if (props.ws && props.ws.readyState === WebSocket.OPEN) {
    try {
      props.ws.send(JSON.stringify({
        type: 'scene_chat',
        challengeId,
        gameType: props.activeGameType,
        sceneMode: props.activeSceneMode,
        sceneName: activeSceneDisplayName.value,
        channel: targetChannel, // 战帖消息固定广播至 hall 大堂频道，全服在线玩家均可接收！
        sender: props.currentUser.name,
        senderId: props.currentUser.id,
        avatar: props.currentUser.avatar || '👑',
        text,
        action,
        targetPlayerId: targetId || null,
        targetPlayerName: targetName || null,
      }));
    } catch {}
  }
}

function sendChatMessage(text: string) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const msgObj: ChatMessageItem = {
    id: `m-${Date.now()}-${Math.random()}`,
    sender: props.currentUser.name || '牌友',
    avatar: props.currentUser.avatar || '👑',
    text,
    timestamp: ts,
    isSelf: true,
    channel: currentChannel.value === 'scene' ? 'scene' : 'hall',
    gameType: props.activeGameType,
    sceneMode: props.activeSceneMode,
  };
  chatMessages.value.push(msgObj);
  if (soundPromptEnabled.value) soundFX.playTap();
  scrollToBottom(true);

  if (props.ws && props.ws.readyState === WebSocket.OPEN) {
    try {
      props.ws.send(JSON.stringify({
        type: 'scene_chat',
        gameType: props.activeGameType,
        sceneMode: props.activeSceneMode,
        channel: currentChannel.value === 'scene' ? 'scene' : 'hall',
        sender: props.currentUser.name,
        senderId: props.currentUser.id,
        avatar: props.currentUser.avatar || '👑',
        text,
      }));
    } catch {}
  }
}

function clearChatMessages() {
  chatMessages.value = [];
  showSettingsModal.value = false;
  if (soundPromptEnabled.value) soundFX.playTap();
}

function launchGameNow(dealOverride?: any) {
  if (!hasJoinedScene.value) return;
  const dealToUse = dealOverride || currentRoomDeal.value;
  if (dealToUse) {
    currentRoomDeal.value = dealToUse;
  }
  if (isStarting.value && !dealOverride) return;
  isStarting.value = true;
  soundFX.playVictory();
  emit('start-game', [...currentPlayers.value], currentRoomId.value, dealToUse);
}

// Voice recording implementation
async function acquireMicrophoneMediaStream(): Promise<MediaStream> {
  if (navigator?.mediaDevices?.getUserMedia) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    }
  }
  throw new Error('当前环境不支持录音功能');
}

async function startVoiceRecording() {
  if (isRecordingVoice.value) return;
  micErrorTip.value = '';
  try {
    const stream = await acquireMicrophoneMediaStream();
    voiceStream = stream;

    let recordStream: MediaStream = stream;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const actx = new AudioContextClass();
        if (actx.state === 'suspended') await actx.resume().catch(() => {});
        recordingAudioCtx = actx;
        const sourceNode = actx.createMediaStreamSource(stream);
        const gainNode = actx.createGain();
        gainNode.gain.value = 3.5;
        const compressor = actx.createDynamicsCompressor();
        sourceNode.connect(gainNode);
        gainNode.connect(compressor);
        const destNode = actx.createMediaStreamDestination();
        compressor.connect(destNode);
        if (destNode.stream && destNode.stream.getAudioTracks().length > 0) {
          recordStream = destNode.stream;
        }
      }
    } catch {}

    let recorder: MediaRecorder;
    try {
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
        for (const c of candidates) {
          if (MediaRecorder.isTypeSupported(c)) { mimeType = c; break; }
        }
      }
      recorder = mimeType ? new MediaRecorder(recordStream, { mimeType }) : new MediaRecorder(recordStream);
    } catch {
      recorder = new MediaRecorder(recordStream);
    }

    voiceRecorder = recorder;
    voiceChunks = [];
    voiceRecorder.ondataavailable = (e: any) => {
      if (e.data && e.data.size > 0) voiceChunks.push(e.data);
    };

    voiceRecorder.start(250);
    isRecordingVoice.value = true;
    recordingSeconds.value = 0;
    soundFX.startVoiceChatRecording();
    if (soundPromptEnabled.value) soundFX.playTap();

    if (recordingInterval) clearInterval(recordingInterval);
    recordingInterval = window.setInterval(() => {
      recordingSeconds.value += 1;
      if (recordingSeconds.value >= 20) {
        stopAndSendVoiceRecording();
      }
    }, 1000);
  } catch (err: any) {
    isRecordingVoice.value = false;
    soundFX.stopVoiceChatRecording();
    micErrorTip.value = '麦克风权限未开启或设备不支持';
    if (soundPromptEnabled.value) soundFX.playTap();
  }
}

function stopAndSendVoiceRecording() {
  if (!isRecordingVoice.value || !voiceRecorder) return;
  if (recordingInterval) { clearInterval(recordingInterval); recordingInterval = null; }
  const duration = Math.max(1, recordingSeconds.value);
  isRecordingVoice.value = false;
  recordingSeconds.value = 0;
  soundFX.stopVoiceChatRecording();

  voiceRecorder.onstop = () => {
    try {
      if (voiceStream) { voiceStream.getTracks().forEach((track: any) => track.stop()); voiceStream = null; }
      if (recordingAudioCtx) { try { recordingAudioCtx.close(); } catch {} recordingAudioCtx = null; }
      if (voiceChunks.length === 0) return;
      const audioBlob = new Blob(voiceChunks, { type: voiceRecorder?.mimeType || 'audio/webm' });
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
  try { voiceRecorder.stop(); } catch {}
  if (soundPromptEnabled.value) soundFX.playTap();
}

function cancelVoiceRecording() {
  if (recordingInterval) { clearInterval(recordingInterval); recordingInterval = null; }
  isRecordingVoice.value = false;
  recordingSeconds.value = 0;
  soundFX.stopVoiceChatRecording();
  if (voiceRecorder) { try { voiceRecorder.stop(); } catch {} voiceRecorder = null; }
  if (voiceStream) { try { voiceStream.getTracks().forEach((track: any) => track.stop()); } catch {} voiceStream = null; }
  if (recordingAudioCtx) { try { recordingAudioCtx.close(); } catch {} recordingAudioCtx = null; }
  voiceChunks = [];
  if (soundPromptEnabled.value) soundFX.playTap();
}

function sendVoiceBroadcastMessage(audioDataUrl: string, duration: number) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const msgItem: ChatMessageItem = {
    id: `m-${Date.now()}-${Math.random()}`,
    sender: props.currentUser.name || '牌友',
    avatar: props.currentUser.avatar || '👑',
    text: `🎤 [大堂语音广播 ${duration}s]`,
    timestamp: ts,
    isSelf: true,
    voice: true,
    audio: audioDataUrl,
    duration,
    channel: currentChannel.value === 'scene' ? 'scene' : 'hall',
    gameType: props.activeGameType,
    sceneMode: props.activeSceneMode,
  };

  chatMessages.value.push(msgItem);
  if (soundPromptEnabled.value) soundFX.playTap();
  scrollToBottom(true);

  if (props.ws && props.ws.readyState === WebSocket.OPEN) {
    try {
      props.ws.send(JSON.stringify({
        type: 'scene_chat',
        gameType: props.activeGameType,
        sceneMode: props.activeSceneMode,
        channel: currentChannel.value === 'scene' ? 'scene' : 'hall',
        sender: props.currentUser.name || '牌友',
        senderId: props.currentUser.id,
        avatar: props.currentUser.avatar || '👑',
        text: `🎤 [大堂语音广播 ${duration}s]`,
        voice: true,
        audio: audioDataUrl,
        duration,
      }));
    } catch {}
  }
}

function playVoiceMessage(m: ChatMessageItem) {
  if (!m.audio) return;
  if (activePlayingAudioMessageId.value === m.id) {
    if (activePlayingAudio) {
      activePlayingAudio.pause();
      activePlayingAudio = null;
    }
    activePlayingAudioMessageId.value = null;
    activePlayingVoice.value = null;
    return;
  }
  playVoiceBroadcast(m.audio, m.sender, m.duration || 2, m.id);
}

function playVoiceBroadcast(audioUrl: string, sender: string, duration = 2, messageId?: string) {
  try {
    if (activePlayingAudio) { try { activePlayingAudio.pause(); } catch {} activePlayingAudio = null; }
    soundFX.startVoiceChatPlayback();
    const audio = new Audio(audioUrl);
    audio.volume = 1.0;
    activePlayingAudio = audio;
    activePlayingVoice.value = { sender, duration: Math.max(1, duration) };
    if (messageId) activePlayingAudioMessageId.value = messageId;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const playCtx = new AudioContextClass();
        if (playCtx.state === 'suspended') playCtx.resume();
        const source = playCtx.createMediaElementSource(audio);
        const gainNode = playCtx.createGain();
        gainNode.gain.value = 2.5;
        source.connect(gainNode);
        gainNode.connect(playCtx.destination);
      }
    } catch {}

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
      activePlayingAudioMessageId.value = null;
      finishPlayback();
    };
    audio.onerror = () => {
      activePlayingVoice.value = null;
      activePlayingAudio = null;
      activePlayingAudioMessageId.value = null;
      finishPlayback();
    };
    audio.play().catch(() => {
      finishPlayback();
    });
  } catch {
    soundFX.stopVoiceChatPlayback();
  }
}

function handleWsMessage(event: MessageEvent) {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'scene_join_ack' || msg.type === 'scene_room_update' || msg.type === 'scene_room_full' || msg.type === 'scene_room_started' || msg.type === 'game_deal') {
      if (!hasJoinedScene.value) return;
      if (msg.gameType === props.activeGameType && msg.sceneMode === props.activeSceneMode) {
        const isMyRoom = Boolean(msg.roomId && currentRoomId.value && msg.roomId === currentRoomId.value);
        const isMeInPlayers = Array.isArray(msg.players) && msg.players.some((p: any) =>
          (props.currentUser?.id && (p.id === props.currentUser.id || p.originalId === props.currentUser.id || (typeof p.id === 'string' && (p.id.startsWith(props.currentUser.id) || props.currentUser.id.startsWith(p.id))))) ||
          (props.currentUser?.name && (p.name === props.currentUser.name || (p as any).originalName === props.currentUser.name || (typeof p.name === 'string' && (p.name.startsWith(props.currentUser.name) || props.currentUser.name.startsWith(p.name)))))
        );
        if (!isMyRoom && !isMeInPlayers && currentRoomId.value) return;

        if (msg.roomId) currentRoomId.value = msg.roomId;
        if (msg.deal) currentRoomDeal.value = msg.deal;
        if (Array.isArray(msg.players)) {
          const targetMax = (props.activeGameType === 'shisanshui' && props.activeSceneMode?.includes('eight')) ? 8 : 4;
          currentPlayers.value = msg.players.slice(0, targetMax);
          if (msg.type === 'scene_room_full' || msg.type === 'scene_room_started' || currentPlayers.value.length >= targetMax) {
            launchGameNow(msg.deal);
          }
        }
      }
    } else if (msg.type === 'challenge_status_update') {
      if (msg.status === 'removed' || msg.status === 'overwritten') {
        // 未被应战的旧战帖：直接从消息列表中清理删除，不显示作废，彻底防止刷屏
        chatMessages.value = chatMessages.value.filter((m) => {
          if (msg.challengeId && (m.challengeId === msg.challengeId || m.id === msg.challengeId)) {
            return false;
          }
          if (
            m.action === 'challenge' &&
            (m.sender === msg.senderName || m.senderId === msg.senderId) &&
            (!msg.sceneMode || m.sceneMode === msg.sceneMode) &&
            !m.acceptedBy
          ) {
            return false;
          }
          return true;
        });
      } else {
        const match = chatMessages.value.find(
          (m) =>
            (msg.challengeId && (m.challengeId === msg.challengeId || m.id === msg.challengeId)) ||
            (m.action === 'challenge' &&
              (m.sender === msg.senderName || m.senderId === msg.senderId) &&
              m.sceneMode === msg.sceneMode)
        );
        if (match) {
          if (msg.status === 'transferred') {
            match.challengeStatus = 'transferred';
            if (msg.newSenderName) match.sender = msg.newSenderName;
            if (msg.newSenderId) match.senderId = msg.newSenderId;
            match.text =
              msg.text ||
              `⚔️ 在【${msg.sceneName || match.sceneName}】由 [${msg.newSenderName}] 继承守擂：“谁来与我一战到底！”`;
            match.isSelf =
              msg.newSenderId === props.currentUser.id || msg.newSenderName === props.currentUser.name;
          } else if (msg.status === 'accepted') {
            match.challengeStatus = 'accepted';
            if (msg.acceptedBy) match.acceptedBy = msg.acceptedBy;
          }
        }
      }
    } else if (msg.type === 'scene_chat_broadcast') {
      const isMyOwnMessage = (msg.senderId && msg.senderId === props.currentUser.id) ||
                            (msg.sender && msg.sender === props.currentUser.name);
      
      if (msg.audio && !isMyOwnMessage && autoPlayVoice.value) {
        playVoiceBroadcast(msg.audio, msg.sender, msg.duration || 1);
        if (soundPromptEnabled.value) soundFX.playTap();
      }

      if (!isMyOwnMessage) {
        const ts = msg.timestamp || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const newMsg: ChatMessageItem = {
          id: `m-${Date.now()}-${Math.random()}`,
          sender: msg.sender || '牌友',
          senderId: msg.senderId || undefined,
          avatar: msg.avatar || '👑',
          text: msg.text || (msg.audio ? '🎙️ [大堂语音]' : '...'),
          timestamp: ts,
          isSelf: false,
          channel: msg.channel || 'hall',
          voice: !!msg.audio,
          audio: msg.audio || undefined,
          duration: msg.duration || undefined,
          action: msg.action || null,
          targetPlayerName: msg.targetPlayerName || undefined,
          gameType: msg.gameType,
          sceneMode: msg.sceneMode,
          sceneName: msg.sceneName || undefined,
          challengeId: msg.challengeId || undefined,
          challengeStatus: msg.action === 'challenge' ? 'open' : undefined,
        };

        chatMessages.value.push(newMsg);

        // Sound effect on receiving message
        if (soundPromptEnabled.value && !msg.audio) {
          if (msg.action === 'tea') soundFX.playClink();
          else if (msg.action === 'challenge') soundFX.playVictory();
          else soundFX.playTap();
        }

        // Handle unread counts when not on this channel
        if (newMsg.channel === 'scene' && currentChannel.value !== 'scene') {
          unreadCountScene.value += 1;
        } else if (newMsg.channel === 'hall' && currentChannel.value !== 'hall') {
          unreadCountHall.value += 1;
        }

        scrollToBottom();
      }
    } else if (msg.type === 'chat_broadcast') {
      // Administrative announcement / system broadcast
      const ts = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      chatMessages.value.push({
        id: `notice-${Date.now()}`,
        sender: msg.message?.sender || '茶楼通告',
        avatar: msg.message?.avatar || '📢',
        text: msg.message?.text || msg.message || '系统通告',
        timestamp: ts,
        isSelf: false,
        channel: 'notice',
        type: 'notice',
      });
      scrollToBottom();
    }
  } catch {}
}

onMounted(() => {
  if (props.ws) {
    props.ws.addEventListener('message', handleWsMessage);
  }
});

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer);
  if (recordingInterval) clearInterval(recordingInterval);
  if (voiceStream) { try { voiceStream.getTracks().forEach((track: any) => track.stop()); } catch {} }
  if (recordingAudioCtx) { try { recordingAudioCtx.close(); } catch {} }
  if (activePlayingAudio) { try { activePlayingAudio.pause(); } catch {} }
  if (props.ws) {
    try { props.ws.removeEventListener('message', handleWsMessage); } catch {}
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scaleUp {
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.15s ease-out forwards;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
