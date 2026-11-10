<template>
  <div
    ref="containerRef"
    class="w-full h-full select-none absolute inset-0 overflow-hidden flex items-center justify-center"
    :style="{
      backgroundColor: props.tableTheme?.feltColor || '#E8DCC0',
      background: `radial-gradient(ellipse at 50% 45%, ${props.tableTheme?.highlightColor || '#FAF4E8'} 0%, ${props.tableTheme?.feltColor || '#E8DCC0'} 60%, ${props.tableTheme?.edgeColor || '#D2C4A6'} 100%)`
    }"
  >
    <!-- Fullscreen Card Table Surface with In-Table Action Overlay -->
    <div class="w-full h-full absolute inset-0 overflow-hidden flex items-center justify-center">
      <canvas
        ref="canvasRef"
        @click="onCanvasClick"
        @pointerdown="onCanvasClick"
        class="w-full h-full absolute inset-0 block cursor-pointer"
      ></canvas>

      <!-- Realistic 3D Mahjong Dice Cup Overlay (打色子定庄动效) -->
      <div
        v-if="dealingPhase === 'rolling_dice' && !hasWon && !isDrawStalemate"
        class="absolute inset-0 z-30 flex flex-col items-center justify-center p-3 select-none pointer-events-auto bg-black/65 backdrop-blur-xs"
      >
        <MahjongDiceCup
          :d1="dealerDice?.d1 || 1"
          :d2="dealerDice?.d2 || 1"
          :dealer-seat="dealerSeat"
          :is-dealer-continuing="isDealerContinuing"
          :title="isDealerContinuing ? `【${SEAT_NAMES[dealerSeat]}】连庄掷骰 · 确定起牌开门` : '打色子定庄 · 开门取牌'"
          :room-players="props.roomPlayers"
          @roll-finished="startDealingTilesAnimation"
          @skip="skipDealingAnimation"
        />
      </div>

      <!-- Dealing & Sorting Stage Overlay (抓牌理牌动效) -->
      <div
        v-else-if="dealingPhase !== 'playing' && !hasWon && !isDrawStalemate"
        class="absolute inset-0 pointer-events-none z-25 flex flex-col items-center justify-center select-none backdrop-blur-xs bg-black/55"
      >
        <div
          class="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#1C120C]/95 border-2 border-amber-400/80 backdrop-blur-md shadow-[0_16px_40px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.3)] pointer-events-auto transition-all transform scale-100 max-w-sm sm:max-w-md w-full mx-4"
        >
          <!-- Top Header Tag & Skip Button -->
          <div class="w-full flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20 text-xs">
            <span class="text-amber-300 font-serif-title font-bold flex items-center gap-1.5">
              <span class="text-base animate-pulse">🀄</span>
              <span v-if="dealingPhase === 'dealing_tiles'">四道抓牌 · 牌背朝上发牌</span>
              <span v-else>整牌理牌 · 翻面亮牌</span>
            </span>
            <button
              type="button"
              @click="skipDealingAnimation"
              class="px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
              title="跳过发牌动画，直接进入对局"
            >
              <span>跳过</span>
              <span>⏩</span>
            </button>
          </div>

          <div class="text-center w-full py-1">
            <div class="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-serif-title drop-shadow mb-1">
              🎯 【{{ SEAT_NAMES[dealerSeat] }}】坐庄起手率先出牌
            </div>
            <div class="text-[11px] text-[#D4C3B3] font-mono">
              {{ dealingPhase === 'dealing_tiles' ? '四方茶客依序抓牌中...' : '整牌排理完毕，翻面开局！' }}
            </div>

            <!-- Dealing 4-Wave Progress Indicator -->
            <div class="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-mono">
              <span
                class="px-2 py-0.5 rounded-lg border transition-all"
                :class="myHandDealtCount >= 4 ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/60 font-bold' : 'bg-white/5 text-white/35 border-white/10'"
              >1巡4张</span>
              <span class="text-white/30">→</span>
              <span
                class="px-2 py-0.5 rounded-lg border transition-all"
                :class="myHandDealtCount >= 8 ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/60 font-bold' : 'bg-white/5 text-white/35 border-white/10'"
              >2巡8张</span>
              <span class="text-white/30">→</span>
              <span
                class="px-2 py-0.5 rounded-lg border transition-all"
                :class="myHandDealtCount >= 12 ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/60 font-bold' : 'bg-white/5 text-white/35 border-white/10'"
              >3巡12张</span>
              <span class="text-white/30">→</span>
              <span
                class="px-2 py-0.5 rounded-lg border transition-all"
                :class="myHandDealtCount >= 13 ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/60 font-bold' : 'bg-white/5 text-white/35 border-white/10'"
              >4巡13张</span>
              <span class="text-white/30">→</span>
              <span
                class="px-2 py-0.5 rounded-lg border transition-all"
                :class="(dealerSeat === 0 ? myHandDealtCount >= 14 : oppHandsDealtCount[dealerSeat - 1] >= 14) ? 'bg-amber-500/35 text-amber-300 border-amber-500/60 font-black' : 'bg-white/5 text-white/35 border-white/10'"
              >跳牌14张</span>
            </div>
          </div>
        </div>
      </div>

      <!-- In-Table Integrated Action Buttons (Centered under player's hand for Peng/Gang/Hu/Pass claims) -->
      <div
        v-if="!hasWon && dealingPhase === 'playing' && (canPeng || canGang || canHu || isClaiming)"
        class="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-2.5 pointer-events-auto justify-center flex-wrap"
      >
        <!-- Peng (Allowed) with tile name -->
        <button
          v-if="canPeng"
          key="peng-btn"
          type="button"
          @click="handlePeng"
          class="px-4 sm:px-5 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-2 border-emerald-300 shadow-[0_4px_16px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all animate-bounce cursor-pointer flex items-center gap-1.5"
        >
          <span>碰牌</span>
          <span v-if="lastDiscarded" class="text-amber-200 text-xs font-mono font-bold">【{{ lastDiscarded.text }}】</span>
        </button>

        <!-- Gang (Allowed) with tile name -->
        <button
          v-if="canGang"
          key="gang-btn"
          type="button"
          @click="handleGang"
          class="px-4 sm:px-5 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-2 border-amber-300 shadow-[0_4px_16px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all animate-bounce cursor-pointer flex items-center gap-1.5"
        >
          <span>杠牌</span>
          <span v-if="lastDiscarded && turnPlayer !== 0" class="text-amber-200 text-xs font-mono font-bold">【{{ lastDiscarded.text }}】</span>
        </button>

        <!-- Pass Claim Button (过) -->
        <button
          v-if="isClaiming && (canPeng || canGang)"
          key="pass-btn"
          type="button"
          @click="handlePassClaim"
          class="px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl bg-gray-800/90 hover:bg-gray-700 text-gray-200 border border-white/20 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
          title="放弃碰杠，继续对局"
        >
          <span>过</span>
          <span class="text-amber-300 font-mono font-bold text-xs tabular-nums">({{ claimCountdown }}s)</span>
        </button>

        <!-- Hu (Strictly Self-Draw 自摸 only, no Pao Hu) -->
        <button
          v-if="canHu"
          key="hu-btn"
          type="button"
          @click="handleHu"
          class="px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_4px_20px_rgba(239,68,68,0.7)] hover:scale-110 active:scale-95 transition-all ring-2 ring-red-300 animate-pulse cursor-pointer"
        >
          自摸胡牌！🀄
        </button>
      </div>

      <!-- Long-standing Persistent Auto-Host Controls (Placed on Bottom-Left to prevent misclicking rightmost drawn tile) -->
      <div
        v-if="!hasWon && !isDrawStalemate && dealingPhase === 'playing'"
        class="absolute bottom-4 sm:bottom-6 z-30 pointer-events-auto transition-all"
        :class="isAutoHost ? 'left-1/2 -translate-x-1/2' : 'left-4 sm:left-6'"
      >
        <!-- Cancel Auto-Host Button -->
        <button
          v-if="isAutoHost"
          type="button"
          @click="cancelAutoHost"
          class="px-5 py-2 text-xs sm:text-sm font-extrabold rounded-full bg-gradient-to-r from-red-600 via-amber-600 to-orange-500 hover:from-red-500 hover:to-amber-400 text-white border-2 border-amber-300 shadow-[0_4px_20px_rgba(239,68,68,0.7)] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>⚡ 自动托管中...</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/40 text-amber-200 border border-white/20 font-bold hover:bg-black/70">取消托管</span>
        </button>

        <!-- Standalone Persistent Auto-Host Button (Left-4 sm:left-6) -->
        <button
          v-else
          type="button"
          @click="toggleAutoHost"
          class="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-2xl bg-[#241B14]/90 hover:bg-[#32251B] text-amber-300 border-2 border-amber-500/60 hover:border-amber-400 shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          title="开启智能托管：以麻将向听数、多门叫听与防守逻辑全自动代打"
        >
          <span class="text-amber-400">⚡</span>
          <span class="font-serif font-bold">托管</span>
        </button>
      </div>



      <!-- Integrated Single-Layer Settlement Overlay (羊皮纸典雅茶楼主题，高对比度清晰排版，零滚动全显) -->
      <div
        v-if="hasWon"
        class="absolute inset-0 z-40 flex items-center justify-center p-1 sm:p-2 select-none bg-black/75 backdrop-blur-md overflow-hidden"
      >
        <div
          class="w-full max-w-4xl max-h-[98%] sm:max-h-[96%] rounded-xl sm:rounded-2xl border-2 border-[#C89B3C] shadow-[0_20px_60px_rgba(30,20,10,0.65),0_0_35px_rgba(200,155,60,0.25)] flex flex-col justify-between p-2 sm:p-2.5 gap-1 sm:gap-1.5 overflow-hidden text-[#3C2C1E] my-auto relative"
          :style="{
            backgroundColor: '#EFE5D3',
            backgroundImage: `radial-gradient(ellipse at 50% 30%, #FAF4E8 0%, #EFE5D3 65%, #E5D7C2 100%), url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.035'/%3E%3C/svg%3E&quot;)`
          }"
        >
          <!-- 1. Header: 结果状态、庄位与输赢筹码 (高度紧凑，底边距压缩) -->
          <div class="flex items-center justify-between gap-2 pb-1 border-b border-[#D8C7B0] shrink-0">
            <!-- Left: Result Title & Winner Info -->
            <div class="flex items-center gap-2 text-left">
              <span class="text-2xl sm:text-3xl filter drop-shadow-xs">
                {{ winningBreakdown.rewardCoins > 0 ? '🏆' : '🍂' }}
              </span>
              <div>
                <div class="flex items-center gap-1.5">
                  <h3 class="text-sm sm:text-base md:text-lg font-black text-[#8B2516] font-serif-title tracking-wide leading-none">
                    {{ winningBreakdown.isFourHongzhong
                      ? '四张红中 · 天降大满贯！'
                      : (winningBreakdown.winnerSeat === 0 ? '自摸和牌 · 雀圣大捷！' : `【${SEAT_NAMES[winningBreakdown.winnerSeat ?? 0]}】自摸和牌`) }}
                  </h3>
                  <span
                    class="px-1.5 py-0.2 rounded text-[10px] sm:text-xs font-bold leading-none"
                    :class="winningBreakdown.winnerSeat === 0 ? 'bg-[#FAF0E2] text-[#8B2516] border border-[#C89B3C]/70' : 'bg-[#E5D7C2] text-[#5C4533] border border-[#D8C7B0]'"
                  >
                    {{ winningBreakdown.winnerSeat === 0 ? '本席自摸' : '对手自摸' }}
                  </span>
                </div>
                <p class="text-[11px] sm:text-xs text-[#6B5744] font-medium mt-0.5 leading-tight">
                  底分 10 分 · 下局由自摸者【{{ SEAT_NAMES[winningBreakdown.winnerSeat ?? (lastWinnerSeat ?? dealerSeat)] }}】坐庄率先出牌
                </p>
              </div>
            </div>

            <!-- Right: Hit Ma & Reward Coins Badges (High Contrast, Bold Numbers, Compact) -->
            <div class="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <!-- Hit Ma Pill -->
              <div class="px-2 py-0.5 sm:py-1 rounded-lg bg-[#E6F4EA] border border-[#34A853]/60 text-[#137333] flex items-center gap-1 shadow-xs font-bold">
                <span class="text-[11px] sm:text-xs">🎯 中码:</span>
                <span class="text-xs sm:text-sm font-mono font-black text-[#137333]">
                  {{ winningBreakdown.hitMaCount }} / {{ winningBreakdown.maCount }} 码
                </span>
              </div>

              <!-- Coins Won/Lost Pill -->
              <div
                class="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 shadow-xs"
                :class="winningBreakdown.rewardCoins >= 0
                  ? 'bg-[#FEF7E0] border border-[#F9AB00] text-[#B06000]'
                  : 'bg-[#FCE8E6] border border-[#EA4335] text-[#C5221F]'"
              >
                <span class="text-[11px] sm:text-xs font-bold">🪙 {{ winningBreakdown.rewardCoins >= 0 ? '赢得:' : '扣除:' }}</span>
                <span
                  class="text-sm sm:text-base font-mono font-black tabular-nums"
                  :class="winningBreakdown.rewardCoins >= 0 ? 'text-[#B06000]' : 'text-[#C5221F]'"
                >
                  {{ winningBreakdown.rewardCoins >= 0 ? `+${winningBreakdown.rewardCoins}` : `${winningBreakdown.rewardCoins}` }} 分
                </span>
                <span class="text-[10px] opacity-80 font-normal">
                  ({{ winningBreakdown.payoutPerOpponent }}分/家)
                </span>
              </div>
            </div>
          </div>

          <!-- 2. Winner Hand & Melds (单层平铺，紧凑内边距与精确高度) -->
          <div class="flex flex-col gap-0.5 shrink-0 bg-[#FAF4E8]/95 rounded-lg sm:rounded-xl px-2 py-1 border border-[#D8C7B0] shadow-xs">
            <div class="flex items-center justify-between text-[11px] sm:text-xs text-[#78350F] font-bold font-serif-title leading-tight">
              <span class="flex items-center gap-1">
                <span>🀄</span>
                <span>【{{ SEAT_NAMES[winningBreakdown.winnerSeat ?? 0] }}】胡牌手牌与亮副全貌</span>
              </span>
              <span class="text-[#78695C] font-mono text-[10px]">
                共 {{ ((winningBreakdown.winnerSeat ?? 0) === 0 ? myHand.length : (oppHands[(winningBreakdown.winnerSeat ?? 1) - 1]?.length || 0)) + (((winningBreakdown.winnerSeat ?? 0) === 0 ? meldedTiles : (oppMelds[(winningBreakdown.winnerSeat ?? 1) - 1] || [])).length * 3) }} 张
              </span>
            </div>

            <!-- Single Row of Tiles: Melds + Standing Hand Tiles -->
            <div class="flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 max-w-full">
              <!-- Melded sets (碰/杠亮副) -->
              <template v-for="(set, sIdx) in (winningBreakdown.winnerSeat === 0 ? meldedTiles : (oppMelds[(winningBreakdown.winnerSeat ?? 1) - 1] || []))" :key="`meld-${sIdx}`">
                <div class="flex items-center gap-0.5 bg-[#EFE5D3] px-1 py-0.5 rounded-lg border border-[#C89B3C]/50 shrink-0">
                  <span class="text-[9px] font-bold text-[#8B2516] mr-0.5">{{ set.length === 4 ? '杠' : '碰' }}</span>
                  <template v-for="(tile, tIdx) in set" :key="`meld-t-${tIdx}`">
                    <div class="relative h-[34px] sm:h-[40px] w-[23px] sm:w-[27px] rounded bg-gradient-to-b from-[#FFFDF8] via-[#FAF4E8] to-[#EFE2C8] border border-[#C89B3C]/90 shadow-2xs flex items-center justify-center p-0.5 shrink-0">
                      <img :src="getMahjongImagePath(tile)" :alt="tile.text" class="w-full h-full object-contain pointer-events-none drop-shadow-2xs" />
                    </div>
                  </template>
                </div>
              </template>

              <!-- Melds divider if any -->
              <div
                v-if="(winningBreakdown.winnerSeat === 0 ? meldedTiles : (oppMelds[(winningBreakdown.winnerSeat ?? 1) - 1] || [])).length > 0"
                class="w-px h-6 bg-[#D8C7B0] shrink-0 mx-0.5"
              ></div>

              <!-- Hand Standing Tiles -->
              <template v-for="(tile, tIdx) in ((winningBreakdown.winnerSeat ?? 0) === 0 ? myHand : (oppHands[(winningBreakdown.winnerSeat ?? 1) - 1] || []))" :key="tile.id || `hand-${tIdx}`">
                <div class="relative h-[38px] sm:h-[46px] w-[26px] sm:w-[32px] shrink-0 rounded-md sm:rounded-lg bg-gradient-to-b from-[#FFFDF8] via-[#FAF4E8] to-[#EFE2C8] border border-[#C89B3C]/80 shadow-xs flex items-center justify-center p-0.5">
                  <img :src="getMahjongImagePath(tile)" :alt="tile.text" class="w-full h-full object-contain drop-shadow-2xs pointer-events-none" />
                </div>
              </template>
            </div>
          </div>

          <!-- 3. Reward Ma Tiles (开码结算：横幅间距压缩，单行平铺，牌名牌面全显) -->
          <div class="flex flex-col gap-0.5 shrink-0 bg-[#FAF4E8]/95 rounded-lg sm:rounded-xl px-2 py-1 border border-[#D8C7B0] shadow-xs">
            <div class="flex items-center justify-between text-[11px] sm:text-xs leading-tight">
              <span class="flex items-center gap-1.5 font-bold font-serif-title text-[#78350F]">
                <span>🎯</span>
                <span>开码奖码结果</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FEF7E0] text-[#B06000] border border-[#F9AB00]/50 font-mono font-bold">
                  开 {{ winningBreakdown.maCount }} 码 · 命中 {{ winningBreakdown.hitMaCount }} 码
                </span>
              </span>
              <span class="text-[10px] sm:text-[11px] text-[#6B5744] font-mono">
                {{ winningBreakdown.isFourHongzhong ? '🌟 四张红中：所有开码全中满贯！' : '命中【一、五、九、东风、红中】每中1码+10分' }}
              </span>
            </div>

            <!-- Opened Ma Tiles Row (Horizontal centered, sized compactly for absolute zero vertical overflow) -->
            <div class="flex items-center justify-center gap-1 sm:gap-2 flex-wrap py-0.5">
              <template v-for="(tile, idx) in (winningBreakdown.rewardMaTiles || [])" :key="tile.id || `ma-${idx}`">
                <div
                  class="relative flex flex-col items-center justify-between rounded-lg p-0.5 transition-all shadow-xs select-none"
                  :class="isYiWuJiuMa(tile)
                    ? 'bg-gradient-to-b from-[#FEF3C7] to-[#FDE68A] border-2 border-[#D97706] ring-1 ring-[#D97706]/50 shadow-xs scale-102'
                    : 'bg-[#F5EFE6] border border-[#D8C7B0] opacity-70'"
                >
                  <!-- Hit status badge -->
                  <div
                    v-if="isYiWuJiuMa(tile)"
                    class="bg-gradient-to-r from-[#DC2626] to-[#EA580C] text-white font-black text-[8px] sm:text-[9px] px-1 py-0.1 rounded-full shadow-xs border border-[#FDE68A] animate-pulse whitespace-nowrap mb-0.5"
                  >
                    🔥 +10
                  </div>
                  <div
                    v-else
                    class="text-[7px] sm:text-[8px] text-[#78695C] font-bold px-0.5 rounded bg-[#E5D7C2] border border-[#D8C7B0] whitespace-nowrap mb-0.5"
                  >
                    未中
                  </div>

                  <!-- Tile Image Container -->
                  <div class="h-[34px] sm:h-[40px] w-[24px] sm:w-[28px] rounded bg-gradient-to-b from-[#FFFDF8] via-[#FAF4E8] to-[#EFE2C8] border border-[#C89B3C] flex items-center justify-center p-0.5 shadow-2xs">
                    <img
                      :src="getMahjongImagePath(tile)"
                      :alt="tile.text"
                      class="w-full h-full object-contain drop-shadow-2xs pointer-events-none"
                    />
                  </div>

                  <!-- Tile Label Text (清晰中文牌名) -->
                  <span
                    class="text-[9px] sm:text-[10px] font-bold mt-0.5 font-mono leading-none"
                    :class="isYiWuJiuMa(tile) ? 'text-[#92400E] font-black' : 'text-[#78695C]'"
                  >
                    {{ tile.text }}
                  </span>
                </div>
              </template>
            </div>
          </div>

          <!-- 4. Formula & 4-Player Settlement Row (四方结算明细与公式，横向并排紧凑不占高度) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5 shrink-0">
            <!-- Left: Formula Breakdown & Fans Chips -->
            <div class="bg-[#FAF4E8]/95 rounded-lg px-2 py-1 border border-[#D8C7B0] shadow-xs flex flex-col justify-between gap-1">
              <div class="flex items-center gap-1 text-[11px] sm:text-xs font-mono text-[#5C4533] leading-tight">
                <span class="text-[#78350F] font-bold">📐 计分：</span>
                <span>
                  底分 10 + 中码 {{ winningBreakdown.hitMaCount }}×10
                  <template v-if="winningBreakdown.kongBonusTotal && winningBreakdown.kongBonusTotal > 0">
                    <strong class="text-[#D97706] font-bold"> + 杠分 ({{ winningBreakdown.kongBonusTotal }})</strong>
                  </template>
                  = <strong class="text-[#8B2516] font-bold">{{ winningBreakdown.payoutPerOpponent }}分/家</strong>
                </span>
              </div>
              <div class="flex items-center gap-1 flex-wrap">
                <span class="text-[10px] font-bold text-[#78695C]">明细:</span>
                <span
                  v-for="(fan, fIdx) in winningBreakdown.fans"
                  :key="`fan-${fIdx}`"
                  class="px-1.5 py-0.2 rounded bg-[#EFE5D3] text-[#78350F] border border-[#C89B3C]/40 text-[10px] sm:text-[11px] font-medium leading-none"
                >
                  {{ fan }}
                </span>
              </div>
            </div>

            <!-- Right: 4-Seat Settlement Overview -->
            <div class="bg-[#FAF4E8]/95 rounded-lg px-2 py-1 border border-[#D8C7B0] shadow-xs flex flex-col justify-between gap-1">
              <div class="text-[11px] sm:text-xs font-bold text-[#78350F] font-serif-title flex items-center justify-between leading-tight">
                <span>四席筹码结算收支</span>
                <span class="text-[10px] text-[#78695C] font-mono font-normal">实时核算</span>
              </div>
              <div class="grid grid-cols-4 gap-1 text-center">
                <!-- Seat 0: You -->
                <div
                  class="rounded p-0.5 sm:p-1 border"
                  :class="winningBreakdown.rewardCoins >= 0
                    ? 'border-[#34A853]/60 bg-[#E6F4EA]/60 text-[#137333]'
                    : 'border-[#EA4335]/40 bg-[#FCE8E6]/60 text-[#C5221F]'"
                >
                  <div class="text-[9px] sm:text-[10px] text-[#5C4533] font-medium leading-none">本席</div>
                  <div
                    class="text-[10px] sm:text-xs font-bold font-mono tabular-nums mt-0.5 leading-none"
                    :class="winningBreakdown.rewardCoins >= 0 ? 'text-[#137333]' : 'text-[#C5221F]'"
                  >
                    {{ winningBreakdown.rewardCoins >= 0 ? `+${winningBreakdown.rewardCoins}` : winningBreakdown.rewardCoins }}
                  </div>
                </div>

                <!-- Opponents 1, 2, 3 (East, North, West) -->
                <template v-for="(oppSeat, oIdx) in [1, 2, 3]" :key="`seat-${oppSeat}`">
                  <div
                    class="rounded p-0.5 sm:p-1 border"
                    :class="(winningBreakdown.netCoinsPerSeat ? winningBreakdown.netCoinsPerSeat[oppSeat] >= 0 : (winningBreakdown.winnerSeat === oppSeat))
                      ? 'border-[#34A853]/60 bg-[#E6F4EA]/60 text-[#137333]'
                      : 'border-[#D8C7B0] bg-[#FFFDF8] text-[#5C4533]'"
                  >
                    <div class="text-[9px] sm:text-[10px] text-[#6B5744] font-medium truncate leading-none">
                      {{ ['东席', '北席', '西席'][oIdx] }}
                    </div>
                    <div
                      class="text-[10px] sm:text-xs font-bold font-mono tabular-nums mt-0.5 leading-none"
                      :class="(winningBreakdown.netCoinsPerSeat ? winningBreakdown.netCoinsPerSeat[oppSeat] >= 0 : (winningBreakdown.winnerSeat === oppSeat))
                        ? 'text-[#137333]'
                        : 'text-[#5C4533]'"
                    >
                      <template v-if="winningBreakdown.netCoinsPerSeat">
                        {{ winningBreakdown.netCoinsPerSeat[oppSeat] >= 0 ? `+${winningBreakdown.netCoinsPerSeat[oppSeat]}` : winningBreakdown.netCoinsPerSeat[oppSeat] }}
                      </template>
                      <template v-else>
                        {{ winningBreakdown.winnerSeat === oppSeat ? `+${winningBreakdown.payoutPerOpponent * 3}` : `-${winningBreakdown.payoutPerOpponent}` }}
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- 5. Action Buttons (底部操作，紧凑高度，双按钮分明) -->
          <div class="flex items-center justify-between gap-2 pt-1 border-t border-[#D8C7B0] shrink-0">
            <button
              type="button"
              @click="handleLeaveToLobby"
              class="px-3.5 sm:px-4 py-1.5 rounded-lg bg-[#E5D7C2] hover:bg-[#D8C7B0] text-[#3C2C1E] border border-[#C89B3C]/60 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>🚪</span>
              <span>退出大厅</span>
            </button>

            <button
              type="button"
              @click="onRestartGame"
              :disabled="hasClickedReady"
              class="px-5 sm:px-8 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-black rounded-lg shadow-md ring-1 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              :class="hasClickedReady
                ? 'bg-[#137333] text-white ring-emerald-300 opacity-90'
                : 'bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#B45309] hover:from-[#92400E] hover:to-[#B45309] text-white shadow-amber-700/30 ring-amber-300'"
            >
              <span>{{ hasClickedReady ? `✅ 已准备 · 等待牌友 (${readyPlayersCount}/4)...` : '继续下一局 🀄 ➔' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Stalemate Overlay (when wall runs out) -->
      <div
        v-if="isDrawStalemate"
        class="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 select-none bg-black/75 backdrop-blur-md"
      >
        <div
          class="w-full max-w-md rounded-2xl border-2 border-[#C89B3C] shadow-2xl p-5 text-center flex flex-col items-center gap-3 text-[#3C2C1E]"
          :style="{
            backgroundColor: '#EFE5D3',
            backgroundImage: `radial-gradient(ellipse at 50% 30%, #FAF4E8 0%, #EFE5D3 65%, #E5D7C2 100%), url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.035'/%3E%3C/svg%3E&quot;)`
          }"
        >
          <div class="text-4xl filter drop-shadow-xs">🀄 🌪️</div>
          <div>
            <h3 class="text-lg sm:text-xl font-black text-[#8B2516] font-serif-title">
              荒牌流局
            </h3>
            <p class="text-xs sm:text-sm text-[#5C4533] mt-1 font-medium">
              牌墙已摸空，无人自摸，本局平手！
            </p>
          </div>
          <div class="flex items-center gap-3 w-full mt-2 justify-center">
            <button
              type="button"
              @click="handleLeaveToLobby"
              class="px-4 py-2 bg-[#E5D7C2] hover:bg-[#D8C7B0] text-[#3C2C1E] text-xs sm:text-sm font-bold rounded-xl border border-[#C89B3C]/60 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              退出大厅 🚪
            </button>
            <button
              type="button"
              @click="onRestartGame"
              :disabled="hasClickedReady"
              class="px-6 py-2 text-xs sm:text-sm font-black rounded-xl shadow-md ring-1 active:scale-95 cursor-pointer text-white"
              :class="hasClickedReady ? 'bg-[#137333] ring-emerald-300 opacity-90' : 'bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#B45309] hover:from-[#92400E] hover:to-[#B45309] ring-amber-300'"
            >
              {{ hasClickedReady ? `✅ 已准备 · 等待牌友 (${readyPlayersCount}/4)...` : '继续下一局 🀄 ➔' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { soundFX } from '../../utils/sound';
import { haptics } from '../../utils/haptics';
import { TableTheme } from '../../utils/theme';
import { getCanvasEventCoords } from '../../utils/canvasCoords';
import {
  renderMahjongTile,
  renderMahjongTileBack,
  preloadMahjongAssets,
  onMahjongAssetsLoaded,
  getMahjongImagePath,
} from '../../utils/mahjongAssets';
import MahjongDiceCup from '../effects/MahjongDiceCup.vue';

interface MahjongTile {
  id: string;
  type: 'wan' | 'tiao' | 'tong' | 'zi';
  value: number; // 1..9 (zi: 1..7 for 东南西北中发白)
  text: string;
  color: string;
  discardBy?: number; // 0=Player(South), 1=East(Right/Green), 2=North(Top/Blue), 3=West(Left/Red)
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

const autoManagedSeats = ref<Record<number, boolean>>({});
const disconnectedSeats = ref<Record<number, boolean>>({});

const mySeat = computed(() => {
  if (props.isPracticeMode || !props.currentUser) return 0;
  if (typeof props.currentUser?.seat === 'number' && props.currentUser.seat >= 0 && props.currentUser.seat <= 3) {
    return props.currentUser.seat;
  }
  if (!props.roomPlayers || props.roomPlayers.length === 0) return 0;
  const myId = props.currentUser?.id;
  const myName = props.currentUser?.name;

  if (myId) {
    const matched = props.roomPlayers.find((p: any) => {
      if (!p) return false;
      if (p.id === myId || p.originalId === myId) return true;
      if (typeof p.id === 'string' && (p.id.startsWith(myId) || (typeof myId === 'string' && myId.startsWith(p.id)))) return true;
      return false;
    });
    if (matched && typeof matched.seat === 'number') return matched.seat;
    const idx = props.roomPlayers.findIndex((p: any) => p && (p.id === myId || p.originalId === myId));
    if (idx !== -1) return idx;
  }

  if (myName) {
    const matched = props.roomPlayers.find((p: any) => {
      if (!p) return false;
      if (p.name === myName || (p as any).originalName === myName) return true;
      if (typeof p.name === 'string' && (p.name.startsWith(myName) || (typeof myName === 'string' && myName.startsWith(p.name)))) return true;
      return false;
    });
    if (matched && typeof matched.seat === 'number') return matched.seat;
    const idx = props.roomPlayers.findIndex((p: any) => p && p.name === myName);
    if (idx !== -1) return idx;
  }

  return 0;
});

const getSeatName = (seat: number) => {
  if (props.roomPlayers && props.roomPlayers.length > 0) {
    const absSeat = (mySeat.value + seat) % 4;
    const p = props.roomPlayers.find((x: any) => x.seat === absSeat) || props.roomPlayers[absSeat];
    if (p) {
      const prefix = seat === 0 ? '本家' : seat === 1 ? '东席' : seat === 2 ? '北席' : '西席';
      const isDisc = Boolean(p.isDisconnected || disconnectedSeats.value[absSeat]);
      const isAuto = Boolean(p.isAutoManaged || autoManagedSeats.value[absSeat]);
      const statusTag = isDisc ? ' [离线托管]' : isAuto ? ' [托管]' : '';
      return `${prefix} (${p.name})${statusTag}`;
    }
  }
  return ['您 (本席)', '东席 (牌友)', '北席 (牌友)', '西席 (牌友)'][seat] || '牌友席位';
};

const SEAT_NAMES = new Proxy([], {
  get(_target, prop) {
    const idx = Number(prop);
    if (!isNaN(idx)) {
      return getSeatName(idx);
    }
    return ['本家', '东席', '北席', '西席'][prop as any];
  }
}) as unknown as string[];

const emit = defineEmits<{
  (e: 'move', payload: any): void;
  (e: 'restart'): void;
  (e: 'fx', payload: any): void;
  (e: 'exit', force?: boolean): void;
  (e: 'game-over', payload?: any): void;
}>();

function isSeatAutoManaged(absSeat: number): boolean {
  if (absSeat === mySeat.value) return isAutoHost.value;
  const p = props.roomPlayers?.find((x: any) => x.seat === absSeat) || props.roomPlayers?.[absSeat];
  return Boolean(p?.isAutoManaged || p?.isDisconnected || autoManagedSeats.value[absSeat] || disconnectedSeats.value[absSeat]);
}

function isSeatDisconnected(absSeat: number): boolean {
  const p = props.roomPlayers?.find((x: any) => x.seat === absSeat) || props.roomPlayers?.[absSeat];
  return Boolean(p?.isDisconnected || disconnectedSeats.value[absSeat]);
}

function isSeatBot(absSeat: number): boolean {
  if (absSeat === mySeat.value) return false;
  if (props.isPracticeMode) return true;
  if (!props.ws || props.ws.readyState !== WebSocket.OPEN) return true;
  if (!props.roomPlayers || props.roomPlayers.length === 0) return true;
  const p = props.roomPlayers.find((x: any) => x.seat === absSeat) || props.roomPlayers[absSeat];
  if (!p) return true;
  return Boolean(
    p.isAi ||
    p.isSimulated ||
    p.isBot ||
    p.isAutoManaged ||
    p.isDisconnected ||
    autoManagedSeats.value[absSeat] ||
    disconnectedSeats.value[absSeat] ||
    p.id?.startsWith('BOT-') ||
    p.id?.startsWith('sim-') ||
    p.id?.startsWith('P-sim-') ||
    p.name?.includes('人机') ||
    p.name?.includes('试玩') ||
    p.name?.includes('南洋商贾') ||
    p.name?.includes('九龙棋杰') ||
    p.name?.includes('濠江赌客')
  );
}

function relToAbsSeat(relSeat: number): number {
  return (mySeat.value + relSeat) % 4;
}

function absToRelSeat(absSeat: number): number {
  return (absSeat - mySeat.value + 4) % 4;
}

function sendGameMove(action: string, extraPayload: any = {}) {
  if (!props.isPracticeMode && props.ws && props.ws.readyState === WebSocket.OPEN && props.roomId) {
    props.ws.send(
      JSON.stringify({
        type: 'game_move',
        roomId: props.roomId,
        seat: mySeat.value,
        payload: {
          action,
          seat: mySeat.value,
          absSeat: mySeat.value,
          ...extraPayload,
        },
        event: {
          action,
          seat: mySeat.value,
          absSeat: mySeat.value,
          ...extraPayload,
        },
      })
    );
  }
}

watch(() => props.tableTheme, () => {
  drawTable();
});

// 仅当接收到全新权威发牌切片时才执行新开局，严禁因玩家列表属性变更重置当前进行中的牌桌手牌
watch(() => props.initialDeal, (deal) => {
  if (props.isPracticeMode || !deal?.seatCards) return;
  const dealIdentifier = deal.dealId || deal.createdAt || (Array.isArray(deal.seatCards[0]) ? deal.seatCards[0].map((c: any) => c.id || c.name).join('-') : '');
  if (lastAppliedDealId.value && lastAppliedDealId.value === dealIdentifier && myHand.value && myHand.value.length > 0) {
    console.log('🛡️ [麻将防重置] 发牌标识一致，保持当前牌桌手牌与弃牌池');
    return;
  }
  dealNewMatch(undefined, false, deal);
}, { immediate: true });

// 玩家列表变化时（如掉线/托管更新），仅同步托管状态并重绘牌桌头像角标，绝不重置牌局！
watch(() => props.roomPlayers, (newPlayers) => {
  if (Array.isArray(newPlayers)) {
    newPlayers.forEach((p: any) => {
      if (typeof p?.seat === 'number') {
        if (p.isAutoManaged) autoManagedSeats.value[p.seat] = true;
        else if (p.isAutoManaged === false) delete autoManagedSeats.value[p.seat];
        if (p.isDisconnected) disconnectedSeats.value[p.seat] = true;
        else if (p.isDisconnected === false) delete disconnectedSeats.value[p.seat];
      }
    });
  }
  drawTable();
}, { deep: true });

const containerRef = ref<HTMLDivElement | null>(null);
const tableWidthPx = ref(680);
const tableHeightPx = ref(430);
let resizeObserver: ResizeObserver | null = null;

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
  drawTable();
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
const myHand = ref<MahjongTile[]>([]);
const meldedTiles = ref<MahjongTile[][]>([]);
const discards = ref<MahjongTile[]>([]);
const wallCount = ref(83);
const selectedIndex = ref<number | null>(null);
const hasWon = ref(false);
const showSettlement = ref(false);
const announcingWinnerSeat = ref<number | null>(null);
let announceTimer: any = null;
let botActionTimers: any[] = [];
const tipMessage = ref('手牌理顺就绪，轮到您出牌');

// Opponents Hands (East: 0, North: 1, West: 2)
const oppHands = ref<MahjongTile[][]>([[], [], []]);
const oppMelds = ref<MahjongTile[][][]>([[], [], []]);
const oppCounts = computed(() => [
  oppHands.value[0]?.length || 0,
  oppHands.value[1]?.length || 0,
  oppHands.value[2]?.length || 0,
]);
const turnPlayer = ref<number>(0); // 0=South(player), 1=East, 2=North, 3=West
const lastDiscarded = ref<MahjongTile | null>(null);

// 庄家与打色子定庄状态 (0=您/本席, 1=东席, 2=北席, 3=西席)
const dealerSeat = ref<number>(0);
const lastWinnerSeat = ref<number | null>(null); // 上局自摸胜者，继续游戏时由其继续坐庄率先出牌
const isDealerContinuing = ref<boolean>(false);
const dealerDice = ref<{ d1: number; d2: number; sum: number } | null>(null);
const dealingPhase = ref<'rolling_dice' | 'dealing_tiles' | 'sorting_tiles' | 'playing'>('rolling_dice');
const isRollingDice = ref(false);
const currentDiceDisplay = ref({ d1: 1, d2: 1 });
const myHandDealtCount = ref(0);
const oppHandsDealtCount = ref<number[]>([0, 0, 0]);
const handFlipProgress = ref(0); // 0 to 1
let diceRollInterval: any = null;
let dealingAnimTimers: any[] = [];
let flipRafId: any = null;

function getDicePipGrid(val: number): { visible: boolean; color: 'red' | 'black' }[] {
  const res: { visible: boolean; color: 'red' | 'black' }[] = Array.from({ length: 9 }, () => ({
    visible: false,
    color: 'black',
  }));

  const safeVal = Math.max(1, Math.min(6, val || 1));
  switch (safeVal) {
    case 1:
      res[4] = { visible: true, color: 'red' };
      break;
    case 2:
      res[0] = { visible: true, color: 'black' };
      res[8] = { visible: true, color: 'black' };
      break;
    case 3:
      res[0] = { visible: true, color: 'black' };
      res[4] = { visible: true, color: 'black' };
      res[8] = { visible: true, color: 'black' };
      break;
    case 4:
      res[0] = { visible: true, color: 'red' };
      res[2] = { visible: true, color: 'red' };
      res[6] = { visible: true, color: 'red' };
      res[8] = { visible: true, color: 'red' };
      break;
    case 5:
      res[0] = { visible: true, color: 'black' };
      res[2] = { visible: true, color: 'black' };
      res[4] = { visible: true, color: 'red' };
      res[6] = { visible: true, color: 'black' };
      res[8] = { visible: true, color: 'black' };
      break;
    case 6:
      res[0] = { visible: true, color: 'black' };
      res[3] = { visible: true, color: 'black' };
      res[6] = { visible: true, color: 'black' };
      res[2] = { visible: true, color: 'black' };
      res[5] = { visible: true, color: 'black' };
      res[8] = { visible: true, color: 'black' };
      break;
  }
  return res;
}

function cleanDealingTimers() {
  if (diceRollInterval) {
    clearInterval(diceRollInterval);
    diceRollInterval = null;
  }
  dealingAnimTimers.forEach((t) => clearTimeout(t));
  dealingAnimTimers = [];
  if (flipRafId) {
    cancelAnimationFrame(flipRafId);
    flipRafId = null;
  }
}

const isAllOtherPlayersBots = computed(() => {
  if (props.isPracticeMode) return true;
  if (!props.ws || props.ws.readyState !== WebSocket.OPEN) return true;
  if (!props.roomPlayers || props.roomPlayers.length === 0) return true;
  return props.roomPlayers.every((p: any, idx: number) => {
    if (idx === mySeat.value) return true;
    return isSeatBot(idx);
  });
});

const hasClickedReady = ref(false);
const readyPlayersCount = computed(() => {
  if (isAllOtherPlayersBots.value) return 4;
  if (!props.roomPlayers || props.roomPlayers.length === 0) return hasClickedReady.value ? 4 : 1;
  const count = props.roomPlayers.filter((p: any, idx: number) => {
    if (isSeatBot(idx)) return true;
    if (idx === mySeat.value) return hasClickedReady.value || Boolean(p.isReady);
    return Boolean(p.isReady);
  }).length;
  return Math.min(4, Math.max(1, count));
});

const isAutoHost = ref(false);
const isDrawStalemate = ref(false);
const turnCountdown = ref(60);
let countdownInterval: any = null;
let autoHostTimer: any = null;

function startTurnCountdown() {
  stopTurnCountdown();
  if (hasWon.value || isDrawStalemate.value) return;
  if (isAutoHost.value && turnPlayer.value === 0) {
    checkAutoHostTurn();
    return;
  }
  turnCountdown.value = 60;
  drawTable();
  countdownInterval = setInterval(() => {
    if (hasWon.value || isDrawStalemate.value) {
      stopTurnCountdown();
      return;
    }
    turnCountdown.value--;
    drawTable();
    if (turnCountdown.value <= 0) {
      stopTurnCountdown();
      if (turnPlayer.value === 0) {
        isAutoHost.value = true;
        sendGameMove('set_auto_host', { isAutoManaged: true });
        checkAutoHostTurn();
      } else {
        const absSeat = relToAbsSeat(turnPlayer.value);
        if (isSeatBot(absSeat)) {
          botPlay(turnPlayer.value, () => passTurnToNext(turnPlayer.value));
        }
      }
      drawTable();
    }
  }, 1000);
}

function stopTurnCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
    drawTable();
  }
}

function cancelAutoHost() {
  isAutoHost.value = false;
  sendGameMove('set_auto_host', { isAutoManaged: false });
  if (autoHostTimer) {
    clearTimeout(autoHostTimer);
    autoHostTimer = null;
  }
  soundFX.playTap();
  if (turnPlayer.value === 0 && !hasWon.value && !isDrawStalemate.value) {
    startTurnCountdown();
  }
  drawTable();
}

function toggleAutoHost() {
  isAutoHost.value = !isAutoHost.value;
  sendGameMove('set_auto_host', { isAutoManaged: isAutoHost.value });
  soundFX.playTap();
  if (isAutoHost.value) {
    stopTurnCountdown();
    if (turnPlayer.value === 0 && !hasWon.value && !isDrawStalemate.value) {
      checkAutoHostTurn();
    }
  } else {
    if (autoHostTimer) {
      clearTimeout(autoHostTimer);
      autoHostTimer = null;
    }
    if (turnPlayer.value === 0 && !hasWon.value && !isDrawStalemate.value) {
      startTurnCountdown();
    }
  }
  drawTable();
}

function resetAutoHostState() {
  isAutoHost.value = false;
  if (autoHostTimer) {
    clearTimeout(autoHostTimer);
    autoHostTimer = null;
  }
}

// Claim Window (碰 / 杠思考窗口，时长 10 秒，支持点击【过】提前跳过)
const isClaiming = ref(false);
const claimCountdown = ref(10);
let claimInterval: any = null;
let pendingClaimNext: (() => void) | null = null;

function stopClaimCountdown() {
  isClaiming.value = false;
  pendingClaimNext = null;
  if (claimInterval) {
    clearInterval(claimInterval);
    claimInterval = null;
  }
}

function cleanAllGameTimers() {
  stopTurnCountdown();
  stopClaimCountdown();
  resetAutoHostState();
  cleanDealingTimers();
  if (botTimer) {
    clearTimeout(botTimer);
    botTimer = null;
  }
  if (announceTimer) {
    clearTimeout(announceTimer);
    announceTimer = null;
  }
  botActionTimers.forEach((t) => clearTimeout(t));
  botActionTimers = [];
  pendingClaimNext = null;
}

function handlePassClaim() {
  soundFX.playTap();
  sendGameMove('pass', { absSeat: mySeat.value });
  const next = pendingClaimNext;
  stopClaimCountdown();
  if (next) {
    next();
  }
}

function shouldSmartPeng(hand: MahjongTile[], tile: MahjongTile): boolean {
  if (!tile) return false;
  if (isHongzhongMode.value && isHongzhong(tile)) return false;

  const matches = hand.filter(c => c.type === tile.type && c.value === tile.value);
  if (matches.length < 2) return false;

  // 1. 七对子保护：若当前手牌已有 4 对及以上，严禁碰牌（碰牌亮副后无法成七对）
  const counts = new Map<string, number>();
  hand.forEach(c => {
    if (isHongzhongMode.value && isHongzhong(c)) return;
    counts.set(`${c.type}-${c.value}`, (counts.get(`${c.type}-${c.value}`) || 0) + 1);
  });
  let pairCount = 0;
  for (const cnt of counts.values()) {
    if (cnt >= 2) pairCount++;
  }
  if (pairCount >= 4) {
    return false;
  }

  // 2. 字牌对子（东南西北发白）：碰牌成刻收益极大且绝不影响顺子搭子，果断碰！
  if (tile.type === 'zi') {
    return true;
  }

  // 3. 模拟碰牌后手牌，如果碰牌后能听牌或保留顺子，则碰；若破坏顺子且远离听牌，则不碰
  const remainingHand = [...hand];
  let removed = 0;
  for (let i = remainingHand.length - 1; i >= 0 && removed < 2; i--) {
    if (remainingHand[i].type === tile.type && remainingHand[i].value === tile.value) {
      remainingHand.splice(i, 1);
      removed++;
    }
  }

  const suitTiles = hand.filter(c => c.type === tile.type).map(c => c.value);
  const v = tile.value;
  const isEmbeddedInSequence =
    (suitTiles.includes(v - 1) && suitTiles.includes(v + 1)) ||
    (suitTiles.includes(v - 2) && suitTiles.includes(v - 1)) ||
    (suitTiles.includes(v + 1) && suitTiles.includes(v + 2));

  let canTingAfterPeng = false;
  for (let i = 0; i < remainingHand.length; i++) {
    const test13 = remainingHand.filter((_, idx) => idx !== i);
    for (const kind of ALL_TILE_KINDS) {
      const test14 = [...test13, { id: 'test-ting', type: kind.type, value: kind.value, text: kind.text }];
      if (isHongzhongMode.value ? checkHongzhongWin(test14) : checkMahjongWin(test14)) {
        canTingAfterPeng = true;
        break;
      }
    }
    if (canTingAfterPeng) break;
  }

  // 若碰牌后直接能叫听，果断碰牌！
  if (canTingAfterPeng) return true;

  // 若该对子深嵌在顺子搭子中且不能听牌，放弃碰牌，保持门前清摸牌
  if (isEmbeddedInSequence && matches.length === 2) {
    return false;
  }

  return true;
}

function waitForPlayerClaim(next: () => void) {
  stopClaimCountdown();
  if (hasWon.value || showSettlement.value || isDrawStalemate.value || dealingPhase.value !== 'playing') return;

  // 托管状态下的智能截击判定（托管自动明杠或智能碰牌）
  if (isAutoHost.value && !hasWon.value && !isDrawStalemate.value && dealingPhase.value === 'playing') {
    if (canGang.value) {
      const t = setTimeout(() => {
        if (hasWon.value || showSettlement.value || dealingPhase.value !== 'playing') return;
        handleGang();
      }, 500);
      botActionTimers.push(t);
      return;
    }
    if (canPeng.value) {
      const d = lastDiscarded.value;
      if (d && shouldSmartPeng(myHand.value, d)) {
        const t = setTimeout(() => {
          if (hasWon.value || showSettlement.value || dealingPhase.value !== 'playing') return;
          handlePeng();
        }, 500);
        botActionTimers.push(t);
        return;
      }
    }
    const t = setTimeout(() => {
      if (hasWon.value || showSettlement.value || dealingPhase.value !== 'playing') return;
      next();
    }, 550);
    botActionTimers.push(t);
    return;
  }

  // 检查玩家是否有碰或杠的机会 (真人操作)
  if ((canPeng.value || canGang.value) && !hasWon.value && !isDrawStalemate.value && dealingPhase.value === 'playing') {
    isClaiming.value = true;
    claimCountdown.value = 10;
    pendingClaimNext = next;

    claimInterval = setInterval(() => {
      if (hasWon.value || showSettlement.value || dealingPhase.value !== 'playing') {
        stopClaimCountdown();
        return;
      }
      claimCountdown.value--;
      if (claimCountdown.value <= 0) {
        // 10秒超时自动过
        const cb = pendingClaimNext;
        stopClaimCountdown();
        if (cb && !hasWon.value && !showSettlement.value && dealingPhase.value === 'playing') cb();
      }
    }, 1000);
  } else {
    const t = setTimeout(() => {
      if (hasWon.value || showSettlement.value || dealingPhase.value !== 'playing') return;
      next();
    }, 550);
    botActionTimers.push(t);
  }
}

const TILE_CHARS: Record<string, string[]> = {
  wan: ['一万', '二万', '三万', '四万', '五万', '六万', '七万', '八万', '九万'],
  tiao: ['一条', '二条', '三条', '四条', '五条', '六条', '七条', '八条', '九条'],
  tong: ['一筒', '二筒', '三筒', '四筒', '五筒', '六筒', '七筒', '八筒', '九筒'],
  zi: ['东风', '南风', '西风', '北风', '红中', '发财', '白板'],
};

const ALL_TILE_KINDS = [
  ...Array.from({length: 9}, (_, i) => ({ type: 'wan' as const, value: i + 1, text: TILE_CHARS.wan[i] })),
  ...Array.from({length: 9}, (_, i) => ({ type: 'tiao' as const, value: i + 1, text: TILE_CHARS.tiao[i] })),
  ...Array.from({length: 9}, (_, i) => ({ type: 'tong' as const, value: i + 1, text: TILE_CHARS.tong[i] })),
  ...Array.from({length: 7}, (_, i) => ({ type: 'zi' as const, value: i + 1, text: TILE_CHARS.zi[i] })),
];

function scoreHand(tiles: MahjongTile[], evaluateTing: boolean = false): number {
  if (!tiles || tiles.length === 0) return 0;

  // 1. 直接胡牌判断
  const isWin = isHongzhongMode.value ? checkHongzhongWin(tiles) : checkMahjongWin(tiles);
  if (isWin) return 100000;

  const groups: Record<string, number[]> = { wan: [], tiao: [], tong: [], zi: [] };
  tiles.forEach(t => groups[t.type].push(t.value));

  let totalScore = 0;

  // 红中鬼牌保护
  if (isHongzhongMode.value) {
    const hzCount = tiles.filter(isHongzhong).length;
    totalScore += hzCount * 2500;
  }

  for (const type in groups) {
    const vals = groups[type];
    if (vals.length === 0) continue;

    const counts: number[] = new Array(10).fill(0);
    vals.forEach(v => { if (v >= 1 && v <= 9) counts[v]++; });

    if (type === 'zi') {
      for (let v = 1; v <= 7; v++) {
        const c = counts[v];
        if (isHongzhongMode.value && v === 5) continue;
        if (c >= 3) totalScore += 600;
        else if (c === 2) totalScore += 250;
        else if (c === 1) totalScore -= 300;
      }
    } else {
      // 快速线性评估面子与搭子 (无需多重递归，O(1)瞬时完成)
      const cMap = [...counts];
      // 刻子检查
      for (let v = 1; v <= 9; v++) {
        if (cMap[v] >= 3) {
          totalScore += 700;
          cMap[v] -= 3;
        }
      }
      // 顺子检查
      for (let v = 1; v <= 7; v++) {
        while (cMap[v] > 0 && cMap[v + 1] > 0 && cMap[v + 2] > 0) {
          totalScore += 650;
          cMap[v]--;
          cMap[v + 1]--;
          cMap[v + 2]--;
        }
      }
      // 对子检查
      for (let v = 1; v <= 9; v++) {
        if (cMap[v] >= 2) {
          totalScore += 300;
          cMap[v] -= 2;
        }
      }
      // 两面/搭子检查
      for (let v = 1; v <= 8; v++) {
        if (cMap[v] > 0 && cMap[v + 1] > 0) {
          totalScore += 220;
          cMap[v]--;
          cMap[v + 1]--;
        }
      }
      // 嵌张搭子检查
      for (let v = 1; v <= 7; v++) {
        if (cMap[v] > 0 && cMap[v + 2] > 0) {
          totalScore += 140;
          cMap[v]--;
          cMap[v + 2]--;
        }
      }
      // 孤张扣分
      for (let v = 1; v <= 9; v++) {
        if (cMap[v] > 0) {
          if (v === 1 || v === 9) totalScore -= 180;
          else totalScore -= 80;
        }
      }
    }
  }

  // 2. 听牌评估仅在需要时按需计算，杜绝嵌套递归
  if (evaluateTing) {
    let tingKindsCount = 0;
    let totalTingTilesAvailable = 0;

    for (const kind of ALL_TILE_KINDS) {
      const test14 = [...tiles, { id: 'test-ting', type: kind.type, value: kind.value, text: kind.text }];
      const canWin = isHongzhongMode.value ? checkHongzhongWin(test14) : checkMahjongWin(test14);
      if (canWin) {
        tingKindsCount++;
        const kindKey = `${kind.type}-${kind.value}`;
        const used = (discards.value.filter(d => `${d.type}-${d.value}` === kindKey).length) +
                     (meldedTiles.value.flatMap(m => m).filter(t => `${t.type}-${t.value}` === kindKey).length) +
                     (tiles.filter(t => `${t.type}-${t.value}` === kindKey).length);
        totalTingTilesAvailable += Math.max(0, 4 - used);
      }
    }

    if (tingKindsCount > 0) {
      totalScore += 20000 + tingKindsCount * 1500 + totalTingTilesAvailable * 200;
    }
  }

  return totalScore;
}

function findSmartBestDiscard(hand: MahjongTile[]): number {
  if (hand.length <= 1) return 0;

  // 在红中模式下，如果手牌有非红中牌，绝不可打出红中鬼牌
  const nonHzIndices = hand
    .map((t, idx) => ({ t, idx }))
    .filter((item) => !(isHongzhongMode.value && isHongzhong(item.t)));
  const candidateIndices = nonHzIndices.length > 0 ? nonHzIndices.map((item) => item.idx) : hand.map((_, idx) => idx);

  // 牌种去重：相同种类的牌评估单张即可，杜绝多张重复无用开销
  const uniqueCandidateIndices: number[] = [];
  const seenKinds = new Set<string>();
  for (const idx of candidateIndices) {
    const t = hand[idx];
    const key = `${t.type}-${t.value}`;
    if (!seenKinds.has(key)) {
      seenKinds.add(key);
      uniqueCandidateIndices.push(idx);
    }
  }
  const evalIndices = uniqueCandidateIndices.length > 0 ? uniqueCandidateIndices : candidateIndices;

  let bestIndex = evalIndices[0];
  let maxTotalScore = -999999999;

  // 汇总桌面已见牌（牌池 + 各家副露副牌）
  const visibleCounts: Record<string, number> = {};
  discards.value.forEach((t) => {
    const key = `${t.type}-${t.value}`;
    visibleCounts[key] = (visibleCounts[key] || 0) + 1;
  });
  meldedTiles.value.forEach((meld) => {
    meld.forEach((t) => {
      const key = `${t.type}-${t.value}`;
      visibleCounts[key] = (visibleCounts[key] || 0) + 1;
    });
  });
  oppMelds.value.forEach((playerMelds) => {
    playerMelds.forEach((meld) => {
      meld.forEach((t) => {
        const key = `${t.type}-${t.value}`;
        visibleCounts[key] = (visibleCounts[key] || 0) + 1;
      });
    });
  });

  // 七对子倾向性检测 (手牌已有4对及以上时，力保对子，单张全部优先舍出)
  const counts = new Map<string, number>();
  hand.forEach((c) => {
    if (isHongzhongMode.value && isHongzhong(c)) return;
    counts.set(`${c.type}-${c.value}`, (counts.get(`${c.type}-${c.value}`) || 0) + 1);
  });
  let totalPairsInHand = 0;
  for (const cnt of counts.values()) {
    if (cnt >= 2) totalPairsInHand++;
  }
  const isPursuingSevenPairs = totalPairsInHand >= 4;

  for (const i of evalIndices) {
    const tile = hand[i];
    const hand13 = hand.filter((_, idx) => idx !== i);
    const base13Score = scoreHand(hand13, false);

    let effectiveScoreSum = 0;
    let tingDoors = 0;
    let tingWinningTilesCount = 0;

    for (const kind of ALL_TILE_KINDS) {
      const kindKey = `${kind.type}-${kind.value}`;
      const usedCount = visibleCounts[kindKey] || 0;
      const inHand13Count = hand13.filter((t) => t.type === kind.type && t.value === kind.value).length;
      const availableInWall = Math.max(0, 4 - usedCount - inHand13Count);

      if (availableInWall === 0) continue;

      const testHand14 = [...hand13, { id: 'test', type: kind.type, value: kind.value, text: kind.text }];
      const canWin = isHongzhongMode.value ? checkHongzhongWin(testHand14) : checkMahjongWin(testHand14);

      if (canWin) {
        tingDoors++;
        tingWinningTilesCount += availableInWall;
      } else {
        // 高性能进张潜力评估：与手牌搭接的有效进张张数
        const connects = hand13.some(
          (t) => t.type === kind.type && (t.value === kind.value || (t.type !== 'zi' && Math.abs(t.value - kind.value) <= 2))
        );
        if (connects) {
          effectiveScoreSum += 120 * availableInWall;
        }
      }
    }

    // 核心听牌加分：打掉该牌能直接叫听（进张即胡牌），赋予压倒性最高优先级！
    // 听牌门数越多（多门听牌）且牌墙剩余胡牌张数越多，权重越高
    let tingBonus = 0;
    if (tingDoors > 0) {
      tingBonus = 35000 + tingDoors * 5000 + tingWinningTilesCount * 800;
    }

    // 孤张与废牌舍牌优先级 (discardUrgencyBonus)
    let discardUrgencyBonus = 0;
    const sameTileCountInHand = hand.filter((t) => t.type === tile.type && t.value === tile.value).length;
    const sameTileVisible = visibleCounts[`${tile.type}-${tile.value}`] || 0;

    // 七对子策略：严密保护对子，优先淘汰单牌
    if (isPursuingSevenPairs) {
      if (sameTileCountInHand >= 2) {
        discardUrgencyBonus -= 30000;
      } else {
        discardUrgencyBonus += 4500;
      }
    }

    if (tile.type === 'zi') {
      if (sameTileCountInHand === 1) {
        if (sameTileVisible >= 2) {
          discardUrgencyBonus += 2400; // 绝张字牌（外面已见2~3张），第一优先舍弃
        } else {
          discardUrgencyBonus += 1300; // 孤张字牌
        }
      } else if (sameTileCountInHand === 2) {
        discardUrgencyBonus -= 800; // 字牌对子保留当雀头或等碰
      }
    } else {
      // 数牌 (万条筒)
      if (sameTileCountInHand === 1) {
        if (tile.value === 1 || tile.value === 9) {
          const hasAdjacent = hand.some((t) => t.type === tile.type && Math.abs(t.value - tile.value) === 1);
          if (!hasAdjacent) {
            discardUrgencyBonus += 700; // 孤张 1, 9 幺九牌
          }
        } else if (tile.value === 2 || tile.value === 8) {
          const hasNeighbor = hand.some((t) => t.type === tile.type && Math.abs(t.value - tile.value) <= 1 && t !== tile);
          if (!hasNeighbor) {
            discardUrgencyBonus += 380; // 孤张 2, 8
          }
        } else {
          const hasCloseNeighbor = hand.some((t) => t.type === tile.type && Math.abs(t.value - tile.value) <= 2 && t !== tile);
          if (!hasCloseNeighbor) {
            discardUrgencyBonus += 220; // 完全无靠的中心牌
          }
        }
      }
    }

    // 防守：巡目较深（牌墙剩余 < 30 或总弃牌数 > 40）时，优先打现物安全牌
    let defenseBonus = 0;
    if (wallCount.value < 30) {
      const isAlreadyInDiscards = discards.value.some((d) => d.type === tile.type && d.value === tile.value);
      if (isAlreadyInDiscards) {
        defenseBonus += 700; // 现物绝对安全
      } else if (tile.type !== 'zi' && tile.value >= 4 && tile.value <= 6) {
        defenseBonus -= 450; // 后期危险中张慎打
      }
    }

    // 综合评分：打掉该牌后【剩余手牌基础分 + 进张总潜力 + 听牌巨大加成 + 孤张出牌合理度 + 防守分】
    const totalEvaluation = base13Score + effectiveScoreSum + tingBonus + discardUrgencyBonus + defenseBonus;

    if (totalEvaluation > maxTotalScore) {
      maxTotalScore = totalEvaluation;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function checkAutoHostTurn() {
  stopTurnCountdown();
  if (!isAutoHost.value || turnPlayer.value !== 0 || hasWon.value || isDrawStalemate.value) return;
  if (autoHostTimer) clearTimeout(autoHostTimer);
  autoHostTimer = setTimeout(() => {
    if (!isAutoHost.value || turnPlayer.value !== 0 || hasWon.value || isDrawStalemate.value) return;
    if (canHu.value) {
      handleHu();
      return;
    }
    if (canGang.value) {
      handleGang();
      return;
    }
    if (myHand.value.length % 3 === 2) {
      const bestDiscardIdx = findSmartBestDiscard(myHand.value);
      const safeIdx = Math.max(0, Math.min(myHand.value.length - 1, bestDiscardIdx));
      const discarded = myHand.value.splice(safeIdx, 1)[0];
      if (discarded) {
        discarded.discardBy = 0;
        myHand.value = sortHand(myHand.value);
        discards.value.push(discarded);
        lastDiscarded.value = discarded;
        soundFX.playMahjongClack();
        soundFX.speakVoice(discarded.text);
        selectedIndex.value = null;
        tipMessage.value = `⚡ 托管打出了【${discarded.text}】到牌池`;
        drawTable();
        emit('move', { action: 'discard', tile: discarded });
        sendGameMove('discard', { tile: discarded, absSeat: mySeat.value });
        passTurnToNext(0);
      }
    } else if (myHand.value.length % 3 === 1 && wallPool.length > 0) {
      handleDraw();
    } else if (wallPool.length === 0) {
      isDrawStalemate.value = true;
      stopTurnCountdown();
      stopClaimCountdown();
      resetAutoHostState();
      drawTable();
    }
  }, 650);
}



interface WinningBreakdown {
  fans: string[];
  totalFan: number;
  rewardCoins: number;
  maCount: number;
  rewardMaTiles: MahjongTile[];
  hitMaCount: number;
  payoutPerOpponent: number;
  isFourHongzhong?: boolean;
  kongBonusTotal?: number;
  opponentPayouts?: number[];
  winnerSeat?: number;
  netCoinsPerSeat?: number[];
}

const playerKongExtra = ref<number[]>([0, 0, 0]); // [East, North, West] extra points owed by opponents due to player's Kongs
// 全席位杠分净盈亏记账本 [0:玩家, 1:东席, 2:北席, 3:西席]
const seatKongScores = ref<number[]>([0, 0, 0, 0]);
const kongRecords = ref<string[]>([]);

const winningBreakdown = ref<WinningBreakdown>({
  fans: ['自摸和牌 (基准 1番)', '常规平胡 (不计翻倍)'],
  totalFan: 1,
  rewardCoins: 100,
  maCount: 6,
  rewardMaTiles: [],
  hitMaCount: 0,
  payoutPerOpponent: 10,
  isFourHongzhong: false,
  netCoinsPerSeat: [0, 0, 0, 0],
});

const isHongzhongMode = computed(() => {
  return props.sceneMode === 'hongzhong-6' || props.sceneMode === 'hongzhong-10';
});

const baseMaCount = computed(() => {
  return (props.sceneMode === 'standard-10' || props.sceneMode === 'hongzhong-10') ? 10 : 6;
});

function isHongzhong(tile: MahjongTile | null | undefined): boolean {
  if (!tile) return false;
  return (tile.type === 'zi' && tile.value === 5) || tile.text === '红中';
}

function isYiWuJiuMa(t: MahjongTile): boolean {
  if (winningBreakdown.value?.isFourHongzhong) return true;
  if (t.type !== 'zi') {
    return t.value === 1 || t.value === 5 || t.value === 9;
  }
  return t.value === 1 || t.value === 5 || t.text === '东风' || t.text === '红中';
}


function createTilePool(): MahjongTile[] {
  const pool: MahjongTile[] = [];
  (['wan', 'tiao', 'tong'] as const).forEach((t) => {
    for (let v = 1; v <= 9; v++) {
      for (let copy = 0; copy < 4; copy++) {
        pool.push({
          id: `${t}-${v}-${copy}`,
          type: t,
          value: v,
          text: TILE_CHARS[t][v - 1],
          color: t === 'wan' ? '#DC2626' : (t === 'tiao' ? '#16A34A' : '#2563EB'),
        });
      }
    }
  });
  // Zi tiles
  for (let v = 1; v <= 7; v++) {
    for (let copy = 0; copy < 4; copy++) {
      pool.push({
        id: `zi-${v}-${copy}`,
        type: 'zi',
        value: v,
        text: TILE_CHARS.zi[v - 1],
        color: v === 5 ? '#DC2626' : (v === 6 ? '#16A34A' : '#475569'),
      });
    }
  }
  return pool.sort(() => Math.random() - 0.5);
}

let wallPool: MahjongTile[] = [];

function sortHand(hand: MahjongTile[]): MahjongTile[] {
  const typeOrder = { wan: 0, tiao: 1, tong: 2, zi: 3 };
  return [...hand].sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || a.value - b.value);
}

function handleLeaveToLobby() {
  try {
    localStorage.removeItem('app_active_game_lock');
  } catch {}
  if (props.ws && props.ws.readyState === WebSocket.OPEN && !props.isPracticeMode) {
    try {
      props.ws.send(
        JSON.stringify({
          type: 'scene_leave',
          roomId: props.roomId,
          playerId: props.currentUser?.id,
          playerName: props.currentUser?.name,
          gameType: 'mahjong',
          sceneMode: props.sceneMode,
        })
      );
    } catch {}
  }
  emit('exit', true);
}

function onRestartGame() {
  soundFX.playTap();
  cleanAllGameTimers();
  hasWon.value = false;
  showSettlement.value = false;
  isDrawStalemate.value = false;
  if (props.isPracticeMode || isAllOtherPlayersBots.value) {
    hasClickedReady.value = false;
    continueGame();
    emit('restart');
    return;
  }

  hasClickedReady.value = true;
  showSettlement.value = false;
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
        gameType: 'mahjong',
        sceneMode: props.sceneMode,
      }));
    } catch {}
  }
}

