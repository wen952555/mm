<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto"
      @click.self="emit('close')"
    >
      <div
        class="w-[96vw] max-w-lg max-h-[96dvh] flex flex-col rounded-3xl bg-[#1A1410] border-2 border-amber-600/70 shadow-[0_0_50px_rgba(245,158,11,0.35)] text-[#FAF4E8] overflow-hidden animate-scale-up"
      >
        <!-- Modal Top Bar -->
        <div class="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#2B1B12] via-[#382317] to-[#2B1B12] border-b border-amber-600/40 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xl">🎨</span>
            <span class="font-black text-sm sm:text-base text-amber-200 font-serif-title tracking-wide">
              国粹高光战绩海报 · 雀坛留名
            </span>
          </div>
          <button
            type="button"
            @click="emit('close')"
            class="w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 flex items-center justify-center text-xs text-stone-300 hover:text-white cursor-pointer active:scale-90 transition-all"
          >
            ✕
          </button>
        </div>

        <!-- Scrollable Poster Preview Area -->
        <div class="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col items-center">
          <div class="relative w-full max-w-[380px] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/60 bg-[#EFE5D3]">
            <!-- Hidden High-Res Canvas (Used for generation & export) -->
            <canvas ref="canvasRef" class="w-full h-auto block rounded-2xl"></canvas>
            
            <!-- Loading indicator while rendering canvas -->
            <div
              v-if="isRendering"
              class="absolute inset-0 bg-[#EFE5D3]/90 flex flex-col items-center justify-center gap-2"
            >
              <div class="w-8 h-8 rounded-full border-3 border-amber-700 border-t-transparent animate-spin"></div>
              <span class="text-xs font-bold text-amber-900 font-serif-title">正在研磨朱砂绘卷...</span>
            </div>
          </div>

          <!-- Quick Tip -->
          <p class="text-[11px] text-[#A89887] mt-2.5 text-center leading-relaxed">
            长按或点击下方按钮即可保存高清宣纸战报，可随时分享至群聊显摆神技
          </p>
        </div>

        <!-- Modal Bottom Actions Bar -->
        <div class="p-3 bg-[#120D0A] border-t border-amber-600/30 shrink-0 flex flex-wrap items-center justify-between gap-2">
          <!-- Copy Text Report -->
          <button
            type="button"
            @click="copyReportText"
            class="flex-1 min-w-[95px] py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-[#FAF4E8] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <span>{{ copySuccess ? '✅' : '📋' }}</span>
            <span>{{ copySuccess ? '已复制战报' : '复制战报' }}</span>
          </button>

          <!-- Telegram Share -->
          <button
            type="button"
            @click="shareToTelegram"
            class="flex-1 min-w-[95px] py-2 px-2.5 rounded-xl bg-[#229ED9]/25 hover:bg-[#229ED9]/40 border border-[#229ED9]/60 text-[#229ED9] hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <span>✈️</span>
            <span>分享TG</span>
          </button>

          <!-- Download PNG Poster -->
          <button
            type="button"
            @click="downloadPoster"
            class="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-gradient-to-r from-red-700 via-amber-600 to-amber-700 hover:from-red-600 hover:to-amber-500 text-amber-100 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg border border-amber-400/60 active:scale-95 transition-all cursor-pointer ring-1 ring-amber-400/40"
          >
            <span>📥</span>
            <span>保存高清海报</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

export interface VictoryPosterData {
  gameType: string;
  gameTypeBadge?: string;
  gameMode?: string;
  playerName: string;
  playerAvatar?: string;
  outcome: 'win' | 'lose' | 'draw';
  scoreDelta: number;
  scoreUnit?: string;
  tableSummary?: string;
  opponentSummary?: string;
  highlights?: string[];
  customSealText?: string;
  timestamp?: string;
}

