import { executeTelegramUpdate } from './serverApi.ts';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export interface TelegramBotStatus {
  enabled: boolean;
  mode: 'webhook' | 'polling' | 'disabled';
  tokenConfigured: boolean;
  tokenMasked: string;
  urlConfigured: string;
  apiBase?: string;
  botUsername?: string;
  botName?: string;
  webhookUrl?: string;
  pollingActive: boolean;
  lastPollTimestamp: number | null;
  lastMessageTimestamp: number | null;
  processedCount: number;
  lastError: string | null;
  lastWebhookInfo?: any;
}

let botStatus: TelegramBotStatus = {
  enabled: false,
  mode: 'disabled',
  tokenConfigured: false,
  tokenMasked: '',
  urlConfigured: '',
  pollingActive: false,
  lastPollTimestamp: null,
  lastMessageTimestamp: null,
  processedCount: 0,
  lastError: null,
};

let activePollingController: AbortController | null = null;
let savedBroadcast: Function | null = null;

export function maskToken(token: string): string {
  if (!token || token.length < 10) return '***';
  return token.substring(0, 5) + '...' + token.substring(token.length - 4);
}

export function refreshEnvFromDisk(): void {
  const possibleEnvPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    process.env.HOME ? path.resolve(process.env.HOME, '.env') : '',
  ].filter(Boolean);

  for (const p of possibleEnvPaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        const parsed = dotenv.parse(content);
        for (const [k, v] of Object.entries(parsed)) {
          // 仅当 .env 中的值包含非空内容时才覆盖，防止 .env 模板中的空字符串意外抹除外部传入的有效变量
          if (typeof v === 'string' && v.trim() !== '') {
            process.env[k] = v.trim();
          }
        }
      } catch {}
    }
  }
}

