#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# 📱 Android Termux 宿主系统 - 安装 Ubuntu 容器并一键部署国粹棋牌
# 此脚本在【Termux 原生终端】中直接粘贴运行！
# ==============================================================================

set -e

GREEN='\033[0;32m'
AMBER='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${AMBER}==================================================================${NC}"
echo -e "${AMBER}  📱 Android Termux -> 安装 proot-distro Ubuntu 容器向导${NC}"
echo -e "${AMBER}  此方案使用完整 Ubuntu glibc，稳定支持 Vite 编译、PM2 与 TG Bot${NC}"
echo -e "${AMBER}==================================================================${NC}"

# 1. 申请 Termux 唤醒锁，防止息屏掉线
echo -e "\n${CYAN}[1/5] 申请 Android 唤醒锁 (阻止息屏时网络断联与降频)...${NC}"
if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock
  echo -e "${GREEN}  -> 已开启 termux-wake-lock 唤醒守护${NC}"
fi

# 2. 更新 Termux 源并安装 proot-distro
echo -e "\n${CYAN}[2/5] 更新 Termux 基础包并安装 proot-distro...${NC}"
pkg update -y
pkg install -y proot-distro git curl jq

# 3. 安装 Ubuntu 22.04/24.04 容器
echo -e "\n${CYAN}[3/5] 检查并安装 Ubuntu 官方系统镜像 (通过 proot-distro)...${NC}"
if proot-distro list | grep -q "ubuntu (installed)"; then
  echo -e "${GREEN}  -> 检测到 Ubuntu 已安装完成，直接复用${NC}"
else
  echo -e "${AMBER}  -> 正在下载并解压官方 Ubuntu 镜像，请保持网络畅通...${NC}"
  proot-distro install ubuntu
  echo -e "${GREEN}  -> Ubuntu 容器安装成功！${NC}"
fi

# 4. 创建快捷登录与一键启动脚本
echo -e "\n${CYAN}[4/5] 在 Termux 家目录创建一键直达快捷命令...${NC}"
cat << 'EOF' > "$HOME/start_chess.sh"
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock 2>/dev/null || true
echo "正在进入 Ubuntu 容器并启动国粹棋牌全栈服务..."
proot-distro login ubuntu -- bash -c "(cd ~/chess-lobby || cd ~/rust-vue-canvas-game-lobby) && bash deploy_ubuntu.sh"
EOF
chmod +x "$HOME/start_chess.sh"

cat << 'EOF' > "$HOME/enter_ubuntu.sh"
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock 2>/dev/null || true
echo "正在进入 Ubuntu 容器终端..."
proot-distro login ubuntu
EOF
chmod +x "$HOME/enter_ubuntu.sh"

echo -e "${GREEN}  -> 已创建快捷命令:${NC}"
echo -e "     - ${CYAN}~/enter_ubuntu.sh${NC}  (一键进入 Ubuntu 终端)"
echo -e "     - ${CYAN}~/start_chess.sh${NC}   (一键在 Ubuntu 中编译并启动棋牌)"

# 5. 指引用户进入 Ubuntu
echo -e "\n${GREEN}==================================================================${NC}"
echo -e "${GREEN}  🎉 Ubuntu 容器环境已就绪！${NC}"
echo -e "${AMBER}  👉 下一步：请在 Termux 终端输入以下命令进入 Ubuntu：${NC}"
echo -e "${CYAN}     proot-distro login ubuntu${NC}"
echo -e "${AMBER}  进入 Ubuntu 后，执行克隆项目并一键部署：${NC}"
echo -e "${CYAN}     git clone https://github.com/你的用户名/你的仓库名.git${NC}"
echo -e "${CYAN}     cd rust-vue-canvas-game-lobby${NC}"
echo -e "${CYAN}     bash deploy_ubuntu.sh${NC}"
echo -e "${GREEN}==================================================================${NC}"
