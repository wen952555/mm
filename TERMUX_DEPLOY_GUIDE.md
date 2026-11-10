# 📱 Android Termux 安装 Ubuntu 容器并部署国粹棋牌与 Telegram 机器人全流程实战指南
# (Complete Guide: Deploying in Termux proot-distro Ubuntu & Telegram Bot Setup)

> ⭐️ **核心架构优势**：
> 传统的在 Android Termux 原生环境下直接编译重型工具链（如 Rust），常因手机 CPU 算力限制、Bionic libc 兼容性或 clang 内存溢出导致耗时数十分钟甚至崩溃。
> 本项目全新构建提供 **Go (Golang) 原生高性能对战服务端 (`go-server/`)** 与 **Termux + Ubuntu 容器全栈方案**：
> 1. **Go 原生方案**：Termux 原生直接支持 (`pkg install golang`)，2秒瞬间完成编译，单静态二进制极速执行，内存占用极低，极易维护升级；
> 2. **Ubuntu 容器方案**：通过 `proot-distro Ubuntu` 获得 100% 纯正 GNU/Linux glibc 环境，标准 `apt`、Node.js 20+ LTS、PM2 常驻守护及 Cloudflare Tunnel 完美原生运行。

---

## 目录
1. [一、 方案架构与核心原理](#一-方案架构与核心原理)
2. [二、 前期准备：工具与环境](#二-前期准备工具与环境)
3. [三、 第一步：在本地/云端将项目源码推送到 GitHub](#三-第一步在本地云端将项目源码推送到-github)
4. [四、 第二步：手机 Termux 安装 proot-distro 与 Ubuntu 容器](#四-第二步手机-termux-安装-proot-distro-与-ubuntu-容器)
5. [五、 第三步：在 Ubuntu 中配置 Node.js 并拉取项目代码](#五-第三步在-ubuntu-中配置-nodejs-并拉取项目代码)
6. [六、 第四步：一键构建前端与启动全栈对战服务](#六-第四步一键构建前端与启动全栈对战服务)
7. [七、 第五步：创建 Telegram 机器人与配置 .env 密钥](#七-第五步创建-telegram-机器人与配置-env-密钥)
8. [八、 第六步：在 Ubuntu 中配置公网 HTTPS 穿透 (Cloudflare Tunnel)](#八-第六步在-ubuntu-中配置公网-https-穿透-cloudflare-tunnel)
9. [九、 第七步：设置 Webhook 并启动 Telegram 机器人远程控分](#九-第七步设置-webhook-并启动-telegram-机器人远程控分)
10. [十、 第八步：PM2 进程常驻守护与开机自启 (24小时不掉线)](#十-第八步pm2-进程常驻守护与开机自启-24小时不掉线)
11. [十一、 第九步：Telegram Bot 控盘指令实战操作](#十一-第九步telegram-bot-控盘指令实战操作)
12. [十二、 常见问题排查与避坑指南 (FAQ)](#十二-常见问题排查与避坑指南-faq)

---

## 一、 方案架构与核心原理

```
+-------------------------------------------------------------------+
| Android 手机底层 (Linux Kernel + 电池策略无限制 + termux-wake-lock) |
+-------------------------------------------------------------------+
                                  │
                                  ▼
             +────────────────────────────────────────+
             |         Termux 终端宿主环境            |
             |   (安装 proot-distro, termux-api)       |
             +────────────────────────────────────────+
                                  │  proot-distro login ubuntu
                                  ▼
             +────────────────────────────────────────+
             |       Ubuntu 22.04 / 24.04 容器        |
             |   (完整 GNU glibc + 标准 APT 软件包)   |
             +────────────────────────────────────────+
                │                 │                │
                ▼                 ▼                ▼
       +────────────────+ +───────────────+ +──────────────+
       | Node.js 20 LTS | | PM2 进程守护  | | cloudflared  |
       | Express + WS   | | (后台无死角)  | | (HTTPS穿透)  |
       +────────────────+ +───────────────+ +──────────────+
                │                                  │
                ▼                                  ▼
   手机本机/局域网对战 (3000端口)       Telegram Webhook 机器人管理
```

---

## 二、 前期准备：工具与环境

### 1. Termux 应用获取
- **切勿使用 Google Play 商店的 Termux**（已停止维护，源已失效）。
- 请从 **F-Droid** 或 **GitHub Releases** 下载最新安装包：
  - [F-Droid Termux 下载](https://f-droid.org/packages/com.termux/)
  - [Termux 官方 GitHub Releases](https://github.com/termux/termux-app/releases)

### 2. 准备账号
- **GitHub 账号**：用于克隆或同步项目代码。
- **Telegram 账号**：用于在 `@BotFather` 处创建管理机器人，远程增减玩家积分、查账和踢人。

---

## 三、 第一步：在本地/云端将项目源码推送到 GitHub

在您当前开发完成的环境中，确保全部改动已提交并推送到 GitHub 仓库：

```bash
# 1. 确保在项目根目录
git status

# 2. 提交全部优化代码 (包括 Ubuntu 部署脚本与前端)
git add .
git commit -m "feat: complete ubuntu termux deployment and point management"

# 3. 推送至 GitHub 主分支
git push origin main
```

---

## 四、 第二步：手机 Termux 安装 proot-distro 与 Ubuntu 容器

打开手机上的 **Termux** 应用，按顺序输入以下指令：

### 1. 开启手机后台唤醒锁（防止锁屏降频）
```bash
termux-wake-lock
```
> 💡 **提示**：建议在 Android 系统设置 -> 应用管理 -> Termux -> **电池用量** 设置为 **“无限制”** 或 **“允许后台高耗电”**。

### 2. 更新 Termux 并安装 proot-distro
```bash
pkg update -y && pkg install -y proot-distro git curl jq nano
```

### 3. 安装官方 Ubuntu 容器
```bash
proot-distro install ubuntu
```
等待安装解压完成（通常仅需 1~2 分钟），终端出现安装成功提示。

### 4. 登录进入 Ubuntu 系统
```bash
proot-distro login ubuntu
```
输入后，命令提示符将变为：
```bash
root@localhost:~#
```
这代表您已经进入了**拥有完整 GNU glibc 的 Ubuntu 系统**！

---

## 五、 第三步：在 Ubuntu 中配置 Node.js 并拉取项目代码

此时您在 Ubuntu 终端内（`root@localhost`），依次执行：

### 1. 更新 Ubuntu 源并安装 Node.js LTS
```bash
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git build-essential python3 ca-certificates jq nano iproute2 lsof

# 安装 Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 全局安装 PM2 进程守护管理器
npm install -g pm2
```

验证安装：
```bash
node -v   # 输出 v20.x.x
npm -v    # 输出 10.x.x
pm2 -v    # 输出 5.x.x
```

### 2. 克隆项目仓库
```bash
cd ~
git clone https://github.com/你的GitHub用户名/你的仓库名.git chess-lobby
cd chess-lobby
```

---

## 六、 第四步：一键构建前端与启动全栈对战服务

本项目已为您内置专属的 `deploy_ubuntu.sh` 一键构建脚本！在 Ubuntu 终端的 `~/chess-lobby` 目录下直接执行：

```bash
bash deploy_ubuntu.sh
```

该脚本会自动执行：
1. `npm install` 自动安装完整依赖；
2. `npm run build` 借助 Ubuntu 的标准 glibc 完成 Vite 极速打包，输出 `dist/`；
3. 检查 `.env`，若不存在则自动生成标准配置；
4. 释放 3000 端口并使用 `pm2 start` 在后台拉起服务。

执行完成后，终端会显示：
```
==================================================================
  🎉 棋牌全栈服务在 Termux Ubuntu 中启动成功！
  📱 手机本机访问:   http://127.0.0.1:3000
  🏠 局域网好友对战: http://192.168.x.x:3000
  ⚡ WebSocket 节点: ws://192.168.x.x:3000/ws
==================================================================
```
此时在手机浏览器中打开 `http://127.0.0.1:3000`，即可流畅运行经典烟三、水镜十三水与经典麻将！

---

## 七、 第五步：创建 Telegram 机器人与配置 .env 环境变量

为了能够通过 Telegram 机器人远程为玩家加减积分、审核手机号白名单、发布全服通告，只需简单配置 Telegram Bot：

### 1. 获取 Bot Token
1. 在 Telegram 搜索并打开官方机器人之父 `@BotFather`；
2. 发送 `/newbot` 指令；
3. 为机器人起一个昵称与用户名（如 `my_chess_manage_bot`）；
4. `@BotFather` 会回复给您一段 **API Token**（格式类似 `7890123456:AAFd44-xxxxxxxxxx`）。

### 2. 配置 Ubuntu 中的 `.env`
在 Ubuntu 终端项目目录下编辑配置文件：
```bash
nano .env
```
修改为您的实际信息：
```env
# ------------------------------------------------------------------------------
# 1. Telegram API 反代端点 (用于国内免翻墙连接 Telegram 服务器)
# ------------------------------------------------------------------------------
# 💡 国内网络直连 api.telegram.org 会报错 TypeError: fetch failed。
# 在此处填入 Telegram 反代 URL (例如 Cloudflare Worker、自建 Nginx 或第三方反代域名):
# 示例: URL="https://your-worker.workers.dev" 或 URL="https://api.telegram-proxy.com"
# 系统将全自动通过该反代收发 Bot 消息，手机完全无需挂代理！
URL=""

# ------------------------------------------------------------------------------
# 2. Telegram Bot 机器人 Token
# ------------------------------------------------------------------------------
TELEGRAM_BOT_TOKEN="7890123456:AAFd44-xxxxxxxxxx"

# ------------------------------------------------------------------------------
# 3. 管理员 Telegram 用户名
# ------------------------------------------------------------------------------
# 提示: 茶客手机号白名单直接在 Telegram Bot 中向 Bot 发送手机号进行秒级实时白名单授权，无需在环境变量中维护手机号
ADMIN_USERNAMES="your_tg_username"

# ------------------------------------------------------------------------------
# 4. 服务端口与模式
# ------------------------------------------------------------------------------
PORT=3000
HOST="0.0.0.0"
BOT_MODE="auto"
```
按 `Ctrl + O` 保存，按回车确认，再按 `Ctrl + X` 退出。

> 💡 **国内免翻墙直连技巧（强烈推荐）**：
> 在国内运行 Termux 时，由于网络阻断无法直连官方 `api.telegram.org`。
> 您只需在 `.env` 中设置 `URL="您的Telegram反代地址"`（例如 Cloudflare Worker 反代地址）。
> 服务启动时会自动通过反代启动【长轮询 (Long Polling)】模式，免穿透、免配置 Webhook，手机终端无需任何 VPN 即可毫秒级接收与响应 Bot 积分管理指令！

---

## 八、 第六步：可选 — 配置公网 HTTPS 穿透 (Cloudflare Tunnel 自动 Webhook)

如果您希望生成公网 HTTPS 链接供外部好友随时随地访问，并使用更省电的 Webhook 模式，可在 Ubuntu 下使用免费稳定的 `cloudflared`：

### 1. 在 Ubuntu 中下载并安装 cloudflared (ARM64)
```bash
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
dpkg -i cloudflared.deb || apt-get install -f -y
```

### 2. 一键启动免费 HTTPS 穿透隧道
```bash
pm2 start "cloudflared tunnel --url http://127.0.0.1:3000" --name "tunnel"
```

### 3. 查看您的临时免费 HTTPS 域名
```bash
pm2 logs tunnel --lines 25
```
日志中会显示一行生成的公网 HTTPS 地址：
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://cherry-xxx-yyy.trycloudflare.com                                                  |
+--------------------------------------------------------------------------------------------+
```

---

## 九、 第七步：URL 变量自动配置 Webhook 或长轮询自动接管

本项目后端已实现**全自动调度中枢**，您无需再手动拼装复杂 curl 命令！

### 1. 填入 URL 自动配置 Webhook
如果您开启了上述 Cloudflare Tunnel 穿透：
```bash
nano .env
```
将 `URL` 改为穿透域名：
```env
URL="https://cherry-xxx-yyy.trycloudflare.com"
```
保存退出后重启服务：
```bash
pm2 restart chess-server
```
**服务会自动调用 Telegram API 完成 setWebhook 注册！**
查看日志验证：
```bash
pm2 logs chess-server --lines 20
```
您将看到绿色日志输出：
```
🤖 [Telegram Bot] 检测到 URL 变量已设置公网 HTTPS: https://cherry-xxx-yyy.trycloudflare.com
🤖 [Telegram Bot] 正在自动调用 setWebhook 注册: https://cherry-xxx-yyy.trycloudflare.com/api/telegram/webhook ...
✅ [Telegram Bot] Webhook 自动注册成功！
   Telegram 推送将以毫秒级直推本服务！
```

### 2. 轮询模式（无需 URL）自动接管
若 `URL=""` 留空，重启后日志将显示：
```
🤖 [Telegram Bot] .env 中未配置 URL 变量 (URL 为空)。
🚀 [Telegram Bot] 自动启动【长轮询模式 (Long Polling)】！
   优势：无需公网 IP、无需域名、无需端口映射，在手机 Termux 或内网均可直接接收 Bot 指令！
```

---

## 十、 第八步：PM2 进程常驻守护与开机自启 (24小时不掉线)

### 1. 保存当前 PM2 运行列表
在 Ubuntu 终端输入：
```bash
pm2 save
```

### 2. 常用 PM2 维护命令
```bash
# 查看所有服务状态
pm2 status

# 查看棋牌服务日志（含充值扣分、开局广播）
pm2 logs chess-server

# 查看穿透日志
pm2 logs tunnel

# 重启全部
pm2 restart all
```

### 3. 在外层 Termux 配置一键启动快捷命令
从 Ubuntu 输入 `exit` 退出回 Termux 宿主，在 Termux 执行：
```bash
cat << 'EOF' > ~/start_chess.sh
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock 2>/dev/null || true
echo "正在进入 Ubuntu 容器并启动国粹棋牌与穿透..."
proot-distro login ubuntu -- bash -c "pm2 resurrect || (cd ~/chess-lobby && bash deploy_ubuntu.sh)"
echo "服务已在后台运行！本机访问 http://127.0.0.1:3000"
EOF
chmod +x ~/start_chess.sh
```
以后打开手机 Termux，只需运行：
```bash
bash ~/start_chess.sh
```
即可秒级全自动拉起所有服务！

---

## 十一、 第九步：Telegram Bot 控盘指令实战操作

在手机 Telegram 客户端找到您的机器人，点击 **START**，输入下列指令：

| 指令 | 格式范例 | 说明 |
| :--- | :--- | :--- |
| **开局/帮助** | `/start` 或 `/help` | 查看所有指令与管理员面板 |
| **增加积分** | `/addpoints 13800138000 5000` | 为指定手机号玩家增加 5000 分，**前端实时音效气泡秒到账** |
| **扣减积分** | `/subpoints 13800138000 2000` | 为指定手机号扣减 2000 分，**前端账册实时记录** |
| **重置设定** | `/setpoints 13800138000 8888` | 直接将该玩家筹码设置为 8888 分 |
| **查在线玩家** | `/users` | 查看当前注册、登录和在线的牌友及其筹码结余 |
| **查牌桌状态** | `/rooms` | 查看三大棋种所有活跃雅座与打牌进程 |
| **全员广播** | `/broadcast 各位牌友，茶楼今晚举办雀神争霸赛！` | 全屏横屏横向弹幕与司仪播报实时同步 |

> 🌟 **即时响应验证**：Bot 无论加分还是扣分，前端大厅与游戏界面的金币徽章会通过 WebSocket 实时弹射金币瀑布并弹出浮动提示，积分管理内的“流水账册”会自动记上一笔后台调配记录！

---

## 十二、 常见问题排查与避坑指南 (FAQ)

### Q1: 为什么强烈要求在 Termux 的 Ubuntu 容器里部署，而不是直接在 Termux？
- **答**：Termux 宿主是基于 Android Bionic C 库构建的非标准环境，许多 npm 依赖（如 `@rollup/rollup-linux-arm64-musl` 或 esbuild 二进制文件）在执行 `vite build` 时会直接发生段错误退出。而在 `proot-distro Ubuntu` 中，使用的是完整的 GNU C 库（glibc），与真正的云端 Ubuntu 服务器一模一样，所有编译工具与 npm 模块 100% 稳定运行。

### Q2: 手机息屏后，好友连线或 Telegram Bot 变慢怎么办？
- **答**：
  1. 确保在 Termux 宿主执行过 `termux-wake-lock`；
  2. 在手机系统设置中将 Termux 应用的电池优化设为 **“允许后台高耗电” / “不优化”**；
  3. 部分厂商（如小米 MIUI/HyperOS、华为 HarmonyOS、vivo OriginOS）需在后台任务卡片上将 Termux **加锁**，并允许“自启动”。

### Q3: 端口 3000 提示被占用怎么办？
- **答**：在 Ubuntu 终端输入：
  ```bash
  fuser -k 3000/tcp || lsof -ti:3000 | xargs kill -9
  pm2 restart chess-server
  ```

### Q4: 如何在同一局域网内用其他手机或平板加入游戏？
- **答**：在 Ubuntu 中运行 `ip -4 route get 1.1.1.1` 查看手机内网 IP（例如 `192.168.1.88`）。确保其他手机连接同一个 Wi-Fi 或连接部署手机开启的个人热点，在浏览器输入 `http://192.168.1.88:3000` 即可同台对战！

---

## 十三、 Termux Ubuntu 终极 24 小时后台持久保活方案 (突破 Android 杀后台与休眠)

如果在实际使用中遇到：**“手机息屏一段时间后服务停止响应”、“PM2 无法保活”**，这是由 Android 系统的底层机制（Doze 休眠模式、App Freezer 冻结、电池白名单及 OOM 内存回收机制）造成的。
请按照以下**五层防护方案**进行配置，彻底解决手机后台杀进程问题：

### 1. 第一层：Termux 宿主开启 CPU 唤醒锁与常驻前台服务
在进入 Ubuntu 前，在 Termux 原生终端执行：
```bash
# 1. 获取 CPU 唤醒锁，防止锁屏时 CPU 深度休眠
termux-wake-lock

# 2. 安装 termux-api 并创建常驻通知栏服务（降低系统杀后台优先级）
pkg install -y termux-api
termux-notification --title "国粹棋牌服务运行中" --content "Termux Ubuntu 守护中，点击返回" --id 888 --ongoing
```

### 2. 第二层：手机操作系统设置“无限制”与应用锁定
1. **电池策略改为无限制**：长按 Termux 应用图标 -> 应用信息 -> 电池使用情况 -> 设为 **“无限制” (Unrestricted)** 或 “允许完全后台高耗电”。
2. **多任务卡片加锁**：打开手机多任务后台界面，找到 Termux，下拉或长按点击 **“锁定” (小锁图标)**，防止系统一键清理时关闭。
3. **厂商专属优化**：
   - **小米 (HyperOS/MIUI)**：在“应用管理”中开启“自启动”和“关联启动”，省电策略设为“无限制”。
   - **华为/荣耀 (HarmonyOS/MagicOS)**：在“应用启动管理”中关闭“自动管理”，开启“允许自启动”、“允许关联启动”、“允许后台活动”。
   - **OPPO/vivo/一加**：在“电池”或“后台高耗电”中开启 Termux，允许浮窗/后台常驻。
4. **保持 Wi-Fi 息屏不休眠**：手机系统设置 -> WLAN/Wi-Fi -> 高级设置 -> “在休眠状态下保持 Wi-Fi 连接”设为“始终”。

### 3. 第三层：使用 `tmux` + 死循环守护脚本 (替代 PM2 假死)
在 proot 容器内，由于没有完整的 systemd，PM2 的守护进程可能被冻结。使用原生的 `tmux` 会话配合 Shell 守护脚本最为轻量稳健：

在 Ubuntu 容器内执行：
```bash
# 1. 安装 tmux
apt-get install -y tmux

# 2. 创建守护脚本 ~/run_guard.sh
cat << 'EOF' > ~/run_guard.sh
#!/bin/bash
cd ~/chess-lobby
while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 启动全栈棋牌服务..."
  fuser -k 3000/tcp 2>/dev/null || true
  node server.ts
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 服务意外退出，5秒后自动重新拉起..."
  sleep 5
done
EOF
chmod +x ~/run_guard.sh

# 3. 启动后台 tmux 会话
tmux new-session -d -s chess "bash ~/run_guard.sh"
```
> 💡 **小贴士**：
> - 查看实时日志：`tmux attach -t chess`
> - 退出查看回到终端（保持后台运行）：按下键盘 `Ctrl + B`，然后按 `D` 即可。

### 4. 第四层：安装 Termux:Boot 实现手机开机自动拉起
1. 从 F-Droid 下载安装 **Termux:Boot** 插件；
2. 首次打开一次 Termux:Boot 应用授予自启权限；
3. 在 Termux 中创建自启脚本：
```bash
mkdir -p ~/.termux/boot/
cat << 'EOF' > ~/.termux/boot/start_chess.sh
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
termux-notification --title "棋牌自启动中" --content "正在拉起 Ubuntu 容器与游戏服务..." --id 888 --ongoing
proot-distro login ubuntu -- bash -c "tmux new-session -d -s chess 'bash ~/run_guard.sh'"
EOF
chmod +x ~/.termux/boot/start_chess.sh
```
手机今后无论重启还是关机开机，都会在开机解锁后全自动启动棋牌后台！

### 5. 第五层：外部 HTTP 心跳探针防休眠
使用免费的在线监控平台（如 **UptimeRobot**、**BetterUptime** 或 **cron-job.org**）：
- 添加一个每 **5 分钟** 请求一次的 HTTP(s) 监控项，地址填入您的 Cloudflare Tunnel 穿透域名（或局域网内其他设备定时 curl）。
- 定期的外部 HTTP 请求不仅能实现掉线告警，还能主动激活手机的网络接口，防止运营商或 Android 基带强行休眠断开 TCP 连接。
