# 游戏源码结构与文件说明 (Game Files Description)

本项目专注三大经典国粹棋牌（经典烟三、水镜十三水、经典国标麻将）。为了保障系统长期稳定维护升级，**三大游戏的所有业务功能逻辑已彻底拆分为完全独立的业务文件与目录模块**。

---

## 一、 三大游戏独立逻辑模块目录 (`/src/games/`)

每个游戏在 `/src/games/` 下均拥有完全隔离的独立子目录，涵盖各自专用的**牌库发牌、规则判定、场景倍率配置、对局结算与复盘推演、离线语音映射**：

### 1. 经典烟三独立模块 (`/src/games/yansan/`)
- `src/games/yansan/types.ts`：烟三独有卡牌、发牌、牌型、暗盟阵营与出牌事件类型。
- `src/games/yansan/deck.ts`：权威 52 张单副扑克洗牌发牌、♦4首出、♠3/♠A同盟席位判定。
- `src/games/yansan/rules.ts`：出牌合法性、牌型比较、同盟计分、提示求解器。
- `src/games/yansan/scenes.ts`：初入烟雨(5-10)、风起岭南(10-20)、烟波浩渺(20-40)场景倍率与准入积分规则。
- `src/games/yansan/settlement.ts`：烟三对局胜负、阵营得分推演、积分变动与专属 4 阶段复盘牌谱生成。
- `src/games/yansan/audioMap.ts`：烟三独立真人配音映射（方块4首出、全场绝大、接风、报单、强攻、投降、单张/对子/三张配音等）。
- `src/games/yansan/index.ts`：烟三独立统一导出入口。

### 2. 水镜十三水独立模块 (`/src/games/shisanshui/`)
- `src/games/shisanshui/types.ts`：十三水扑克、三道手牌、特殊牌型、车厢预约牌桌等专属类型。
- `src/games/shisanshui/deck.ts`：四人场标准 52 张 / 八人场 104 张双副扑克全发牌逻辑。
- `src/games/shisanshui/rules.ts`：头道/中道/尾道牌力计算、严防倒水校验、一键智能最优理牌推荐。
- `src/games/shisanshui/bookingTrain.ts`：十三水专属预约专列车厢推演引擎、10张牌桌预发牌生成与席位状态管理。
- `src/games/shisanshui/scenes.ts`：四人实时、八人实时、四人车厢预约、八人车厢预约场次倍率与准入规则。
- `src/games/shisanshui/settlement.ts`：十三水比水输赢计算、打枪/全垒打/大满贯加倍、积分结算与复盘数据构造。
- `src/games/shisanshui/audioMap.ts`：十三水独立真人配音映射（倒水相公、一枪命中、全垒打、大满贯、头中尾三道、至尊青龙等）。
- `src/games/shisanshui/index.ts`：十三水独立统一导出入口。

### 3. 经典国标麻将独立模块 (`/src/games/mahjong/`)
- `src/games/mahjong/types.ts`：万/条/筒/字麻将牌、牌墙、庄家骰子、碰杠胡听动作与结算结构。
- `src/games/mahjong/deck.ts`：136张权威麻将牌墙生成、双色子定庄开门、庄家14张/闲家13张发牌、83张牌墙管理。
- `src/games/mahjong/rules.ts`：4面子+1雀头分解、七对、清一色、红中万能赖子胡牌与听牌推算。
- `src/games/mahjong/scenes.ts`：红中6码、红中10码、国标10番、国标6番场景配置与准入积分规则。
- `src/games/mahjong/settlement.ts`：自摸和牌结算、各家赔付、抓码奖励与结构化复盘生成。
- `src/games/mahjong/audioMap.ts`：麻将独立真人配音映射（吃、碰、杠、补杠、暗杠、听牌、自摸、定庄、万条筒字牌声）。
- `src/games/mahjong/index.ts`：麻将独立统一导出入口。

### 4. 通用调度与适配层 (`/src/games/common/`)
- `src/games/common/types.ts`：三大游戏通用 `GameType` 枚举、`ScenePlayer`、`AuthoritativeBoardState`。
- `src/games/common/boardState.ts`：权威棋盘状态分配器。
- `src/games/common/sceneCoins.ts`：场景准入积分总调度分发器。
- `src/games/common/dealService.ts`：发牌与开盘总调度分发器。
- `src/games/common/settlement.ts`：对局结算总调度分发器。
- `src/games/common/modulesConfig.ts`：大厅游戏卡片元数据、展示色彩与样式定义。
- `src/games/index.ts`：全局主入口，一站式按需访问或独立访问任意游戏。

---

## 二、 界面与视图组件文件 (UI Components & Canvas Views)
存放于 `/src/components/` 及其子目录下，负责渲染游戏舞台、动画特效、操作按钮、积分面板及场景选择：

1. **全局主入口与视图调度**：
   - `src/App.vue`：主控组件。负责大厅导航、三大经典游戏模式的路由切换、全局音效控制、主题切换以及弹窗调度。现已完全基于 `/src/games/` 模块化驱动。

2. **游戏舞台画布组件 (Canvas Views)**：
   存放于 `/src/components/canvas/`：
   - `YansanCanvas.vue`：经典烟三游戏主舞台（方块4首出引导、强攻独胜与投降结算）。
   - `ShisanshuiCanvas.vue`：水镜十三水游戏舞台（三道摆牌、倒水检测、开牌比水与连环打枪）。
   - `MahjongCanvas.vue`：经典国标麻将舞台（3D象牙色子定庄动效、摸牌、打牌、碰杠胡动画）。
   - `ShisanshuiBookingTrainModal.vue`：十三水预约专列 10 桌车厢推演弹窗。

3. **场景选择弹窗组件 (Scene Selection Modals)**：
   - `YansanSceneModal.vue`：烟三场次选择（5-10分、10-20分、20-40分）。
   - `ShisanshuiSceneModal.vue`：十三水场次选择（四人实时/预约场、八人两副牌实时/预约场）。
   - `MahjongSceneModal.vue`：麻将场次选择（红中6码/10码、经典6码/10码）。

4. **系统与功能弹窗组件**：
   - `AuthModal.vue`：用户登录/注册弹窗。
   - `UserProfileModal.vue`：用户个人资料与战绩统计。
   - `PointsManageModal.vue`：积分与资产管理。
   - `AchievementModal.vue`：成就系统弹窗。
   - `TermuxDeploySection.vue`：Termux proot-distro Ubuntu 部署教程及指引组件。
   - `ApkDownloadModal.vue`：Android APK 客户端极速下载弹窗。

---

## 三、 Android APK 自动化构建与国内加速下载 (GitHub Actions CI/CD)
- `.github/workflows/build-apk.yml`：
  - **功能**：监听仓库 `main` / `master` 分支推送。代码更新后自动编译出 Release 正式版与 Debug 调试版 APK，并发布至 GitHub Releases 与本地 `apk/app-latest.apk`。
- `capacitor.config.json`：Capacitor 配置文件，配置 Android 原生包名 `com.guocui.chess`、应用名、HTTPS 协议与混合内容支持。
- `android/`：原生 Android Gradle 工程，预置 AndroidManifest、应用图标资源与 release debug 签名配置。
