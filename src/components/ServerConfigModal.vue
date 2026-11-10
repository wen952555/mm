<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div class="w-full max-w-md rounded-3xl bg-[#EFE5D3] border border-[#D8C7B0] p-5 shadow-2xl overflow-hidden text-[#3C2C1E] max-h-[95vh] flex flex-col justify-between">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-[#D8C7B0] mb-3 shrink-0 bg-[#FAF4E8] -mx-5 -mt-5 p-5">
          <div class="flex items-center gap-2">
            <span class="text-xl p-1.5 rounded-xl bg-[#EFE5D3] border border-[#D8C7B0] text-[#3C2C1E]">📡</span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-[#3C2C1E] font-serif-title">服务器与网络配置</h3>
                <span
                  class="text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold bg-[#EFE5D3] text-[#3C2C1E] border-[#D8C7B0]"
                >
                  {{ isNative ? '📱 安卓原生APK' : '🌐 网页端环境' }}
                </span>
              </div>
              <p class="text-[11px] text-[#6B5744] mt-0.5">
                实时检测并切换游戏后端 API 与 WebSocket 服务节点
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="$emit('close')"
            class="w-7 h-7 rounded-full bg-[#EFE5D3] hover:bg-[#E5D7C2] border border-[#D8C7B0] flex items-center justify-center text-xs text-[#3C2C1E] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div class="overflow-y-auto flex-1 pr-1 space-y-3.5 text-xs">
          <!-- Current Active Server Status Box -->
          <div class="p-3 rounded-2xl bg-[#FFFDF8] border border-[#D8C7B0] space-y-2 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-[#6B5744] text-[11px]">当前生效服务器地址:</span>
              <span
                class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1"
                :class="testResult?.ok ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : (testResult ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-[#FAF4E8] text-[#3C2C1E] border border-[#D8C7B0]')"
              >
                <span>{{ testResult?.ok ? '🟢 连通正常' : (testResult ? '🔴 连接失败' : '⚪ 待测试') }}</span>
                <span v-if="testResult?.ok" class="font-mono tabular-nums">({{ testResult.latencyMs }}ms)</span>
              </span>
            </div>
            <div class="font-mono text-xs text-[#5C4533] font-bold break-all bg-[#FAF4E8] p-2 rounded-xl border border-[#D8C7B0] select-all">
              {{ currentUrl }}
            </div>
          </div>

          <!-- Quick Presets -->
          <div>
            <label class="block text-[11px] text-[#6B5744] mb-1.5 font-bold">⚡ 常用线路预设 (点击一键填入):</label>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="preset in SERVER_PRESETS"
                :key="preset.id"
                type="button"
                @click="applyPreset(preset.url)"
                class="text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between"
                :class="inputUrl === preset.url ? 'bg-[#EFE5D3] border-[#5C4533] text-[#3C2C1E] shadow-sm font-bold' : 'bg-[#FFFDF8] border-[#D8C7B0] text-[#3C2C1E] hover:border-[#BFA98F]'"
              >
                <div>
                  <div class="font-bold text-xs text-[#3C2C1E]">{{ preset.name }}</div>
                  <div class="text-[10px] text-[#6B5744] mt-0.5">{{ preset.description }}</div>
                  <div class="text-[9px] font-mono text-emerald-800 font-bold mt-0.5 truncate max-w-[280px]">{{ preset.url }}</div>
                </div>
                <span class="text-[10px] px-2 py-1 rounded bg-[#FAF4E8] border border-[#D8C7B0] text-[#3C2C1E] shrink-0">
                  选择
                </span>
              </button>
            </div>
          </div>

          <!-- Custom Input -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-[11px] text-[#6B5744] font-bold">🛠️ 自定义服务器地址 (支持 HTTP / HTTPS / 隧道):</label>
              <button
                type="button"
                @click="resetToDefault"
                class="text-[10px] text-[#5C4533] font-bold hover:underline cursor-pointer"
              >
                重置为 .env 目标服务器
              </button>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model="inputUrl"
                type="text"
                placeholder="例如: http://192.168.1.50:3000 或 https://xxx.trycloudflare.com"
                class="flex-1 px-3 py-2 text-xs rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] text-[#3C2C1E] focus:outline-none focus:border-[#5C4533] font-mono"
              />
              <button
                type="button"
                @click="runTest(inputUrl)"
                :disabled="isTesting"
                class="px-3 py-2 text-xs rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50 border border-[#7D6049]"
              >
                {{ isTesting ? '测速中...' : '🔍 测试' }}
              </button>
            </div>
          </div>

          <!-- Test Result Diagnostic Banner -->
          <div
            v-if="testResult"
            class="p-2.5 rounded-xl text-[11px] border leading-relaxed"
            :class="testResult.ok ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-red-100 border-red-300 text-red-900'"
          >
            <div class="font-bold flex items-center gap-1.5">
              <span>{{ testResult.ok ? '✅' : '❌' }}</span>
              <span>{{ testResult.ok ? `测试成功！响应延迟: ${testResult.latencyMs}ms，服务器运行正常` : `测试失败: ${testResult.error}` }}</span>
            </div>
            <div v-if="!testResult.ok" class="mt-1 text-[10px] text-[#3C2C1E] leading-normal">
              💡 <strong>排查提示：</strong>
              若使用 Termux，请确保已在手机终端执行 <code>npm start</code> 启动服务；若手机与电脑在同一 WiFi，确保手机填写的 IP 与端口正确。
            </div>
          </div>

          <!-- Telegram Bot Webhook Auto Activation Card -->
          <div class="p-3 rounded-2xl bg-[#FFFDF8] border border-[#D8C7B0] space-y-2 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 font-bold text-[#3C2C1E] text-xs">
                <span>🤖</span>
                <span>Telegram 机器人 Webhook 全自动激活</span>
              </div>
              <span
                class="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold"
                :class="botStatus?.enabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-[#EFE5D3] text-[#3C2C1E] border border-[#D8C7B0]'"
              >
                {{ botStatus?.enabled ? (botStatus.botUsername ? `@${botStatus.botUsername} 在线` : '🟢 已就绪') : '⚪ 待激活' }}
              </span>
            </div>

            <p class="text-[10px] text-[#6B5744] leading-tight">
              填入 @BotFather 的 Token，系统自动持久化保存到 .env 并自动向 Telegram 注册 Webhook 回调！
            </p>

            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <input
                  v-model="botTokenInput"
                  type="text"
                  placeholder="粘贴 Token (如: 7123456789:AAHxyz...)"
                  class="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] text-[#3C2C1E] placeholder:text-[#9E8C78] font-mono focus:outline-none focus:border-[#5C4533]"
                />
                <button
                  type="button"
                  @click="activateBotWebhook"
                  :disabled="isActivatingBot || !botTokenInput.trim()"
                  class="px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] text-[#FAF4E8] font-bold transition-all shrink-0 cursor-pointer disabled:opacity-40 border border-[#7D6049]"
                >
                  {{ isActivatingBot ? '激活中...' : '🚀 自动激活' }}
                </button>
              </div>

              <div
                v-if="botActivationResult"
                class="text-[10px] p-2 rounded-lg font-mono leading-tight"
                :class="botActivationResult.ok ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'"
              >
                {{ botActivationResult.message }}
              </div>
            </div>
          </div>

          <!-- Termux Local Deployment Guidance -->
          <div class="p-2.5 rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] text-[10px] text-[#6B5744] leading-relaxed">
            💡 <strong>手机 Termux 部署提示：</strong>
            Android 9+ 系统要求开启明文通信（已内置 <code>usesCleartextTraffic</code> 支持），本地手机对战直接填写 <code>http://127.0.0.1:3000</code> 即可免流量超低延迟秒级对战！
          </div>
        </div>

        <!-- Docked Footer -->
        <div class="flex items-center gap-2 pt-3 border-t border-[#D8C7B0] mt-3 shrink-0">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 py-2 text-xs rounded-xl bg-[#FAF4E8] hover:bg-[#EFE5D3] text-[#3C2C1E] font-bold transition-colors border border-[#D8C7B0] cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            @click="saveAndConnect"
            class="flex-[2] py-2 text-xs rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] font-bold shadow-lg transition-all border border-[#7D6049] cursor-pointer"
          >
            💾 保存配置并连接
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  getEnvServerUrl,
  getServerPresets,
  getRemoteServerUrl,
  setRemoteServerUrl,
  isNativeApkEnvironment,
  testServerConnection,
} from '../utils/networkConfig';
import { soundFX } from '../utils/sound';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'server-updated', url: string): void;
}>();

const isNative = ref(isNativeApkEnvironment());
const currentUrl = ref(getRemoteServerUrl());
const inputUrl = ref(currentUrl.value);
const SERVER_PRESETS = ref(getServerPresets());
const isTesting = ref(false);
const testResult = ref<{ ok: boolean; latencyMs: number; error?: string } | null>(null);

const botTokenInput = ref('');
const isActivatingBot = ref(false);
const botStatus = ref<{ enabled: boolean; botUsername?: string; webhookUrl?: string; lastError?: string } | null>(null);
const botActivationResult = ref<{ ok: boolean; message: string } | null>(null);

async function fetchBotStatus() {
  try {
    const res = await fetch('/api/telegram/status');
    const data = await res.json().catch(() => ({}));
    if (data && data.success && data.bot) {
      botStatus.value = data.bot;
    }
  } catch {}
}

async function activateBotWebhook() {
  const token = botTokenInput.value.trim();
  if (!token) return;
  isActivatingBot.value = true;
  botActivationResult.value = null;
  try {
    const res = await fetch('/api/telegram/set-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    if (data && data.success) {
      soundFX.playVictory();
      botActivationResult.value = {
        ok: true,
        message: `✅ Webhook 自动激活成功！机器人已在线，请在 Telegram 中发 /start 测试！`,
      };
      await fetchBotStatus();
    } else {
      soundFX.playTap();
      botActivationResult.value = {
        ok: false,
        message: data?.error || '激活未通过，请检查 Token 格式或网络',
      };
    }
  } catch (err: any) {
    soundFX.playTap();
    botActivationResult.value = {
      ok: false,
      message: `网络请求失败: ${err?.message || err}`,
    };
  } finally {
    isActivatingBot.value = false;
  }
}

function applyPreset(url: string) {
  inputUrl.value = url;
  soundFX.playTap();
  runTest(url);
}

function resetToDefault() {
  const envUrl = getEnvServerUrl();
  inputUrl.value = envUrl;
  soundFX.playTap();
  runTest(envUrl);
}

async function runTest(url: string) {
  const target = String(url || '').trim();
  if (!target) return;
  isTesting.value = true;
  testResult.value = null;
  try {
    const res = await testServerConnection(target);
    testResult.value = res;
    if (res.ok) {
      soundFX.playVictory();
    } else {
      soundFX.playTap();
    }
  } finally {
    isTesting.value = false;
  }
}

function saveAndConnect() {
  const finalUrl = String(inputUrl.value || '').trim();
  setRemoteServerUrl(finalUrl);
  currentUrl.value = getRemoteServerUrl();
  soundFX.playVictory();
  emit('server-updated', currentUrl.value);
  emit('close');
}

onMounted(() => {
  currentUrl.value = getRemoteServerUrl();
  inputUrl.value = currentUrl.value;
  runTest(currentUrl.value);
  fetchBotStatus();
});
</script>
