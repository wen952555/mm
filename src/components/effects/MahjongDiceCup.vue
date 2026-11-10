<template>
  <div class="relative w-full max-w-md mx-auto flex flex-col items-center select-none pointer-events-auto">
    <!-- Top Decorative Title & Skip Controls -->
    <div class="w-full flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-black/60 border border-amber-500/30 backdrop-blur-md shadow-lg">
      <div class="flex items-center gap-2">
        <span class="text-base sm:text-lg animate-pulse">🎲</span>
        <span class="text-xs sm:text-sm font-bold font-serif-title text-amber-200 tracking-wide">
          {{ props.title || '打色子定庄 · 开门取牌' }}
        </span>
      </div>
      <button
        type="button"
        @click="$emit('skip')"
        class="px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
        title="跳过摇色发牌，直接进入对局"
      >
        <span>跳过</span>
        <span>⏩</span>
      </button>
    </div>

    <!-- 3D Dice Cup / Tray Stage -->
    <div class="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-1">
      <!-- Outer Rosewood Carved Octagonal / Circular Rim -->
      <div
        class="absolute inset-0 rounded-full border-4 border-[#C99757] shadow-[0_16px_36px_rgba(0,0,0,0.85),inset_0_4px_12px_rgba(255,255,255,0.35),0_0_24px_rgba(201,151,87,0.3)] bg-gradient-to-b from-[#3E1F12] via-[#2A140B] to-[#170904]"
      >
        <!-- Brass Inner Inlay Ring -->
        <div class="absolute inset-2 sm:inset-2.5 rounded-full border-2 border-[#D4A373]/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] flex items-center justify-center">
          <!-- Green Imperial Velvet Felt Base -->
          <div
            class="absolute inset-2 sm:inset-2.5 rounded-full overflow-hidden shadow-inner flex items-center justify-center"
            style="background: radial-gradient(circle at 50% 45%, #065F46 0%, #044E39 55%, #022C20 90%, #011C14 100%);"
          >
            <!-- Watermark: Chinese Bagua & Auspicious Clouds in subtle gold -->
            <div class="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
              <svg viewBox="0 0 200 200" class="w-48 h-48 sm:w-56 sm:h-56 stroke-amber-300 fill-none" stroke-width="1.2">
                <circle cx="100" cy="100" r="90" stroke-dasharray="4,4" />
                <circle cx="100" cy="100" r="70" />
                <circle cx="100" cy="100" r="45" />
                <!-- 8 Direction Trigrams / Marks -->
                <text x="100" y="24" text-anchor="middle" font-size="10" fill="#FCD34D" font-weight="bold">北</text>
                <text x="178" y="104" text-anchor="middle" font-size="10" fill="#FCD34D" font-weight="bold">东</text>
                <text x="100" y="184" text-anchor="middle" font-size="10" fill="#FCD34D" font-weight="bold">南</text>
                <text x="24" y="104" text-anchor="middle" font-size="10" fill="#FCD34D" font-weight="bold">西</text>
                <!-- Yin Yang Center Wave -->
                <path d="M 100,55 A 22.5,22.5 0 0,1 100,100 A 22.5,22.5 0 0,0 100,145 A 45,45 0 0,1 100,55" fill="rgba(252,211,77,0.08)" />
                <circle cx="100" cy="77" r="4" fill="#FCD34D" />
                <circle cx="100" cy="123" r="4" fill="#044E39" stroke="#FCD34D" stroke-width="1" />
              </svg>
            </div>

            <!-- Soft Overhead Spotlight Beam -->
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_65%)] pointer-events-none"></div>
          </div>
        </div>
      </div>

      <!-- 3D Scene Layer (Perspective Container) -->
      <div class="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center dice-scene">
        <!-- DIE 1 WRAPPER & SHADOW -->
        <div
          class="absolute transition-transform duration-300"
          :style="{
            transform: `translate3d(${die1Pos.x}px, ${die1Pos.y}px, 0)`
          }"
        >
          <!-- Dynamic Cast Drop Shadow -->
          <div
            class="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/75 blur-[3px] transition-all duration-75 pointer-events-none"
            :style="{
              width: `${Math.max(20, 48 - die1Height * 0.4)}px`,
              height: `${Math.max(8, 18 - die1Height * 0.15)}px`,
              opacity: Math.max(0.2, 0.85 - die1Height * 0.008)
            }"
          ></div>

          <!-- Die 1 3D Cube -->
          <div
            class="dice-cube"
            :style="{
              transform: `translateY(${-die1Height}px) rotateX(${die1Rot.x}deg) rotateY(${die1Rot.y}deg) rotateZ(${die1Rot.z}deg)`
            }"
          >
            <!-- 6 FACES -->
            <!-- Face 1: 1 Big Red Pip (Front) -->
            <div class="dice-face face-front">
              <div class="pip pip-big-red"></div>
            </div>
            <!-- Face 6: 6 Dark Indigo Pips (Back) -->
            <div class="dice-face face-back">
              <div class="pip-grid-6">
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
              </div>
            </div>
            <!-- Face 2: 2 Dark Indigo Pips (Top) -->
            <div class="dice-face face-top">
              <div class="pip-grid-2">
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
              </div>
            </div>
            <!-- Face 5: 4 Dark Pips + 1 Red Center (Bottom) -->
            <div class="dice-face face-bottom">
              <div class="pip-grid-5">
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-red"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
              </div>
            </div>
            <!-- Face 3: 3 Dark Indigo Pips Diagonal (Right) -->
            <div class="dice-face face-right">
              <div class="pip-grid-3">
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
              </div>
            </div>
            <!-- Face 4: 4 Traditional Red Pips (Left) -->
            <div class="dice-face face-left">
              <div class="pip-grid-4">
                <span class="pip pip-red"></span>
                <span class="pip pip-red"></span>
                <span class="pip pip-red"></span>
                <span class="pip pip-red"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- DIE 2 WRAPPER & SHADOW -->
        <div
          class="absolute transition-transform duration-300"
          :style="{
            transform: `translate3d(${die2Pos.x}px, ${die2Pos.y}px, 0)`
          }"
        >
          <!-- Dynamic Cast Drop Shadow -->
          <div
            class="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/75 blur-[3px] transition-all duration-75 pointer-events-none"
            :style="{
              width: `${Math.max(20, 48 - die2Height * 0.4)}px`,
              height: `${Math.max(8, 18 - die2Height * 0.15)}px`,
              opacity: Math.max(0.2, 0.85 - die2Height * 0.008)
            }"
          ></div>

          <!-- Die 2 3D Cube -->
          <div
            class="dice-cube"
            :style="{
              transform: `translateY(${-die2Height}px) rotateX(${die2Rot.x}deg) rotateY(${die2Rot.y}deg) rotateZ(${die2Rot.z}deg)`
            }"
          >
            <!-- 6 FACES -->
            <div class="dice-face face-front">
              <div class="pip pip-big-red"></div>
            </div>
            <div class="dice-face face-back">
              <div class="pip-grid-6">
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
              </div>
            </div>
            <div class="dice-face face-top">
              <div class="pip-grid-2">
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
              </div>
            </div>
            <div class="dice-face face-bottom">
              <div class="pip-grid-5">
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-red"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
              </div>
            </div>
            <div class="dice-face face-right">
              <div class="pip-grid-3">
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
                <span class="pip pip-black"></span>
              </div>
            </div>
            <div class="dice-face face-left">
              <div class="pip-grid-4">
                <span class="pip pip-red"></span>
                <span class="pip pip-red"></span>
                <span class="pip pip-red"></span>
                <span class="pip pip-red"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Result & Seat Direction Badge -->
    <div class="w-full mt-1 flex flex-col items-center">
      <!-- Status Box -->
      <div
        class="w-full px-3 py-2 rounded-2xl bg-black/75 border border-amber-500/40 backdrop-blur-md text-center shadow-xl transition-all"
      >
        <template v-if="!isAnimating">
          <!-- Final Dice Points Announcement -->
          <div class="flex items-center justify-center gap-2 mb-1">
            <span class="text-xs sm:text-sm font-mono font-bold text-amber-200">色子点数：</span>
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 font-mono text-xs sm:text-sm font-black text-amber-300">
              <span>{{ props.d1 }}</span>
              <span>+</span>
              <span>{{ props.d2 }}</span>
              <span>=</span>
              <span class="text-amber-400 font-extrabold text-sm sm:text-base">{{ diceSum }} 点</span>
            </div>
          </div>

          <!-- Dealer & Opening Door Direction Callout -->
          <div class="text-xs sm:text-sm font-black font-serif-title tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
            🎯 {{ props.isDealerContinuing ? `【${dealerName}】上局自摸连庄！率先开门出牌` : `【${dealerName}】开门坐庄！起手抓牌率先出牌` }}
          </div>
          <div class="text-[10px] text-[#A89887] font-mono mt-0.5">
            开门席位：{{ openingSeatName }} · 点数取牌就绪
          </div>
        </template>

        <template v-else>
          <div class="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-amber-300 font-serif-title animate-pulse">
            <span class="text-base animate-spin">🌀</span>
            <span>色盅旋转中，双色子激烈翻滚定庄中...</span>
          </div>
          <div class="text-[10px] text-[#A89887] font-mono mt-0.5">
            按逆时针从庄家数点确定起牌门道与抓牌位置
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { soundFX } from '../../utils/sound';

