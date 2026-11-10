#!/usr/bin/env bash
# ==============================================================================
# 🀄 国粹棋牌 - Go Embed 单文件单体全栈极速构建脚本
# 原理: 通过 //go:embed all:dist 将前端 Vue 3 + Canvas + 音效直接打包进单 Go 二进制
# 成果: 生成单个独立二进制可执行程序，目标手机或服务器无需安装 Node.js、无需 npm！
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=================================================================="
echo "  🀄 开始打包 Go 单体全栈独立二进制 (Single-Binary Fullstack)..."
echo "=================================================================="

# 1. 确保前端静态包是最新的
cd "$ROOT_DIR"
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
  echo "[1/3] 正在使用 Vite 编译最新前端静态资源..."
  npm run build
fi

# 2. 同步 dist 至 go-server 内准备进行 //go:embed 嵌入
echo "[2/3] 同步前端资源到 go-server/dist..."
mkdir -p "$SCRIPT_DIR/dist"
cp -r "$ROOT_DIR/dist/"* "$SCRIPT_DIR/dist/"

# 3. 检查 Go 环境并编译
cd "$SCRIPT_DIR"
if ! command -v go >/dev/null 2>&1; then
  echo "[提示] 当前环境未安装 Go 编译器 (golang)。"
  echo "       在 Android Termux 请执行: pkg install -y golang"
  echo "       在 Ubuntu/Debian 请执行: apt install -y golang 或 snap install --classic go"
  echo "       在 Mac 请执行: brew install go"
  echo "       安装完成后重新执行本脚本即可瞬间输出单二进制！"
  exit 0
fi

echo "[3/3] 极速编译单一可执行文件 (裁剪调试符号减小体积)..."

# 1. 编译当前平台原生单二进制
CGO_ENABLED=0 go build -ldflags="-s -w" -o mingju-single-app main.go

# 2. 若传入 all 参数，则同时输出 Android Termux ARM64 与 x86_64 云服务器通用二进制
if [ "$1" = "all" ] || [ "$1" = "--all" ]; then
  echo "  -> 正在交叉编译 Android Termux ARM64 单二进制..."
  CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o mingju-single-app-arm64 main.go
  echo "  -> 正在交叉编译 Linux x86_64 云服务器单二进制..."
  CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o mingju-single-app-amd64 main.go
  echo "  -> 正在交叉编译 Windows x86_64 单二进制..."
  CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o mingju-single-app.exe main.go
fi

echo "=================================================================="
echo "  🎉 单体全栈二进制打包完成！"
echo "  📁 输出文件: $SCRIPT_DIR/mingju-single-app"
if [ -f "$SCRIPT_DIR/mingju-single-app-arm64" ]; then
  echo "  📱 安卓/ARM64 专版: $SCRIPT_DIR/mingju-single-app-arm64"
  echo "  ☁️  云服务器 x86 专版: $SCRIPT_DIR/mingju-single-app-amd64"
fi
echo "  🚀 部署特性:"
echo "     1. 彻底摆脱 Node.js、npm、pm2 运行时依赖！"
echo "     2. 只需要复制 mingju-single-app 一个文件到任意设备即可运行！"
echo "     3. 手机 Termux 运行: ./mingju-single-app 即可瞬间拉起游戏"
echo "=================================================================="
