<template>
  <div class="pointer-events-none absolute inset-0 z-50 overflow-hidden" :class="{ 'animate-screen-shake': isShaking }">
    <!-- 2D / 3D Canvas Particle Engine for Shockwaves, Coins & Fireworks -->
    <canvas ref="particleCanvas" class="w-full h-full block absolute inset-0"></canvas>

    <!-- 3D Banner & Stamp Overlay Layers -->
    <!-- 1. 💣 炸弹核爆 3D 徽章 -->
    <div
      v-if="activeEffect === 'bomb'"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="fx-3d-badge bomb-blast-anim flex flex-col items-center">
        <div class="text-7xl filter drop-shadow-[0_0_35px_rgba(239,68,68,0.9)] animate-bounce">
          💣 💥
        </div>
        <div class="mt-2 text-3xl sm:text-5xl font-black font-serif-title tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-red-500 to-amber-400 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] text-stroke">
          四炸惊雷 · 倍数翻倍！
        </div>
        <div class="text-xs sm:text-sm font-mono text-amber-300 font-bold px-3 py-1 bg-black/75 rounded-full border border-amber-500/50 mt-2 shadow-2xl">
          MULTIPLIER × 2
        </div>
      </div>
    </div>

    <!-- 2. 🔥 烟三强攻 3D 徽章 -->
    <div
      v-if="activeEffect === 'qianggong'"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="fx-3d-badge rocket-blast-anim flex flex-col items-center">
        <div class="text-7xl filter drop-shadow-[0_0_40px_rgba(245,158,11,1)]">
          🔥 👑
        </div>
        <div class="mt-2 text-3xl sm:text-5xl font-black font-serif-title tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-600 filter drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)]">
          烟三强攻 · 独战全场！
        </div>
        <div class="text-xs sm:text-sm font-mono text-yellow-300 font-bold px-3 py-1 bg-black/80 rounded-full border border-amber-400 mt-2 shadow-2xl">
          QIANG GONG · 胜负翻倍
        </div>
      </div>
    </div>

    <!-- 3. 🐉 十三水至尊青龙 3D 特效 -->
    <div
      v-if="activeEffect === 'supreme_dragon'"
      class="absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <div class="airplane-fly-anim flex items-center gap-3">
        <span class="text-6xl filter drop-shadow-[0_0_25px_rgba(59,130,246,0.8)]">🐉</span>
        <div class="text-2xl sm:text-4xl font-black font-serif-title text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-300 to-white filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          至尊青龙 · 通关横扫！
        </div>
      </div>
    </div>

    <!-- 4. ⚡ 顺子 / 连对 闪电破空 -->
    <div
      v-if="activeEffect === 'straight'"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="fx-3d-badge straight-anim flex flex-col items-center">
        <div class="text-5xl filter drop-shadow-[0_0_30px_rgba(245,158,11,0.9)]">
          ⚡ 🐉 ⚡
        </div>
        <div class="text-2xl sm:text-4xl font-extrabold font-serif-title text-amber-300 filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          金龙过江 · 连绵不绝！
        </div>
      </div>
    </div>

    <!-- 5. 🔫 十三水 打枪 / 全垒打 弹孔激光 -->
    <div
      v-if="activeEffect === 'gunshot' || activeEffect === 'grand_slam'"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="fx-3d-badge gunshot-anim flex flex-col items-center">
        <div class="text-6xl filter drop-shadow-[0_0_30px_rgba(239,68,68,0.9)]">
          💥 🎯 🔫
        </div>
        <div class="mt-2 text-3xl sm:text-5xl font-black font-serif-title tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-amber-100 filter drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)]">
          {{ activeEffect === 'grand_slam' ? '全垒打 · 通关翻倍！' : '打枪全胜 · 连下三道！' }}
        </div>
      </div>
    </div>

    <!-- 6. 🀄 麻将 碰 / 杠 / 胡 3D 印章符印 -->
    <div
      v-if="activeEffect === 'hu' || activeEffect === 'peng' || activeEffect === 'gang'"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="fx-3d-stamp stamp-anim flex flex-col items-center">
        <div
          class="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.8)] backdrop-blur-md"
          :class="activeEffect === 'hu' ? 'border-red-500 bg-red-950/80 text-red-200' : (activeEffect === 'gang' ? 'border-emerald-500 bg-emerald-950/80 text-emerald-200' : 'border-amber-500 bg-amber-950/80 text-amber-200')"
        >
          <span class="text-4xl sm:text-5xl font-black font-serif-title filter drop-shadow-lg">
            {{ activeEffect === 'hu' ? '胡' : (activeEffect === 'gang' ? '杠' : '碰') }}
          </span>
          <span class="text-[10px] font-mono tracking-widest uppercase mt-0.5 opacity-80">
            {{ activeEffect === 'hu' ? 'WINNING' : (activeEffect === 'gang' ? 'QUAD' : 'TRIPLET') }}
          </span>
        </div>
      </div>
    </div>

    <!-- 7. 🏆 胜利庆典 金币雨与胜利光芒 -->
    <div
      v-if="activeEffect === 'win' || activeEffect === 'coins'"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="fx-3d-badge win-anim flex flex-col items-center">
        <div class="text-6xl sm:text-7xl animate-bounce filter drop-shadow-[0_0_35px_rgba(245,158,11,0.9)]">
          🏆 🪙
        </div>
        <div class="mt-2 text-3xl sm:text-5xl font-black font-serif-title tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
          牌局告捷 · 赢家登顶！
        </div>
        <div class="mt-2 text-sm font-mono text-amber-200 font-bold px-4 py-1.5 bg-black/80 rounded-full border border-amber-400 shadow-2xl">
          筹码入账 +600 分 · 积分提升
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

