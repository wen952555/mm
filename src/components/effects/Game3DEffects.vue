<template>
  <div class="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
    <!-- Screen Shake Wrapper -->
    <div :class="{ 'screen-shake': isShaking, 'screen-heavy-rumble': isHeavyRumble }" class="w-full h-full relative">
      <!-- Hardware-accelerated canvas for sparks, shockwaves, particles, and 3D coins -->
      <canvas ref="fxCanvasRef" class="w-full h-full absolute inset-0 block"></canvas>

      <!-- 1. 3D ROCKET LAUNCH & SUPERNOVA EFFECT -->
      <div
        v-if="activeRocket"
        class="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
      >
        <!-- Ascending 3D Rocket with Fiery Plume -->
        <div
          v-if="activeRocket.stage === 'launch'"
          class="rocket-fly-anim flex flex-col items-center"
        >
          <div class="text-7xl filter drop-shadow-[0_0_25px_rgba(255,100,0,0.9)] transform -rotate-45">
            🚀
          </div>
          <div class="w-6 h-28 bg-gradient-to-t from-transparent via-amber-500 to-orange-600 blur-sm rounded-full animate-pulse mt-[-10px]"></div>
          <div class="w-3 h-20 bg-gradient-to-t from-transparent to-yellow-200 blur-xs rounded-full mt-[-20px]"></div>
        </div>

        <!-- Supernova Blast Typography -->
        <div
          v-else-if="activeRocket.stage === 'blast'"
          class="flex flex-col items-center justify-center animate-zoom-in"
        >
          <div class="relative flex items-center justify-center">
            <!-- Pulsing 3D Sunburst aura -->
            <div class="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-r from-red-600/60 via-amber-500/70 to-yellow-400/60 blur-2xl animate-spin-slow"></div>
            <div class="text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-orange-500 font-serif-title drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] stroke-amber-500 tracking-wider">
              {{ activeRocket.title }}
            </div>
          </div>
          <div class="mt-3 px-6 py-1.5 rounded-full bg-gradient-to-r from-red-950/90 via-amber-900/90 to-red-950/90 border-2 border-yellow-400/80 shadow-[0_0_30px_rgba(245,158,11,0.6)] text-amber-200 text-sm sm:text-base font-bold tracking-widest uppercase">
            {{ activeRocket.subtitle }}
          </div>
        </div>
      </div>

      <!-- 2. 3D BOMB DETONATION EFFECT -->
      <div
        v-if="activeBomb"
        class="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none animate-zoom-in"
      >
        <div class="relative flex flex-col items-center">
          <div class="text-8xl animate-bounce filter drop-shadow-[0_0_35px_rgba(239,68,68,0.9)] mb-2">
            💣
          </div>
          <div class="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-200 via-amber-400 to-red-600 font-serif-title tracking-widest drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)]">
            {{ activeBomb.title }}
          </div>
          <div class="mt-2 px-5 py-1 rounded-full bg-black/80 border border-red-500/80 text-red-300 font-bold text-sm tracking-wider shadow-lg">
            {{ activeBomb.subtitle }}
          </div>
        </div>
      </div>

      <!-- 3. 3D AIRPLANE FLYBY EFFECT -->
      <div
        v-if="activeAirplane"
        class="absolute inset-0 z-20 pointer-events-none airplane-flight-path flex items-center justify-center"
      >
        <div class="flex items-center gap-3">
          <!-- 3D Plane silhouette with jet exhaust trails -->
          <div class="relative">
            <span class="text-7xl sm:text-8xl filter drop-shadow-[0_10px_20px_rgba(59,130,246,0.8)] inline-block transform -rotate-12 scale-x-[-1]">
              ✈️
            </span>
            <!-- Jet vapor trail -->
            <div class="absolute top-1/2 right-full h-2 w-72 bg-gradient-to-r from-transparent via-cyan-400 to-white/90 blur-xs rounded-full"></div>
            <div class="absolute top-2/3 right-full h-1.5 w-60 bg-gradient-to-r from-transparent via-amber-400 to-white/80 blur-xs rounded-full"></div>
          </div>
          <div class="px-5 py-2 rounded-2xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.7)] text-cyan-200 text-lg sm:text-xl font-bold font-serif-title tracking-wider whitespace-nowrap">
            {{ activeAirplane.title }}
          </div>
        </div>
      </div>

      <!-- 4. 3D SHUNZI / DRAGON SLASH EFFECT -->
      <div
        v-if="activeDragon"
        class="absolute inset-0 z-20 pointer-events-none flex items-center justify-center animate-zoom-in"
      >
        <div class="relative flex flex-col items-center">
          <div class="dragon-slash-glow absolute w-[600px] h-3 bg-gradient-to-r from-transparent via-yellow-300 to-transparent blur-sm transform -rotate-12"></div>
          <div class="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-400 font-serif-title tracking-widest drop-shadow-[0_6px_20px_rgba(0,0,0,0.8)] flex items-center gap-2">
            <span>🐲</span>
            <span>{{ activeDragon.title }}</span>
          </div>
          <div class="mt-2 text-xs sm:text-sm text-yellow-200/90 font-medium px-4 py-1 rounded-full bg-black/60 border border-yellow-500/40">
            {{ activeDragon.subtitle }}
          </div>
        </div>
      </div>

      <!-- 5. 3D JADE / CALLIGRAPHY SEAL STAMP (麻将 碰/杠/听/胡) -->
      <div
        v-if="activeStamp"
        class="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
      >
        <div class="stamp-drop-anim flex flex-col items-center">
          <div
            class="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl border-4 flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.9)] transform rotate-[-6deg]"
            :class="activeStamp.color === 'red' ? 'bg-gradient-to-br from-red-700 via-rose-800 to-red-950 border-red-300 text-amber-200' : 'bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-950 border-emerald-300 text-emerald-100'"
          >
            <!-- Inset Carved Border -->
            <div class="absolute inset-2 border-2 border-dashed border-white/40 rounded-2xl"></div>
            <!-- Glow backlight -->
            <div class="text-6xl sm:text-7xl font-black font-serif-title tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              {{ activeStamp.text }}
            </div>
            <div class="text-[11px] uppercase tracking-widest font-mono font-bold mt-1 opacity-90">
              {{ activeStamp.subText }}
            </div>
          </div>
        </div>
      </div>

      <!-- 6. HIGH-PRECISION 3D PHYSICAL ROLLING DICE ANIMATION -->
      <div
        v-if="activeDice"
        class="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center"
      >
        <div class="relative flex items-center justify-center gap-12 sm:gap-16 pt-8">
          <!-- Die 1 with Shadow -->
          <div class="flex flex-col items-center dice-scene">
            <div
              class="dice-cube"
              :class="{ 'dice-rolling-1': activeDice.rolling }"
              :style="{ transform: getDiceCubeTransform(activeDice.val1, activeDice.rolling, 1) }"
            >
              <!-- Face 1: 1 large red dot -->
              <div class="dice-3d-face face-front">
                <div class="w-5 h-5 rounded-full bg-red-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.8)]"></div>
              </div>
              <!-- Face 2: 2 diagonal blue dots -->
              <div class="dice-3d-face face-top">
                <div class="w-full h-full p-2.5 flex flex-col justify-between">
                  <div class="flex justify-end"><div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div></div>
                  <div class="flex justify-start"><div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div></div>
                </div>
              </div>
              <!-- Face 3: 3 diagonal blue dots -->
              <div class="dice-3d-face face-right">
                <div class="w-full h-full p-2 flex flex-col justify-between">
                  <div class="flex justify-end"><div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div></div>
                  <div class="flex justify-center"><div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div></div>
                  <div class="flex justify-start"><div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div></div>
                </div>
              </div>
              <!-- Face 4: 4 corner red dots (Chinese traditional) -->
              <div class="dice-3d-face face-left">
                <div class="w-full h-full p-2.5 grid grid-cols-2 grid-rows-2 items-center justify-items-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                </div>
              </div>
              <!-- Face 5: 4 blue corner dots + 1 center red dot -->
              <div class="dice-3d-face face-bottom">
                <div class="relative w-full h-full p-2.5 grid grid-cols-2 grid-rows-2 items-center justify-items-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="absolute inset-0 m-auto w-3 h-3 rounded-full bg-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                </div>
              </div>
              <!-- Face 6: 6 blue dots -->
              <div class="dice-3d-face face-back">
                <div class="w-full h-full p-2 grid grid-cols-2 grid-rows-3 items-center justify-items-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                </div>
              </div>
            </div>
            <!-- Dynamic contact shadow -->
            <div class="dice-contact-shadow" :class="{ 'shadow-pulsing-1': activeDice.rolling }"></div>
          </div>

          <!-- Die 2 with Shadow -->
          <div class="flex flex-col items-center dice-scene">
            <div
              class="dice-cube"
              :class="{ 'dice-rolling-2': activeDice.rolling }"
              :style="{ transform: getDiceCubeTransform(activeDice.val2, activeDice.rolling, 2) }"
            >
              <!-- Face 1: 1 large red dot -->
              <div class="dice-3d-face face-front">
                <div class="w-5 h-5 rounded-full bg-red-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.8)]"></div>
              </div>
              <!-- Face 2: 2 diagonal blue dots -->
              <div class="dice-3d-face face-top">
                <div class="w-full h-full p-2.5 flex flex-col justify-between">
                  <div class="flex justify-end"><div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div></div>
                  <div class="flex justify-start"><div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div></div>
                </div>
              </div>
              <!-- Face 3: 3 diagonal blue dots -->
              <div class="dice-3d-face face-right">
                <div class="w-full h-full p-2 flex flex-col justify-between">
                  <div class="flex justify-end"><div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div></div>
                  <div class="flex justify-center"><div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div></div>
                  <div class="flex justify-start"><div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div></div>
                </div>
              </div>
              <!-- Face 4: 4 corner red dots (Chinese traditional) -->
              <div class="dice-3d-face face-left">
                <div class="w-full h-full p-2.5 grid grid-cols-2 grid-rows-2 items-center justify-items-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                </div>
              </div>
              <!-- Face 5: 4 blue corner dots + 1 center red dot -->
              <div class="dice-3d-face face-bottom">
                <div class="relative w-full h-full p-2.5 grid grid-cols-2 grid-rows-2 items-center justify-items-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="absolute inset-0 m-auto w-3 h-3 rounded-full bg-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                </div>
              </div>
              <!-- Face 6: 6 blue dots -->
              <div class="dice-3d-face face-back">
                <div class="w-full h-full p-2 grid grid-cols-2 grid-rows-3 items-center justify-items-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"></div>
                </div>
              </div>
            </div>
            <!-- Dynamic contact shadow -->
            <div class="dice-contact-shadow" :class="{ 'shadow-pulsing-2': activeDice.rolling }"></div>
          </div>
        </div>

        <!-- Result Banner -->
        <div
          v-if="!activeDice.rolling"
          class="animate-zoom-in mt-6 flex flex-col items-center gap-1.5"
        >
          <div class="px-6 py-2 rounded-full bg-gradient-to-r from-amber-950/95 via-stone-900/95 to-amber-950/95 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.65)] text-amber-200 font-extrabold text-base sm:text-xl font-serif-title tracking-wider flex items-center gap-2.5">
            <span class="text-xl">🎲</span>
            <span>开局定庄 · {{ activeDice.val1 }} + {{ activeDice.val2 }} = {{ activeDice.val1 + activeDice.val2 }} 点</span>
          </div>
          <div class="px-3.5 py-0.5 rounded-full bg-black/60 border border-amber-400/30 text-[11px] text-amber-300 font-bold tracking-widest uppercase">
            庄家开门 · 气势如虹
          </div>
        </div>
      </div>

      <!-- 7. SHISANSHUI 3D TACTICAL GUNSHOT IMPACT -->
      <div
        v-if="activeGunshot"
        class="absolute inset-0 z-20 pointer-events-none"
        :style="{ left: `${activeGunshot.x}%`, top: `${activeGunshot.y}%` }"
      >
        <!-- 3D Crosshair Reticle -->
        <div class="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div class="w-24 h-24 rounded-full border-2 border-red-500/80 animate-ping absolute"></div>
          <div class="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.8)]">
            <div class="w-2 h-2 rounded-full bg-red-400"></div>
          </div>
          <!-- Muzzle crack flash -->
          <div class="absolute text-5xl filter drop-shadow-[0_0_15px_rgba(255,200,0,1)] animate-pulse">
            💥
          </div>
          <!-- Damage Tag -->
          <div class="absolute -top-10 font-black text-2xl text-amber-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] animate-bounce font-mono">
            {{ activeGunshot.text }}
          </div>
        </div>
      </div>

      <!-- 8. GRAND SLAM CHAMPION STADIUM FIREWORKS -->
      <div
        v-if="activeGrandSlam"
        class="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center animate-zoom-in"
      >
        <div class="relative flex flex-col items-center">
          <div class="text-7xl sm:text-8xl animate-bounce filter drop-shadow-[0_0_30px_rgba(245,158,11,0.9)] mb-2">
            🏆
          </div>
          <div class="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 font-serif-title tracking-widest drop-shadow-[0_8px_25px_rgba(0,0,0,0.9)]">
            震撼全垒打
          </div>
          <div class="mt-3 px-8 py-2 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 font-extrabold text-base tracking-widest uppercase shadow-[0_0_35px_rgba(245,158,11,0.8)] border-2 border-white">
            通关清台 · 满贯四海
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { soundFX } from '../../utils/sound.ts';