function continueGame() {
  resetAutoHostState();
  // 谁自摸谁坐庄，率先开牌出牌
  const nextDealer = lastWinnerSeat.value !== null ? lastWinnerSeat.value : dealerSeat.value;
  dealNewMatch(nextDealer);
}

const lastAppliedDealId = ref<string>('');

function clearLocalSnapshot() {
  const roomId = props.roomId;
  if (!roomId) return;
  try {
    localStorage.removeItem(`mahjong_table_snapshot_${roomId}`);
    localStorage.removeItem('mahjong_table_snapshot_latest');
  } catch {}
}

function saveLocalSnapshot() {
  if (props.isPracticeMode) return;
  const roomId = props.roomId;
  if (!roomId) return;
  if (hasWon.value || isDrawStalemate.value || showSettlement.value) {
    clearLocalSnapshot();
    return;
  }
  if (dealingPhase.value !== 'playing' || !myHand.value || myHand.value.length === 0) return;

  try {
    const snap = {
      dealId: lastAppliedDealId.value,
      roomId,
      myHand: myHand.value,
      oppCounts: oppCounts.value,
      oppHands: oppHands.value,
      discards: discards.value,
      lastDiscarded: lastDiscarded.value,
      meldedTiles: meldedTiles.value,
      oppMelds: oppMelds.value,
      dealerSeat: dealerSeat.value,
      dealerDice: dealerDice.value,
      turnPlayer: turnPlayer.value,
      wallCount: wallCount.value,
      wallPool: wallPool,
      seatKongScores: seatKongScores.value,
      playerKongExtra: playerKongExtra.value,
      isHongzhongMode: isHongzhongMode.value,
      timestamp: Date.now(),
    };
    const serialized = JSON.stringify(snap);
    localStorage.setItem(`mahjong_table_snapshot_${roomId}`, serialized);
    localStorage.setItem('mahjong_table_snapshot_latest', serialized);
  } catch {}
}

