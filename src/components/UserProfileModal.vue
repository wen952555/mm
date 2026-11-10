<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none overflow-hidden">
      <div
        class="w-[94vw] max-w-2xl max-h-[90dvh] rounded-3xl bg-[#EFE5D3] border border-[#D8C7B0] p-3.5 sm:p-5 shadow-2xl flex flex-col justify-between overflow-hidden text-[#3C2C1E]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between pb-2.5 border-b border-[#D8C7B0] shrink-0 gap-2 bg-[#FAF4E8] -mx-3.5 -mt-3.5 sm:-mx-5 sm:-mt-5 p-3.5 sm:p-5">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="text-2xl sm:text-3xl p-1.5 sm:p-2 rounded-xl bg-[#EFE5D3] border border-[#D8C7B0] shrink-0">{{ profile.avatar }}</span>
            <div class="min-w-0">
              <h3 class="text-base sm:text-lg font-bold text-[#3C2C1E] font-serif-title flex items-center gap-2 truncate">
                <span class="truncate">{{ profile.name }}</span>
                <span class="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#EFE5D3] text-[#3C2C1E] border border-[#D8C7B0] font-mono shrink-0">
                  LV.{{ profile.level }} 棋道雅士
                </span>
              </h3>
              <p class="text-[11px] sm:text-xs text-[#6B5744] tabular-nums mt-0.5 truncate">
                ID: {{ profile.id }} · 天梯积分：{{ profile.rating }} · 筹码金币：{{ profile.coins }} 分
              </p>
            </div>
          </div>
          <button type="button" @click="$emit('close')" class="w-7 h-7 rounded-full bg-[#EFE5D3] hover:bg-[#E5D7C2] border border-[#D8C7B0] flex items-center justify-center text-xs text-[#3C2C1E] transition-colors cursor-pointer shrink-0">
            ✕
          </button>
        </div>

      <!-- Tab Navigation -->
      <div class="flex items-center gap-1.5 my-2.5 p-1 bg-[#FAF4E8] rounded-xl border border-[#D8C7B0] shrink-0">
        <button
          type="button"
          @click="activeTab = 'stats'"
          :class="activeTab === 'stats' ? 'bg-[#5C4533] text-[#FAF4E8] font-bold shadow-xs' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
          class="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors"
        >
          三大棋种战绩
        </button>
        <button
          type="button"
          @click="activeTab = 'records'"
          :class="activeTab === 'records' ? 'bg-[#5C4533] text-[#FAF4E8] font-bold shadow-xs' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
          class="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors"
        >
          历史对局详单 ({{ records.length }})
        </button>
        <button
          type="button"
          @click="activeTab = 'settings'"
          :class="activeTab === 'settings' ? 'bg-[#5C4533] text-[#FAF4E8] font-bold shadow-xs' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
          class="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors"
        >
          名号与数据备份
        </button>
        <button
          type="button"
          @click="activeTab = 'sound'"
          :class="activeTab === 'sound' ? 'bg-[#5C4533] text-[#FAF4E8] font-bold shadow-xs' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
          class="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors"
        >
          🎵 声音与分轨
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-4">
        <!-- Tab 1: Stats -->
        <div v-if="activeTab === 'stats'" class="space-y-4">
          <!-- Stats Grid (三大经典棋种) -->
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="key in ACTIVE_GAME_KEYS"
              :key="key"
              class="p-3.5 rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] shadow-xs"
            >
              <div class="text-xs font-bold text-[#3C2C1E] mb-1 font-serif-title">{{ GAME_NAMES[key] || key }}</div>
              <div class="text-xs text-[#6B5744] tabular-nums leading-relaxed">
                <div>总场次：{{ profile.stats[key]?.played || 0 }} 局</div>
                <div>胜率：{{ (profile.stats[key]?.played || 0) > 0 ? Math.round(((profile.stats[key]?.won || 0) / (profile.stats[key]?.played || 1)) * 100) : 0 }}% ({{ profile.stats[key]?.won || 0 }}胜)</div>
                <div class="text-[#5C4533] font-bold">最高分/番：{{ profile.stats[key]?.highestScore || 0 }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Records -->
        <div v-else-if="activeTab === 'records'" class="space-y-2.5">
          <!-- Filter Sub-nav: 全部 / 联机天梯 / 单机试玩 -->
          <div class="flex items-center justify-between pb-1">
            <div class="flex items-center gap-1.5 p-0.5 bg-[#FAF4E8] rounded-lg border border-[#D8C7B0] text-[11px]">
              <button
                type="button"
                @click="recordFilter = 'all'"
                :class="recordFilter === 'all' ? 'bg-[#5C4533] text-[#FAF4E8] font-bold shadow-xs' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
                class="px-2.5 py-0.5 rounded-md transition-all cursor-pointer"
              >
                全部 ({{ displayedRecords.length }})
              </button>
              <button
                type="button"
                @click="recordFilter = 'ladder'"
                :class="recordFilter === 'ladder' ? 'bg-[#5C4533] text-[#FAF4E8] font-bold shadow-xs' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
                class="px-2.5 py-0.5 rounded-md transition-all cursor-pointer"
              >
                🏆 联机天梯 ({{ ladderRecords.length }})
              </button>
              <button
                type="button"
                @click="recordFilter = 'practice'"
                :class="recordFilter === 'practice' ? 'bg-[#5C4533] text-[#FAF4E8] font-bold shadow-xs' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
                class="px-2.5 py-0.5 rounded-md transition-all cursor-pointer"
              >
                🎮 单机演练 ({{ practiceRecords.length }})
              </button>
            </div>

            <button
              v-if="recordFilter === 'practice' && practiceRecords.length > 0"
              type="button"
              @click="handleClearPracticeRecords"
              class="text-[10px] text-stone-500 hover:text-red-700 underline cursor-pointer"
            >
              清空单机记录
            </button>
          </div>

          <div v-if="displayedRecords.length === 0" class="text-center py-10 text-xs text-[#6B5744] bg-[#FFFDF8] rounded-xl border border-dashed border-[#D8C7B0]">
            {{ recordFilter === 'practice' ? '暂无离线单机试玩记录，随时在大厅点击【单机试玩】体验！' : '暂无历史战绩对局记录' }}
          </div>
          <div
            v-for="rec in displayedRecords"
            :key="rec.id"
            class="p-3 rounded-lg bg-[#FFFDF8] hover:bg-[#FAF4E8] border border-[#D8C7B0] flex items-center justify-between text-xs shadow-xs transition-colors"
          >
            <div class="min-w-0 pr-2">
              <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                <span class="font-bold text-[#3C2C1E]">{{ rec.gameName }}</span>
                <span
                  v-if="rec.details.includes('单机') || rec.gameName.includes('试玩')"
                  class="font-mono px-1.5 py-0.2 rounded bg-amber-100/90 text-amber-800 border border-amber-300/60 text-[9px] font-bold"
                >
                  🎮单机演练
                </span>
                <span
                  :class="rec.result === 'win' ? 'text-emerald-800 bg-emerald-100' : (rec.result === 'draw' ? 'text-amber-800 bg-amber-100' : 'text-stone-600 bg-stone-100')"
                  class="font-semibold px-1.5 py-0.2 rounded text-[10px]"
                >
                  {{ rec.result === 'win' ? '【大捷】' : (rec.result === 'draw' ? '【打和】' : '【失利】') }}
                </span>
                <span class="text-[#6B5744] tabular-nums text-[11px]">{{ rec.timestamp }}</span>
              </div>
              <div class="text-[11px] text-[#6B5744] truncate">{{ rec.details }}</div>
            </div>
            <div class="flex items-center gap-2.5 shrink-0">
              <div class="text-right tabular-nums">
                <div :class="rec.coinsDelta >= 0 ? 'text-emerald-800' : 'text-red-700'" class="font-bold">
                  {{ rec.coinsDelta >= 0 ? `+${rec.coinsDelta}` : rec.coinsDelta }} 金币
                </div>
                <div class="text-[10px] text-[#6B5744]">天梯 {{ rec.ratingDelta >= 0 ? `+${rec.ratingDelta}` : rec.ratingDelta }}</div>
              </div>
              <button
                type="button"
                @click="$emit('open-poster', rec)"
                class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title="生成本局专属战绩海报图片"
              >
                <span>🎨</span>
                <span>海报</span>
              </button>
              <button
                type="button"
                @click="openReplay(rec)"
                class="px-2.5 py-1 rounded-lg bg-[#5C4533] hover:bg-[#433022] text-[#FAF4E8] text-[11px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title="查看本局牌谱复盘与推演"
              >
                <span>📜</span>
                <span>复盘</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tab 3: Settings & Data Backup -->
        <div v-else-if="activeTab === 'settings'" class="space-y-4 text-xs">
          <div>
            <label class="block text-[#6B5744] mb-1">修改名号</label>
            <input
              v-model="profile.name"
              type="text"
              class="w-full px-3 py-2 rounded-lg bg-[#FFFDF8] border border-[#D8C7B0] text-[#3C2C1E]"
            />
          </div>

          <div>
            <label class="block text-[#6B5744] mb-1.5">挑选雅号头像</label>
            <div class="flex items-center gap-2">
              <button
                v-for="a in AVATARS"
                :key="a"
                type="button"
                @click="profile.avatar = a"
                :class="profile.avatar === a ? 'border-[#5C4533] bg-[#EFE5D3]' : 'border-[#D8C7B0] bg-[#FFFDF8]'"
                class="w-9 h-9 rounded-lg border text-lg flex items-center justify-center transition-colors"
              >
                {{ a }}
              </button>
            </div>
          </div>

          <div class="pt-2 border-t border-[#D8C7B0] flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="exportJson"
                class="px-3.5 py-1.5 rounded-lg bg-[#FAF4E8] hover:bg-[#EFE5D3] text-[#3C2C1E] border border-[#D8C7B0] transition-colors"
              >
                📥 导出战绩 JSON
              </button>
              <label class="px-3.5 py-1.5 rounded-lg bg-[#FAF4E8] hover:bg-[#EFE5D3] text-[#3C2C1E] border border-[#D8C7B0] cursor-pointer transition-colors inline-flex items-center">
                <span>📤 导入恢复战绩</span>
                <input type="file" accept=".json" @change="importJson" class="hidden" />
              </label>
            </div>
            <button
              type="button"
              @click="resetData"
              class="px-3.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 transition-colors"
            >
              重置战绩数据
            </button>
          </div>
          <div v-if="importNotice" class="text-xs text-[#3C2C1E] bg-[#FAF4E8] p-2 rounded border border-[#D8C7B0]">
            {{ importNotice }}
          </div>
        </div>

        <!-- Tab 4: Sound & Dual Volume Sliders -->
        <div v-else-if="activeTab === 'sound'" class="space-y-4 text-xs">
          <div class="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#D8C7B0] shadow-xs space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-[#D8C7B0]">
              <div class="flex items-center gap-2">
                <span class="text-xl">🔊</span>
                <div>
                  <div class="font-bold text-[#3C2C1E]">全茶楼音效总开关</div>
                  <div class="text-[10px] text-[#6B5744]">静音或开启所有牌桌配音与环境背景音</div>
                </div>
              </div>
              <button
                type="button"
                @click="onToggleSound"
                class="px-3 py-1 rounded-xl font-bold text-xs cursor-pointer transition-all border"
                :class="isSoundOn ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-stone-300 text-stone-700 border-stone-400'"
              >
                {{ isSoundOn ? '已开启' : '已静音' }}
              </button>
            </div>

            <!-- Voice / SFX Volume Slider -->
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center justify-between">
                <label class="font-bold text-[#3C2C1E] flex items-center gap-1.5">
                  <span>🗣️</span>
                  <span>出牌真人配音与操作音效</span>
                </label>
                <span class="font-mono text-emerald-800 font-bold tabular-nums">{{ voiceVol }}%</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-[10px] text-[#6B5744]">0%</span>
                <input
                  v-model.number="voiceVol"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  @input="onVoiceVolChange"
                  class="flex-1 accent-amber-700 cursor-pointer h-2 bg-[#FAF4E8] rounded-lg"
                />
                <span class="text-[10px] text-[#6B5744]">100%</span>
                <button
                  type="button"
                  @click="testVoiceSound"
                  class="px-2.5 py-1 rounded-lg bg-[#FAF4E8] hover:bg-[#EFE5D3] border border-[#D8C7B0] font-bold text-[11px] text-[#3C2C1E] cursor-pointer shrink-0"
                >
                  🔊 试听配音
                </button>
              </div>
            </div>

            <!-- BGM Volume Slider -->
            <div class="space-y-1.5 pt-2 border-t border-[#D8C7B0]">
              <div class="flex items-center justify-between">
                <label class="font-bold text-[#3C2C1E] flex items-center gap-1.5">
                  <span>🎵</span>
                  <span>背景古筝乐与茶楼环境氛围</span>
                </label>
                <span class="font-mono text-amber-800 font-bold tabular-nums">{{ bgmVol }}%</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-[10px] text-[#6B5744]">0%</span>
                <input
                  v-model.number="bgmVol"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  @input="onBgmVolChange"
                  class="flex-1 accent-amber-700 cursor-pointer h-2 bg-[#FAF4E8] rounded-lg"
                />
                <span class="text-[10px] text-[#6B5744]">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="pt-3 mt-3 border-t border-[#D8C7B0] flex items-center justify-between">
        <span class="text-[11px] text-[#6B5744]">数据已本地与服务端双通道实时持久化存储</span>
        <button
          type="button"
          @click="saveAndClose"
          class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] border border-[#7D6049] transition-colors"
        >
          保存并返回对局
        </button>
      </div>
    </div>
  </div>
  </Teleport>

  <!-- 牌谱复盘推演模态框 (独立顶层 Teleport) -->
  <Teleport to="body">
    <div
      v-if="selectedReplay"
      class="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none"
    >
      <div class="w-full max-w-lg rounded-3xl bg-[#EFE5D3] border-2 border-amber-500/60 p-5 shadow-2xl flex flex-col max-h-[88vh] text-[#3C2C1E]">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-[#D8C7B0] mb-3 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xl">📜</span>
            <div>
              <h4 class="font-bold text-base text-[#3C2C1E] font-serif-title flex items-center gap-2">
                <span>{{ selectedReplay.gameName }} · 牌谱战绩复盘</span>
                <span
                  class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                  :class="selectedReplay.result === 'win' ? 'bg-emerald-100 text-emerald-800' : (selectedReplay.result === 'draw' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')"
                >
                  {{ selectedReplay.result === 'win' ? '胜利大捷' : (selectedReplay.result === 'draw' ? '平局打和' : '遗憾失利') }}
                </span>
              </h4>
              <p class="text-[11px] text-[#6B5744] mt-0.5">对局时间：{{ selectedReplay.timestamp }} · 收益：{{ selectedReplay.coinsDelta >= 0 ? `+${selectedReplay.coinsDelta}` : selectedReplay.coinsDelta }} 分</p>
            </div>
          </div>
          <button
            type="button"
            @click="selectedReplay = null"
            class="w-7 h-7 rounded-full bg-[#FAF4E8] hover:bg-[#E5D7C2] border border-[#D8C7B0] flex items-center justify-center text-xs text-[#3C2C1E] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Replay Body -->
        <div class="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          <!-- 战局概要卡片 -->
          <div class="p-3 rounded-2xl bg-[#FFFDF8] border border-[#D8C7B0] shadow-xs space-y-1.5">
            <div class="font-bold text-[#5C4533] flex items-center gap-1.5">
              <span>🎯</span>
              <span>战局战报结论</span>
            </div>
            <div class="text-[11px] text-[#3C2C1E] leading-relaxed">
              {{ selectedReplay.details }}
            </div>
            <div v-if="selectedReplay.replayData?.summary" class="text-[11px] text-amber-800 font-medium pt-1 border-t border-[#D8C7B0]">
              {{ selectedReplay.replayData.summary }}
            </div>
            <div v-if="selectedReplay.replayData?.alliances" class="text-[10px] text-purple-800 font-mono">
              阵营对抗：{{ selectedReplay.replayData.alliances }}
            </div>
          </div>

          <!-- 复盘推演步骤进度 -->
          <div class="p-3 rounded-2xl bg-[#FAF4E8] border border-[#D8C7B0] shadow-xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-[#3C2C1E] flex items-center gap-1.5">
                <span>🎬</span>
                <span>关键攻防对局推演</span>
                <span class="text-[10px] text-[#6B5744] font-mono">({{ replayStep + 1 }}/{{ replayRounds.length }})</span>
              </span>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="replayStep = Math.max(0, replayStep - 1)"
                  :disabled="replayStep <= 0"
                  class="px-2 py-0.5 rounded bg-[#FFFDF8] border border-[#D8C7B0] text-[10px] font-bold text-[#3C2C1E] disabled:opacity-40 cursor-pointer"
                >
                  ◀ 上一步
                </button>
                <button
                  type="button"
                  @click="replayStep = Math.min(replayRounds.length - 1, replayStep + 1)"
                  :disabled="replayStep >= replayRounds.length - 1"
                  class="px-2 py-0.5 rounded bg-[#5C4533] text-[#FAF4E8] text-[10px] font-bold disabled:opacity-40 cursor-pointer"
                >
                  下一步 ▶
                </button>
              </div>
            </div>

            <!-- 当前推演步骤详情 -->
            <div v-if="currentReplayRound" class="p-3 rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] space-y-1.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-amber-600 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                    {{ currentReplayRound.step }}
                  </span>
                  <span class="font-bold text-sm text-[#3C2C1E]">{{ currentReplayRound.seatName }}</span>
                  <span v-if="currentReplayRound.tag" class="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold border border-amber-300">
                    {{ currentReplayRound.tag }}
                  </span>
                </div>
                <span class="text-xs font-bold text-[#5C4533]">{{ currentReplayRound.action }}</span>
              </div>

              <!-- 展现牌型 -->
              <div v-if="currentReplayRound.cards && currentReplayRound.cards.length > 0" class="flex flex-wrap gap-1.5 pt-1">
                <span
                  v-for="c in currentReplayRound.cards"
                  :key="c"
                  class="px-2 py-0.5 rounded bg-[#EFE5D3] border border-[#D8C7B0] font-mono font-bold text-xs"
                  :class="c.includes('♥') || c.includes('♦') ? 'text-red-700' : 'text-[#3C2C1E]'"
                >
                  {{ c }}
                </span>
              </div>
            </div>

            <!-- 完整推演清单 -->
            <div class="max-h-44 overflow-y-auto space-y-1 pt-1">
              <div
                v-for="(rnd, idx) in replayRounds"
                :key="idx"
                @click="replayStep = idx"
                class="p-2 rounded-lg border text-[11px] flex items-center justify-between cursor-pointer transition-colors"
                :class="replayStep === idx ? 'bg-amber-100/70 border-amber-500 font-bold text-amber-900' : 'bg-[#FFFDF8] border-[#D8C7B0] text-[#6B5744] hover:bg-white'"
              >
                <div class="flex items-center gap-1.5 truncate">
                  <span class="font-mono text-[10px]">#{{ rnd.step }}</span>
                  <span class="font-medium text-[#3C2C1E]">{{ rnd.seatName }}:</span>
                  <span class="truncate">{{ rnd.action }}</span>
                </div>
                <span v-if="rnd.cards?.length" class="text-[10px] font-mono opacity-80 shrink-0">
                  {{ rnd.cards.slice(0, 3).join(' ') }}{{ rnd.cards.length > 3 ? '...' : '' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-3 border-t border-[#D8C7B0] flex justify-end shrink-0">
          <button
            type="button"
            @click="selectedReplay = null"
            class="px-4 py-1.5 rounded-xl bg-[#5C4533] hover:bg-[#433022] text-[#FAF4E8] text-xs font-bold shadow active:scale-95 cursor-pointer"
          >
            关闭复盘
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  UserProfile,
  MatchRecord,
  recordPointsTx,
  saveLocalProfile,
  saveLocalRecords,
  loadOfflinePracticeRecords,
  clearOfflinePracticeRecords,
} from '../utils/storage';
import { soundFX } from '../utils/sound';

const props = defineProps<{
  profile: UserProfile;
  records: MatchRecord[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:profile', p: UserProfile): void;
  (e: 'update:records', r: MatchRecord[]): void;
  (e: 'open-poster', rec: MatchRecord): void;
}>();

const activeTab = ref<'stats' | 'records' | 'settings' | 'sound'>('stats');
const isSoundOn = ref(soundFX.enabled);
const voiceVol = ref(Math.round(soundFX.voiceVolume * 100));
const bgmVol = ref(Math.round(soundFX.bgmVolume * 100));

function onToggleSound() {
  isSoundOn.value = !isSoundOn.value;
  soundFX.setEnabled(isSoundOn.value);
  if (isSoundOn.value) soundFX.playTap();
}

function onVoiceVolChange() {
  soundFX.setVoiceVolume(voiceVol.value / 100);
}

function onBgmVolChange() {
  soundFX.setBgmVolume(bgmVol.value / 100);
}

function testVoiceSound() {
  soundFX.playLocalVoiceAudio('顺子');
}
const recordFilter = ref<'all' | 'ladder' | 'practice'>('all');
const practiceRecords = ref<MatchRecord[]>(loadOfflinePracticeRecords());

const ladderRecords = computed(() => {
  return props.records || [];
});

const displayedRecords = computed(() => {
  if (recordFilter.value === 'ladder') return ladderRecords.value;
  if (recordFilter.value === 'practice') return practiceRecords.value;
  // All records sorted by timestamp / id
  return [...ladderRecords.value, ...practiceRecords.value];
});

function handleClearPracticeRecords() {
  clearOfflinePracticeRecords();
  practiceRecords.value = [];
  soundFX.playTap();
}

const ACTIVE_GAME_KEYS = ['yansan', 'shisanshui', 'mahjong'] as const;

const GAME_NAMES: Record<string, string> = {
  yansan: '经典烟三',
  shisanshui: '水镜十三水',
  mahjong: '经典国标麻将',
};

if (!props.profile.avatar || props.profile.avatar === '🀄') {
  props.profile.avatar = '👑';
}

const AVATARS = ['👑', '🍵', '♟️', '🃏', '🐉', '⚡', '🪓', '🏮'];

const selectedReplay = ref<MatchRecord | null>(null);
const replayStep = ref(0);

const replayRounds = computed(() => {
  if (!selectedReplay.value) return [];
  if (selectedReplay.value.replayData?.rounds && selectedReplay.value.replayData.rounds.length > 0) {
    return selectedReplay.value.replayData.rounds;
  }
  // 智能兜底推演步骤 (针对早期未存储详细步骤的历史战绩)
  const gt = selectedReplay.value.gameType;
  const isWin = selectedReplay.value.result === 'win';
  const isTie = selectedReplay.value.result === 'draw';

  if (gt === 'yansan') {
    return [
      { step: 1, seatName: '东席 (玩家4)', action: '方块4率先首出', cards: ['♦4'], tag: '方块4首发' },
      { step: 2, seatName: '本家 (您)', action: '跟出顺子 45678 压制', cards: ['♣4', '♠5', '♥6', '♦7', '♣8'], tag: '压制' },
      { step: 3, seatName: '西席 (玩家2)', action: '无法压制 · 战术过牌', cards: [], tag: '过牌' },
      { step: 4, seatName: '北席 (玩家3)', action: '同盟策应 · 顺子 8910JQ 护盘', cards: ['♦8', '♥9', '♠10', '♣J', '♥Q'], tag: '同盟策应' },
      { step: 5, seatName: '本家 (您)', action: isWin ? '打出同花顺 · 率先出清所有手牌！' : '跟出对子稳扎稳打', cards: isWin ? ['♠10', '♠J', '♠Q', '♠K', '♠A'] : ['♥K', '♦K'], tag: isWin ? '出清大捷' : '战术跟牌' },
      { step: 6, seatName: '裁判司仪', action: isTie ? '阵营平局 · 双胜单胜势均打和' : (isWin ? '同盟包揽胜局 · 结算翻倍！' : '农民阵营率先出清'), tag: '终局结算' },
    ];
  } else if (gt === 'shisanshui') {
    return [
      { step: 1, seatName: '本家 (您)', action: '完成头中尾三道理牌，确认无倒水', cards: ['♠A', '♥A', '♦8', '♣K', '♥K', '♠K', '♦4', '♣4', '♠10', '♥J', '♦Q', '♣K', '♠A'], tag: '理牌就绪' },
      { step: 2, seatName: '西席/北席/东席', action: '四方茶客均已完成摆牌，进入亮牌比水', cards: [], tag: '全员开牌' },
      { step: 3, seatName: '头道比水', action: isWin ? '本家头道对A胜出 (+1水)' : '头道对子战况胶着', cards: ['♠A', '♥A', '♦8'], tag: '头道' },
      { step: 4, seatName: '中道比水', action: '中道葫芦K三带对4压制对手同花 (+2水)', cards: ['♣K', '♥K', '♠K', '♦4', '♣4'], tag: '中道' },
      { step: 5, seatName: '尾道比水', action: isWin ? '尾道同花顺全场通杀，触发连环打枪！' : '尾道同花比拼结算', cards: ['♠10', '♥J', '♦Q', '♣K', '♠A'], tag: isWin ? '绝杀打枪' : '尾道' },
      { step: 6, seatName: '总水数结算', action: selectedReplay.value.details || '四方比水最终统算完毕', tag: '终局' },
    ];
  } else {
    // 国标麻将
    return [
      { step: 1, seatName: '东庄 (庄家)', action: '打色子开门起牌，抓牌14张开局', cards: ['🀀', '🀁'], tag: '掷骰定庄' },
      { step: 2, seatName: '四方茶客', action: '四巡抓牌整牌理牌完毕，亮牌开打', cards: [], tag: '理牌开局' },
      { step: 3, seatName: '西席', action: '打出五筒，本家碰牌亮刻', cards: ['5筒', '5筒', '5筒'], tag: '碰牌' },
      { step: 4, seatName: '本家 (您)', action: '摸入红中 · 宣告听牌！', cards: ['红中'], tag: '听牌' },
      { step: 5, seatName: '本家 (您)', action: isWin ? '自摸一条胡牌！满贯番数翻倍！' : '对手率先自摸清一色和出', cards: isWin ? ['1条', '1条', '1条'] : [], tag: isWin ? '自摸大捷' : '对手和出' },
      { step: 6, seatName: '番数统算', action: selectedReplay.value.details || '和牌番种与筹码流水最终结算', tag: '结算' },
    ];
  }
});

const currentReplayRound = computed(() => {
  return replayRounds.value[replayStep.value] || replayRounds.value[0] || null;
});

function openReplay(rec: MatchRecord) {
  selectedReplay.value = rec;
  replayStep.value = 0;
  soundFX.playTap();
}

function exportJson() {
  const data = JSON.stringify({ profile: props.profile, records: props.records }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rustchess_profile_${props.profile.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const importNotice = ref('');

function importJson(ev: Event) {
  const target = ev.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target?.result as string);
      if (parsed.profile) {
        Object.assign(props.profile, parsed.profile);
      }
      if (Array.isArray(parsed.records)) {
        props.records.splice(0, props.records.length, ...parsed.records);
        emit('update:records', props.records);
      }
      importNotice.value = '战绩数据导入恢复成功！';
      soundFX.playVictory();
    } catch {
      importNotice.value = '文件解析失败，请上传标准的战绩 JSON 文件';
    }
  };
  reader.readAsText(file);
}

function resetData() {
  props.profile.coins = 0;
  props.profile.rating = 1800;
  props.records.length = 0;
  saveLocalProfile(props.profile);
  saveLocalRecords(props.records);
  emit('update:profile', props.profile);
  emit('update:records', props.records);
  importNotice.value = '已恢复初始战绩！';
  soundFX.playTap();
}

function saveAndClose() {
  saveLocalProfile(props.profile);
  saveLocalRecords(props.records);
  emit('update:profile', props.profile);
  emit('close');
}
</script>
