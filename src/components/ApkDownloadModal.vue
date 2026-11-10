<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div class="w-full max-w-md rounded-3xl bg-[#EFE5D3] border border-[#D8C7B0] p-5 shadow-2xl overflow-hidden text-[#3C2C1E] max-h-[95vh] flex flex-col justify-between">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-[#D8C7B0] mb-3 shrink-0 bg-[#FAF4E8] -mx-5 -mt-5 p-5">
        <div class="flex items-center gap-2">
          <span class="text-xl p-1.5 rounded-xl bg-[#EFE5D3] border border-[#D8C7B0] text-[#3C2C1E]">📲</span>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-[#3C2C1E] font-serif-title">Android 最新正式版 APK</h3>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#EFE5D3] text-[#3C2C1E] border border-[#D8C7B0] font-mono font-bold">
                最新代码打包
              </span>
            </div>
            <p class="text-[11px] text-[#6B5744] mt-0.5">
              已全量打包最新牌桌麦克风对讲、全新自摸结算与掷骰动效
            </p>
          </div>
        </div>
        <button type="button" @click="$emit('close')" class="w-7 h-7 rounded-full bg-[#EFE5D3] hover:bg-[#E5D7C2] border border-[#D8C7B0] flex items-center justify-center text-xs text-[#3C2C1E] transition-colors cursor-pointer">
          ✕
        </button>
      </div>

      <div class="overflow-y-auto flex-1 pr-1 space-y-3">
        <!-- Live Build & Package Info Badge -->
        <div class="p-3 rounded-2xl bg-[#FFFDF8] border border-[#D8C7B0] text-xs space-y-1.5 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-[#6B5744] flex items-center gap-1.5">
              <span>📦 文件名:</span>
              <strong class="font-mono text-emerald-800 font-bold">chess-game-release.apk</strong>
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold">
              {{ apkInfo?.fileSizeMb || '4.50 MB' }} (纯净轻量版)
            </span>
          </div>

          <div class="flex items-center justify-between text-[11px]">
            <span class="text-[#6B5744]">🕒 最新打包时间:</span>
            <span class="font-mono text-[#5C4533] font-bold">{{ apkInfo?.buildInfo?.buildTime || '刚刚已打包覆盖' }}</span>
          </div>

          <div class="flex items-center justify-between text-[10px] pt-1 border-t border-[#D8C7B0]">
            <span class="text-[#6B5744]">🛡️ 网络连接增强:</span>
            <span class="font-mono text-emerald-800 font-bold">明文/HTTPS双通道 · 支持云端与Termux</span>
          </div>
        </div>

        <!-- Download Links -->
        <div class="space-y-2">
          <!-- 线路 1：本站同源极速直链下载 (推荐首选 · 100% 免代理直下 · 永远最新 4.49MB) -->
          <a 
            :href="sameOriginReleaseApkUrl" 
            download="chess-game-release.apk"
            class="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] shadow-lg active:scale-[0.99] transition-all border border-[#7D6049] group"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-base">🚀</span>
              <div class="text-left">
                <div class="text-xs font-bold flex items-center gap-1.5">
                  <span>线路 1：本站同源最新直链</span>
                  <span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-800 text-white font-mono font-bold">100% 免代理 · 4.49 MB</span>
                </div>
                <div class="text-[10px] text-[#FAF4E8]/90 mt-0.5">当前服务器直接分发 · 包含麦克风语音聊天与全部新界面</div>
              </div>
            </div>
            <span class="text-xs font-bold text-[#FAF4E8] group-hover:translate-x-0.5 transition-transform shrink-0">立即下载 ↓</span>
          </a>

          <!-- 线路 2：GHProxy 官方 Release 加速直链 (4.49 MB 官方构建 · 免代理极速) -->
          <a 
            :href="ghproxyReleaseApkUrl" 
            download="chess-game-release.apk"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-between p-2.5 rounded-xl bg-[#FFFDF8] hover:bg-[#FAF4E8] border border-[#D8C7B0] text-xs text-[#3C2C1E] transition-colors group shadow-xs"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm">⚡</span>
              <div class="text-left">
                <div class="font-bold text-[#3C2C1E] flex items-center gap-1.5">
                  <span>线路 2：GHProxy 官方加速直链</span>
                  <span class="text-[9px] px-1 py-0.2 rounded bg-[#EFE5D3] text-[#3C2C1E] font-mono border border-[#D8C7B0]">4.49 MB 官方签名版</span>
                </div>
                <div class="text-[10px] text-[#6B5744]">GitHub 官方构建全量包，国内节点高速直连</div>
              </div>
            </div>
            <span class="text-[11px] text-emerald-800 font-bold group-hover:text-emerald-900">高速下载 →</span>
          </a>

          <!-- 线路 3：KKGitHub 专线镜像 (免代理备用) -->
          <a 
            :href="kkgithubReleaseUrl" 
            download="chess-game-release.apk"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-between p-2.5 rounded-xl bg-[#FFFDF8] hover:bg-[#FAF4E8] border border-[#D8C7B0] text-xs text-[#3C2C1E] transition-colors group shadow-xs"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm">🌐</span>
              <div class="text-left">
                <div class="font-bold text-[#3C2C1E]">线路 3：KKGitHub 专线镜像 (备用)</div>
                <div class="text-[10px] text-[#6B5744]">免代理第三方高速镜像通道，直连 Release 产物</div>
              </div>
            </div>
            <span class="text-[11px] text-[#5C4533] font-bold group-hover:text-[#3C2C1E]">备选下载 →</span>
          </a>

          <!-- 线路 4：GitHub 官方 Release 发布页 -->
          <a 
            :href="releasePageUrl" 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex items-center justify-between p-2.5 rounded-xl bg-[#FFFDF8] hover:bg-[#FAF4E8] border border-[#D8C7B0] text-xs text-[#3C2C1E] transition-colors group shadow-xs"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm">🐙</span>
              <div class="text-left">
                <div class="font-bold text-[#3C2C1E]">线路 4：GitHub 官方 Release 发布页</div>
                <div class="text-[10px] text-[#6B5744]">查看官方 Releases 全部历史版本与编译日志</div>
              </div>
            </div>
            <span class="text-[11px] text-[#6B5744] group-hover:text-[#3C2C1E]">访问发布页 ↗</span>
          </a>
        </div>

        <!-- Installation Tips -->
        <div class="p-2.5 rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] text-[11px] text-[#6B5744] leading-relaxed space-y-1.5 shadow-xs">
          <div class="flex items-start gap-1.5 text-emerald-800 font-medium">
            <span>🛡️</span>
            <span><strong>官方标准签名与对齐认证：</strong>安装包采用标准 Android SDK v1 + v2 + v3 全套签名方案并经过 4 字节严格对齐，支持 Android 8.0 - 15+（小米澎湃OS / MIUI / 华为 / 荣耀 / OPPO / vivo），彻底杜绝“解析软件包时出现问题 (33)”报错！</span>
          </div>
          <div>
            💡 <strong class="text-[#3C2C1E]">麦克风语音聊天说明：</strong>
            最新 4.49 MB 安装包已集成系统底层录音权限声明与 WebView 麦克风适配。首次点击麦克风时系统若弹出授权窗口，请勾选“使用时允许”即可实时畅聊！
          </div>
        </div>

        <!-- Collapsible Debug Version (Only for dev/debug needs) -->
        <div>
          <button
            type="button"
            @click="showDebugSection = !showDebugSection"
            class="text-[10px] text-[#6B5744] hover:text-[#3C2C1E] transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>{{ showDebugSection ? '▼ 收起' : '▶ 需要开发调试？点击查看测试版 (Debug APK)' }}</span>
          </button>
          <div v-if="showDebugSection" class="mt-2 p-2.5 rounded-lg bg-[#FFFDF8] border border-red-300 text-[10px] space-y-1.5">
            <div class="text-red-900 font-bold mb-1 flex items-center justify-between">
              <span>🛠️ 调试测试包 (Debug 版):</span>
              <span class="font-mono text-[#6B5744]">chess-game-debug.apk</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <a
                :href="sameOriginDebugApkUrl"
                download="chess-game-debug.apk"
                class="px-3 py-1 rounded bg-[#5C4533] hover:bg-[#433022] text-[#FAF4E8] font-bold text-[10px]"
              >
                本站同源直下 (免代理) ↓
              </a>
              <a
                :href="rawDebugApkUrl"
                target="_blank"
                class="text-[#5C4533] hover:underline text-[10px] font-bold"
              >
                备用节点下载 →
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <button
        type="button"
        @click="$emit('close')"
        class="w-full py-2.5 text-xs rounded-xl bg-[#FAF4E8] hover:bg-[#EFE5D3] text-[#3C2C1E] font-bold transition-colors border border-[#D8C7B0] mt-3 shrink-0 cursor-pointer"
      >
        返回茶楼大厅
      </button>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { resolveApiUrl } from '../utils/networkConfig';

// 仓库配置 (默认使用 wen775866/yy，可从服务器 API 自动同步)
const repoPath = ref('wen775866/yy');

// 正式版与测试版 APK 文件名
const releaseApkFileName = 'chess-game-release.apk';
const debugApkFileName = 'chess-game-debug.apk';

const apkInfo = ref<any>(null);
const downloadTimestamp = ref(Date.now());

// 1. 本站同源极速直链 (首选 · 100% 免代理 · 同源直接下 · 附带最新时间戳防缓存)
const sameOriginReleaseApkUrl = computed(() => resolveApiUrl(`/api/download/apk?variant=release&t=${downloadTimestamp.value}`));
const sameOriginDebugApkUrl = computed(() => resolveApiUrl(`/api/download/apk?variant=debug&t=${downloadTimestamp.value}`));

// 2. GHProxy Release 加速专线 (已通过 HTTP 200 验证 · 4.49MB 官方构建直链)
const ghproxyReleaseApkUrl = computed(() => `https://ghproxy.net/https://github.com/${repoPath.value}/releases/download/latest-apk/${releaseApkFileName}`);
const ghproxyDebugApkUrl = computed(() => `https://ghproxy.net/https://github.com/${repoPath.value}/releases/download/latest-apk/${debugApkFileName}`);

// 3. KKGitHub 专线镜像 (备用)
const kkgithubReleaseUrl = computed(() => `https://kkgithub.com/${repoPath.value}/releases/download/latest-apk/${releaseApkFileName}`);

// 4. GitMirror 专线镜像 (备用)
const gitmirrorReleaseUrl = computed(() => `https://hub.gitmirror.com/https://github.com/${repoPath.value}/releases/download/latest-apk/${releaseApkFileName}`);

// 5. GitHub 官方原始直链
const githubReleaseApkUrl = computed(() => `https://github.com/${repoPath.value}/releases/download/latest-apk/${releaseApkFileName}`);
const githubDebugApkUrl = computed(() => `https://github.com/${repoPath.value}/releases/download/latest-apk/${debugApkFileName}`);

// 6. GitHub Release 官方发布页面
const releasePageUrl = computed(() => `https://github.com/${repoPath.value}/releases/tag/latest-apk`);

// Debug 兼容旧变量名
const rawReleaseApkUrl = ghproxyReleaseApkUrl;
const rawDebugApkUrl = ghproxyDebugApkUrl;
const repoRawApkUrl = ghproxyReleaseApkUrl;
const gitmirrorRawApkUrl = gitmirrorReleaseUrl;

const showDebugSection = ref(false);

async function fetchApkStatus() {
  try {
    const res = await fetch(resolveApiUrl(`/api/apk/status?t=${Date.now()}`));
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        apkInfo.value = data;
        if (data.repo) {
          repoPath.value = data.repo;
        }
        if (data.buildInfo?.timestamp) {
          downloadTimestamp.value = data.buildInfo.timestamp;
        }
      }
    }
  } catch {}
}



onMounted(() => {
  fetchApkStatus();
});

defineEmits<{ (e: 'close'): void }>();
</script>
