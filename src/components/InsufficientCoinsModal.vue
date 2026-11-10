<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none overflow-hidden animate-fade-in">
      <div
        class="w-full max-w-[500px] flex flex-col rounded-3xl bg-[#EFE5D3] border border-[#D8C7B0] shadow-2xl overflow-hidden relative text-[#3C2C1E]"
      >
        <!-- 1. Header Bar -->
        <header class="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#D8C7B0] shrink-0 bg-[#FAF4E8]">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-[#EFE5D3] border border-[#D8C7B0] flex items-center justify-center text-lg text-[#3C2C1E] shadow-inner shrink-0">
              🪙
            </div>
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-bold text-[#3C2C1E] font-serif-title leading-tight truncate">
                入座筹码不足提醒
              </h3>
              <p class="text-[10px] sm:text-[11px] text-[#6B5744] leading-none mt-0.5 truncate font-mono">
                {{ sceneName }} · 准入校验未通过
              </p>
            </div>
          </div>
        </header>

        <!-- 2. Body Details -->
        <div class="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          <!-- Points Comparison Box -->
          <div class="grid grid-cols-2 gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#D8C7B0] text-center shadow-xs">
            <div class="p-2 rounded-xl bg-[#FAF4E8] border border-[#D8C7B0]">
              <div class="text-[10px] sm:text-xs text-[#6B5744] font-mono">您当前持有筹码</div>
              <div class="text-lg sm:text-xl font-mono font-black text-rose-800 mt-0.5">
                {{ currentCoins.toLocaleString() }} <span class="text-xs font-normal">分</span>
              </div>
            </div>
            <div class="p-2 rounded-xl bg-[#FAF4E8] border border-[#D8C7B0]">
              <div class="text-[10px] sm:text-xs text-[#6B5744] font-mono">本场入座准入要求</div>
              <div class="text-lg sm:text-xl font-mono font-black text-[#5C4533] mt-0.5">
                {{ requiredCoins.toLocaleString() }} <span class="text-xs font-normal">分</span>
              </div>
            </div>
          </div>

          <!-- Explanation Notice -->
          <div class="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 text-xs leading-relaxed">
            <span class="text-lg shrink-0 mt-0.5">🚫</span>
            <div>
              <div class="font-bold text-rose-950 text-xs sm:text-sm font-serif-title">
                积分不足，暂不允许入座真实对战席位
              </div>
              <p class="text-[11px] sm:text-xs text-rose-900 mt-1">
                为维护真人对局秩序与胜负结算安全，真实玩家牌桌要求达到本场最低准入筹码。当前尚缺少 <strong class="text-[#5C4533] font-mono">{{ (requiredCoins - currentCoins).toLocaleString() }} 分</strong>。
              </p>
            </div>
          </div>

          <!-- Offline Solo Practice Mode Recommendation Card -->
          <div class="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#D8C7B0] space-y-2 shadow-xs">
            <div class="flex items-center gap-2 text-[#3C2C1E] font-bold text-xs sm:text-sm font-serif-title">
              <span>🎮</span>
              <span>推荐选择：进入单机试玩 (免筹码)</span>
              <span class="text-[9px] px-2 py-0.2 rounded-full bg-[#EFE5D3] text-[#3C2C1E] border border-[#D8C7B0] font-mono">
                免联网·零门槛
              </span>
            </div>
            <ul class="text-[11px] text-[#6B5744] space-y-1.5 pl-1">
              <li class="flex items-center gap-1.5">
                <span class="text-emerald-700 font-bold">✓</span>
                <span><strong>一键秒开智能演练</strong>：高拟真智能牌友即刻满席陪练，无需排队等待，随时随地开启。</span>
              </li>
              <li class="flex items-center gap-1.5">
                <span class="text-emerald-700 font-bold">✓</span>
                <span><strong>完全免筹码损耗</strong>：规则、牌型特效与真实对战完全一致，<strong>不扣除任何积分</strong>。</span>
              </li>
              <li class="flex items-center gap-1.5">
                <span class="text-emerald-700 font-bold">✓</span>
                <span><strong>深度打磨牌技套路</strong>：熟悉经典烟三接风、十三张水镜理牌及各类麻将算番，胜券在握。</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 3. Action Footer Buttons -->
        <footer class="p-3.5 sm:p-5 border-t border-[#D8C7B0] bg-[#FAF4E8] flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            @click="$emit('close')"
            class="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#FFFDF8] hover:bg-[#EFE5D3] border border-[#D8C7B0] text-[#3C2C1E] text-xs font-medium transition-colors cursor-pointer text-center order-3 sm:order-1"
          >
            返回更换场次
          </button>

          <button
            type="button"
            @click="$emit('open-points')"
            class="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#FAF4E8] hover:bg-[#EFE5D3] text-[#3C2C1E] border border-[#D8C7B0] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer order-2 shadow-xs"
          >
            <span>🪙</span>
            <span>前往钱庄管理</span>
          </button>

          <button
            type="button"
            @click="$emit('enter-practice')"
            class="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] text-xs font-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-[#7D6049] order-1 sm:order-3"
          >
            <span>🎮</span>
            <span>进入单机试玩 ➔</span>
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  currentCoins: number;
  requiredCoins: number;
  sceneName: string;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'enter-practice'): void;
  (e: 'open-points'): void;
}>();
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
