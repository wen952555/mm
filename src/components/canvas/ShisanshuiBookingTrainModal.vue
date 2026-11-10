<template>
  <!-- Fullscreen Modal Overlay -->
  <div
    v-if="props.show"
    class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md select-none overflow-y-auto"
  >
    <!-- 1. 方位选座弹窗 (进入新车厢时，首先选定本节车厢的出战方位) -->
    <div
      v-if="props.modalType === 'select-seat'"
      class="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#2A1810] via-[#1A0E08] to-black border-2 border-amber-500/60 shadow-[0_0_50px_rgba(245,158,11,0.3)] p-4 sm:p-6 text-[#F5E8D0] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Ornate train header -->
      <div class="flex items-center gap-2 mb-1">
        <span class="text-3xl sm:text-4xl animate-bounce">🚂</span>
        <div class="text-center">
          <h2 class="text-lg sm:text-2xl font-black text-amber-300 font-serif-title tracking-wide flex items-center justify-center gap-2">
            十三张预约专列 · 第 {{ props.carriage?.carriageNumber || 1 }} 节车厢
          </h2>
          <div class="text-[10px] sm:text-xs text-amber-200/80 font-mono mt-0.5">
            第 {{ props.carriage?.carriageNumber || 1 }} 场次 · 每日凌晨 06:00 统一比水结算
          </div>
        </div>
      </div>

      <!-- Description Banner -->
      <div class="w-full my-3 px-3.5 py-2 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center">
        <p class="text-xs sm:text-sm text-amber-100 font-medium">
          请选择您在第 <span class="text-amber-300 font-bold font-mono">{{ props.carriage?.carriageNumber || 1 }}</span> 节车厢的固定坐席方位
        </p>
        <p class="text-[10px] sm:text-xs text-stone-400 mt-0.5">
          选定后，系统将从该车厢 <span class="text-amber-300 font-bold font-mono">10 张牌桌</span> 中乱序抽取一张对应方位的手牌由您理牌出战！
        </p>
      </div>

      <!-- Seat Grid (4 seats or 8 seats) -->
      <div
        class="w-full grid gap-2.5 sm:gap-3.5 my-2"
        :class="isEight ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'"
      >
        <button
          v-for="seat in seatsList"
          :key="seat"
          type="button"
          @click="onChooseSeat(seat)"
          class="group relative flex flex-col items-center justify-between p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-[#3A2215]/90 to-[#1F120A]/95 hover:from-[#502E1C] hover:to-[#2F1A0E] border-2 border-amber-500/40 hover:border-amber-400 shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-200 cursor-pointer active:scale-95 text-center overflow-hidden"
        >
          <div class="absolute top-1.5 right-1.5 text-xs opacity-75 group-hover:scale-125 transition-transform">
            {{ getSeatInfo(seat).icon }}
          </div>
          <div class="text-2xl sm:text-3xl font-black font-serif-title text-amber-300 group-hover:text-yellow-200 mt-1">
            【{{ seat }}位】
          </div>
          <div class="text-xs font-bold text-amber-200/90 mt-1">
            {{ getSeatInfo(seat).title }}
          </div>
          <div class="text-[10px] text-stone-400 font-mono mt-0.5 scale-90">
            {{ getSeatInfo(seat).desc }}
          </div>
          <div class="mt-2 w-full py-1 rounded-xl bg-amber-500/20 group-hover:bg-amber-400 group-hover:text-black text-amber-300 text-[11px] font-bold transition-colors">
            选择此席入座 →
          </div>
        </button>
      </div>

      <!-- Bottom Hint -->
      <div class="w-full mt-3 flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-white/10">
        <span class="flex items-center gap-1">
          <span>⏱️ 距离结算还有:</span>
          <span class="text-amber-300 font-mono font-bold">{{ props.countdownText }}</span>
        </span>
        <button
          type="button"
          @click="$emit('exit')"
          class="text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          暂存退出
        </button>
      </div>
    </div>

    <!-- 2. 封牌提交成功弹窗 (继续挑战下一桌 / 查看概况) -->
    <div
      v-else-if="props.modalType === 'submission-success'"
      class="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#2A1810] via-[#1A0E08] to-black border-2 border-emerald-500/70 shadow-[0_0_50px_rgba(16,185,129,0.3)] p-4 sm:p-6 text-[#F5E8D0] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(16,185,129,0.5)] mb-2 animate-bounce">
        ✅
      </div>

      <h2 class="text-lg sm:text-2xl font-black text-emerald-300 font-serif-title tracking-wide text-center">
        第 {{ props.submittedTable?.tableIndex }} 桌【{{ props.submittedTable?.playerSeat }}位】已封牌提交！
      </h2>

      <div class="text-xs sm:text-sm text-stone-300 font-medium text-center mt-1">
        手牌已安全归档，将于每日凌晨 06:00 统一比水结算
      </div>

      <!-- Submitted Hand Summary Preview -->
      <div
        v-if="props.submittedTable?.playerHand"
        class="w-full my-3 p-3 rounded-2xl bg-black/60 border border-white/10 flex flex-col gap-1.5"
      >
        <div class="text-[11px] text-amber-200 font-bold flex items-center justify-between pb-1 border-b border-white/10">
          <span>👑 您的提交阵型：</span>
          <span v-if="props.submittedTable.playerHand.specialHand" class="text-amber-300 font-mono font-bold">
            天降特殊牌【{{ props.submittedTable.playerHand.specialHand.name }}】(+{{ props.submittedTable.playerHand.specialHand.bonusWater }}水)
          </span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div class="p-2 rounded-xl bg-white/5 border border-white/10">
            <div class="text-[10px] text-stone-400">头道 (3张)</div>
            <div class="font-bold text-amber-300 mt-0.5 truncate">{{ props.submittedTable.playerHand.frontLabel }}</div>
            <div class="text-[10px] text-stone-400 font-mono mt-0.5">
              {{ props.submittedTable.playerHand.front.map(c => c.suit + c.label).join(' ') }}
            </div>
          </div>
          <div class="p-2 rounded-xl bg-white/5 border border-white/10">
            <div class="text-[10px] text-stone-400">中道 (5张)</div>
            <div class="font-bold text-blue-300 mt-0.5 truncate">{{ props.submittedTable.playerHand.midLabel }}</div>
            <div class="text-[10px] text-stone-400 font-mono mt-0.5">
              {{ props.submittedTable.playerHand.mid.map(c => c.suit + c.label).join(' ') }}
            </div>
          </div>
          <div class="p-2 rounded-xl bg-white/5 border border-white/10">
            <div class="text-[10px] text-stone-400">尾道 (5张)</div>
            <div class="font-bold text-rose-300 mt-0.5 truncate">{{ props.submittedTable.playerHand.backLabel }}</div>
            <div class="text-[10px] text-stone-400 font-mono mt-0.5">
              {{ props.submittedTable.playerHand.back.map(c => c.suit + c.label).join(' ') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Carriage Progress Meter -->
      <div class="w-full my-1.5 p-3 rounded-2xl bg-amber-950/30 border border-amber-500/25">
        <div class="flex items-center justify-between text-xs font-bold text-amber-200">
          <span>🚂 第 {{ props.carriage?.carriageNumber }} 节车厢进度</span>
          <span class="font-mono">{{ completedTablesCount }} / 10 桌已就席</span>
        </div>
        <div class="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10 mt-1.5 p-0.5">
          <div
            class="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
            :style="{ width: `${(completedTablesCount / 10) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="w-full flex flex-col gap-2 mt-3">
        <!-- 未通关车厢：继续挑战下一桌 -->
        <button
          v-if="remainingCount > 0"
          type="button"
          @click="$emit('next-table')"
          class="w-full py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white font-black text-sm sm:text-base shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-300 active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          <span>⚡ 继续挑战下一桌 (随机分配剩余 {{ remainingCount }} 桌之一)</span>
        </button>

        <!-- 已通关全部10桌：发车进入下一节车厢 -->
        <button
          v-else
          type="button"
          @click="$emit('advance-carriage')"
          class="w-full py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm sm:text-base shadow-[0_0_25px_rgba(245,158,11,0.6)] border border-yellow-300 active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-2 animate-pulse"
        >
          <span>🎉 恭喜通关！发车进入第 {{ (props.carriage?.carriageNumber || 1) + 1 }} 节车厢 (开启下一场次)</span>
        </button>

        <div class="flex items-center gap-2 w-full">
          <button
            type="button"
            @click="$emit('open-overview')"
            class="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E6DEC8] font-bold text-xs sm:text-sm border border-white/15 transition-all cursor-pointer active:scale-95"
          >
            🚂 查看车厢 10 桌全景
          </button>
          <button
            type="button"
            @click="$emit('exit')"
            class="px-4 py-2 rounded-xl bg-stone-900 hover:bg-red-950/80 text-stone-300 hover:text-red-300 font-bold text-xs sm:text-sm border border-white/10 transition-all cursor-pointer active:scale-95"
          >
            🚪 暂存退出
          </button>
        </div>
      </div>
    </div>

    <!-- 3. 车厢 10 桌总览与 06:00 结算中心 -->
    <div
      v-else-if="props.modalType === 'carriage-overview'"
      class="relative w-full max-w-3xl rounded-3xl bg-gradient-to-b from-[#2A1810] via-[#1A0E08] to-black border-2 border-amber-500/60 shadow-[0_0_50px_rgba(245,158,11,0.3)] p-4 sm:p-6 text-[#F5E8D0] flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Close button -->
      <button
        type="button"
        @click="$emit('close')"
        class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#D8C7B5] hover:text-white flex items-center justify-center text-sm cursor-pointer transition-all"
      >
        ✕
      </button>

      <!-- Header with Countdown -->
      <div class="flex items-center gap-2 mb-2 pr-8">
        <span class="text-3xl">🚂</span>
        <div>
          <h2 class="text-lg sm:text-xl font-black text-amber-300 font-serif-title flex items-center gap-2">
            十三张预约专列 · 第 {{ props.carriage?.carriageNumber }} 节车厢看板
            <span class="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/40 text-[11px] font-mono">
              【{{ props.carriage?.selectedSeat || '未选' }}位】
            </span>
          </h2>
          <div class="text-[11px] text-stone-300 flex items-center gap-2 mt-0.5">
            <span>⏱️ 距离每日 06:00 结算还有:</span>
            <span class="text-amber-300 font-mono font-bold">{{ props.countdownText }}</span>
          </div>
        </div>
      </div>

      <!-- Carriage Tabs: Current vs History Archive -->
      <div class="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-amber-500/30 w-full mb-2 shrink-0">
        <button
          type="button"
          @click="carriageViewTab = 'current'"
          :class="carriageViewTab === 'current' ? 'bg-amber-600 text-white font-bold' : 'text-amber-200/70 hover:text-white'"
          class="flex-1 py-1.5 text-xs rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>🚂</span>
          <span>当前出战车厢 (第 {{ props.carriage?.carriageNumber || 1 }} 场)</span>
        </button>
        <button
          type="button"
          @click="carriageViewTab = 'archive'"
          :class="carriageViewTab === 'archive' ? 'bg-amber-600 text-white font-bold' : 'text-amber-200/70 hover:text-white'"
          class="flex-1 py-1.5 text-xs rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>📜</span>
          <span>往期车厢战绩归档 ({{ allArchivedCarriages.length }})</span>
        </button>
      </div>

      <!-- View A: Current Carriage 10 Tables Grid -->
      <div v-if="carriageViewTab === 'current'" class="flex-1 overflow-y-auto my-2 pr-1 space-y-2">
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div
            v-for="table in props.carriage?.tables"
            :key="table.tableIndex"
            @click="table.isSubmitted && (inspectingTable = table)"
            class="relative rounded-2xl border p-2.5 flex flex-col justify-between transition-all"
            :class="[
              table.isSubmitted
                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md cursor-pointer hover:border-amber-400 hover:scale-[1.02]'
                : 'bg-stone-900/60 border-stone-800 opacity-80 cursor-default'
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-black font-mono text-amber-300">
                第 {{ table.tableIndex }} 桌
              </span>
              <span
                class="px-1.5 py-0.2 rounded text-[10px] font-bold"
                :class="table.isSubmitted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-stone-800 text-stone-400'"
              >
                {{ table.isSubmitted ? '✅ 已提交 (点击复盘)' : '⏳ 待挑战' }}
              </span>
            </div>

            <!-- Seat tag -->
            <div class="text-[11px] text-amber-200/90 font-mono my-1 flex items-center justify-between">
              <span>坐席: 【{{ table.playerSeat || props.carriage?.selectedSeat || '—' }}位】</span>
              <span v-if="table.playerHand?.specialHand" class="text-[9px] text-amber-300 font-bold bg-amber-500/20 px-1 rounded">
                👑 {{ table.playerHand.specialHand.name }}
              </span>
            </div>

            <!-- Hand info if submitted -->
            <div v-if="table.isSubmitted && table.playerHand" class="text-[10px] text-stone-300 font-mono leading-tight space-y-0.5">
              <div class="truncate text-amber-200">头: {{ table.playerHand.frontLabel }}</div>
              <div class="truncate text-blue-200">中: {{ table.playerHand.midLabel }}</div>
              <div class="truncate text-rose-200">尾: {{ table.playerHand.backLabel }}</div>
            </div>
            <div v-else class="text-[10px] text-stone-500 font-mono py-1">
              等待随机分配挑战
            </div>

            <!-- If table was simulated/settled -->
            <div
              v-if="table.settlement?.isSettled"
              class="mt-1 pt-1 border-t border-white/10 text-[10px] font-mono font-bold flex items-center justify-between"
            >
              <span class="text-stone-400">比水结果:</span>
              <span :class="table.settlement.totalWater >= 0 ? 'text-amber-300' : 'text-red-400'">
                {{ table.settlement.totalWater >= 0 ? `+${table.settlement.totalWater}` : table.settlement.totalWater }} 水
              </span>
            </div>
          </div>
        </div>

        <!-- 06:00 Settlement Explanation Banner -->
        <div class="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-100 flex items-start gap-2">
          <span class="text-base shrink-0">📜</span>
          <div class="space-y-1">
            <div class="font-bold text-amber-300">每日 06:00 预约场统一比水规则说明：</div>
            <div class="text-stone-300 text-[11px] leading-relaxed">
              • 每天清晨 06:00 整，系统将汇总全部已封盘提交的牌桌，与本桌其他坐席的预留牌型进行标准十三张比水结算。<br />
              • 您也可以点击下方【提前模拟06:00比水测算】按钮，即时预览当前已提交牌桌的战力得分与水数！
            </div>
          </div>
        </div>
      </div>

      <!-- View B: Historical Archived Carriages List -->
      <div v-else class="flex-1 overflow-y-auto my-2 pr-1 space-y-2.5">
        <div v-if="allArchivedCarriages.length === 0" class="p-8 text-center text-stone-400 text-xs bg-stone-900/40 rounded-2xl border border-white/5">
          <span class="text-3xl block mb-2">📦</span>
          暂无往期已完结车厢记录。完成当前车厢 10 桌挑战后将自动归档入册！
        </div>
        <div
          v-for="car in allArchivedCarriages"
          :key="car.carriageNumber"
          class="p-3.5 rounded-2xl bg-stone-900/80 border border-amber-500/40 space-y-2 shadow-md"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg">🚂</span>
              <span class="font-bold text-amber-300 text-sm">第 {{ car.carriageNumber }} 节车厢 (第 {{ car.carriageNumber }} 场次)</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                【{{ car.selectedSeat || '东' }}位】
              </span>
            </div>
            <span class="text-[11px] text-emerald-400 font-mono font-bold">
              {{ car.tables.filter(t => t.isSubmitted).length }} / 10 桌已对决
            </span>
          </div>

          <!-- Mini 10 tables status bar -->
          <div class="grid grid-cols-5 sm:grid-cols-10 gap-1 pt-1">
            <div
              v-for="t in car.tables"
              :key="t.tableIndex"
              @click="t.isSubmitted && (inspectingTable = t)"
              class="p-1.5 rounded-lg text-center font-mono text-[10px] border cursor-pointer hover:border-amber-400 transition-colors"
              :class="t.isSubmitted ? (t.settlement?.totalWater && t.settlement.totalWater >= 0 ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-red-950/60 border-red-500/50 text-red-300') : 'bg-stone-800 border-stone-700 text-stone-500'"
            >
              <div>#{{ t.tableIndex }}</div>
              <div class="font-bold">{{ t.settlement?.totalWater !== undefined ? (t.settlement.totalWater >= 0 ? `+${t.settlement.totalWater}` : t.settlement.totalWater) : '已交' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 shrink-0">
        <div class="flex items-center gap-2">
          <!-- 提前模拟测算按钮 -->
          <button
            type="button"
            @click="$emit('simulate-settle')"
            class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span>⚡ 提前模拟 06:00 比水测算</span>
          </button>

          <!-- 若全桌通关，开启下一节车厢 -->
          <button
            v-if="props.carriage?.isCompleted"
            type="button"
            @click="$emit('advance-carriage')"
            class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span>🚂 发车进入第 {{ (props.carriage?.carriageNumber || 1) + 1 }} 节车厢</span>
          </button>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm cursor-pointer transition-all"
        >
          返回牌桌
        </button>
      </div>
    </div>

    <!-- 4. 模拟比水结算战报弹窗 -->
    <div
      v-else-if="props.modalType === 'settlement-result'"
      class="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#2A1810] via-[#1A0E08] to-black border-2 border-amber-500/70 shadow-[0_0_50px_rgba(245,158,11,0.4)] p-4 sm:p-6 text-[#F5E8D0] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
    >
      <button
        type="button"
        @click="$emit('close')"
        class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#D8C7B5] hover:text-white flex items-center justify-center text-sm cursor-pointer transition-all"
      >
        ✕
      </button>

      <div class="text-center mb-3">
        <h2 class="text-xl sm:text-2xl font-black text-amber-300 font-serif-title flex items-center justify-center gap-2">
          <span>🏆</span>
          <span>第 {{ props.settlementRecord?.carriageNumber }} 节车厢比水测算战报</span>
        </h2>
        <div class="text-xs text-stone-300 font-mono mt-0.5">
          共测算 {{ props.settlementRecord?.settledTablesCount }} 张已提交牌桌 · 每日 06:00 准时统一结算入账
        </div>
      </div>

      <!-- Total Score Card -->
      <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-black/80 to-amber-950/60 border border-amber-500/40 text-center mb-3">
        <div class="text-xs text-stone-400">已测算总净胜水数</div>
        <div
          class="text-2xl sm:text-3xl font-black font-mono my-0.5"
          :class="(props.settlementRecord?.totalWater || 0) >= 0 ? 'text-amber-300' : 'text-red-400'"
        >
          {{ (props.settlementRecord?.totalWater || 0) >= 0 ? `+${props.settlementRecord?.totalWater}` : props.settlementRecord?.totalWater }}
          <span class="text-sm font-sans font-bold">水</span>
        </div>
        <div class="text-xs text-amber-200/80 font-mono">
          预估对应结算筹码: {{ (props.settlementRecord?.netScore || 0) >= 0 ? `+${props.settlementRecord?.netScore}` : props.settlementRecord?.netScore }} 分
        </div>
      </div>

      <!-- Table by table breakdown -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-1.5 my-1">
        <div
          v-for="sum in props.settlementRecord?.tablesSummary"
          :key="sum.tableIndex"
          class="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono"
        >
          <div class="flex items-center gap-2">
            <span class="font-bold text-amber-300">第 {{ sum.tableIndex }} 桌</span>
            <span class="text-stone-400">【{{ sum.playerSeat }}位】</span>
            <span v-if="sum.specialHandName" class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
              👑 {{ sum.specialHandName }}
            </span>
          </div>
          <span
            class="font-black text-sm"
            :class="sum.totalWater >= 0 ? 'text-amber-300' : 'text-red-400'"
          >
            {{ sum.totalWater >= 0 ? `+${sum.totalWater}` : sum.totalWater }} 水
          </span>
        </div>
      </div>

      <div class="pt-3 border-t border-white/10 mt-2 flex items-center justify-end">
        <button
          type="button"
          @click="$emit('close')"
          class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm cursor-pointer transition-all active:scale-95"
        >
          明白，继续理牌
        </button>
      </div>
    </div>

    <!-- 5. 牌桌手牌复盘弹窗 (点击 10 桌看板任意已提交牌桌触发) -->
    <div
      v-if="inspectingTable"
      class="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/85 backdrop-blur-lg select-none"
    >
      <div class="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#2A1810] via-[#1A0E08] to-black border-2 border-amber-500/70 shadow-[0_0_50px_rgba(245,158,11,0.5)] p-4 sm:p-5 text-[#F5E8D0] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          @click="inspectingTable = null"
          class="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#D8C7B5] hover:text-white flex items-center justify-center text-sm cursor-pointer transition-all"
        >
          ✕
        </button>

        <div class="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
          <span class="text-2xl">🔍</span>
          <div>
            <h3 class="text-base sm:text-lg font-black text-amber-300 font-serif-title flex items-center gap-2">
              第 {{ inspectingTable.tableIndex }} 桌复盘详单
              <span class="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                【{{ inspectingTable.playerSeat }}位】
              </span>
            </h3>
            <div class="text-[10px] text-stone-400 font-mono">
              提交时间: {{ inspectingTable.submittedAt ? new Date(inspectingTable.submittedAt).toLocaleTimeString() : '—' }}
            </div>
          </div>
        </div>

        <!-- Cards layout -->
        <div v-if="inspectingTable.playerHand" class="space-y-2 my-2">
          <div v-if="inspectingTable.playerHand.specialHand" class="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <span>👑 天降特殊牌：</span>
            <span>【{{ inspectingTable.playerHand.specialHand.name }}】(+{{ inspectingTable.playerHand.specialHand.bonusWater }}水)</span>
          </div>

          <div class="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <div>
              <div class="text-[10px] text-stone-400 font-bold mb-0.5">头道 (3张) · {{ inspectingTable.playerHand.frontLabel }}</div>
              <div class="flex gap-1.5 font-mono text-xs font-bold">
                <span v-for="c in inspectingTable.playerHand.front" :key="c.id" :class="c.isRed ? 'text-red-400' : 'text-slate-200'" class="px-2 py-1 rounded bg-black/60 border border-white/10">
                  {{ c.suit }}{{ c.label }}
                </span>
              </div>
            </div>

            <div>
              <div class="text-[10px] text-stone-400 font-bold mb-0.5">中道 (5张) · {{ inspectingTable.playerHand.midLabel }}</div>
              <div class="flex gap-1.5 font-mono text-xs font-bold">
                <span v-for="c in inspectingTable.playerHand.mid" :key="c.id" :class="c.isRed ? 'text-red-400' : 'text-slate-200'" class="px-2 py-1 rounded bg-black/60 border border-white/10">
                  {{ c.suit }}{{ c.label }}
                </span>
              </div>
            </div>

            <div>
              <div class="text-[10px] text-stone-400 font-bold mb-0.5">尾道 (5张) · {{ inspectingTable.playerHand.backLabel }}</div>
              <div class="flex gap-1.5 font-mono text-xs font-bold">
                <span v-for="c in inspectingTable.playerHand.back" :key="c.id" :class="c.isRed ? 'text-red-400' : 'text-slate-200'" class="px-2 py-1 rounded bg-black/60 border border-white/10">
                  {{ c.suit }}{{ c.label }}
                </span>
              </div>
            </div>
          </div>

          <!-- Versus result breakdown if simulated -->
          <div v-if="inspectingTable.settlement?.opponentsBreakdown" class="p-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono">
            <div class="font-bold text-amber-300 mb-1 flex items-center justify-between">
              <span>⚔️ 比水对决详单:</span>
              <span :class="inspectingTable.settlement.totalWater >= 0 ? 'text-amber-300' : 'text-red-400'">
                净胜 {{ inspectingTable.settlement.totalWater >= 0 ? `+${inspectingTable.settlement.totalWater}` : inspectingTable.settlement.totalWater }} 水
              </span>
            </div>
            <div class="space-y-1 text-[11px]">
              <div
                v-for="opp in inspectingTable.settlement.opponentsBreakdown"
                :key="opp.seatName"
                class="flex items-center justify-between text-stone-300"
              >
                <span>vs {{ opp.seatName }}</span>
                <span :class="opp.finalWater >= 0 ? 'text-emerald-300' : 'text-red-400'">
                  {{ opp.finalWater >= 0 ? `+${opp.finalWater}` : opp.finalWater }} 水
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-2 pt-2 border-t border-white/10 flex justify-end">
          <button
            type="button"
            @click="inspectingTable = null"
            class="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs cursor-pointer hover:bg-amber-400"
          >
            关闭复盘
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  BookingCarriageState,
  BookingTableState,
  BookingSettlementRecord,
  BookingSeat,
  SEATS_4,
  SEATS_8,
  SEAT_DESCRIPTIONS,
  getAllCarriages,
} from '../../engine/shisanshuiBookingTrain';

const inspectingTable = ref<BookingTableState | null>(null);
const carriageViewTab = ref<'current' | 'archive'>('current');

const props = defineProps<{
  show: boolean;
  modalType: 'select-seat' | 'submission-success' | 'carriage-overview' | 'settlement-result';
  sceneMode: 'four-booking' | 'eight-booking';
  carriage: BookingCarriageState | null;
  submittedTable: BookingTableState | null;
  countdownText: string;
  formattedTargetTime: string;
  settlementRecord: BookingSettlementRecord | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select-seat', seat: BookingSeat): void;
  (e: 'next-table'): void;
  (e: 'open-overview'): void;
  (e: 'advance-carriage'): void;
  (e: 'simulate-settle'): void;
  (e: 'exit'): void;
  (e: 'open-poster'): void;
}>();

const allArchivedCarriages = computed(() => {
  return getAllCarriages(props.sceneMode).filter(
    (c) => c.carriageNumber !== props.carriage?.carriageNumber || c.isCompleted
  );
});

const isEight = computed(() => props.sceneMode === 'eight-booking');

const seatsList = computed(() => (isEight.value ? SEATS_8 : SEATS_4));

const completedTablesCount = computed(() => {
  if (!props.carriage) return 0;
  return props.carriage.tables.filter((t) => t.isSubmitted).length;
});

const remainingCount = computed(() => {
  if (!props.carriage) return 10;
  return props.carriage.unplayedTableIndices.length;
});

function getSeatInfo(seat: string) {
  return SEAT_DESCRIPTIONS[seat] || { title: seat, desc: '吉位出战', icon: '🧭' };
}

function onChooseSeat(seat: BookingSeat) {
  emit('select-seat', seat);
}
</script>
