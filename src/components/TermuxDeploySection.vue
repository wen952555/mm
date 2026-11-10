<template>
  <Teleport to="body" v-if="props.isModal">
    <div class="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div class="w-[96vw] max-w-5xl max-h-[92dvh] flex flex-col rounded-3xl bg-[#1C1815] border border-amber-500/30 p-3 sm:p-5 shadow-2xl overflow-hidden text-[#F5EFE6]">
      <div class="flex items-center justify-between pb-2.5 border-b border-[#2E2722] shrink-0 mb-3">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl p-1.5 rounded-xl bg-[#26201B] border border-[#3A3029] shrink-0">📱</span>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-[#F5EFE6] font-serif-title flex items-center gap-2">
              Android Termux (Ubuntu 容器) 部署与守护
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-600/30 text-amber-300 border border-amber-500/40 font-mono">
                Ubuntu glibc + PM2
              </span>
            </h3>
            <p class="text-[11px] text-[#A89887]">
              架构：Ubuntu Linux aarch64 (glibc) · WS延迟：{{ wsRtt }}ms · 状态：{{ wsConnected ? '已连通' : '重连中' }}
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="$emit('close')"
          class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-[#B8A99A] hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div class="flex-1 overflow-y-auto pr-1 space-y-4">
        <!-- 3 Tech Highlights -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="p-3 rounded-xl bg-[#14110F] border border-[#2E2722]">
            <div class="text-amber-400 font-semibold text-xs mb-1">
              1. proot-distro Ubuntu 纯正 glibc 环境
            </div>
            <p class="text-[11px] text-[#B8A99A] leading-relaxed">
              彻底告别 Android Bionic libc 引起的 Vite/esbuild 编译段错误，享受完整 APT 生态与现代 Node.js 20+ LTS 运行时。
            </p>
          </div>

          <div class="p-3 rounded-xl bg-[#14110F] border border-[#2E2722]">
            <div class="text-amber-400 font-semibold text-xs mb-1">
              2. termux-wake-lock 唤醒锁与 PM2 守护
            </div>
            <p class="text-[11px] text-[#B8A99A] leading-relaxed">
              Termux 唤醒锁保证手机息屏时 CPU 满频调度，Ubuntu 内部由 PM2 负责 24 小时进程常驻与故障秒级自愈拉起。
            </p>
          </div>

          <div class="p-3 rounded-xl bg-[#14110F] border border-[#2E2722]">
            <div class="text-amber-400 font-semibold text-xs mb-1">
              3. Telegram Webhook / 轮询智能调度
            </div>
            <p class="text-[11px] text-[#B8A99A] leading-relaxed">
              .env 配置 URL 自动注册 Webhook，或留空自动以长轮询 (Long Polling) 极速启动，无需公网域名亦可秒收 Bot 控盘指令。
            </p>
          </div>
        </div>

        <!-- Code Viewer & WS Frames Split -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div class="lg:col-span-8 rounded-xl bg-[#14110F] border border-[#2E2722] flex flex-col overflow-hidden">
            <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#211C18] border-b border-[#2E2722]">
              <div class="flex items-center gap-1 p-0.5 bg-[#14110F] rounded-lg">
                <button
                  type="button"
                  @click="activeTab = 'ubuntu'"
                  :class="activeTab === 'ubuntu' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  deploy_ubuntu.sh (Ubuntu一键部署)
                </button>
                <button
                  type="button"
                  @click="activeTab = 'termux'"
                  :class="activeTab === 'termux' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  termux_install_ubuntu.sh (Termux装Ubuntu)
                </button>
                <button
                  type="button"
                  @click="activeTab = 'goserver'"
                  :class="activeTab === 'goserver' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  main.go (Go高并发服务)
                </button>
                <button
                  type="button"
                  @click="activeTab = 'godeploy'"
                  :class="activeTab === 'godeploy' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  deploy_termux.sh (Go秒级编译)
                </button>
                <button
                  type="button"
                  @click="activeTab = 'server'"
                  :class="activeTab === 'server' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  server.ts (全栈Node+WS服务)
                </button>
                <button
                  type="button"
                  @click="activeTab = 'apk'"
                  :class="activeTab === 'apk' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  build-apk.yml (APK自动打包)
                </button>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="copyCode"
                  class="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#2C2520] hover:bg-[#382F29] text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0"
                >
                  {{ copied ? '已复制到剪贴板' : '复制当前源码' }}
                </button>
                <button
                  type="button"
                  @click="downloadCode"
                  class="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#2C2520] hover:bg-[#382F29] text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0"
                >
                  下载文件
                </button>
              </div>
            </div>

            <pre class="p-3 text-[11px] font-mono text-[#E6DEC8] overflow-x-auto max-h-[300px] leading-relaxed"><code>{{ currentCode }}</code></pre>
          </div>

          <!-- Right: Quick Termux Command & Frame logs -->
          <div class="lg:col-span-4 rounded-xl bg-[#14110F] border border-[#2E2722] p-3 flex flex-col justify-between">
            <div>
              <h4 class="text-xs font-bold text-[#F5EFE6] mb-1">
                Termux 安装 Ubuntu 极速指令
              </h4>
              <p class="text-[10px] text-[#B8A99A] mb-2">
                在安卓 Termux 粘贴执行下列命令，一键安装并登入 Ubuntu 容器：
              </p>
              <div class="p-2 rounded-lg bg-[#12100E] border border-[#2E2722] font-mono text-[10px] text-amber-300 mb-3 flex items-center justify-between gap-1">
                <span class="truncate">proot-distro login ubuntu</span>
                <button
                  type="button"
                  @click="copyCommand"
                  class="px-2 py-0.5 rounded bg-[#26211D] text-[#E6DEC8] hover:text-white text-[10px] whitespace-nowrap shrink-0"
                >
                  {{ cmdCopied ? '已复制' : '复制安装命令' }}
                </button>
              </div>

              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[11px] font-semibold text-[#E6DEC8]">
                  WS 报文监控 ({{ wsConnected ? '已连通 /ws' : '重连中' }})
                </span>
                <button
                  type="button"
                  @click="$emit('ping')"
                  class="px-2 py-0.5 text-[10px] font-medium rounded bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition-colors whitespace-nowrap shrink-0"
                >
                  Ping 测速
                </button>
              </div>

              <div class="space-y-1 max-h-[160px] overflow-y-auto pr-1 font-mono text-[10px]">
                <div
                  v-for="pkt in packetLogs"
                  :key="pkt.id"
                  class="px-2 py-1 rounded bg-[#1C1815] border border-[#2A231E] flex items-center justify-between gap-1.5"
                >
                  <span :class="pkt.dir === 'OUT' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'">
                    [{{ pkt.dir }}]
                  </span>
                  <span class="text-[#D6C7B2] truncate flex-1">{{ pkt.summary }}</span>
                  <span class="text-[#8C7A6B] tabular-nums shrink-0">{{ pkt.ts }}</span>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-[#2E2722] flex items-center justify-between text-[10px] text-[#8C7A6B]">
              <span>服务端口：0.0.0.0:3000</span>
              <button
                type="button"
                @click="$emit('close')"
                class="px-3 py-1 text-xs rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors cursor-pointer"
              >
                完成返回
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</Teleport>

  <section v-else id="termux-deploy" class="w-full py-10 border-t border-[#2E2722]">
    <div class="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div>
        <p class="text-xs text-amber-400/90 mb-1">
          03. Android Termux (Ubuntu 容器) 部署与高性能守护
        </p>
        <h2 class="text-2xl sm:text-3xl font-bold text-[#F5EFE6] font-serif-title">
          proot-distro Ubuntu + Node.js 20 LTS + PM2 守护与一键脚本
        </h2>
        <p class="text-sm text-[#B8A99A] mt-1 max-w-2xl">
          针对安卓手机调优：在 Termux 内安装官方 Ubuntu 容器，获得 100% 纯正 GNU glibc 运行环境，彻底解决 Vite 编译段错误与依赖报错，结合 PM2 与 termux-wake-lock 实现 24 小时锁屏常驻守护。
        </p>
      </div>

      <div class="flex items-center gap-3 text-xs text-[#D6C7B2] tabular-nums">
        <span>容器环境：Ubuntu Linux aarch64 (glibc)</span>
        <span aria-hidden="true">·</span>
        <span>WS 延迟：{{ wsRtt }} ms</span>
        <span aria-hidden="true">·</span>
        <span>连接：{{ wsConnected ? '已连通' : '重连中' }}</span>
      </div>
    </div>

    <!-- 3 Tech Highlights -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      <div class="p-5 rounded-xl bg-[#1C1815] border border-[#2E2722]">
        <div class="text-amber-400 font-semibold text-sm mb-2">
          1. proot-distro Ubuntu 纯正 glibc 环境
        </div>
        <p class="text-xs text-[#B8A99A] leading-relaxed">
          彻底告别 Android Bionic libc 导致的 Vite/esbuild 编译段错误，享受完整 APT 生态与现代 Node.js 20+ LTS 运行时。
        </p>
      </div>

      <div class="p-5 rounded-xl bg-[#1C1815] border border-[#2E2722]">
        <div class="text-amber-400 font-semibold text-sm mb-2">
          2. termux-wake-lock 唤醒锁与 PM2 守护
        </div>
        <p class="text-xs text-[#B8A99A] leading-relaxed">
          Termux 唤醒锁保证手机息屏时 CPU 满频调度，Ubuntu 内部由 PM2 负责 24 小时进程常驻与故障秒级自愈拉起。
        </p>
      </div>

      <div class="p-5 rounded-xl bg-[#1C1815] border border-[#2E2722]">
        <div class="text-amber-400 font-semibold text-sm mb-2">
          3. Telegram Webhook / 轮询智能调度
        </div>
        <p class="text-xs text-[#B8A99A] leading-relaxed">
          .env 配置 URL 自动注册 Webhook，或留空自动以长轮询 (Long Polling) 极速启动，无需公网域名亦可秒收 Bot 控盘指令。
        </p>
      </div>
    </div>

    <!-- Code Viewer & WS Frames Split -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <div class="lg:col-span-8 rounded-xl bg-[#181412] border border-[#2E2722] flex flex-col overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#211C18] border-b border-[#2E2722]">
          <div class="flex items-center gap-1 p-1 bg-[#14110F] rounded-lg">
            <button
              type="button"
              @click="activeTab = 'ubuntu'"
              :class="activeTab === 'ubuntu' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              deploy_ubuntu.sh (Ubuntu一键部署)
            </button>
            <button
              type="button"
              @click="activeTab = 'termux'"
              :class="activeTab === 'termux' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              termux_install_ubuntu.sh (Termux装Ubuntu)
            </button>
            <button
              type="button"
              @click="activeTab = 'goserver'"
              :class="activeTab === 'goserver' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              main.go (Go高并发服务)
            </button>
            <button
              type="button"
              @click="activeTab = 'godeploy'"
              :class="activeTab === 'godeploy' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              deploy_termux.sh (Go秒级编译)
            </button>
            <button
              type="button"
              @click="activeTab = 'server'"
              :class="activeTab === 'server' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              server.ts (全栈Node+WS服务)
            </button>
            <button
              type="button"
              @click="activeTab = 'apk'"
              :class="activeTab === 'apk' ? 'bg-amber-600 text-white' : 'text-[#B8A99A] hover:text-white'"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              build-apk.yml (APK自动打包)
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="copyCode"
              class="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2C2520] hover:bg-[#382F29] text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0"
            >
              {{ copied ? '已复制到剪贴板' : '复制当前源码' }}
            </button>
            <button
              type="button"
              @click="downloadCode"
              class="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2C2520] hover:bg-[#382F29] text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0"
            >
              下载文件
            </button>
          </div>
        </div>

        <pre class="p-4 text-xs font-mono text-[#E6DEC8] overflow-x-auto max-h-[380px] leading-relaxed"><code>{{ currentCode }}</code></pre>
      </div>

      <!-- Right: Quick Termux Command & Frame logs -->
      <div class="lg:col-span-4 rounded-xl bg-[#1C1815] border border-[#2E2722] p-5 flex flex-col justify-between">
        <div>
          <h3 class="text-base font-bold text-[#F5EFE6] mb-1">
            Termux 安装 Ubuntu 极速指令
          </h3>
          <p class="text-xs text-[#B8A99A] mb-3">
            在安卓 Termux 粘贴执行下列命令，一键安装并登入 Ubuntu 容器：
          </p>
          <div class="p-3 rounded-lg bg-[#12100E] border border-[#2E2722] font-mono text-xs text-amber-300 mb-4 flex items-center justify-between gap-2">
            <span class="truncate">proot-distro login ubuntu</span>
            <button
              type="button"
              @click="copyCommand"
              class="px-2 py-1 rounded bg-[#26211D] text-[#E6DEC8] hover:text-white text-[11px] whitespace-nowrap shrink-0"
            >
              {{ cmdCopied ? '已复制' : '复制安装命令' }}
            </button>
          </div>

          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-[#E6DEC8]">
              WebSocket 报文监控 ({{ wsConnected ? '已连通 /ws' : '重连中' }})
            </span>
            <button
              type="button"
              @click="$emit('ping')"
              class="px-2.5 py-1 text-xs font-medium rounded bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition-colors whitespace-nowrap shrink-0"
            >
              发送 Ping 测速
            </button>
          </div>

          <div class="space-y-1.5 max-h-[210px] overflow-y-auto pr-1 font-mono text-[11px]">
            <div
              v-for="pkt in packetLogs"
              :key="pkt.id"
              class="px-2.5 py-1.5 rounded bg-[#14110F] border border-[#2A231E] flex items-center justify-between gap-2"
            >
              <span :class="pkt.dir === 'OUT' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'">
                [{{ pkt.dir }}]
              </span>
              <span class="text-[#D6C7B2] truncate flex-1">{{ pkt.summary }}</span>
              <span class="text-[#8C7A6B] tabular-nums shrink-0">{{ pkt.ts }}</span>
            </div>
            <div v-if="packetLogs.length === 0" class="text-[#8C7A6B] py-6 text-center">
              等待 WebSocket 对局实时报文...
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-[#2E2722] flex items-center justify-between text-xs text-[#B8A99A] tabular-nums">
          <span>唤醒锁：termux-wake-lock 激活</span>
          <span>服务端口：0.0.0.0:3000</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  wsConnected: boolean;
  wsRtt: number;
  packetLogs: { id: string; dir: 'IN' | 'OUT'; summary: string; ts: string }[];
  isModal?: boolean;
}>();

defineEmits<{
  (e: 'ping'): void;
  (e: 'close'): void;
}>();

const activeTab = ref<'ubuntu' | 'termux' | 'goserver' | 'godeploy' | 'server' | 'apk'>('ubuntu');
const copied = ref(false);
const cmdCopied = ref(false);

const deployScript = `#!/usr/bin/env bash
# ==============================================================================
# 🀄 国粹棋牌全功能服务 - Termux Ubuntu (proot-distro) 一键部署与守护脚本
# 适用环境: Android 手机 Termux 内安装的 proot-distro Ubuntu (glibc 环境)
# 包含游戏: 经典烟三、水镜十三张、经典国标麻将
# 包含服务: Node.js/TypeScript 全栈服务 + WebSocket 实时对战网关 + Telegram Bot Webhook
# ==============================================================================

set -e

echo "=================================================================="
echo "  🀄 正在为 Termux proot-distro Ubuntu 部署国粹棋牌服务..."
echo "  拥有完整 GNU glibc 环境，彻底规避 Android Bionic 编译兼容性问题"
echo "=================================================================="

# 1. 检查是否在 Ubuntu/Debian 体系中
if ! command -v apt-get >/dev/null 2>&1; then
  echo "[错误] 未检测到 apt 包管理器！请确保您已执行 'proot-distro login ubuntu' 进入了 Ubuntu 系统。"
  exit 1
fi

echo "[1/7] 更新 Ubuntu 软件源并安装基础编译与网络工具..."
apt-get update -y
apt-get install -y curl git build-essential pkg-config python3 ca-certificates jq nano iproute2 lsof

# 2. 检查并安装 Node.js LTS (推荐 20.x 或 22.x)
echo "[2/7] 检查并配置 Node.js 运行时环境..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | tr -d 'v' | cut -d'.' -f1)" -lt 18 ]; then
  echo "  -> 正在通过 NodeSource 官方源极速配置 Node.js 20.x LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# 3. 全局安装 PM2 进程守护工具
echo "[3/7] 配置后台守护工具 PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

# 4. 进入项目目录并安装依赖
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[4/7] 清理旧依赖并完整安装 Node.js 依赖 (确保 Rollup ARM64 编译依赖正确)..."
rm -rf node_modules package-lock.json
npm install --include=optional --no-audit --no-fund

# 5. 编译前端生产静态资源 (Vite + Tailwind CSS v4)
echo "[5/7] 执行生产环境构建 (npm run build)..."
npm run build

# 6. 配置 .env 环境变量
echo "[6/7] 检查并配置环境变量 (.env)..."
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    cat << 'EOF' > .env
# 1. 公网访问域名 (填写 HTTPS 域名自动配置 Webhook，留空则自动启动长轮询)
URL=
APP_URL=
BOT_MODE=auto

# 2. Telegram Bot Token 与管理员
TELEGRAM_BOT_TOKEN=
ADMIN_USERNAMES=admin_username
TELEGRAM_WEBHOOK_SECRET=

# 3. 服务端口
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
EOF
  fi
fi

mkdir -p data
if [ ! -f "data/game_database.json" ]; then
  echo '{"users":{},"rooms":{},"accounts":{},"transactions":[]}' > data/game_database.json
fi

# 7. 端口检查并启动服务
echo "[7/7] 检查端口 3000 并通过 PM2 启动常驻对战服务..."
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp 2>/dev/null || true
fi

pm2 delete chess-server 2>/dev/null || true
pm2 start "npx tsx server.ts" --name "chess-server" --max-memory-restart 300M

LAN_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print $7}' || hostname -I | awk '{print $1}')
echo "=================================================================="
echo "  🎉 棋牌全栈服务在 Termux Ubuntu 中启动成功！"
echo "  📱 手机本机访问:   http://127.0.0.1:3000"
echo "  🏠 局域网好友对战: http://\${LAN_IP:-192.168.1.x}:3000"
echo "  ⚡ WebSocket 节点: ws://\${LAN_IP:-127.0.0.1}:3000/ws"
echo "  🛠️ 查看实时日志:   pm2 logs chess-server"
echo "=================================================================="
`;

const termuxInstallScript = `#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# 📱 Android Termux 宿主系统 - 安装 Ubuntu 容器并一键部署国粹棋牌
# 此脚本在【Termux 原生终端】中直接粘贴运行！
# ==============================================================================

set -e

echo "=================================================================="
echo "  📱 Android Termux -> 安装 proot-distro Ubuntu 容器向导"
echo "  此方案使用完整 Ubuntu glibc，稳定支持 Vite 编译、PM2 与 TG Bot"
echo "=================================================================="

# 1. 申请 Termux 唤醒锁，防止息屏掉线
if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock
  echo "  -> 已开启 termux-wake-lock 唤醒守护"
fi

# 2. 更新 Termux 源并安装 proot-distro
pkg update -y
pkg install -y proot-distro git curl jq

# 3. 安装 Ubuntu 官方系统镜像
if proot-distro list | grep -q "ubuntu (installed)"; then
  echo "  -> 检测到 Ubuntu 已安装完成，直接复用"
else
  echo "  -> 正在下载并解压官方 Ubuntu 镜像，请保持网络畅通..."
  proot-distro install ubuntu
  echo "  -> Ubuntu 容器安装成功！"
fi

# 4. 创建快捷登录与一键启动脚本
cat << 'EOF' > "$HOME/start_chess.sh"
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock 2>/dev/null || true
echo "正在进入 Ubuntu 容器并启动国粹棋牌全栈服务..."
proot-distro login ubuntu -- bash -c "cd ~/chess-lobby && bash deploy_ubuntu.sh"
EOF
chmod +x "$HOME/start_chess.sh"

echo "=================================================================="
echo "  🎉 Ubuntu 容器环境已就绪！"
echo "  👉 登录 Ubuntu 指令: proot-distro login ubuntu"
echo "=================================================================="
`;

const serverSource = `import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { loadDatabase, saveDatabase } from './src/serverStorage.ts';
import { handleApiRoute } from './src/serverApi.ts';

// 自动检测并载入 .env 配置 (包括 Telegram Bot Token 等)
dotenv.config();

const app = express();
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// 挂载 API 与 Telegram Webhook 处理
app.use('/api', async (req, res) => {
  await handleApiRoute(req, res, wss);
});

// 静态托管 Vite 构建的前端产物 dist/
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`[Termux Ubuntu Server] 国粹棋牌服务已监听 http://0.0.0.0:\${PORT}\`);
});
`;

const apkWorkflow = `name: Build and Package Android APK

on:
  push:
    branches:
      - main
      - master
    paths-ignore:
      - '**.md'
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: apk-build-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-apk:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Setup Java JDK 21
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'
          cache: 'gradle'

      - name: Accept Android SDK Licenses & Install Android 36 SDK
        run: |
          echo "Using Android SDK at: $ANDROID_HOME"
          yes 2>/dev/null | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses 2>/dev/null || true
          "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platforms;android-36" 2>/dev/null || true

      - name: Install NPM Dependencies
        run: npm install --no-audit --no-fund

      - name: Build Web Application
        run: npm run build

      - name: Ensure Android Native Project and Gradlew Exist
        run: |
          mkdir -p android
          echo "sdk.dir=$ANDROID_HOME" > android/local.properties
          
          if [ ! -f "android/gradlew" ]; then
            echo "android/gradlew not found in repository! Generating android platform via Capacitor..."
            rm -rf android
            npx cap add android
            mkdir -p android
            echo "sdk.dir=$ANDROID_HOME" > android/local.properties
          fi

          # Ensure SDK 36 is configured as required by Capacitor 8 (androidx.activity 1.11.0, androidx.core 1.17.0)
          sed -i 's/compileSdkVersion = 35/compileSdkVersion = 36/g' android/variables.gradle 2>/dev/null || true
          sed -i 's/targetSdkVersion = 35/targetSdkVersion = 36/g' android/variables.gradle 2>/dev/null || true

          # Ensure release APK has debug signing so it can be installed on Android without manual keystore
          if ! grep -q "signingConfig signingConfigs.debug" android/app/build.gradle 2>/dev/null; then
            sed -i '/release {/a \            signingConfig signingConfigs.debug' android/app/build.gradle 2>/dev/null || true
          fi

          # Ensure Java 21 compatibility required by Capacitor 8
          if ! grep -q "JavaVersion.VERSION_21" android/app/build.gradle 2>/dev/null; then
            sed -i '/android {/a \    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_21\n        targetCompatibility JavaVersion.VERSION_21\n    }' android/app/build.gradle 2>/dev/null || true
          fi

      - name: Sync Capacitor Android Project
        run: npx cap sync android

      - name: Make Gradlew Executable
        run: chmod +x android/gradlew || true

      - name: Build Android APK (Release & Debug)
        run: |
          cd android
          ./gradlew assembleRelease assembleDebug --no-daemon --stacktrace

      - name: Prepare APK Output Directory
        id: vars
        run: |
          mkdir -p release-apks
          if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
            cp android/app/build/outputs/apk/release/app-release.apk release-apks/chess-game-release.apk
          elif [ -f "android/app/build/outputs/apk/release/app-release-unsigned.apk" ]; then
            cp android/app/build/outputs/apk/release/app-release-unsigned.apk release-apks/chess-game-release.apk
          fi
          if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
            cp android/app/build/outputs/apk/debug/app-debug.apk release-apks/chess-game-debug.apk
          fi
          if [ ! -f "release-apks/chess-game-release.apk" ] && [ -f "release-apks/chess-game-debug.apk" ]; then
            cp release-apks/chess-game-debug.apk release-apks/chess-game-release.apk
          fi
          echo "build_time=\$(date -u '+%Y-%m-%d %H:%M:%S UTC')" >> \$GITHUB_OUTPUT
          echo "short_sha=\$(git rev-parse --short HEAD)" >> \$GITHUB_OUTPUT

      - name: Upload APKs to GitHub Actions Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: chess-game-apk
          path: release-apks/*.apk
          overwrite: true
          retention-days: 30

      - name: Update Latest Git Tag
        continue-on-error: true
        run: |
          git tag -f latest-apk
          git push -f origin latest-apk || true

      - name: Publish and Overwrite Latest APK in GitHub Releases
        uses: softprops/action-gh-release@v2
        continue-on-error: true
        with:
          tag_name: latest-apk
          target_commitish: \${{ github.sha }}
          name: "五大经典国粹棋牌 - 最新打包 APK (Auto Build)"
          body: |
            🎮 **五大经典国粹棋牌 Android APK 最新安装包**

            - 🚀 **自动覆盖机制**：仓库代码有任何更新并推送，本 Release 中的旧 APK 会被自动重新构建并覆盖替换为最新版本。
            - 🕒 **最新构建时间**：\${{ steps.vars.outputs.build_time }}
            - 🔖 **Git 提交版本**：\`\${{ steps.vars.outputs.short_sha }}\`

            ---

            ### 🇨🇳 国内极速加速下载通道 (免代理·高速直链，推荐国内网络使用)
            - 🚀 **[极速线路 1 (GHProxy 专线)]**：
              [点击直接高速下载 chess-game-release.apk](https://ghproxy.net/https://github.com/\${{ github.repository }}/releases/download/latest-apk/chess-game-release.apk)
            - ⚡️ **[高速线路 2 (GitMirror 专线)]**：
              [点击直接高速下载 chess-game-release.apk](https://hub.gitmirror.com/https://github.com/\${{ github.repository }}/releases/download/latest-apk/chess-game-release.apk)
            - 🌐 **[镜像线路 3 (KKGitHub 节点)]**：
              [点击前往 KKGitHub 镜像下载](https://kkgithub.com/\${{ github.repository }}/releases/download/latest-apk/chess-game-release.apk)
            - 📦 **[仓库 Raw 文件加速直链]**：
              [点击高速下载仓库 app-latest.apk](https://ghproxy.net/https://raw.githubusercontent.com/\${{ github.repository }}/main/apk/app-latest.apk)

            ---

            ### 🌍 GitHub 官方原始下载通道
            - ⭐️ **[推荐] 正式安装版 (Release APK)**：
              [点击下载 chess-game-release.apk](https://github.com/\${{ github.repository }}/releases/download/latest-apk/chess-game-release.apk)
            - 🛠️ **调试测试版 (Debug APK)**：
              [点击下载 chess-game-debug.apk](https://github.com/\${{ github.repository }}/releases/download/latest-apk/chess-game-debug.apk)

            > 💡 **安卓安装说明**：手机浏览器下载完成后点击安装，如遇系统提示“允许来自此来源的应用”或“允许未知应用安装”，勾选允许即可安全畅玩！
          draft: false
          prerelease: false
          make_latest: true
          files: |
            release-apks/chess-game-release.apk
            release-apks/chess-game-debug.apk

      - name: Auto-Commit & Overwrite APK in Repository
        continue-on-error: true
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          mkdir -p apk dist public
          cp release-apks/chess-game-release.apk apk/app-latest.apk
          cp release-apks/chess-game-release.apk apk/chess-game-release.apk
          cp release-apks/chess-game-debug.apk apk/chess-game-debug.apk
          cp release-apks/chess-game-release.apk dist/chess-game-release.apk
          cp release-apks/chess-game-release.apk dist/app-latest.apk
          cp release-apks/chess-game-release.apk public/chess-game-release.apk
          cp release-apks/chess-game-release.apk public/app-latest.apk
          git add -f apk/*.apk dist/*.apk public/*.apk
          if git diff --staged --quiet; then
            echo "No change in binary apk file."
          else
            git commit -m "chore(apk): auto-update release APK in dist and apk [skip ci]"
            git push origin HEAD:\${{ github.ref_name }} || echo "Push skipped or branch protected"
          fi
`;

const goDeployScript = `#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# 🀄 国粹棋牌 - Android Termux Go 高性能服务端一键编译与常驻守护脚本
# 架构: Go 1.21+ (标准库原生协程 + 高性能 WebSocket) + Vue 3 + HTML5 Canvas
# 核心优势: 秒级编译、零 CGO 依赖、超轻内存、升级极为简单、单静态二进制
# ==============================================================================

set -e

echo "[1/4] 配置 Termux 环境并安装 Go (Golang)..."
pkg update -y && pkg install -y golang nodejs-lts git tmux termux-api

echo "[2/4] 编译前端 Vue 3 + Canvas 生产产物..."
npm install --no-audit --no-fund
npm run build

echo "[3/4] 极速编译 Go 服务端 (Release 单文件独立可执行程序)..."
cd go-server
go build -ldflags="-s -w" -o mingju-go-server main.go

echo "[4/4] 释放 3000 端口并拉起 Go 棋牌权威服务..."
fuser -k 3000/tcp 2>/dev/null || true
./mingju-go-server
`;

const goServerSource = `package main

import (
	"bufio"
	"crypto/sha1"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// Go 权威对战引擎 (Go-Authoritative WebSocket Hub)
func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	hub := newHub()
	go hub.run()

	handler := setupRoutes(hub, "dist")
	addr := fmt.Sprintf("0.0.0.0:%s", port)
	fmt.Printf("🀄 国粹棋牌 Go 服务端已启动: http://%s (ws://%s/ws)\\n", addr, addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}
`;

const currentCode = computed(() => {
  if (activeTab.value === 'ubuntu') return deployScript;
  if (activeTab.value === 'termux') return termuxInstallScript;
  if (activeTab.value === 'goserver') return goServerSource;
  if (activeTab.value === 'godeploy') return goDeployScript;
  if (activeTab.value === 'server') return serverSource;
  return apkWorkflow;
});

function copyCode() {
  navigator.clipboard?.writeText(currentCode.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

function copyCommand() {
  navigator.clipboard?.writeText('pkg install proot-distro -y && proot-distro install ubuntu && proot-distro login ubuntu');
  cmdCopied.value = true;
  setTimeout(() => (cmdCopied.value = false), 2000);
}

function downloadCode() {
  let filename = 'deploy_ubuntu.sh';
  if (activeTab.value === 'ubuntu') filename = 'deploy_ubuntu.sh';
  else if (activeTab.value === 'termux') filename = 'termux_install_ubuntu.sh';
  else if (activeTab.value === 'goserver') filename = 'main.go';
  else if (activeTab.value === 'godeploy') filename = 'deploy_termux.sh';
  else if (activeTab.value === 'server') filename = 'server.ts';
  else if (activeTab.value === 'apk') filename = 'build-apk.yml';
  const blob = new Blob([currentCode.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
</script>