const props = defineProps<{
  d1: number;
  d2: number;
  dealerSeat: number;
  isDealerContinuing?: boolean;
  title?: string;
  roomPlayers?: any[];
}>();

const emit = defineEmits<{
  (e: 'roll-finished'): void;
  (e: 'skip'): void;
}>();

const isAnimating = ref(true);

const diceSum = computed(() => (props.d1 || 1) + (props.d2 || 1));

const SEAT_NAMES_DEFAULT = ['本家(南)', '东席(右)', '北席(上)', '西席(左)'];

const dealerName = computed(() => {
  if (props.roomPlayers && props.roomPlayers[props.dealerSeat]) {
    const p = props.roomPlayers[props.dealerSeat];
    const prefix = props.dealerSeat === 0 ? '本家' : props.dealerSeat === 1 ? '东席' : props.dealerSeat === 2 ? '北席' : '西席';
    return `${prefix} (${p.name})`;
  }
  return SEAT_NAMES_DEFAULT[props.dealerSeat] || '本家';
});

// In traditional Mahjong, count starts from dealer and goes counter-clockwise by sum:
// (sum - 1) % 4
const openingSeatName = computed(() => {
  const openSeatIdx = (props.dealerSeat + (diceSum.value - 1)) % 4;
  return SEAT_NAMES_DEFAULT[openSeatIdx];
});