// Canvas & Animation State
const fxCanvasRef = ref<HTMLCanvasElement | null>(null);
let animFrameId: number | null = null;

// Camera Shake
const isShaking = ref(false);
const isHeavyRumble = ref(false);

// Active Overlays
const activeRocket = ref<{ title: string; subtitle: string; stage: 'launch' | 'blast' } | null>(null);
const activeBomb = ref<{ title: string; subtitle: string } | null>(null);
const activeAirplane = ref<{ title: string } | null>(null);
const activeDragon = ref<{ title: string; subtitle: string } | null>(null);
const activeStamp = ref<{ text: string; subText: string; color: 'red' | 'green' } | null>(null);
const activeDice = ref<{ val1: number; val2: number; rolling: boolean } | null>(null);
const activeGunshot = ref<{ x: number; y: number; text: string } | null>(null);
const activeGrandSlam = ref(false);

// 3D Particles & Shockwave rings
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vz: number;
  z: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type: 'spark' | 'coin' | 'yuanbao' | 'star';
  rotation: number;
  rotSpeed: number;
}

interface Ring {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

const particles: Particle[] = [];
const rings: Ring[] = [];

function triggerShake(heavy = false, durationMs = 600) {
  if (heavy) {
    isHeavyRumble.value = true;
    setTimeout(() => {
      isHeavyRumble.value = false;
    }, durationMs);
  } else {
    isShaking.value = true;
    setTimeout(() => {
      isShaking.value = false;
    }, durationMs);
  }
}

// 3D Dice Isometric Transform Helper (将指定点数以立体斜俯视角度精准呈现于正面)
function getDiceCubeTransform(val: number, isRolling: boolean, dieIndex: 1 | 2): string {
  if (isRolling) return '';
  const tiltX = -24;
  const tiltY = dieIndex === 1 ? 26 : -22;
  switch (val) {
    case 1:
      return `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.15)`;
    case 2:
      return `rotateX(${tiltX - 90}deg) rotateY(0deg) rotateZ(${dieIndex === 1 ? -16 : 16}deg) scale(1.15)`;
    case 3:
      return `rotateX(${tiltX}deg) rotateY(${tiltY - 90}deg) scale(1.15)`;
    case 4:
      return `rotateX(${tiltX}deg) rotateY(${tiltY + 90}deg) scale(1.15)`;
    case 5:
      return `rotateX(${tiltX + 90}deg) rotateY(0deg) rotateZ(${dieIndex === 1 ? 16 : -16}deg) scale(1.15)`;
    case 6:
      return `rotateX(${tiltX}deg) rotateY(${tiltY + 180}deg) scale(1.15)`;
    default:
      return `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.15)`;
  }
}

// -------------------------------------------------------------
// PUBLIC EXPOSED TRIGGERS
// -------------------------------------------------------------

function triggerRocket(title = '至尊王炸', subtitle = '天崩地裂 · 积分翻倍') {
  soundFX.playRocket();
  triggerShake(false, 1400);

  activeRocket.value = { title, subtitle, stage: 'launch' };
  ensureRenderLoop();

  // Ascending rocket particle trail
  const canvas = fxCanvasRef.value;
  const cx = canvas ? canvas.width / 2 : window.innerWidth / 2;
  const startY = canvas ? canvas.height : window.innerHeight;

  const interval = setInterval(() => {
    if (!activeRocket.value || activeRocket.value.stage !== 'launch') {
      clearInterval(interval);
      return;
    }
    for (let i = 0; i < 4; i++) {
      particles.push({
        x: cx + (Math.random() * 30 - 15),
        y: startY - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 4 + Math.random() * 8,
        vz: 0,
        z: 1,
        size: 4 + Math.random() * 6,
        color: Math.random() > 0.4 ? '#f59e0b' : '#ef4444',
        alpha: 1,
        decay: 0.04,
        type: 'spark',
        rotation: 0,
        rotSpeed: 0,
      });
    }
    ensureRenderLoop();
  }, 40);

  // Switch to blast stage
  setTimeout(() => {
    clearInterval(interval);
    if (!activeRocket.value) return;
    activeRocket.value.stage = 'blast';
    triggerShake(true, 700);

    // Shockwave rings & explosion starburst
    const cy = canvas ? canvas.height / 2 : window.innerHeight / 2;
    rings.push({
      x: cx,
      y: cy,
      radius: 10,
      maxRadius: 360,
      color: '#fbbf24',
      alpha: 1,
      lineWidth: 8,
    });
    rings.push({
      x: cx,
      y: cy,
      radius: 10,
      maxRadius: 280,
      color: '#ef4444',
      alpha: 0.8,
      lineWidth: 5,
    });

    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: (Math.random() - 0.5) * 4,
        z: 1,
        size: 3 + Math.random() * 6,
        color: ['#fbbf24', '#f59e0b', '#ef4444', '#fef08a'][Math.floor(Math.random() * 4)],
        alpha: 1,
        decay: 0.02 + Math.random() * 0.015,
        type: Math.random() > 0.3 ? 'star' : 'spark',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
      });
    }
    ensureRenderLoop();