function tryRestoreLocalSnapshot(): boolean {
  if (props.isPracticeMode) return false;
  const roomId = props.roomId;
  if (!roomId) return false;
  try {
    const raw = localStorage.getItem(`mahjong_table_snapshot_${roomId}`) || localStorage.getItem('mahjong_table_snapshot_latest');
    if (!raw) return false;
    const snap = JSON.parse(raw);
    if (!snap || !Array.isArray(snap.myHand) || snap.myHand.length === 0) return false;
    if (Date.now() - (snap.timestamp || 0) > 2 * 3600 * 1000) {
      clearLocalSnapshot();
      return false;
    }
    const currentDeal = props.initialDeal;
    const dealIdentifier = currentDeal?.dealId || currentDeal?.createdAt || (Array.isArray(currentDeal?.seatCards?.[0]) ? currentDeal.seatCards[0].map((c: any) => c.id || c.name).join('-') : '');
    if (dealIdentifier && snap.dealId && snap.dealId !== dealIdentifier) {
      return false;
    }

    lastAppliedDealId.value = snap.dealId || dealIdentifier || '';
    myHand.value = snap.myHand;
    if (Array.isArray(snap.oppHands)) oppHands.value = snap.oppHands;
    discards.value = Array.isArray(snap.discards) ? snap.discards : [];
    lastDiscarded.value = snap.lastDiscarded || null;
    meldedTiles.value = Array.isArray(snap.meldedTiles) ? snap.meldedTiles : [];
    oppMelds.value = Array.isArray(snap.oppMelds) ? snap.oppMelds : [[], [], []];
    dealerSeat.value = snap.dealerSeat ?? 0;
    if (snap.dealerDice) {
      dealerDice.value = snap.dealerDice;
      currentDiceDisplay.value = { d1: snap.dealerDice.d1, d2: snap.dealerDice.d2 };
    }
    turnPlayer.value = snap.turnPlayer ?? 0;
    wallCount.value = snap.wallCount ?? 83;
    if (Array.isArray(snap.wallPool)) wallPool = snap.wallPool;
    if (Array.isArray(snap.seatKongScores)) seatKongScores.value = snap.seatKongScores;
    if (Array.isArray(snap.playerKongExtra)) playerKongExtra.value = snap.playerKongExtra;

    cleanDealingTimers();
    dealingPhase.value = 'playing';
    isRollingDice.value = false;
    myHandDealtCount.value = myHand.value.length;
    oppHandsDealtCount.value = [oppCounts.value[0], oppCounts.value[1], oppCounts.value[2]];
    handFlipProgress.value = 1;

    tipMessage.value = turnPlayer.value === 0 ? '🔄 牌桌状态已恢复！轮到您出牌' : `🔄 牌桌状态已恢复！当前轮到【${SEAT_NAMES[turnPlayer.value]}】出牌`;
    if (turnPlayer.value === 0 && !isClaiming.value) {
      startTurnCountdown();
    }
    drawTable();
    console.log(`🀄 [麻将断线重连] 瞬时恢复牌桌状态：手牌 ${myHand.value.length} 张，弃牌池 ${discards.value.length} 张`);
    return true;
  } catch (err) {
    console.warn('[Mahjong Snapshot Restore Error]', err);
  }
  return false;
}