export function normalizePublicUrl(rawUrl: string): string {
  let u = String(rawUrl || '').trim();
  u = u.replace(/^['"]+|['"]+$/g, '').trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) {
    u = 'https://' + u;
  }
  return u.replace(/\/+$/, '');
}

export function getTelegramBotStatus(): TelegramBotStatus {
  return { ...botStatus };
}

/**
 * 获取 Telegram API 端点：
 * 仅用于指定 Telegram 官方 API 反代服务器地址 (TELEGRAM_API_BASE / TG_PROXY / TG_API_BASE)，
 * 严禁混入本应用的公网访问地址 URL，未设置时必须默认官方 https://api.telegram.org
 */
export function getTelegramApiBase(): string {
  refreshEnvFromDisk();
  const raw = (
    process.env.TELEGRAM_API_BASE ||
    process.env.TG_PROXY ||
    process.env.TG_API_BASE ||
    process.env.TELEGRAM_PROXY ||
    ''
  ).trim().replace(/^['"]+|['"]+$/g, '');

  if (!raw) return 'https://api.telegram.org';

  let base = raw;
  if (!/^https?:\/\//i.test(base)) {
    base = 'https://' + base;
  }
  // 过滤多余尾部斜杠与意外附加的 /bot 路径
  base = base.replace(/\/+$/, '').replace(/\/bot$/i, '');
  return base;
}

/**
 * 获取本应用对外提供 Webhook 接收与玩家访问的公网根域名
 */
export function getPublicWebhookUrl(): string {
  refreshEnvFromDisk();
  const explicit = (process.env.WEBHOOK_URL || '').trim();
  if (explicit) return normalizePublicUrl(explicit);

  const envUrl = (process.env.URL || process.env.APP_URL || process.env.SERVER_URL || '').trim();
  if (envUrl) return normalizePublicUrl(envUrl);

  // Fallback: read configured public domain from server_url.txt
  try {
    const serverFilePath = path.resolve(process.cwd(), 'server_url.txt');
    if (fs.existsSync(serverFilePath)) {
      const content = fs.readFileSync(serverFilePath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
          return normalizePublicUrl(trimmed);
        }
      }
    }
  } catch {}

  return '';
}

/**
 * 查询 Telegram 官方当前的 Webhook 详细状态
 */
export async function getTelegramWebhookInfo(token: string): Promise<any> {
  try {
    const apiBase = getTelegramApiBase();
    const res = await fetch(`${apiBase}/bot${token}/getWebhookInfo`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as any;
    if (data && data.ok) {
      botStatus.lastWebhookInfo = data.result;
      return data.result;
    }
    return null;
  } catch (err: any) {
    console.warn('⚠️ [Telegram Bot] 查询 getWebhookInfo 失败 (可能未配置反代或网络波动):', err?.message || err);
    return null;
  }
}

/**
 * 启动 Telegram 长轮询服务 (Long Polling)
 * 通过反代 URL 直连 Telegram getUpdates，国内 Termux / 无代理服务器完美运行！
 */
export async function startTelegramPolling(token: string, broadcast?: Function): Promise<void> {
  if (broadcast) savedBroadcast = broadcast;

  if (activePollingController) {
    try {
      activePollingController.abort();
    } catch {}
    activePollingController = null;
  }

  const controller = new AbortController();
  activePollingController = controller;

  botStatus.mode = 'polling';
  botStatus.pollingActive = true;
  botStatus.lastError = null;

  const apiBase = getTelegramApiBase();

  try {
    const delRes = await fetch(`${apiBase}/bot${token}/deleteWebhook?drop_pending_updates=false`, {
      signal: AbortSignal.timeout(8000),
    });
    const delData = (await delRes.json().catch(() => ({}))) as any;
    if (delData && delData.ok) {
      console.log('🤖 [Telegram Bot] 已注销旧 Webhook，已切换为长轮询模式 (Long Polling)');
    }
  } catch (err: any) {
    console.warn('⚠️ [Telegram Bot] 注销 Webhook 网络提示:', err?.message || err);
  }

  console.log(`🤖 [Telegram Bot] 🚀 长轮询已就绪，正在后台监听 Telegram 消息 (反代: ${apiBase})...`);

  let offset = 0;
  let consecutiveErrors = 0;

  (async () => {
    while (!controller.signal.aborted) {
      try {
        botStatus.lastPollTimestamp = Date.now();
        const currentApiBase = getTelegramApiBase();
        const fetchUrl = `${currentApiBase}/bot${token}/getUpdates?offset=${offset}&timeout=25&allowed_updates=${encodeURIComponent(
          JSON.stringify(['message', 'edited_message', 'channel_post', 'callback_query'])
        )}`;

        const res = await fetch(fetchUrl, {
          signal: AbortSignal.timeout(40000),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          botStatus.lastError = `HTTP ${res.status}: ${errText}`;
          consecutiveErrors++;

          if (res.status === 409) {
            console.warn('⚠️ [Telegram Bot] 检测到冲突 (409 Conflict)，正在重试清理 Webhook 并等待 5 秒...');
            await fetch(`${currentApiBase}/bot${token}/deleteWebhook?drop_pending_updates=false`, {
              signal: AbortSignal.timeout(8000),
            }).catch(() => {});
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }

          const backoff = Math.min(consecutiveErrors * 2000, 15000);
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }

        consecutiveErrors = 0;
        const data = (await res.json()) as any;

        if (data && data.ok && Array.isArray(data.result)) {
          if (data.result.length > 0) {
            console.log(`📥 [Telegram Bot] 收到 ${data.result.length} 条更新，正在执行...`);
          }
          for (const update of data.result) {
            if (controller.signal.aborted) break;
            offset = Math.max(offset, (update.update_id || 0) + 1);

            botStatus.lastMessageTimestamp = Date.now();
            botStatus.processedCount++;

            try {
              await executeTelegramUpdate(update, savedBroadcast || undefined);
            } catch (procErr: any) {
              console.error('[Telegram Bot Polling Process Error]', procErr);
            }
          }
        } else {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err: any) {
        if (controller.signal.aborted) break;
        if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
          continue;
        }
        consecutiveErrors++;
        botStatus.lastError = err?.message || String(err);
        const backoff = Math.min(consecutiveErrors * 2000, 15000);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
    botStatus.pollingActive = false;
  })();
}

/**
 * 停止 Telegram 长轮询服务
 */
export function stopTelegramPolling(): void {
  if (activePollingController) {
    try {
      activePollingController.abort();
    } catch {}
    activePollingController = null;
  }
  botStatus.pollingActive = false;
}

/**
 * 强制同步 Telegram 官方下拉菜单指令清单与聊天菜单按钮 (setMyCommands & setChatMenuButton)
 * 支持多通道触发与自动重试，确保任何设备部署均能 100% 出现 [/] 按钮与 5 排快捷键盘
 */
export async function syncTelegramBotCommands(
  customToken?: string,
  customApiBase?: string
): Promise<{ success: boolean; error?: string }> {
  refreshEnvFromDisk();
  const token = (customToken || process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^['"]+|['"]+$/g, '');
  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN 未在 .env 中设置' };
  }

  const baseApi = customApiBase || getTelegramApiBase();
  const commands = [
    { command: 'start', description: '🚀 启动控制台 & 显示管理员快捷键盘' },
    { command: 'users', description: '👥 查看茶楼全员玩家名册与筹码余额' },
    { command: 'whitelist', description: '📋 查看已授权手机号白名单列表' },
    { command: 'findphone', description: '🔍 输入手机号检索玩家完整档案' },
    { command: 'authphone', description: '📱 添加手机号授权到注册白名单' },
    { command: 'addpoints', description: '➕ 为指定玩家注入充值筹码' },
    { command: 'subpoints', description: '➖ 扣除指定玩家筹码' },
    { command: 'exporttxt', description: '📄 导出全服玩家积分 TXT 榜单' },
    { command: 'broadcast', description: '📢 发布全服牌桌通告' },
  ];

  let lastErr = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // 1. 同步注册底部菜单指令 (setMyCommands)
      const resCmd = await fetch(`${baseApi}/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands }),
        signal: AbortSignal.timeout(8000),
      });
      const dataCmd = (await resCmd.json().catch(() => ({}))) as any;

      // 2. 显式设置聊天菜单按钮类型为指令菜单 (setChatMenuButton)
      await fetch(`${baseApi}/bot${token}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu_button: { type: 'commands' } }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => {});

      if (dataCmd && dataCmd.ok) {
        console.log(`🤖 [Telegram Bot] 已成功同步注册 Telegram 官方菜单指令与菜单按钮 (setMyCommands & setChatMenuButton)`);
        return { success: true };
      } else {
        lastErr = dataCmd?.description || JSON.stringify(dataCmd);
      }
    } catch (e: any) {
      lastErr = e?.message || String(e);
    }
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1200 * attempt));
    }
  }

  console.warn(`⚠️ [Telegram Bot] 同步 setMyCommands 失败 (${baseApi}):`, lastErr);
  return { success: false, error: lastErr };
}

/**
 * 初始化并自动调度 Telegram Bot
 * - 默认运行【纯 Webhook 模式 (只用 Webhook)】：零冲突、零死循环轮询，毫秒级推送直达！
 * - 自动向 Telegram 官方注册 ${URL}/api/telegram/webhook 回调地址
 * - 仅当显式配置 BOT_MODE="polling" 且确无公网域名时才启用备用轮询
 */
export async function initTelegramBotService(broadcast?: Function): Promise<void> {
  if (broadcast) savedBroadcast = broadcast;

  // 1. 动态刷新并强制加载最新的 .env 文件
  refreshEnvFromDisk();

  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^['"]+|['"]+$/g, '');

  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    botStatus = {
      enabled: false,
      mode: 'disabled',
      tokenConfigured: false,
      tokenMasked: '',
      urlConfigured: '',
      pollingActive: false,
      lastPollTimestamp: null,
      lastMessageTimestamp: null,
      processedCount: 0,
      lastError: 'TELEGRAM_BOT_TOKEN 未在 .env 中设置',
    };
    console.log('ℹ️ [Telegram Bot] TELEGRAM_BOT_TOKEN 未在 .env 中设置，跳过 Bot 启动。');
    return;
  }

  const apiBase = getTelegramApiBase();
  const publicAppUrl = getPublicWebhookUrl();

  botStatus.tokenConfigured = true;
  botStatus.tokenMasked = maskToken(token);
  botStatus.enabled = true;
  botStatus.apiBase = apiBase;
  botStatus.urlConfigured = publicAppUrl;

  // 2. 向 Telegram 端点发送 getMe 探测连通性并获取 Bot 身份
  try {
    console.log(`🤖 [Telegram Bot] 正在连接 Telegram API (${apiBase}) 验证 Bot 凭据...`);
    const meRes = await fetch(`${apiBase}/bot${token}/getMe`, {
      signal: AbortSignal.timeout(8000),
    });
    const meData = (await meRes.json().catch(() => ({}))) as any;
    if (meData && meData.ok && meData.result) {
      const me = meData.result;
      botStatus.botUsername = me.username;
      botStatus.botName = me.first_name;
      botStatus.lastError = null;
      console.log(`✅ [Telegram Bot] 机器人身份验证成功！账号: @${me.username} (${me.first_name || '国粹棋牌'})`);

      // 自动向 Telegram 官方注册底部菜单指令 (setMyCommands) 与菜单按钮 (setChatMenuButton)
      syncTelegramBotCommands(token, apiBase).catch(() => {});
    } else {
      const desc = meData?.description || JSON.stringify(meData);
      botStatus.lastError = `Telegram API 返回: ${desc}`;
      console.warn(`⚠️ [Telegram Bot] getMe 验证返回: ${desc}`);
    }
  } catch (err: any) {
    botStatus.lastError = `连接 Telegram API 异常 (${apiBase}): ${err?.message || err}`;
    console.warn(`⚠️ [Telegram Bot] 连接 Telegram API 异常 (${apiBase}):`, err?.message || err);
  }

  // 3. 运行模式判定：只用 Webhook 模式（杜绝轮询死循环与 409 Conflict）
  const botModeEnv = (process.env.BOT_MODE || 'webhook').trim().toLowerCase();
  const isExplicitPolling = botModeEnv === 'polling';

  if (isExplicitPolling) {
    console.log(`ℹ️ [Telegram Bot] 检测到用户显式配置了 BOT_MODE="polling"，启动长轮询模式...`);
    await startTelegramPolling(token, broadcast);
    return;
  }

  // 4. 纯 Webhook 模式 (Pure Webhook Mode)
  // 必须停止任何旧轮询，绝不调用 deleteWebhook，保证 Webhook 的绝对排他与稳定
  stopTelegramPolling();
  botStatus.mode = 'webhook';
  botStatus.pollingActive = false;

  if (!publicAppUrl) {
    botStatus.lastError = '未在 .env 中配置 URL 公网地址，Webhook 回调未登记。';
    console.warn('⚠️ [Telegram Bot] 提示: 未检测到 URL 公网地址。Telegram 仅支持推送消息到公网 HTTPS。');
    console.warn('   若要在本设备使用 Bot，请在 .env 中设置 URL="https://your-public-url" 并访问 /api/telegram/set-webhook 激活。');
    return;
  }

  const webhookUrl = `${publicAppUrl}/api/telegram/webhook`;
  botStatus.webhookUrl = webhookUrl;

  const rawSecret = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim().replace(/^['"]+|['"]+$/g, '');
  const validSecret = /^[A-Za-z0-9_-]{1,256}$/.test(rawSecret) ? rawSecret : '';
  const secretParam = validSecret ? `&secret_token=${encodeURIComponent(validSecret)}` : '';

  const setWebhookUrl = `${apiBase}/bot${token}/setWebhook?url=${encodeURIComponent(
    webhookUrl
  )}${secretParam}&drop_pending_updates=true&allowed_updates=${encodeURIComponent(
    JSON.stringify(['message', 'edited_message', 'channel_post', 'callback_query'])
  )}`;

  console.log(`🤖 [Telegram Bot] 🚀 正在采用【纯 Webhook 模式】向 Telegram 官方登记回调: ${webhookUrl}`);

  try {
    const res = await fetch(setWebhookUrl, { signal: AbortSignal.timeout(8000) });
    const data = (await res.json().catch(() => ({}))) as any;
    if (data && data.ok) {
      botStatus.lastError = null;
      console.log(`✅ [Telegram Bot] 纯 Webhook 注册成功！`);
      console.log(`   • 回调入口: ${webhookUrl}`);
      console.log(`   • 运行优势: 零死循环轮询、零 409 冲突，Telegram 消息推送即时到达，HTTP 响应直接发送！`);
      return;
    } else {
      const errorMsg = data?.description || JSON.stringify(data);
      botStatus.lastError = `Webhook 注册未通过: ${errorMsg}`;
      console.warn(`⚠️ [Telegram Bot] Webhook 注册未通过:`, errorMsg);
    }
  } catch (err: any) {
    botStatus.lastError = `本地连接 Telegram 官方网络超时: ${err?.message || err}`;
    console.warn(`⚠️ [Telegram Bot] 服务端向 Telegram 注册 Webhook 遇到网络超时 (国内常规现象)。`);
    console.log(`💡 [一键激活] 请在能正常访问 Telegram 的手机或电脑浏览器中打开此地址一键激活 Webhook:\n   ${publicAppUrl}/api/telegram/set-webhook`);
  }
}