    setTimeout(() => {
      activeRocket.value = null;
    }, 1800);
  }, 650);
}

function triggerBomb(title = '轰天炸弹', subtitle = '满座皆惊 · 筹码加倍') {
  soundFX.playBombExplosion(false);
  triggerShake(true, 600);
  activeBomb.value = { title, subtitle };

  const canvas = fxCanvasRef.value;
  const cx = canvas ? canvas.width / 2 : window.innerWidth / 2;
  const cy = canvas ? canvas.height / 2 : window.innerHeight / 2;

  rings.push({
    x: cx,
    y: cy,
    radius: 10,
    maxRadius: 320,
    color: '#ef4444',
    alpha: 1,
    lineWidth: 6,
  });

  for (let i = 0; i < 70; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 10;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 0,
      z: 1,
      size: 3 + Math.random() * 5,
      color: ['#f87171', '#fbbf24', '#f97316'][Math.floor(Math.random() * 3)],
      alpha: 1,
      decay: 0.025 + Math.random() * 0.02,
      type: 'spark',
      rotation: 0,
      rotSpeed: 0,
    });
  }
  ensureRenderLoop();

  setTimeout(() => {
    activeBomb.value = null;
  }, 1600);
}

function triggerAirplane(title = '飞机带翅膀') {
  soundFX.playAirplane();
  activeAirplane.value = { title };

  setTimeout(() => {
    activeAirplane.value = null;
  }, 1900);
}

