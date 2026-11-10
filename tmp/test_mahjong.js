// Test simulation of MahjongCanvas dealer timeout and passTurnToNext
const TILE_CHARS = {
  wan: ['一万', '二万', '三万', '四万', '五万', '六万', '七万', '八万', '九万'],
  tiao: ['一条', '二条', '三条', '四条', '五条', '六条', '七条', '八条', '九条'],
  tong: ['一筒', '二筒', '三筒', '四筒', '五筒', '六筒', '七筒', '八筒', '九筒'],
  zi: ['东风', '南风', '西风', '北风', '红中', '发财', '白板'],
};

function createTilePool() {
  const pool = [];
  let id = 1;
  for (let copy = 0; copy < 4; copy++) {
    for (const [type, names] of Object.entries(TILE_CHARS)) {
      names.forEach((text, i) => {
        pool.push({ id: `t-${id++}`, type, value: i + 1, text });
      });
    }
  }
  return pool.sort(() => Math.random() - 0.5);
}

console.log("Pool created:", createTilePool().length);
