# 国粹棋牌项目完整架构图与代码功能说明文档 (Project Architecture & Code Directory)

本着“**高内聚、低耦合、清晰可维护**”的架构设计原则，本项目（含三大国粹棋牌：经典烟三、水镜十三水、经典国标麻将）采用了前端 **Vue 3 + TypeScript + Tailwind CSS + HTML5 Canvas** 与后端 **Node.js + WebSocket + Express** 的全栈模块化架构。

为了方便后续维护、扩展以及跨平台编译（如 Web 网页版、Termux Linux 部署以及 Android 原生 APK），所有游戏逻辑、网络通信、UI 视图与资源调度均按照功能进行了严格的目录拆分与模块解耦。

---

## 目录导航 (Table of Contents)
- [一、 项目总体架构拓扑图](#一-项目总体架构拓扑图)
- [二、 核心服务端与构建配置文件](#二-核心服务端与构建配置文件)
- [三、 三大游戏独立逻辑子系统 (`/src/games/`)](#三-三大游戏独立逻辑子系统-srcgames)
- [四、 UI 视图与交互组件 (`/src/components/`)](#四-ui-视图与交互组件-srccomponents)
- [五、 通用工具库与服务 (`/src/utils/` & `/src/server/`)](#五-通用工具库和服务-srcutils--srcserver)
- [六、 移动端原生与 CI/CD 自动化构建 (`/android/` & `.github/`)](#六-移动端原生与-cicd-自动化构建-android--github)

---

## 一、 项目总体架构拓扑图

```text
                               ┌──────────────────────────────────────────────┐
                               │           Web / Capacitor Native App         │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                           HTTP / WebSocket (JSON)
                                                      │
                                                      ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                 后端服务层 (Backend Service Layer)                                      │
 │  ┌────────────────────────┐    ┌────────────────────────┐    ┌──────────────────────────────────────┐  │
 │  │      server.ts         │    │    src/serverApi.ts    │    │       src/telegramBotService.ts      │  │
 │  │ Standalone HTTP/WS Server│    │ Express REST API Gateway│    │  Telegram Bot Notification System    │  │
 │  └───────────┬────────────┘    └───────────┬────────────┘    └──────────────────┬───────────────────┘  │
 │              │                             │                                    │                      │
 │              ▼                             ▼                                    ▼                      │
 │  ┌────────────────────────┐    ┌────────────────────────┐    ┌──────────────────────────────────────┐  │
 │  │ src/server/roomManager │    │  src/serverStorage.ts  │    │        src/presenceTracker.ts        │  │
 │  │ Room & Seat State Engine│    │  JSON Database Manager │    │   Real-time Online Presence Engine   │  │
 │  └────────────────────────┘    └────────────────────────┘    └──────────────────────────────────────┘  │
 └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                      ▲
                                                      │
 ┌────────────────────────────────────────────────────┴───────────────────────────────────────────────────┐
 │                                 前端展现层 (Frontend Presentation)                                      │
 │                                           src/App.vue                                                  │
 │                               (App Container & Navigation Router)                                      │
 ├────────────────────────────────────────┬───────────────────────────────────────┬───────────────────────┤
 │                                        │                                       │                       │
 │  ┌──────────────────────────────────┐  │  ┌─────────────────────────────────┐  │  ┌─────────────────┐  │
 │  │        src/components/           │  │  │     src/components/canvas/      │  │  │   src/utils/    │  │
 │  │   TeahouseChatroom.vue           │  │  │   - YansanCanvas.vue (烟三)     │  │  │  - sound.ts     │  │
 │  │   SceneWaitingRoom.vue           │  │  │   - ShisanshuiCanvas.vue(十三水)│  │  │  - haptics.ts   │  │
 │  │   YansanSceneModal.vue...        │  │  │   - MahjongCanvas.vue (麻将)    │  │  │  - storage.ts   │  │
 │  └──────────────────────────────────┘  │  └─────────────────────────────────┘  │  └─────────────────┘  │
 └────────────────────────────────────────┼───────────────────────────────────────┴───────────────────────┘
                                          │
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                              三大游戏独立业务逻辑系统 (`src/games/`)                                     │
 │  ┌─────────────────────────┐      ┌─────────────────────────┐      ┌────────────────────────────────┐  │
 │  │   /src/games/yansan/    │      │ /src/games/shisanshui/  │      │    /src/games/mahjong/         │  │
 │  │ - deck.ts (洗发牌/♦4)   │      │ - deck.ts (52/104张)    │      │ - deck.ts (136张牌墙)          │  │
 │  │ - rules.ts (牌型暗盟)   │      │ - rules.ts (三道理牌)   │      │ - rules.ts (胡听算番)          │  │
 │  │ - settlement.ts(复盘)   │      │ - settlement.ts(打枪)   │      │ - settlement.ts(抓码)          │  │
 │  └────────────┬────────────┘      └────────────┬────────────┘      └───────────────┬────────────────┘  │
 │               │                                │                                   │                   │
 │               └────────────────────────────────┼───────────────────────────────────┘                   │
 │                                                ▼                                                       │
 │                                ┌──────────────────────────────┐                                        │
 │                                │    /src/games/common/        │                                        │
 │                                │  - dealService.ts            │                                        │
 │                                │  - boardState.ts             │                                        │
 │                                │  - settlement.ts             │                                        │
 │                                └──────────────────────────────┘                                        │
 └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、 核心服务端与构建配置文件

| 文件路径 | 文件类型 | 核心功能与职责描述 |
| :--- | :--- | :--- |
| `/server.ts` | 后端独立服务端 | **生产环境 Node.js 独立入口**。整合 Express HTTP API、WebSocket 客户端状态同步、房间实时组队开局、Telegram 机器人消息推送以及 CORS 跨域安全策略。 |
| `/go-server/main.go` | Go 语言高性能服务端 | **全新重构的高并发 Go 权威对战引擎**。零 CGO 依赖、超轻内存、毫秒级启动、Goroutine 原生协程调度与独立二进制分发，彻底替代旧版复杂的 Rust 编译方案。 |
| `/go-server/deploy_termux.sh` | Go Termux 部署脚本 | Android 手机 Termux 下快速编译与常驻守护 Go 服务的自动化脚本。 |
| `/vite.config.ts` | Vite 构建 & 嵌入式开发服务端 | **开发环境构建与嵌入式开发 Server 配置**。预置开发期嵌入式 WebSocket 引擎、别名路径解析、Tailwind CSS 自动化编译以及多端代理。 |
| `/index.html` | Web 网页入口 | HTML5 应用宿主入口，包含 viewport 自适应视口配置、网页 Title、Favicon 资源引用与静态字体预加载。 |
| `/package.json` | 依赖与脚本 | 项目 NPM 包元数据，定义 `dev`、`build`、`lint`、`preview` 运行指令，管理 Vue 3、Vite、Tailwind CSS、Howler.js、Lucide 图标库依赖。 |
| `/metadata.json` | AI Studio 配置 | 平台描述文件，定义 AI Studio Build 平台应用名称、能力标识与服务端 Gemini API 权限声明。 |
| `/capacitor.config.json` | 移动端原生配置 | Capacitor 跨平台打包配置文件，配置 Android 应用包名 `com.guocui.chess`、原生启动屏与 Web 混合内容拦截规则。 |
| `/.env.example` | 环境变量模板 | 环境变量规范模板，定义 HTTP 服务端口、WebSocket 链接地址、远程服务器域名与 Telegram Bot 秘钥等。 |
| `/deploy_ubuntu.sh` | 部署脚本 | Ubuntu Server 与 Termux 架构下的一键快速部署 Shell 脚本。 |
| `/TERMUX_DEPLOY_GUIDE.md` | 部署文档 | Termux 环境下离线运行、搭建私有棋牌服务器的完整指导手册。 |

---

## 三、 三大游戏独立逻辑子系统 (`/src/games/`)

为了方便后续维护升级，三大游戏的所有业务规则、洗发牌算法、胜负结算与音频映射**全部实现隔离解耦**：

### 1. 经典烟三独立子系统 (`/src/games/yansan/`)
- **`src/games/yansan/types.ts`**：烟三专属卡牌结构（`rank`, `suit`, `suitVal`）、暗盟阵营类型、发牌切片与玩家出牌动作事件类型。
- **`src/games/yansan/deck.ts`**：权威 52 张单副扑克洗牌算法，精确算出♦4持有人作为首出先手，并智能判定♠3与♠A的暗盟席位。
- **`src/games/yansan/rules.ts`**：烟三出牌合法性校验引擎。涵盖单张、对子、三条、顺子、炸弹等牌型比较、暗盟胜利推演与一键智能提示求解器。
- **`src/games/yansan/scenes.ts`**：烟三分场配置。定义 5-10分场、10-20分场、20-40分场准入门槛（100分）、底分与顶格封顶分。
- **`src/games/yansan/settlement.ts`**：烟三对局结算推演器。计算独胜/强攻/同盟输赢得分，并生成结构化 4 阶段复盘牌谱数据。
- **`src/games/yansan/audioMap.ts`**：烟三专属真人粤语/国语配音映射表（♦4首出、绝大、接风、强攻、投降、报单等）。
- **`src/games/yansan/index.ts`**：烟三业务统一对外导出模块。

### 2. 水镜十三水独立子系统 (`/src/games/shisanshui/`)
- **`src/games/shisanshui/types.ts`**：十三水专属卡牌、头道(3张)/中道(5张)/尾道(5张)三道组合、特殊牌型（至尊青龙、三分天下、六半对）与车厢预约房结构。
- **`src/games/shisanshui/deck.ts`**：四人场 52 张单副牌 / 八人场 104 张双副牌权威洗牌与全员发牌切片生成。
- **`src/games/shisanshui/rules.ts`**：十三水牌力评估与倒水相公防错校验引擎，内置一键最优理牌算法（自动推演最高胜率的头中尾三道）。
- **`src/games/shisanshui/bookingTrain.ts`**：十三水专列车厢预派牌推演引擎，管理 10 桌在线车厢与独立发牌推演。
- **`src/games/shisanshui/scenes.ts`**：十三水分场配置（四人实时、八人实时、四人预约专列、八人预约专列）。
- **`src/games/shisanshui/settlement.ts`**：十三水比水胜负推演器。精确计算水数、打枪翻倍、全垒打与大满贯加乘。
- **`src/games/shisanshui/audioMap.ts`**：十三水专属配音映射表（倒水、一枪命中、全垒打、大满贯、至尊青龙等）。
- **`src/games/shisanshui/index.ts`**：十三水业务统一对外导出模块。

### 3. 经典国标麻将独立子系统 (`/src/games/mahjong/`)
- **`src/games/mahjong/types.ts`**：万/条/筒/字 136 张麻将牌定义、牌墙切片、庄家掷骰子状态与吃碰杠胡听动作结构。
- **`src/games/mahjong/deck.ts`**：136 张权威麻将牌墙洗牌生成器、双色子定庄开门算法、庄家14张/闲家13张发牌切片。
- **`src/games/mahjong/rules.ts`**：麻将胡牌算法（4面子+1雀头）、七对、清一色、红中万能赖子替代计算与听牌推算器。
- **`src/games/mahjong/scenes.ts`**：麻将场景配置（红中6码、红中10码、国标10番、国标6番）。
- **`src/games/mahjong/settlement.ts`**：麻将和牌结算器。计算自摸/放炮得分、多家赔付、抓码翻倍奖分与复盘牌谱。
- **`src/games/mahjong/audioMap.ts`**：麻将专属配音映射表（吃、碰、杠、听、胡、自摸、定庄与万条筒字牌声）。
- **`src/games/mahjong/index.ts`**：麻将业务统一对外导出模块。

### 4. 通用适配调度层 (`/src/games/common/`)
- **`src/games/common/types.ts`**：通用基础枚举与跨游戏基础类型（`GameType`, `ScenePlayer`, `AuthoritativeBoardState`）。
- **`src/games/common/boardState.ts`**：网络对局权威棋盘状态分配与同步器。
- **`src/games/common/sceneCoins.ts`**：跨场景准入积分校验与准入门槛分发器。
- **`src/games/common/dealService.ts`**：发牌与开局总分发调度器。
- **`src/games/common/settlement.ts`**：跨游戏对局结算总分发调度器。
- **`src/games/common/modulesConfig.ts`**：大厅入口游戏卡片元数据、展示色彩与图标样式定义。
- **`src/games/index.ts`**：全局游戏模块统一导出总入口。

---

## 四、 UI 视图与交互组件 (`/src/components/`)

### 1. 核心视图与路由中枢
- **`src/App.vue`**：前端全局根组件。掌控游戏大厅、茶馆聊天室、等候匹配室、竞技场 Canvas 舞台以及三大分场选择弹窗的路由流转，管理用户 Profile 本地持久化与 WebSocket 实时收发。

### 2. HTML5 Canvas 游戏舞台 (`/src/components/canvas/`)
- **`YansanCanvas.vue`**：烟三 2D Canvas 交互舞台。负责牌桌绘制、扑克动画、♦4首出高亮提示、强攻独胜/投降结算及复盘展示。
- **`ShisanshuiCanvas.vue`**：十三水 2D Canvas 舞台。负责头中尾三道卡牌拖拽摆牌、倒水检测、开牌连环打枪与比水特效。
- **`MahjongCanvas.vue`**：麻将 2D Canvas 舞台。负责 3D 象牙色子掷骰动效、牌墙自右向左摸牌、摸打动画与吃碰杠胡特效。
- **`ShisanshuiBookingTrainModal.vue`**：十三水预约专列车厢弹窗，支持 10 桌并发车厢推演与智能摆牌。

### 3. 场景选择弹窗组件
- **`YansanSceneModal.vue`**：烟三分场选择弹窗（5-10分场、10-20分场、20-40分场）。
- **`ShisanshuiSceneModal.vue`**：十三水分场选择弹窗（四人/八人 实时/预约专列）。
- **`MahjongSceneModal.vue`**：麻将分场选择弹窗（红中6码/10码、国标场）。

### 4. 社交与等待匹配组件
- **`TeahouseChatroom.vue`**：茶馆社交大厅。支持实时文本聊天、语音飞屏、20秒麦克风录音广播、擂台下战帖与在座人数监控。
- **`SceneWaitingRoom.vue`**：选定分场后的四席/八席等候匹配室。展示各席位玩家状态、实时语音广播与开局倒计时。

### 5. 系统弹窗与辅助组件
- **`AuthModal.vue`**：用户登录/注册与游客身份切换弹窗。
- **`UserProfileModal.vue`**：个人中心与战绩明细展示弹窗。
- **`PointsManageModal.vue`**：钱庄积分提取/存入管理弹窗。
- **`AchievementModal.vue`**：玩家成就勋章展示弹窗。
- **`TermuxDeploySection.vue`**：Termux 部署教程指引组件。
- **`ApkDownloadModal.vue`**：Android APK 官方下载弹窗（含二维码与多线路镜像）。
- **`VictoryPosterModal.vue`**：大胜战报海报生成弹窗。
- **`InsufficientCoinsModal.vue`**：积分不足提醒与试玩引导弹窗。
- **`ServerConfigModal.vue`**：自定义远程服务器 IP/域名 配置弹窗。
- **`components/effects/Game3DEffects.vue`**：全局 3D 粒子背景与卡牌翻转光影特效。
- **`components/waiting/SeatCard.vue`**：等候室席位卡片展示组件。

---

## 五、 通用工具库和服务 (`/src/utils/` & `/src/server/`)

### 1. 前端工具库 (`/src/utils/`)
- **`src/utils/sound.ts`**：音频播放核心。基于 Web Audio API 与 Audio Element，提供增益放大、洗发牌音效、出牌配音与背景音乐管理。
- **`src/utils/haptics.ts`**：触觉反馈工具，支持 Mobile Web 与 Capacitor 原生设备的震动反馈。
- **`src/utils/storage.ts`**：LocalStorage 本地数据持久化工具，保存玩家 Profile、战绩历史与系统设置。
- **`src/utils/theme.ts`**：桌面主题（经典绿绒、古木紫檀、暗夜琉璃）色彩与样式定义。
- **`src/utils/networkConfig.ts`**：网络配置解析器。自适应识别 Web 网页环境与 Android APK 原生环境，解析 API 与 WebSocket 地址。

### 2. 后端服务端模块 (`/src/server/` & `/src/`)
- **`src/serverApi.ts`**：HTTP REST API 路由处理函数（用户认证、积分交易、排行榜与战绩记录）。
- **`src/serverStorage.ts`**：本地 JSON 数据库读写引擎，将数据持久化至 `data/game_database.json`。
- **`src/telegramBotService.ts`**：Telegram 机器人服务集成，实时推送房间动态与战报通知。
- **`src/presenceTracker.ts`**：在线人数与场景在座人数实时追踪器。
- **`src/gameDeckService.ts`**：服务端权威发牌调度服务。
- **`src/server/roomManager.ts`**：服务端对局房间与席位状态管理器。

---

## 六、 移动端原生与 CI/CD 自动化构建 (`/android/` & `.github/`)

- **`.github/workflows/build-apk.yml`**：GitHub Actions CI/CD 流水线。监听代码提交并自动构建 Android Release/Debug APK，同步生成发布元数据。
- **`.github/workflows/build.yml`**：GitHub Actions 代码编译与 Lint 自动化检查工作流。
- **`android/`**：标准的 Android Capacitor 原生工程，包含应用图标、启动页、权限配置与签名信息。
- **`apk/apk-build-info.json`**：APK 构建版本与元数据记录文件。
