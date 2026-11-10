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

/**
 * Bird draw (抓鸟/抓码) calculation:
 * Standard Hongzhong: 1, 5, 9 of any suit or Hongzhong is a valid bird
 */
export function calculateZhuaMa(drawnTiles: MahjongTile[], baseStake: number): { hitCount: number; bonusStake: number; hits: MahjongTile[] } {
  const hits: MahjongTile[] = [];
  for (const t of drawnTiles) {
    if (isHongzhong(t) || t.value === 1 || t.value === 5 || t.value === 9) {
      hits.push(t);
    }
  }
  return {
    hitCount: hits.length,
    bonusStake: hits.length * baseStake,
    hits,
  };
}