const props = defineProps<{
  show: boolean;
  data: VictoryPosterData;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isRendering = ref(true);
const copySuccess = ref(false);

watch(
  () => props.show,
  (val) => {
    if (val) {
      isRendering.value = true;
      copySuccess.value = false;
      nextTick(() => {
        renderCanvasPoster();
      });
    }
  }
);

watch(
  () => props.data,
  () => {
    if (props.show) {
      nextTick(() => {
        renderCanvasPoster();
      });
    }
  },
  { deep: true }
);

function renderCanvasPoster() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 760;
  const height = 1140;
  const dpr = 2;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';

  ctx.scale(dpr, dpr);

  // 1. 古韵羊皮纸底色与水墨宣纸渐变
  const bgGrad = ctx.createRadialGradient(width / 2, height * 0.4, 60, width / 2, height / 2, width * 0.85);
  bgGrad.addColorStop(0, '#FFFDF8');
  bgGrad.addColorStop(0.5, '#F6ECD8');
  bgGrad.addColorStop(0.85, '#EBE0C5');
  bgGrad.addColorStop(1, '#D8C6A5');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. 宣纸肌理微噪与水墨淡晕
  ctx.fillStyle = 'rgba(120, 85, 45, 0.035)';
  for (let i = 0; i < 240; i++) {
    const rx = (i * 37) % width;
    const ry = (i * 73) % height;
    ctx.beginPath();
    ctx.arc(rx, ry, ((i % 5) + 1) * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 经典国风双层回纹金线外框
  ctx.save();
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(34, 34, width - 68, height - 68);

  // 四角古建云纹祥纹修饰
  drawCornerAccents(ctx, 26, 26, 32);
  drawCornerAccents(ctx, width - 26, 26, 32, true, false);
  drawCornerAccents(ctx, 26, height - 26, 32, false, true);
  drawCornerAccents(ctx, width - 26, height - 26, 32, true, true);
  ctx.restore();

  // 4. 顶部标题横额与灯笼
  ctx.textAlign = 'center';
  ctx.fillStyle = '#6B4226';
  ctx.font = 'bold 22px serif';
  ctx.fillText('🏮  国 粹 棋 牌 · 雀 坛 战 报  🏮', width / 2, 78);

  // 分割墨线
  ctx.strokeStyle = 'rgba(184, 134, 11, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(120, 96);
  ctx.lineTo(width - 120, 96);
  ctx.stroke();

  // 5. 游戏板块分类徽章
  const gameBadge = `${props.data.gameType || '十三水'} · ${props.data.gameTypeBadge || '荣耀对决'}`;
  ctx.fillStyle = '#8B2500';
  ctx.beginPath();
  roundRect(ctx, width / 2 - 130, 115, 260, 36, 18);
  ctx.fill();

  ctx.fillStyle = '#FFE4B5';
  ctx.font = 'bold 16px "Noto Serif SC", serif';
  ctx.fillText(gameBadge, width / 2, 139);

  // 6. 胜负显赫大字（大捷 / 惜败 / 打和）
  const outcomeText = props.data.outcome === 'win' ? '旗 开 得 胜' : props.data.outcome === 'lose' ? '棋 逢 敌 手' : '平 分 秋 色';
  const outcomeColor = props.data.outcome === 'win' ? '#991B1B' : props.data.outcome === 'lose' ? '#374151' : '#78350F';
  
  ctx.fillStyle = outcomeColor;
  ctx.font = '900 48px "Noto Serif SC", "STKaiti", serif';
  ctx.fillText(outcomeText, width / 2, 215);

  // 7. 玩家大将名号与头像
  const avatar = props.data.playerAvatar || '👑';
  const pName = props.data.playerName || '雀坛国手';

  ctx.fillStyle = '#261C14';
  ctx.font = 'bold 26px "Noto Serif SC", serif';
  ctx.fillText(`${avatar}  ${pName}`, width / 2, 265);

  // 8. 核心战绩数据大卡片 (红金底座)
  const cardY = 300;
  const cardH = 220;
  const cardW = width - 120;
  const cardX = 60;

  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardGrad.addColorStop(0, '#5C1D16');
  cardGrad.addColorStop(0.5, '#78251C');
  cardGrad.addColorStop(1, '#4A1510');

  ctx.save();
  ctx.fillStyle = cardGrad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.restore();

  // 金色花纹内嵌边
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  roundRect(ctx, cardX + 8, cardY + 8, cardW - 16, cardH - 16, 18);
  ctx.stroke();

  // 卡片内数据：净水/净分
  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 20px "Noto Serif SC", serif';
  ctx.fillText('【 本 局 胜 负 战 果 】', width / 2, cardY + 45);

  const delta = props.data.scoreDelta;
  const sign = delta > 0 ? '+' : '';
  const unit = props.data.scoreUnit || '水';
  const deltaText = `${sign}${delta} ${unit}`;

  ctx.fillStyle = delta >= 0 ? '#FDE047' : '#E5E7EB';
  ctx.font = '900 64px "DIN Alternate", "Helvetica", monospace';
  ctx.fillText(deltaText, width / 2, cardY + 125);

  // 牌局小结
  if (props.data.tableSummary) {
    ctx.fillStyle = '#FEF3C7';
    ctx.font = '16px "Noto Serif SC", serif';
    ctx.fillText(props.data.tableSummary, width / 2, cardY + 175);
  }

  // 9. 经典朱砂篆刻印章 (Authentic Cinnabar Seal)
  const sealText = props.data.customSealText || (props.data.outcome === 'win' ? '雀圣绝顶' : '棋高一着');
  drawCinnabarSeal(ctx, width - 160, 210, sealText);

  // 10. 高光战绩与绝学明细榜
  const listY = 560;
  ctx.fillStyle = '#3E2A1C';
  ctx.font = 'bold 22px "Noto Serif SC", serif';
  ctx.textAlign = 'left';
  ctx.fillText('📜 绝 学 与 高 光 时 刻', 80, listY);

  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, listY + 12);
  ctx.lineTo(260, listY + 12);
  ctx.stroke();

  const highlights = props.data.highlights && props.data.highlights.length > 0
    ? props.data.highlights
    : [
        '牌逢敌手，棋高一着',
        '神技卓绝，惊艳四座',
        '稳操胜券，名扬茶楼'
      ];

  let itemY = listY + 50;
  highlights.slice(0, 4).forEach((hl, idx) => {
    // 列表条目背板
    ctx.fillStyle = 'rgba(245, 230, 205, 0.75)';
    ctx.beginPath();
    roundRect(ctx, 75, itemY - 26, width - 150, 44, 12);
    ctx.fill();

    ctx.strokeStyle = 'rgba(180, 140, 100, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundRect(ctx, 75, itemY - 26, width - 150, 44, 12);
    ctx.stroke();

    // 序号标点
    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.arc(102, itemY - 4, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(idx + 1), 102, itemY);

    // 文字
    ctx.fillStyle = '#261C14';
    ctx.font = 'bold 17px "Noto Serif SC", serif';
    ctx.textAlign = 'left';
    ctx.fillText(hl, 126, itemY + 2);

    itemY += 56;
  });

  // 11. 底部防伪印记、时间戳与雀楼留名
  const footerY = height - 90;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#785535';
  ctx.font = '14px "Noto Serif SC", serif';
  const dateStr = props.data.timestamp || new Date().toLocaleString('zh-CN', { hour12: false });
  ctx.fillText(`雀楼备案时刻：${dateStr} · 官方天梯谱志`, width / 2, footerY);

  ctx.fillStyle = '#A08060';
  ctx.font = '12px "Noto Serif SC", serif';
  ctx.fillText('国粹棋牌 · 传承东方博弈雅韵 · 全民竞技公信认证', width / 2, footerY + 26);

  isRendering.value = false;
}

// 辅助绘图：朱砂篆刻印章
function drawCinnabarSeal(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.08); // 略微倾斜，更显古拙真实

  const size = 84;
  ctx.strokeStyle = '#B91C1C';
  ctx.lineWidth = 4;
  ctx.fillStyle = 'rgba(185, 28, 28, 0.08)';

  // 外框带仿古磨损
  ctx.beginPath();
  roundRect(ctx, -size / 2, -size / 2, size, size, 10);
  ctx.fill();
  ctx.stroke();

  // 双层细内框
  ctx.strokeStyle = '#B91C1C';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  roundRect(ctx, -size / 2 + 5, -size / 2 + 5, size - 10, size - 10, 6);
  ctx.stroke();

  // 篆印文字 (田字四字排列：右上第一、右下第二、左上第三、左下第四)
  ctx.fillStyle = '#B91C1C';
  ctx.font = 'bold 22px "STKaiti", "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = text.slice(0, 4).padEnd(4, '印');
  // 经典篆刻四字排布
  ctx.fillText(chars[0], 16, -16);
  ctx.fillText(chars[1], 16, 16);
  ctx.fillText(chars[2], -16, -16);
  ctx.fillText(chars[3], -16, 16);

  ctx.restore();
}