function triggerDragon(title = '势如破竹', subtitle = '连对顺风 · 一气呵成') {
  soundFX.playCardSnap(false);
  activeDragon.value = { title, subtitle };

  const canvas = fxCanvasRef.value;
  const cx = canvas ? canvas.width / 2 : window.innerWidth / 2;
  const cy = canvas ? canvas.height / 2 : window.innerHeight / 2;

  for (let i = 0; i < 40; i++) {
    particles.push({
      x: cx + (Math.random() - 0.5) * 350,
      y: cy + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 4,
      vy: -1 - Math.random() * 3,
      vz: 0,
      z: 1,
      size: 2 + Math.random() * 4,
      color: '#facc15',
      alpha: 1,
      decay: 0.03,
      type: 'star',
      rotation: Math.random() * 2,
      rotSpeed: 0.1,
    });
  }
  ensureRenderLoop();

  setTimeout(() => {
    activeDragon.value = null;
  }, 1500);
}

function triggerStamp(text: string, subText = '国粹神技', color: 'red' | 'green' = 'red') {
  soundFX.playSealStamp();
  triggerShake(false, 350);
  activeStamp.value = { text, subText, color };

  const canvas = fxCanvasRef.value;
  const cx = canvas ? canvas.width / 2 : window.innerWidth / 2;
  const cy = canvas ? canvas.height / 2 : window.innerHeight / 2;

  rings.push({
    x: cx,
    y: cy,
    radius: 15,
    maxRadius: 220,
    color: color === 'red' ? '#ef4444' : '#10b981',
    alpha: 0.9,
    lineWidth: 4,
  });
  ensureRenderLoop();

  setTimeout(() => {
    activeStamp.value = null;
  }, 1300);
}

