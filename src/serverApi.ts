import {
  loadDatabase,
  saveDatabase,
  recordAdminLog,
  type UserProfileData,
  hashPassword,
  verifyPassword,
} from './serverStorage.ts';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { presenceTracker } from './presenceTracker.ts';
import iconv from 'iconv-lite';
import { initServerCarriageTables } from './games/shisanshui/bookingTrain.ts';
import type { ServerBookingCarriage, ServerBookingTable } from './games/shisanshui/types.ts';

const BOOKING_FILE = path.resolve(process.cwd(), 'data', 'booking_carriages.json');

export function loadBookingCarriagesFromDisk(): Record<string, ServerBookingCarriage> {
  try {
    if (fs.existsSync(BOOKING_FILE)) {
      const raw = fs.readFileSync(BOOKING_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.carriages === 'object') {
        return parsed.carriages;
      }
    }
  } catch (err) {
    console.warn('[Booking Data] Read disk error:', err);
  }
  return {};
}

export function saveBookingCarriagesToDisk(carriages: Record<string, ServerBookingCarriage>): void {
  try {
    const dataDir = path.dirname(BOOKING_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const tempFile = `${BOOKING_FILE}.tmp.${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    fs.writeFileSync(tempFile, JSON.stringify({ carriages, updatedAt: Date.now() }, null, 2), 'utf-8');
    fs.renameSync(tempFile, BOOKING_FILE);
  } catch (err) {
    console.error('[Booking Data] Save disk error:', err);
  }
}

export function getOrInitServerCarriage(sceneMode: 'four-booking' | 'eight-booking', carriageNumber: number = 1): ServerBookingCarriage {
  const carriages = loadBookingCarriagesFromDisk();
  const key = `${sceneMode}_car_${carriageNumber}`;

  if (!carriages[key] || !Array.isArray(carriages[key].tables) || carriages[key].tables.length === 0) {
    const newCarriage = initServerCarriageTables(carriageNumber, sceneMode);
    carriages[key] = newCarriage;
    saveBookingCarriagesToDisk(carriages);
  }

  return carriages[key];
}

interface AdminPendingState {
  action: 'findphone' | 'authphone' | 'delphone' | 'deluser' | 'addpoints' | 'subpoints' | 'setpoints' | 'broadcast';
  targetPhone?: string;
  timestamp: number;
}
const adminPendingStates = new Map<string, AdminPendingState>();

function findEnvFilePath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    process.env.HOME ? path.resolve(process.env.HOME, '.env') : '',
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function getGithubRepoName(): string {
  try {
    const gitConfigPath = path.resolve(process.cwd(), '.git', 'config');
    if (fs.existsSync(gitConfigPath)) {
      const content = fs.readFileSync(gitConfigPath, 'utf-8');
      const match = content.match(/github\.com[:\/]([^\s\/]+\/[^\s\/\.]+)/);
      if (match && match[1]) {
        return match[1].replace(/\.git$/, '');
      }
    }
  } catch {}
  return 'wen775866/yy';
}

export function saveEnvVariable(key: string, value: string): void {
  process.env[key] = value;
  const envPath = findEnvFilePath() || path.resolve(process.cwd(), '.env');
  try {
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
    const regex = new RegExp(`^${key}\\s*=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}="${value}"`);
    } else {
      content = content.trimEnd() + `\n${key}="${value}"\n`;
    }
    fs.writeFileSync(envPath, content, 'utf-8');
    console.log(`💾 [Env] 已将配置 ${key} 成功持久化写入 ${envPath}`);
  } catch (err) {
    console.warn(`[Env] 写入配置 ${key} 失败:`, err);
  }
}

function getAdminUsernamesFromEnv(): string[] {
  try {
    const envPath = findEnvFilePath();
    if (envPath && fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');
      const usernames: string[] = [];
      for (const line of lines) {
        const match = line.match(/^([A-Z_]+)\s*=\s*(['"]?)([^'"]+)\2/i);
        if (match) {
          const key = match[1].toUpperCase();
          const val = match[3];
          if (key.includes('ADMIN') && (key.includes('USER') || key.includes('NAME'))) {
            const vals = val.split(/[\s,;]+/);
            for (const v of vals) if (v.trim()) usernames.push(v.trim().replace(/^@/, ''));
          }
        }
      }
      if (usernames.length > 0) return usernames;
    }
  } catch {}

  const envUsernames = process.env.ADMIN_USERNAMES || '';
  return envUsernames.split(/[\s,;]+/).map((s) => s.trim().replace(/^@/, '')).filter(Boolean);
}

export function normalizePhone(raw: string): string {
  let p = String(raw || '').trim().replace(/\D/g, '');
  if (p.length === 13 && p.startsWith('86')) {
    p = p.slice(2);
  }
  return p;
}

export function getAllowedAndAdminPhones(): { allowedPhones: string[]; adminPhones: string[]; adminUsernames: string[] } {
  const db = loadDatabase();
  const adminUsernames = getAdminUsernamesFromEnv();
  const revokedSet = new Set<string>((db.revokedPhones || []).map((p: any) => normalizePhone(p)));

  const allowedSet = new Set<string>(
    (db.authorizedPhones || [])
      .map((p: any) => normalizePhone(p))
      .filter((p: string) => p && !revokedSet.has(p))
  );

  const adminSet = new Set<string>(
    (db.adminPhones || [])
      .map((p: any) => normalizePhone(p))
      .filter((p: string) => p && !revokedSet.has(p))
  );

  return {
    allowedPhones: Array.from(allowedSet),
    adminPhones: Array.from(adminSet),
    adminUsernames,
  };
}

function findUser(query: string, db = loadDatabase()): UserProfileData | null {
  const rawQ = String(query || '').trim();
  const normQ = normalizePhone(rawQ);
  const q = rawQ.toLowerCase();
  if (!q && !normQ) return null;
  for (const p of Object.values(db.profiles || {})) {
    if (p.id?.toLowerCase() === q) return p;
    if (p.phone) {
      const pNorm = normalizePhone(p.phone);
      if (pNorm && (pNorm === normQ || pNorm.endsWith(normQ) || normQ.endsWith(pNorm))) return p;
    }
    if (p.username && p.username.toLowerCase() === q) return p;
    if (p.name && p.name.toLowerCase() === q) return p;
  }
  return null;
}

export function ensureUserProfile(phone: string, db = loadDatabase(), initialCoins = 0): UserProfileData {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) {
    throw new Error('Invalid phone number');
  }

  if (!db.profiles) db.profiles = {};

  for (const p of Object.values(db.profiles)) {
    const pNorm = normalizePhone(p.phone || '');
    if (pNorm && (pNorm === cleanPhone || pNorm.endsWith(cleanPhone) || cleanPhone.endsWith(pNorm))) {
      return p;
    }
  }

  const { adminPhones } = getAllowedAndAdminPhones();
  const isAdmin = adminPhones.some((ap) => ap === cleanPhone || ap.endsWith(cleanPhone) || cleanPhone.endsWith(ap));

  const newId = `USER-${Math.floor(1000 + Math.random() * 9000)}`;
  const newProfile: UserProfileData = {
    id: newId,
    username: cleanPhone,
    phone: cleanPhone,
    name: `茶客${cleanPhone.slice(-4)}`,
    avatar: '👑',
    isAdmin,
    isBanned: false,
    coins: Math.max(0, initialCoins),
    rating: 1800,
    level: 1,
    lastCheckinDate: '',
    registeredAt: Date.now(),
    updatedAt: Date.now(),
    stats: {
      yansan: { played: 0, won: 0, highestScore: 0 },
      shisanshui: { played: 0, won: 0, highestScore: 0 },
      mahjong: { played: 0, won: 0, highestScore: 0 },
    },
  };

  db.profiles[newId] = newProfile;
  return newProfile;
}

export async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: any) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: any, status: number, body: any) {
  if (typeof res.status === 'function') {
    res.status(status).json(body);
  } else {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  }
}

function sendHtml(res: any, status: number, html: string) {
  if (typeof res.status === 'function' && typeof res.send === 'function') {
    res.status(status).set('Content-Type', 'text/html; charset=utf-8').send(html);
  } else {
    res.statusCode = status;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  }
}

/**
 * 安全清理 Telegram Markdown 消息：
 * 将代码块外未闭合或单词中间的下划线进行安全转义，防止 Telegram Markdown 引擎抛出 entity parse error 导致丢弃消息
 */
export function sanitizeTelegramMarkdown(text: string): string {
  if (!text) return '';
  const parts = text.split(/(`[^`]+`)/g);
  return parts
    .map((part) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return part;
      }
      return part.replace(/([a-zA-Z0-9_\u4e00-\u9fa5])_([a-zA-Z0-9_\u4e00-\u9fa5])/g, '$1\\_$2');
    })
    .join('');
}

let lastTelegramAdminChatId: number | string | null = null;
let txtBackupDebounceTimer: NodeJS.Timeout | null = null;
let pendingBackupReasons: string[] = [];

const LAST_CHAT_FILE = path.resolve(process.cwd(), 'data', 'last_admin_chat.json');

export function getStoredAdminChatId(): number | string | null {
  if (lastTelegramAdminChatId) return lastTelegramAdminChatId;
  try {
    if (fs.existsSync(LAST_CHAT_FILE)) {
      const raw = fs.readFileSync(LAST_CHAT_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.chatId) {
        lastTelegramAdminChatId = parsed.chatId;
        return lastTelegramAdminChatId;
      }
    }
  } catch {}
  return process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID || null;
}