// Cube size constants: 46px wide cube, half = 23px
// Coordinates and rotations for 3D simulation
const die1Pos = ref({ x: -28, y: -6 });
const die2Pos = ref({ x: 26, y: 12 });
const die1Height = ref(0);
const die2Height = ref(0);
const die1Rot = ref({ x: 0, y: 0, z: 0 });
const die2Rot = ref({ x: 0, y: 0, z: 0 });

let animFrameId: number | null = null;
let rollTimer: any = null;

// Return target orientation angles so the desired face faces the camera (front face)
// Face 1: Front (x: 0, y: 0)
// Face 6: Back  (x: 0, y: 180)
// Face 2: Top   (x: -90, y: 0)
// Face 5: Bottom(x: 90, y: 0)
// Face 3: Right (x: 0, y: -90)
// Face 4: Left  (x: 0, y: 90)
function getTargetRotations(faceVal: number): { x: number; y: number } {
  const val = Math.max(1, Math.min(6, faceVal || 1));
  switch (val) {
    case 1: return { x: 0, y: 0 };
    case 2: return { x: -90, y: 0 };
    case 3: return { x: 0, y: -90 };
    case 4: return { x: 0, y: 90 };
    case 5: return { x: 90, y: 0 };
    case 6: return { x: 0, y: 180 };
    default: return { x: 0, y: 0 };
  }
}

function startRealisticRoll() {
  isAnimating.value = true;
  soundFX.playDiceRoll();

  const startTime = performance.now();
  const rollDuration = 1250; // 1.25s roll & bounce

  const target1 = getTargetRotations(props.d1);
  const target2 = getTargetRotations(props.d2);

  // Extra complete revolutions for Die 1 and Die 2
  const extraRot1 = { x: 360 * 3, y: 360 * 4, z: 360 * 2 + 15 };
  const extraRot2 = { x: 360 * 4, y: 360 * 3, z: 360 * 2 - 18 };

  let lastClackTime = 0;

  function frame(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / rollDuration);

    // Easing: rapid chaotic bounce then smooth settling (damped harmonic bounce)
    // Height bouncing curve: decaying sine wave
    const bounceFreq1 = 18;
    const decay1 = Math.exp(-progress * 3.5);
    const h1 = Math.max(0, Math.sin(progress * Math.PI * bounceFreq1) * 45 * decay1);
    die1Height.value = h1;

    const bounceFreq2 = 16;
    const decay2 = Math.exp(-progress * 3.8);
    const h2 = Math.max(0, Math.sin(progress * Math.PI * bounceFreq2 + 0.5) * 42 * decay2);
    die2Height.value = h2;

    // Trigger subtle ivory clacks on ground impact
    if (elapsed - lastClackTime > 140 && (h1 < 4 || h2 < 4) && progress < 0.8) {
      soundFX.playMahjongClack();
      lastClackTime = elapsed;
    }

    // Trajectory drift within tray
    const drift1 = Math.sin(progress * Math.PI * 4) * 12 * (1 - progress);
    const drift2 = Math.cos(progress * Math.PI * 4) * 14 * (1 - progress);
    die1Pos.value = { x: -28 + drift1, y: -6 + drift2 * 0.4 };
    die2Pos.value = { x: 26 - drift2, y: 12 - drift1 * 0.4 };

    // Rotation progression: rapid spin smoothly decaying to final target face
    // Cubic ease-out
    const rotEase = 1 - Math.pow(1 - progress, 3);

    die1Rot.value = {
      x: (1 - rotEase) * extraRot1.x + target1.x,
      y: (1 - rotEase) * extraRot1.y + target1.y,
      z: (1 - rotEase) * extraRot1.z + 12
    };

    die2Rot.value = {
      x: (1 - rotEase) * extraRot2.x + target2.x,
      y: (1 - rotEase) * extraRot2.y + target2.y,
      z: (1 - rotEase) * extraRot2.z - 15
    };

    if (progress < 1) {
      animFrameId = requestAnimationFrame(frame);
    } else {
      // Finished rolling
      isAnimating.value = false;
      die1Height.value = 0;
      die2Height.value = 0;
      die1Rot.value = { x: target1.x, y: target1.y, z: 8 };
      die2Rot.value = { x: target2.x, y: target2.y, z: -10 };
      soundFX.playMahjongClack();

      soundFX.speakAction('dingzhuang');

      // Emit finish after a pleasant brief pause to admire the points
      rollTimer = setTimeout(() => {
        emit('roll-finished');
      }, 700);
    }
  }

  animFrameId = requestAnimationFrame(frame);
}