function handleReconnectSync(msg: any) {
  if (!msg) return;
  cleanDealingTimers();
  isRollingDice.value = false;
  dealingPhase.value = 'playing';
  handFlipProgress.value = 1;

  const bs = msg.boardState;
  const deal = msg.deal;

  if (deal) {
    const dealId = deal.dealId || deal.createdAt || '';
    if (dealId) lastAppliedDealId.value = dealId;
    if (deal.dice && !dealerDice.value) {
      dealerDice.value = deal.dice;
      currentDiceDisplay.value = { d1: deal.dice.d1, d2: deal.dice.d2 };
    }
    if (deal.dealerSeat !== undefined) {
      dealerSeat.value = (deal.dealerSeat - mySeat.value + 4) % 4;
    }
    if (wallPool.length === 0 && Array.isArray(deal.remainingWall)) {
      wallPool = [...deal.remainingWall];
      wallCount.value = wallPool.length;
    }
  }

  // Restore river discards from server authoritative board state
  if (bs?.extraState?.mahjongDiscards && Array.isArray(bs.extraState.mahjongDiscards)) {
    const sDiscards = bs.extraState.mahjongDiscards.map((d: any) => {
      const absS = typeof d.discardBy === 'number' ? d.discardBy : (typeof d.absSeat === 'number' ? d.absSeat : 0);
      return {
        ...d,
        discardBy: absToRelSeat(absS),
      };
    });
    if (sDiscards.length >= discards.value.length) {
      discards.value = sDiscards;
    }
    if (bs.extraState.lastDiscarded) {
      const lAbs = typeof bs.extraState.lastDiscarded.discardBy === 'number' ? bs.extraState.lastDiscarded.discardBy : 0;
      lastDiscarded.value = {
        ...bs.extraState.lastDiscarded,
        discardBy: absToRelSeat(lAbs),
      };
    }
  }

  // Restore melds from server
  if (bs?.extraState?.mahjongMelds && Array.isArray(bs.extraState.mahjongMelds)) {
    const sMe = mySeat.value;
    const myServerMelds = bs.extraState.mahjongMelds[sMe] || [];
    if (myServerMelds.length > 0 && meldedTiles.value.length === 0) {
      meldedTiles.value = myServerMelds;
    }
    for (let r = 1; r < 4; r++) {
      const absR = relToAbsSeat(r);
      const oppM = bs.extraState.mahjongMelds[absR] || [];
      if (oppM.length > 0 && oppMelds.value[r - 1].length === 0) {
        oppMelds.value[r - 1] = oppM;
      }
    }
  }

  if (bs?.turnSeat !== undefined) {
    turnPlayer.value = absToRelSeat(bs.turnSeat);
  }

  if (bs?.extraState?.wallRemaining !== undefined) {
    wallCount.value = bs.extraState.wallRemaining;
  }

  if (myHand.value.length === 0 && deal?.seatCards) {
    myHand.value = sortHand([...(deal.seatCards[mySeat.value] || [])]);
  }

  myHandDealtCount.value = myHand.value.length;
  oppHandsDealtCount.value = [oppCounts.value[0], oppCounts.value[1], oppCounts.value[2]];

  tipMessage.value = turnPlayer.value === 0 ? '🔄 牌桌状态已同步！轮到您出牌' : `🔄 牌桌状态已同步！当前轮到【${SEAT_NAMES[turnPlayer.value]}】出牌`;
  if (turnPlayer.value === 0 && !isClaiming.value) {
    startTurnCountdown();
  }
  drawTable();
  saveLocalSnapshot();
}

function dealNewMatch(designatedDealer?: number, forceReApply = false, dealOverride?: any) {
  hasClickedReady.value = false;
  resetAutoHostState();
  const currentDeal = dealOverride || props.initialDeal;
  if (currentDeal?.seatCards) {
    const dealIdentifier = currentDeal.dealId || currentDeal.createdAt || (Array.isArray(currentDeal.seatCards[0]) ? currentDeal.seatCards[0].map((c: any) => c.id || c.name).join('-') : '');
    if (!forceReApply && lastAppliedDealId.value && lastAppliedDealId.value === dealIdentifier && myHand.value && myHand.value.length > 0) {
      console.log(`🛡️ [麻将网络波动防重刷] 发牌 ${dealIdentifier} 已在桌上执行，跳过重复洗牌与重置`);
      return;
    }
    lastAppliedDealId.value = dealIdentifier;
  }
  cleanAllGameTimers();
  hasWon.value = false;
  isDrawStalemate.value = false;
  showSettlement.value = false;

  const isContinuing = designatedDealer !== undefined;
  isDealerContinuing.value = isContinuing;
  let targetDealer = 0;

  const rawDealTiles = currentDeal?.seatCards;
  const hasValidTiles = rawDealTiles && (Array.isArray(rawDealTiles) ? rawDealTiles.length === 4 : (rawDealTiles[0] && rawDealTiles[1] && rawDealTiles[2] && rawDealTiles[3]));
  if (currentDeal && hasValidTiles) {
    const sMe = mySeat.value;
    const sEast = (sMe + 1) % 4;
    const sNorth = (sMe + 2) % 4;
    const sWest = (sMe + 3) % 4;

    myHand.value = sortHand([...(currentDeal.seatCards[sMe] || [])]);
    oppHands.value = [
      sortHand([...(currentDeal.seatCards[sEast] || [])]),
      sortHand([...(currentDeal.seatCards[sNorth] || [])]),
      sortHand([...(currentDeal.seatCards[sWest] || [])]),
    ];
    wallPool = [...(currentDeal.remainingWall || [])];
    wallCount.value = wallPool.length;

    const rawDealer = currentDeal.dealerSeat !== undefined ? currentDeal.dealerSeat : 0;
    targetDealer = (rawDealer - sMe + 4) % 4;
    dealerSeat.value = targetDealer;
    dealerDice.value = currentDeal.dice || { d1: 1, d2: 1, sum: 2 };
  } else {
    // Standard Mahjong: strictly 136 tiles in total (36 wan + 36 tiao + 36 tong + 28 zi)
    wallPool = createTilePool();

    // 掷色子：
    // 两个骰子 1..6，点数 2..12
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;

    // 规则：继续游戏时，上局谁自摸谁坐庄率先开牌出牌！若重新开局则由色子定庄
    targetDealer = designatedDealer !== undefined ? designatedDealer : (sum - 1) % 4; // 0=本席(南), 1=东席, 2=北席, 3=西席
    dealerSeat.value = targetDealer;
    dealerDice.value = { d1, d2, sum };

    // 庄家抓 14 张牌，闲家各抓 13 张牌 (起手共 53 张牌)
    if (targetDealer === 0) {
      myHand.value = sortHand(wallPool.slice(0, 14));
      oppHands.value = [
        sortHand(wallPool.slice(14, 27)), // East: 13
        sortHand(wallPool.slice(27, 40)), // North: 13
        sortHand(wallPool.slice(40, 53)), // West: 13
      ];
    } else if (targetDealer === 1) {
      myHand.value = sortHand(wallPool.slice(0, 13));
      oppHands.value = [
        sortHand(wallPool.slice(13, 27)), // East (Dealer): 14
        sortHand(wallPool.slice(27, 40)), // North: 13
        sortHand(wallPool.slice(40, 53)), // West: 13
      ];
    } else if (targetDealer === 2) {
      myHand.value = sortHand(wallPool.slice(0, 13));
      oppHands.value = [
        sortHand(wallPool.slice(13, 26)), // East: 13
        sortHand(wallPool.slice(26, 40)), // North (Dealer): 14
        sortHand(wallPool.slice(40, 53)), // West: 13
      ];
    } else {
      myHand.value = sortHand(wallPool.slice(0, 13));
      oppHands.value = [
        sortHand(wallPool.slice(13, 26)), // East: 13
        sortHand(wallPool.slice(26, 39)), // North: 13
        sortHand(wallPool.slice(39, 53)), // West (Dealer): 14
      ];
    }

    // Remaining in wall: exactly 136 - 14 - 39 = 83 tiles!
    wallPool = wallPool.slice(53);
    wallCount.value = wallPool.length;
  }

  playerKongExtra.value = [0, 0, 0];
  seatKongScores.value = [0, 0, 0, 0];
  kongRecords.value = [];
  meldedTiles.value = [];
  oppMelds.value = [[], [], []];
  discards.value = [];
  lastDiscarded.value = null;
  selectedIndex.value = null;
  hasWon.value = false;
  announcingWinnerSeat.value = null;
  if (announceTimer) {
    clearTimeout(announceTimer);
    announceTimer = null;
  }

  // 初始发牌动效阶段：3D 色盅与双色子定庄
  dealingPhase.value = 'rolling_dice';
  isRollingDice.value = true;
  myHandDealtCount.value = 0;
  oppHandsDealtCount.value = [0, 0, 0];
  handFlipProgress.value = 0;
  turnPlayer.value = targetDealer;
  tipMessage.value = isContinuing
    ? `🎲 【${SEAT_NAMES[targetDealer]}】上局自摸继续坐庄，开局掷色定开门...`
    : '🎲 开局掷双色子定庄开门...';
  drawTable();
}

function startDealingTilesAnimation() {
  dealingPhase.value = 'dealing_tiles';
  tipMessage.value = '🀄 开局起手抓牌 (牌背朝上发牌)...';
  drawTable();

  // Wave 1: 4 cards each
  const t1 = setTimeout(() => {
    myHandDealtCount.value = 4;
    oppHandsDealtCount.value = [4, 4, 4];
    soundFX.playCardSnap();
    tipMessage.value = '🀄 抓第一道手牌 (各得 4 张)...';
    drawTable();

    // Wave 2: 8 cards each
    const t2 = setTimeout(() => {
      myHandDealtCount.value = 8;
      oppHandsDealtCount.value = [8, 8, 8];
      soundFX.playCardSnap();
      tipMessage.value = '🀄 抓第二道手牌 (各得 8 张)...';
      drawTable();

      // Wave 3: 12 cards each
      const t3 = setTimeout(() => {
        myHandDealtCount.value = 12;
        oppHandsDealtCount.value = [12, 12, 12];
        soundFX.playCardSnap();
        tipMessage.value = '🀄 抓第三道手牌 (各得 12 张)...';
        drawTable();

        // Wave 4: 13 cards each
        const t4 = setTimeout(() => {
          myHandDealtCount.value = 13;
          oppHandsDealtCount.value = [13, 13, 13];
          soundFX.playCardSnap();
          tipMessage.value = '🀄 抓第四道起手牌 (各得 13 张)...';
          drawTable();

          // Wave 5: Dealer draws 14th tile (庄家跳牌)
          const t5 = setTimeout(() => {
            if (dealerSeat.value === 0) {
              myHandDealtCount.value = 14;
            } else {
              oppHandsDealtCount.value[dealerSeat.value - 1] = 14;
            }
            soundFX.playMahjongClack();
            tipMessage.value = `🀄 【${SEAT_NAMES[dealerSeat.value]}】跳牌抓第 14 张起手牌！`;
            drawTable();

            // Wave 6: Flip & Sort Hand (翻面亮牌理顺)
            const t6 = setTimeout(() => {
              startHandFlipAnimation();
            }, 360);
            dealingAnimTimers.push(t6);
          }, 320);
          dealingAnimTimers.push(t5);
        }, 300);
        dealingAnimTimers.push(t4);
      }, 300);
      dealingAnimTimers.push(t3);
    }, 300);
    dealingAnimTimers.push(t2);
  }, 220);
  dealingAnimTimers.push(t1);
}

