import fs from 'fs';
import path from 'path';

const outDir = path.resolve(process.cwd(), 'public', 'audio');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

export const phrases = [
  // ==================== 1. 经典烟三 (Classic Yansan) ====================
  // 领出与首出
  { file: 'yansan_lead.mp3', text: '方块四首出，开牌' },
  { file: 'spade_3.mp3', text: '黑桃三至尊' },
  { file: 'spade_A.mp3', text: '黑桃尖' },
  { file: 'unbeatable.mp3', text: '全场绝大，无人可压' },
  { file: 'cards_short.mp3', text: '对手张数不足，连出' },
  { file: 'jiefeng.mp3', text: '接风领出新牌' },
  { file: 'clean_out.mp3', text: '率先出清，关门大吉' },

  // 烟三战术与状态
  { file: 'qianggong.mp3', text: '开启强攻，独战全场' },
  { file: 'surrender.mp3', text: '认输投降' },
  { file: 'baodan.mp3', text: '报单，只剩最后一张牌' },
  { file: 'baodan_win.mp3', text: '报单绝杀，出清获胜' },
  { file: 'pass.mp3', text: '过' },
  { file: 'yaobuqi.mp3', text: '要不起' },

  // 单张 (2 ~ A)
  { file: 'single_2.mp3', text: '单张二' },
  { file: 'single_3.mp3', text: '单张三' },
  { file: 'single_4.mp3', text: '单张四' },
  { file: 'single_5.mp3', text: '单张五' },
  { file: 'single_6.mp3', text: '单张六' },
  { file: 'single_7.mp3', text: '单张七' },
  { file: 'single_8.mp3', text: '单张八' },
  { file: 'single_9.mp3', text: '单张九' },
  { file: 'single_10.mp3', text: '单张十' },
  { file: 'single_J.mp3', text: '单张勾' },
  { file: 'single_Q.mp3', text: '单张圈' },
  { file: 'single_K.mp3', text: '单张老K' },
  { file: 'single_A.mp3', text: '单张尖' },

  // 对子 (对2 ~ 对A)
  { file: 'pair_2.mp3', text: '对二' },
  { file: 'pair_3.mp3', text: '对三' },
  { file: 'pair_4.mp3', text: '对四' },
  { file: 'pair_5.mp3', text: '对五' },
  { file: 'pair_6.mp3', text: '对六' },
  { file: 'pair_7.mp3', text: '对七' },
  { file: 'pair_8.mp3', text: '对八' },
  { file: 'pair_9.mp3', text: '对九' },
  { file: 'pair_10.mp3', text: '对十' },
  { file: 'pair_J.mp3', text: '对勾' },
  { file: 'pair_Q.mp3', text: '对圈' },
  { file: 'pair_K.mp3', text: '对老K' },
  { file: 'pair_A.mp3', text: '对尖' },

  // 三条 (三个2 ~ 三个A)
  { file: 'triplet.mp3', text: '三条' },
  { file: 'triple_2.mp3', text: '三个二' },
  { file: 'triple_3.mp3', text: '三个三' },
  { file: 'triple_4.mp3', text: '三个四' },
  { file: 'triple_5.mp3', text: '三个五' },
  { file: 'triple_6.mp3', text: '三个六' },
  { file: 'triple_7.mp3', text: '三个七' },
  { file: 'triple_8.mp3', text: '三个八' },
  { file: 'triple_9.mp3', text: '三个九' },
  { file: 'triple_10.mp3', text: '三个十' },
  { file: 'triple_J.mp3', text: '三个勾' },
  { file: 'triple_Q.mp3', text: '三个圈' },
  { file: 'triple_K.mp3', text: '三个老K' },
  { file: 'triple_A.mp3', text: '三个尖' },

  // 五张组合牌
  { file: 'straight.mp3', text: '顺子' },
  { file: 'flush.mp3', text: '同花' },
  { file: 'fulu.mp3', text: '俘虏葫芦' },
  { file: 'four_with_one.mp3', text: '四带一' },
  { file: 'bomb.mp3', text: '炸弹' },
  { file: 'same_suit_straight.mp3', text: '同花顺' },

  // ==================== 2. 水镜十三水 (Shisanshui) ====================
  { file: 'shisanshui_compare.mp3', text: '开牌比水' },
  { file: 'gunshot.mp3', text: '打枪' },
  { file: 'grand_slam.mp3', text: '全垒打' },
  { file: 'daoshui.mp3', text: '倒水相公' },
  { file: 'high_card.mp3', text: '乌龙散牌' },
  { file: 'two_pairs.mp3', text: '两对' },
  { file: 'chongsan.mp3', text: '三条冲三' },
  { file: 'hulu.mp3', text: '葫芦' },
  { file: 'tiezhi.mp3', text: '铁支' },
  { file: 'five_of_a_kind.mp3', text: '至尊五同' },
  { file: 'head_tier.mp3', text: '头道' },
  { file: 'mid_tier.mp3', text: '中道' },
  { file: 'tail_tier.mp3', text: '尾道' },
  { file: 'optimal_arrange.mp3', text: '一键智能最优理牌' },
  { file: 'dragon.mp3', text: '一条龙' },
  { file: 'supreme_dragon.mp3', text: '至尊青龙' },
  { file: 'three_flushes.mp3', text: '三同花' },
  { file: 'three_straights.mp3', text: '三顺子' },
  { file: 'six_and_half_pairs.mp3', text: '六对半' },

  // ==================== 3. 经典国标麻将 (Mahjong) ====================
  // 万字
  { file: 'mj_1wan.mp3', text: '一万' },
  { file: 'mj_2wan.mp3', text: '二万' },
  { file: 'mj_3wan.mp3', text: '三万' },
  { file: 'mj_4wan.mp3', text: '四万' },
  { file: 'mj_5wan.mp3', text: '五万' },
  { file: 'mj_6wan.mp3', text: '六万' },
  { file: 'mj_7wan.mp3', text: '七万' },
  { file: 'mj_8wan.mp3', text: '八万' },
  { file: 'mj_9wan.mp3', text: '九万' },

  // 条字
  { file: 'mj_1tiao.mp3', text: '一条' },
  { file: 'mj_2tiao.mp3', text: '二条' },
  { file: 'mj_3tiao.mp3', text: '三条' },
  { file: 'mj_4tiao.mp3', text: '四条' },
  { file: 'mj_5tiao.mp3', text: '五条' },
  { file: 'mj_6tiao.mp3', text: '六条' },
  { file: 'mj_7tiao.mp3', text: '七条' },
  { file: 'mj_8tiao.mp3', text: '八条' },
  { file: 'mj_9tiao.mp3', text: '九条' },

  // 筒/饼字
  { file: 'mj_1bing.mp3', text: '一饼' },
  { file: 'mj_2bing.mp3', text: '二饼' },
  { file: 'mj_3bing.mp3', text: '三饼' },
  { file: 'mj_4bing.mp3', text: '四饼' },
  { file: 'mj_5bing.mp3', text: '五饼' },
  { file: 'mj_6bing.mp3', text: '六饼' },
  { file: 'mj_7bing.mp3', text: '七饼' },
  { file: 'mj_8bing.mp3', text: '八饼' },
  { file: 'mj_9bing.mp3', text: '九饼' },

  // 风牌与箭牌
  { file: 'mj_dong.mp3', text: '东风' },
  { file: 'mj_nan.mp3', text: '南风' },
  { file: 'mj_xi.mp3', text: '西风' },
  { file: 'mj_bei.mp3', text: '北风' },
  { file: 'mj_zhong.mp3', text: '红中' },
  { file: 'mj_fa.mp3', text: '发财' },
  { file: 'mj_bai.mp3', text: '白板' },

  // 麻将动作
  { file: 'peng.mp3', text: '碰' },
  { file: 'gang.mp3', text: '杠' },
  { file: 'angang.mp3', text: '暗杠' },
  { file: 'bugang.mp3', text: '补杠' },
  { file: 'zimo.mp3', text: '自摸，胡了' },
  { file: 'hu.mp3', text: '胡牌' },
  { file: 'ting.mp3', text: '听牌' },
  { file: 'chi.mp3', text: '吃牌' },
  { file: 'dingzhuang.mp3', text: '打色子定庄，开门取牌' },

  // ==================== 4. 茶楼通用对局结算与系统语音 ====================
  { file: 'checkin.mp3', text: '恭喜领得开运金币' },
  { file: 'tie.mp3', text: '势均力敌，打和不分胜负' },
];

