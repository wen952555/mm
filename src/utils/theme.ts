export interface TableTheme {
  id: string;
  name: string;
  gameType?: string;
  feltColor: string;
  edgeColor: string;
  borderColor: string;
  accentColor: string;
  textColor: string;
  highlightColor?: string;
}

// 3 Dedicated Game Theme Colors matching the 3D Lobby Cards 1:1 - Upgraded to luminous, bright salon palettes
export const GAME_THEMES_MAP: Record<string, TableTheme> = {
  yansan: {
    id: 'theme-yansan',
    name: '典雅羊皮纸 · 经典烟三',
    gameType: 'yansan',
    highlightColor: '#FAF4E8',
    feltColor: '#E6D7B8',
    edgeColor: '#D0BFA2',
    borderColor: '#B8A484',
    accentColor: '#4E3827',
    textColor: '#3C2C1E',
  },
  shisanshui: {
    id: 'theme-shisanshui',
    name: '暖阳羊皮纸 · 水镜十三水',
    gameType: 'shisanshui',
    highlightColor: '#F8F0E2',
    feltColor: '#E0D0B0',
    edgeColor: '#C8B898',
    borderColor: '#B0A080',
    accentColor: '#483624',
    textColor: '#38281A',
  },
  mahjong: {
    id: 'theme-mahjong',
    name: '古韵羊皮纸 · 国标麻将',
    gameType: 'mahjong',
    highlightColor: '#FAF4E8',
    feltColor: '#E8DCC0',
    edgeColor: '#D2C4A6',
    borderColor: '#BAAC8E',
    accentColor: '#503C2A',
    textColor: '#3E2A1D',
  },
};

export const TABLE_THEMES: TableTheme[] = [
  GAME_THEMES_MAP.yansan,
  GAME_THEMES_MAP.shisanshui,
  GAME_THEMES_MAP.mahjong,
];

export function getGameTheme(gameType: string): TableTheme {
  return GAME_THEMES_MAP[gameType] || GAME_THEMES_MAP.yansan;
}

export function getSavedTheme(): TableTheme {
  try {
    const id = localStorage.getItem('rustchess_table_theme');
    if (id) {
      const found = TABLE_THEMES.find((t) => t.id === id);
      if (found) return found;
    }
  } catch {}
  return TABLE_THEMES[0];
}

export function saveTheme(themeId: string) {
  try {
    localStorage.setItem('rustchess_table_theme', themeId);
  } catch {}
}