function startHandFlipAnimation() {
  dealingPhase.value = 'sorting_tiles';
  tipMessage.value = '🀄 整牌理牌，翻面亮牌...';
  soundFX.playMahjongClack();
  const startTime = performance.now();
  const duration = 420;

  function step(now: number) {
    const elapsed = now - startTime;
    const p = Math.min(1, elapsed / duration);
    handFlipProgress.value = p;
    drawTable();
    if (p < 1) {
      flipRafId = requestAnimationFrame(step);
    } else {
      flipRafId = null;
      finishDealingAndStartPlay();
    }
  }
  flipRafId = requestAnimationFrame(step);
}

function finishDealingAndStartPlay() {
  dealingPhase.value = 'playing';
  turnPlayer.value = dealerSeat.value;
  drawTable();
  saveLocalSnapshot();

  // 特殊规则：起手摸齐四张红中直接结束游戏！
  if (isHongzhongMode.value) {
    if (myHand.value.filter(isHongzhong).length === 4) {
      const t = setTimeout(() => {
        if (hasWon.value || showSettlement.value || dealingPhase.value === 'settled') return;
        triggerMahjongWin(0, true);
      }, 350);
      dealingAnimTimers.push(t);
      return;
    }
    for (let b = 0; b < 3; b++) {
      if (oppHands.value[b].filter(isHongzhong).length === 4) {
        const t = setTimeout(() => {
          if (hasWon.value || showSettlement.value || dealingPhase.value === 'settled') return;
          triggerMahjongWin(b + 1, true);
        }, 350);
        dealingAnimTimers.push(t);
        return;
      }
    }
  }

  if (dealerSeat.value === 0) {
    tipMessage.value = isDealerContinuing.value
      ? '👑 您上局自摸连庄，起手执14张牌，请点击手牌出第一张牌！'
      : (isHongzhongMode.value
        ? '👑 您是庄家，手牌理顺就绪，请先出牌！(红中百搭万能)'
        : '👑 您是庄家，起手抓齐 14 张，请点击手牌选一张打出');
    drawTable();
    if (isAutoHost.value) {
      checkAutoHostTurn();
    } else {
      startTurnCountdown();
    }
  } else {
    tipMessage.value = isDealerContinuing.value
      ? `👑 【${SEAT_NAMES[dealerSeat.value]}】上局自摸连庄，执 14 张牌率先出牌...`
      : `👑 【${SEAT_NAMES[dealerSeat.value]}】是庄家，执 14 张牌率先出牌...`;
    drawTable();
    const dealerAbsSeat = relToAbsSeat(dealerSeat.value);
    if (isSeatBot(dealerAbsSeat)) {
      const t = setTimeout(() => {
        botPlay(dealerSeat.value, () => passTurnToNext(dealerSeat.value));
      }, 950);
      dealingAnimTimers.push(t);
    }
  }
}

function skipDealingAnimation() {
  cleanDealingTimers();
  isRollingDice.value = false;
  if (dealerDice.value) {
    currentDiceDisplay.value = { d1: dealerDice.value.d1, d2: dealerDice.value.d2 };
  }
  myHandDealtCount.value = myHand.value.length;
  oppHandsDealtCount.value = [oppHands.value[0].length, oppHands.value[1].length, oppHands.value[2].length];
  handFlipProgress.value = 1;
  dealingPhase.value = 'playing';
  saveLocalSnapshot();

  // Check 4 Hongzhong instant win
  if (isHongzhongMode.value) {
    if (myHand.value.filter(isHongzhong).length === 4) {
      const t = setTimeout(() => {
        if (hasWon.value || showSettlement.value || dealingPhase.value === 'settled') return;
        triggerMahjongWin(0, true);
      }, 350);
      dealingAnimTimers.push(t);
      return;
    }
    for (let b = 0; b < 3; b++) {
      if (oppHands.value[b].filter(isHongzhong).length === 4) {
        const t = setTimeout(() => {
          if (hasWon.value || showSettlement.value || dealingPhase.value === 'settled') return;
          triggerMahjongWin(b + 1, true);
        }, 350);
        dealingAnimTimers.push(t);
        return;
      }
    }
  }

  turnPlayer.value = dealerSeat.value;
  if (dealerSeat.value === 0) {
    tipMessage.value = isDealerContinuing.value
      ? '👑 您上局自摸连庄，起手执14张牌，请点击手牌出第一张牌！'
      : (isHongzhongMode.value
        ? '👑 您是庄家，手牌理顺就绪，请先出牌！(红中百搭万能)'
        : '👑 您是庄家，起手抓齐 14 张，请点击手牌选一张打出');
    drawTable();
    if (isAutoHost.value) {
      checkAutoHostTurn();
    } else {
      startTurnCountdown();
    }
  } else {
    tipMessage.value = isDealerContinuing.value
      ? `👑 【${SEAT_NAMES[dealerSeat.value]}】上局自摸连庄，执 14 张牌率先出牌...`
      : `👑 【${SEAT_NAMES[dealerSeat.value]}】是庄家，执 14 张牌率先出牌...`;
    drawTable();
    const dealerAbsSeat = relToAbsSeat(dealerSeat.value);
    if (isSeatBot(dealerAbsSeat)) {
      const t = setTimeout(() => {
        botPlay(dealerSeat.value, () => passTurnToNext(dealerSeat.value));
      }, 800);
      dealingAnimTimers.push(t);
    }
  }
}

// 规则：可以碰 (他人出牌时，手牌中有2张相同牌；红中不可碰)
const canPeng = computed(() => {
  if (hasWon.value || showSettlement.value || dealingPhase.value !== 'playing') return false;
  if (!lastDiscarded.value || turnPlayer.value === 0) return false;
  const d = lastDiscarded.value;
  // 红中模式下，红中为万能百搭，不可被碰
  if (isHongzhongMode.value && isHongzhong(d)) return false;
  return myHand.value.filter((c) => c.type === d.type && c.value === d.value).length >= 2;
});

// 规则：可以杠 (支持明杠、暗杠、补杠；红中模式下四红中直接胡牌结算)
const canGang = computed(() => {
  if (hasWon.value || showSettlement.value || dealingPhase.value !== 'playing') return false;
  // 1. 明杠：他人出牌时，手中已有3张相同牌
  if (lastDiscarded.value && turnPlayer.value !== 0) {
    const d = lastDiscarded.value;
    if (isHongzhongMode.value && isHongzhong(d)) return false;
    if (myHand.value.filter((c) => c.type === d.type && c.value === d.value).length === 3) return true;
  }
  // 2. 暗杠与补杠：轮到自己抓牌后 (手牌数为 3k+2)
  if (turnPlayer.value === 0 && myHand.value.length % 3 === 2) {
    // 暗杠：手牌中有4张完全相同的牌 (红中场中4张红中直接胡牌，不作为暗杠)
    const counts = new Map<string, number>();
    myHand.value.forEach((c) => {
      if (isHongzhongMode.value && isHongzhong(c)) return;
      counts.set(`${c.type}-${c.value}`, (counts.get(`${c.type}-${c.value}`) || 0) + 1);
    });
    for (const cnt of counts.values()) {
      if (cnt === 4) return true;
    }
    // 补杠：摸到已碰明刻中对应牌型的第4张
    for (const meld of meldedTiles.value) {
      if (meld.length === 3 && meld[0].type === meld[1].type && meld[0].value === meld[1].value) {
        if (myHand.value.some((c) => c.type === meld[0].type && c.value === meld[0].value)) {
          return true;
        }
      }
    }
  }
  return false;
});

/**
 * Standard Mahjong Win Check (4 melds + 1 pair, or 7 pairs)
 * 规则：无十三幺 (十三幺不作为胡牌牌型，严格禁止)
 */
function checkMahjongWin(hand: MahjongTile[]): boolean {
  if (hand.length % 3 !== 2) return false;

  // Check 7 pairs (七对)
  if (hand.length === 14) {
    const counts = new Map<string, number>();
    hand.forEach((c) => counts.set(`${c.type}-${c.value}`, (counts.get(`${c.type}-${c.value}`) || 0) + 1));
    let pairCount = 0;
    for (const cnt of counts.values()) {
      if (cnt === 2) pairCount++;
      if (cnt === 4) pairCount += 2;
    }
    if (pairCount === 7) return true;
  }

  // Group by type (wan, tiao, tong, zi)
  const groups: Record<string, number[]> = { wan: [], tiao: [], tong: [], zi: [] };
  hand.forEach((c) => groups[c.type].push(c.value));
  Object.values(groups).forEach((arr) => arr.sort((a, b) => a - b));

  // Try each possible pair (雀头)
  for (const [t, vals] of Object.entries(groups)) {
    for (let i = 0; i < vals.length - 1; i++) {
      if (vals[i] === vals[i + 1]) {
        // Remove this pair and check if remaining are all valid melds (3-sets)
        const testGroups: Record<string, number[]> = {
          wan: [...groups.wan],
          tiao: [...groups.tiao],
          tong: [...groups.tong],
          zi: [...groups.zi],
        };
        testGroups[t].splice(i, 2);

        let allValid = true;
        for (const [subT, subVals] of Object.entries(testGroups)) {
          if (!canDecomposeIntoMelds(subVals, subT === 'zi')) {
            allValid = false;
            break;
          }
        }
        if (allValid) return true;
      }
    }
  }

  return false;
}

function canDecomposeIntoMelds(vals: number[], isZi = false): boolean {
  if (vals.length === 0) return true;
  if (vals.length % 3 !== 0) return false;

  const arr = [...vals].sort((a, b) => a - b);
  // Try Triplet (刻子)
  if (arr[0] === arr[1] && arr[1] === arr[2]) {
    const nextArr = arr.slice(3);
    if (canDecomposeIntoMelds(nextArr, isZi)) return true;
  }
  // Try Sequence (顺子 - 字牌不可成顺)
  if (!isZi) {
    const v = arr[0];
    const idx2 = arr.indexOf(v + 1);
    const idx3 = arr.indexOf(v + 2);
    if (idx2 !== -1 && idx3 !== -1) {
      const nextArr = [...arr];
      nextArr.splice(idx3, 1);
      nextArr.splice(idx2, 1);
      nextArr.splice(0, 1);
      if (canDecomposeIntoMelds(nextArr, isZi)) return true;
    }
  }
  return false;
}

// 缓存单花色所需最小百搭癞子数量
const suitWildcardCache = new Map<string, number>();

function minWildcardsForSuit(arr: number[]): number {
  if (arr.length === 0) return 0;
  const key = arr.join(',');
  if (suitWildcardCache.has(key)) return suitWildcardCache.get(key)!;

  const v = arr[0];
  let minCost = 999;

  // 1. 刻子相关组合
  const countV = arr.filter((x) => x === v).length;
  // 1a: 3张相同，0百搭
  if (countV >= 3) {
    const nextArr = [...arr];
    nextArr.splice(nextArr.indexOf(v), 1);
    nextArr.splice(nextArr.indexOf(v), 1);
    nextArr.splice(nextArr.indexOf(v), 1);
    minCost = Math.min(minCost, minWildcardsForSuit(nextArr));
  }
  // 1b: 2张相同 + 1百搭
  if (countV >= 2) {
    const nextArr = [...arr];
    nextArr.splice(nextArr.indexOf(v), 1);
    nextArr.splice(nextArr.indexOf(v), 1);
    minCost = Math.min(minCost, 1 + minWildcardsForSuit(nextArr));
  }
  // 1c: 1张单牌 + 2百搭
  {
    const nextArr = [...arr];
    nextArr.splice(nextArr.indexOf(v), 1);
    minCost = Math.min(minCost, 2 + minWildcardsForSuit(nextArr));
  }

  // 2. 顺子相关组合
  const idx1 = arr.indexOf(v + 1);
  const idx2 = arr.indexOf(v + 2);

  // 2a: v, v+1, v+2 (0百搭)
  if (idx1 !== -1 && idx2 !== -1) {
    const nextArr = [...arr];
    nextArr.splice(idx2, 1);
    nextArr.splice(idx1, 1);
    nextArr.splice(0, 1);
    minCost = Math.min(minCost, minWildcardsForSuit(nextArr));
  }
  // 2b: v, v+1 + 1百搭
  if (idx1 !== -1) {
    const nextArr = [...arr];
    nextArr.splice(idx1, 1);
    nextArr.splice(0, 1);
    minCost = Math.min(minCost, 1 + minWildcardsForSuit(nextArr));
  }
  // 2c: v, v+2 + 1百搭
  if (idx2 !== -1) {
    const nextArr = [...arr];
    nextArr.splice(idx2, 1);
    nextArr.splice(0, 1);
    minCost = Math.min(minCost, 1 + minWildcardsForSuit(nextArr));
  }

  suitWildcardCache.set(key, minCost);
  return minCost;
}

function minWildcardsForZi(vals: number[]): number {
  if (vals.length === 0) return 0;
  const counts = new Map<number, number>();
  vals.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  let needed = 0;
  for (const c of counts.values()) {
    const rem = c % 3;
    if (rem === 1) needed += 2;
    else if (rem === 2) needed += 1;
  }
  return needed;
}

function totalWildcardsNeeded(w: number[], ti: number[], to: number[], z: number[]): number {
  return minWildcardsForSuit(w) + minWildcardsForSuit(ti) + minWildcardsForSuit(to) + minWildcardsForZi(z);
}

/**
 * 红中麻将胡牌检测：红中作为万能百搭牌
 * - 四张红中：直接胡牌结束游戏
 * - 七对：红中可与任意单牌成对
 * - 标准 4副牌 + 1将牌 (雀头)：红中可任意充当
 */
function checkHongzhongWin(hand: MahjongTile[]): boolean {
  if (hand.length % 3 !== 2) return false;

  const hzCount = hand.filter(isHongzhong).length;
  // 规则：摸到四张红中就结束游戏！
  if (hzCount === 4) return true;

  const normalTiles = hand.filter((t) => !isHongzhong(t));

  // 1. 七对检查 (七对必须全手牌14张且无亮副)
  if (hand.length === 14) {
    const counts = new Map<string, number>();
    normalTiles.forEach((c) => counts.set(`${c.type}-${c.value}`, (counts.get(`${c.type}-${c.value}`) || 0) + 1));
    let neededForSingles = 0;
    for (const cnt of counts.values()) {
      neededForSingles += cnt % 2;
    }
    if (hzCount >= neededForSingles) {
      return true;
    }
  }

  // 2. 正常 4副 + 1雀头 检查
  const wan = normalTiles.filter((t) => t.type === 'wan').map((t) => t.value).sort((a, b) => a - b);
  const tiao = normalTiles.filter((t) => t.type === 'tiao').map((t) => t.value).sort((a, b) => a - b);
  const tong = normalTiles.filter((t) => t.type === 'tong').map((t) => t.value).sort((a, b) => a - b);
  const zi = normalTiles.filter((t) => t.type === 'zi').map((t) => t.value).sort((a, b) => a - b);

  // 方案 A: 雀头由 2张红中 组成
  if (hzCount >= 2) {
    if (totalWildcardsNeeded(wan, tiao, tong, zi) <= hzCount - 2) {
      return true;
    }
  }

  // 方案 B: 雀头由 1张普通牌 + 1张红中 组成
  if (hzCount >= 1) {
    // 遍历每一个可能的普通单牌作为将
    const tried = new Set<string>();
    for (const t of normalTiles) {
      const key = `${t.type}-${t.value}`;
      if (tried.has(key)) continue;
      tried.add(key);

      const testWan = [...wan];
      const testTiao = [...tiao];
      const testTong = [...tong];
      const testZi = [...zi];

      if (t.type === 'wan') testWan.splice(testWan.indexOf(t.value), 1);
      else if (t.type === 'tiao') testTiao.splice(testTiao.indexOf(t.value), 1);
      else if (t.type === 'tong') testTong.splice(testTong.indexOf(t.value), 1);
      else if (t.type === 'zi') testZi.splice(testZi.indexOf(t.value), 1);

      if (totalWildcardsNeeded(testWan, testTiao, testTong, testZi) <= hzCount - 1) {
        return true;
      }
    }
  }

  // 方案 C: 雀头由 2张完全相同的普通牌 组成
  const countsByKind = new Map<string, { type: 'wan' | 'tiao' | 'tong' | 'zi'; value: number; count: number }>();
  normalTiles.forEach((t) => {
    const key = `${t.type}-${t.value}`;
    if (!countsByKind.has(key)) {
      countsByKind.set(key, { type: t.type, value: t.value, count: 0 });
    }
    countsByKind.get(key)!.count++;
  });

  for (const item of countsByKind.values()) {
    if (item.count >= 2) {
      const testWan = [...wan];
      const testTiao = [...tiao];
      const testTong = [...tong];
      const testZi = [...zi];

      if (item.type === 'wan') {
        testWan.splice(testWan.indexOf(item.value), 1);
        testWan.splice(testWan.indexOf(item.value), 1);
      } else if (item.type === 'tiao') {
        testTiao.splice(testTiao.indexOf(item.value), 1);
        testTiao.splice(testTiao.indexOf(item.value), 1);
      } else if (item.type === 'tong') {
        testTong.splice(testTong.indexOf(item.value), 1);
        testTong.splice(testTong.indexOf(item.value), 1);
      } else if (item.type === 'zi') {
        testZi.splice(testZi.indexOf(item.value), 1);
        testZi.splice(testZi.indexOf(item.value), 1);
      }

      if (totalWildcardsNeeded(testWan, testTiao, testTong, testZi) <= hzCount) {
        return true;
      }
    }
  }

  return false;
}

// 规则：不可炮胡，仅限自摸 (必须轮到自己回合且已抓牌在手，手牌数为 3k+2)
const canHu = computed(() => {
  if (hasWon.value || showSettlement.value || dealingPhase.value !== 'playing') return false;
  if (turnPlayer.value !== 0 || myHand.value.length % 3 !== 2) return false;
  if (isHongzhongMode.value) {
    return checkHongzhongWin(myHand.value);
  }
  return checkMahjongWin(myHand.value);
});

/**
 * 统一麻将胡牌与积分结算
 * - 普通六码/十码场：自摸奖 6 / 10 码，底分10分，一五九码及红中东风每中1码+10分
 * - 红中六码/十码场：
 *   1. 摸到4张红中直接结束游戏：
 *      - 六码场：等于六码全中加底分，各得其他玩家70分，共210分
 *      - 十码场：等于十码全中加底分，各得其他玩家110分，共330分
 *   2. 自摸手牌没有红中：奖励额外加2个码 (六码场变8码，十码场变12码)
 */