async function generate() {
  console.log(`🎵 正在开始生成 ${phrases.length} 个经典国粹棋牌离线语音 MP3 文件...`);
  let count = 0;

  for (const item of phrases) {
    const targetFile = path.join(outDir, item.file);
    if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 500) {
      console.log(`⏩ [已存在] ${item.file} -> "${item.text}"`);
      count++;
      continue;
    }

    const ttsUrls = [
      `https://fanyi.baidu.com/gettts?lan=zh&text=${encodeURIComponent(item.text)}&spd=6&source=web`,
      `https://tts.baidu.com/text2audio?cuid=baike&lan=ZH&ctp=1&padd=&tp=1&tex=${encodeURIComponent(item.text)}`,
    ];

    let success = false;
    for (const u of ttsUrls) {
      try {
        const res = await fetch(u, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://fanyi.baidu.com/',
          },
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.byteLength > 500) {
            fs.writeFileSync(targetFile, buf);
            console.log(`✅ [生成成功 ${count + 1}/${phrases.length}] ${item.file} (${buf.byteLength} 字节) -> "${item.text}"`);
            success = true;
            count++;
            break;
          }
        }
      } catch (e) {
        // continue retry
      }
    }

    if (!success) {
      console.warn(`⚠️ [生成失败] ${item.file} -> "${item.text}"`);
    }

    await new Promise((r) => setTimeout(r, 60));
  }

  console.log(`🎉 经典三大国粹棋牌离线语音 MP3 文件全量就绪！共处理 ${count}/${phrases.length} 个音频。`);
}

generate().catch(console.error);
