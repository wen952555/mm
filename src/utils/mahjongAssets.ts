/**
 * Utility for loading and rendering SVG Mahjong tile assets
 */

const mahjongImageCache = new Map<string, HTMLImageElement>();
const loadingCallbacks = new Set<() => void>();

export function onMahjongAssetsLoaded(cb: () => void) {
  loadingCallbacks.add(cb);
  return () => {
    loadingCallbacks.delete(cb);
  };
}

function notifyAssetsLoaded() {
  loadingCallbacks.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}

export function getMahjongImagePath(tile: {
  type: 'wan' | 'tiao' | 'tong' | 'zi' | string;
  value: number;
  text?: string;
}): string {
  const { type, value, text } = tile;

  if (type === 'wan') {
    const num = 7 + value;
    const prefix = num < 10 ? `0${num}` : `${num}`;
    return `/mahjong/${prefix}-characters-${value}.svg`;
  }

  if (type === 'tong') {
    const num = 16 + value;
    return `/mahjong/${num}-circles-${value}.svg`;
  }

  if (type === 'tiao') {
    const num = 25 + value;
    return `/mahjong/${num}-bamboos-${value}.svg`;
  }

  if (type === 'zi') {
    switch (value) {
      case 1: return '/mahjong/04-east-wind.svg';
      case 2: return '/mahjong/05-south-wind.svg';
      case 3: return '/mahjong/06-west-wind.svg';
      case 4: return '/mahjong/07-north-wind.svg';
      case 5: return '/mahjong/03-red-dragon.svg';
      case 6: return '/mahjong/02-green-dragon.svg';
      case 7: return '/mahjong/01-white-dragon.svg';
    }
    // By text name fallback
    if (text === '东风') return '/mahjong/04-east-wind.svg';
    if (text === '南风') return '/mahjong/05-south-wind.svg';
    if (text === '西风') return '/mahjong/06-west-wind.svg';
    if (text === '北风') return '/mahjong/07-north-wind.svg';
    if (text === '红中') return '/mahjong/03-red-dragon.svg';
    if (text === '发财') return '/mahjong/02-green-dragon.svg';
    if (text === '白板') return '/mahjong/01-white-dragon.svg';
  }

  return '/mahjong/01-white-dragon.svg';
}

export function getMahjongImage(src: string): HTMLImageElement | null {
  if (mahjongImageCache.has(src)) {
    const img = mahjongImageCache.get(src)!;
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  const img = new Image();
  img.src = src;
  img.onload = () => {
    notifyAssetsLoaded();
  };
  mahjongImageCache.set(src, img);
  return null;
}

/**
 * Preload all mahjong tiles into memory
 */
export function preloadMahjongAssets() {
  // Wan 1..9
  for (let v = 1; v <= 9; v++) {
    getMahjongImage(getMahjongImagePath({ type: 'wan', value: v }));
    getMahjongImage(getMahjongImagePath({ type: 'tong', value: v }));
    getMahjongImage(getMahjongImagePath({ type: 'tiao', value: v }));
  }
  // Zi 1..7
  for (let v = 1; v <= 7; v++) {
    getMahjongImage(getMahjongImagePath({ type: 'zi', value: v }));
  }
}

export function renderMahjongTileBack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: {
    scaleY?: number;
    showShadow?: boolean;
    borderColor?: string;
    borderWidth?: number;
  }
) {
  const r = Math.max(3, Math.floor(w * 0.12));
  const scaleY = options?.scaleY ?? 1;

  ctx.save();
  if (scaleY !== 1) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(1, scaleY);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  // 3D Depth Shadow
  if (options?.showShadow !== false) {
    ctx.fillStyle = '#022C22';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w, h, r);
    ctx.fill();
  }

  // Bottom Ivory / Bone Bevel layer
  ctx.fillStyle = '#FFFDF7';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();

  // Top Jade / Emerald Tile Back Face (traditional green mahjong back)
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#059669');
  grad.addColorStop(0.35, '#047857');
  grad.addColorStop(0.8, '#065F46');
  grad.addColorStop(1, '#064E3B');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, Math.max(2, r - 1));
  ctx.fill();

  // Golden inner border rim
  ctx.strokeStyle = options?.borderColor || 'rgba(250, 204, 21, 0.45)';
  ctx.lineWidth = options?.borderWidth || 1;
  ctx.beginPath();
  ctx.roundRect(x + 3.5, y + 3.5, w - 7, h - 7, Math.max(1, r - 2));
  ctx.stroke();

  // Center subtle engraved golden diamond emblem
  const cx = x + w / 2;
  const cy = y + h / 2;
  const sz = Math.min(w, h) * 0.18;
  ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - sz);
  ctx.lineTo(cx + sz * 0.8, cy);
  ctx.lineTo(cx, cy + sz);
  ctx.lineTo(cx - sz * 0.8, cy);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Render Mahjong tile on canvas
 */
export function renderMahjongTile(
  ctx: CanvasRenderingContext2D,
  tile: {
    type: 'wan' | 'tiao' | 'tong' | 'zi' | string;
    value: number;
    text: string;
    color?: string;
  },
  x: number,
  y: number,
  w: number,
  h: number,
  options?: {
    isSelected?: boolean;
    isSmall?: boolean;
    showShadow?: boolean;
    borderColor?: string;
    borderWidth?: number;
    scaleY?: number;
  }
) {
  const isSel = options?.isSelected ?? false;
  const scaleY = options?.scaleY ?? 1;
  const r = Math.max(3, Math.floor(w * 0.12));

  ctx.save();

  if (scaleY !== 1) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(1, scaleY);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  // 3D Jade Green Backing Shadow
  if (options?.showShadow !== false) {
    ctx.fillStyle = '#065F46';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w, h, r);
    ctx.fill();
  }

  // Porcelain White Face
  ctx.fillStyle = isSel ? '#FEF9C3' : '#FFFDF7';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();

  // Subtle border only for mahjong tile face distinction
  ctx.strokeStyle = options?.borderColor || (isSel ? '#F59E0B' : '#E2E8F0');
  ctx.lineWidth = options?.borderWidth || (isSel ? 2 : 1);
  ctx.stroke();

  // Draw tile graphic
  const src = getMahjongImagePath(tile);
  const img = getMahjongImage(src);

  if (img) {
    // Keep aspect ratio centered
    const padX = Math.max(2, Math.floor(w * 0.1));
    const padY = Math.max(2, Math.floor(h * 0.08));
    const drawW = w - padX * 2;
    const drawH = h - padY * 2;
    ctx.drawImage(img, x + padX, y + padY, drawW, drawH);
  } else {
    // High-fidelity fallback text while loading
    ctx.fillStyle = tile.color || '#1E293B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (w < 30) {
      ctx.font = `bold ${Math.floor(h * 0.42)}px sans-serif`;
      ctx.fillText(tile.text.slice(0, 1), x + w / 2, y + h / 2);
    } else {
      ctx.font = `bold ${Math.floor(h * 0.28)}px "Noto Serif SC", serif`;
      ctx.fillText(tile.text.slice(0, 1), x + w / 2, y + h * 0.35);
      ctx.fillText(tile.text.slice(1, 2), x + w / 2, y + h * 0.72);
    }
  }

  // Draw custom colored player border on top if provided
  if (options?.borderColor) {
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth ?? 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
  }

  ctx.restore();
}