export type FXType =
  | 'bomb'
  | 'rocket'
  | 'airplane'
  | 'straight'
  | 'gunshot'
  | 'grand_slam'
  | 'hu'
  | 'peng'
  | 'gang'
  | 'win'
  | 'coins';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  type: 'coin' | 'spark' | 'smoke' | 'ring' | 'confetti';
}

const particleCanvas = ref<HTMLCanvasElement | null>(null);
const activeEffect = ref<FXType | null>(null);
const isShaking = ref(false);

let particles: Particle[] = [];
let animFrame: number | null = null;
let effectTimer: any = null;
let shakeTimer: any = null;

function trigger(type: FXType) {
  activeEffect.value = type;
  if (effectTimer) clearTimeout(effectTimer);
  effectTimer = setTimeout(() => {
    activeEffect.value = null;
  }, 2200);

  // Screen shake on heavy impact
  if (type === 'bomb' || type === 'rocket' || type === 'hu' || type === 'grand_slam') {
    isShaking.value = true;
    if (shakeTimer) clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => {
      isShaking.value = false;
    }, 450);
  }

  // Spawn canvas particles based on effect
  spawnParticlesForEffect(type);
}

function spawnParticlesForEffect(type: FXType) {
  const canvas = particleCanvas.value;
  if (!canvas) return;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  if (type === 'bomb' || type === 'rocket') {
    // Shockwave ring
    particles.push({
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      size: 10,
      color: type === 'rocket' ? '#FBBF24' : '#EF4444',
      alpha: 1,
      decay: 0.025,
      rotation: 0,
      vRot: 0,
      type: 'ring',
    });

    // Fire sparks
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: ['#F59E0B', '#EF4444', '#FCD34D', '#FFFFFF', '#DC2626'][Math.floor(Math.random() * 5)],
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        type: 'spark',
      });
    }

    // Smoke
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 15 + Math.random() * 20,
        color: '#4B5563',
        alpha: 0.6,
        decay: 0.01 + Math.random() * 0.015,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.05,
        type: 'smoke',
      });
    }
  } else if (type === 'win' || type === 'coins' || type === 'hu') {
    // 3D Coin Shower
    for (let i = 0; i < 60; i++) {
      const x = cx + (Math.random() - 0.5) * (w * 0.6);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = 8 + Math.random() * 14;
      particles.push({
        x,
        y: cy + 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 10 + Math.random() * 6,
        color: '#F59E0B',
        alpha: 1,
        decay: 0.008 + Math.random() * 0.008,
        rotation: Math.random() * Math.PI * 2,
        vRot: 0.1 + Math.random() * 0.2,
        type: 'coin',
      });
    }

    // Confetti
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: cx + (Math.random() - 0.5) * 100,
        y: cy - 20,
        vx: (Math.random() - 0.5) * 12,
        vy: -6 - Math.random() * 10,
        size: 4 + Math.random() * 4,
        color: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'][Math.floor(Math.random() * 5)],
        alpha: 1,
        decay: 0.01,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        type: 'confetti',
      });
    }
  } else if (type === 'straight') {
    // Lightning sparks across horizontal line
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: cx + (Math.random() - 0.5) * 360,
        y: cy + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: 2 + Math.random() * 4,
        color: ['#FDE68A', '#F59E0B', '#67E8F9', '#FFFFFF'][Math.floor(Math.random() * 4)],
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02,
        rotation: 0,
        vRot: 0,
        type: 'spark',
      });
    }
  } else if (type === 'gunshot' || type === 'grand_slam') {
    // Gun blast flash sparks
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 10;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: '#F87171',
        alpha: 1,
        decay: 0.02,
        rotation: 0,
        vRot: 0,
        type: 'spark',
      });
    }
  }
}

