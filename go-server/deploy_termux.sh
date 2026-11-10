#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# 🀄 国粹棋牌 - Android Termux Go 高性能服务端一键编译与常驻守护脚本
# 架构: Go 1.21+ (标准库原生协程 + 高性能 WebSocket) + Vue 3 + HTML5 Canvas
# 核心优势: 秒级编译、零 CGO 依赖、超轻内存、升级极为简单、单静态二进制
# ==============================================================================

set -e

GREEN='\033[0;32m'
AMBER='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${AMBER}==================================================================${NC}"
echo -e "${AMBER}  🀄 正在为 Android Termux 部署 Go 高性能棋牌服务...${NC}"
echo -e "${AMBER}  摒弃繁重的 Rust/LLVM 工具链，全面采用 Go 语言原生协程极速引擎${NC}"
echo -e "${AMBER}==================================================================${NC}"

# 1. 配置 Termux 软件源并安装 Go 与 Node.js
echo -e "\n${CYAN}[1/6] 正在配置 Termux 环境并安装 Go (Golang) 构建工具链...${NC}"
pkg update -y
pkg install -y golang nodejs-lts git tmux termux-api jq

# 2. 申请 Android 后台唤醒锁
echo -e "\n${CYAN}[2/6] 申请 Android 唤醒锁 (阻止息屏时 WebSocket 掉线与降频)...${NC}"
if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock
  echo -e "${GREEN}  -> 已开启 termux-wake-lock 唤醒守护${NC}"
fi

echo -e "${AMBER}  -> 提示: 请在 Android 系统设置中将 Termux 应用电池策略设置为【无限制】避免锁屏被系统杀后台${NC}"

# 3. 编译前端 Vue 3 + Canvas 产物
echo -e "\n${CYAN}[3/6] 检查并构建前端 Vue 3 + Canvas 静态资源...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PARENT_DIR"
if [ ! -d "node_modules" ]; then
  npm install --no-audit --no-fund
fi
npm run build

# 4. 极速编译 Go 服务端 (通常仅需 2~3 秒即可完成！)
echo -e "\n${CYAN}[4/6] 极速编译 Go 服务端 (Release 单文件独立可执行程序)...${NC}"
cd "$SCRIPT_DIR"
# 裁剪符号表与调试信息，生成极小体积与超高性能原生二进制
go build -ldflags="-s -w" -o mingju-go-server main.go
echo -e "${GREEN}  -> Go 二进制编译成功: mingju-go-server (体积轻盈，运行飞快)${NC}"

# 同步前端产物与数据目录
mkdir -p dist data
if [ -d "$PARENT_DIR/dist" ]; then
  cp -r "$PARENT_DIR/dist/"* ./dist/ 2>/dev/null || true
fi
if [ -f "$PARENT_DIR/data/game_database.json" ]; then
  cp -n "$PARENT_DIR/data/game_database.json" ./data/game_database.json 2>/dev/null || true
fi

# 5. 检查并释放 3000 端口
echo -e "\n${CYAN}[5/6] 检查端口 3000 并配置 Termux:Boot 开机自启守护...${NC}"
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
  OLD_PID=$(lsof -t -i:3000 2>/dev/null || true)
  if [ -n "$OLD_PID" ]; then
    kill -9 $OLD_PID 2>/dev/null || true
  fi
fi

# 配置 Termux:Boot 开机自动常驻守护脚本
BOOT_DIR="$HOME/.termux/boot"
if [ -d "$BOOT_DIR" ] || command -v termux-wake-lock >/dev/null 2>&1; then
  mkdir -p "$BOOT_DIR"
  cat << 'BOOT_EOF' > "$BOOT_DIR/start-chess-go.sh"
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock 2>/dev/null || true
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
CHESS_DIR="$HOME/go-chess-lobby/go-server"
if [ ! -d "$CHESS_DIR" ]; then
  CHESS_DIR="$HOME/rust-vue-canvas-game-lobby/go-server"
fi
if [ -d "$CHESS_DIR" ]; then
  cd "$CHESS_DIR"
  ./mingju-go-server >/dev/null 2>&1 &
fi
BOOT_EOF
  chmod +x "$BOOT_DIR/start-chess-go.sh"
  echo -e "${GREEN}  -> 已就绪 Termux:Boot 开机自启守护: ~/.termux/boot/start-chess-go.sh${NC}"
fi

# 6. 获取局域网 IP 并启动 Go 服务
LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' || ifconfig 2>/dev/null | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)

echo -e "\n${GREEN}==================================================================${NC}"
echo -e "${GREEN}  🎉 棋牌大厅在 Android Termux 启动成功！(Go 高性能权威状态机已载入)${NC}"
echo -e "${GREEN}  📱 本机访问地址:   http://127.0.0.1:3000${NC}"
echo -e "${GREEN}  🏠 局域网对局地址: http://${LAN_IP:-192.168.1.x}:3000${NC}"
echo -e "${GREEN}  ⚡ WebSocket 端点: ws://${LAN_IP:-127.0.0.1}:3000/ws${NC}"
echo -e "${AMBER}  🚀 维护与升级优势:${NC}"
echo -e "     - 修改 Go 源码后，输入 'go build -o mingju-go-server main.go' 2秒内即可完成升级！"
echo -e "     - 锁屏长效对战: 使用 'tmux new -s chess' 并在其中运行服务"
echo -e "     - 开机自启: 安装 Termux:Boot 插件后，手机重启将自动在后台拉起 Go 棋牌服务"
echo -e "${GREEN}==================================================================${NC}\n"

./mingju-go-server
