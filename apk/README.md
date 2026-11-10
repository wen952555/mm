# 📱 Android APK 自动打包与国内加速下载说明

本项目已配置自动化 GitHub Actions 工作流（`.github/workflows/build-apk.yml`），每次仓库提交代码均会自动打包并覆盖旧版 APK。

---

## 🇨🇳 国内高速加速下载通道 (免翻墙·即点即下)

针对国内网络环境从 GitHub 下载慢或连不上的问题，已接入国内全网加速镜像节点：

### 🚀 方式一：国内极速镜像直链 (点击直接下载)
- **极速专线 1 (GHProxy CDN)**:
  `https://ghproxy.net/https://github.com/<用户名>/<仓库名>/releases/download/latest-apk/chess-game-release.apk`
- **高速专线 2 (GitMirror 节点)**:
  `https://hub.gitmirror.com/https://github.com/<用户名>/<仓库名>/releases/download/latest-apk/chess-game-release.apk`
- **备用镜像 3 (KKGitHub 镜像)**:
  `https://kkgithub.com/<用户名>/<仓库名>/releases/download/latest-apk/chess-game-release.apk`
- **仓库源码 Raw 加速直链**:
  `https://ghproxy.net/https://raw.githubusercontent.com/<用户名>/<仓库名>/main/apk/app-latest.apk`

> 💡 **使用方法**：将上述链接中的 `<用户名>/<仓库名>` 替换为您自己的 GitHub 仓库路径（例如 `zhangsan/chess-lobby`），复制到安卓手机自带浏览器打开，即可高速下载最新 `apk`！

---

## 🌍 GitHub 官方原始下载通道
- **最新 Release 安装包**：
  `https://github.com/<用户名>/<仓库名>/releases/download/latest-apk/chess-game-release.apk`
- **仓库内文件直链**：
  `https://github.com/<用户名>/<仓库名>/raw/main/apk/app-latest.apk`

---

## ⚙️ 自动覆盖机制说明
1. **GitHub Releases 自动覆盖**：每次工作流运行，都会更新 `latest-apk` 标签，并自动替换覆盖其中的 `chess-game-release.apk`。
2. **仓库内 APK 覆盖**：自动向仓库 `apk/app-latest.apk` 提交更新。
3. **免签名直接安装**：Release APK 预置签名配置，安卓手机下载后允许未知来源安装即可直接运行。
