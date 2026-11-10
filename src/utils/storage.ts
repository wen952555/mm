import { resolveApiUrl } from './networkConfig';

export interface GameStat {
  played: number;
  won: number;
  highestScore: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  phone?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  bannedReason?: string;
  coins: number;
  rating: number;
  level: number;
  lastCheckinDate: string;
  isLoggedIn: boolean;
  stats: {
    yansan: GameStat;
    shisanshui: GameStat;
    mahjong: GameStat;
    [key: string]: GameStat | undefined;
  };
  updatedAt?: number;
  sessionToken?: string;
}

export interface MatchRecord {
  id: string;
  gameType: string;
  gameName: string;
  result: 'win' | 'lose' | 'draw';
  coinsDelta: number;
  ratingDelta: number;
  details: string;
  timestamp: string;
  updatedAt?: number;
  replayData?: {
    rounds?: Array<{
      step: number;
      seatName: string;
      action: string;
      cards?: string[];
      tag?: string;
    }>;
    alliances?: string;
    summary?: string;
    handsSnapshot?: Array<{ seatName: string; handCount: number; cards?: string[] }>;
  };
}

export interface PointsTransaction {
  id: string;
  type: 'checkin' | 'game_win' | 'game_loss' | 'relief' | 'exchange' | 'achievement' | 'reward' | 'admin_grant' | 'admin_deduct' | 'transfer_out' | 'transfer_in' | string;
  title: string;
  amount: number;
  balanceAfter: number;
  timestamp: string;
  createdAt?: number;
}

export interface AccountData {
  username: string;
  phone?: string;
  password: string;
  profile: UserProfile;
  updatedAt?: number;
}

export async function hashPassword(plain: string): Promise<string> {
  if (!plain) return '';
  if (plain.startsWith('sha256:')) return plain;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`rustchess_salt_2026_${plain}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `sha256:${hex}`;
  } catch {
    return plain;
  }
}

export async function verifyPassword(input: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (!stored.startsWith('sha256:')) {
    return input === stored;
  }
  const hashedInput = await hashPassword(input);
  return hashedInput === stored;
}

function generateUniqueGuestId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_PROFILE: UserProfile = {
  id: generateUniqueGuestId(),
  name: '牌友茶客',
  username: '',
  avatar: '👑',
  phone: '',
  isAdmin: false,
  coins: 0,
  rating: 1000,
  level: 1,
  lastCheckinDate: '',
  isLoggedIn: false,
  stats: {
    yansan: { played: 0, won: 0, highestScore: 0 },
    shisanshui: { played: 0, won: 0, highestScore: 0 },
    mahjong: { played: 0, won: 0, highestScore: 0 },
  },
};

const STORAGE_KEY_PROFILE = 'rustchess_user_profile_v3';
const STORAGE_KEY_RECORDS = 'rustchess_match_records_v3';
const STORAGE_KEY_OFFLINE_PRACTICE_RECORDS = 'rustchess_offline_practice_records_v1';
const STORAGE_KEY_POINTS_TX = 'rustchess_points_tx_v3';
const STORAGE_KEY_ACCOUNTS = 'rustchess_accounts_v3';

function getUserStorageKey(baseKey: string, customPhoneOrId?: string): string {
  try {
    let key = customPhoneOrId;
    if (!key) {
      const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (raw) {
        const parsed = JSON.parse(raw);
        key = parsed.phone || parsed.id;
      }
    }
    if (key && key !== 'guest' && key !== 'default') {
      const cleanKey = String(key).trim().replace(/\D/g, '') || String(key).trim();
      return `${baseKey}_${cleanKey}`;
    }
  } catch {}
  return baseKey;
}

export function loadLocalProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      const profile = { ...DEFAULT_PROFILE, ...parsed };
      if (!profile.id || profile.id === 'P-me' || profile.id === 'P-123') {
        profile.id = generateUniqueGuestId();
      }
      profile.coins = Math.max(0, Math.floor(Number(profile.coins) || 0));
      if (!profile.avatar || profile.avatar === '🀄') {
        profile.avatar = '👑';
      }
      if (!profile.stats.yansan) {
        profile.stats.yansan = { played: 0, won: 0, highestScore: 0 };
      }
      return profile;
    }
  } catch {}
  return { ...DEFAULT_PROFILE, id: generateUniqueGuestId() };
}

export function saveLocalProfile(profile: UserProfile): void {
  try {
    if (!profile.avatar || profile.avatar === '🀄') {
      profile.avatar = '👑';
    }
    profile.coins = Math.max(0, Math.floor(Number(profile.coins) || 0));
    profile.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch {}
}

export function loadLocalRecords(userKey?: string): MatchRecord[] {
  try {
    const key = getUserStorageKey(STORAGE_KEY_RECORDS, userKey);
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export function saveLocalRecords(records: MatchRecord[], userKey?: string): void {
  try {
    const key = getUserStorageKey(STORAGE_KEY_RECORDS, userKey);
    localStorage.setItem(key, JSON.stringify(records));
  } catch {}
}

export function loadOfflinePracticeRecords(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_PRACTICE_RECORDS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export function saveOfflinePracticeRecord(record: MatchRecord): void {
  try {
    const list = loadOfflinePracticeRecords();
    list.unshift(record);
    if (list.length > 50) list.pop();
    localStorage.setItem(STORAGE_KEY_OFFLINE_PRACTICE_RECORDS, JSON.stringify(list));
  } catch {}
}

export function clearOfflinePracticeRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_OFFLINE_PRACTICE_RECORDS);
  } catch {}
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function loadPointsTransactions(userKey?: string): PointsTransaction[] {
  try {
    const key = getUserStorageKey(STORAGE_KEY_POINTS_TX, userKey);
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: PointsTransaction[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        const now = Date.now();
        const validList = list.filter((tx) => {
          let time = tx.createdAt;
          if (!time && tx.id) {
            const match = tx.id.match(/^tx_(\d+)_/);
            if (match && match[1]) {
              time = Number(match[1]);
            }
          }
          if (time && typeof time === 'number' && !isNaN(time)) {
            return now - time <= SEVEN_DAYS_MS;
          }
          return true;
        });

        if (validList.length !== list.length) {
          localStorage.setItem(key, JSON.stringify(validList));
        }
        return validList;
      }
    }
  } catch {}
  return [];
}

export function recordPointsTx(
  type: PointsTransaction['type'],
  title: string,
  amount: number,
  balanceAfter: number,
  userKey?: string
): void {
  try {
    const now = Date.now();
    const list = loadPointsTransactions(userKey);
    const dateObj = new Date(now);
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const timeStr = dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const formattedTimestamp = `${month}-${day} ${timeStr}`;

    const newTx: PointsTransaction = {
      id: `tx_${now}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      amount,
      balanceAfter,
      timestamp: formattedTimestamp,
      createdAt: now,
    };

    list.unshift(newTx);
    const validList = list.filter((tx) => {
      let time = tx.createdAt;
      if (!time && tx.id) {
        const match = tx.id.match(/^tx_(\d+)_/);
        if (match && match[1]) {
          time = Number(match[1]);
        }
      }
      if (time && typeof time === 'number' && !isNaN(time)) {
        return now - time <= SEVEN_DAYS_MS;
      }
      return true;
    });

    if (validList.length > 100) validList.length = 100;

    const key = getUserStorageKey(STORAGE_KEY_POINTS_TX, userKey);
    localStorage.setItem(key, JSON.stringify(validList));
  } catch {}
}

