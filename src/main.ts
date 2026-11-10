import { createApp } from 'vue';
import App from './App.vue';
import './index.css';
import './utils/networkConfig';
import { preloadCardAssets } from './utils/cardAssets';
import { preloadMahjongAssets } from './utils/mahjongAssets';

// Immediately preload all card and mahjong SVG assets into memory
preloadCardAssets();
preloadMahjongAssets();

createApp(App).mount('#app');