function updateAndRenderParticles() {
  const canvas = particleCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    p.rotation += p.vRot;

    if (p.type === 'coin') {
      p.vy += 0.45; // Gravity
    } else if (p.type === 'confetti') {
      p.vy += 0.25; // Light gravity
      p.vx *= 0.98;
    } else if (p.type === 'ring') {
      p.size += 18; // Expanding ring
    } else if (p.type === 'smoke') {
      p.size += 0.8;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);

    if (p.type === 'ring') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 6 * p.alpha;
      ctx.stroke();
    } else if (p.type === 'coin') {
      ctx.translate(p.x, p.y);
      // 3D rotation projection simulation
      const scaleX = Math.cos(p.rotation);
      ctx.scale(scaleX, 1);

      // Gold Coin body
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Coin inner rim
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.65, 0, Math.PI * 2);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#78350F';
      ctx.font = `bold ${Math.floor(p.size * 0.75)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('分', 0, 1);
    } else if (p.type === 'confetti') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
    } else if (p.type === 'smoke') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    } else {
      // Spark
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fill();
    }

    ctx.restore();
  }

  animFrame = requestAnimationFrame(updateAndRenderParticles);
}

function resizeCanvas() {
  const canvas = particleCanvas.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.scale(dpr, dpr);
}

onMounted(() => {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  animFrame = requestAnimationFrame(updateAndRenderParticles);
});

onBeforeUnmount(() => {
  if (animFrame) cancelAnimationFrame(animFrame);
  if (effectTimer) clearTimeout(effectTimer);
  if (shakeTimer) clearTimeout(shakeTimer);
  window.removeEventListener('resize', resizeCanvas);
});

defineExpose({
  trigger,
});
</script>

<style scoped>
/* 3D Perspective Badge Transforms */
.fx-3d-badge {
  perspective: 1000px;
  transform-style: preserve-3d;
}

@keyframes bombBlast {
  0% {
    transform: scale(0.2) rotate(-15deg);
    opacity: 0;
  }
  30% {
    transform: scale(1.3) rotate(3deg);
    opacity: 1;
  }
  60% {
    transform: scale(1.05) rotate(0deg);
  }
  85% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  100% {
    transform: scale(1.2) translateY(-20px);
    opacity: 0;
  }
}

.bomb-blast-anim {
  animation: bombBlast 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes rocketBlast {
  0% {
    transform: translateY(120px) scale(0.3);
    opacity: 0;
  }
  35% {
    transform: translateY(-20px) scale(1.25);
    opacity: 1;
  }
  60% {
    transform: translateY(0) scale(1.05);
  }
  85% {
    transform: translateY(-5px) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-80px) scale(1.2);
    opacity: 0;
  }
}

.rocket-blast-anim {
  animation: rocketBlast 2s cubic-bezier(0.2, 0.9, 0.3, 1.2) forwards;
}

@keyframes airplaneFly {
  0% {
    transform: translateX(-120%) translateY(40px) scale(0.6) rotate(-10deg);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  50% {
    transform: translateX(0) translateY(-10px) scale(1.1) rotate(0deg);
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateX(120%) translateY(-50px) scale(1.2) rotate(10deg);
    opacity: 0;
  }
}

.airplane-fly-anim {
  animation: airplaneFly 2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

@keyframes straightEffect {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  30% {
    transform: scale(1.2);
    opacity: 1;
  }
  75% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.1) translateY(-15px);
    opacity: 0;
  }
}

.straight-anim {
  animation: straightEffect 1.8s ease-out forwards;
}

@keyframes gunshotEffect {
  0% {
    transform: scale(0.3) rotate(-8deg);
    opacity: 0;
  }
  25% {
    transform: scale(1.3) rotate(3deg);
    opacity: 1;
  }
  75% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.1);
    opacity: 0;
  }
}

.gunshot-anim {
  animation: gunshotEffect 1.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
}

@keyframes stampHit {
  0% {
    transform: scale(3.5) rotate(-20deg);
    opacity: 0;
  }
  35% {
    transform: scale(0.9) rotate(4deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.05) rotate(0deg);
  }
  80% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.stamp-anim {
  animation: stampHit 1.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes winBanner {
  0% {
    transform: scale(0.4) translateY(50px);
    opacity: 0;
  }
  40% {
    transform: scale(1.2) translateY(-10px);
    opacity: 1;
  }
  75% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  100% {
    transform: scale(1.08) translateY(-20px);
    opacity: 0;
  }
}

.win-anim {
  animation: winBanner 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Screen Shake Animation on impact */
@keyframes screenShake {
  0% { transform: translate(0, 0) rotate(0deg); }
  15% { transform: translate(-6px, 4px) rotate(-0.5deg); }
  30% { transform: translate(6px, -4px) rotate(0.5deg); }
  45% { transform: translate(-4px, 2px) rotate(-0.3deg); }
  60% { transform: translate(4px, -2px) rotate(0.3deg); }
  75% { transform: translate(-2px, 1px) rotate(0deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

.animate-screen-shake {
  animation: screenShake 0.45s ease-in-out;
}
</style>