// User accounts management (Local Accounts & Persistent Auth)
export function getRegisteredAccounts(): AccountData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveRegisteredAccounts(accounts: AccountData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch {}
}

export function clearLocalAuthData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
  } catch {}
}

export function resetToDefaultGuestProfile(): UserProfile {
  clearLocalAuthData();
  const guest: UserProfile = { ...DEFAULT_PROFILE, id: 'guest', isLoggedIn: false };
  saveLocalProfile(guest);
  return guest;
}

// Sync with server API
export async function syncWithServer(profile: UserProfile, records: MatchRecord[]): Promise<any> {
  if (!profile || !profile.isLoggedIn || !profile.id || profile.id === 'guest' || profile.id === 'default') {
    return { success: true, skipped: true };
  }
  try {
    const res = await fetch(resolveApiUrl('/api/user/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, records }),
    });
    const data = await res.json();
    if (data && data.notFound) {
      clearLocalAuthData();
      return { success: false, notFound: true, error: data.error };
    }
    if (data && typeof data.coins === 'number' && data.coins !== profile.coins) {
      profile.coins = data.coins;
      if (data.rating) profile.rating = data.rating;
      if (data.level) profile.level = data.level;
      saveLocalProfile(profile);
    }
    return data;
  } catch {
    return null;
  }
}

// Backup & restore utilities (安全数据备份与恢复)
export function exportGameBackup(): string {
  try {
    const profile = loadLocalProfile();
    const records = loadLocalRecords();
    const pointsTx = loadPointsTransactions();
    const backupObj = {
      version: 'v3',
      exportDate: new Date().toISOString(),
      profile,
      records,
      pointsTx,
    };
    return JSON.stringify(backupObj, null, 2);
  } catch {
    return '';
  }
}

export function importGameBackup(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !parsed.profile) return false;
    if (parsed.profile) saveLocalProfile(parsed.profile);
    if (Array.isArray(parsed.records)) saveLocalRecords(parsed.records);
    if (Array.isArray(parsed.pointsTx)) {
      localStorage.setItem(STORAGE_KEY_POINTS_TX, JSON.stringify(parsed.pointsTx));
    }
    return true;
  } catch {
    return false;
  }
}
