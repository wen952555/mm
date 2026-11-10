/**
 * Mahjong Rules Engine (Hongzhong & Standard Guobiao Rules)
 * Handles tile matching, meld decomposition, winning hand verification, and bird prize (抓码)
 */

export interface MahjongTile {
  id: string;
  type: 'wan' | 'tiao' | 'tong' | 'zi';
  value: number; // 1..9 for suit, 1..7 for zi (1=东,2=南,3=西,4=北,5=中,6=发,7=白)
  text: string;
  color?: string;
  isRedDragon?: boolean;
}

export type MahjongSceneMode = 'hongzhong-6' | 'hongzhong-10' | 'standard-10' | 'standard-6';

export function isHongzhong(tile: MahjongTile): boolean {
  return tile.type === 'zi' && (tile.value === 5 || tile.text === '红中' || !!tile.isRedDragon);
}

/**
 * Standard 14-tile win check: 4 melds (triplet/sequence) + 1 pair, or 7 pairs
 * Supports Hongzhong as universal wild card (万能牌)
 */
export function checkMahjongWin(tiles: MahjongTile[], isHongzhongMode = true): { win: boolean; desc: string; fan: number } {
  if (tiles.length % 3 !== 2) {
    return { win: false, desc: '', fan: 0 };
  }

  // Count Hongzhong count
  const hongzhongs = isHongzhongMode ? tiles.filter(isHongzhong).length : 0;
  // 4 Hongzhong instant win
  if (isHongzhongMode && hongzhongs >= 4) {
    return { win: true, desc: '【四红中直接天胡满贯】', fan: 8 };
  }

  const normalTiles = isHongzhongMode ? tiles.filter((t) => !isHongzhong(t)) : tiles;

  // Seven pairs check
  if (tiles.length === 14) {
    const counts = new Map<string, number>();
    for (const t of normalTiles) {
      const k = `${t.type}_${t.value}`;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    let pairs = 0;
    let singles = 0;
    for (const cnt of counts.values()) {
      pairs += Math.floor(cnt / 2);
      if (cnt % 2 === 1) singles += 1;
    }
    if (pairs + Math.min(singles, hongzhongs) + Math.floor(Math.max(0, hongzhongs - singles) / 2) >= 7) {
      return { win: true, desc: '【七对自摸】', fan: 4 };
    }
  }

  // Standard 4 melds + 1 pair recursion
  const canDecompose = decomposeMelds(normalTiles, hongzhongs);
  if (canDecompose) {
    const isQingyise = checkQingyise(normalTiles);
    if (isQingyise) {
      return { win: true, desc: '【清一色自摸大胡】', fan: 6 };
    }
    return { win: true, desc: '【自摸和牌】', fan: 2 };
  }

  return { win: false, desc: '', fan: 0 };
}

function checkQingyise(tiles: MahjongTile[]): boolean {
  if (tiles.length === 0) return true;
  const firstType = tiles[0].type;
  if (firstType === 'zi') return false;
  return tiles.every((t) => t.type === firstType);
}

function decomposeMelds(tiles: MahjongTile[], wildcards: number): boolean {
  const map: Record<string, number> = {};
  for (const t of tiles) {
    const k = `${t.type}_${t.value}`;
    map[k] = (map[k] || 0) + 1;
  }

  const keys = Object.keys(map).sort();
  // Try each possible pair (using 2 matching tiles, or 1 tile + 1 wildcard, or 2 wildcards)
  for (let i = 0; i < keys.length; i++) {
    const pairKey = keys[i];
    if (map[pairKey] >= 2) {
      map[pairKey] -= 2;
      if (checkMeldsOnly({ ...map }, wildcards)) return true;
      map[pairKey] += 2;
    }
    if (map[pairKey] >= 1 && wildcards >= 1) {
      map[pairKey] -= 1;
      if (checkMeldsOnly({ ...map }, wildcards - 1)) return true;
      map[pairKey] += 1;
    }
  }

  if (wildcards >= 2) {
    if (checkMeldsOnly({ ...map }, wildcards - 2)) return true;
  }

  return false;
}

function checkMeldsOnly(map: Record<string, number>, wildcards: number): boolean {
  const keys = Object.keys(map).filter((k) => map[k] > 0).sort();
  if (keys.length === 0) {
    return wildcards % 3 === 0;
  }

  const k = keys[0];
  const [type, valStr] = k.split('_');
  const val = parseInt(valStr, 10);

  // 1. Try triplet
  if (map[k] >= 3) {
    map[k] -= 3;
    if (checkMeldsOnly(map, wildcards)) return true;
    map[k] += 3;
  }
  if (map[k] >= 2 && wildcards >= 1) {
    map[k] -= 2;
    if (checkMeldsOnly(map, wildcards - 1)) return true;
    map[k] += 2;
  }
  if (map[k] >= 1 && wildcards >= 2) {
    map[k] -= 1;
    if (checkMeldsOnly(map, wildcards - 2)) return true;
    map[k] += 1;
  }

  // 2. Try sequence (only wan, tiao, tong)
  if (type !== 'zi') {
    const k1 = k;
    const k2 = `${type}_${val + 1}`;
    const k3 = `${type}_${val + 2}`;

    // pure sequence
    if ((map[k1] || 0) >= 1 && (map[k2] || 0) >= 1 && (map[k3] || 0) >= 1) {
      map[k1] -= 1;
      map[k2] -= 1;
      map[k3] -= 1;
      if (checkMeldsOnly(map, wildcards)) return true;
      map[k1] += 1;
      map[k2] += 1;
      map[k3] += 1;
    }
    // sequence with 1 wildcard
    if (wildcards >= 1) {
      if ((map[k1] || 0) >= 1 && (map[k2] || 0) >= 1) {
        map[k1] -= 1;
        map[k2] -= 1;
        if (checkMeldsOnly(map, wildcards - 1)) return true;
        map[k1] += 1;
        map[k2] += 1;
      }
      if ((map[k1] || 0) >= 1 && (map[k3] || 0) >= 1) {
        map[k1] -= 1;
        map[k3] -= 1;
        if (checkMeldsOnly(map, wildcards - 1)) return true;
        map[k1] += 1;
        map[k3] += 1;
      }
    }
  }

  return false;
}

export function isYiWuJiuMa(t: MahjongTile): boolean {
  if (!t) return false;
  if (isHongzhong(t)) return true;
  if (t.type === 'zi') return true;
  return t.value === 1 || t.value === 5 || t.value === 9;
}

/**
 * Bird draw (抓鸟/抓码) calculation:
 * Standard Hongzhong: 1, 5, 9 of any suit or Hongzhong is a valid bird
 */
export function calculateZhuaMa(drawnTiles: MahjongTile[], baseStake: number): { hitCount: number; bonusStake: number; hits: MahjongTile[] } {
  const hits: MahjongTile[] = [];
  for (const t of drawnTiles) {
    if (isYiWuJiuMa(t)) {
      hits.push(t);
    }
  }
  return {
    hitCount: hits.length,
    bonusStake: hits.length * baseStake,
    hits,
  };
}

export interface MahjongSettlementResult {
  winnerSeat: number;
  winningHand: MahjongTile[];
  winningMelds: MahjongTile[][];
  maCount: number;
  maTiles: MahjongTile[];
  hitMaCount: number;
  payoutPerOpponent: number;
  isFourHongzhong: boolean;
  netCoinsPerSeat: [number, number, number, number];
  seatKongScores: [number, number, number, number];
}

export function computeMahjongSettlement(
  winnerSeat: number,
  winningHand: MahjongTile[],
  winningMelds: MahjongTile[][] = [],
  remainingWall: MahjongTile[] = [],
  sceneMode = 'hongzhong-6',
  seatKongScores: [number, number, number, number] = [0, 0, 0, 0],
  isFourHzOverride?: boolean
): MahjongSettlementResult {
  const isHongzhongMode = sceneMode.includes('hongzhong');
  const baseMaCount = sceneMode.includes('10') ? 10 : 6;
  const hzCount = (winningHand || []).filter(isHongzhong).length;
  const isFourHongzhong = isFourHzOverride ?? (isHongzhongMode && hzCount >= 4);

  let maCount = baseMaCount;
  let hitMaCount = 0;
  let payoutPerOpponent = 0;
  let maTiles: MahjongTile[] = [];

  if (isFourHongzhong) {
    maCount = baseMaCount;
    hitMaCount = baseMaCount;
    payoutPerOpponent = 10 + hitMaCount * 10; // 70 or 110
    maTiles = (remainingWall || []).slice(0, Math.min(maCount, remainingWall.length));
    while (maTiles.length < maCount) {
      maTiles.push({
        id: `hz-win-${maTiles.length}`,
        type: 'zi',
        value: 5,
        text: '红中',
        color: '#DC2626',
        isRedDragon: true,
      });
    }
  } else {
    const hasNoHongzhong = isHongzhongMode && hzCount === 0;
    maCount = hasNoHongzhong ? baseMaCount + 2 : baseMaCount;
    maTiles = (remainingWall || []).slice(0, Math.min(maCount, remainingWall.length));
    if (maTiles.length < maCount) {
      const suitTypes: Array<'wan' | 'tiao' | 'tong'> = ['wan', 'tiao', 'tong'];
      const suitTexts: Record<string, string[]> = {
        wan: ['', '一万', '二万', '三万', '四万', '五万', '六万', '七万', '八万', '九万'],
        tiao: ['', '一条', '二条', '三条', '四条', '五条', '六条', '七条', '八条', '九条'],
        tong: ['', '一筒', '二筒', '三筒', '四筒', '五筒', '六筒', '七筒', '八筒', '九筒'],
      };
      let idx = 0;
      while (maTiles.length < maCount) {
        const sType = suitTypes[idx % 3];
        const val = (idx % 9) + 1;
        maTiles.push({
          id: `fallback-ma-${maTiles.length}`,
          type: sType,
          value: val,
          text: suitTexts[sType][val],
        });
        idx++;
      }
    }
    hitMaCount = maTiles.filter(isYiWuJiuMa).length;
    payoutPerOpponent = 10 + hitMaCount * 10;
  }

  const netCoinsPerSeat: [number, number, number, number] = [0, 0, 0, 0];
  for (let s = 0; s < 4; s++) {
    const zimoDelta = s === winnerSeat ? payoutPerOpponent * 3 : -payoutPerOpponent;
    netCoinsPerSeat[s] = zimoDelta + (seatKongScores[s] || 0);
  }

  return {
    winnerSeat,
    winningHand,
    winningMelds,
    maCount,
    maTiles,
    hitMaCount,
    payoutPerOpponent,
    isFourHongzhong,
    netCoinsPerSeat,
    seatKongScores,
  };
}
