#!/usr/bin/env bash
# ==============================================================================
# 🀄 国粹棋牌全功能服务 - Termux Ubuntu (proot-distro) 一键部署与守护脚本
# 适用环境: Android 手机 Termux 内安装的 proot-distro Ubuntu (glibc 环境)
# 包含游戏: 经典烟三、水镜十三张、经典国标麻将
# 包含服务: Node.js/TypeScript 全栈服务 + WebSocket 实时对战网关 + Telegram Bot Webhook
# ==============================================================================

set -e

# 颜色输出定义
GREEN='\033[0;32m'
AMBER='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${AMBER}==================================================================${NC}"
echo -e "${AMBER}  🀄 正在为 Termux proot-distro Ubuntu 部署国粹棋牌服务...${NC}"
echo -e "${AMBER}  拥有完整 GNU glibc 环境，彻底规避 Android Bionic 编译兼容性问题${NC}"
echo -e "${AMBER}==================================================================${NC}"

# 1. 检查是否在 Ubuntu/Debian 体系中
if ! command -v apt-get >/dev/null 2>&1; then
  echo -e "${RED}[错误] 未检测到 apt 包管理器！请确保您已执行 'proot-distro login ubuntu' 进入了 Ubuntu 系统。${NC}"
  exit 1
fi

echo -e "\n${CYAN}[1/7] 更新 Ubuntu 软件源并安装基础编译与网络工具...${NC}"
apt-get update -y
apt-get install -y curl git build-essential pkg-config python3 ca-certificates jq nano iproute2 lsof

# 2. 检查并安装 Node.js LTS (推荐 20.x 或 22.x)
echo -e "\n${CYAN}[2/7] 检查并配置 Node.js 运行时环境...${NC}"
NODE_OK=false
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v | tr -d 'v' | cut -d'.' -f1)
  if [ "$NODE_VER" -ge 18 ]; then
    NODE_OK=true
    echo -e "${GREEN}  -> 检测到已就绪的 Node.js: $(node -v) (满足 >= 18.x 要求)${NC}"
  fi
fi

if [ "$NODE_OK" = false ]; then
  echo -e "${AMBER}  -> 正在通过 NodeSource 官方源极速配置 Node.js 20.x LTS...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  echo -e "${GREEN}  -> Node.js 安装成功: $(node -v), npm: $(npm -v)${NC}"
fi

# 3. 全局安装 PM2 进程守护工具
echo -e "\n${CYAN}[3/7] 配置后台守护工具 PM2...${NC}"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi
echo -e "${GREEN}  -> PM2 进程管理器就绪: $(pm2 -v)${NC}"

# 4. 进入项目目录并安装依赖
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\n${CYAN}[4/7] 清理旧依赖并完整安装 Node.js 依赖 (确保 Rollup ARM64 编译依赖正确)...${NC}"
rm -rf node_modules package-lock.json
npm install --include=optional --no-audit --no-fund

# 5. 编译前端生产静态资源 (Vite + Tailwind CSS v4)
echo -e "\n${CYAN}[5/7] 执行生产环境构建 (npm run build)...${NC}"
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
  npm run build
  echo -e "${GREEN}  -> 前端生产包 dist/ 构建成功${NC}"
else
  echo -e "${GREEN}  -> 检测到 dist/ 生产包已存在，正在增量同步刷新...${NC}"
  npm run build
fi

# 6. 配置 .env 环境变量
echo -e "\n${CYAN}[6/7] 检查并配置环境变量 (.env)...${NC}"
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${GREEN}  -> 已自动从 .env.example 复制生成 .env 基础配置文件${NC}"
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
    echo -e "${GREEN}  -> 已自动创建标准 .env 配置文件 (支持 URL 自动 Webhook / 留空自动长轮询)${NC}"
  fi
  echo -e "${AMBER}  -> 提示: nano .env 填写 TELEGRAM_BOT_TOKEN 即可激活机器人${NC}"
else
  echo -e "${GREEN}  -> 检测到已有 .env 配置文件${NC}"
fi

# 确保 data 目录存在
mkdir -p data
if [ ! -f "data/game_database.json" ]; then
  echo '{"profiles":{},"records":[],"authorizedPhones":[],"adminPhones":[],"revokedPhones":[],"adminLogs":[],"systemAnnouncements":[]}' > data/game_database.json
fi

# 7. 端口检查并启动服务
echo -e "\n${CYAN}[7/7] 检查端口 3000 并通过 PM2 启动常驻对战服务...${NC}"
# 清理可能被占用的 3000 端口
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
  OLD_PID=$(lsof -t -i:3000 2>/dev/null || true)
  if [ -n "$OLD_PID" ]; then
    kill -9 $OLD_PID 2>/dev/null || true
  fi
fi

# 使用 PM2 启动或重启
pm2 delete chess-server 2>/dev/null || true
pm2 start "npx tsx server.ts" --name "chess-server" --max-memory-restart 300M

# 获取手机在局域网的 IP
LAN_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print $7}' || hostname -I | awk '{print $1}')

echo -e "\n${GREEN}==================================================================${NC}"
echo -e "${GREEN}  🎉 棋牌全栈服务在 Termux Ubuntu 中启动成功！${NC}"
echo -e "${GREEN}  📱 手机本机访问:   http://127.0.0.1:3000${NC}"
echo -e "${GREEN}  🏠 局域网好友对战: http://${LAN_IP:-192.168.1.x}:3000${NC}"
echo -e "${GREEN}  ⚡ WebSocket 节点: ws://${LAN_IP:-127.0.0.1}:3000/ws${NC}"
echo -e "${AMBER}  🛠️ 进程管理指令:${NC}"
echo -e "     - 查看实时日志: pm2 logs chess-server"
echo -e "     - 查看运行状态: pm2 status"
echo -e "     - 重启服务:     pm2 restart chess-server"
echo -e "     - 停止服务:     pm2 stop chess-server"
echo -e "${AMBER}  🌐 Telegram 机器人智能调度:${NC}"
echo -e "     - 若在 .env 中设置了 URL=https://... : 启动时【自动注册 Webhook】"
echo -e "     - 若在 .env 中留空 URL : 启动时【自动启动长轮询 (Long Polling)】，无需公网域名"
echo -e "     - 编辑配置: nano .env 后执行: pm2 restart chess-server"
echo -e "${GREEN}==================================================================${NC}"