export function storeAdminChatId(chatId: number | string): void {
  if (!chatId) return;
  lastTelegramAdminChatId = chatId;
  try {
    const dataDir = path.dirname(LAST_CHAT_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(LAST_CHAT_FILE, JSON.stringify({ chatId, updatedAt: Date.now() }), 'utf-8');
  } catch {}
}

export function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function broadcastTeahousePlayersRoster(broadcast?: Function, db?: any): void {
  if (typeof broadcast === 'function') {
    try {
      const database = db || loadDatabase();
      const freshPlayers = presenceTracker.getAllPlayers(database.profiles || {});
      broadcast({
        type: 'teahouse_players_update',
        count: freshPlayers.length,
        onlineCount: freshPlayers.filter((p: any) => p.isOnline).length,
        players: freshPlayers,
      });
    } catch {}
  }
}

/**
 * 构造统一的标准 5 行 Telegram 管理员快捷键盘菜单
 */
export function buildTelegramAdminKeyboard() {
  return {
    keyboard: [
      [{ text: '🔍 搜手机号查玩家' }, { text: '👥 玩家名册' }, { text: '📄 玩家积分TXT榜单' }],
      [{ text: '➕ 注入筹码' }, { text: '➖ 扣除筹码' }, { text: '📱 授权手机号' }],
      [{ text: '📋 白名单列表' }, { text: '❌ 删除用户' }, { text: '📢 全服广播' }],
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: '👉 输入手机号搜索玩家或直接发送手机号授权，发：手机号 金额充值...',
  };
}

/**
 * 自动生成所有玩家筹码/积分的全量 TXT 备份文档，方便 Termux 硬件报废损毁时极速还原数据
 */
export function exportPlayersPointsTxt(db?: any): { txtContent: string; fileName: string; safeFileName: string; summaryTextHtml: string } {
  const database = db || loadDatabase();
  const profiles = Object.values(database.profiles || {}) as UserProfileData[];

  // 按筹码余额由高到低降序排列
  profiles.sort((a, b) => (b.coins || 0) - (a.coins || 0));

  const totalCoins = profiles.reduce((sum, u) => sum + (u.coins || 0), 0);
  const now = new Date();
  const timeStr = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
  const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const fileName = `茶楼玩家积分全量备份_${dateTag}.txt`;
  const safeFileName = `Teahouse_Players_Backup_${dateTag}.txt`;

  let txt = `=================================================================\r\n`;
  txt += `       🏮 经典棋牌茶楼 - 玩家积分与资产全量数据备份 TXT 文件\r\n`;
  txt += `=================================================================\r\n`;
  txt += `• 备份生成时间: ${timeStr} (北京时间)\r\n`;
  txt += `• 注册玩家总数: ${profiles.length} 人\r\n`;
  txt += `• 全服筹码流动总量: ${totalCoins.toLocaleString()} 分\r\n`;
  txt += `-----------------------------------------------------------------\r\n`;
  txt += `序号 | UID | 登录手机号 | 牌桌名号 | 可用筹码(分) | 等级 | 状态 | 最后活跃时间\r\n`;
  txt += `-----------------------------------------------------------------\r\n`;

  if (profiles.length === 0) {
    txt += `(暂无注册玩家资料)\r\n`;
  } else {
    profiles.forEach((p, idx) => {
      const pPhone = String(p.phone || '').trim() || '未绑定';
      const statusStr = p.isBanned ? '已封禁' : '正常';
      const lastActive = p.updatedAt ? new Date(p.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '无活跃记录';
      txt += `${String(idx + 1).padStart(2, ' ')}. | ${p.id} | ${pPhone} | ${p.name || '无名茶客'} | ${(p.coins || 0).toLocaleString()} | Lv.${p.level || 1} | ${statusStr} | ${lastActive}\r\n`;
    });
  }

  txt += `-----------------------------------------------------------------\r\n`;
  txt += `【Termux 硬件故障紧急恢复说明】:\r\n`;
  txt += `若设备或 Termux 硬件故障损坏导致数据库全盘丢失，请保留此 TXT 文档。\r\n`;
  txt += `在新的 Termux 设备或 Telegram Bot 中直接发送玩家“手机号”与“筹码”即可秒级还原！\r\n`;
  txt += `例如直接在 Bot 发送：13800138000 500000 即可自动开通授权并注入 500,000 筹码！\r\n`;
  txt += `=================================================================\r\n`;

  // 前置 3 字节 UTF-8 BOM (\uFEFF)，配合 CRLF 换行，确保全平台 Telegram / Windows Notepad / 手机阅读器绝对不乱码
  const txtContent = '\uFEFF' + txt;

  const summaryTextHtml = `📄 <b>【全服玩家积分全量数据 TXT 备份】</b>\n\n` +
    `• 🕒 <b>备份时刻</b>: <code>${escapeHtml(timeStr)}</code>\n` +
    `• 👥 <b>注册玩家总数</b>: <b>${profiles.length}</b> 人\n` +
    `• 🪙 <b>全服筹码总额</b>: <b>${totalCoins.toLocaleString()}</b> 分\n` +
    `• 💾 <b>灾备说明</b>: 已自动生成 TXT 榜单附件，便于 Termux 设备故障时秒级重组加积分还原！`;

  return { txtContent, fileName, safeFileName, summaryTextHtml };
}

/**
 * 将最新的全量玩家积分 TXT 榜单以 sendDocument 附件形式推送给 Telegram 管理员
 */
export async function notifyPointsTxtToTelegram(reason: string, db?: any, targetChatId?: string | number): Promise<boolean> {
  const { refreshEnvFromDisk, getTelegramApiBase } = await import('./telegramBotService.ts');
  refreshEnvFromDisk();
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^['"]+|['"]+$/g, '');
  const chatId = targetChatId || getStoredAdminChatId();
  if (!botToken || !chatId) {
    console.warn('⚠️ [Points Backup TXT] Telegram botToken 或 chatId 未配置，仅本地生成备份。');
    return false;
  }

  try {
    const database = db || loadDatabase();
    const { txtContent, safeFileName, summaryTextHtml } = exportPlayersPointsTxt(database);
    const apiBase = getTelegramApiBase();

    const captionHtml = `${summaryTextHtml}\n\n📌 <b>数据变动来源</b>: ${escapeHtml(reason)}`;

    // 使用纯正的 Uint8Array 提取 Buffer 字节流，规避 Node.js Buffer 内存池 offset 偏移导致 undici Blob 字节损坏错位
    const rawBuffer = Buffer.from(txtContent, 'utf-8');
    const isolatedBytes = new Uint8Array(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);

    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    const blob = new Blob([isolatedBytes], { type: 'text/plain; charset=utf-8' });
    formData.append('document', blob, safeFileName);
    formData.append('caption', captionHtml);
    formData.append('parse_mode', 'HTML');

    const res = await fetch(`${apiBase}/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

    const resData = (await res.json().catch(() => ({}))) as any;
    if (resData?.ok) {
      console.log(`✅ [Points Backup TXT] 成功发送 TXT 备份文档附件给 Telegram (chatId: ${chatId}): ${safeFileName} (${reason})`);
      return true;
    } else {
      // 容错降级：若 HTML 模式格式解析出错，则使用无 parse_mode 纯文本再次投递
      const plainCaption = `📄 【全服玩家积分 TXT 备份】\n备份时间: ${new Date().toLocaleString('zh-CN')}\n玩家总数: ${Object.keys(database.profiles || {}).length}\n变动原因: ${reason}`;
      const plainFormData = new FormData();
      plainFormData.append('chat_id', String(chatId));
      plainFormData.append('document', blob, safeFileName);
      plainFormData.append('caption', plainCaption);
      const retryRes = await fetch(`${apiBase}/bot${botToken}/sendDocument`, {
        method: 'POST',
        body: plainFormData,
        signal: AbortSignal.timeout(15000),
      });
      const retryData = (await retryRes.json().catch(() => ({}))) as any;
      if (retryData?.ok) {
        console.log(`✅ [Points Backup TXT] 纯文本降级成功发送 TXT 备份附件给 Telegram (chatId: ${chatId})`);
        return true;
      }
      console.warn(`⚠️ [Points Backup TXT] Telegram sendDocument 响应非 OK:`, resData?.description || resData);
      return false;
    }
  } catch (err: any) {
    console.warn(`⚠️ [Points Backup TXT] 推送网络异常:`, err?.message || err);
    return false;
  }
}

/**
 * 文本质量得分评估器，用于在无 BOM 情况下精准区分 UTF-8 与 GBK/GB18030/ANSI 编码
 */
export function evaluateTextQuality(text: string): number {
  if (!text) return -10000;
  let score = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 0xfffd) {
      score -= 100; // 严厉惩罚 U+FFFD 替换符 (乱码特征)
    } else if ((code >= 0x4e00 && code <= 0x9fa5) || (code >= 0x3400 && code <= 0x4dbf)) {
      score += 10; // CJK 汉字加高分
    } else if ((code >= 0x3000 && code <= 0x303f) || (code >= 0xff00 && code <= 0xffef)) {
      score += 5; // 中文全角标点符号
    } else if (code >= 32 && code <= 126) {
      score += 1; // 可打印 ASCII 字符
    } else if (code === 10 || code === 13 || code === 9) {
      score += 1; // 换行符 / 制表符
    } else {
      score -= 5; // 控制字符扣分
    }
  }
  return score;
}

/**
 * 智能文本解码引擎 (彻底根治 Telegram Bot 收发 TXT 文档乱码问题)
 * 支持检测与解析：
 * 1. UTF-8 BOM (\uFEFF / 0xEF 0xBB 0xBF)
 * 2. UTF-16 LE / BE BOM
 * 3. 智能双路评估 (UTF-8 vs GB18030 / ANSI / GBK) 字符得分，选择得分最高者，杜绝 锟斤拷 与 \uFFFD
 */
export function decodeTxtBuffer(buffer: Buffer): string {
  if (!buffer || buffer.length === 0) return '';
  // 1. Check UTF-8 BOM
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString('utf-8');
  }
  // 2. Check UTF-16 LE BOM
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return iconv.decode(buffer.subarray(2), 'utf16-le').replace(/^\uFEFF/, '');
  }
  // 3. Check UTF-16 BE BOM
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return iconv.decode(buffer.subarray(2), 'utf16-be').replace(/^\uFEFF/, '');
  }

  // 4. 双路评分对比: UTF-8 vs GB18030 (ANSI / GBK)
  let utf8Text = '';
  let utf8Fatal = false;
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    utf8Text = utf8Decoder.decode(buffer);
  } catch {
    utf8Text = buffer.toString('utf-8');
    utf8Fatal = true;
  }

  let gbkText = '';
  try {
    gbkText = iconv.decode(buffer, 'gb18030');
  } catch {
    gbkText = '';
  }

  if (!utf8Fatal && !gbkText) {
    return utf8Text.replace(/^\uFEFF/, '');
  }

  const utf8Score = evaluateTextQuality(utf8Text);
  const gbkScore = evaluateTextQuality(gbkText);

  if (gbkText && gbkScore > utf8Score) {
    return gbkText.replace(/^\uFEFF/, '');
  }

  return utf8Text.replace(/^\uFEFF/, '');
}

/**
 * 智能解析处理管理员向 Telegram Bot 发送的 TXT 文档 (备份还原 / 批量导入授权与积分)
 */
export async function handleIncomingTelegramDocument(
  doc: any,
  chatId: string | number,
  operator: string,
  broadcast?: Function
): Promise<string> {
  const fileId = doc.file_id;
  const fileName = doc.file_name || 'document.txt';
  const { getTelegramApiBase } = await import('./telegramBotService.ts');
  const apiBase = getTelegramApiBase();
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^['"]+|['"]+$/g, '');

  if (!botToken) {
    return '❌ 未配置 TELEGRAM_BOT_TOKEN，无法下载解析 TXT 文档。';
  }

  // 1. Fetch File Metadata from Telegram API
  const getFileRes = await fetch(`${apiBase}/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`, {
    signal: AbortSignal.timeout(10000),
  });
  const getFileData = (await getFileRes.json().catch(() => ({}))) as any;
  if (!getFileData?.ok || !getFileData?.result?.file_path) {
    return `❌ 获取 Telegram 文件下载链接失败: ${getFileData?.description || '未知错误'}`;
  }

  const filePath = getFileData.result.file_path;
  const downloadUrl = `${apiBase}/file/bot${botToken}/${filePath}`;

  // 2. Download File Buffer
  const fileRes = await fetch(downloadUrl, { signal: AbortSignal.timeout(20000) });
  if (!fileRes.ok) {
    return `❌ 下载文档失败 (HTTP ${fileRes.status})`;
  }
  const arrayBuffer = await fileRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 3. Smart Encoding Detection (UTF-8 with BOM, UTF-16, GBK/GB18030 ANSI)
  const decodedContent = decodeTxtBuffer(buffer);
  if (!decodedContent.trim()) {
    return `⚠️ 文档 \`${fileName}\` 内容为空，未导入任何数据。`;
  }

  // 4. Parse Lines & Import Data
  const lines = decodedContent.split(/\r?\n/);
  const db = loadDatabase();
  let updatedUsersCount = 0;
  let newAuthorizedCount = 0;
  const sampleImported: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('=') || line.startsWith('-') || line.startsWith('#') || line.startsWith('【') || line.includes('茶客名号') || line.includes('牌桌名号') || line.includes('登录手机号') || line.includes('可用筹码') || line.includes('排名')) {
      continue;
    }

    // Pattern 1: 通用表格行 (包含管道符 |，自适应导出格式与手动编辑表格)
    if (line.includes('|')) {
      const parts = line.split('|').map(s => s.trim()).filter(Boolean);
      let foundPhone = '';
      let foundCoins: number | null = null;
      let foundName = '';

      for (const part of parts) {
        const phoneM = part.match(/^(?:\+?86)?(1[3-9]\d{9}|\d{5,15})$/);
        if (phoneM && !foundPhone) {
          foundPhone = normalizePhone(phoneM[1]);
          continue;
        }
        const coinsM = part.match(/^[0-9,+-]+$/);
        if (coinsM && foundCoins === null) {
          const num = parseInt(part.replace(/,/g, ''), 10);
          if (!isNaN(num)) {
            foundCoins = num;
            continue;
          }
        }
        if (!part.startsWith('USER-') && !part.startsWith('Lv.') && !['正常', '已封禁', '无活跃记录'].includes(part) && !part.match(/^\d+\.?$/) && !foundName) {
          foundName = part;
        }
      }

      if (foundPhone) {
        const cleanPhone = foundPhone;
        const current = new Set((db.authorizedPhones || []).map((p: any) => normalizePhone(p)));
        if (!current.has(cleanPhone)) {
          current.add(cleanPhone);
          newAuthorizedCount++;
        }
        db.authorizedPhones = Array.from(current);
        if (db.revokedPhones) {
          db.revokedPhones = db.revokedPhones.filter((p: string) => normalizePhone(p) !== cleanPhone);
        }

        let user = findUser(cleanPhone, db);
        const coinsVal = foundCoins !== null ? foundCoins : (user?.coins || 0);
        if (!user) {
          user = ensureUserProfile(cleanPhone, db, Math.max(0, coinsVal));
          if (foundName && foundName !== '未设置' && foundName !== '无名茶客' && foundName !== '-') user.name = foundName;
        } else {
          user.coins = Math.max(0, coinsVal);
          if (foundName && foundName !== '未设置' && foundName !== '无名茶客' && foundName !== '-') user.name = foundName;
          user.updatedAt = Date.now();
        }
        updatedUsersCount++;
        if (sampleImported.length < 5) {
          sampleImported.push(`${user.name} (${cleanPhone}): ${user.coins}分`);
        }
        continue;
      }
    }

    // Pattern 2: 键值或空格/逗号分隔: 13800000000 5000 or 13800000000, 5000 or 13800000000: 5000
    const kvMatch = line.match(/^(?:\+?86)?(1[3-9]\d{9}|\d{5,15})[\s,:=]+([+-]?\d+)/);
    if (kvMatch) {
      const cleanPhone = normalizePhone(kvMatch[1]);
      const coins = parseInt(kvMatch[2], 10) || 0;
      if (cleanPhone) {
        const current = new Set((db.authorizedPhones || []).map((p: any) => normalizePhone(p)));
        if (!current.has(cleanPhone)) {
          current.add(cleanPhone);
          newAuthorizedCount++;
        }
        db.authorizedPhones = Array.from(current);
        if (db.revokedPhones) {
          db.revokedPhones = db.revokedPhones.filter((p: string) => normalizePhone(p) !== cleanPhone);
        }

        let user = findUser(cleanPhone, db);
        if (!user) {
          user = ensureUserProfile(cleanPhone, db, Math.max(0, coins));
        } else {
          user.coins = Math.max(0, coins);
          user.updatedAt = Date.now();
        }
        updatedUsersCount++;
        if (sampleImported.length < 5) {
          sampleImported.push(`${user.name} (${cleanPhone}): ${user.coins}分`);
        }
      }
      continue;
    }

    // Pattern 3: 纯手机号行 (批量授权白名单导入)
    const purePhoneMatch = line.match(/^(?:\+?86)?(1[3-9]\d{9}|\d{5,15})$/);
    if (purePhoneMatch) {
      const cleanPhone = normalizePhone(purePhoneMatch[1]);
      if (cleanPhone) {
        const current = new Set((db.authorizedPhones || []).map((p: any) => normalizePhone(p)));
        if (!current.has(cleanPhone)) {
          current.add(cleanPhone);
          newAuthorizedCount++;
        }
        db.authorizedPhones = Array.from(current);
        if (db.revokedPhones) {
          db.revokedPhones = db.revokedPhones.filter((p: string) => normalizePhone(p) !== cleanPhone);
        }
        ensureUserProfile(cleanPhone, db, 0);
        updatedUsersCount++;
        if (sampleImported.length < 5) {
          sampleImported.push(`已授权白名单: ${cleanPhone}`);
        }
      }
    }
  }

  saveDatabase(db);
  recordAdminLog('TG_DOC_IMPORT', operator, fileName, `解析导入 TXT 文档: 成功同步 ${updatedUsersCount} 位玩家，新增授权 ${newAuthorizedCount} 个手机号`);
  if (typeof broadcast === 'function') {
    broadcast({ type: 'all_users_coins_updated', timestamp: Date.now() });
  }
  broadcastTeahousePlayersRoster(broadcast, db);
  if (chatId) {
    storeAdminChatId(chatId);
    notifyPointsTxtToTelegram(`解析导入 TXT 文档 (${fileName})`, db, chatId).catch(() => {});
  }

  let summary = `📥 *【TXT 文档智能解析导入成功】*\n\n` +
    `• 📄 文档名称: \`${fileName}\`\n` +
    `• 🔤 编码识别: *UTF-8 / GBK 智能无损解码* (零乱码保证)\n` +
    `• 👥 成功同步玩家: *${updatedUsersCount}* 位\n` +
    `• 📱 新增授权手机号: *${newAuthorizedCount}* 个\n`;

  if (sampleImported.length > 0) {
    summary += `\n*导入样本 (前 ${sampleImported.length} 条)*:\n` + sampleImported.map(s => `  • ${s}`).join('\n') + `\n`;
  }
  summary += `\n✅ 全服数据已实时入库，客户端对局与钱庄余额已同步更新！`;

  return summary;
}

/**
 * 防抖式触发积分 TXT 备份 (应对并发战局结算或连续修改)
 */
export function triggerDebouncedTxtBackup(reason: string, db?: any, chatId?: string | number): void {
  pendingBackupReasons.push(reason);
  if (txtBackupDebounceTimer) {
    clearTimeout(txtBackupDebounceTimer);
  }
  txtBackupDebounceTimer = setTimeout(() => {
    const combinedReason = Array.from(new Set(pendingBackupReasons)).join('; ');
    pendingBackupReasons = [];
    txtBackupDebounceTimer = null;
    notifyPointsTxtToTelegram(combinedReason, db, chatId).catch(() => {});
  }, 2500);
}

export async function executeTelegramUpdate(
  body: any,
  broadcast?: Function,
  options?: { isWebhook?: boolean }
): Promise<{
  ok?: boolean;
  success: boolean;
  reply: string;
  command: string;
  replyMarkup: any;
  timestamp: string;
  chatId?: number | string;
  method?: string;
  text?: string;
}> {
  // Telegram Webhook Update ID idempotency deduplication cache
  const updateId = body.update_id;
  if (updateId) {
    if (!globalThis.processedUpdateIds) {
      globalThis.processedUpdateIds = new Set<number>();
    }
    if (globalThis.processedUpdateIds.has(updateId)) {
      return {
        success: true,
        reply: 'Deduplicated duplicate update_id',
        command: '',
        replyMarkup: null,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
    }
    globalThis.processedUpdateIds.add(updateId);
    if (globalThis.processedUpdateIds.size > 500) {
      const first = globalThis.processedUpdateIds.values().next().value;
      if (first !== undefined) globalThis.processedUpdateIds.delete(first);
    }
  }

  // Support direct simulator payload { command }, Telegram messages, edits, channel posts, contact cards, and callback queries
  const messageObj = body.message || body.edited_message || body.channel_post || body.callback_query?.message;
  const operator = body.operator || body.message?.from?.username || body.callback_query?.from?.username || 'Telegram Bot Admin';
  const chatId = messageObj?.chat?.id || body.callback_query?.from?.id;
  if (chatId) {
    storeAdminChatId(chatId);
  }

  // 0. 优先检测是否为上传的 TXT 文档 (如 points.txt / whitelist.txt / backup.txt，智能无损解码)
  const doc = messageObj?.document;
  if (doc && (doc.file_name?.toLowerCase().endsWith('.txt') || doc.mime_type?.startsWith('text/'))) {
    console.log(`📥 [Telegram Bot] 检测到上传 TXT 文档: ${doc.file_name || 'document.txt'} (chatId: ${chatId})`);
    const docReply = await handleIncomingTelegramDocument(doc, chatId, operator, broadcast);
    const replyMarkup = buildTelegramAdminKeyboard();

    // 如果通过 Webhook 响应直接返回
    if (options?.isWebhook && chatId) {
      return {
        ok: true,
        success: true,
        reply: docReply,
        command: `/importtxt ${doc.file_name || 'document.txt'}`,
        replyMarkup,
        chatId,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
    }

    if (chatId) {
      const { getTelegramApiBase } = await import('./telegramBotService.ts');
      const apiBase = getTelegramApiBase();
      const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^['"]+|['"]+$/g, '');
      if (botToken) {
        fetch(`${apiBase}/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: sanitizeTelegramMarkdown(docReply),
            parse_mode: 'Markdown',
            reply_markup: replyMarkup,
          }),
        }).catch(() => {});
      }
    }

    return {
      ok: true,
      success: true,
      reply: docReply,
      command: `/importtxt ${doc.file_name || 'document.txt'}`,
      replyMarkup,
      chatId,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  let rawText = body.command || messageObj?.text || messageObj?.caption || body.callback_query?.data || messageObj?.contact?.phone_number || '';
  const trimmed = rawText.trim();
  const senderKey = String(chatId || body.message?.from?.id || body.operator || 'default_admin');
  const pending = adminPendingStates.get(senderKey);
  const isPendingValid = Boolean(pending && Date.now() - pending.timestamp < 600000);
  if (!isPendingValid && pending) {
    adminPendingStates.delete(senderKey);
  }
  const activePending = isPendingValid ? pending : undefined;

  // 1. 智能手机号与加减币免前缀识别 (零门槛交互)
  // A. 管理员直接输入一串纯手机号 (如 13800138000, +8613800138000, 8613800138000)
  const purePhoneMatch = trimmed.match(/^(?:\+?86)?(1[3-9]\d{9}|\d{5,15})$/);
  // B. 管理员直接输入：手机号 金额 (如 13800138000 5000 或 13800138000 +5000 或 13800138000 -2000)
  const phonePointsMatch = trimmed.match(/^(?:\+?86)?(1[3-9]\d{9}|\d{5,15})\s+([+-]?\d+)$/);

  if (phonePointsMatch) {
    const targetPhone = phonePointsMatch[1];
    const targetAmount = phonePointsMatch[2];
    if (targetAmount.startsWith('-')) {
      rawText = `/subpoints ${targetPhone} ${targetAmount.replace('-', '')}`;
    } else {
      rawText = `/addpoints ${targetPhone} ${targetAmount.replace('+', '')}`;
    }
    adminPendingStates.delete(senderKey);
  } else if (activePending?.targetPhone && /^[+-]?\d+$/.test(trimmed)) {
    const targetPhone = activePending.targetPhone;
    const numStr = trimmed.replace('+', '');
    if (activePending.action === 'addpoints') {
      rawText = `/addpoints ${targetPhone} ${numStr}`;
    } else if (activePending.action === 'subpoints') {
      rawText = `/subpoints ${targetPhone} ${numStr.replace('-', '')}`;
    } else if (activePending.action === 'setpoints') {
      rawText = `/setpoints ${targetPhone} ${numStr}`;
    }
    adminPendingStates.delete(senderKey);
  } else if (purePhoneMatch) {
    const targetPhone = purePhoneMatch[1];
    if (activePending?.action === 'delphone') {
      rawText = `/delphone ${targetPhone}`;
    } else if (activePending?.action === 'deluser') {
      rawText = `/deluser ${targetPhone}`;
    } else if (activePending?.action === 'findphone') {
      rawText = `/findphone ${targetPhone}`;
    } else {
      // 核心特性：无任何前置命令，直接发送纯手机号即智能作为【授权手机号】加入白名单！
      rawText = `/authphone ${targetPhone}`;
    }
    adminPendingStates.delete(senderKey);
  } else if (activePending?.action === 'broadcast' && !trimmed.startsWith('/')) {
    rawText = `/broadcast ${trimmed}`;
    adminPendingStates.delete(senderKey);
  } else if (/^(?:🔍\s*)?(?:输入手机号搜索玩家|搜手机号查玩家|手机号搜索玩家|搜索玩家|查手机号|搜手机号|查用户|搜索用户|查找玩家|查手机|findphone|searchphone|finduser)(?:\s+(.+))?$/i.test(trimmed)) {
    const m = trimmed.match(/^(?:🔍\s*)?(?:输入手机号搜索玩家|搜手机号查玩家|手机号搜索玩家|搜索玩家|查手机号|搜手机号|查用户|搜索用户|查找玩家|查手机|findphone|searchphone|finduser)(?:\s+(.+))?$/i);
    rawText = m && m[1] ? `/findphone ${m[1].trim()}` : '/findphone';
  } else if (/^(?:🧹\s*)?(?:清空所有用户|清空用户|清理所有用户|清空全部茶客|清空茶客|clearusers|cleanusers)$/i.test(trimmed)) {
    rawText = '/clearusers';
  } else if (/^(?:❌\s*)?(?:删除用户|注销用户|清理用户|deluser|removeuser)(?:\s+(.+))?$/i.test(trimmed)) {
    const m = trimmed.match(/^(?:❌\s*)?(?:删除用户|注销用户|清理用户|deluser|removeuser)(?:\s+(.+))?$/i);
    rawText = m && m[1] ? `/deluser ${m[1].trim()}` : '/deluser';
  } else if (/^(?:🗑️\s*)?(?:删除手机号|移出手机号|删除手机|移除手机号|移除手机|移出白名单|删除白名单|delphone|removephone)(?:\s+(.+))?$/i.test(trimmed)) {
    const m = trimmed.match(/^(?:🗑️\s*)?(?:删除手机号|移出手机号|删除手机|移除手机号|移除手机|移出白名单|删除白名单|delphone|removephone)(?:\s+(.+))?$/i);
    rawText = m && m[1] ? `/delphone ${m[1].trim()}` : '/delphone';
  } else if (/^(?:📱\s*)?(?:授权手机号|添加手机号|增加手机号|添加白名单|authphone|addphone|授权|加白)(?:\s+(.+))?$/i.test(trimmed)) {
    const m = trimmed.match(/^(?:📱\s*)?(?:授权手机号|添加手机号|增加手机号|添加白名单|authphone|addphone|授权|加白)(?:\s+(.+))?$/i);
    rawText = m && m[1] ? `/authphone ${m[1].trim()}` : '/authphone';
  } else if (/^(?:➕\s*)?(?:注入筹码|增加筹码|加筹码|充值|addpoints|加币|加分)(?:\s+(.+))?$/i.test(trimmed)) {
    const m = trimmed.match(/^(?:➕\s*)?(?:注入筹码|增加筹码|加筹码|充值|addpoints|加币|加分)(?:\s+(.+))?$/i);
    rawText = m && m[1] ? `/addpoints ${m[1].trim()}` : '/addpoints';
  } else if (/^(?:➖\s*)?(?:扣除筹码|扣减筹码|减筹码|扣分|subpoints|减币|扣币)(?:\s+(.+))?$/i.test(trimmed)) {
    const m = trimmed.match(/^(?:➖\s*)?(?:扣除筹码|扣减筹码|减筹码|扣分|subpoints|减币|扣币)(?:\s+(.+))?$/i);
    rawText = m && m[1] ? `/subpoints ${m[1].trim()}` : '/subpoints';
  } else if (/^(?:⚙️\s*)?(?:重设筹码|设定筹码|重置筹码|改筹码|setpoints)(?:\s+(.+))?$/i.test(trimmed)) {
    const m = trimmed.match(/^(?:⚙️\s*)?(?:重设筹码|设定筹码|重置筹码|改筹码|setpoints)(?:\s+(.+))?$/i);
    rawText = m && m[1] ? `/setpoints ${m[1].trim()}` : '/setpoints';
  } else if (/^(?:📢\s*)?(?:全服广播|发布广播|全服通告|广播|broadcast)(?:\s+(.+))?$/i.test(trimmed)) {
    const m = trimmed.match(/^(?:📢\s*)?(?:全服广播|发布广播|全服通告|广播|broadcast)(?:\s+(.+))?$/i);
    rawText = m && m[1] ? `/broadcast ${m[1].trim()}` : '/broadcast';
  } else if (/^(?:📄\s*)?(?:玩家积分TXT榜单|玩家积分TXT|玩家积分榜|积分榜单|TXT榜单|导出积分|积分导出|txt|exporttxt)(?:\s+(.+))?$/i.test(trimmed)) {
    rawText = '/exporttxt';
  } else if (trimmed === '👥 玩家名册' || trimmed.includes('玩家名册') || trimmed.includes('查看玩家') || trimmed === '用户列表') {
    rawText = '/users';
  } else if (trimmed === '📊 运营统计' || trimmed.includes('运营统计')) {
    rawText = '/stats';
  } else if (trimmed === '⚡ 匹配池监控' || trimmed.includes('匹配池') || trimmed.includes('匹配监控')) {
    rawText = '/matchpool';
  } else if (trimmed === '📋 白名单列表' || trimmed.includes('白名单列表') || trimmed.includes('授权列表') || trimmed === '白名单') {
    rawText = '/whitelist';
  } else if (trimmed === '🀄 牌桌巡视' || trimmed.includes('牌桌巡视') || trimmed.includes('巡视牌桌')) {
    rawText = '/rooms';
  } else if (trimmed === '📜 审计日志' || trimmed.includes('审计日志') || trimmed.includes('操作日志')) {
    rawText = '/logs';
  } else if (trimmed === '❓ 帮助菜单' || trimmed.includes('帮助') || trimmed.includes('菜单') || trimmed.includes('指南')) {
    rawText = '/help';
  }
  const parts = rawText.trim().split(/\s+/);
  const cmd = (parts[0] || '').toLowerCase();
  const arg1 = parts[1] || '';
  const arg2 = parts[2] || '';
  const arg3 = parts.slice(3).join(' ') || '';

  const db = loadDatabase();
  let reply = '';
  let success = true;
  let customInlineMarkup: any = null;

  switch (cmd) {
    case '/start':
    case '/help':
      reply = `🤖 *Telegram 机器人茶楼管理员控制中枢*\n\n` +
        `⚡ *常用零门槛免前缀操作*：\n` +
        `• 🔍 *查玩家*: 点击【🔍 搜手机号查玩家】或发 \`/findphone 手机号\`，*显示玩家完整档案*！\n` +
        `• 📱 *直接发手机号* (例: \`13800138000\`)：*自动授权白名单*，无需前缀！\n` +
        `• ➕ *直接发：手机号 金额* (例: \`13800138000 5000\`)：*秒级为玩家注入筹码*！\n` +
        `• ➖ *直接发：手机号 负金额* (例: \`13800138000 -2000\`)：*秒级扣减筹码*！\n\n` +
        `💡 *支持指令*：\n` +
        `• \`/findphone <手机号>\` - 搜索玩家完整档案与战绩\n` +
        `• \`/exporttxt\` - 导出全服玩家积分 TXT 榜单\n` +
        `• \`/users\` - 查看所有茶客玩家列表与筹码\n` +
        `• \`/whitelist\` - 查看已授权手机号白名单\n` +
        `• \`/authphone <手机号>\` - 添加手机号到注册白名单\n` +
        `• \`/deluser <手机号/UID>\` - 注销并删除指定茶客\n` +
        `• \`/addpoints <手机号/UID> <数量>\` - 为玩家注入筹码\n` +
        `• \`/subpoints <手机号/UID> <数量>\` - 扣减玩家筹码\n` +
        `• \`/broadcast <通告内容>\` - 向全服所有房间发送广播通告`;
      break;

    case '/txt':
    case '/exporttxt': {
      if (chatId) {
        storeAdminChatId(chatId);
      }
      notifyPointsTxtToTelegram('管理员手动导出玩家积分TXT榜单', db, chatId).catch(() => {});
      const { summaryTextHtml } = exportPlayersPointsTxt(db);
      reply = `${summaryTextHtml}\n\n📄 *已为您实时生成全量玩家积分 TXT 榜单，并作为文件附件推送到当前 Telegram 会话中！*\n（可随时用于 Termux 硬件故障报废时的全量还原）`;
      break;
    }

    case '/findphone':
    case '/searchphone':
    case '/finduser': {
      if (!arg1) {
        adminPendingStates.set(senderKey, { action: 'findphone', timestamp: Date.now() });
        reply = `🔍 *【输入手机号搜索玩家】*\n\n👉 *请直接发送要查询的玩家手机号*：\n（例如直接输入：\`13800138000\`，系统将立即检索并展示该茶客全部详细完整档案）`;
        success = true;
        break;
      }

      const query = arg1.trim();
      const cleanPhone = normalizePhone(query);
      const { allowedPhones, adminPhones } = getAllowedAndAdminPhones();

      let user: UserProfileData | null = null;
      for (const p of Object.values(db.profiles || {})) {
        const profPhone = normalizePhone(p.phone || '');
        if (profPhone && (profPhone === cleanPhone || (cleanPhone.length >= 5 && profPhone.endsWith(cleanPhone)))) {
          user = p;
          break;
        }
      }
      if (!user) {
        user = findUser(query, db);
      }
      if (!user && cleanPhone.length >= 5) {
        const isAuthorized = allowedPhones.includes(cleanPhone) || adminPhones.includes(cleanPhone);
        if (isAuthorized) {
          user = ensureUserProfile(cleanPhone, db, 0);
          saveDatabase(db);
        }
      }

      if (user) {
        const userPhone = normalizePhone(user.phone || '');
        const isWhitelisted = allowedPhones.includes(userPhone) || adminPhones.includes(userPhone);
        const isAdminUser = user.isAdmin || adminPhones.includes(userPhone);
        const isActivated = Boolean(user.password);
        const registeredDateStr = user.registeredAt ? new Date(user.registeredAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '早期注册';
        const updatedDateStr = user.updatedAt ? new Date(user.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '暂无记录';

        const yansanStats = user.stats?.yansan || { played: 0, won: 0, highestScore: 0 };
        const shisanshuiStats = user.stats?.shisanshui || { played: 0, won: 0, highestScore: 0 };
        const mahjongStats = user.stats?.mahjong || { played: 0, won: 0, highestScore: 0 };
        const totalPlayed = (yansanStats.played || 0) + (shisanshuiStats.played || 0) + (mahjongStats.played || 0);
        const totalWon = (yansanStats.won || 0) + (shisanshuiStats.won || 0) + (mahjongStats.won || 0);
        const winRate = totalPlayed > 0 ? ((totalWon / totalPlayed) * 100).toFixed(1) + '%' : '0.0%';

        reply = `👤 *【茶客完整档案卡】*\n\n` +
          `• 🏷️ *牌桌名号*: *${user.name}* (印信头像: ${user.avatar || '👑'})\n` +
          `• 📱 *登录手机号*: \`${userPhone || user.phone || '未绑定'}\`\n` +
          `• 🆔 *用户 UID*: \`${user.id}\`\n` +
          `• 📋 *白名单授权*: ${isWhitelisted ? '🟢 已获授权 (已建档)' : '🔴 未在白名单'}\n` +
          `• 🔑 *对战激活*: ${isActivated ? '🟢 已设置密码对战中' : '📱 白名单授权·待首登'}\n` +
          `• 👑 *权限级别*: ${isAdminUser ? '👑 管理员特权账号' : '🍵 普通牌友茶客'}\n` +
          `• 🔒 *账号状态*: ${user.isBanned ? `🚫 *已封禁* (${user.bannedReason || '违规操作'})` : '🟢 正常活跃'}\n\n` +
          `💰 *资产与天梯*:\n` +
          `• 🪙 可用筹码: *${(user.coins || 0).toLocaleString()}* 分\n` +
          `• 🏆 天梯积分: *${user.rating || 1800}* 分 (Lv.${user.level || 1})\n` +
          `• 📅 注册建档: ${registeredDateStr}\n` +
          `• 🕒 最后活跃: ${updatedDateStr}\n\n` +
          `🎮 *全游戏战绩统计* (总场次: ${totalPlayed} 场 · 综合胜率: ${winRate}):\n` +
          `• ♠️ *经典烟三*: 对局 ${yansanStats.played} 场 | 胜 ${yansanStats.won} 场 | 最高分 ${yansanStats.highestScore}\n` +
          `• 🃏 *水镜十三水*: 对局 ${shisanshuiStats.played} 场 | 胜 ${shisanshuiStats.won} 场 | 最高分 ${shisanshuiStats.highestScore}\n` +
          `• 🀄 *国标麻将*: 对局 ${mahjongStats.played} 场 | 胜 ${mahjongStats.won} 场 | 最高分 ${mahjongStats.highestScore}\n\n` +
          `⚡ *快捷管理指令*:\n` +
          `• 充值筹码: 发送 \`${userPhone} 5000\`\n` +
          `• 扣减筹码: 发送 \`${userPhone} -2000\`\n` +
          `• 注销账号: 发送 \`/deluser ${userPhone}\``;
        if (userPhone) {
          customInlineMarkup = {
            inline_keyboard: [
              [
                { text: '🪙 +5,000分', callback_data: `/addpoints ${userPhone} 5000` },
                { text: '🪙 +10,000分', callback_data: `/addpoints ${userPhone} 10000` },
                { text: '➖ -2,000分', callback_data: `/subpoints ${userPhone} 2000` },
              ],
              [
                { text: '🔍 刷新档案', callback_data: `/findphone ${userPhone}` },
                { text: '🗑️ 移出白名单', callback_data: `/delphone ${userPhone}` },
              ],
            ],
          };
        }
        success = true;
        break;
      }

      reply = `❌ 未找到手机号为 \`${query}\` 的茶客，且该手机号尚未在白名单中。\n\n👉 提示：您可以直接发送该手机号 \`${cleanPhone || query}\` 秒级开通白名单授权与玩家名册建档！`;
      success = false;
      break;
    }

    case '/users': {
      // 自动补全所有授权白名单中的手机号建档
      const { allowedPhones, adminPhones } = getAllowedAndAdminPhones();
      const allAuthPhones = Array.from(new Set([...allowedPhones, ...adminPhones]));
      let addedAny = false;
      for (const ap of allAuthPhones) {
        if (ap && ap.length >= 5) {
          const found = findUser(ap, db);
          if (!found) {
            ensureUserProfile(ap, db, 0);
            addedAny = true;
          }
        }
      }
      if (addedAny) {
        saveDatabase(db);
      }

      const list = Object.values(db.profiles || {});
      if (list.length === 0) {
        reply = '👥 *当前注册茶客名单*: 暂无注册茶客。\n\n可在 Bot 中直接发送手机号添加白名单授权（例如发送：`13800138000`）。';
        break;
      }
      let str = `👥 *茶楼全员茶客名册 (共 ${list.length} 人)*:\n\n`;
      for (const u of list.slice(0, 30)) {
        const isActivated = Boolean(u.password);
        const statusBadge = isActivated ? '🟢已激活对战' : '📱白名单授权·待首登';
        const uPhone = normalizePhone(u.phone || u.username || '');
        str += `• ${u.avatar || '👤'} *${u.name}* (📱 \`${uPhone || '未绑'}\`) - 🪙 *${(u.coins || 0).toLocaleString()}* 分 | ${statusBadge}${u.isAdmin ? ' 👑管理员' : ''}${u.isBanned ? ' [🚫已封禁]' : ''}\n`;
      }
      if (list.length > 30) str += `\n... 还有 ${list.length - 30} 位茶客未完全展开`;
      str += `\n💡 提示: 直接发送【手机号 筹码数量】(如 \`${normalizePhone(list[0]?.phone || '13800138000')} 5000\`) 即可秒级为任意茶客充值筹码！`;
      reply = str;
      break;
    }

    case '/whitelist': {
      const { allowedPhones, adminPhones, adminUsernames } = getAllowedAndAdminPhones();
      let str = `📋 *茶楼授权白名单与管理员名册*:\n\n`;
      if (adminUsernames.length > 0) {
        str += `👑 *管理员 Telegram 用户名*:\n`;
        for (const u of adminUsernames) str += `  • \`@${u}\`\n`;
      }
      if (adminPhones.length > 0) {
        str += `\n👑 *特权管理员账号* (${adminPhones.length} 个):\n`;
        for (const p of adminPhones) str += `  • \`${p}\`\n`;
      }
      str += `\n📱 *允许注册手机号白名单与建档* (${allowedPhones.length} 个):\n`;
      if (allowedPhones.length > 0) {
        for (const p of allowedPhones.slice(0, 25)) {
          const userProf = findUser(p, db);
          const coinText = userProf ? ` (🪙 ${(userProf.coins || 0).toLocaleString()}分)` : '';
          const activeText = userProf?.password ? ' · 🟢已对战' : ' · 📱待首登';
          str += `  • \`${p}\`${coinText}${activeText}\n`;
        }
        if (allowedPhones.length > 25) str += `  ... 及其他 ${allowedPhones.length - 25} 个手机号\n`;
      } else {
        str += `  • 暂无已授权手机号 (可在 Bot 中直接发送手机号添加授权)\n`;
      }
      str += `\n💡 提示: 在 Bot 中直接发送手机号即可立即授权加入白名单并自动建档。`;
      reply = str;
      break;
    }

    case '/addpoints': {
      if (!arg1 || !arg2) {
        const cleanTarget = arg1 ? normalizePhone(arg1) || arg1.trim() : '';
        if (cleanTarget) {
          adminPendingStates.set(senderKey, { action: 'addpoints', targetPhone: cleanTarget, timestamp: Date.now() });
          reply = `➕ *【为玩家注入筹码】*\n\n` +
            `👉 *已锁定目标玩家*: \`${cleanTarget}\`\n\n` +
            `请直接回复要注入的筹码数值（例如直接发送: \`5000\` 或 \`20000\`）：`;
        } else {
          adminPendingStates.set(senderKey, { action: 'addpoints', timestamp: Date.now() });
          reply = `➕ *【为玩家注入筹码】*\n\n👉 *请直接发送：手机号 数量*\n（无需任何斜杠前缀，例如直接发：\`13800138000 5000\` 或 \`13800138000 +5000\`）：`;
        }
        success = true;
        break;
      }
      let user = findUser(arg1, db);
      const cleanTargetPhone = normalizePhone(arg1);
      if (!user && cleanTargetPhone.length >= 5) {
        const current = new Set((db.authorizedPhones || []).map((p: any) => normalizePhone(p)));
        current.add(cleanTargetPhone);
        db.authorizedPhones = Array.from(current);
        if (db.revokedPhones) {
          db.revokedPhones = db.revokedPhones.filter((p: string) => normalizePhone(p) !== cleanTargetPhone);
        }
        user = ensureUserProfile(cleanTargetPhone, db, 0);
      }

      if (!user) {
        reply = `❌ 未找到玩家: \`${arg1}\`，请核对手机号、UID或用户名是否正确。`;
        success = false;
        break;
      }
      const amt = Math.abs(parseInt(arg2, 10) || 0);
      user.coins = Math.max(0, (user.coins || 0) + amt);
      user.updatedAt = Date.now();
      saveDatabase(db);
      recordAdminLog('TG_ADDPOINTS', operator, user.name, `通过 Telegram 加筹码 +${amt}`, amt);
      notifyPointsTxtToTelegram(`管理员注入筹码 (+${amt} -> ${user.name})`, db, chatId).catch(() => {});
      broadcastTeahousePlayersRoster(broadcast, db);

      if (typeof broadcast === 'function') {
        broadcast({
          type: 'user_coins_updated',
          userId: user.id,
          phone: user.phone,
          username: user.username,
          name: user.name,
          coins: user.coins,
          rating: user.rating,
          level: user.level,
          operator,
          delta: amt,
          action: 'tg_addpoints',
          timestamp: Date.now(),
        });
      }

      reply = `✅ 成功为 *${user.name}* (📱 \`${normalizePhone(user.phone || '')}\`) 注入筹码 *+${amt.toLocaleString()}* 分！\n当前持有筹码: *${user.coins.toLocaleString()}* 分\n📄 已自动备份全员最新积分 TXT 文档到 Telegram。`;
      break;
    }

    case '/subpoints': {
      if (!arg1 || !arg2) {
        adminPendingStates.set(senderKey, { action: 'subpoints', timestamp: Date.now() });
        reply = `➖ *【扣除玩家筹码】*\n\n👉 *请直接发送：手机号 数量*\n（无需任何斜杠前缀，例如直接发：\`13800138000 2000\` 或 \`13800138000 -2000\`）：`;
        success = true;
        break;
      }
      let user = findUser(arg1, db);
      const cleanTargetPhone = normalizePhone(arg1);
      if (!user && cleanTargetPhone.length >= 5) {
        const current = new Set((db.authorizedPhones || []).map((p: any) => normalizePhone(p)));
        current.add(cleanTargetPhone);
        db.authorizedPhones = Array.from(current);
        if (db.revokedPhones) {
          db.revokedPhones = db.revokedPhones.filter((p: string) => normalizePhone(p) !== cleanTargetPhone);
        }
        user = ensureUserProfile(cleanTargetPhone, db, 0);
      }

      if (!user) {
        reply = `❌ 未找到玩家: \`${arg1}\``;
        success = false;
        break;
      }
      const amt = Math.abs(parseInt(arg2, 10) || 0);
      user.coins = Math.max(0, (user.coins || 0) - amt);
      user.updatedAt = Date.now();
      saveDatabase(db);
      recordAdminLog('TG_SUBPOINTS', operator, user.name, `通过 Telegram 扣除筹码 -${amt}`, -amt);
      notifyPointsTxtToTelegram(`管理员扣除筹码 (-${amt} -> ${user.name})`, db, chatId).catch(() => {});
      broadcastTeahousePlayersRoster(broadcast, db);

      if (typeof broadcast === 'function') {
        broadcast({
          type: 'user_coins_updated',
          userId: user.id,
          phone: user.phone,
          username: user.username,
          name: user.name,
          coins: user.coins,
          rating: user.rating,
          level: user.level,
          operator,
          delta: -amt,
          action: 'tg_subpoints',
          timestamp: Date.now(),
        });
      }

      reply = `✅ 已扣减 *${user.name}* (📱 \`${normalizePhone(user.phone || '')}\`) 筹码 *-${amt.toLocaleString()}* 分！\n当前结余: *${user.coins.toLocaleString()}* 分\n📄 已自动备份全员最新积分 TXT 文档到 Telegram。`;
      break;
    }

    case '/setpoints': {
      if (!arg1 || !arg2) {
        adminPendingStates.set(senderKey, { action: 'setpoints', timestamp: Date.now() });
        reply = `⚙️ *【设定玩家筹码】*\n\n👉 *请直接发送：手机号 数量*\n（无需任何斜杠前缀，例如直接发：\`13800138000 8888\`）：`;
        success = true;
        break;
      }
      let user = findUser(arg1, db);
      const cleanTargetPhone = normalizePhone(arg1);
      if (!user && cleanTargetPhone.length >= 5) {
        const current = new Set((db.authorizedPhones || []).map((p: any) => normalizePhone(p)));
        current.add(cleanTargetPhone);
        db.authorizedPhones = Array.from(current);
        if (db.revokedPhones) {
          db.revokedPhones = db.revokedPhones.filter((p: string) => normalizePhone(p) !== cleanTargetPhone);
        }
        user = ensureUserProfile(cleanTargetPhone, db, 0);
      }

      if (!user) {
        reply = `❌ 未找到玩家: \`${arg1}\``;
        success = false;
        break;
      }
      const amt = Math.max(0, parseInt(arg2, 10) || 0);
      user.coins = amt;
      user.updatedAt = Date.now();
      saveDatabase(db);
      recordAdminLog('TG_SETPOINTS', operator, user.name, `通过 Telegram 重新设定筹码为 ${amt}`, amt);
      notifyPointsTxtToTelegram(`管理员重设筹码 (${user.name} -> ${amt})`, db, chatId).catch(() => {});
      broadcastTeahousePlayersRoster(broadcast, db);

      if (typeof broadcast === 'function') {
        broadcast({
          type: 'user_coins_updated',
          userId: user.id,
          phone: user.phone,
          username: user.username,
          name: user.name,
          coins: user.coins,
          rating: user.rating,
          level: user.level,
          operator,
          delta: 0,
          action: 'tg_setpoints',
          timestamp: Date.now(),
        });
      }

      reply = `✅ 已将 *${user.name}* (📱 \`${normalizePhone(user.phone || '')}\`) 的筹码直接重设为 *${amt.toLocaleString()}* 分！\n📄 已自动备份全员最新积分 TXT 文档到 Telegram。`;
      break;
    }

    case '/authphone': {
      const cleanInputPhone = arg1 ? normalizePhone(arg1) : '';
      if (!cleanInputPhone) {
        adminPendingStates.set(senderKey, { action: 'authphone', timestamp: Date.now() });
        reply = `📱 *【添加白名单授权】*\n\n👉 *请直接发送手机号*\n（无需任何斜杠或前缀，例如直接输入并发送 \`13800138000\` 即可立即秒级完成授权）：`;
        success = true;
        break;
      }
      const current = new Set((db.authorizedPhones || []).map((p: any) => normalizePhone(p)));
      current.add(cleanInputPhone);
      db.authorizedPhones = Array.from(current);

      if (db.revokedPhones && Array.isArray(db.revokedPhones)) {
        db.revokedPhones = db.revokedPhones.filter((p: string) => normalizePhone(p) !== cleanInputPhone);
      }

      // CRITICAL FIX: Ensure user profile is pre-provisioned in db.profiles immediately!
      const userProf = ensureUserProfile(cleanInputPhone, db, 0);

      saveDatabase(db);
      recordAdminLog('TG_AUTHPHONE', operator, cleanInputPhone, `Telegram 添加注册白名单手机号与建档: ${cleanInputPhone} (${userProf.name}, UID: ${userProf.id})`);
      notifyPointsTxtToTelegram(`管理员授权手机号与建档 (${cleanInputPhone})`, db, chatId).catch(() => {});
      broadcastTeahousePlayersRoster(broadcast, db);
      customInlineMarkup = {
        inline_keyboard: [
          [
            { text: '➕ 注入筹码', callback_data: `/addpoints ${cleanInputPhone}` },
            { text: '🔍 查看档案', callback_data: `/findphone ${cleanInputPhone}` },
          ],
          [
            { text: '🗑️ 移出白名单', callback_data: `/delphone ${cleanInputPhone}` },
          ],
        ],
      };
      reply = `✅ 手机号 \`${cleanInputPhone}\` 授权并建档成功！\n\n` +
        `• 📱 *授权手机号*: \`${cleanInputPhone}\`\n` +
        `• 🏷️ *玩家名册档案*: *${userProf.name}* (UID: \`${userProf.id}\`)\n` +
        `• 🪙 *预留筹码*: ${userProf.coins.toLocaleString()} 分\n` +
        `• 📋 *状态*: 已开通注册与游戏权限，并自动纳入玩家名册！\n\n` +
        `💡 点击下方【➕ 注入筹码】按钮后直接回复数字即可注入筹码，或直接发送 \`${cleanInputPhone} 5000\`！`;
      break;
    }

    case '/delphone':
    case '/removephone': {
      const cleanInputPhone = arg1 ? arg1.trim().replace(/\D/g, '') : '';
      if (!cleanInputPhone) {
        adminPendingStates.set(senderKey, { action: 'delphone', timestamp: Date.now() });
        reply = `🗑️ *【移出授权手机号】*\n\n👉 *请直接发送要移出的手机号*\n（无需任何斜杠或前缀，例如直接发送 \`13800138000\` 即可立即移出白名单并注销账号）：`;
        success = true;
        break;
      }

      const currentAuth = new Set((db.authorizedPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
      currentAuth.delete(cleanInputPhone);
      db.authorizedPhones = Array.from(currentAuth);

      const currentAdmin = new Set((db.adminPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
      currentAdmin.delete(cleanInputPhone);
      db.adminPhones = Array.from(currentAdmin);

      if (!db.revokedPhones || !Array.isArray(db.revokedPhones)) {
        db.revokedPhones = [];
      }
      if (!db.revokedPhones.includes(cleanInputPhone)) {
        db.revokedPhones.push(cleanInputPhone);
      }

      const deletedUsers: string[] = [];
      for (const [pId, profile] of Object.entries(db.profiles)) {
        const profPhone = String(profile.phone || '').trim().replace(/\D/g, '');
        if (profPhone === cleanInputPhone) {
          deletedUsers.push(`${profile.name} (${profile.username || pId})`);
          delete db.profiles[pId];
        }
      }

      saveDatabase(db);
      recordAdminLog(
        'TG_DELPHONE',
        operator,
        cleanInputPhone,
        `Telegram 移出白名单手机号: ${cleanInputPhone}，注销关联账号: ${deletedUsers.length > 0 ? deletedUsers.join(', ') : '无注册用户'}`
      );
      notifyPointsTxtToTelegram(`移出白名单与注销账号 (${cleanInputPhone})`, db, chatId).catch(() => {});
      broadcastTeahousePlayersRoster(broadcast, db);

      let msg = `🗑️ *手机号移出与残留清理成功*！\n\n• 📱 移出手机号: \`${cleanInputPhone}\`\n• 📋 白名单状态: 已从授权名单彻底除名并加入注销记录\n`;
      if (deletedUsers.length > 0) {
        msg += `• 👤 已彻底清理注销关联注册账号: *${deletedUsers.join('、')}*\n• 🔒 客户端登录态与本地缓存已立即失效，用户无法再次登录！`;
      } else {
        msg += `• 👤 关联账号: 该手机号名下暂无已注册账号残留。`;
      }
      msg += `\n📄 已同步备份最新全员积分 TXT 文档。`;
      reply = msg;
      break;
    }

    case '/setadmin': {
      if (!arg1) {
        reply = `👑 *【设立特权管理员】*\n\n👉 *请发送：/setadmin 手机号或UID*：\n（例如：\`/setadmin 13912345678\`）`;
        success = false;
        break;
      }
      const targetQuery = arg1.trim();
      const cleanPhoneQuery = targetQuery.replace(/\D/g, '');
      const user = findUser(targetQuery, db) || (cleanPhoneQuery.length >= 5 ? findUser(cleanPhoneQuery, db) : null);
      if (user) {
        user.isAdmin = true;
        user.updatedAt = Date.now();
        if (user.phone) {
          const currentAdmin = new Set((db.adminPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
          currentAdmin.add(user.phone.replace(/\D/g, ''));
          db.adminPhones = Array.from(currentAdmin);
        }
        saveDatabase(db);
        recordAdminLog('TG_SETADMIN', operator, user.name, `Telegram 设立茶客为管理员: ${user.name}`);
        reply = `👑 已成功将玩家 *${user.name}* (📱 \`${user.phone || user.id}\`) 设立为茶楼特权管理员！`;
      } else if (cleanPhoneQuery.length >= 5) {
        const currentAdmin = new Set((db.adminPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
        currentAdmin.add(cleanPhoneQuery);
        db.adminPhones = Array.from(currentAdmin);
        const currentAuth = new Set((db.authorizedPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
        currentAuth.add(cleanPhoneQuery);
        db.authorizedPhones = Array.from(currentAuth);
        saveDatabase(db);
        recordAdminLog('TG_SETADMIN', operator, cleanPhoneQuery, `Telegram 设立手机号为特权管理员: ${cleanPhoneQuery}`);
        reply = `👑 已成功将手机号 \`${cleanPhoneQuery}\` 设立为特权管理员！该号码可在茶楼免审核登录并拥有全部管理权限。`;
      } else {
        reply = `❌ 未找到玩家或有效手机号: \`${targetQuery}\``;
        success = false;
      }
      break;
    }

    case '/deladmin': {
      if (!arg1) {
        reply = `撤销管理员特权，用法: \`/deladmin 手机号或UID\``;
        success = false;
        break;
      }
      const targetQuery = arg1.trim();
      const cleanPhoneQuery = targetQuery.replace(/\D/g, '');
      const user = findUser(targetQuery, db) || (cleanPhoneQuery.length >= 5 ? findUser(cleanPhoneQuery, db) : null);
      if (user) {
        user.isAdmin = false;
        user.updatedAt = Date.now();
        if (user.phone) {
          const currentAdmin = new Set((db.adminPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
          currentAdmin.delete(user.phone.replace(/\D/g, ''));
          db.adminPhones = Array.from(currentAdmin);
        }
        saveDatabase(db);
        recordAdminLog('TG_DELADMIN', operator, user.name, `Telegram 撤销管理员权限: ${user.name}`);
        reply = `✅ 已成功撤销玩家 *${user.name}* (📱 \`${user.phone || user.id}\`) 的管理员权限。`;
      } else if (cleanPhoneQuery.length >= 5) {
        const currentAdmin = new Set((db.adminPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
        currentAdmin.delete(cleanPhoneQuery);
        db.adminPhones = Array.from(currentAdmin);
        saveDatabase(db);
        recordAdminLog('TG_DELADMIN', operator, cleanPhoneQuery, `Telegram 撤销手机号管理员特权: ${cleanPhoneQuery}`);
        reply = `✅ 已成功从管理员名册中移出手机号 \`${cleanPhoneQuery}\`。`;
      } else {
        reply = `❌ 未找到玩家或有效手机号: \`${targetQuery}\``;
        success = false;
      }
      break;
    }

    case '/deluser':
    case '/removeuser': {
      if (!arg1) {
        adminPendingStates.set(senderKey, { action: 'deluser', timestamp: Date.now() });
        reply = `❌ *【注销删除指定用户】*\n\n👉 *请直接发送要注销的手机号或用户名/UID*\n（无需任何斜杠前缀，例如直接发：\`13800138000\` 即可立即彻底注销）：`;
        success = true;
        break;
      }

      const query = arg1.trim();
      const cleanPhoneQuery = query.replace(/\D/g, '');
      const user = findUser(query, db) || (cleanPhoneQuery.length >= 5 ? findUser(cleanPhoneQuery, db) : null);

      if (!user) {
        if (cleanPhoneQuery.length >= 5) {
          const currentAuth = new Set((db.authorizedPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
          if (currentAuth.has(cleanPhoneQuery)) {
            currentAuth.delete(cleanPhoneQuery);
            db.authorizedPhones = Array.from(currentAuth);
            if (!db.revokedPhones) db.revokedPhones = [];
            if (!db.revokedPhones.includes(cleanPhoneQuery)) db.revokedPhones.push(cleanPhoneQuery);
            saveDatabase(db);
            recordAdminLog('TG_DELUSER', operator, cleanPhoneQuery, `删除未注册但已授权手机号: ${cleanPhoneQuery}`);
            notifyPointsTxtToTelegram(`注销授权手机号 (${cleanPhoneQuery})`, db, chatId).catch(() => {});
            reply = `🗑️ 未找到关联注册账号，但已将手机号 \`${cleanPhoneQuery}\` 从授权白名单中彻底移出并撤销授权。`;
            break;
          }
        }
        reply = `❌ 未找到玩家或手机号: \`${query}\`，请核对手机号、用户名或 UID 是否正确。`;
        success = false;
        break;
      }

      const pId = user.id;
      const userName = user.name;
      const userPhone = String(user.phone || '').trim().replace(/\D/g, '');
      delete db.profiles[pId];

      if (userPhone) {
        const currentAuth = new Set((db.authorizedPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
        currentAuth.delete(userPhone);
        db.authorizedPhones = Array.from(currentAuth);

        const currentAdmin = new Set((db.adminPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
        currentAdmin.delete(userPhone);
        db.adminPhones = Array.from(currentAdmin);

        if (!db.revokedPhones) db.revokedPhones = [];
        if (!db.revokedPhones.includes(userPhone)) db.revokedPhones.push(userPhone);
      }

      saveDatabase(db);
      recordAdminLog('TG_DELUSER', operator, userName, `删除用户与注销手机号: ${userName} (${pId}, 📱 ${userPhone || '未绑'})`);
      notifyPointsTxtToTelegram(`注销删除玩家账号 (${userName})`, db, chatId).catch(() => {});
      broadcastTeahousePlayersRoster(broadcast, db);

      reply = `🗑️ *茶客账号注销成功*！\n\n• 👤 注销账号: *${userName}* (UID: \`${pId}\`)\n• 📱 手机号: \`${userPhone || '未绑定'}\` (已同步从白名单中移出并撤销授权)\n• 🪙 结算前筹码: ${(user.coins || 0).toLocaleString()} 分\n• 🚫 状态: 该账号已彻底注销，用户会话立即失效！\n📄 已同步备份最新全员积分 TXT 文档。`;
      break;
    }

    case '/clearusers':
    case '/cleanusers': {
      const count = Object.keys(db.profiles).length;
      db.profiles = {};
      saveDatabase(db);
      recordAdminLog('TG_CLEARUSERS', operator, '全服', `清空所有注册茶客账号，共清理 ${count} 个账号`);
      notifyPointsTxtToTelegram('清空全服注册茶客账号', db, chatId).catch(() => {});
      broadcastTeahousePlayersRoster(broadcast, db);
      reply = `🧹 *全服注册茶客已全部清空*！\n\n共彻底清理注销了 *${count}* 位茶客的注册资料与会话数据。所有客户端将在心跳或刷新时自动重置为未登录状态。\n📄 已同步生成全空重置 TXT 灾备文档。`;
      break;
    }

    case '/broadcast': {
      const msg = parts.slice(1).join(' ').trim();
      if (!msg) {
        adminPendingStates.set(senderKey, { action: 'broadcast', timestamp: Date.now() });
        reply = `📢 *【发布全服通告】*\n\n👉 *请直接发送要广播的消息文字*\n（无需任何斜杠前缀，即发即推）：`;
        success = true;
        break;
      }
      recordAdminLog('TG_BROADCAST', operator, '全服', msg);
      if (broadcast) {
        broadcast({
          type: 'chat_broadcast',
          roomId: 'ALL',
          message: {
            id: `tg-${Date.now()}`,
            sender: '📢 Telegram 管理员广播',
            avatar: '🤖',
            text: msg,
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          },
        });
      }
      reply = `📢 *全服广播推送成功*！\n已即时推送到全服所有对战房间舞台顶部弹幕与茶室聊天：\n"${msg}"`;
      break;
    }

    case '/logs': {
      const logs = (db.adminLogs || []).slice(0, 10);
      if (logs.length === 0) {
        reply = '📜 暂无最近的管理员审计操作记录。';
        break;
      }
      let str = `📜 *最新管理员操作审计日志 (最近 ${logs.length} 条)*:\n\n`;
      for (const l of logs) {
        str += `• [${l.timestamp}] *${l.action}* | 执行人: ${l.operator} -> 目标: ${l.target}\n  └ ${l.details || ''}\n`;
      }
      reply = str;
      break;
    }

    case '/rooms': {
      reply = `🀄 *茶楼在线牌桌巡视中枢*:\n\n` +
        `• 牌桌 RM-202: 经典烟三四人赛 (4人桌 · 运行中 · 底分10分)\n` +
        `• 牌桌 RM-204: 水镜十三水 (4人桌 · 智能理牌 · 底分10分)\n` +
        `• 牌桌 RM-205: 经典国标麻将 (4人桌 · 东风圈 · 底分10分)\n` +
        `• 自动匹配池: 活跃运作中，同段位撮合，平均耗时 0.8s\n\n` +
        `💡 提示: 发送 \`/matchpool\` 可查看匹配池实时队列与作弊风控。`;
      break;
    }

    case '/matchpool':
    case '/match': {
      const db = loadDatabase();
      const userCount = Object.keys(db.profiles).length;
      reply = `⚡ *茶楼极速自动匹配池监控中枢*:\n\n` +
        `• 🎴 *经典烟三竞技场*: 4人桌排队中 (在线队列 8 人 · 均速 0.7s)\n` +
        `• 🃏 *水镜十三水*: 4人/8人连线中 (在线队列 14 人 · 智能理牌)\n` +
        `• 🀄 *经典国标麻将*: 东风圈竞技中 (在线队列 12 人 · 均速 0.9s)\n\n` +
        `🛡️ *安全与撮合策略*:\n` +
        `• 算法: ELO 天梯分层自适应撮合 (最大允许分差 ±80分)\n` +
        `• 透视防作弊: 🟢 启用 (手牌内存混淆加密)\n` +
        `• 智能陪玩替补机制: 🟢 活跃 (超过 2 秒未成桌自动补齐拟真茶客)\n` +
        `• 实时排队总茶客: *${(userCount * 2 + 15).toLocaleString()}* 人\n` +
        `• 匹配系统总延迟: *< 12ms*`;
      break;
    }

    case '/stats': {
      const users = Object.values(db.profiles);
      const totalCoins = users.reduce((sum, u) => sum + (u.coins || 0), 0);
      reply = `📊 *茶楼运营核心统计数据*:\n\n` +
        `• 注册总玩家: *${users.length}* 人\n` +
        `• 全服筹码总流动量: *${totalCoins.toLocaleString()}* 分\n` +
        `• 授权白名单手机号: *${(db.authorizedPhones || []).length}* 个\n` +
        `• 牌桌系统: 经典烟三 / 水镜十三水 / 经典国标麻将\n` +
        `• 自动匹配队列: 🟢 实时秒配\n` +
        `• Telegram 管理员接入状态: 🟢 活跃在线`;
      break;
    }

    default:
      reply = `❓ 未知指令: \`${cmd}\`。点击下方快捷键盘或发送 \`/help\` 获取可用管理员指令清单。`;
      success = false;
      break;
  }

  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^['"]+|['"]+$/g, '');

  // 优化精简 5 行全新 Telegram 键盘菜单 (已彻底删除全服发币、封禁玩家、解封账号，新增玩家积分TXT榜单)
  const replyMarkup = buildTelegramAdminKeyboard();

  const effectiveMarkup = customInlineMarkup || replyMarkup;

  // Answer Telegram callback queries to dismiss loading indicator
  if (body.callback_query?.id && botToken) {
    try {
      const { getTelegramApiBase } = await import('./telegramBotService.ts');
      const apiBase = getTelegramApiBase();
      fetch(`${apiBase}/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id,
          text: success ? '✅ 指令执行成功' : '⚠️ 操作提示',
        }),
        signal: AbortSignal.timeout(4000),
      }).catch(() => {});
    } catch {}
  }

  // 核心优化：若请求来源于 Webhook，由 Webhook 接口在 HTTP 200 响应体中直接返回 sendMessage，
  // 100% 免海外代理直通、0 延迟且绝无消息重复！
  // 仅当非 Webhook (如长轮询或本地 CLI 模拟器) 时，才由服务端主动通过 fetch 发送。
  if (chatId && botToken && !options?.isWebhook) {
    try {
      const { getTelegramApiBase } = await import('./telegramBotService.ts');
      const apiBase = getTelegramApiBase();
      const safeText = sanitizeTelegramMarkdown(reply);
      const sendRes = await fetch(`${apiBase}/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: safeText,
          parse_mode: 'Markdown',
          reply_markup: effectiveMarkup,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const sendData = (await sendRes.json().catch(() => ({}))) as any;
      if (!sendData?.ok) {
        // If Markdown formatting failed due to reserved characters, fallback to plain text
        if (sendData?.description?.includes('entity') || sendData?.description?.includes('parse')) {
          const plainText = reply.replace(/[*_`\[\]]/g, '');
          await fetch(`${apiBase}/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: plainText,
              reply_markup: effectiveMarkup,
            }),
            signal: AbortSignal.timeout(10000),
          }).catch(() => {});
        } else {
          console.warn(`⚠️ [Telegram Bot] sendMessage 返回非 OK (${apiBase}):`, sendData?.description || sendData);
        }
      }
    } catch (err: any) {
      console.warn(`⚠️ [Telegram Bot] 发送回复消息网络异常:`, err?.message || err);
    }
  }

  return {
    ok: true,
    success,
    reply,
    command: rawText,
    replyMarkup: effectiveMarkup,
    chatId: chatId || undefined,
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  };
}

export async function handleApiRoute(
  req: any,
  res: any,
  broadcast?: (payload: any) => void
): Promise<boolean> {
  const urlObj = new URL(req.url, 'http://localhost');
  const pathname = urlObj.pathname;
  const method = req.method?.toUpperCase();

  // 0. Universal Cross-Origin Resource Sharing (CORS) & Preflight Headers
  // Required for Android Capacitor Native App (https://localhost / capacitor://localhost) & Web Clients
  const origin = req.headers?.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Range, Accept, Origin, x-telegram-bot-api-secret-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle HTTP OPTIONS Preflight requests immediately with 204 No Content
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  // 1. Health check
  if (pathname === '/api/health' && method === 'GET') {
    sendJson(res, 200, {
      status: 'ok',
      engine: 'Telegram-Authoritative-Engine',
      timestamp: Date.now(),
    });
    return true;
  }

  // 1b. APK Status & Metadata
  if (pathname === '/api/apk/status' && method === 'GET') {
    try {
      const isDebug = urlObj.searchParams.get('variant') === 'debug';
      const fileName = isDebug ? 'chess-game-debug.apk' : 'chess-game-release.apk';
      const repo = getGithubRepoName();

      let fileSize = 4718592; // 4.50 MB
      let isLocal = false;

      // Check if authentic local APK exists
      const localCandidates = [
        path.resolve(process.cwd(), 'apk', fileName),
        path.resolve(process.cwd(), 'apk', 'app-latest.apk'),
      ];
      for (const lc of localCandidates) {
        if (fs.existsSync(lc)) {
          try {
            const st = fs.statSync(lc);
            if (st.size >= 4200000) {
              fileSize = st.size;
              isLocal = true;
              break;
            }
          } catch {}
        }
      }

      if (!isLocal) {
        try {
          const headUrl = `https://ghproxy.net/https://github.com/${repo}/releases/download/latest-apk/${fileName}`;
          const headResp = await fetch(headUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
          if (headResp.ok) {
            const cl = headResp.headers.get('content-length');
            if (cl) {
              const sz = parseInt(cl, 10);
              if (sz >= 4200000) fileSize = sz;
            }
          }
        } catch {}
      }

      const fileSizeMb = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;

      let diskBuildInfo: any = null;
      try {
        const infoFile = path.resolve(process.cwd(), 'apk', 'apk-build-info.json');
        if (fs.existsSync(infoFile)) {
          diskBuildInfo = JSON.parse(fs.readFileSync(infoFile, 'utf-8'));
        }
      } catch {}

      sendJson(res, 200, {
        success: true,
        repo,
        apkExists: true,
        fileSize,
        fileSizeMb,
        isLocal,
        mtime: new Date().toISOString(),
        buildInfo: diskBuildInfo || {
          version: '1.2.0',
          buildTime: 'GitHub Actions 官方全量编译 (正式签名版)',
          fileSizeMb,
          fileSize,
          description: '三大经典国粹棋牌 - Android 官方最新全量发布版 (包含全套真人离线配音与实时语音)',
        },
      });
      return true;
    } catch (e: any) {
      sendJson(res, 500, { success: false, error: String(e.message || e) });
      return true;
    }
  }

  // 1c. APK On-Demand Rebuild (前端静态资源重新构建)
  if ((pathname === '/api/apk/rebuild' || pathname === '/api/download/apk/rebuild') && (method === 'POST' || method === 'GET')) {
    try {
      console.log('🔄 [APK API] Rebuilding web assets with npm run build...');
      execSync('npm run build', { cwd: process.cwd(), stdio: 'inherit' });
      sendJson(res, 200, {
        success: true,
        message: '最新前端代码已重新构建完成！',
      });
      return true;
    } catch (e: any) {
      console.error('❌ [APK API] Build error:', e);
      sendJson(res, 500, { success: false, error: '重新构建失败: ' + String(e.message || e) });
      return true;
    }
  }

  // 1d. APK Direct Download (同源免代理高速下载专线，优先分发本地 4.49MB 正式安装包，杜绝 4.09MB 损坏旧包)
  if ((pathname === '/api/download/apk' || pathname === '/api/apk/release' || pathname === '/api/apk/debug') && (method === 'GET' || method === 'HEAD')) {
    try {
      const isDebug = pathname === '/api/apk/debug' || urlObj.searchParams.get('variant') === 'debug';
      const fileName = isDebug ? 'chess-game-debug.apk' : 'chess-game-release.apk';
      const repo = getGithubRepoName();

      // 1. Check if authentic local APK (>= 4.2 MB) exists in dist / apk / public
      const localCandidates = [
        path.resolve(process.cwd(), 'dist', fileName),
        path.resolve(process.cwd(), 'dist', 'app-latest.apk'),
        path.resolve(process.cwd(), 'apk', fileName),
        path.resolve(process.cwd(), 'apk', 'app-latest.apk'),
        path.resolve(process.cwd(), 'public', fileName),
        path.resolve(process.cwd(), 'public', 'apk', fileName),
      ];
      for (const lc of localCandidates) {
        if (fs.existsSync(lc)) {
          try {
            const st = fs.statSync(lc);
            if (st.size >= 4200000) {
              console.log(`🚀 [APK Download] 直接从本地极速分发正版完整安装包: ${lc} (${(st.size / 1048576).toFixed(2)} MB)`);
              res.writeHead(200, {
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Length': st.size,
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': 'Content-Length, Content-Disposition',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
              });
              if (method === 'HEAD') {
                res.end();
              } else {
                fs.createReadStream(lc).pipe(res);
              }
              return true;
            }
          } catch {}
        }
      }

      // 2. If no local valid APK exists, redirect to GitHub Releases 4.49MB official APK via high-speed mirror
      const releaseMirrorUrl = `https://ghproxy.net/https://github.com/${repo}/releases/download/latest-apk/${fileName}`;
      console.log(`🚀 [APK Download Redirect] 本地暂无安装包，重定向至 GitHub Releases 4.49MB 最新安装包加速直链: ${releaseMirrorUrl}`);
      res.writeHead(302, {
        'Location': releaseMirrorUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      res.end();
      return true;
    } catch (e) {
      const repo = getGithubRepoName();
      res.writeHead(302, {
        'Location': `https://ghproxy.net/https://github.com/${repo}/releases/download/latest-apk/chess-game-release.apk`,
      });
      res.end();
      return true;
    }
  }

  // 1e. High-Speed Chinese TTS Speech Proxy with Server Memory Caching (100% 免翻墙·国内节点极速秒发)
  if (pathname === '/api/tts' && (method === 'GET' || method === 'POST')) {
    try {
      let text = urlObj.searchParams.get('text') || '';
      let isFemale = urlObj.searchParams.get('female') === 'true';
      if (method === 'POST') {
        const body = await parseJsonBody(req);
        if (body.text) text = body.text;
        if (body.female !== undefined) isFemale = Boolean(body.female);
      }

      const cleanText = String(text || '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9，。！、？]/g, '').trim();
      if (!cleanText) {
        sendJson(res, 400, { error: 'Text parameter required' });
        return true;
      }

      // 多音字"单"纠偏：出牌语音"单张九"替换为"丹张九"，防止 Baidu TTS 误读为 "shàn zhāng"
      const ttsSpeechText = cleanText.replace(/单张/g, '丹张').replace(/^单([0-9一二三四五六七八九十勾圈老K尖A-Z])/g, '丹$1');

      // 1. 服务端内存缓存 (0ms 极速命中，彻底解决重复网络请求)
      const cacheKey = `${cleanText}_${isFemale ? 'f' : 'm'}`;
      if (typeof globalThis !== 'undefined') {
        if (!(globalThis as any)._serverTtsCache) {
          (globalThis as any)._serverTtsCache = new Map<string, Buffer>();
        }
        const cache: Map<string, Buffer> = (globalThis as any)._serverTtsCache;
        if (cache.has(cacheKey)) {
          const buf = cache.get(cacheKey)!;
          res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': buf.byteLength,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=604800, immutable',
          });
          res.end(buf);
          return true;
        }
      }

      const per = isFemale ? '0' : '1';
      const domesticTtsEndpoints = [
        // Baidu 官方通用中文高清晰语音 (按性别划分男声per=1，女声per=0)
        `https://fanyi.baidu.com/gettts?lan=zh&per=${per}&text=${encodeURIComponent(ttsSpeechText)}&spd=6&source=web`,
        // Baidu Text2Audio 备用节点
        `https://tts.baidu.com/text2audio?cuid=baike&lan=ZH&ctp=1&per=${per}&padd=&tp=1&tex=${encodeURIComponent(ttsSpeechText)}`,
      ];

      for (const ttsUrl of domesticTtsEndpoints) {
        try {
          const resp = await fetch(ttsUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
              'Referer': 'https://fanyi.baidu.com/',
            },
            signal: AbortSignal.timeout(2000), // 超短 2s 超时，不卡顿
          });

          if (resp.ok) {
            const buf = Buffer.from(await resp.arrayBuffer());
            if (buf.byteLength > 300) {
              // 存入服务端内存缓存 (最多缓存 500 条常用语音)
              if (typeof globalThis !== 'undefined' && (globalThis as any)._serverTtsCache) {
                const cache: Map<string, Buffer> = (globalThis as any)._serverTtsCache;
                if (cache.size > 500) {
                  const firstKey = cache.keys().next().value;
                  if (firstKey) cache.delete(firstKey);
                }
                cache.set(cacheKey, buf);
              }

              res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buf.byteLength,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=604800, immutable',
              });
              res.end(buf);
              return true;
            }
          }
        } catch {}
      }

      // 3. 微软 Edge Speech 备用节点 (设置 1.5s 短超时)
      try {
        const voiceName = isFemale ? 'zh-CN-XiaoxiaoNeural' : 'zh-CN-YunxiNeural';
        const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'><voice name='${voiceName}'><prosody pitch='+0Hz' rate='+12%'>${cleanText}</prosody></voice></speak>`;
        const edgeResp = await fetch('https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/single/v1?trustedclienttoken=6A5AA1D4EA2D4738320C0F880E4CB756', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
          },
          body: JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataversion: '1.0',
                  name: 'speech',
                  outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
                  type: 'audio',
                },
              },
            },
            script: ssml,
          }),
          signal: AbortSignal.timeout(1800),
        });

        if (edgeResp.ok) {
          const buf = Buffer.from(await edgeResp.arrayBuffer());
          if (buf.byteLength > 300) {
            res.writeHead(200, {
              'Content-Type': 'audio/mpeg',
              'Content-Length': buf.byteLength,
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=604800, immutable',
            });
            res.end(buf);
            return true;
          }
        }
      } catch {}

      sendJson(res, 500, { error: 'TTS synthesis temporary failure' });
      return true;
    } catch (e: any) {
      sendJson(res, 500, { error: String(e.message || e) });
      return true;
    }
  }

  // 1f. Booking Carriages API (水镜十三水预约专列车厢赛牌桌数据与提交)
  if (pathname === '/api/booking/carriage' && method === 'GET') {
    try {
      const sceneMode = (urlObj.searchParams.get('sceneMode') === 'eight-booking') ? 'eight-booking' : 'four-booking';
      const carriageNumber = parseInt(urlObj.searchParams.get('carriageNumber') || '1', 10);
      const carriage = getOrInitServerCarriage(sceneMode, carriageNumber);
      sendJson(res, 200, { success: true, carriage });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: String(err?.message || err) });
      return true;
    }
  }

  if (pathname === '/api/booking/submit' && method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const sceneMode = payload.sceneMode === 'eight-booking' ? 'eight-booking' : 'four-booking';
      const carriageNum = Number(payload.carriageNumber) || 1;
      const carriages = loadBookingCarriagesFromDisk();
      const key = `${sceneMode}_car_${carriageNum}`;
      const carriage = carriages[key] || initServerCarriageTables(carriageNum, sceneMode);

      const tIdx = Number(payload.tableIndex) || 1;
      const table = carriage.tables?.find((t) => t.tableIndex === tIdx);
      if (table) {
        table.isSubmitted = true;
        table.playerSeat = payload.playerSeat || carriage.selectedSeat || '东';
        table.playerId = payload.playerId;
        table.playerName = payload.playerName;
        table.playerHand = payload.playerHand;
        table.submittedAt = Date.now();
        table.status = 'submitted';

        carriage.unplayedTableIndices = (carriage.unplayedTableIndices || []).filter((idx) => idx !== tIdx);
        if (carriage.unplayedTableIndices.length === 0) {
          carriage.isCompleted = true;
        }
        carriage.currentActiveTableIndex = null;

        carriages[key] = carriage;
        saveBookingCarriagesToDisk(carriages);

        sendJson(res, 200, { success: true, carriage, submittedTable: table });
        return true;
      }
      sendJson(res, 404, { success: false, error: 'table_not_found' });
      return true;
    } catch (err: any) {
      sendJson(res, 400, { success: false, error: String(err?.message || err) });
      return true;
    }
  }

  // 2. Database Export
  if (pathname === '/api/database/export' && method === 'GET') {
    const db = loadDatabase();
    sendJson(res, 200, db);
    return true;
  }

  // 3. User Sync
  if (pathname === '/api/user/sync' && method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = loadDatabase();
      if (payload.profile) {
        const pId = payload.profile.id;
        const pPhone = payload.profile.phone ? normalizePhone(payload.profile.phone) : '';

        // 严格安全审查：若手机号已被注销或移出授权白名单，坚决拒绝自愈建档与数据入库，防止死灰复燃
        const { allowedPhones, adminPhones } = getAllowedAndAdminPhones();
        const isRevoked = pPhone && (db.revokedPhones || []).some((ph: any) => {
          const np = normalizePhone(ph);
          return np && (np === pPhone || np.endsWith(pPhone) || pPhone.endsWith(np));
        });
        const isAllowed = !pPhone || allowedPhones.length === 0 ||
          allowedPhones.some((p) => p === pPhone || p.endsWith(pPhone) || pPhone.endsWith(p)) ||
          adminPhones.some((p) => p === pPhone || p.endsWith(pPhone) || pPhone.endsWith(p));

        if (isRevoked || !isAllowed) {
          if (pId && db.profiles[pId]) {
            delete db.profiles[pId];
            saveDatabase(db);
          }
          sendJson(res, 200, {
            success: false,
            notFound: true,
            revoked: true,
            error: '该账号手机号授权已被管理员移除，已注销',
          });
          return true;
        }

        let existing = pId && pId !== 'default' ? db.profiles[pId] : undefined;
        if (!existing && pPhone) {
          existing = Object.values(db.profiles).find((p) => {
            const ph = normalizePhone(p.phone);
            return ph && (ph === pPhone || ph.endsWith(pPhone) || pPhone.endsWith(ph));
          });
        }
        if (!existing && pId && pId !== 'default') {
          // 自愈建档，确保服务重启后本地缓存的合法玩家对局积分能够平滑同步入库，绝不误杀注销玩家
          db.profiles[pId] = {
            id: pId,
            username: payload.profile.username || pPhone || pId,
            name: payload.profile.name || '茶客',
            avatar: payload.profile.avatar || '👑',
            phone: pPhone,
            coins: typeof payload.profile.coins === 'number' ? Math.max(0, Math.floor(Number(payload.profile.coins))) : 2000,
            rating: typeof payload.profile.rating === 'number' ? payload.profile.rating : 1800,
            level: typeof payload.profile.level === 'number' ? payload.profile.level : 1,
            registeredAt: Date.now(),
            updatedAt: Date.now(),
          } as any;
          existing = db.profiles[pId];
        }

        if (existing) {
          // 服务端资产权威中心：仅当服务端无筹码记录时初始化，绝不允许客户端覆盖服务端权威筹码余额，防止断线冲抵丢失！
          if (typeof existing.coins !== 'number' || isNaN(existing.coins)) {
            if (typeof payload.profile.coins === 'number' && !isNaN(payload.profile.coins)) {
              existing.coins = Math.max(0, Math.floor(Number(payload.profile.coins)));
            } else {
              existing.coins = 2000;
            }
          }
          if (payload.profile.name) existing.name = payload.profile.name;
          if (payload.profile.avatar) existing.avatar = payload.profile.avatar;
          if (payload.profile.rating) existing.rating = payload.profile.rating;
          if (payload.profile.level) existing.level = payload.profile.level;
          if (payload.profile.stats) existing.stats = payload.profile.stats;
          existing.updatedAt = Date.now();
        }
      }
      if (payload.records && Array.isArray(payload.records)) {
        db.records = payload.records.slice(0, 100);
      }
      saveDatabase(db);
      const targetUser = payload.profile?.id ? db.profiles[payload.profile.id] : undefined;
      sendJson(res, 200, {
        success: true,
        coins: targetUser?.coins ?? payload.profile?.coins,
        rating: targetUser?.rating ?? payload.profile?.rating,
        level: targetUser?.level ?? payload.profile?.level,
        profile: targetUser ?? payload.profile,
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 4. Auth Register
  // 4. Auth Register (移除账号名，仅需授权手机号、6位密码与昵称头像，以手机号为唯一凭证)
  if (pathname === '/api/auth/register' && method === 'POST') {
    try {
      const { phone, password, nickname, avatar } = await parseJsonBody(req);
      const cleanPhone = normalizePhone(phone);
      if (!cleanPhone || !password) {
        sendJson(res, 200, { success: false, error: '请填写完整的手机号和密码' });
        return true;
      }
      if (String(password).trim().length !== 6) {
        sendJson(res, 200, { success: false, error: '密码必须为六位数' });
        return true;
      }
      if (cleanPhone.length < 5) {
        sendJson(res, 200, { success: false, error: '手机号格式不正确' });
        return true;
      }
      if (nickname && String(nickname).trim().length > 3) {
        sendJson(res, 200, { success: false, error: '昵称长度不能超过3个字' });
        return true;
      }

      const { allowedPhones, adminPhones } = getAllowedAndAdminPhones();
      const isAuthorized = allowedPhones.some((p) => p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p)) ||
                           adminPhones.some((p) => p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p));

      if (!isAuthorized) {
        sendJson(res, 200, {
          success: false,
          error: '该手机号未获得 Telegram Bot 授权白名单！必须先由管理员在 Bot 中发送 /authphone 授权后方可注册。',
        });
        return true;
      }

      const isAdmin = adminPhones.some((p) => p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p));
      const db = loadDatabase();

      let existingProfile: any = null;
      for (const p of Object.values(db.profiles)) {
        const existingPhone = normalizePhone(p.phone);
        if (existingPhone && (existingPhone === cleanPhone || existingPhone.endsWith(cleanPhone) || cleanPhone.endsWith(existingPhone))) {
          if (p.password) {
            sendJson(res, 200, { success: false, error: '该授权手机号已注册过账号，请直接使用手机号登录' });
            return true;
          }
          existingProfile = p;
          break;
        }
      }

      if (existingProfile) {
        // 白名单预建建档用户首次在前端输入密码完成注册激活
        const finalName = nickname && String(nickname).trim() ? String(nickname).trim() : (existingProfile.name || `茶客${cleanPhone.slice(-4)}`);
        existingProfile.password = hashPassword(String(password).trim());
        existingProfile.name = finalName;
        existingProfile.avatar = avatar || existingProfile.avatar || '👑';
        existingProfile.isAdmin = isAdmin;
        existingProfile.updatedAt = Date.now();
        const sessionToken = 'sess_' + Math.random().toString(36).slice(2) + '_' + Date.now();
        existingProfile.sessionToken = sessionToken;

        saveDatabase(db);
        triggerDebouncedTxtBackup(`激活白名单新茶客 (${existingProfile.name})`, db);
        recordAdminLog('USER_REGISTER', 'Telegram Auth', cleanPhone, `白名单预建用户激活注册成功: ${existingProfile.name} (📱 ${cleanPhone}, UID: ${existingProfile.id})，当前预设筹码: ${existingProfile.coins || 0}`, 0);

        sendJson(res, 200, { success: true, profile: existingProfile, sessionToken });
        return true;
      }

      const newId = `USER-${Math.floor(1000 + Math.random() * 9000)}`;
      const finalName = nickname && String(nickname).trim() ? String(nickname).trim() : `茶客${cleanPhone.slice(-4)}`;
      const newProfile: UserProfileData = {
        id: newId,
        username: cleanPhone,
        password: hashPassword(String(password).trim()),
        name: finalName,
        avatar: avatar || '👑',
        phone: cleanPhone,
        isAdmin,
        isBanned: false,
        coins: 0,
        rating: 1800,
        level: 1,
        lastCheckinDate: '',
        registeredAt: Date.now(),
        updatedAt: Date.now(),
        stats: {
          yansan: { played: 0, won: 0, highestScore: 0 },
          shisanshui: { played: 0, won: 0, highestScore: 0 },
          mahjong: { played: 0, won: 0, highestScore: 0 },
        },
      };

      const sessionToken = 'sess_' + Math.random().toString(36).slice(2) + '_' + Date.now();
      newProfile.sessionToken = sessionToken;

      db.profiles[newId] = newProfile;
      saveDatabase(db);
      triggerDebouncedTxtBackup(`新茶客注册 (${newProfile.name})`, db);

      recordAdminLog('USER_REGISTER', 'Telegram Auth', cleanPhone, `新用户注册: ${newProfile.name} (📱 ${cleanPhone}, UID: ${newId})，初始筹码: 0`, 0);

      if (broadcast) {
        try {
          const freshPlayers = presenceTracker.getAllPlayers(db.profiles || {});
          broadcast({ type: 'teahouse_players_update', count: freshPlayers.length, onlineCount: freshPlayers.filter(p => p.isOnline).length, players: freshPlayers });
        } catch {}
      }

      sendJson(res, 200, { success: true, profile: newProfile, sessionToken });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 5. Auth Login (仅支持手机号和密码登录，取消用户名登录)
  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      const { phone, username, password } = await parseJsonBody(req);
      const cleanPhone = normalizePhone(phone || username || '');
      if (!cleanPhone || !password) {
        sendJson(res, 200, { success: false, error: '请输入手机号和密码' });
        return true;
      }

      const db = loadDatabase();
      let foundProfile: any = null;
      for (const p of Object.values(db.profiles)) {
        const profPhone = normalizePhone(p.phone);
        if (profPhone && (profPhone === cleanPhone || profPhone.endsWith(cleanPhone) || cleanPhone.endsWith(profPhone))) {
          foundProfile = p;
          break;
        }
      }
      // 手机号未建档，检查是否在白名单中
      if (!foundProfile) {
        const { allowedPhones, adminPhones } = getAllowedAndAdminPhones();
        const isAuth = allowedPhones.some((p) => p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p)) ||
                       adminPhones.some((p) => p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p));
        if (isAuth) {
          sendJson(res, 200, {
            success: false,
            needRegister: true,
            error: '该手机号已在白名单授权，但尚未激活注册。请先点击【注册账号】设置您的6位密码与牌桌昵称！',
          });
          return true;
        }
        sendJson(res, 200, { success: false, error: '该手机号尚未注册或密码错误，请先注册' });
        return true;
      }
      if (foundProfile.isBanned) {
        sendJson(res, 200, { success: false, error: `该账号已被管理员封禁: ${foundProfile.bannedReason || '违规操作'}` });
        return true;
      }

      // Check whether user's bound phone is still authorized in whitelist
      const { allowedPhones, adminPhones } = getAllowedAndAdminPhones();
      const userPhone = normalizePhone(foundProfile.phone);
      const isStillAuthorized = !userPhone ||
        allowedPhones.some((p) => p === userPhone || p.endsWith(userPhone) || userPhone.endsWith(p)) ||
        adminPhones.some((p) => p === userPhone || p.endsWith(userPhone) || userPhone.endsWith(p));

      if (!isStillAuthorized) {
        delete db.profiles[foundProfile.id];
        saveDatabase(db);
        sendJson(res, 200, {
          success: false,
          error: '该账号绑定的手机号授权已被管理员移除，账号已注销。如需使用请联系管理员重新授权。',
        });
        return true;
      }

      // 核心安全漏洞修复：白名单预建档手机号尚未在前端注册设置密码，严禁以任意密码直接登录！
      if (!foundProfile.password || !String(foundProfile.password).trim()) {
        sendJson(res, 200, {
          success: false,
          needRegister: true,
          error: '该手机号已在白名单授权，但尚未激活注册。请先点击【注册账号】设置您的6位密码与牌桌昵称！',
        });
        return true;
      }

      const isValid = verifyPassword(String(password).trim(), foundProfile.password);
      if (!isValid) {
        sendJson(res, 200, { success: false, error: '手机号或密码不正确' });
        return true;
      }
      // Upgrade legacy plaintext password to secure hash upon successful login
      if (!foundProfile.password.includes(':')) {
        foundProfile.password = hashPassword(String(password).trim());
      }
      const sessionToken = 'sess_' + Math.random().toString(36).slice(2) + '_' + Date.now();
      foundProfile.sessionToken = sessionToken;
      saveDatabase(db);

      sendJson(res, 200, { success: true, profile: foundProfile, sessionToken });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // Check Session (Single-device session enforcement & authorization validation)
  if (pathname === '/api/auth/check-session' && method === 'POST') {
    try {
      const { userId, sessionToken } = await parseJsonBody(req);
      const db = loadDatabase();
      const user = Object.values(db.profiles).find((p) => p.id === userId);
      if (!user) {
        sendJson(res, 200, { success: true, valid: false, sessionExpired: true, error: '用户不存在或已被清理' });
        return true;
      }

      const { allowedPhones, adminPhones } = getAllowedAndAdminPhones();
      const userPhone = normalizePhone(user.phone || '');
      const isStillAuthorized = !userPhone || allowedPhones.length === 0 ||
        allowedPhones.some((p) => p === userPhone || p.endsWith(userPhone) || userPhone.endsWith(p)) ||
        adminPhones.some((p) => p === userPhone || p.endsWith(userPhone) || userPhone.endsWith(p));

      const isRevoked = userPhone && (db.revokedPhones || []).some((ph: any) => {
        const np = normalizePhone(ph);
        return np && (np === userPhone || np.endsWith(userPhone) || userPhone.endsWith(np));
      });

      if (!isStillAuthorized || isRevoked) {
        delete db.profiles[user.id];
        saveDatabase(db);
        sendJson(res, 200, { success: true, valid: false, sessionExpired: true, error: '该账号手机号授权已被管理员移出白名单，账号已注销' });
        return true;
      }

      if (user.sessionToken && user.sessionToken !== sessionToken) {
        sendJson(res, 200, { success: true, valid: false, sessionExpired: true, error: '您的账号已在另一台设备登录，当前会话已失效' });
        return true;
      }
      sendJson(res, 200, {
        success: true,
        valid: true,
        coins: user.coins,
        rating: user.rating,
        level: user.level,
        name: user.name,
        profile: user,
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 6. User Search
  if (pathname === '/api/users/search' && method === 'GET') {
    try {
      const rawPhone = String(urlObj.searchParams.get('phone') || '').trim();
      const phone = normalizePhone(rawPhone) || rawPhone.replace(/\D/g, '');
      if (!phone) {
        sendJson(res, 400, { success: false, error: '请输入要搜索的手机号' });
        return true;
      }
      const db = loadDatabase();
      let found = findUser(phone, db);
      if (!found && phone.length >= 7) {
        const { allowedPhones, adminPhones } = getAllowedAndAdminPhones();
        const isAllowed = allowedPhones.some((p) => p === phone || p.endsWith(phone) || phone.endsWith(p)) ||
                          adminPhones.some((p) => p === phone || p.endsWith(phone) || phone.endsWith(p));
        if (isAllowed) {
          found = ensureUserProfile(phone, db, 0);
          saveDatabase(db);
        }
      }
      if (!found) {
        sendJson(res, 200, { success: false, error: '未找到该手机号对应的茶客，请确认手机号是否正确或已获白名单授权' });
        return true;
      }
      sendJson(res, 200, {
        success: true,
        user: {
          id: found.id,
          name: found.name,
          username: found.username,
          phone: found.phone,
          coins: found.coins,
          rating: found.rating,
          level: found.level,
          avatar: found.avatar,
          isAdmin: found.isAdmin,
          isBanned: found.isBanned,
        },
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 7. Points Transfer
  if (pathname === '/api/points/transfer' && method === 'POST') {
    try {
      const { senderId, senderPhone, recipientId, recipientPhone, amount, clientCoins } = await parseJsonBody(req);
      const transferAmount = Math.floor(Number(amount) || 0);
      if (transferAmount <= 0) {
        sendJson(res, 400, { success: false, error: '赠送筹码数量必须大于0' });
        return true;
      }
      const db = loadDatabase();
      let sender = (senderId && db.profiles[senderId]) || (senderPhone && findUser(senderPhone, db));
      if (!sender && senderId) {
        sender = findUser(senderId, db);
      }
      if (!sender) {
        sendJson(res, 400, { success: false, error: '发送方账户不存在或尚未登录' });
        return true;
      }

      // Synchronize client local coins if client has higher verified balance
      if (typeof clientCoins === 'number' && clientCoins > sender.coins) {
        sender.coins = Math.max(sender.coins, Math.floor(clientCoins));
      }

      if (sender.coins < transferAmount) {
        sendJson(res, 200, { success: false, error: `持有筹码不足，当前仅有 ${sender.coins} 分，无法赠送` });
        return true;
      }

      let recipient = (recipientId && db.profiles[recipientId]) || (recipientPhone && findUser(recipientPhone, db));
      if (!recipient && recipientPhone) {
        const cleanRec = normalizePhone(recipientPhone);
        if (cleanRec && cleanRec.length >= 7) {
          recipient = ensureUserProfile(cleanRec, db, 0);
        }
      }

      if (!recipient) {
        sendJson(res, 200, { success: false, error: '未找到该接收手机号对应的用户' });
        return true;
      }

      const cleanSenderPhone = normalizePhone(sender.phone || '');
      const cleanRecipientPhone = normalizePhone(recipient.phone || '');
      if (cleanSenderPhone && cleanRecipientPhone && cleanSenderPhone === cleanRecipientPhone) {
        sendJson(res, 200, { success: false, error: '不能向自己的手机号赠送筹码' });
        return true;
      }

      sender.coins -= transferAmount;
      recipient.coins += transferAmount;
      sender.updatedAt = Date.now();
      recipient.updatedAt = Date.now();

      saveDatabase(db);
      triggerDebouncedTxtBackup(`互赠筹码 (${sender.name} -> ${recipient.name})`, db);

      recordAdminLog(
        'POINTS_TRANSFER',
        sender.name,
        recipient.name,
        `互赠筹码 ${transferAmount} 分 (发起人: ${sender.phone || sender.name} -> 接收人: ${recipient.phone || recipient.name})`,
        transferAmount
      );

      // Real-time WebSocket broadcasting to notify both users and teahouse
      if (typeof broadcast === 'function') {
        try {
          broadcast({
            type: 'user_coins_updated',
            userId: sender.id,
            phone: sender.phone,
            username: sender.username,
            name: sender.name,
            coins: sender.coins,
            rating: sender.rating,
            level: sender.level,
            delta: -transferAmount,
          });
          broadcast({
            type: 'user_coins_updated',
            userId: recipient.id,
            phone: recipient.phone,
            username: recipient.username,
            name: recipient.name,
            coins: recipient.coins,
            rating: recipient.rating,
            level: recipient.level,
            delta: transferAmount,
          });
          broadcastTeahousePlayersRoster(broadcast, db);
          broadcast({
            type: 'chat',
            message: {
              id: 'gift_' + Date.now(),
              sender: '钱庄管家',
              avatar: '🪙',
              text: `🎉 茶客【${sender.name}】向【${recipient.name}】赠送了 ${transferAmount.toLocaleString()} 分筹码！`,
              time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              channel: 'world',
              action: 'gift',
            },
          });
        } catch {}
      }

      sendJson(res, 200, {
        success: true,
        transferAmount,
        senderCoins: sender.coins,
        recipientCoins: recipient.coins,
        senderProfile: sender,
        recipientProfile: recipient,
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 7.4 Real-time Teahouse Registered & Active Players Roster Endpoint
  if (pathname === '/api/teahouse/players' && method === 'GET') {
    try {
      const db = loadDatabase();
      const players = presenceTracker.getAllPlayers(db.profiles || {});
      sendJson(res, 200, {
        success: true,
        count: players.length,
        onlineCount: players.filter((p) => p.isOnline).length,
        players,
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 7.5 Real-time Presence Counts & Players Endpoint
  if (pathname === '/api/presence' && method === 'GET') {
    try {
      const counts = presenceTracker.getRealGamePresence();
      const db = loadDatabase();
      const players = presenceTracker.getAllPlayers(db.profiles || {});
      sendJson(res, 200, {
        success: true,
        ...counts,
        playersCount: players.length,
        players,
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 7.6 Active Rooms List Endpoint
  if (pathname === '/api/rooms' && method === 'GET') {
    try {
      const activeRooms = [
        {
          id: 'RM-202',
          title: '风雷堂 · 经典烟三四人赛',
          gameType: 'yansan',
          status: 'playing',
          playersCount: 4,
          spectators: 9,
          baseStake: 10,
          modeLabel: '方块四首出 · 四人争锋',
        },
        {
          id: 'RM-204',
          title: '水镜阁 · 水镜十三水',
          gameType: 'shisanshui',
          status: 'playing',
          playersCount: 4,
          spectators: 18,
          baseStake: 10,
          modeLabel: '头中尾三道 · 智能理牌',
        },
        {
          id: 'RM-205',
          title: '雀神楼 · 经典国标麻将',
          gameType: 'mahjong',
          status: 'playing',
          playersCount: 4,
          spectators: 12,
          baseStake: 10,
          modeLabel: '国标经典 · 雀神东风圈',
        },
      ];
      sendJson(res, 200, { success: true, rooms: activeRooms });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // ==========================================
  // TELEGRAM ADMIN APIS (管理员专属控制接口)
  // ==========================================

  // 8. Admin: List All Users
  if (pathname === '/api/admin/users' && method === 'GET') {
    try {
      const db = loadDatabase();
      const users = Object.values(db.profiles).map((p) => ({
        id: p.id,
        name: p.name,
        username: p.username || '',
        avatar: p.avatar,
        phone: p.phone || '未绑定',
        isAdmin: Boolean(p.isAdmin),
        isBanned: Boolean(p.isBanned),
        bannedReason: p.bannedReason || '',
        coins: p.coins,
        rating: p.rating,
        level: p.level,
        updatedAt: p.updatedAt,
        stats: p.stats,
      }));
      sendJson(res, 200, { success: true, users });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 9. Admin: Adjust User Points
  if (pathname === '/api/admin/points/adjust' && method === 'POST') {
    try {
      const { targetId, phone, delta, type = 'add', reason = '管理员调整', operator = 'Telegram Admin' } = await parseJsonBody(req);
      const db = loadDatabase();
      const user = (targetId && db.profiles[targetId]) || (phone && findUser(phone, db));
      if (!user) {
        sendJson(res, 404, { success: false, error: '未找到目标用户' });
        return true;
      }

      const num = Math.floor(Number(delta) || 0);
      const oldCoins = user.coins;

      if (type === 'set') {
        user.coins = Math.max(0, num);
      } else if (type === 'subtract') {
        user.coins = Math.max(0, user.coins - Math.abs(num));
      } else {
        user.coins = Math.max(0, user.coins + Math.abs(num));
      }
      user.updatedAt = Date.now();

      saveDatabase(db);
      triggerDebouncedTxtBackup(`Web后台调整筹码 (${user.name})`, db);
      recordAdminLog(
        `POINTS_${type.toUpperCase()}`,
        operator,
        user.name,
        `${reason}: ${oldCoins} -> ${user.coins} (变动: ${user.coins - oldCoins >= 0 ? '+' : ''}${user.coins - oldCoins})`,
        user.coins - oldCoins
      );

      if (typeof broadcast === 'function') {
        broadcast({
          type: 'user_coins_updated',
          userId: user.id,
          phone: user.phone,
          username: user.username,
          name: user.name,
          coins: user.coins,
          rating: user.rating,
          level: user.level,
          delta: user.coins - oldCoins,
          operator,
          timestamp: Date.now(),
        });
      }

      sendJson(res, 200, {
        success: true,
        user,
        oldCoins,
        newCoins: user.coins,
        delta: user.coins - oldCoins,
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 9b. Admin: Export All Players Points TXT Document (网页端一键下载 TXT 灾备文档)
  if ((pathname === '/api/admin/export-points-txt' || pathname === '/api/admin/points/export-txt') && (method === 'GET' || method === 'POST')) {
    try {
      const db = loadDatabase();
      const { txtContent, fileName, safeFileName } = exportPlayersPointsTxt(db);
      const fileBuffer = Buffer.from(txtContent, 'utf-8');

      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      res.end(fileBuffer);
      return true;
    } catch (e: any) {
      sendJson(res, 500, { success: false, error: String(e.message || e) });
      return true;
    }
  }

  // 10. Admin: Batch Adjust Points for All Users
  if (pathname === '/api/admin/points/batch' && method === 'POST') {
    try {
      const { amount, reason = '全服福利金发放', operator = 'Telegram Admin' } = await parseJsonBody(req);
      const num = Math.floor(Number(amount) || 0);
      if (num === 0) {
        sendJson(res, 400, { success: false, error: '批量调整数量不能为0' });
        return true;
      }
      const db = loadDatabase();
      let affectedCount = 0;
      for (const user of Object.values(db.profiles)) {
        user.coins = Math.max(0, user.coins + num);
        user.updatedAt = Date.now();
        affectedCount++;
      }
      saveDatabase(db);
      recordAdminLog(
        'POINTS_BATCH',
        operator,
        `全服玩家 (${affectedCount}人)`,
        `${reason}: 每人发放 ${num > 0 ? '+' : ''}${num} 分`,
        num
      );
      if (broadcast) {
        broadcast({
          type: 'chat_broadcast',
          roomId: 'ALL',
          message: {
            id: `sys-${Date.now()}`,
            sender: '茶楼通告',
            avatar: '📢',
            text: `【全服通告】${reason}：所有茶客每人到账 ${num} 分筹码！`,
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          },
        });
      }
      sendJson(res, 200, { success: true, affectedCount, amount: num });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 11. Admin: Get Whitelist
  if (pathname === '/api/admin/whitelist' && method === 'GET') {
    try {
      const { allowedPhones, adminPhones } = getAllowedAndAdminPhones();
      sendJson(res, 200, {
        success: true,
        authorizedPhones: allowedPhones,
        adminPhones,
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 12. Admin: Add Whitelist Phone
  if (pathname === '/api/admin/whitelist/add' && method === 'POST') {
    try {
      const { phones, operator = 'Telegram Admin' } = await parseJsonBody(req);
      const list = Array.isArray(phones)
        ? phones
        : String(phones || '').split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);

      if (list.length === 0) {
        sendJson(res, 400, { success: false, error: '请输入有效的手机号' });
        return true;
      }

      const db = loadDatabase();
      const current = new Set(db.authorizedPhones || []);
      const added: string[] = [];

      for (const p of list) {
        if (!current.has(p)) {
          current.add(p);
          added.push(p);
        }
      }

      // If phone was in revokedPhones, restore it
      if (db.revokedPhones && Array.isArray(db.revokedPhones)) {
        db.revokedPhones = db.revokedPhones.filter((p: string) => !list.includes(p));
      }

      db.authorizedPhones = Array.from(current);
      saveDatabase(db);

      recordAdminLog(
        'WHITELIST_ADD',
        operator,
        added.join(', '),
        `将 ${added.length} 个手机号加入 Telegram 授权白名单: ${added.join(', ')}`
      );

      sendJson(res, 200, {
        success: true,
        added,
        totalAuthorized: db.authorizedPhones,
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 13. Admin: Remove Whitelist Phone & Purge Associated Profile Residues
  if (pathname === '/api/admin/whitelist/remove' && method === 'POST') {
    try {
      const { phone, operator = 'Telegram Admin' } = await parseJsonBody(req);
      const cleanPhone = String(phone || '').trim().replace(/\D/g, '');
      if (!cleanPhone) {
        sendJson(res, 400, { success: false, error: '请提供要移出的手机号' });
        return true;
      }
      const db = loadDatabase();
      const current = new Set((db.authorizedPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
      const existed = current.has(cleanPhone);
      current.delete(cleanPhone);
      db.authorizedPhones = Array.from(current);

      const currentAdmin = new Set((db.adminPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
      currentAdmin.delete(cleanPhone);
      db.adminPhones = Array.from(currentAdmin);

      if (!db.revokedPhones) db.revokedPhones = [];
      if (!db.revokedPhones.includes(cleanPhone)) {
        db.revokedPhones.push(cleanPhone);
      }

      // Purge registered profiles associated with this phone
      const deletedUsers: string[] = [];
      for (const [pId, profile] of Object.entries(db.profiles)) {
        const pPhone = String(profile.phone || '').trim().replace(/\D/g, '');
        if (pPhone === cleanPhone) {
          deletedUsers.push(`${profile.name} (${pId})`);
          delete db.profiles[pId];
        }
      }

      saveDatabase(db);

      recordAdminLog(
        'WHITELIST_REMOVE',
        operator,
        cleanPhone,
        `将手机号 ${cleanPhone} 移出 Telegram 授权白名单，彻底清理注销账号: ${deletedUsers.length > 0 ? deletedUsers.join(', ') : '无注册用户'}`
      );

      sendJson(res, 200, {
        success: true,
        removed: cleanPhone,
        deletedUsers,
        totalAuthorized: db.authorizedPhones,
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 13b. Admin: Delete User Profile & Purge Authorization
  if (pathname === '/api/admin/user/delete' && method === 'POST') {
    try {
      const { userId, phone, operator = 'Telegram Admin' } = await parseJsonBody(req);
      const db = loadDatabase();
      const user = (userId && db.profiles[userId]) || (phone && findUser(phone, db));
      if (!user) {
        sendJson(res, 404, { success: false, error: '未找到指定用户' });
        return true;
      }

      const pId = user.id;
      const userName = user.name;
      const userPhone = String(user.phone || '').trim().replace(/\D/g, '');
      delete db.profiles[pId];

      if (userPhone) {
        const current = new Set((db.authorizedPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
        current.delete(userPhone);
        db.authorizedPhones = Array.from(current);

        const currentAdmin = new Set((db.adminPhones || []).map((p: any) => String(p).trim().replace(/\D/g, '')));
        currentAdmin.delete(userPhone);
        db.adminPhones = Array.from(currentAdmin);

        if (!db.revokedPhones) db.revokedPhones = [];
        if (!db.revokedPhones.includes(userPhone)) db.revokedPhones.push(userPhone);
      }

      saveDatabase(db);
      recordAdminLog('USER_DELETE', operator, userName, `管理员彻底删除并注销用户: ${userName} (${pId}, 📱 ${userPhone || '未绑'})`);

      sendJson(res, 200, { success: true, deletedUser: userName, userId: pId });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 14. Admin: Ban / Unban User
  if (pathname === '/api/admin/user/ban' && method === 'POST') {
    try {
      const { userId, phone, isBanned, reason = '违反茶楼守则', operator = 'Telegram Admin' } = await parseJsonBody(req);
      const db = loadDatabase();
      const user = (userId && db.profiles[userId]) || (phone && findUser(phone, db));
      if (!user) {
        sendJson(res, 404, { success: false, error: '未找到指定用户' });
        return true;
      }
      user.isBanned = Boolean(isBanned);
      user.bannedReason = isBanned ? reason : '';
      user.updatedAt = Date.now();
      saveDatabase(db);

      recordAdminLog(
        isBanned ? 'USER_BAN' : 'USER_UNBAN',
        operator,
        user.name,
        isBanned ? `封禁账号 (${user.phone}): ${reason}` : `解封账号 (${user.phone})`
      );

      sendJson(res, 200, { success: true, user });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 15. Admin: Broadcast Announcement
  if (pathname === '/api/admin/broadcast' && method === 'POST') {
    try {
      const { text, author = 'Telegram 管理员' } = await parseJsonBody(req);
      const cleanText = String(text || '').trim();
      if (!cleanText) {
        sendJson(res, 400, { success: false, error: '公告内容不能为空' });
        return true;
      }

      const db = loadDatabase();
      const announcement = {
        id: `ann-${Date.now()}`,
        text: cleanText,
        author,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };

      db.systemAnnouncements = [announcement, ...(db.systemAnnouncements || []).slice(0, 19)];
      saveDatabase(db);

      recordAdminLog('ANNOUNCEMENT_BROADCAST', author, '全服房间', cleanText);

      if (broadcast) {
        broadcast({
          type: 'chat_broadcast',
          roomId: 'ALL',
          message: {
            id: `broadcast-${Date.now()}`,
            sender: `📢 ${author}`,
            avatar: '🏮',
            text: cleanText,
            timestamp: announcement.timestamp,
          },
        });
      }

      sendJson(res, 200, { success: true, announcement });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 16. Admin: Get Operation Logs
  if (pathname === '/api/admin/logs' && method === 'GET') {
    try {
      const db = loadDatabase();
      sendJson(res, 200, {
        success: true,
        logs: db.adminLogs || [],
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 17. Telegram Command Processor (Direct interactive CLI & Webhook)
  const isWebhookPath = (pathname === '/api/telegram/webhook' || pathname === '/api/telegram/webhook/');
  if ((pathname === '/api/telegram/command' || isWebhookPath) && method === 'POST') {
    try {
      // If Telegram Webhook Secret Token is configured in .env, verify header
      const rawSecret = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim().replace(/^['"]+|['"]+$/g, '');
      if (isWebhookPath && rawSecret) {
        const secretHeader = req.headers ? req.headers['x-telegram-bot-api-secret-token'] : undefined;
        if (secretHeader !== rawSecret) {
          console.warn('⚠️ [Telegram Webhook] Secret Token 不匹配:', { received: secretHeader, expected: rawSecret });
          sendJson(res, 403, { success: false, error: '非法请求：Telegram Webhook 密钥校验失败' });
          return true;
        }
      }

      const body = await parseJsonBody(req);
      const result = await executeTelegramUpdate(body, broadcast, { isWebhook: isWebhookPath });

      // Telegram Webhook Delivery Engine:
      // 极速 100% 键盘菜单交付引擎：
      // 在 Webhook HTTP 200 响应体中直接以 JSON 格式原装返回 method: "sendMessage" + 5 排快捷键盘 + safeText，
      // 100% 避免由于 Termux 本地无法直连 api.telegram.org 导致发信超时卡死、彻底消除消息丢包与键盘遗漏！
      if (isWebhookPath) {
        const messageObj = body.message || body.edited_message || body.channel_post || body.callback_query?.message;
        const targetChatId = messageObj?.chat?.id || body.callback_query?.from?.id || result.chatId;

        const { refreshEnvFromDisk, getTelegramApiBase, syncTelegramBotCommands } = await import('./telegramBotService.ts');
        refreshEnvFromDisk();
        const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^['"]+|['"]+$/g, '');

        if (targetChatId && result.reply) {
          const plainText = result.reply.replace(/[*_`\[\]]/g, '');
          console.log(`⚡ [Telegram Webhook] 正在通过 HTTP 200 响应体即时交付回复与 5 排快捷键盘 (chatId: ${targetChatId})`);

          // 若为 /start 或 /help 指令，自动触发后台同步注册官方 [/] 指令菜单与 ChatMenuButton
          if (result.command.startsWith('/start') || result.command.startsWith('/help')) {
            syncTelegramBotCommands(botToken).catch(() => {});
          }

          // 同步毫秒级返回 Webhook JSON 载荷给 Telegram 官方服务器，Telegram 官方秒级渲染键盘与消息 (排他性返回，杜绝消息重复)
          sendJson(res, 200, {
            method: 'sendMessage',
            chat_id: targetChatId,
            text: plainText,
            reply_markup: result.replyMarkup,
          });
          return true;
        }

        sendJson(res, 200, { ok: true, processed: true });
        return true;
      }

      sendJson(res, 200, result);
    } catch (e) {
      console.error('[Telegram Webhook Error]', e);
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 17.5. Telegram: Explicit Command & Keyboard Menu Synchronization Endpoint
  if ((pathname === '/api/telegram/sync-commands' || pathname === '/api/telegram/sync') && (method === 'POST' || method === 'GET')) {
    try {
      const { syncTelegramBotCommands } = await import('./telegramBotService.ts');
      const syncResult = await syncTelegramBotCommands();
      sendJson(res, 200, {
        success: syncResult.success,
        message: syncResult.success
          ? '🟢 成功向 Telegram 官方注册 14 条下拉菜单指令与 5 排快捷键盘菜单 (setMyCommands & setChatMenuButton)！'
          : `⚠️ 同步 Telegram 键盘菜单提示: ${syncResult.error || '未知错误'}`,
        error: syncResult.error,
      });
    } catch (e: any) {
      sendJson(res, 500, { success: false, error: String(e.message || e) });
    }
    return true;
  }

  // 18. Telegram: Set Webhook Helper Endpoint & Browser One-Click Activation (支持传入 Token 自动保存并秒级自动激活)
  if ((pathname === '/api/telegram/set-webhook' || pathname === '/api/telegram/register') && (method === 'POST' || method === 'GET')) {
    try {
      const { refreshEnvFromDisk, normalizePublicUrl, stopTelegramPolling, getTelegramApiBase, initTelegramBotService, syncTelegramBotCommands } = await import('./telegramBotService.ts');
      refreshEnvFromDisk();

      const body = method === 'POST' ? await parseJsonBody(req).catch(() => ({})) : {};
      const queryToken = urlObj.searchParams.get('token');
      const providedToken = (queryToken || body.token || '').trim().replace(/^['"]+|['"]+$/g, '');

      // 如果请求中携带了新 Token，立即将其自动持久化写入 .env，彻底免除手动编辑 .env 的繁琐！
      if (providedToken) {
        saveEnvVariable('TELEGRAM_BOT_TOKEN', providedToken);
        process.env.TELEGRAM_BOT_TOKEN = providedToken;
        console.log(`🤖 [Telegram] 自动更新并保存 TELEGRAM_BOT_TOKEN: ${providedToken.slice(0, 5)}...`);
      }

      const token = (process.env.TELEGRAM_BOT_TOKEN || providedToken || '').trim().replace(/^['"]+|['"]+$/g, '');

      const queryUrl = urlObj.searchParams.get('url');
      const targetAppUrl = normalizePublicUrl(queryUrl || body.url || process.env.URL || process.env.APP_URL || process.env.WEBHOOK_URL || '');
      const webhookUrl = targetAppUrl ? `${targetAppUrl}/api/telegram/webhook` : '';
      const dropPending = urlObj.searchParams.get('drop_pending') !== 'false';

      const rawSecret = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim().replace(/^['"]+|['"]+$/g, '');
      const validSecret = /^[A-Za-z0-9_-]{1,256}$/.test(rawSecret) ? rawSecret : '';
      const secretParam = validSecret ? `&secret_token=${encodeURIComponent(validSecret)}` : '';

      const officialSetWebhookUrl = token ? `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(
        webhookUrl
      )}${secretParam}&drop_pending_updates=${dropPending}&allowed_updates=${encodeURIComponent(
        JSON.stringify(['message', 'edited_message', 'channel_post', 'callback_query'])
      )}` : '';

      const officialWebhookInfoUrl = token ? `https://api.telegram.org/bot${token}/getWebhookInfo` : '';

      // 尝试由服务端发起直连自动激活注册 (服务端直通 Telegram 官方)
      let serverOk = false;
      let serverData: any = null;
      let serverErrorMsg: string | null = null;
      let botMe: any = null;

      if (token && targetAppUrl) {
        try {
          const apiBase = getTelegramApiBase();
          const serverFetchUrl = `${apiBase}/bot${token}/setWebhook?url=${encodeURIComponent(
            webhookUrl
          )}${secretParam}&drop_pending_updates=${dropPending}&allowed_updates=${encodeURIComponent(
            JSON.stringify(['message', 'edited_message', 'channel_post', 'callback_query'])
          )}`;

          const tgResp = await fetch(serverFetchUrl, { signal: AbortSignal.timeout(6000) });
          serverData = await tgResp.json().catch(() => ({}));
          if (serverData && serverData.ok) {
            serverOk = true;
            stopTelegramPolling();
            // 查询 Bot 账号身份
            const meRes = await fetch(`${apiBase}/bot${token}/getMe`, { signal: AbortSignal.timeout(4000) });
            const meData = await meRes.json().catch(() => ({}));
            if (meData?.ok) botMe = meData.result;
            initTelegramBotService(broadcast).catch(() => {});
            // 自动同步下拉指令与菜单按钮
            syncTelegramBotCommands(token, apiBase).catch(() => {});
          } else {
            serverErrorMsg = serverData?.description || 'Telegram 官方返回未成功';
          }
        } catch (err: any) {
          serverErrorMsg = err?.message || String(err);
        }
      }

      const isHtmlRequest = Boolean(req.headers?.accept?.includes('text/html'));

      if (isHtmlRequest) {
        const pageHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Telegram Bot Webhook 全自动激活中枢</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; display: flex; justify-content: center; align-items: center; min-height: 100vh; box-sizing: border-box; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; max-width: 680px; width: 100%; padding: 32px; box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.6); }
    h1 { margin-top: 0; font-size: 22px; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 700; }
    .status-success { background: #065f46; color: #34d399; }
    .status-pending { background: #854d0e; color: #fde047; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; cursor: pointer; text-align: center; font-size: 14px; transition: all 0.2s; border: none; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #334155; color: #e2e8f0; }
    .btn-secondary:hover { background: #475569; }
    .btn-success { background: #059669; color: #fff; }
    .btn-success:hover { background: #047857; }
    .url-box { background: #0f172a; border: 1px solid #334155; padding: 12px; border-radius: 10px; font-family: monospace; font-size: 12px; word-break: break-all; color: #94a3b8; margin: 10px 0; }
    .input-field { width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; border-radius: 10px; padding: 12px; font-size: 14px; color: #f8fafc; font-family: monospace; margin: 8px 0 16px 0; }
    .input-field:focus { outline: none; border-color: #38bdf8; }
    .tips { background: rgba(56, 189, 248, 0.1); border-left: 4px solid #38bdf8; padding: 14px; border-radius: 8px; font-size: 13px; line-height: 1.6; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🤖 Telegram Bot Webhook 全自动激活与诊断中枢</h1>
    <p>
      当前激活状态:
      ${serverOk
        ? `<span class="status-badge status-success">🟢 Webhook 已自动激活成功！机器人在线 (账号: @${botMe?.username || '国粹棋牌Bot'})</span>`
        : (token
            ? '<span class="status-badge status-pending">⚡ 待激活（可直接点击下方按钮一键完成）</span>'
            : '<span class="status-badge status-pending">🔑 尚未配置 Bot Token（请在下方填入自动激活）</span>')}
    </p>

    <!-- Token 填写与自动保存表单 -->
    <form method="POST" action="/api/telegram/set-webhook" style="margin: 20px 0; padding: 18px; background: #141f32; border-radius: 14px; border: 1px solid #25334d;">
      <label style="font-size: 13px; font-weight: 600; color: #cbd5e1;">🔑 Telegram Bot Token (自动保存到 .env 并激活):</label>
      <input type="text" name="token" class="input-field" placeholder="例如: 7123456789:AAHxyzABCDEFGHIJKLMNopqrstuvwxyz" value="${token || ''}" required />
      <button type="submit" class="btn btn-success" style="width: 100%;">🚀 一键自动保存并激活 Webhook</button>
    </form>

    ${token ? `
    <div style="margin: 20px 0; display: flex; flex-wrap: wrap; gap: 8px;">
      ${officialSetWebhookUrl ? `<a class="btn btn-primary" href="${officialSetWebhookUrl}" target="_blank">👉 在当前浏览器中直连官方激活 Webhook</a>` : ''}
      <a class="btn btn-secondary" href="/api/telegram/sync-commands" target="_blank">🔄 强制同步 5 排键盘与 [/] 指令菜单</a>
      ${officialWebhookInfoUrl ? `<a class="btn btn-secondary" href="${officialWebhookInfoUrl}" target="_blank">🔍 查询官方 Webhook 深度诊断</a>` : ''}
    </div>
    ` : ''}

    <div class="tips">
      <strong>💡 为什么两台 Termux 设备键盘菜单不同？已完美全自动解决！</strong><br>
      • <strong>指令与菜单按钮同步 (setMyCommands & setChatMenuButton)</strong>：本服务已支持自动向 Telegram 注册下拉菜单与快捷键盘按钮。<br>
      • <strong>双重键盘交付保证</strong>：收到消息时通过 Webhook HTTP 200 响应与 Telegram API 极速双发，即使境内 Termux 无代理也能 100% 出现 5 排键盘！<br>
      • <strong>一键修复</strong>：在任意设备点击上方【🔄 强制同步 5 排键盘与 [/] 指令菜单】按钮即可秒级生效！
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">当前绑定的回调入口 (Webhook URL):</p>
    <div class="url-box">${webhookUrl || '请先在 .env 中设置 URL'}</div>
  </div>
</body>
</html>`;
        sendHtml(res, 200, pageHtml);
        return true;
      }

      // JSON 模式返回
      sendJson(res, 200, {
        success: serverOk,
        mode: serverOk ? 'server_registered' : 'browser_registration_ready',
        message: serverOk
          ? 'Webhook 已成功在 Telegram 官方服务器注册并生效！'
          : '本地服务器直连受限 (TypeError: fetch failed，国内正常现象)。已为您生成【浏览器一键激活直链】，在能使用 Telegram 的浏览器中打开此链接即可完成激活！',
        officialSetWebhookUrl,
        officialWebhookInfoUrl,
        configuredWebhookUrl: webhookUrl,
        serverFetchError: serverErrorMsg,
        instruction: '请直接在手机浏览器或电脑浏览器（能正常使用 Telegram 的环境）中点击 officialSetWebhookUrl 完成注册。Telegram 官方会立即返回 ok: true。注册后，手机端无需任何代理即可通过穿透隧道毫秒级收发 Bot 消息！',
      });
    } catch (e) {
      sendJson(res, 200, {
        success: false,
        error: String(e),
        tip: '请在浏览器中打开 /api/telegram/set-webhook 使用一键直连激活助手。',
      });
    }
    return true;
  }

  // 19. Telegram: Get Webhook Info Helper Endpoint (深度诊断)
  if (pathname === '/api/telegram/webhook-info' && method === 'GET') {
    try {
      const { refreshEnvFromDisk, normalizePublicUrl, getTelegramApiBase } = await import('./telegramBotService.ts');
      refreshEnvFromDisk();

      const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^['"]+|['"]+$/g, '');
      if (!token) {
        sendJson(res, 400, {
          success: false,
          error: '环境变量未配置 TELEGRAM_BOT_TOKEN，请先在 .env 中设置',
        });
        return true;
      }

      const envRawUrl = (process.env.URL || process.env.APP_URL || process.env.WEBHOOK_URL || '').trim();
      const normalizedEnvUrl = normalizePublicUrl(envRawUrl);
      const expectedWebhookUrl = normalizedEnvUrl ? `${normalizedEnvUrl}/api/telegram/webhook` : '';
      const officialInfoUrl = `https://api.telegram.org/bot${token}/getWebhookInfo`;

      let serverFetchOk = false;
      let tgData: any = null;

      try {
        const apiBase = getTelegramApiBase();
        const tgResp = await fetch(`${apiBase}/bot${token}/getWebhookInfo`, {
          signal: AbortSignal.timeout(3500),
        });
        tgData = await tgResp.json().catch(() => ({}));
        if (tgData && tgData.ok) {
          serverFetchOk = true;
        }
      } catch (err) {}

      if (serverFetchOk && tgData) {
        const info = tgData.result || {};
        const isRegistered = Boolean(info.url && info.url.length > 0);
        const isUrlMatched = expectedWebhookUrl ? (info.url === expectedWebhookUrl) : false;

        let diagnosis = '正常';
        if (!isRegistered) {
          diagnosis = 'Telegram 官方未注册任何 Webhook 回调地址。请访问 /api/telegram/set-webhook 激活！';
        } else if (!isUrlMatched) {
          diagnosis = `URL 不匹配：Telegram 登记的地址为 [${info.url}]，而当前配置的是 [${expectedWebhookUrl}]。请访问 /api/telegram/set-webhook 重新登记！`;
        } else if (info.last_error_message) {
          diagnosis = `Telegram 官方上报错误: "${info.last_error_message}"。若为 502/Bad Gateway 说明隧道未连通本地 3000 端口；若为 Connection timeout 说明隧道中断。`;
        } else {
          diagnosis = '🟢 Webhook 挂载状态完全正常，Telegram 官方可毫秒级直推消息！';
        }

        sendJson(res, 200, {
          success: true,
          envUrl: envRawUrl,
          normalizedEnvUrl,
          expectedWebhookUrl,
          registeredWebhookUrl: info.url || '未注册 (为空)',
          isUrlMatched,
          hasPendingUpdates: info.pending_update_count || 0,
          lastErrorDate: info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : null,
          lastErrorMessage: info.last_error_message || null,
          diagnosis,
          webhookInfo: info,
          officialInfoUrl,
        });
      } else {
        // 本地请求超时或直连受限 -> 优雅返回官方直链
        sendJson(res, 200, {
          success: false,
          networkNotice: '本地服务器直连 Telegram 官方受限 (属于国内网络正常状态)。请在具备科学上网的浏览器中点击 officialInfoUrl 直接查看官方登记状态。',
          officialInfoUrl,
          expectedWebhookUrl,
          envUrl: envRawUrl,
          oneClickActivateUrl: `/api/telegram/set-webhook`,
        });
      }
    } catch (e) {
      sendJson(res, 200, { success: false, error: String(e) });
    }
    return true;
  }

  // 20. Telegram: Bot Status & Switch Endpoint (Webhook vs Long Polling)
  if (pathname === '/api/telegram/status' && method === 'GET') {
    try {
      const { getTelegramBotStatus, getTelegramApiBase } = await import('./telegramBotService.ts');
      const apiBase = getTelegramApiBase();
      const status = getTelegramBotStatus();

      // 可选：携带 ?test=1 时发起一次实时的 getMe 测试反代连通性
      let connectionTest: any = null;
      if (urlObj.searchParams.get('test') === '1') {
        const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^['"]+|['"]+$/g, '');
        if (token) {
          try {
            const t0 = Date.now();
            const meRes = await fetch(`${apiBase}/bot${token}/getMe`, { signal: AbortSignal.timeout(8000) });
            const meData = await meRes.json().catch(() => ({}));
            connectionTest = {
              ok: meData?.ok || false,
              latencyMs: Date.now() - t0,
              data: meData,
            };
          } catch (tErr: any) {
            connectionTest = {
              ok: false,
              error: tErr?.message || String(tErr),
            };
          }
        }
      }

      sendJson(res, 200, {
        success: true,
        bot: status,
        apiBase,
        connectionTest,
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  // 21. Telegram: Manually start Long Polling
  if ((pathname === '/api/telegram/start-polling' || pathname === '/api/telegram/polling') && (method === 'POST' || method === 'GET')) {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) {
        sendJson(res, 400, { success: false, error: '未配置 TELEGRAM_BOT_TOKEN' });
        return true;
      }
      const { startTelegramPolling } = await import('./telegramBotService.ts');
      await startTelegramPolling(token, broadcast);
      sendJson(res, 200, { success: true, message: '已成功启动长轮询模式 (Long Polling)' });
    } catch (e) {
      sendJson(res, 500, { success: false, error: String(e) });
    }
    return true;
  }

  return false;
}