function triggerDice(val1 = 3, val2 = 5) {
  soundFX.playDiceRoll();
  activeDice.value = { val1, val2, rolling: true };

  setTimeout(() => {
    if (activeDice.value) {
      activeDice.value.rolling = false;
    }
  }, 900);

  setTimeout(() => {
    activeDice.value = null;
  }, 2200);
}

function triggerGunshot(xPercent = 50, yPercent = 50, text = '+3 水') {
  soundFX.playGunshot();
  triggerShake(false, 250);
  activeGunshot.value = { x: xPercent, y: yPercent, text };

  setTimeout(() => {
    activeGunshot.value = null;
  }, 1100);
}

function triggerGrandSlam() {
  soundFX.playVictory();
  triggerShake(true, 800);
  activeGrandSlam.value = true;
  triggerCoins(60);

  setTimeout(() => {
    activeGrandSlam.value = false;
  }, 2800);
}

function triggerCoins(count = 45) {
  soundFX.playCoinShower();
  const canvas = fxCanvasRef.value;
  const w = canvas ? canvas.width : window.innerWidth;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 3,
      vy: 4 + Math.random() * 6,
      vz: 0,
      z: 0.8 + Math.random() * 0.4,
      size: 14 + Math.random() * 10,
      color: '#f59e0b',
      alpha: 1,
      decay: 0.006,
      type: Math.random() > 0.4 ? 'coin' : 'yuanbao',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
    });
  }
  ensureRenderLoop();
}

