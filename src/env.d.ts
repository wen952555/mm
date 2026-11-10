declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare const __APP_ENV_URL__: string;

interface Window {
  __APP_ENV_URL__?: string;
  __APP_SERVER_CONFIG__?: {
    serverUrl?: string;
    buildTime?: string;
    description?: string;
  };
  _originalFetch?: typeof window.fetch;
}