function triggerMahjongWin(winnerSeat: number, isFourHongzhong = false) {
  if (hasWon.value || showSettlement.value || dealingPhase.value === 'settled') {
    console.warn('🛡️ [麻将结算防重] 已在结算状态，忽略重复调用与重复扣分');
    return;
  }
  cleanAllGameTimers();

  hasWon.value = true;
  showSettlement.value = true;
  dealingPhase.value = 'settled';
  clearLocalSnapshot();
  const isPlayer = winnerSeat === 0;
  const seatNames = ['您 (本席)', '东席 (南洋商贾)', '北席 (九龙棋杰)', '西席 (濠江赌客)'];
  const winnerName = seatNames[winnerSeat] || '雀圣';

  const winnerHand = isPlayer ? myHand.value : (oppHands.value[winnerSeat - 1] || []);
  const hzCountInHand = winnerHand.filter(isHongzhong).length;

  const baseCodes = baseMaCount.value; // 6 or 10
  const isHzMode = isHongzhongMode.value;
  const fourHzWin = isHzMode && (isFourHongzhong || hzCountInHand === 4);

  let maCount = baseCodes;
  let hitCount = 0;
  let payoutPerOpponent = 0;
  let fansList: string[] = [];
  let rewardMaTiles: MahjongTile[] = [];

  if (fourHzWin) {
    // 规则：摸到四张红中直接结束游戏！
    // 六码场：6码全中 (6*10=60分) + 底分10分 = 各得70分，共210分
    // 十码场：10码全中 (10*10=100分) + 底分10分 = 各得110分，共330分
    maCount = baseCodes;
    hitCount = baseCodes;
    payoutPerOpponent = 10 + hitCount * 10; // 70 or 110
    fansList = [
      '摸到四张红中 · 天降大满贯！',
      baseCodes === 6 ? '红中六码全中 (奖60分)' : '红中十码全中 (奖100分)',
      '各得其他玩家底分10分',
    ];

    rewardMaTiles = wallPool.slice(0, Math.min(maCount, wallPool.length));
    while (rewardMaTiles.length < maCount) {
      rewardMaTiles.push({
        id: `hz-win-${rewardMaTiles.length}`,
        type: 'zi',
        value: 5,
        text: '红中',
        color: '#DC2626',
      });
    }
  } else {
    // 普通自摸 / 红中自摸
    const hasNoHongzhong = isHzMode && hzCountInHand === 0;
    if (hasNoHongzhong) {
      // 规则：红中场自摸玩家手牌没有红中的加两个码 (六码场变8码，十码场变12码)
      maCount = baseCodes + 2;
      fansList.push(`自摸和牌 (手牌无红中奖励加2码，共${maCount}码)`);
    } else {
      maCount = baseCodes;
      fansList.push(isHzMode ? `红中百搭自摸和牌 (奖${maCount}码)` : `自摸和牌 (奖${maCount}码)`);
    }

    rewardMaTiles = wallPool.slice(0, Math.min(maCount, wallPool.length));
    // 牌墙不足时补充牌展示完整奖码
    if (rewardMaTiles.length < maCount) {
      const extraPool = createTilePool();
      while (rewardMaTiles.length < maCount && extraPool.length > 0) {
        rewardMaTiles.push(extraPool.pop()!);
      }
    }

    hitCount = rewardMaTiles.filter(isYiWuJiuMa).length;
    payoutPerOpponent = 10 + hitCount * 10;
    fansList.push(`自摸奖码 (${maCount}码中${hitCount}码)`);
  }

  // 综合结算：基础自摸 + 全席位杠分净收支 (赢家自摸+3*底码，输家各付底码，并结清所有明杠/暗杠点数)
  const netCoinsPerSeat = [0, 0, 0, 0];
  for (let s = 0; s < 4; s++) {
    const zimoDelta = s === winnerSeat ? payoutPerOpponent * 3 : -payoutPerOpponent;
    netCoinsPerSeat[s] = zimoDelta + seatKongScores.value[s];
  }

  // 本席玩家 (seat 0) 实际总盈亏 (如明杠得10分，对手自摸50分，则本席实输 -50 + 10 = -40分)
  const rewardCoins = netCoinsPerSeat[0];
  let totalWon = netCoinsPerSeat[winnerSeat];
  let kongBonusTotal = Math.max(0, seatKongScores.value[0]);
  const opponentPayouts = [0, 0, 0];
  const oppNames = ['东席', '北席', '西席'];

  if (isPlayer) {
    // 玩家自己自摸和牌
    for (let i = 0; i < 3; i++) {
      const oppSeat = i + 1;
      const actualLoss = Math.max(0, -netCoinsPerSeat[oppSeat]);
      opponentPayouts[i] = actualLoss;
      if (seatKongScores.value[oppSeat] < 0) {
        fansList.push(`杠牌加成 (${oppNames[i]}被杠多输${-seatKongScores.value[oppSeat]}分)`);
      }
    }
    if (seatKongScores.value[0] > 0) {
      fansList.push(`本席杠牌进账 (+${seatKongScores.value[0]}分)`);
    }
  } else {
    // 其他玩家自摸和牌
    for (let i = 0; i < 3; i++) {
      const oppSeat = i + 1;
      if (oppSeat === winnerSeat) {
        opponentPayouts[i] = netCoinsPerSeat[oppSeat]; // 自摸赢家实赢总分
      } else {
        opponentPayouts[i] = Math.max(0, -netCoinsPerSeat[oppSeat]); // 输家实输总分 (含被杠多输)
      }
    }

    // 将玩家杠分收益与冲抵明细加入 fansList 供弹窗清晰展示
    if (seatKongScores.value[0] > 0) {
      for (const rec of kongRecords.value) {
        if (rec.includes('您')) {
          fansList.push(rec);
        }
      }
      const myGrossLoss = payoutPerOpponent;
      const myNetLoss = -rewardCoins;
      fansList.push(`自摸本输${myGrossLoss}分，冲抵杠分+${seatKongScores.value[0]}分，实输${myNetLoss}分`);
    } else if (seatKongScores.value[0] < 0) {
      fansList.push(`被杠扣除${-seatKongScores.value[0]}分，冲抵后实输${-rewardCoins}分`);
    }

    // 记录被玩家杠的对手多输分
    for (let i = 0; i < 3; i++) {
      const oppSeat = i + 1;
      if (oppSeat !== winnerSeat && seatKongScores.value[oppSeat] < 0) {
        fansList.push(`【${oppNames[i]}】被杠多输${-seatKongScores.value[oppSeat]}分 (实输${-netCoinsPerSeat[oppSeat]}分)`);
      }
    }
  }

  winningBreakdown.value = {
    fans: fansList,
    totalFan: 1 + hitCount,
    rewardCoins,
    maCount,
    rewardMaTiles,
    hitMaCount: hitCount,
    payoutPerOpponent,
    isFourHongzhong: fourHzWin,
    kongBonusTotal,
    opponentPayouts,
    winnerSeat,
    netCoinsPerSeat: [...netCoinsPerSeat],
  };

  lastWinnerSeat.value = winnerSeat;

  soundFX.playVictory();
  if (isPlayer) {
    haptics.sealStamp();
    haptics.victory();
  }

  if (fourHzWin) {
    soundFX.speakAction(isPlayer ? '摸到四张红中！天降大满贯！' : `${winnerName}摸到四张红中胡牌！`);
    tipMessage.value = `🀄 【${winnerName}】摸到四张红中！${baseCodes === 6 ? '六码全中各得70分共210分' : '十码全中各得110分共330分'}，直接结束游戏！`;
  } else {
    if (isPlayer) {
      soundFX.speakAction('zimo', { text: '自摸！胡了！' });
    } else {
      soundFX.speakAction('zimo', { text: `${winnerName}自摸胡牌！` });
    }
    tipMessage.value = `🀄 【${winnerName}】自摸和出！斩获 ${hitCount} 码！`;
  }

  emit('move', {
    action: 'hu',
    winner: winnerSeat,
    fan: 1 + hitCount,
    rewardCoins,
    payoutPerOpponent,
    detail: fourHzWin
      ? `${winnerName}摸到四张红中结束游戏 (${baseCodes === 6 ? '70分/各家' : '110分/各家'})`
      : `${winnerName}自摸和牌 (奖${maCount}码中${hitCount}码)`,
  });

  if (winnerSeat === 0) {
    sendGameMove('hu', {
      winner: mySeat.value,
      isFourHz: fourHzWin,
      fan: 1 + hitCount,
      rewardCoins,
      payoutPerOpponent,
      absSeat: mySeat.value,
    });
  }

  try {
    localStorage.removeItem('app_active_game_lock');
  } catch {}
  emit('game-over', { gameType: 'mahjong', winnerSeat });

  drawTable();
}


function drawTable() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = 680;
  const height = 430;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Background Mahjong Table Felt with spotlight illumination
  const highlight = props.tableTheme?.highlightColor || '#FFFFFF';
  const felt = props.tableTheme?.feltColor || '#ECEFF1';
  const edge = props.tableTheme?.edgeColor || '#CFD8DC';

  const grad = ctx.createRadialGradient(width / 2, height / 2 - 20, 20, width / 2, height / 2, 430);
  grad.addColorStop(0, highlight);
  grad.addColorStop(0.35, felt);
  grad.addColorStop(0.85, edge);
  grad.addColorStop(1, edge);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle luxury table felt inner rim (bright amethyst pinstripe border)
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 0);
  ctx.stroke();

  // Subtle ambient table spotlight ellipse
  const spotGrad = ctx.createRadialGradient(width / 2, height / 2 - 20, 0, width / 2, height / 2 - 20, 260);
  spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  spotGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)');
  spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = spotGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Helper: Draw Oval Avatar for Mahjong Opponent Players
  const drawOvalOpponentAvatar = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    avatarEmoji: string,
    seatName: string,
    count: number,
    color: string,
    isActive: boolean,
    orientation: 'horizontal' | 'vertical',
    isDealer = false,
    countdownSec?: number,
    isAuto = false,
    isDisc = false
  ) => {
    ctx.save();

    // Active breathing / glowing aura
    if (isActive) {
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 14;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
    }

    // Oval background matching the border color
    const grad = ctx.createRadialGradient(cx, cy - ry * 0.25, 4, cx, cy, Math.max(rx, ry));
    if (color === '#3B82F6') {
      grad.addColorStop(0, isActive ? '#3B82F6' : '#2563EB');
      grad.addColorStop(0.55, '#1D4ED8');
      grad.addColorStop(1, '#172554');
    } else if (color === '#EF4444') {
      grad.addColorStop(0, isActive ? '#EF4444' : '#DC2626');
      grad.addColorStop(0.55, '#B91C1C');
      grad.addColorStop(1, '#450A0A');
    } else if (color === '#10B981') {
      grad.addColorStop(0, isActive ? '#10B981' : '#059669');
      grad.addColorStop(0.55, '#047857');
      grad.addColorStop(1, '#022C22');
    } else if (color === '#F59E0B') {
      grad.addColorStop(0, isActive ? '#F59E0B' : '#D97706');
      grad.addColorStop(0.55, '#B45309');
      grad.addColorStop(1, '#451A03');
    } else {
      grad.addColorStop(0, color);
      grad.addColorStop(1, '#110C09');
    }

    ctx.fillStyle = grad;
    ctx.strokeStyle = isActive ? '#EF4444' : color;
    ctx.lineWidth = isActive ? 2.5 : 2;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Reset shadow for crisp text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Inner subtle pinstripe rim
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(1, rx - 3), Math.max(1, ry - 3), 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const currentSec = countdownSec !== undefined ? countdownSec : (isClaiming.value ? claimCountdown.value : turnCountdown.value);
    const isManagedOrDisc = isAuto || isDisc;
    const finalAvatar = isDisc ? '🤖' : avatarEmoji;

    if (orientation === 'horizontal') {
      // Horizontal Oval (North / Seat 2 at top)
      const avatarR = 14;
      const avatarCx = cx - rx + avatarR + 6;
      const avatarCy = cy;

      // Circle avatar icon badge - Always show avatar emoji
      ctx.fillStyle = isDisc ? '#374151' : 'rgba(0, 0, 0, 0.35)';
      ctx.strokeStyle = isActive ? '#EF4444' : (isDisc ? '#F59E0B' : 'rgba(255, 255, 255, 0.4)');
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(finalAvatar, avatarCx, avatarCy + 1);

      // Name & Tile Count
      const textX = cx + 10;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(seatName, textX, cy - 6);

      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${count}张`, textX, cy + 7);

      // Offline / Auto-managed Badge
      if (isManagedOrDisc) {
        const badgeLabel = isDisc ? '离线托管' : '⚡托管';
        ctx.save();
        ctx.fillStyle = isDisc ? '#DC2626' : '#D97706';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        const bW = 52;
        const bH = 14;
        const bX = cx - bW / 2;
        const bY = cy + ry + 3;
        ctx.beginPath();
        ctx.roundRect(bX, bY, bW, bH, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeLabel, cx, bY + bH / 2 + 0.5);
        ctx.restore();
      }
    } else {
      // Vertical Oval (West, East, South)
      const avatarR = 14;
      const avatarCx = cx;
      const avatarCy = cy - ry + avatarR + 6;

      // Circle avatar icon badge - Always show avatar emoji
      ctx.fillStyle = isDisc ? '#374151' : 'rgba(0, 0, 0, 0.35)';
      ctx.strokeStyle = isActive ? '#EF4444' : (isDisc ? '#F59E0B' : 'rgba(255, 255, 255, 0.4)');
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(finalAvatar, avatarCx, avatarCy + 1);

      // Seat Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(seatName, cx, cy + 5);

      // Count
      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${count}张`, cx, cy + 18);

      // Offline / Auto-managed Badge
      if (isManagedOrDisc) {
        const badgeLabel = isDisc ? '离线托管' : '⚡托管';
        ctx.save();
        ctx.fillStyle = isDisc ? '#DC2626' : '#D97706';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        const bW = 46;
        const bH = 14;
        const bX = cx - bW / 2;
        const bY = cy + ry + 4;
        ctx.beginPath();
        ctx.roundRect(bX, bY, bW, bH, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeLabel, cx, bY + bH / 2 + 0.5);
        ctx.restore();
      }
    }

    // Dealer Badge (庄家徽章)
    if (isDealer) {
      const badgeX = orientation === 'horizontal' ? cx + rx - 6 : cx + rx - 4;
      const badgeY = orientation === 'horizontal' ? cy - ry + 4 : cy - ry + 4;
      ctx.fillStyle = '#F59E0B';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('庄', badgeX, badgeY + 0.5);
    }

    ctx.restore();
  };

