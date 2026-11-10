/**
 * Network configuration and connectivity engine for Web & Capacitor Native Mobile APK.
 * Ensures that when running inside Android Capacitor WebView (localhost / file: / capacitor:),
 * all API requests and WebSocket cleanly route to the server URL configured in the .env file.
 */

export const DEFAULT_CLOUD_SERVER_URL = 'https://m.my66.cc.cd';
export const STORAGE_KEY_SERVER_URL = 'app_remote_server_url';

// List of stale/expired domain fragments from previous development sessions to automatically sanitize
const DEAD_DOMAIN_FRAGMENTS = ['5cyshpbu4owbrjlcae2vvb-324777233027'];

export interface ServerPreset {
  id: string;
  name: string;
  description: string;
  url: string;
}

/**
 * Extracts target server URL passed from .env via:
 * 1. Synchronously preloaded window.__APP_SERVER_CONFIG__.serverUrl (from APK's assets/public/app-config.json)
 * 2. Injected window.__APP_ENV_URL__ (from index.html transform)
 * 3. Vite compiler define __APP_ENV_URL__
 * 4. Fallback to DEFAULT_CLOUD_SERVER_URL
 */
export function getEnvServerUrl(): string {
  // 1. Check local APK preloaded config
  if (typeof window !== 'undefined' && (window as any).__APP_SERVER_CONFIG__?.serverUrl) {
    const u = String((window as any).__APP_SERVER_CONFIG__.serverUrl).trim().replace(/\/+$/, '');
    if (u.startsWith('http://') || u.startsWith('https://')) {
      return u;
    }
  }

  // 2. Check index.html injected variable
  if (typeof window !== 'undefined' && (window as any).__APP_ENV_URL__) {
    const u = String((window as any).__APP_ENV_URL__).trim().replace(/\/+$/, '');
    if (u.startsWith('http://') || u.startsWith('https://')) {
      return u;
    }
  }

  // 3. Check compile-time Vite define
  try {
    if (typeof __APP_ENV_URL__ !== 'undefined' && __APP_ENV_URL__) {
      const u = String(__APP_ENV_URL__).trim().replace(/\/+$/, '');
      if (u.startsWith('http://') || u.startsWith('https://')) {
        return u;
      }
    }
  } catch {}

  return DEFAULT_CLOUD_SERVER_URL;
}

export function getServerPresets(): ServerPreset[] {
  const envUrl = getEnvServerUrl();
  return [
    {
      id: 'env-target',
      name: '🎯 隧道/主服务器 (推荐·当前内置)',
      description: '内置默认隧道服务器 (从 server_url.txt 读取)',
      url: envUrl,
    },
    {
      id: 'custom-domain',
      name: '🌐 独立域名分发节点',
      description: '独立公网域名服务器 (https://m.my66.cc.cd)',
      url: 'https://m.my66.cc.cd',
    },
    {
      id: 'termux-local',
      name: '📱 手机 Termux 本机服务',
      description: '在手机 Termux 中运行本地服务 (127.0.0.1:3000)',
      url: 'http://127.0.0.1:3000',
    },
    {
      id: 'lan',
      name: '🏠 局域网 WiFi 对战',
      description: '连接同一 WiFi 下的电脑或服务器 (请修改为实际 IP:3000)',
      url: 'http://192.168.1.100:3000',
    },
  ];
}

export const SERVER_PRESETS: ServerPreset[] = getServerPresets();

export function isNativeApkEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const isCapacitor = Boolean((window as any).Capacitor?.isNativePlatform?.());
  const isFileOrCapProtocol = window.location.protocol === 'file:' || window.location.protocol === 'capacitor:';
  return isCapacitor || isFileOrCapProtocol;
}

export function getRemoteServerUrl(): string {
  if (typeof window === 'undefined') return '';
  const builtinUrl = getEnvServerUrl();
  try {
    // If a new APK is installed with an updated built-in server_url.txt,
    // automatically migrate and discard any obsolete old built-in URL
    const lastBuiltin = localStorage.getItem('last_seen_builtin_url');
    if (lastBuiltin && lastBuiltin !== builtinUrl) {
      const custom = localStorage.getItem(STORAGE_KEY_SERVER_URL);
      if (custom === lastBuiltin) {
        localStorage.removeItem(STORAGE_KEY_SERVER_URL);
      }
    }
    localStorage.setItem('last_seen_builtin_url', builtinUrl);

    const custom = localStorage.getItem(STORAGE_KEY_SERVER_URL);
    if (custom) {
      // Auto-sanitize legacy dead domains from old APK installations
      const isDead = DEAD_DOMAIN_FRAGMENTS.some((fragment) => custom.includes(fragment));
      if (isDead) {
        localStorage.removeItem(STORAGE_KEY_SERVER_URL);
      } else if (custom.startsWith('http://') || custom.startsWith('https://')) {
        return custom.replace(/\/+$/, '');
      }
    }
  } catch {}

  // In native Android APK environment, route to target server URL configured in server_url.txt
  if (isNativeApkEnvironment()) {
    return builtinUrl;
  }
  return window.location.origin;
}


export function setRemoteServerUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = String(url || '').trim().replace(/\/+$/, '');
  const envUrl = getEnvServerUrl();
  try {
    if (!trimmed || trimmed === envUrl) {
      localStorage.removeItem(STORAGE_KEY_SERVER_URL);
    } else {
      localStorage.setItem(STORAGE_KEY_SERVER_URL, trimmed);
    }
  } catch {}
}

export function getWebSocketUrl(): string {
  const remote = getRemoteServerUrl();
  try {
    const urlObj = new URL(remote || window.location.origin);
    const proto = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${urlObj.host}/ws`;
  } catch {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws`;
  }
}

export function resolveApiUrl(url: string): string {
  if (typeof url === 'string' && url.startsWith('/api/') && isNativeApkEnvironment()) {
    const remote = getRemoteServerUrl();
    return `${remote}${url}`;
  }
  return url;
}

export async function testServerConnection(targetUrl?: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const base = (targetUrl || getRemoteServerUrl()).replace(/\/+$/, '');
  const testUrl = `${base}/api/health?t=${Date.now()}`;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const rawFetch = (window as any)._originalFetch || window.fetch;
    const res = await rawFetch(testUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data && data.status === 'ok') {
        return { ok: true, latencyMs };
      }
    }
    return { ok: false, latencyMs, error: `HTTP 响应状态码: ${res.status}` };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      ok: false,
      latencyMs,
      error: err?.name === 'AbortError' ? '连接超时 (6s)' : (err?.message || '无法连接该服务器'),
    };
  }
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const resolved = typeof input === 'string' ? resolveApiUrl(input) : input;
  const rawFetch = (window as any)._originalFetch || window.fetch;
  return rawFetch(resolved, init);
}

// Global transparent fetch patch for native APK environment
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  try {
    if (!(window as any)._originalFetch) {
      (window as any)._originalFetch = window.fetch.bind(window);
    }
    const originalFetch = (window as any)._originalFetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === 'string' && input.startsWith('/api/') && isNativeApkEnvironment()) {
        const remote = getRemoteServerUrl();
        return originalFetch(`${remote}${input}`, init);
      }
      return originalFetch(input, init);
    };
  } catch {}
}