watch(() => [props.d1, props.d2], () => {
  startRealisticRoll();
});

onMounted(() => {
  startRealisticRoll();
});

onBeforeUnmount(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (rollTimer) clearTimeout(rollTimer);
});
</script>

<style scoped>
/* 3D Scene Perspective */
.dice-scene {
  perspective: 750px;
  perspective-origin: 50% 50%;
  transform-style: preserve-3d;
}

/* 3D Cube: 46px x 46px x 46px (half = 23px) */
.dice-cube {
  position: relative;
  width: 46px;
  height: 46px;
  transform-style: preserve-3d;
  transition: transform 0.05s ease-out;
}

/* 6 Faces of the Ivory Bone Mahjong Die */
.dice-face {
  position: absolute;
  width: 46px;
  height: 46px;
  border-radius: 9px;
  background: radial-gradient(circle at 35% 35%, #FFFFFF 0%, #FAF8F5 55%, #EDE6D9 100%);
  border: 1.5px solid rgba(212, 163, 115, 0.45);
  box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.9), inset 0 -1px 3px rgba(0, 0, 0, 0.12), 0 0 2px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  user-select: none;
}

/* 3D Face Positions */
.face-front  { transform: rotateY(0deg) translateZ(23px); }
.face-back   { transform: rotateY(180deg) translateZ(23px); }
.face-top    { transform: rotateX(90deg) translateZ(23px); }
.face-bottom { transform: rotateX(-90deg) translateZ(23px); }
.face-right  { transform: rotateY(90deg) translateZ(23px); }
.face-left   { transform: rotateY(-90deg) translateZ(23px); }

/* Pips styling: Engraved lacquered ivory dots */
.pip {
  border-radius: 9999px;
  display: inline-block;
  box-shadow: inset 0 1.5px 2px rgba(0, 0, 0, 0.4), 0 0.5px 1px rgba(255, 255, 255, 0.4);
}

.pip-big-red {
  width: 18px;
  height: 18px;
  background: radial-gradient(circle at 35% 35%, #EF4444 0%, #DC2626 65%, #991B1B 100%);
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(255, 255, 255, 0.5);
}

.pip-red {
  width: 8px;
  height: 8px;
  background: radial-gradient(circle at 35% 35%, #EF4444 0%, #DC2626 65%, #991B1B 100%);
}

.pip-black {
  width: 8px;
  height: 8px;
  background: radial-gradient(circle at 35% 35%, #334155 0%, #0F172A 70%, #020617 100%);
}

/* Grids for traditional pip layouts */
.pip-grid-2 {
  width: 100%;
  height: 100%;
  padding: 8px;
  display: flex;
  justify-content: space-between;
}
.pip-grid-2 span:nth-child(1) { align-self: flex-start; }
.pip-grid-2 span:nth-child(2) { align-self: flex-end; }

.pip-grid-3 {
  width: 100%;
  height: 100%;
  padding: 8px;
  display: flex;
  justify-content: space-between;
}
.pip-grid-3 span:nth-child(1) { align-self: flex-start; }
.pip-grid-3 span:nth-child(2) { align-self: center; }
.pip-grid-3 span:nth-child(3) { align-self: flex-end; }

.pip-grid-4 {
  width: 100%;
  height: 100%;
  padding: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  align-items: center;
  justify-items: center;
}

.pip-grid-5 {
  width: 100%;
  height: 100%;
  padding: 7px;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  align-items: center;
  justify-items: center;
}
.pip-grid-5 span:nth-child(3) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.pip-grid-6 {
  width: 100%;
  height: 100%;
  padding: 7px 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  align-items: center;
  justify-items: center;
}
</style>