// -------------------------------------------------------------
// CANVAS ANIMATION LOOP WITH INTELLIGENT IDLE SLEEP (节能省电)
// -------------------------------------------------------------
let isRendering = false;

function ensureRenderLoop() {
  if (!isRendering) {
    isRendering = true;
    animFrameId = requestAnimationFrame(render);
  }
}

function render() {
  const canvas = fxCanvasRef.value;
  if (!canvas) {
    isRendering = false;
    animFrameId = null;
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    isRendering = false;
    animFrameId = null;
    return;
  }

  // Clear frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // If no particles and no rings are active, sleep the render loop to save CPU & battery
  if (rings.length === 0 && particles.length === 0) {
    isRendering = false;
    animFrameId = null;
    return;
  }

  // 1. Draw Shockwave Rings
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    ctx.save();
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = Math.max(0, r.alpha);
    ctx.lineWidth = r.lineWidth;
    ctx.stroke();
    ctx.restore();

    r.radius += (r.maxRadius - r.radius) * 0.15 + 2;
    r.alpha -= 0.035;
    if (r.alpha <= 0 || r.radius >= r.maxRadius) {
      rings.splice(i, 1);
    }
  }

  // 2. Draw 3D Particles / Coins / Stars
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = Math.max(0, p.alpha);

    if (p.type === 'coin') {
      // 3D Shiny Gold Coin
      const radius = p.size / 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fef08a';
      ctx.stroke();
      // Inner square cutout
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-radius * 0.35, -radius * 0.35, radius * 0.7, radius * 0.7);
    } else if (p.type === 'yuanbao') {
      // 3D Chinese Gold Sycee / Yuanbao
      const w = p.size * 1.2;
      const h = p.size * 0.7;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ca8a04';
      ctx.stroke();
      // Top crown
      ctx.beginPath();
      ctx.arc(0, -h * 0.25, w * 0.25, 0, Math.PI, true);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
    } else if (p.type === 'star') {
      // 4-Pointed Star
      const s = p.size;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.3, -s * 0.3);
      ctx.lineTo(s, 0);
      ctx.lineTo(s * 0.3, s * 0.3);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.3, s * 0.3);
      ctx.lineTo(-s, 0);
      ctx.lineTo(-s * 0.3, -s * 0.3);
      ctx.closePath();
      ctx.fill();
    } else {
      // Spark
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    ctx.restore();

    // Physics update
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotSpeed;
    p.alpha -= p.decay;

    // Gravity for coins
    if (p.type === 'coin' || p.type === 'yuanbao') {
      p.vy += 0.25;
      // Bounce off bottom floor
      if (p.y > canvas.height - 30) {
        p.vy = -p.vy * 0.45;
        p.vx *= 0.8;
      }
    }

    if (p.alpha <= 0 || p.y > canvas.height + 50) {
      particles.splice(i, 1);
    }
  }

  animFrameId = requestAnimationFrame(render);
}

