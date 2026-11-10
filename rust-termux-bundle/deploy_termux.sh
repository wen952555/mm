#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# 🀄 国粹棋牌 - Android Termux 一键启动入口 (已全面迁移至 Go 语言引擎)
# 原 Rust 语言工具链因编译繁重、维护升级成本高，现已全面重构升级为 Go (Golang)
# 本脚本自动调用全新的 Go 部署脚本，保障历史路径完全兼容！
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🀄 检测到启动请求，正在使用全新构建的 Go (Golang) 高性能服务端..."
if [ -f "$PARENT_DIR/go-server/deploy_termux.sh" ]; then
  bash "$PARENT_DIR/go-server/deploy_termux.sh"
else
  echo "[错误] 未找到 go-server/deploy_termux.sh"
  exit 1
fi
