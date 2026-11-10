import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const outDir = path.resolve(process.cwd(), 'public', 'audio', 'shortcuts');
const rawDir = path.resolve('/tmp', 'raw_tts');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
if (!fs.existsSync(rawDir)) {
  fs.mkdirSync(rawDir, { recursive: true });
}

export const shortcutPhrases = [
  // 经典12条牌桌快捷短语
  { file: 'shortcut_1.mp3', text: '快点吧，我等得花儿都谢了！', role: 'classic' },
  { file: 'shortcut_2.mp3', text: '怎么又断线了，网络太差了吧！', role: 'classic' },
  { file: 'shortcut_3.mp3', text: '你的牌打得太好了！', role: 'classic' },
  { file: 'shortcut_4.mp3', text: '别高兴得太早，风水轮流转！', role: 'classic' },
  { file: 'shortcut_5.mp3', text: '和你合作真是太愉快了！', role: 'classic' },
  { file: 'shortcut_6.mp3', text: '大家好，很高兴见到各位！', role: 'classic' },
  { file: 'shortcut_7.mp3', text: '投降输一半，要不要投降？', role: 'classic' },
  { file: 'shortcut_8.mp3', text: '别吵了，专心打牌！', role: 'classic' },
  { file: 'shortcut_9.mp3', text: '留得青山在，不怕没柴烧！', role: 'classic' },
  { file: 'shortcut_10.mp3', text: '今日手气真背，一把好牌都没有！', role: 'classic' },
  { file: 'shortcut_11.mp3', text: '承让承让，这把承让了！', role: 'classic' },
  { file: 'shortcut_12.mp3', text: '看来今天我是牌神附体了！', role: 'classic' },

  // 老者音 (6条) - 纯正苍劲沉稳老者男声
  { file: 'elder_1.mp3', text: '老夫纵横牌坛数十年，尔等嫩了点！', role: 'elder' },
  { file: 'elder_2.mp3', text: '后生仔，出牌稳着点，莫急着交学费！', role: 'elder' },
  { file: 'elder_3.mp3', text: '老夫这一手绝牌，谁敢接招？', role: 'elder' },
  { file: 'elder_4.mp3', text: '茶水都凉透啦，老夫等到瞌睡都来喽！', role: 'elder' },
  { file: 'elder_5.mp3', text: '莫慌莫慌，牌局如人生，笑到最后才是赢家！', role: 'elder' },
  { file: 'elder_6.mp3', text: '承让承让，老夫这把权当倚老卖老啦！', role: 'elder' },

  // 大叔音 (6条) - 浑厚威严豪爽大叔男声
  { file: 'uncle_1.mp3', text: '就这水平？我看阁下今日是要输精光！', role: 'uncle' },
  { file: 'uncle_2.mp3', text: '牌风如剑，有本事放马过来！', role: 'uncle' },
  { file: 'uncle_3.mp3', text: '牌桌无情，今天谁退缩谁是孙子！', role: 'uncle' },
  { file: 'uncle_4.mp3', text: '看我绝大连出，谁能顶得住！', role: 'uncle' },
  { file: 'uncle_5.mp3', text: '哈哈，承让！这把筹码爷爷我笑纳了！', role: 'uncle' },
  { file: 'uncle_6.mp3', text: '打牌别装深沉，有大牌赶紧亮！', role: 'uncle' },

  // 下战帖叫阵 (6条) - 阳刚豪迈霸气男声
  { file: 'challenge_1.mp3', text: '谁敢和我血战到底！有本事的出来对阵！', role: 'challenge' },
  { file: 'challenge_2.mp3', text: '摆下英雄擂台！速来战个痛快！', role: 'challenge' },
  { file: 'challenge_3.mp3', text: '牌桌见真章！今天谁退缩谁是孙子！', role: 'challenge' },
  { file: 'challenge_4.mp3', text: '战帖已发！谁敢放马过来接我几招？', role: 'challenge' },
  { file: 'challenge_5.mp3', text: '先礼后兵，看我这把杀翻全场！', role: 'challenge' },
  { file: 'challenge_6.mp3', text: '抱拳领教，全堂高手速速应战！', role: 'challenge' },

  // 童音 (6条) - 调皮活泼幼童音
  { file: 'kid_1.mp3', text: '一动不动是乌龟！出牌快点啦！', role: 'kid' },
  { file: 'kid_2.mp3', text: '你们打牌真慢，我等得花儿都谢了！', role: 'kid' },
  { file: 'kid_3.mp3', text: '略略略，这把筹码被我全赢光啦！', role: 'kid' },
  { file: 'kid_4.mp3', text: '大叔大婶，有本事放马过来呀！', role: 'kid' },
  { file: 'kid_5.mp3', text: '看我这一手无敌好牌，打得你们落花流水！', role: 'kid' },
  { file: 'kid_6.mp3', text: '输啦输啦，不许赖皮，快快交出筹码！', role: 'kid' },

  // 萝莉音 (6条) - 甜美软萌动漫萝莉音
  { file: 'loli_1.mp3', text: '哥哥姐姐出牌快一点嘛~ 萝莉等不及啦！', role: 'loli' },
  { file: 'loli_2.mp3', text: '看我绝大连出！谁能顶得住呀！', role: 'loli' },
  { file: 'loli_3.mp3', text: '哼，打牌不许欺负人，不然我不理你们啦！', role: 'loli' },
  { file: 'loli_4.mp3', text: '笨蛋笨蛋，看萝莉这把全盘通关！', role: 'loli' },
  { file: 'loli_5.mp3', text: '超厉害对不对！把筹码统统抱回家~', role: 'loli' },
  { file: 'loli_6.mp3', text: '哇！摸到超级神牌啦！', role: 'loli' },

  // 少女音 (6条) - 清脆婉约少女音
  { file: 'maiden_1.mp3', text: '谁敢和我血战到底呀？不许偷看我的牌哦！', role: 'maiden' },
  { file: 'maiden_2.mp3', text: '客官您打牌像绣花，人家茶水都凉透啦~', role: 'maiden' },
  { file: 'maiden_3.mp3', text: '承让承让，人家这把只是运气好嘛！', role: 'maiden' },
  { file: 'maiden_4.mp3', text: '牌风如剑，小女子随时恭候各位过招！', role: 'maiden' },
  { file: 'maiden_5.mp3', text: '这把筹码人家就笑纳啦，多谢各位牌友~', role: 'maiden' },
  { file: 'maiden_6.mp3', text: '哼，人家牌风正旺，神仙也挡不住我！', role: 'maiden' },
];