function resizeCanvas() {
  if (fxCanvasRef.value) {
    fxCanvasRef.value.width = window.innerWidth;
    fxCanvasRef.value.height = window.innerHeight;
  }
}

onMounted(() => {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
});

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  isRendering = false;
  window.removeEventListener('resize', resizeCanvas);
});

defineExpose({
  triggerRocket,
  triggerBomb,
  triggerAirplane,
  triggerDragon,
  triggerStamp,
  triggerDice,
  triggerGunshot,
  triggerGrandSlam,
  triggerCoins,
});
</script>

<style scoped>
/* Screen Camera Shake */
.screen-shake {
  animation: camera-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

.screen-heavy-rumble {
  animation: camera-rumble 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes camera-shake {
  10%, 90% { transform: translate3d(-2px, 2px, 0); }
  20%, 80% { transform: translate3d(3px, -2px, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 3px, 0); }
  40%, 60% { transform: translate3d(4px, -3px, 0); }
}

@keyframes camera-rumble {
  0% { transform: translate3d(0, 0, 0); }
  15% { transform: translate3d(-6px, 6px, 0) scale(1.01); }
  30% { transform: translate3d(6px, -5px, 0) scale(0.99); }
  45% { transform: translate3d(-5px, 4px, 0); }
  60% { transform: translate3d(4px, -3px, 0); }
  75% { transform: translate3d(-2px, 2px, 0); }
  100% { transform: translate3d(0, 0, 0); }
}

/* 3D Rocket Fly Animation */
.rocket-fly-anim {
  animation: rocket-soar 0.65s ease-in forwards;
}

@keyframes rocket-soar {
  0% {
    transform: translateY(100vh) scale(0.6);
    opacity: 0.8;
  }
  60% {
    transform: translateY(10vh) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translateY(-40vh) scale(1.4);
    opacity: 0.2;
  }
}

/* Airplane Flyby Animation Across Table */
.airplane-flight-path {
  animation: airplane-swoop 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

@keyframes airplane-swoop {
  0% {
    transform: translate(-60vw, 30vh) scale(0.4) rotate(15deg);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  50% {
    transform: translate(0, 0) scale(1.15) rotate(0deg);
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translate(65vw, -35vh) scale(0.8) rotate(-15deg);
    opacity: 0;
  }
}

/* 3D Jade Seal Stamp Drop Animation */
.stamp-drop-anim {
  animation: stamp-slam 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes stamp-slam {
  0% {
    transform: translateY(-300px) scale(2.2) rotate(12deg);
    opacity: 0;
  }
  70% {
    transform: translateY(10px) scale(0.95) rotate(-8deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1) rotate(-6deg);
    opacity: 1;
  }
}

/* 3D Physical Realistic Dice Styling */
.dice-scene {
  perspective: 1000px;
}

.dice-cube {
  position: relative;
  width: 60px;
  height: 60px;
  transform-style: preserve-3d;
  transition: transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.dice-3d-face {
  position: absolute;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle at 35% 35%, #FFFFFF 0%, #F8F6F0 60%, #E6E4D6 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: inset 0 2px 3px rgba(255, 255, 255, 0.95), inset 0 -2px 3px rgba(0, 0, 0, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
}

.face-front  { transform: rotateY(0deg) translateZ(30px); }
.face-back   { transform: rotateY(180deg) translateZ(30px); }
.face-right  { transform: rotateY(90deg) translateZ(30px); }
.face-left   { transform: rotateY(-90deg) translateZ(30px); }
.face-top    { transform: rotateX(90deg) translateZ(30px); }
.face-bottom { transform: rotateX(-90deg) translateZ(30px); }

/* Realistic 3D Tumble Physics */
.dice-rolling-1 {
  animation: dice-tumble-3d-1 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.dice-rolling-2 {
  animation: dice-tumble-3d-2 0.95s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

@keyframes dice-tumble-3d-1 {
  0% {
    transform: translateY(-180px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1.3);
  }
  30% {
    transform: translateY(0px) rotateX(360deg) rotateY(180deg) rotateZ(90deg) scale(0.95);
  }
  55% {
    transform: translateY(-70px) rotateX(720deg) rotateY(450deg) rotateZ(180deg) scale(1.1);
  }
  75% {
    transform: translateY(0px) rotateX(900deg) rotateY(630deg) rotateZ(270deg) scale(0.98);
  }
  88% {
    transform: translateY(-16px) rotateX(990deg) rotateY(690deg) rotateZ(315deg) scale(1.02);
  }
  100% {
    transform: translateY(0px) rotateX(1080deg) rotateY(720deg) rotateZ(360deg) scale(1);
  }
}

@keyframes dice-tumble-3d-2 {
  0% {
    transform: translateY(-200px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1.35);
  }
  32% {
    transform: translateY(0px) rotateX(-360deg) rotateY(200deg) rotateZ(-90deg) scale(0.95);
  }
  58% {
    transform: translateY(-80px) rotateX(-720deg) rotateY(480deg) rotateZ(-180deg) scale(1.12);
  }
  78% {
    transform: translateY(0px) rotateX(-900deg) rotateY(660deg) rotateZ(-270deg) scale(0.98);
  }
  90% {
    transform: translateY(-18px) rotateX(-1000deg) rotateY(700deg) rotateZ(-320deg) scale(1.02);
  }
  100% {
    transform: translateY(0px) rotateX(-1080deg) rotateY(720deg) rotateZ(-360deg) scale(1);
  }
}

/* Contact Shadow on Table Felt */
.dice-contact-shadow {
  width: 58px;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0) 75%);
  filter: blur(2.5px);
  margin-top: 14px;
}

.shadow-pulsing-1 {
  animation: shadow-bounce-1 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.shadow-pulsing-2 {
  animation: shadow-bounce-2 0.95s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

@keyframes shadow-bounce-1 {
  0% { transform: scale(0.4); opacity: 0.15; }
  30% { transform: scale(1.25); opacity: 0.85; }
  55% { transform: scale(0.65); opacity: 0.35; }
  75% { transform: scale(1.15); opacity: 0.8; }
  88% { transform: scale(0.85); opacity: 0.5; }
  100% { transform: scale(1); opacity: 0.7; }
}

@keyframes shadow-bounce-2 {
  0% { transform: scale(0.4); opacity: 0.15; }
  32% { transform: scale(1.3); opacity: 0.85; }
  58% { transform: scale(0.6); opacity: 0.35; }
  78% { transform: scale(1.15); opacity: 0.8; }
  90% { transform: scale(0.85); opacity: 0.5; }
  100% { transform: scale(1); opacity: 0.7; }
}

/* Zoom In Keyframe */
.animate-zoom-in {
  animation: zoom-pop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes zoom-pop {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-spin-slow {
  animation: spin 12s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
