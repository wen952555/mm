/**
 * Utility for loading and rendering SVG playing card assets
 */

const cardImageCache = new Map<string, HTMLImageElement>();
const loadingCallbacks = new Set<() => void>();

export function onCardAssetsLoaded(cb: () => void) {
  loadingCallbacks.add(cb);
  // If images are already loaded or in cache, notify immediately
  if (cardImageCache.size > 0) {
    setTimeout(() => {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    }, 0);
  }
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

export function getCardImagePath(card: {
  rank?: number;
  label?: string;
  suit?: '♠' | '♥' | '♣' | '♦' | 'JOKER' | string;
  isRed?: boolean;
}): string {
  const suit = card.suit;
  const label = card.label;
  const rank = card.rank;

  // Jokers
  if (suit === 'JOKER' || rank === 16 || rank === 17 || label === '小王' || label === '大王') {
    if (rank === 17 || label === '大王' || card.isRed) {
      return '/cards/red_joker.svg';
    }
    return '/cards/black_joker.svg';
  }

  // Suits
  let suitName = 'spades';
  if (suit === '♥' || suit === 'hearts') suitName = 'hearts';
  else if (suit === '♦' || suit === 'diamonds') suitName = 'diamonds';
  else if (suit === '♣' || suit === 'clubs') suitName = 'clubs';
  else if (suit === '♠' || suit === 'spades') suitName = 'spades';

  // Rank / Value
  let rankName = 'ace';
  if (label === 'A' || rank === 14 || rank === 1) rankName = 'ace';
  else if (label === '2' || rank === 15 || rank === 2) rankName = '2';
  else if (label === 'J' || rank === 11) rankName = 'jack';
  else if (label === 'Q' || rank === 12) rankName = 'queen';
  else if (label === 'K' || rank === 13) rankName = 'king';
  else if (label && !isNaN(Number(label))) rankName = label;
  else if (rank && rank >= 3 && rank <= 10) rankName = String(rank);

  return `/cards/${rankName}_of_${suitName}.svg`;
}

export function getCardImage(src: string): HTMLImageElement | null {
  if (cardImageCache.has(src)) {
    const img = cardImageCache.get(src)!;
    if (img.complete && img.naturalWidth > 0) {
      return img;
    }
    if (!(img as any)._listenerAttached) {
      (img as any)._listenerAttached = true;
      img.addEventListener('load', notifyAssetsLoaded);
      img.addEventListener('error', notifyAssetsLoaded);
    }
    return null;
  }

  const img = new Image();
  (img as any)._listenerAttached = true;
  img.addEventListener('load', notifyAssetsLoaded);
  img.addEventListener('error', notifyAssetsLoaded);
  img.src = src;
  cardImageCache.set(src, img);
  return null;
}

/**
 * Preload all standard 54 cards + back into memory for instant rendering
 */
export function preloadCardAssets() {
  const suits = ['spades', 'hearts', 'clubs', 'diamonds'];
  const ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];

  suits.forEach((s) => {
    ranks.forEach((r) => {
      getCardImage(`/cards/${r}_of_${s}.svg`);
    });
  });
  getCardImage('/cards/back.svg');
  getCardImage('/cards/black_joker.svg');
  getCardImage('/cards/red_joker.svg');
}

/**
 * Draw playing card strictly WITHOUT BORDERS (不要有边框)
 */
export function renderPlayingCard(
  ctx: CanvasRenderingContext2D,
  card: {
    rank?: number;
    label?: string;
    suit?: any;
    isRed?: boolean;
  },
  x: number,
  y: number,
  w: number,
  h: number,
  options?: {
    isFaceDown?: boolean;
    isSelected?: boolean;
    shadow?: boolean;
    borderRadius?: number;
    borderColor?: string;
    borderWidth?: number;
    cropTopLeft?: boolean;
  }
) {
  const r = options?.borderRadius ?? 5;
  const isSel = options?.isSelected ?? false;
  const isFaceDown = options?.isFaceDown ?? false;

  ctx.save();

  // Subtle natural elevation shadow, never a border
  if (options?.shadow !== false) {
    if (isSel) {
      ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
    }
  }

  // Base white rounded card body (pure fill, NO STROKE / NO BORDER)
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = isSel ? '#FEF3C7' : '#FFFFFF';
  ctx.fill();

  if (options?.borderColor) {
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options?.borderWidth ?? 3;
    ctx.stroke();
  }

  // Reset shadow for crisp image/content rendering
  ctx.shadowColor = 'transparent';

  // Clip to rounded rectangle to ensure pristine seamless edges without borders
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();

  const src = isFaceDown ? '/cards/back.svg' : getCardImagePath(card);
  const img = getCardImage(src);

  if (img) {
    if (options?.cropTopLeft) {
      const sw = img.naturalWidth * 0.45;
      const sh = img.naturalHeight * 0.45;
      ctx.drawImage(img, 0, 0, sw, sh, x, y, w, h);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }
  } else {
    // Clean fallback if image is still loading (STRICTLY NO BORDER)
    if (isFaceDown) {
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#60A5FA';
      ctx.font = `bold ${Math.floor(h * 0.22)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎴', x + w / 2, y + h / 2);
    } else {
      const isRed = card.isRed || card.suit === '♥' || card.suit === '♦';
      ctx.fillStyle = isRed ? '#DC2626' : '#0F172A';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const label = card.label || (card.rank ? String(card.rank) : '');
      const suit = card.suit === 'JOKER' ? '' : (card.suit || '');

      ctx.font = `bold ${Math.max(10, Math.floor(h * 0.22))}px monospace`;
      ctx.fillText(label, x + Math.floor(w * 0.1), y + Math.floor(h * 0.08));

      if (suit) {
        ctx.font = `${Math.max(12, Math.floor(h * 0.28))}px sans-serif`;
        ctx.fillText(suit, x + Math.floor(w * 0.1), y + Math.floor(h * 0.36));
      } else if (card.suit === 'JOKER' || label.includes('王')) {
        ctx.font = `bold ${Math.max(9, Math.floor(h * 0.14))}px sans-serif`;
        ctx.fillText('JOKER', x + Math.floor(w * 0.08), y + Math.floor(h * 0.42));
      }
    }
  }

  ctx.restore(); // Restore clip
  if (options?.borderColor) {
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options?.borderWidth ?? 3.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
  }
  ctx.restore(); // Restore outer save
}