/**
 * 各角色定制化专业声学变换滤镜参数 (librubberband 声道共振峰调制 + 均衡器胸腔低音强化)
 */
function getRoleFilter(role) {
  switch (role) {
    case 'elder':
      // 老者男声：基频从 230Hz 下沉至 140Hz 苍劲老者男低音，放慢 8% 语速体现老牌客从容深沉，强化 95Hz、200Hz 胸腔共鸣，柔化高频女声毛刺
      return 'rubberband=pitch=0.62:tempo=0.92:pitchq=quality:formant=shifted,equalizer=f=95:width_type=o:width=1.5:g=6,equalizer=f=200:width_type=o:width=1.5:g=4,equalizer=f=3600:width_type=o:width=2:g=-4,volume=1.35';
    
    case 'uncle':
      // 大叔男声：基频下沉至 160Hz 浑厚阳刚成年男子中音，强化 120Hz、250Hz 胸腔共振，语速干脆利落霸气
      return 'rubberband=pitch=0.70:tempo=1.02:pitchq=quality:formant=shifted,equalizer=f=120:width_type=o:width=2:g=5,equalizer=f=250:width_type=o:width=1.5:g=3,equalizer=f=3400:width_type=o:width=2:g=-3.5,volume=1.3';
    
    case 'challenge':
      // 战帖男声：阳刚豪迈武林豪侠男声，140Hz 低频厚度，2500Hz 冲劲强化，声如洪钟
      return 'rubberband=pitch=0.68:tempo=1.04:pitchq=quality:formant=shifted,equalizer=f=140:width_type=o:width=2:g=5,equalizer=f=2500:width_type=o:width=2:g=2,volume=1.3';
    
    case 'kid':
      // 童音：基频上移，清脆童稚，400Hz 活泼共鸣
      return 'rubberband=pitch=1.20:tempo=1.05:pitchq=quality:formant=shifted,equalizer=f=400:width_type=o:width=2:g=3,volume=1.2';
    
    case 'loli':
      // 萝莉音：软萌高亢二次元少女音，500Hz 甜美共振
      return 'rubberband=pitch=1.32:tempo=1.03:pitchq=quality:formant=shifted,equalizer=f=500:width_type=o:width=2:g=3,volume=1.2';
    
    case 'maiden':
      // 少女音：原声优化，自然甜美清脆
      return 'rubberband=pitch=1.04:tempo=1.0:pitchq=quality:formant=shifted,equalizer=f=1200:width_type=o:width=2:g=2,volume=1.15';
    
    case 'classic':
    default:
      // 经典牌桌惯用语：原汁原味清晰播报
      return 'rubberband=pitch=0.98:tempo=1.0:pitchq=quality:formant=shifted,volume=1.2';
  }
}