function getPlayerInfoByRelSeat(relSeat: number): { name: string; avatar: string } {
  const defaultNames = ['玩家', '牌友 A', '牌友 B', '牌友 C'];
  const defaultEmojis = ['👑', '🧑', '🧓', '🧔'];
  if (props.roomPlayers && props.roomPlayers.length > 0) {
    const absSeat = relToAbsSeat(relSeat);
    const p = props.roomPlayers[absSeat];
    if (p && p.name) {
      const pName = String(p.name);
      const shortName = pName.length > 4 ? `${pName.slice(0, 3)}..` : pName;
      return {
        name: shortName,
        avatar: p.avatar || defaultEmojis[relSeat],
      };
    }
  }
  return {
    name: defaultNames[relSeat],
    avatar: defaultEmojis[relSeat],
  };
}

  function ensureOpponentHandSize(botIdx: number) {
    if (dealingPhase.value !== 'playing' && dealingPhase.value !== 'sorting_tiles') return;
    const relSeat = botIdx + 1;
    const oppHand = oppHands.value[botIdx] || [];
    const meldCount = (oppMelds.value[botIdx] || []).length;
    const isTurn = turnPlayer.value === relSeat;
    // Standard Mahjong rule: standing hand size is (14 - meldCount*3) on turn, or (13 - meldCount*3) off turn
    const targetCount = Math.max(1, (isTurn ? 14 : 13) - (meldCount * 3));

    while (oppHand.length < targetCount) {
      if (wallPool.length > 0) {
        oppHand.push(wallPool.shift()!);
        wallCount.value = wallPool.length;
      } else {
        oppHand.push({
          id: `opp-ph-${botIdx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'wan',
          value: 1,
          text: '一万',
          color: '#DC2626',
        });
      }
    }

    while (oppHand.length > targetCount) {
      oppHand.pop();
    }

    oppHands.value[botIdx] = oppHand;
  }

  function getOpponentTotalTileCount(relSeat: number): number {
    if (dealingPhase.value === 'dealing_tiles') {
      return oppHandsDealtCount.value[relSeat - 1] || 0;
    }
    if (dealingPhase.value === 'rolling_dice') return 0;
    const botIdx = relSeat - 1;
    ensureOpponentHandSize(botIdx);
    const handLen = oppHands.value[botIdx]?.length || 0;
    const meldCount = (oppMelds.value[botIdx] || []).length;
    return handLen + meldCount * 3;
  }

  // 1. Top: North (顶部玩家: 蓝色椭圆头像)
  const northInfo = getPlayerInfoByRelSeat(2);
  const northCount = getOpponentTotalTileCount(2);
  const northAbs = relToAbsSeat(2);
  drawOvalOpponentAvatar(
    width / 2,
    26,
    52,
    22,
    northInfo.avatar,
    northInfo.name,
    northCount,
    '#3B82F6',
    turnPlayer.value === 2 && dealingPhase.value === 'playing',
    'horizontal',
    dealerSeat.value === 2,
    turnCountdown.value,
    isSeatAutoManaged(northAbs),
    isSeatDisconnected(northAbs)
  );

  // 牌墙横幅：显示在顶部头像左边
  const wallBoxW = 90;
  const wallBoxH = 26;
  const wallBoxX = width / 2 - 52 - wallBoxW - 10;
  const wallBoxY = 13;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(wallBoxX, wallBoxY, wallBoxW, wallBoxH, 13);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🀄 牌墙 ${wallCount.value}张`, wallBoxX + wallBoxW / 2, wallBoxY + wallBoxH / 2);
  ctx.restore();

  // 倒计时：显示在顶部头像右边 (仅纯红色数字，无时钟图标与思考中文字)
  if (dealingPhase.value === 'playing') {
    const cdBoxW = 34;
    const cdBoxH = 26;
    const cdBoxX = width / 2 + 52 + 10;
    const cdBoxY = 13;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(cdBoxX, cdBoxY, cdBoxW, cdBoxH, 13);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const activeSec = isClaiming.value ? claimCountdown.value : turnCountdown.value;
    ctx.fillText(String(Math.max(0, activeSec)), cdBoxX + cdBoxW / 2, cdBoxY + cdBoxH / 2 + 0.5);
    ctx.restore();
  }

  // 2. Left: West (左玩家: 红色椭圆头像)
  const westInfo = getPlayerInfoByRelSeat(3);
  const westCount = getOpponentTotalTileCount(3);
  const westAbs = relToAbsSeat(3);
  drawOvalOpponentAvatar(
    30,
    90,
    22,
    42,
    westInfo.avatar,
    westInfo.name,
    westCount,
    '#EF4444',
    turnPlayer.value === 3 && dealingPhase.value === 'playing',
    'vertical',
    dealerSeat.value === 3,
    turnCountdown.value,
    isSeatAutoManaged(westAbs),
    isSeatDisconnected(westAbs)
  );

  // 3. Right: East (右玩家: 绿色椭圆头像)
  const eastInfo = getPlayerInfoByRelSeat(1);
  const eastCount = getOpponentTotalTileCount(1);
  const eastAbs = relToAbsSeat(1);
  drawOvalOpponentAvatar(
    width - 30,
    90,
    22,
    42,
    eastInfo.avatar,
    eastInfo.name,
    eastCount,
    '#10B981',
    turnPlayer.value === 1 && dealingPhase.value === 'playing',
    'vertical',
    dealerSeat.value === 1,
    turnCountdown.value,
    isSeatAutoManaged(eastAbs),
    isSeatDisconnected(eastAbs)
  );

  // Discard Pool (凸字形样式：上部宽 560px 紧贴顶部头像底部，下部向左右延伸至 644px，底部显示三个玩家碰牌)
  const neckLeft = 60;
  const neckRight = width - 60; // 620
  const topY = 48; // 紧贴顶部头像底部 (26 + 22 = 48)
  const stepY = 134; // 左右头像底部下方 (90 + 42 = 132)
  const bodyLeft = 18; // 移除碰牌显示区后向左延伸
  const bodyRight = width - 18; // 662，移除碰牌显示区后向右延伸
  const bottomY = 179; // 弃牌框在第四行底部切割截断 (四行容量 21+21+21+24=87 张)

  // 绘制凸字形路径 (圆润外角 + 紧凑内角)
  const traceConvexPath = (c: CanvasRenderingContext2D, r = 5) => {
    c.beginPath();
    // 顶部凸颈 (Neck)
    c.moveTo(neckLeft + r, topY);
    c.lineTo(neckRight - r, topY);
    c.arcTo(neckRight, topY, neckRight, topY + r, r);

    // 右侧颈部向下延伸至内转角
    c.lineTo(neckRight, stepY - 2);
    c.arcTo(neckRight, stepY, neckRight + 2, stepY, 2);

    // 右肩水平向右延伸
    c.lineTo(bodyRight - r, stepY);
    c.arcTo(bodyRight, stepY, bodyRight, stepY + r, r);

    // 右下身垂直向下至第四行底部
    c.lineTo(bodyRight, bottomY - r);
    c.arcTo(bodyRight, bottomY, bodyRight - r, bottomY, r);

    // 底部水平边向左
    c.lineTo(bodyLeft + r, bottomY);
    c.arcTo(bodyLeft, bottomY, bodyLeft, bottomY - r, r);

    // 左下身垂直向上
    c.lineTo(bodyLeft, stepY + r);
    c.arcTo(bodyLeft, stepY, bodyLeft + r, stepY, r);

    // 左肩水平向右延伸至内转角
    c.lineTo(neckLeft - 2, stepY);
    c.arcTo(neckLeft, stepY, neckLeft, stepY - 2, 2);

    // 左侧颈部向上回到顶部
    c.lineTo(neckLeft, topY + r);
    c.arcTo(neckLeft, topY, neckLeft + r, topY, r);
    c.closePath();
  };

  // 弃牌框边框线全透明：不绘制外边框线与底框，弃牌自然清透地悬浮于桌布之上

  // 弃牌区磁贴排布：4行自适应排满（21 + 21 + 21 + 24 = 87 张，完全满足全场弃牌需求）
  const tileW = 23;
  const tileH = 31;
  const gapX = 3;
  const gapY = 1;

  interface RiverRowConfig {
    ry: number;
    capacity: number;
    startX: number;
  }
  const rowConfigs: RiverRowConfig[] = [];
  let curY = 50;
  for (let r = 0; r < 4; r++) {
    const ry = curY;
    const isNeck = ry < stepY;
    const minX = isNeck ? neckLeft : bodyLeft;
    const maxX = isNeck ? neckRight : bodyRight;
    const availW = (maxX - minX) - 16;
    const capacity = Math.floor((availW + gapX) / (tileW + gapX));
    const actualW = capacity * tileW + (capacity - 1) * gapX;
    const startX = minX + Math.floor(((maxX - minX) - actualW) / 2);
    rowConfigs.push({ ry, capacity, startX });
    curY += tileH + gapY;
  }

  // 21 + 21 + 21 + 24 = 87 张
  const visibleDiscards = discards.value.slice(-87);

  if (visibleDiscards.length === 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.font = '500 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无弃牌', width / 2, 114);
  } else {
    let tileIndex = 0;
    for (let r = 0; r < rowConfigs.length && tileIndex < visibleDiscards.length; r++) {
      const config = rowConfigs[r];
      for (let c = 0; c < config.capacity && tileIndex < visibleDiscards.length; c++) {
        const tile = visibleDiscards[tileIndex];
        const rx = config.startX + c * (tileW + gapX);
        const ry = config.ry;

        renderMahjongTile(ctx, tile, rx, ry, tileW, tileH, {
          isSmall: true,
        });

        if (tileIndex === visibleDiscards.length - 1) {
          ctx.save();
          ctx.strokeStyle = '#FDE047';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(rx - 0.5, ry - 0.5, tileW + 1, tileH + 1, 3);
          ctx.stroke();
          ctx.restore();
        }

        tileIndex++;
      }
    }
  }

  // 三个玩家碰牌展示区：横幅底板与标签完全透明，不显示“暂无碰牌”，哪位玩家碰牌了才动态展示其标签与牌张
  const activeOpponents: { label: string; color: string; melds: MahjongTile[][] }[] = [];
  if (oppMelds.value[2].length > 0) {
    activeOpponents.push({ label: '西席碰牌', color: '#EF4444', melds: oppMelds.value[2] });
  }
  if (oppMelds.value[1].length > 0) {
    activeOpponents.push({ label: '北席碰牌', color: '#3B82F6', melds: oppMelds.value[1] });
  }
  if (oppMelds.value[0].length > 0) {
    activeOpponents.push({ label: '东席碰牌', color: '#10B981', melds: oppMelds.value[0] });
  }

  const oppTileW = 23;
  const oppTileH = 31;
  const meldBaseY = 186;
  const rowSpacing = 36;

  activeOpponents.forEach((opp, rowIdx) => {
    const rowY = meldBaseY + rowIdx * rowSpacing;
    const labelX = bodyLeft + 8; // x = 26

    // 全透明标签：无底色、无外框，仅以纯粹高清色字与柔光呈现
    ctx.save();
    ctx.shadowColor = opp.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = opp.color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(opp.label, labelX, rowY + oppTileH / 2);
    ctx.restore();

    // 碰/杠的牌（与弃牌池相同尺寸 23x31）
    const tilesStartX = labelX + 62;
    let curX = tilesStartX;
    opp.melds.forEach((set) => {
      set.forEach((t) => {
        renderMahjongTile(ctx, t, curX, rowY, oppTileW, oppTileH, {
          isSmall: true,
          borderColor: opp.color,
          borderWidth: 1.5,
        });
        curX += oppTileW + 2;
      });
      curX += 8; // 副与副之间的清晰间隔
    });
  });

  // Coordinated Non-overlapping Layout: Left Melded Sets (碰牌 / 杠牌亮副) + Hand Tiles
  const handLen = dealingPhase.value === 'playing' || dealingPhase.value === 'sorting_tiles'
    ? myHand.value.length
    : (dealerSeat.value === 0 ? 14 : 13);
  const handTileW = 38;
  const handTileH = 56;
  const gap = 3;
  const hasDrawn14 = (myHand.value.length % 3 === 2) || (dealerSeat.value === 0 && dealingPhase.value !== 'playing');
  const drawnOffset = hasDrawn14 ? 14 : 0;
  const handTotalW = handLen > 0 ? (handLen * handTileW + (handLen - 1) * gap + drawnOffset) : 0;

  const meldTileW = 28;
  const meldTileH = 40;
  const meldGap = 2;
  const meldSetGap = 12;
  const meldsToHandGap = 18;
  const meldStartX = 24;

  let totalMeldsW = 0;
  if (meldedTiles.value.length > 0) {
    meldedTiles.value.forEach((set, sIdx) => {
      totalMeldsW += set.length * meldTileW + (set.length - 1) * meldGap;
      if (sIdx < meldedTiles.value.length - 1) totalMeldsW += meldSetGap;
    });
  }

  // Left side is used for melded tiles (碰/杠牌); hand is placed to the right of melds
  let handStartX = 24;
  if (totalMeldsW > 0) {
    handStartX = meldStartX + totalMeldsW + meldsToHandGap;
  } else {
    handStartX = Math.max(20, Math.floor((width - handTotalW) / 2));
  }
  const baseY = height - 142; // 288，与向下延伸至 298 的弃牌框保持 14px 纯净间隙



  // 1. Draw Melded Sets on the LEFT (左边放碰的牌 / 杠的牌)
  if (meldedTiles.value.length > 0) {
    let meldOffsetX = meldStartX;
    const meldY = baseY + 40 + (handTileH - meldTileH);

    // Label above melded tiles
    ctx.save();
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('亮副 (碰/杠):', meldStartX, meldY - 5);
    ctx.restore();

    meldedTiles.value.forEach((set) => {
      set.forEach((t) => {
        renderMahjongTile(ctx, t, meldOffsetX, meldY, meldTileW, meldTileH, { isSmall: true });
        meldOffsetX += meldTileW + meldGap;
      });
      meldOffsetX += meldSetGap - meldGap;
    });

    // Decorative separator line between melded tiles and hand
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(handStartX - 10, baseY + 36);
    ctx.lineTo(handStartX - 10, baseY + 40 + handTileH);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Draw Hand Tiles (with phases: rolling_dice -> dealing_tiles -> sorting_tiles -> playing)
  if (dealingPhase.value === 'rolling_dice') {
    // 打色子阶段：桌前整洁，手牌不显示
  } else if (dealingPhase.value === 'dealing_tiles') {
    // 抓牌要牌阶段：牌背朝上发牌，展示翠绿麻将牌背
    const dealtLen = myHandDealtCount.value;
    const isDealerWith14 = dealerSeat.value === 0;
    for (let idx = 0; idx < dealtLen; idx++) {
      const isDrawn14 = idx === 13 && isDealerWith14;
      const extraOffset = isDrawn14 ? 14 : 0;
      const tx = handStartX + idx * (handTileW + gap) + extraOffset;
      const ty = baseY + 40;
      renderMahjongTileBack(ctx, tx, ty, handTileW, handTileH);
    }
  } else if (dealingPhase.value === 'sorting_tiles') {
    // 理牌翻面动效 (牌背收缩 -> 牌面展开)
    const p = handFlipProgress.value;
    myHand.value.forEach((t, idx) => {
      const isDrawn14 = idx === handLen - 1 && hasDrawn14;
      const extraOffset = isDrawn14 ? 14 : 0;
      const tx = handStartX + idx * (handTileW + gap) + extraOffset;
      const ty = baseY + 40;

      if (p < 0.5) {
        const scaleY = 1 - p * 2;
        renderMahjongTileBack(ctx, tx, ty, handTileW, handTileH, { scaleY });
      } else {
        const scaleY = (p - 0.5) * 2;
        renderMahjongTile(ctx, t, tx, ty, handTileW, handTileH, { scaleY });
      }
    });
  } else {
    // 对战进行中：明亮清晰的整副手牌
    myHand.value.forEach((t, idx) => {
      const isSel = selectedIndex.value === idx;
      const isDrawn14 = idx === handLen - 1 && hasDrawn14;
      const extraOffset = isDrawn14 ? 14 : 0;

      const tx = handStartX + idx * (handTileW + gap) + extraOffset;
      const ty = isSel ? baseY + 40 - 16 : baseY + 40;

      renderMahjongTile(ctx, t, tx, ty, handTileW, handTileH, { isSelected: isSel });
    });
  }
}

function onCanvasClick(e: MouseEvent | PointerEvent) {
  if (dealingPhase.value !== 'playing') return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const { x, y } = getCanvasEventCoords(canvas, e.clientX, e.clientY, props.isRotated90);

  const handLen = myHand.value.length;
  const handTileW = 38;
  const handTileH = 56;
  const gap = 3;
  const hasDrawn14 = handLen % 3 === 2;
  const drawnOffset = hasDrawn14 ? 14 : 0;
  const handTotalW = handLen > 0 ? (handLen * handTileW + (handLen - 1) * gap + drawnOffset) : 0;

  const meldTileW = 28;
  const meldGap = 2;
  const meldSetGap = 12;
  const meldsToHandGap = 18;
  const meldStartX = 24;

  let totalMeldsW = 0;
  if (meldedTiles.value.length > 0) {
    meldedTiles.value.forEach((set, sIdx) => {
      totalMeldsW += set.length * meldTileW + (set.length - 1) * meldGap;
      if (sIdx < meldedTiles.value.length - 1) totalMeldsW += meldSetGap;
    });
  }

  let handStartX = 24;
  if (totalMeldsW > 0) {
    handStartX = meldStartX + totalMeldsW + meldsToHandGap;
  } else {
    handStartX = Math.max(20, Math.floor((680 - handTotalW) / 2));
  }
  const baseY = 430 - 142; // 288，与 drawTable 严格同步，点击判定精准无偏差

  for (let i = 0; i < handLen; i++) {
    const isDrawn14 = i === handLen - 1 && hasDrawn14;
    const extraOffset = isDrawn14 ? 14 : 0;
    const tx = handStartX + i * (handTileW + gap) + extraOffset;

    if (x >= tx && x <= tx + handTileW && y >= baseY + 40 - 20 && y <= baseY + 40 + handTileH) {
      if (selectedIndex.value === i) {
        // Discard tile!
        if (turnPlayer.value !== 0 || myHand.value.length % 3 !== 2) return;
        stopTurnCountdown();
        const discarded = myHand.value.splice(i, 1)[0];
        discarded.discardBy = 0;
        myHand.value = sortHand(myHand.value);
        discards.value.push(discarded);
        lastDiscarded.value = discarded;
        soundFX.playMahjongClack();
        haptics.mahjongClack();
        selectedIndex.value = null;
        tipMessage.value = `打出了【${discarded.text}】到牌池`;
        soundFX.speakVoice(discarded.text);
        drawTable();
        emit('move', { action: 'discard', tile: discarded });
        sendGameMove('discard', { tile: discarded, absSeat: mySeat.value });
        saveLocalSnapshot();

        // Trigger bot or network turns
        passTurnToNext(0);
        return;
      } else {
        selectedIndex.value = i;
        soundFX.playTap();
        haptics.tap();
        drawTable();
        return;
      }
    }
  }
}

function handleDraw() {
  if (turnPlayer.value !== 0 || myHand.value.length % 3 !== 1 || dealingPhase.value !== 'playing') return;
  if (wallPool.length === 0) {
    isDrawStalemate.value = true;
    stopTurnCountdown();
    stopClaimCountdown();
    resetAutoHostState();
    clearLocalSnapshot();
    try {
      localStorage.removeItem('app_active_game_lock');
    } catch {}
    emit('game-over', { gameType: 'mahjong', isDraw: true });
    drawTable();
    return;
  }
  const newTile = wallPool.shift()!;
  wallCount.value = wallPool.length;
  myHand.value.push(newTile);
  turnPlayer.value = 0;
  sendGameMove('draw', { absSeat: mySeat.value });
  saveLocalSnapshot();
  soundFX.playMahjongClack();
  haptics.mahjongClack();

  // 特殊规则：摸到四张红中直接结束游戏！
  if (isHongzhongMode.value && myHand.value.filter(isHongzhong).length === 4) {
    drawTable();
    triggerMahjongWin(0, true);
    return;
  }

  tipMessage.value = `摸到了【${newTile.text}】${isHongzhong(newTile) && isHongzhongMode.value ? '(红中百搭万能)' : ''}，请自摸胡牌或点击出牌`;
  drawTable();
  if (isAutoHost.value) {
    checkAutoHostTurn();
  } else {
    startTurnCountdown();
  }
}

function handleDiscardSelected() {
  if (selectedIndex.value === null || myHand.value.length % 3 !== 2 || turnPlayer.value !== 0 || dealingPhase.value !== 'playing') return;
  stopTurnCountdown();
  const discarded = myHand.value.splice(selectedIndex.value, 1)[0];
  discarded.discardBy = 0;
  myHand.value = sortHand(myHand.value);
  discards.value.push(discarded);
  lastDiscarded.value = discarded;
  soundFX.playMahjongClack();
  haptics.mahjongClack();
  selectedIndex.value = null;
  tipMessage.value = `打出了【${discarded.text}】到牌池`;
  soundFX.speakVoice(discarded.text);
  drawTable();
  emit('move', { action: 'discard', tile: discarded });
  sendGameMove('discard', { tile: discarded, absSeat: mySeat.value });
  saveLocalSnapshot();
  passTurnToNext(0);
}

// 规则：可以碰 (他人出牌时，从手牌中拿出2张相同牌与他人弃牌组成明刻)
function handlePeng() {
  if (!canPeng.value || !lastDiscarded.value) return;
  stopClaimCountdown();
  if (botTimer) clearTimeout(botTimer);
  const d = lastDiscarded.value;
  const matches = myHand.value.filter((c) => c.type === d.type && c.value === d.value).slice(0, 2);

  if (matches.length === 2) {
    const rmIds = new Set(matches.map((c) => c.id));
    myHand.value = myHand.value.filter((c) => !rmIds.has(c.id));
    meldedTiles.value.push([...matches, d]);
    // Remove the claimed tile from discards so total tiles remain exact
    if (discards.value.length > 0 && discards.value[discards.value.length - 1].id === d.id) {
      discards.value.pop();
    }
    lastDiscarded.value = null;
    soundFX.playMahjongClack();
    haptics.sealStamp();
    soundFX.speakAction('peng');
    tipMessage.value = `碰牌成功！碰进【${d.text}】亮刻，请打出一张牌`;
    turnPlayer.value = 0;
    selectedIndex.value = null;
    drawTable();
    sendGameMove('peng', { tile: d, absSeat: mySeat.value });
    saveLocalSnapshot();
    if (isAutoHost.value) {
      checkAutoHostTurn();
    } else {
      startTurnCountdown();
    }
  }
}

// 规则：可以杠 (明杠、暗杠、补杠，杠后从牌墙末尾补一张牌入座)
function handleGang() {
  if (!canGang.value) return;
  stopClaimCountdown();
  if (botTimer) clearTimeout(botTimer);
  soundFX.playMahjongClack();
  haptics.sealStamp();
  soundFX.speakAction('gang');

  let kongedOpponentSeat: number | null = null;
  let isAnOrBuGang = false;

  // Case 1: 明杠 (他人弃牌)
  if (lastDiscarded.value && turnPlayer.value !== 0) {
    const d = lastDiscarded.value;
    const matches = myHand.value.filter((c) => c.type === d.type && c.value === d.value);
    if (matches.length >= 3) {
      const takeThree = matches.slice(0, 3);
      const idsToRemove = new Set(takeThree.map((c) => c.id));
      myHand.value = myHand.value.filter((c) => !idsToRemove.has(c.id));
      meldedTiles.value.push([...takeThree, d]);
      if (discards.value.length > 0 && discards.value[discards.value.length - 1].id === d.id) {
        discards.value.pop();
      }
      kongedOpponentSeat = d.discardBy !== undefined ? d.discardBy : turnPlayer.value;
      lastDiscarded.value = null;
      turnPlayer.value = 0;
    }
  } else if (turnPlayer.value === 0) {
    // Case 2: 暗杠 (手牌中有4张完全相同的牌)
    const counts = new Map<string, MahjongTile[]>();
    myHand.value.forEach((c) => {
      const k = `${c.type}-${c.value}`;
      if (!counts.has(k)) counts.set(k, []);
      counts.get(k)!.push(c);
    });
    let foundAnGang = false;
    for (const tiles of counts.values()) {
      if (tiles.length === 4) {
        const ids = new Set(tiles.map((c) => c.id));
        myHand.value = myHand.value.filter((c) => !ids.has(c.id));
        meldedTiles.value.push(tiles);
        foundAnGang = true;
        isAnOrBuGang = true;
        break;
      }
    }

    // Case 3: 补杠 (将摸到的第4张牌加入已碰出的3张明刻中)
    if (!foundAnGang) {
      for (const meld of meldedTiles.value) {
        if (meld.length === 3 && meld[0].type === meld[1].type && meld[0].value === meld[1].value) {
          const matchIdx = myHand.value.findIndex((c) => c.type === meld[0].type && c.value === meld[0].value);
          if (matchIdx !== -1) {
            const addedTile = myHand.value.splice(matchIdx, 1)[0];
            meld.push(addedTile);
            isAnOrBuGang = true;
            break;
          }
        }
      }
    }
  }

  if (kongedOpponentSeat !== null && kongedOpponentSeat > 0 && kongedOpponentSeat <= 3) {
    playerKongExtra.value[kongedOpponentSeat - 1] += 10;
    seatKongScores.value[0] += 10;
    seatKongScores.value[kongedOpponentSeat] -= 10;
    kongRecords.value.push(`您明杠【${SEAT_NAMES[kongedOpponentSeat]}】得10分 (${SEAT_NAMES[kongedOpponentSeat]}多输10分)`);
  }
  if (isAnOrBuGang) {
    for (let i = 0; i < 3; i++) {
      playerKongExtra.value[i] += 10;
      seatKongScores.value[i + 1] -= 10;
    }
    seatKongScores.value[0] += 30;
    kongRecords.value.push('您暗杠/补杠各得三家10分 (+30分，三家各多输10分)');
  }

  // 杠后从牌墙末尾补一张牌入座 (杠上自摸机会)
  if (wallPool.length > 0) {
    const supp = wallPool.pop()!;
    wallCount.value = wallPool.length;
    myHand.value.push(supp);
    myHand.value = sortHand(myHand.value);

    // 杠后摸到第4张红中直接胡牌结束游戏！
    if (isHongzhongMode.value && myHand.value.filter(isHongzhong).length === 4) {
      drawTable();
      triggerMahjongWin(0, true);
      return;
    }

    tipMessage.value = `杠牌成功！补得【${supp.text}】，请自摸胡牌或出牌`;
  } else {
    tipMessage.value = '杠牌成功！牌墙已空，请打出一张牌';
  }

  selectedIndex.value = null;
  drawTable();
  sendGameMove('gang', { absSeat: mySeat.value });
  saveLocalSnapshot();
  if (isAutoHost.value) {
    checkAutoHostTurn();
  } else {
    startTurnCountdown();
  }
}

// 规则：仅自摸胡牌 (不可炮胡)，调用统一结算函数
function handleHu() {
  if (!canHu.value || hasWon.value || showSettlement.value || dealingPhase.value !== 'playing') return;
  const isFourHz = isHongzhongMode.value && myHand.value.filter(isHongzhong).length === 4;
  triggerMahjongWin(0, isFourHz);
}

let botTimer: any = null;

function runOpponentTurns() {
  passTurnToNext(0);
}

function passTurnToNext(fromRelSeat: number) {
  stopTurnCountdown();
  stopClaimCountdown();
  if (botTimer) clearTimeout(botTimer);
  if (hasWon.value || showSettlement.value || isDrawStalemate.value || dealingPhase.value !== 'playing') return;

  const nextRelSeat = (fromRelSeat + 1) % 4;
  const nextAbsSeat = relToAbsSeat(nextRelSeat);

  if (nextRelSeat === 0) {
    // 轮到本家 (玩家) 回合
    waitForPlayerClaim(() => {
      if (hasWon.value || showSettlement.value || isDrawStalemate.value || dealingPhase.value !== 'playing') return;
      turnPlayer.value = 0;
      startTurnCountdown();
      handleDraw();
    });
  } else {
    // 轮到其它席位 (真实牌友或电脑 AI)
    waitForPlayerClaim(() => {
      if (hasWon.value || showSettlement.value || isDrawStalemate.value || dealingPhase.value !== 'playing') return;
      turnPlayer.value = nextRelSeat;
      startTurnCountdown();
      drawTable();
      saveLocalSnapshot();

      if (isSeatBot(nextAbsSeat)) {
        if (isSeatDisconnected(nextAbsSeat)) {
          tipMessage.value = `🤖 【${SEAT_NAMES[nextRelSeat]}】 离线托管自动出牌中...`;
        } else if (isSeatAutoManaged(nextAbsSeat)) {
          tipMessage.value = `⚡ 【${SEAT_NAMES[nextRelSeat]}】 托管自动出牌中...`;
        }
        const thinkTime = Math.floor(400 + Math.random() * 400);
        const t = setTimeout(() => {
          if (hasWon.value || showSettlement.value || isDrawStalemate.value || dealingPhase.value !== 'playing') return;
          botPlay(nextRelSeat, () => {
            passTurnToNext(nextRelSeat);
          });
        }, thinkTime);
        botActionTimers.push(t);
      } else {
        // 🛡️ 真实连线牌友席位：等待真实玩家通过网络打牌，严禁本地代码替其代打！
        tipMessage.value = `轮到 【${SEAT_NAMES[nextRelSeat]}】 出牌...`;
        drawTable();
      }
    });
  }
}

function botPlay(seat: number, next: () => void) {
  if (hasWon.value || showSettlement.value || isDrawStalemate.value || dealingPhase.value !== 'playing') return;
  const botIdx = seat - 1; // 0=East, 1=North, 2=West
  const botHand = oppHands.value[botIdx] || [];

  // 1. 明杠与碰牌截击判断：检测上一张打出的牌（规则：全场仅限自摸和牌，没有点炮胡）
  if (lastDiscarded.value && lastDiscarded.value.discardBy !== seat) {
    const d = lastDiscarded.value;
    const matches = botHand.filter(c => c.type === d.type && c.value === d.value);
    const canMeld = !(isHongzhongMode.value && isHongzhong(d));

    // ② 明杠 (手牌持 3 张同牌 + 抓到他人打出牌)
    if (canMeld && matches.length === 3 && Math.random() < 0.95) {
      const takeThree = matches.slice(0, 3);
      const rmIds = new Set(takeThree.map(c => c.id));
      const remainingHand = botHand.filter(c => !rmIds.has(c.id));
      oppMelds.value[botIdx].push([...takeThree, d]);
      if (discards.value.length > 0 && discards.value[discards.value.length - 1].id === d.id) {
        discards.value.pop();
      }
      lastDiscarded.value = null;
      soundFX.playMahjongClack();
      soundFX.speakAction('gang', { isFemale: botIdx === 1 });
      tipMessage.value = `🀄 【${SEAT_NAMES[seat]}】大喊：杠！明杠拿下【${d.text}】`;

      // 杠后开花：补抓一张牌
      if (wallPool.length > 0) {
        const supp = wallPool.shift()!;
        wallCount.value = wallPool.length;
        remainingHand.push(supp);
      }
      oppHands.value[botIdx] = sortHand(remainingHand);
      drawTable();

      // 检查杠上开花
      const canGangHu = isHongzhongMode.value ? checkHongzhongWin(oppHands.value[botIdx]) : checkMahjongWin(oppHands.value[botIdx]);
      if (canGangHu) {
        triggerMahjongWin(seat, false);
        return;
      }

      const t = setTimeout(() => {
        if (hasWon.value || showSettlement.value || dealingPhase.value !== 'playing') return;
        const updatedHand = oppHands.value[botIdx];
        const bestDiscardIdx = findSmartBestDiscard(updatedHand);
        const [discarded] = updatedHand.splice(bestDiscardIdx, 1);
        discarded.discardBy = seat;
        oppHands.value[botIdx] = sortHand(updatedHand);

        discards.value.push(discarded);
        lastDiscarded.value = discarded;
        soundFX.playMahjongClack();
        soundFX.speakVoice(discarded.text);
        tipMessage.value = `🀄 【${SEAT_NAMES[seat]}】杠后打出了【${discarded.text}】`;
        drawTable();
        next();
      }, 1100);
      botActionTimers.push(t);
      return;
    }

    // ③ 碰牌 (手牌持 2 张同牌，依据听牌与牌型理性推理)
    if (canMeld && matches.length >= 2 && shouldSmartPeng(botHand, d)) {
      const takeTwo = matches.slice(0, 2);
      const rmIds = new Set(takeTwo.map(c => c.id));
      oppHands.value[botIdx] = botHand.filter(c => !rmIds.has(c.id));
      oppMelds.value[botIdx].push([...takeTwo, d]);
      if (discards.value.length > 0 && discards.value[discards.value.length - 1].id === d.id) {
        discards.value.pop();
      }
      lastDiscarded.value = null;
      soundFX.playMahjongClack();
      soundFX.speakAction('peng', { isFemale: botIdx === 1 });
      tipMessage.value = `🀄 【${SEAT_NAMES[seat]}】大喊：碰！拿下了【${d.text}】`;
      drawTable();

      const t = setTimeout(() => {
        if (hasWon.value || showSettlement.value || dealingPhase.value !== 'playing') return;
        const updatedHand = oppHands.value[botIdx];
        const bestDiscardIdx = findSmartBestDiscard(updatedHand);
        const [discarded] = updatedHand.splice(bestDiscardIdx, 1);
        discarded.discardBy = seat;
        oppHands.value[botIdx] = sortHand(updatedHand);

        discards.value.push(discarded);
        lastDiscarded.value = discarded;
        soundFX.playMahjongClack();
        soundFX.speakVoice(discarded.text);
        tipMessage.value = `🀄 【${SEAT_NAMES[seat]}】碰后打出了【${discarded.text}】`;
        drawTable();
        next();
      }, 1100);
      botActionTimers.push(t);
      return;
    }
  }

  // 2. 摸牌判断：仅在手牌为 3k+1 张（如13张）时从牌墙摸1张牌入座
  if (botHand.length % 3 === 1) {
    if (wallPool.length === 0) {
      isDrawStalemate.value = true;
      stopTurnCountdown();
      stopClaimCountdown();
      resetAutoHostState();
      tipMessage.value = '牌墙已摸空，荒牌流局！';
      drawTable();
      return;
    }
    const drawn = wallPool.shift()!;
    wallCount.value = wallPool.length;
    botHand.push(drawn);
  }

  // 规则：摸到四张红中直接结束游戏！
  if (isHongzhongMode.value && botHand.filter(isHongzhong).length === 4) {
    triggerMahjongWin(seat, true);
    return;
  }

  // Check if bot completed a winning hand by self-draw (自摸和牌)
  const botCanHu = isHongzhongMode.value ? checkHongzhongWin(botHand) : checkMahjongWin(botHand);
  if (botCanHu) {
    triggerMahjongWin(seat, false);
    return;
  }

  // Check for AnGang (4 identical tiles in hand)
  const counts = new Map<string, MahjongTile[]>();
  botHand.forEach(c => {
    const k = `${c.type}-${c.value}`;
    if (!counts.has(k)) counts.set(k, []);
    counts.get(k)!.push(c);
  });
  for (const tiles of counts.values()) {
    if (tiles.length === 4) {
      const ids = new Set(tiles.map(c => c.id));
      const remainingHand = botHand.filter(c => !ids.has(c.id));
      oppMelds.value[botIdx].push(tiles);
      if (wallPool.length > 0) {
        const supp = wallPool.shift()!;
        wallCount.value = wallPool.length;
        remainingHand.push(supp);
      }
      oppHands.value[botIdx] = sortHand(remainingHand);
      // 检查杠上开花
      const canGangHu = isHongzhongMode.value ? checkHongzhongWin(oppHands.value[botIdx]) : checkMahjongWin(oppHands.value[botIdx]);
      if (canGangHu) {
        triggerMahjongWin(seat, false);
        return;
      }
      break;
    }
  }

  // 2. Pro-level AI selection using findSmartBestDiscard
  const currentBotHand = oppHands.value[botIdx];
  const bestDiscardIdx = findSmartBestDiscard(currentBotHand);
  const [discarded] = currentBotHand.splice(bestDiscardIdx, 1);
  discarded.discardBy = seat;
  oppHands.value[botIdx] = sortHand(currentBotHand);

  // 3. Discarded tile is placed into river
  discards.value.push(discarded);
  lastDiscarded.value = discarded;
  soundFX.playMahjongClack();
  soundFX.speakVoice(discarded.text);
  tipMessage.value = `${['东席', '北席', '西席'][seat - 1]} 打出了【${discarded.text}】`;
  drawTable();
  saveLocalSnapshot();
  next();
}

function canPlayerClaimTile(tile: MahjongTile): boolean {
  if (!tile || hasWon.value || isDrawStalemate.value) return false;
  const matches = myHand.value.filter((c) => c.type === tile.type && c.value === tile.value);
  const canPengTile = !(isHongzhongMode.value && isHongzhong(tile));
  const playerCanPeng = canPengTile && matches.length >= 2;
  const playerCanGang = canPengTile && matches.length >= 3;
  return playerCanPeng || playerCanGang;
}

function handleRemoteGameEvent(evtAbsSeat: number, evt: any) {
  if (!evt || evtAbsSeat === mySeat.value) return;

  const relSeat = absToRelSeat(evtAbsSeat); // 1=East, 2=North, 3=West
  const botIdx = relSeat - 1; // 0, 1, 2

  if (evt.action === 'draw') {
    if (wallPool.length > 0) {
      const drawnTile = wallPool.shift();
      wallCount.value = wallPool.length;
      if (drawnTile) {
        oppHands.value[botIdx].push(drawnTile);
      }
    }
    turnPlayer.value = relSeat;
    ensureOpponentHandSize(botIdx);
    startTurnCountdown();
    tipMessage.value = `🀄 【${SEAT_NAMES[relSeat]}】 摸了一张牌`;
    drawTable();
    saveLocalSnapshot();
  } else if (evt.action === 'discard') {
    const tile = evt.tile;
    if (!tile) return;

    const oppHand = oppHands.value[botIdx] || [];
    const tileIdx = oppHand.findIndex((c) => c.type === tile.type && c.value === tile.value);
    if (tileIdx !== -1) {
      oppHand.splice(tileIdx, 1);
    } else if (oppHand.length > 0) {
      oppHand.pop();
    }
    tile.discardBy = relSeat;
    discards.value.push(tile);
    lastDiscarded.value = tile;
    turnPlayer.value = relSeat;
    ensureOpponentHandSize(botIdx);
    startTurnCountdown();

    soundFX.playMahjongClack();
    soundFX.speakVoice(tile.text);
    tipMessage.value = `🀄 【${SEAT_NAMES[relSeat]}】 打出了【${tile.text}】`;
    drawTable();
    saveLocalSnapshot();

    waitForPlayerClaim(() => {
      passTurnToNext(relSeat);
    });
  } else if (evt.action === 'peng') {
    const tile = evt.tile || lastDiscarded.value;
    const oppHand = oppHands.value[botIdx] || [];
    if (tile) {
      let removedCount = 0;
      let filtered = oppHand.filter((c) => {
        if (removedCount < 2 && c.type === tile.type && c.value === tile.value) {
          removedCount++;
          return false;
        }
        return true;
      });
      // Guarantee exactly 2 cards are removed from standing hand after Peng
      while (removedCount < 2 && filtered.length > 0) {
        filtered.pop();
        removedCount++;
      }
      oppHands.value[botIdx] = filtered;
      oppMelds.value[botIdx].push([tile, tile, tile]);
      if (discards.value.length > 0 && discards.value[discards.value.length - 1].id === tile.id) {
        discards.value.pop();
      }
      lastDiscarded.value = null;
    }
    turnPlayer.value = relSeat;
    ensureOpponentHandSize(botIdx);
    startTurnCountdown();
    soundFX.playMahjongClack();
    soundFX.speakAction('peng', { isFemale: botIdx === 1 });
    tipMessage.value = `🀄 【${SEAT_NAMES[relSeat]}】 大喊：碰！`;
    drawTable();
    saveLocalSnapshot();
  } else if (evt.action === 'gang') {
    const tile = evt.tile || lastDiscarded.value;
    const oppHand = oppHands.value[botIdx] || [];
    if (tile) {
      let removedCount = 0;
      let filtered = oppHand.filter((c) => {
        if (removedCount < 3 && c.type === tile.type && c.value === tile.value) {
          removedCount++;
          return false;
        }
        return true;
      });
      while (removedCount < 3 && filtered.length > 0) {
        filtered.pop();
        removedCount++;
      }
      oppHands.value[botIdx] = filtered;
      oppMelds.value[botIdx].push([tile, tile, tile, tile]);
      if (discards.value.length > 0 && discards.value[discards.value.length - 1].id === tile.id) {
        discards.value.pop();
      }
      lastDiscarded.value = null;
    }
    if (wallPool.length > 0) {
      const supp = wallPool.pop();
      wallCount.value = wallPool.length;
      if (supp) {
        oppHands.value[botIdx].push(supp);
      }
    }
    turnPlayer.value = relSeat;
    ensureOpponentHandSize(botIdx);
    soundFX.playMahjongClack();
    soundFX.speakAction('gang', { isFemale: botIdx === 1 });
    tipMessage.value = `🀄 【${SEAT_NAMES[relSeat]}】 大喊：杠！`;
    drawTable();
    saveLocalSnapshot();
  } else if (evt.action === 'hu') {
    if (hasWon.value || showSettlement.value || dealingPhase.value === 'settled') return;
    triggerMahjongWin(relSeat, Boolean(evt.isFourHz));
  } else if (evt.action === 'pass') {
    if (turnPlayer.value === relSeat) {
      passTurnToNext(relSeat);
    }
  }
}

let lastProcessedMoveCount = -1;
let lastProcessedMoveKey = '';

function onWsMessage(ev: MessageEvent) {
  if (props.isPracticeMode) return;
  try {
    const msg = JSON.parse(ev.data);
    if (msg.roomId && props.roomId && msg.roomId !== props.roomId) return;

    if (msg.type === 'game_deal') {
      lastProcessedMoveCount = -1;
      lastProcessedMoveKey = '';
      if (msg.deal) {
        clearLocalSnapshot();
        dealNewMatch(undefined, true, msg.deal);
      }
    } else if (msg.type === 'scene_reconnect_ack') {
      lastProcessedMoveCount = -1;
      lastProcessedMoveKey = '';
      handleReconnectSync(msg);
    } else if (msg.type === 'scene_join_ack' || msg.type === 'scene_room_full' || msg.type === 'scene_room_started') {
      lastProcessedMoveCount = -1;
      lastProcessedMoveKey = '';
      if (msg.deal) {
        const dealIdentifier = msg.deal.dealId || msg.deal.createdAt || '';
        if (dealIdentifier && dealIdentifier === lastAppliedDealId.value && dealingPhase.value === 'playing') {
          console.log('🛡️ [麻将防重置] 正在对局中且发牌一致，保持当前牌桌');
          return;
        }
        clearLocalSnapshot();
        dealNewMatch(undefined, false, msg.deal);
      }
    } else if (msg.type === 'scene_room_update') {
      if (msg.room && Array.isArray(msg.room.players)) {
        msg.room.players.forEach((p: any) => {
          if (p && typeof p.seat === 'number') {
            if (p.isAutoManaged || p.isDisconnected) {
              autoManagedSeats.value[p.seat] = true;
            } else {
              delete autoManagedSeats.value[p.seat];
            }
            if (p.isDisconnected) {
              disconnectedSeats.value[p.seat] = true;
            } else {
              delete disconnectedSeats.value[p.seat];
            }
          }
        });
        drawTable();
      }
    } else if (msg.type === 'set_auto_host') {
      const sSeat = typeof msg.seat === 'number' ? msg.seat : (typeof msg.absSeat === 'number' ? msg.absSeat : -1);
      const isManaged = Boolean(msg.isAutoManaged ?? msg.isAutoHost);
      const isDisc = Boolean(msg.isDisconnected);
      if (sSeat >= 0) {
        if (isManaged) {
          autoManagedSeats.value[sSeat] = true;
        } else {
          delete autoManagedSeats.value[sSeat];
        }
        if (isDisc) {
          disconnectedSeats.value[sSeat] = true;
        } else if (!isManaged) {
          delete disconnectedSeats.value[sSeat];
        }
        if (sSeat === mySeat.value) {
          isAutoHost.value = isManaged;
          if (isAutoHost.value && turnPlayer.value === 0) {
            checkAutoHostTurn();
          }
        }
        drawTable();
      }
    } else if (msg.type === 'game_event') {
      // 深度合并 payload 与 event，确保 tile、absSeat、action、combo 等关键对局字段绝不遗漏
      const evt: any = { ...(msg.payload || {}), ...(msg.event || {}) };
      if (!evt.tile && (msg.payload?.tile || msg.event?.tile)) {
        evt.tile = msg.payload?.tile || msg.event?.tile;
      }
      if (!evt.action && (msg.payload?.action || msg.event?.action)) {
        evt.action = msg.payload?.action || msg.event?.action;
      }
      if (!evt || !evt.action) return;

      if (evt.action === 'draw_stalemate') {
        isDrawStalemate.value = true;
        stopTurnCountdown();
        stopClaimCountdown();
        resetAutoHostState();
        clearLocalSnapshot();
        try {
          localStorage.removeItem('app_active_game_lock');
        } catch {}
        tipMessage.value = evt.message || '牌墙抓毕，本局荒庄（流局）！';
        emit('game-over', { gameType: 'mahjong', isDraw: true });
        drawTable();
        return;
      }

      const moveCount = typeof msg.moveCount === 'number' ? msg.moveCount : -1;
      const moveKey = `${evt.absSeat}_${evt.action}_${evt.tile?.id || ''}`;

      if (moveCount > 0 && moveCount === lastProcessedMoveCount) return;
      if (moveKey && moveKey === lastProcessedMoveKey && moveCount <= 0) return;

      if (moveCount > 0) lastProcessedMoveCount = moveCount;
      lastProcessedMoveKey = moveKey;

      const evtAbsSeat = typeof evt.absSeat === 'number' ? evt.absSeat : (typeof evt.seat === 'number' ? evt.seat : -1);

      if (evt.action === 'set_auto_host') {
        const isManaged = Boolean(evt.isAutoManaged ?? evt.isAutoHost);
        const isDisc = Boolean(evt.isDisconnected);
        if (evtAbsSeat >= 0) {
          if (isManaged) {
            autoManagedSeats.value[evtAbsSeat] = true;
          } else {
            delete autoManagedSeats.value[evtAbsSeat];
          }
          if (isDisc) {
            disconnectedSeats.value[evtAbsSeat] = true;
          } else if (!isManaged) {
            delete disconnectedSeats.value[evtAbsSeat];
          }
        }
        if (evtAbsSeat === mySeat.value) {
          isAutoHost.value = isManaged;
          if (isAutoHost.value && turnPlayer.value === 0) {
            checkAutoHostTurn();
          }
        }
        drawTable();
        return;
      }

      if (evtAbsSeat >= 0 && evtAbsSeat !== mySeat.value) {
        handleRemoteGameEvent(evtAbsSeat, evt);
      } else if (evtAbsSeat === mySeat.value && evt.autoDiscard) {
        // 服务端超时判定为本家自动打牌
        if (myHand.value.length > 0) {
          const disc = myHand.value.pop()!;
          disc.discardBy = 0;
          discards.value.push(disc);
          lastDiscarded.value = disc;
          myHand.value = sortHand(myHand.value);
        }
        isAutoHost.value = true;
        if (evt.nextTurn !== undefined) {
          turnPlayer.value = absToRelSeat(evt.nextTurn);
        } else {
          turnPlayer.value = 1;
        }
        drawTable();
      }
    }
  } catch {}
}

let cleanupMahjongLoader: (() => void) | null = null;

onMounted(() => {
  preloadMahjongAssets();
  cleanupMahjongLoader = onMahjongAssetsLoaded(() => {
    drawTable();
  });
  if (props.ws) {
    props.ws.addEventListener('message', onWsMessage);
  }
  const restored = tryRestoreLocalSnapshot();
  if (!restored) {
    if (props.initialDeal?.seatCards) {
      dealNewMatch(undefined, false, props.initialDeal);
    } else {
      dealNewMatch();
    }
  }
  updateDimensions();
  window.addEventListener('resize', updateDimensions);
  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  cleanupMahjongLoader?.();
  if (props.ws) {
    try {
      props.ws.removeEventListener('message', onWsMessage);
    } catch {}
  }
  window.removeEventListener('resize', updateDimensions);
  resizeObserver?.disconnect();
  cleanAllGameTimers();
});
</script>

<style scoped>
/* Scoped custom styling handled inside sub-components */
</style>