function drawCornerAccents(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, flipX = false, flipY = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 0.7);
  ctx.stroke();

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function downloadPoster() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  const fileName = `guocui-victory-poster-${Date.now()}.png`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function copyReportText() {
  const p = props.data;
  const sign = p.scoreDelta > 0 ? '+' : '';
  const lines = [
    `🏮【国粹棋牌 · 雀坛高光战报】🏮`,
    `大将名号：${p.playerAvatar || '👑'} ${p.playerName}`,
    `对战项目：${p.gameType} · ${p.gameTypeBadge || '荣耀场'}`,
    `战局结果：${p.outcome === 'win' ? '🎉 旗开得胜' : p.outcome === 'lose' ? '⚔️ 棋逢敌手' : '🤝 平分秋色'}`,
    `本局战果：${sign}${p.scoreDelta} ${p.scoreUnit || '分'}`,
    p.tableSummary ? `手牌阵局：${p.tableSummary}` : '',
    p.highlights && p.highlights.length > 0 ? `高光绝学：\n${p.highlights.map((h, i) => `  ${i + 1}. ${h}`).join('\n')}` : '',
    `雀楼认证：全民公平竞技 · 诚信留名`,
  ].filter(Boolean);

  const fullText = lines.join('\n');
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(fullText).then(() => {
      copySuccess.value = true;
      setTimeout(() => {
        copySuccess.value = false;
      }, 2500);
    });
  }
}

function shareToTelegram() {
  const p = props.data;
  const sign = p.scoreDelta > 0 ? '+' : '';
  const text = encodeURIComponent(
    `🏮【国粹棋牌 · 雀坛战报】🏮\n` +
    `大将：${p.playerName}\n` +
    `玩法：${p.gameType}\n` +
    `战果：${sign}${p.scoreDelta} ${p.scoreUnit || '分'}\n` +
    (p.tableSummary ? `手牌：${p.tableSummary}\n` : '') +
    `速速入席与我一决高下！`
  );
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${text}`;
  try {
    const w = window.open(shareUrl, '_blank');
    if (!w) {
      navigator.clipboard?.writeText?.(decodeURIComponent(text)).catch(() => {});
    }
  } catch {
    navigator.clipboard?.writeText?.(decodeURIComponent(text)).catch(() => {});
  }
}
</script>

<style scoped>
@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-up {
  animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