async function fetchRawTts(text, targetRawFile) {
  if (fs.existsSync(targetRawFile) && fs.statSync(targetRawFile).size > 1000) {
    return true;
  }

  const ttsUrls = [
    `https://fanyi.baidu.com/gettts?lan=zh&text=${encodeURIComponent(text)}&spd=5&source=web`,
    `https://tts.baidu.com/text2audio?cuid=baike&lan=ZH&ctp=1&padd=&tp=1&tex=${encodeURIComponent(text)}`,
  ];

  for (const u of ttsUrls) {
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Referer': 'https://fanyi.baidu.com/',
        },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength > 500) {
          fs.writeFileSync(targetRawFile, buf);
          return true;
        }
      }
    } catch {}
  }
  return false;
}

async function generateAll() {
  console.log(`🎵 正在开始为 ${shortcutPhrases.length} 条牌友快捷短语重新精调生成离线高品质音频 (大叔/老者为纯正男声)...`);
  let successCount = 0;

  for (let i = 0; i < shortcutPhrases.length; i++) {
    const item = shortcutPhrases[i];
    const rawFile = path.join(rawDir, `raw_${item.file}`);
    const finalFile = path.join(outDir, item.file);

    // 1. 获取纯净母带音频
    let gotRaw = await fetchRawTts(item.text, rawFile);
    if (!gotRaw && fs.existsSync(finalFile)) {
      // 若已有旧文件，也可作为母带转换
      fs.copyFileSync(finalFile, rawFile);
      gotRaw = true;
    }

    if (!gotRaw) {
      console.warn(`⚠️ [母带获取失败] ${item.file} -> "${item.text}"`);
      continue;
    }

    // 2. 使用 ffmpeg 执行高质量声学特征转换（包括大叔音/老者音/叫阵音男声转换）
    const afFilter = getRoleFilter(item.role);
    try {
      const cmd = `ffmpeg -y -i "${rawFile}" -af "${afFilter}" -b:a 64k "${finalFile}" 2>/dev/null`;
      execSync(cmd);
      const stat = fs.statSync(finalFile);
      if (stat.size > 500) {
        const genderDesc = (item.role === 'elder' || item.role === 'uncle' || item.role === 'challenge') ? '【🧔/👴 阳刚男声】' : '【标准原声/女声】';
        console.log(`✅ [${i + 1}/${shortcutPhrases.length}] ${genderDesc} ${item.file} (${stat.size} 字节) -> "${item.text}"`);
        successCount++;
      } else {
        console.warn(`⚠️ [文件过小] ${item.file}`);
      }
    } catch (e) {
      console.error(`❌ [转换失败] ${item.file}:`, e.message);
    }

    await new Promise((r) => setTimeout(r, 40));
  }

  console.log(`\n🎉 快捷短语离线 MP3 重新生成完毕！成功处理 ${successCount}/${shortcutPhrases.length} 个文件。大叔与老者音已全部转为纯正浑厚男声！`);
}

generateAll().catch(console.error);
