import { resolveApiUrl } from './networkConfig.ts';
import { YANSAN_AUDIO_MAP } from '../games/yansan/audioMap.ts';
import { SHISANSHUI_AUDIO_MAP } from '../games/shisanshui/audioMap.ts';
import { MAHJONG_AUDIO_MAP } from '../games/mahjong/audioMap.ts';

// 本地 100% 离线高清真人配音资源映射表（三大经典国粹：烟三、十三水、国标麻将拆分独立维护）
const LOCAL_AUDIO_MAP: Record<string, string> = {
  // 1. 经典烟三独立语音映射 (src/games/yansan/audioMap.ts)
  ...YANSAN_AUDIO_MAP,

  // 2. 水镜十三水独立语音映射 (src/games/shisanshui/audioMap.ts)
  ...SHISANSHUI_AUDIO_MAP,

  // 3. 经典国标麻将独立语音映射 (src/games/mahjong/audioMap.ts)
  ...MAHJONG_AUDIO_MAP,

  // ==================== 4. 茶楼通用对局结算与系统语音 ====================
  '签到': '/audio/checkin.mp3',
  '恭喜领得开运金币': '/audio/checkin.mp3',
  'checkin': '/audio/checkin.mp3',
  '打和': '/audio/tie.mp3',
  '势均力敌打和不分胜负': '/audio/tie.mp3',
  'tie': '/audio/tie.mp3',

  // ==================== 5. 牌友聊天室与快捷短语离线高清真人配音 ====================
  // 经典12条牌桌快捷短语
  '快点吧我等得花儿都谢了': '/audio/shortcuts/shortcut_1.mp3',
  '快点吧，我等得花儿都谢了！': '/audio/shortcuts/shortcut_1.mp3',
  '快点吧': '/audio/shortcuts/shortcut_1.mp3',
  '怎么又断线了网络太差了吧': '/audio/shortcuts/shortcut_2.mp3',
  '怎么又断线了，网络太差了吧！': '/audio/shortcuts/shortcut_2.mp3',
  '你的牌打得太好了': '/audio/shortcuts/shortcut_3.mp3',
  '你的牌打得太好了！': '/audio/shortcuts/shortcut_3.mp3',
  '别高兴得太早风水轮流转': '/audio/shortcuts/shortcut_4.mp3',
  '别高兴得太早，风水轮流转！': '/audio/shortcuts/shortcut_4.mp3',
  '和你合作真是太愉快了': '/audio/shortcuts/shortcut_5.mp3',
  '和你合作真是太愉快了！': '/audio/shortcuts/shortcut_5.mp3',
  '大家好很高兴见到各位': '/audio/shortcuts/shortcut_6.mp3',
  '大家好，很高兴见到各位！': '/audio/shortcuts/shortcut_6.mp3',
  '投降输一半要不要投降': '/audio/shortcuts/shortcut_7.mp3',
  '投降输一半，要不要投降？': '/audio/shortcuts/shortcut_7.mp3',
  '别吵了专心打牌': '/audio/shortcuts/shortcut_8.mp3',
  '别吵了，专心打牌！': '/audio/shortcuts/shortcut_8.mp3',
  '留得青山在不怕没柴烧': '/audio/shortcuts/shortcut_9.mp3',
  '留得青山在，不怕没柴烧！': '/audio/shortcuts/shortcut_9.mp3',
  '今日手气真背一把好牌都没有': '/audio/shortcuts/shortcut_10.mp3',
  '今日手气真背，一把好牌都没有！': '/audio/shortcuts/shortcut_10.mp3',
  '承让承让这把承让了': '/audio/shortcuts/shortcut_11.mp3',
  '承让承让，这把承让了！': '/audio/shortcuts/shortcut_11.mp3',
  // 少女音 (6条)
  '谁敢和我血战到底呀不许偷看我的牌哦': '/audio/shortcuts/maiden_1.mp3',
  '谁敢和我血战到底呀？不许偷看我的牌哦！': '/audio/shortcuts/maiden_1.mp3',
  '客官您打牌像绣花人家茶水都凉透啦': '/audio/shortcuts/maiden_2.mp3',
  '客官您打牌像绣花，人家茶水都凉透啦~': '/audio/shortcuts/maiden_2.mp3',
  '承让承让人家这把只是运气好嘛': '/audio/shortcuts/maiden_3.mp3',
  '承让承让，人家这把只是运气好嘛！': '/audio/shortcuts/maiden_3.mp3',
  '牌风如剑小女子随时恭候各位过招': '/audio/shortcuts/maiden_4.mp3',
  '牌风如剑，小女子随时恭候各位过招！': '/audio/shortcuts/maiden_4.mp3',
  '这把筹码人家就笑纳啦多谢各位牌友': '/audio/shortcuts/maiden_5.mp3',
  '这把筹码人家就笑纳啦，多谢各位牌友~': '/audio/shortcuts/maiden_5.mp3',
  '哼人家牌风正旺神仙也挡不住我': '/audio/shortcuts/maiden_6.mp3',
  '哼，人家牌风正旺，神仙也挡不住我！': '/audio/shortcuts/maiden_6.mp3',

  // 下战帖叫阵 (6条)
  '谁敢和我血战到底有本事的出来对阵': '/audio/shortcuts/challenge_1.mp3',
  '谁敢和我血战到底！有本事的出来对阵！': '/audio/shortcuts/challenge_1.mp3',
  '摆下英雄擂台速来战个痛快': '/audio/shortcuts/challenge_2.mp3',
  '摆下英雄擂台！速来战个痛快！': '/audio/shortcuts/challenge_2.mp3',
  '牌桌见真章今天谁退缩谁是孙子': '/audio/shortcuts/challenge_3.mp3',
  '牌桌见真章！今天谁退缩谁是孙子！': '/audio/shortcuts/challenge_3.mp3',
  '战帖已发谁敢放马过来接我几招': '/audio/shortcuts/challenge_4.mp3',
  '战帖已发！谁敢放马过来接我几招？': '/audio/shortcuts/challenge_4.mp3',
  '先礼后兵看我这把杀翻全场': '/audio/shortcuts/challenge_5.mp3',
  '先礼后兵，看我这把杀翻全场！': '/audio/shortcuts/challenge_5.mp3',
  '抱拳领教全堂高手速速应战': '/audio/shortcuts/challenge_6.mp3',
  '抱拳领教，全堂高手速速应战！': '/audio/shortcuts/challenge_6.mp3',

  // 粤语男声 (6条)
  '快啲啦我等到花都謝喇': '/audio/shortcuts/cantonese_m_1.mp3',
  '快啲啦，我等到花都謝喇！': '/audio/shortcuts/cantonese_m_1.mp3',
  '快啲啦我等到花都谢喇': '/audio/shortcuts/cantonese_m_1.mp3',
  '快啲啦，我等到花都谢喇！': '/audio/shortcuts/cantonese_m_1.mp3',
  '呢把牌咁正呢鋪籌碼我笑納喇': '/audio/shortcuts/cantonese_m_2.mp3',
  '呢把牌咁正，呢鋪籌碼我笑納喇！': '/audio/shortcuts/cantonese_m_2.mp3',
  '呢把牌咁正呢铺筹码我笑纳喇': '/audio/shortcuts/cantonese_m_2.mp3',
  '呢把牌咁正，呢铺筹码我笑纳喇！': '/audio/shortcuts/cantonese_m_2.mp3',
  '風水輪流轉陣間睇我點贏返': '/audio/shortcuts/cantonese_m_3.mp3',
  '風水輪流轉，陣間睇我點贏返！': '/audio/shortcuts/cantonese_m_3.mp3',
  '风水轮流转阵间睇我点赢返': '/audio/shortcuts/cantonese_m_3.mp3',
  '风水轮流转，阵间睇我点赢返！': '/audio/shortcuts/cantonese_m_3.mp3',
  '牌風如劍有本事放馬過嚟': '/audio/shortcuts/cantonese_m_4.mp3',
  '牌風如劍，有本事放馬過嚟！': '/audio/shortcuts/cantonese_m_4.mp3',
  '牌风如剑有本事放马过来嚟': '/audio/shortcuts/cantonese_m_4.mp3',
  '牌风如剑，有本事放马过来嚟！': '/audio/shortcuts/cantonese_m_4.mp3',
  '輸少當贏你要唔要投降啊': '/audio/shortcuts/cantonese_m_5.mp3',
  '輸少當贏，你要唔要投降啊？': '/audio/shortcuts/cantonese_m_5.mp3',
  '输少当赢你要唔要投降啊': '/audio/shortcuts/cantonese_m_5.mp3',
  '输少当赢，你要唔要投降啊？': '/audio/shortcuts/cantonese_m_5.mp3',
  '飲杯茶食個包專心打牌啦': '/audio/shortcuts/cantonese_m_6.mp3',
  '飲杯茶，食個包，專心打牌啦！': '/audio/shortcuts/cantonese_m_6.mp3',
  '饮杯茶食个包专心打牌啦': '/audio/shortcuts/cantonese_m_6.mp3',
  '饮杯茶，食个包，专心打牌啦！': '/audio/shortcuts/cantonese_m_6.mp3',

  // 粤语女声 (6条)
  '各位大佬出牌快少少啦': '/audio/shortcuts/cantonese_f_1.mp3',
  '各位大佬，出牌快少少啦~': '/audio/shortcuts/cantonese_f_1.mp3',
  '承讓承讓人家呢把只係運氣好咋': '/audio/shortcuts/cantonese_f_2.mp3',
  '承讓承讓，人家呢把只係運氣好咋！': '/audio/shortcuts/cantonese_f_2.mp3',
  '承让承让人家呢把只系运气好咋': '/audio/shortcuts/cantonese_f_2.mp3',
  '承让承让，人家呢把只系运气好咋！': '/audio/shortcuts/cantonese_f_2.mp3',
  '哼我呢排手氣正旺神仙都擋唔住': '/audio/shortcuts/cantonese_f_3.mp3',
  '哼，我呢排手氣正旺，神仙都擋唔住！': '/audio/shortcuts/cantonese_f_3.mp3',
  '哼我呢排手气正旺神仙都挡唔住': '/audio/shortcuts/cantonese_f_3.mp3',
  '哼，我呢排手气正旺，神仙都挡唔住！': '/audio/shortcuts/cantonese_f_3.mp3',
  '打牌唔許欺負人唔係我唔理你哋喇': '/audio/shortcuts/cantonese_f_4.mp3',
  '打牌唔許欺負人，唔係我唔理你哋喇！': '/audio/shortcuts/cantonese_f_4.mp3',
  '打牌唔许欺负人唔系我唔理你哋喇': '/audio/shortcuts/cantonese_f_4.mp3',
  '打牌唔许欺负人，唔系我唔理你哋喇！': '/audio/shortcuts/cantonese_f_4.mp3',
  '哇摸到超級神牌喇多謝各位牌友': '/audio/shortcuts/cantonese_f_5.mp3',
  '哇！摸到超級神牌喇，多謝各位牌友！': '/audio/shortcuts/cantonese_f_5.mp3',
  '哇摸到超级神牌喇多谢各位牌友': '/audio/shortcuts/cantonese_f_5.mp3',
  '哇！摸到超级神牌喇，多谢各位牌友！': '/audio/shortcuts/cantonese_f_5.mp3',
  '呢把籌碼我攞走喇多謝各位承讓': '/audio/shortcuts/cantonese_f_6.mp3',
  '呢把籌碼我攞走喇，多謝各位承讓！': '/audio/shortcuts/cantonese_f_6.mp3',
  '呢把筹码我攞走喇多谢各位承让': '/audio/shortcuts/cantonese_f_6.mp3',
  '呢把筹码我攞走喇，多谢各位承让！': '/audio/shortcuts/cantonese_f_6.mp3',
};

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled = true;
  public voiceVolume = 0.9; // 0.0 - 1.0 (出牌真人配音与牌桌音效音量)
  public bgmVolume = 0.7;   // 0.0 - 1.0 (背景古筝与茶楼环境音乐音量)
  private isUnlocked = false;
  private lastZimoSpokenTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedEnabled = localStorage.getItem('teahouse_sound_enabled');
        if (savedEnabled !== null) this.enabled = savedEnabled === 'true';
        const savedVoice = localStorage.getItem('teahouse_voice_volume');
        if (savedVoice !== null) {
          const v = parseFloat(savedVoice);
          if (!isNaN(v)) this.voiceVolume = Math.max(0, Math.min(1, v));
        }
        const savedBgm = localStorage.getItem('teahouse_bgm_volume');
        if (savedBgm !== null) {
          const v = parseFloat(savedBgm);
          if (!isNaN(v)) this.bgmVolume = Math.max(0, Math.min(1, v));
        }
      } catch {}
    }
    this.bindGlobalUnlock();
  }

  public setVoiceVolume(v: number) {
    this.voiceVolume = Math.max(0, Math.min(1, v));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('teahouse_voice_volume', String(this.voiceVolume));
      } catch {}
    }
  }

  public setBgmVolume(v: number) {
    this.bgmVolume = Math.max(0, Math.min(1, v));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('teahouse_bgm_volume', String(this.bgmVolume));
      } catch {}
    }
  }

  public setEnabled(e: boolean) {
    this.enabled = e;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('teahouse_sound_enabled', String(e));
      } catch {}
    }
  }

  // 语音对讲与出牌播报互斥控制：录制中或收听中暂停出牌语音播报，避免麦克风录入杂音或声音混叠
  private isRecordingVoiceChat = false;
  private isPlayingVoiceChat = false;
  private cardVoiceSuppressed = false;

  public setCardVoiceSuppressed(suppressed: boolean) {
    this.cardVoiceSuppressed = suppressed;
    if (suppressed) {
      this.stopCurrentVoice();
    }
  }

  public startVoiceChatRecording() {
    this.isRecordingVoiceChat = true;
    this.stopCurrentVoice();
  }

  public stopVoiceChatRecording() {
    this.isRecordingVoiceChat = false;
  }

  public startVoiceChatPlayback() {
    this.isPlayingVoiceChat = true;
    this.stopCurrentVoice();
  }

  public stopVoiceChatPlayback() {
    this.isPlayingVoiceChat = false;
  }

  public isCardVoiceSuppressed(): boolean {
    return this.cardVoiceSuppressed || this.isRecordingVoiceChat || this.isPlayingVoiceChat;
  }

  private bindGlobalUnlock() {
    if (typeof window === 'undefined' || this.isUnlocked) return;
    const unlock = () => {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          try {
            this.ctx = new AudioCtx();
          } catch {}
        }
      }
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            this.isUnlocked = true;
            try {
              const buf = this.ctx!.createBuffer(1, 1, 22050);
              const src = this.ctx!.createBufferSource();
              src.buffer = buf;
              src.connect(this.ctx!.destination);
              src.start(0);
            } catch {}
          }).catch(() => {});
        } else if (this.ctx.state === 'running') {
          this.isUnlocked = true;
        }
      }
    };
    window.addEventListener('touchstart', unlock, { passive: true, capture: true, once: true });
    window.addEventListener('click', unlock, { passive: true, capture: true, once: true });
    window.addEventListener('pointerdown', unlock, { passive: true, capture: true, once: true });
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.bindGlobalUnlock();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Stone or light card tap
  public playTap() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Heavy wooden piece thud
  public playWoodPiece(isCapture = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isCapture ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isCapture ? 300 : 220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + (isCapture ? 0.12 : 0.08));
    gain.gain.setValueAtTime(isCapture ? 0.35 : 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isCapture ? 0.13 : 0.09));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Mahjong ceramic clack (碰/打/杠)
  public playMahjongClack() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.07);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Card snap / deal / bomb
  public playCardSnap(isBomb = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (isBomb) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.28);
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    }
  }

  // Victory chime
  public playVictory = () => {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.42);
      });
    } catch {}
  };

  // Defeat chime (descending tones)
  public playDefeat = () => {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [440, 415.3, 370, 311.13];
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch {}
  };

  // 3D Bomb Detonation / Shockwave (烟三炸弹/十三水开牌)
  public playBombExplosion(isNuke = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * (isNuke ? 0.7 : 0.4);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + (isNuke ? 0.6 : 0.35));

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(isNuke ? 0.6 : 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isNuke ? 0.68 : 0.38));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  // 3D Gunshot Crack (十三水打枪)
  public playGunshot() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
    setTimeout(() => {
      this.playWoodPiece(true);
    }, 30);
  }

  // 3D Heavy Jade / Calligraphy Seal Stamp (碰/杠/胡)
  public playSealStamp() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 3D Tumbling Rolling Dice (麻将打色子定庄)
  public playDiceRoll() {
    const ctx = this.getContext();
    if (!ctx) return;
    const clicks = 6;
    for (let i = 0; i < clicks; i++) {
      const delay = i * 0.045 + Math.random() * 0.02;
      setTimeout(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900 + Math.random() * 400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
        gain.gain.setValueAtTime(0.18 * (1 - i / clicks), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      }, delay * 1000);
    }
  }

  // 3D Coin Cascade Chime (筹码结算与签到奖励)
  public playCoinShower() {
    const ctx = this.getContext();
    if (!ctx) return;
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0];
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const freq = freqs[Math.floor(Math.random() * freqs.length)];
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      }, i * 65);
    }
  }

  // Card shuffle / deal short sound
  public playCardsShort() {
    this.playCardSnap(false);
  }

  // Card place sound
  public playCardPlace() {
    this.playCardSnap(false);
  }

  // Pass sound
  public playPass() {
    this.speakAction('pass');
  }

  // Daoshui sound
  public playDaoshui() {
    this.speakAction('daoshui');
  }

  // Rocket sound
  public playRocket() {
    this.playBombExplosion(true);
  }

  // Airplane sound
  public playAirplane() {
    this.playCardSnap(true);
  }

  // Glass clink sound (🍺/🍵 props)
  public playClink() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Flower sound (💐 prop)
  public playFlower() {
    this.playCoinShower();
  }

  // Splat sound (🍅/🩴 props)
  public playSplat() {
    this.playWoodPiece(true);
  }

  // 匹配本地离线音频路径
  public findLocalAudioUrl(keyOrText: string): string | null {
    if (!keyOrText) return null;
    // 提取纯台词内容（去除形如 "[👴 老者音] “...”" 或 "【大叔音】..." 前缀与首尾引号）
    const cleanRaw = keyOrText
      .replace(/^[\[【][^\]】]+[\]】]\s*[“"']?/, '')
      .replace(/[”"']\s*$/, '')
      .trim();

    let clean = cleanRaw
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
      .replace(/单张/g, '丹张')
      .replace(/^单([0-9一二三四五六七八九十勾圈老K尖A-Z])/i, '丹$1')
      .trim();

    // 排除结算动态积分播报句子与大获全胜词汇，绝不匹配静态音频
    if (
      clean.includes('恭喜老板') ||
      clean.includes('这把输了') ||
      clean.includes('进账') ||
      clean.includes('赢回来') ||
      clean.includes('大获全胜') ||
      clean.includes('旗开得胜')
    ) {
      return null;
    }

    // 1. 精确匹配
    if (LOCAL_AUDIO_MAP[clean]) return LOCAL_AUDIO_MAP[clean];
    if (LOCAL_AUDIO_MAP[keyOrText]) return LOCAL_AUDIO_MAP[keyOrText];
    if (LOCAL_AUDIO_MAP[cleanRaw]) return LOCAL_AUDIO_MAP[cleanRaw];

    // 单张扑克 100% 离线音频精准兜底（含数字与汉字点数）
    const singleMatch = clean.match(/^(?:单张|丹张|单|丹)\s*([2-9]|10|[JQKA]|二|三|四|五|六|七|八|九|十|勾|圈|老K|尖)$/i);
    if (singleMatch) {
      const r = singleMatch[1].toUpperCase();
      let fileKey = r;
      if (r === '2' || r === '二') fileKey = '2';
      else if (r === '3' || r === '三') fileKey = '3';
      else if (r === '4' || r === '四') fileKey = '4';
      else if (r === '5' || r === '五') fileKey = '5';
      else if (r === '6' || r === '六') fileKey = '6';
      else if (r === '7' || r === '七') fileKey = '7';
      else if (r === '8' || r === '八') fileKey = '8';
      else if (r === '9' || r === '九') fileKey = '9';
      else if (r === '10' || r === '十') fileKey = '10';
      else if (r === 'J' || r === '勾') fileKey = 'J';
      else if (r === 'Q' || r === '圈') fileKey = 'Q';
      else if (r === 'K' || r === '老K') fileKey = 'K';
      else if (r === 'A' || r === '尖') fileKey = 'A';
      return `/audio/single_${fileKey}.mp3`;
    }

    // 对子扑克 100% 离线音频精准兜底
    const pairMatch = clean.match(/^(?:对子|对)\s*([2-9]|10|[JQKA]|二|三|四|五|六|七|八|九|十|勾|圈|老K|尖)$/i);
    if (pairMatch) {
      const r = pairMatch[1].toUpperCase();
      let fileKey = r;
      if (r === '2' || r === '二') fileKey = '2';
      else if (r === '3' || r === '三') fileKey = '3';
      else if (r === '4' || r === '四') fileKey = '4';
      else if (r === '5' || r === '五') fileKey = '5';
      else if (r === '6' || r === '六') fileKey = '6';
      else if (r === '7' || r === '七') fileKey = '7';
      else if (r === '8' || r === '八') fileKey = '8';
      else if (r === '9' || r === '九') fileKey = '9';
      else if (r === '10' || r === '十') fileKey = '10';
      else if (r === 'J' || r === '勾') fileKey = 'J';
      else if (r === 'Q' || r === '圈') fileKey = 'Q';
      else if (r === 'K' || r === '老K') fileKey = 'K';
      else if (r === 'A' || r === '尖') fileKey = 'A';
      return `/audio/pair_${fileKey}.mp3`;
    }

    // 三条扑克 100% 离线音频精准兜底
    const tripleMatch = clean.match(/^(?:三条|三个)\s*([2-9]|10|[JQKA]|二|三|四|五|六|七|八|九|十|勾|圈|老K|尖)$/i);
    if (tripleMatch) {
      const r = tripleMatch[1].toUpperCase();
      let fileKey = r;
      if (r === '2' || r === '二') fileKey = '2';
      else if (r === '3' || r === '三') fileKey = '3';
      else if (r === '4' || r === '四') fileKey = '4';
      else if (r === '5' || r === '五') fileKey = '5';
      else if (r === '6' || r === '六') fileKey = '6';
      else if (r === '7' || r === '七') fileKey = '7';
      else if (r === '8' || r === '八') fileKey = '8';
      else if (r === '9' || r === '九') fileKey = '9';
      else if (r === '10' || r === '十') fileKey = '10';
      else if (r === 'J' || r === '勾') fileKey = 'J';
      else if (r === 'Q' || r === '圈') fileKey = 'Q';
      else if (r === 'K' || r === '老K') fileKey = 'K';
      else if (r === 'A' || r === '尖') fileKey = 'A';
      return `/audio/triple_${fileKey}.mp3`;
    }

    // 2. 经典动作别名匹配
    if (clean.includes('自摸')) return '/audio/zimo.mp3';
    if (clean.includes('暗杠')) return '/audio/angang.mp3';
    if (clean.includes('补杠')) return '/audio/bugang.mp3';
    if (clean.includes('杠')) return '/audio/gang.mp3';
    if (clean.includes('碰')) return '/audio/peng.mp3';
    if (clean.includes('听牌')) return '/audio/ting.mp3';
    if (clean.includes('吃牌') || clean === '吃') return '/audio/chi.mp3';
    if (clean.includes('胡了') || clean.includes('胡牌')) return '/audio/hu.mp3';
    if (clean.includes('打和') || clean.includes('不分胜负') || clean.includes('势均力敌')) return '/audio/tie.mp3';
    if (clean.includes('定庄') || clean.includes('色子') || clean.includes('掷骰')) return '/audio/dingzhuang.mp3';
    if (clean.includes('全垒打')) return '/audio/grand_slam.mp3';
    if (clean.includes('打枪')) return '/audio/gunshot.mp3';
    if (clean.includes('倒水') || clean.includes('相公')) return '/audio/daoshui.mp3';
    if (clean.includes('强攻')) return '/audio/qianggong.mp3';
    if (clean.includes('投降') || clean.includes('认输')) return '/audio/surrender.mp3';
    if (clean.includes('报单')) return '/audio/baodan.mp3';
    if (clean.includes('绝大') || clean.includes('无人可压')) return '/audio/unbeatable.mp3';
    if (clean.includes('接风')) return '/audio/jiefeng.mp3';
    if (clean.includes('出清')) return '/audio/clean_out.mp3';
    if (clean.includes('同花顺')) return '/audio/same_suit_straight.mp3';
    if (clean.includes('四带一') || clean.includes('铁支')) return '/audio/four_with_one.mp3';
    if (clean.includes('俘虏') || clean.includes('葫芦')) return '/audio/fulu.mp3';
    if (clean.includes('顺子')) return '/audio/straight.mp3';
    if (clean.includes('同花')) return '/audio/flush.mp3';
    if (clean.includes('炸弹')) return '/audio/bomb.mp3';
    if (clean.includes('要不起') || clean.includes('不出')) return '/audio/yaobuqi.mp3';
    if (clean.includes('过')) return '/audio/pass.mp3';
    if (clean.includes('比水') || clean.includes('开牌')) return '/audio/shisanshui_compare.mp3';
    if (clean.includes('五同')) return '/audio/five_of_a_kind.mp3';
    if (clean.includes('青龙')) return '/audio/supreme_dragon.mp3';
    if (clean.includes('一条龙')) return '/audio/dragon.mp3';
    if (clean.includes('十二皇族')) return '/audio/supreme_dragon.mp3';
    if (clean.includes('三同花顺')) return '/audio/same_suit_straight.mp3';
    if (clean.includes('三铁支') || clean.includes('三分天下')) return '/audio/four_with_one.mp3';
    if (clean.includes('凑一色')) return '/audio/flush.mp3';
    if (clean.includes('全大') || clean.includes('全小')) return '/audio/high_card.mp3';
    if (clean.includes('五对三条')) return '/audio/triplet.mp3';
    if (clean.includes('三同花')) return '/audio/three_flushes.mp3';
    if (clean.includes('三顺子')) return '/audio/three_straights.mp3';
    if (clean.includes('六对半')) return '/audio/six_and_half_pairs.mp3';

    // 3. 麻将筒/饼兼容匹配 (如 "三筒" -> "三饼")
    if (/^[一二三四五六七八九]筒$/.test(clean)) {
      const mapped = clean.replace('筒', '饼');
      if (LOCAL_AUDIO_MAP[mapped]) return LOCAL_AUDIO_MAP[mapped];
    }

    // 4. 前缀或包含模糊匹配
    for (const [k, url] of Object.entries(LOCAL_AUDIO_MAP)) {
      if (
        clean === k ||
        clean.startsWith(k) ||
        k.startsWith(clean) ||
        (clean.length >= 4 && k.length >= 4 && (clean.includes(k) || k.includes(clean)))
      ) {
        return url;
      }
    }

    return null;
  }

  // Authentic Chinese Traditional Voice Pack (三大经典国粹：烟三、十三水、国标麻将)
  public speakAction(
    action:
      | 'yansan_lead'
      | 'spade_3'
      | 'spade_A'
      | 'unbeatable'
      | 'cards_short'
      | 'jiefeng'
      | 'clean_out'
      | 'qianggong'
      | 'surrender'
      | 'baodan'
      | 'baodan_self'
      | 'baodan_win'
      | 'baodan_pass'
      | 'pass'
      | 'yaobuqi'
      | 'bomb'
      | 'straight'
      | 'flush'
      | 'fulu'
      | 'four_with_one'
      | 'same_suit_straight'
      | 'triplet'
      | 'pairs'
      | 'peng'
      | 'gang'
      | 'angang'
      | 'bugang'
      | 'zimo'
      | 'hu'
      | 'ting'
      | 'chi'
      | 'dingzhuang'
      | 'gunshot'
      | 'grand_slam'
      | 'shisanshui_compare'
      | 'daoshui'
      | 'high_card'
      | 'two_pairs'
      | 'chongsan'
      | 'five_of_a_kind'
      | 'dragon'
      | 'supreme_dragon'
      | 'three_flushes'
      | 'three_straights'
      | 'six_and_half_pairs'
      | 'checkin'
      | 'win'
      | 'lose'
      | 'tie'
      | string,
    options?: { isFemale?: boolean; text?: string; pitch?: number; rate?: number }
  ) {
    if (!this.enabled || typeof window === 'undefined') return;
    if (this.isCardVoiceSuppressed()) return;

    // 彻底移除“大获全胜/旗开得胜”语音播报，获胜动作仅播放清脆胜利音效
    if (action === 'win') {
      this.playVictory();
      return;
    }

    const actionTextMap: Record<string, string[]> = {
      yansan_lead: ['方块四首出！开牌！', '方块四首发，开局！'],
      spade_3: ['黑桃三至尊！'],
      spade_A: ['黑桃尖！'],
      unbeatable: ['全场绝大，无人可压！', '绝对压制，继续出牌！', '通天大牌，连打！'],
      cards_short: ['对手张数不足，连出！', '对手张数不够，继续出牌！'],
      jiefeng: ['接风领出新牌！'],
      clean_out: ['率先出清，关门大吉！'],
      qianggong: ['开启强攻，独战全场！'],
      surrender: ['认输投降。'],
      baodan: ['报单！只剩最后一张牌！', '注意防守，有玩家报单！'],
      baodan_self: ['只剩最后一张牌！报单！'],
      baodan_win: ['报单绝杀，出清获胜！'],
      baodan_pass: ['报单要不起，过！'],
      pass: ['要不起。', '不出。', '过。'],
      yaobuqi: ['要不起。', '不出。'],
      bomb: ['炸弹！', '王牌炸弹！'],
      straight: ['顺子！'],
      flush: ['同花！'],
      fulu: ['俘虏葫芦！'],
      four_with_one: ['四带一！'],
      same_suit_straight: ['同花顺！'],
      triplet: ['三条！'],
      pairs: ['连对！'],
      gunshot: ['打枪！洞穿！'],
      grand_slam: ['全垒打！通关横扫！'],
      shisanshui_compare: ['开牌比水！'],
      daoshui: ['倒水相公！'],
      high_card: ['乌龙散牌。'],
      two_pairs: ['两对！'],
      chongsan: ['三条冲三！'],
      five_of_a_kind: ['至尊五同！'],
      dragon: ['一条龙！'],
      supreme_dragon: ['至尊青龙！'],
      three_flushes: ['三同花！'],
      three_straights: ['三顺子！'],
      six_and_half_pairs: ['六对半！'],
      peng: ['碰！', '这手我碰！'],
      gang: ['杠牌！', '开杠！'],
      angang: ['暗杠！'],
      bugang: ['补杠！'],
      zimo: ['自摸！胡了！', '自摸，胡牌！'],
      hu: ['胡牌！'],
      ting: ['听牌！'],
      chi: ['吃牌！'],
      dingzhuang: ['打色子定庄，开门取牌！'],
      checkin: ['恭喜领得开运金币！'],
      win: ['获胜！'],
      lose: ['这把大意了，下把一定赢回来！'],
      tie: ['势均力敌，打和不分胜负！'],
    };

    let textToSpeak = options?.text;
    if (!textToSpeak && actionTextMap[action]) {
      const candidates = actionTextMap[action];
      textToSpeak = candidates[Math.floor(Math.random() * candidates.length)];
    }
    if (!textToSpeak) {
      textToSpeak = formatChinesePokerSpeech(action);
    }

    // 严禁在自摸语音前额外增加“清一色”等修饰词，保证纯正地道自摸播报；同时严格实行3.5秒防抖，杜绝重复播放自摸语音
    if (textToSpeak && (action === 'zimo' || textToSpeak.includes('自摸'))) {
      textToSpeak = textToSpeak.replace(/^清一色[，,\s]*/, '').replace(/清一色自摸/, '自摸');
      const now = Date.now();
      if (now - this.lastZimoSpokenTime < 3500) {
        return;
      }
      this.lastZimoSpokenTime = now;
    }

    const isFemale = options?.isFemale ?? Math.random() > 0.5;
    const defaultPitch = isFemale ? 1.15 : 0.95;
    const pitch = options?.pitch ?? defaultPitch;
    const rate = options?.rate ?? 1.05;

    this.speakVoice(textToSpeak || action, pitch, rate, isFemale);
  }

  private ttsBufferCache = new Map<string, AudioBuffer>();
  private activeTtsSource: AudioBufferSourceNode | null = null;
  private activeAudioElement: HTMLAudioElement | null = null;
  private isPreloadingStarted = false;

  // 止住当前正在播报的语音 (避免多张牌播报重叠或滞后于出牌动作)
  public stopCurrentVoice() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (this.activeTtsSource) {
      try {
        this.activeTtsSource.stop();
        this.activeTtsSource.disconnect();
      } catch {}
      this.activeTtsSource = null;
    }
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
        this.activeAudioElement.currentTime = 0;
      } catch {}
      this.activeAudioElement = null;
    }
  }

  // Voice speech synthesis for poker phrases and announcements (100% 离线免翻墙·0ms 瞬间点播)
  public async speakVoice(text: string, pitch = 1.0, rate = 1.05, isFemale = false, isChatVoice = false) {
    if (!this.enabled || typeof window === 'undefined') return;
    if (this.isCardVoiceSuppressed() && !isChatVoice) return;
    const clean = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9，。！、？]/g, '').trim();
    if (!clean) return;

    // 彻底移除大获全胜/旗开得胜语音播报，坚决不播放
    if (clean.includes('大获全胜') || clean.includes('旗开得胜')) {
      return;
    }

    // 出牌瞬间立即停掉旧语音，确保语音播报与最新出牌动作 100% 同步！
    this.stopCurrentVoice();

    // 首次调用时在后台静默预热加载全部经典棋牌本地离线音频
    if (!this.isPreloadingStarted) {
      this.isPreloadingStarted = true;
      setTimeout(() => this.preloadCommonPhrases(), 200);
    }

    const ctx = this.getContext();

    // 1. 首要保障：检查本地 100% 离线预置音频库 (0 网络流量，即使断网或离线环境下也绝对 100% 瞬间响音！)
    const localAudioPath = this.findLocalAudioUrl(clean);
    if (localAudioPath) {
      const isShortcut = localAudioPath.includes('/shortcuts/');
      // 1a. 内存解压高速缓存命中 (0ms 瞬间点播)
      if (ctx && this.ttsBufferCache.has(localAudioPath)) {
        this.playBufferSource(this.ttsBufferCache.get(localAudioPath)!, pitch, rate, isFemale, isShortcut);
        return;
      }

      // 1b. 加载本地打包好的 static mp3 文件并解码入内存
      try {
        const fullLocalUrl = resolveApiUrl(localAudioPath);
        const res = await fetch(fullLocalUrl);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          if (ctx && arrayBuf.byteLength > 200) {
            ctx.decodeAudioData(
              arrayBuf,
              (decodedBuf) => {
                this.ttsBufferCache.set(localAudioPath, decodedBuf);
                this.playBufferSource(decodedBuf, pitch, rate, isFemale, isShortcut);
              },
              () => {
                this.playAudioDirect(fullLocalUrl);
              }
            );
            return;
          }
        }
      } catch {
        this.playAudioDirect(resolveApiUrl(localAudioPath));
        return;
      }
    }

    // 2. 检查内存缓存中是否存在已解码的动态文本
    if (ctx && this.ttsBufferCache.has(clean)) {
      this.playBufferSource(this.ttsBufferCache.get(clean)!, pitch, rate, isFemale);
      return;
    }

    // 多音字"单"纠偏：出牌语音"单张九"替换为"丹张九"，防止 Baidu TTS 与浏览器 SpeechSynthesis 误读为 "shàn"
    const ttsSpeechText = clean.replace(/单张/g, '丹张').replace(/^单([0-9一二三四五六七八九十勾圈老K尖A-Z])/g, '丹$1');

    // 3. 次选：动态长句子通过服务器 /api/tts 代理拉取
    try {
      const ttsUrl = resolveApiUrl(`/api/tts?text=${encodeURIComponent(ttsSpeechText)}&female=${isFemale ? 'true' : 'false'}`);
      const res = await fetch(ttsUrl, { headers: { 'Accept': 'audio/mpeg' } });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        if (ctx && arrayBuf.byteLength > 200) {
          ctx.decodeAudioData(
            arrayBuf,
            (decodedBuf) => {
              this.ttsBufferCache.set(clean, decodedBuf);
              this.playBufferSource(decodedBuf, pitch, rate, isFemale);
            },
            () => {
              this.playAudioDirect(ttsUrl);
            }
          );
          return;
        }
      }
    } catch (err) {
      console.warn('⚠️ [Audio Play Fallback]', err);
    }

    // 4. 离线/内网兜底：尝试浏览器原生 SpeechSynthesis 播报中文
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(ttsSpeechText);
        utter.lang = 'zh-CN';
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const zhVoices = voices.filter((v) => v.lang.startsWith('zh'));
          if (zhVoices.length > 0) {
            if (!isFemale) {
              const maleVoice = zhVoices.find((v) => /male|男|yunxi|yunjian|yunyang|kangkang/i.test(v.name));
              if (maleVoice) utter.voice = maleVoice;
            } else {
              const femaleVoice = zhVoices.find((v) => /female|女|xiaoxiao|yaoyao|huihui/i.test(v.name));
              if (femaleVoice) utter.voice = femaleVoice;
            }
          }
        }
        utter.pitch = pitch || (isFemale ? 1.05 : 0.85);
        utter.rate = rate || 1.02;
        window.speechSynthesis.speak(utter);
        return;
      } catch {}
    }

    // 5. 提示音兜底
    this.playSynthesizedToneFallback(clean, isFemale);
  }

  private playBufferSource(buffer: AudioBuffer, pitch: number, rate: number, isFemale: boolean, isShortcut = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    this.stopCurrentVoice();

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      // 离线快捷语音文件（大叔男声、老者男声、萝莉音等）均已预置精准声学生成，直接以 1.0 原汁原味速度播放
      const speed = isShortcut ? 1.0 : (rate || 1.05) * (isFemale ? 1.05 : 0.98);
      source.playbackRate.setValueAtTime(speed, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.95 * this.voiceVolume, ctx.currentTime);

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);

      this.activeTtsSource = source;
      source.onended = () => {
        if (this.activeTtsSource === source) {
          this.activeTtsSource = null;
        }
      };
    } catch {}
  }

  private playAudioDirect(url: string) {
    try {
      this.stopCurrentVoice();
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1, 0.95 * this.voiceVolume));
      this.activeAudioElement = audio;
      audio.play().catch(() => {});
    } catch {}
  }

  private playSynthesizedToneFallback(cleanText: string, isFemale = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const baseFreq = isFemale ? 520 : 380;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, now + 0.12);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 静默预加载全部经典棋牌离线语音，进入牌局后出牌 0ms 瞬间报牌
  public async preloadCommonPhrases() {
    if (typeof window === 'undefined') return;
    const ctx = this.getContext();

    // 收集所有唯一的本地音频静态文件路径
    const uniqueAudioUrls = Array.from(new Set(Object.values(LOCAL_AUDIO_MAP)));

    for (const audioPath of uniqueAudioUrls) {
      if (this.ttsBufferCache.has(audioPath)) continue;
      try {
        const fullUrl = resolveApiUrl(audioPath);
        const res = await fetch(fullUrl);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (ctx && buf.byteLength > 200) {
            ctx.decodeAudioData(buf, (decoded) => {
              this.ttsBufferCache.set(audioPath, decoded);
            });
          }
        }
      } catch {}
    }
  }

  private lastScoreSpokenTime = 0;

  // 输赢分专属语音播报 (仅玩家本地设备能够听到，精确播放用户要求的专属结算语音)
  public speakScoreResult(score: number, isWin: boolean, isTie = false) {
    if (!this.enabled || typeof window === 'undefined' || this.isCardVoiceSuppressed()) return;
    const now = Date.now();
    if (now - this.lastScoreSpokenTime < 2200) return;
    this.lastScoreSpokenTime = now;

    const absScore = Math.abs(Math.round(score));
    let phrase = '';
    if (isTie || (absScore === 0 && !isWin)) {
      phrase = '本局打和';
    } else if (isWin || score > 0) {
      phrase = `恭喜老板进账${absScore}分`;
    } else {
      phrase = `这把输了${absScore}分，下把赢回来`;
    }

    // 延时 1000ms 等待动作音效自然播放完毕，再播放输赢积分进账播报
    setTimeout(() => {
      this.speakVoice(phrase, isWin ? 1.05 : 0.98, 1.02);
    }, 1000);
  }
}

/**
 * 将各类扑克牌型及文字描述精准转换为原汁原味地道国粹真人语音播报文本
 */
export function formatChinesePokerSpeech(text: string): string {
  if (!text) return '';

  let s = text
    .replace(/×\s*\d+|\*\s*\d+/g, '')
    .replace(/[♠♥♣♦]/g, '')
    .replace(/单张/g, '丹张')
    .replace(/^单([0-9一二三四五六七八九十勾圈老K尖A-Z])/i, '丹$1')
    .trim();

  // 单点数到标准汉语扑克发音映射（A读尖，J读勾，Q读圈，10读十，2读二）
  const rankToZh = (r: string): string => {
    const clean = r.trim().toUpperCase();
    if (clean === '2' || clean === '二') return '二';
    if (clean === '3' || clean === '三') return '三';
    if (clean === '4' || clean === '四') return '四';
    if (clean === '5' || clean === '五') return '五';
    if (clean === '6' || clean === '六') return '六';
    if (clean === '7' || clean === '七') return '七';
    if (clean === '8' || clean === '八') return '八';
    if (clean === '9' || clean === '九') return '九';
    if (clean === '10' || clean === '十') return '十';
    if (clean === 'J' || clean === '勾') return '勾';
    if (clean === 'Q' || clean === '圈') return '圈';
    if (clean === 'K' || clean === '老K') return '老K';
    if (clean === 'A' || clean === '尖') return '尖';
    return clean;
  };

  // 1. 同花顺
  const sfMatch = s.match(/^同花顺\s*(.+)$/i);
  if (sfMatch) {
    return formatStraightSpeech(sfMatch[1], '同花顺');
  }

  // 2. 顺子
  const stMatch1 = s.match(/^(.+)顺子$/i);
  const stMatch2 = s.match(/^顺子\s*(.+)$/i);
  if (stMatch1 || stMatch2) {
    const seq = (stMatch1 ? stMatch1[1] : stMatch2![1]).trim();
    return formatStraightSpeech(seq, '顺子');
  }

  // 3. 俘虏 / 葫芦 / 三带二
  const fuluMatch = s.match(/^(?:俘虏|葫芦|三带二|三带对)\s*([0-9JQKA一二三四五六七八九十勾圈老K尖]+)\s*带\s*([0-9JQKA一二三四五六七八九十勾圈老K尖]+)$/i);
  if (fuluMatch) {
    const trip = rankToZh(fuluMatch[1]);
    const pair = rankToZh(fuluMatch[2]);
    return `三个${trip}带对${pair}`;
  }

  // 4. 四带一 / 铁支
  const quadMatch = s.match(/^(?:四带一|铁支|四条)\s*([0-9JQKA一二三四五六七八九十勾圈老K尖]+)$/i);
  if (quadMatch) {
    const rk = rankToZh(quadMatch[1]);
    return `四个${rk}带一张`;
  }

  // 5. 三条 / 三个
  const triMatch = s.match(/^(?:三条|三个)\s*([0-9JQKA一二三四五六七八九十勾圈老K尖]+)$/i);
  if (triMatch) {
    const rk = rankToZh(triMatch[1]);
    return `三个${rk}`;
  }

  // 6. 对子 / 对
  const pairMatch = s.match(/^(?:对子|对)\s*([0-9JQKA一二三四五六七八九十勾圈老K尖]+)对?$/i);
  if (pairMatch) {
    const rk = rankToZh(pairMatch[1]);
    return `对${rk}`;
  }

  // 7. 单张 (用单音同音字"丹"纠偏多音字"单"被 TTS 读成 shàn 的问题)
  const singleMatch = s.match(/^(?:单张|丹张|单|丹)\s*([0-9JQKA一二三四五六七八九十勾圈老K尖]+)$/i);
  if (singleMatch) {
    const rk = rankToZh(singleMatch[1]);
    return `丹张${rk}`;
  }

  // 8. 同花
  if (s.includes('同花')) {
    return s.replace(/单张/g, '丹张');
  }

  return s.replace(/单张/g, '丹张');
}

function formatStraightSpeech(seq: string, prefix: '顺子' | '同花顺'): string {
  const clean = seq.replace(/[\s,、\-_]/g, '').toUpperCase();
  if (clean === 'A2345' || clean === '2345A') {
    return prefix === '同花顺' ? '至尊同花顺，A到五' : '至尊顺子，A到五';
  }
  if (clean === '23456') return `${prefix}，二到六`;
  if (clean === '34567') return `${prefix}，三到七`;
  if (clean === '45678') return `${prefix}，四到八`;
  if (clean === '56789') return `${prefix}，五到九`;
  if (clean === '678910' || clean === '6789十') return `${prefix}，六到十`;
  if (clean === '78910J' || clean === '789十J') return `${prefix}，七到勾`;
  if (clean === '8910JQ' || clean === '89十JQ') return `${prefix}，八到圈`;
  if (clean === '910JQK' || clean === '9十JQK') return `${prefix}，九到K`;

  const chars = clean
    .split('')
    .map((c) => {
      if (c === '2') return '二';
      if (c === '3') return '三';
      if (c === '4') return '四';
      if (c === '5') return '五';
      if (c === '6') return '六';
      if (c === '7') return '七';
      if (c === '8') return '八';
      if (c === '9') return '九';
      if (c === '1' && clean.includes('10')) return '十';
      if (c === '0' && clean.includes('10')) return '';
      if (c === 'J') return '勾';
      if (c === 'Q') return '圈';
      if (c === 'K') return '老K';
      if (c === 'A') return '尖';
      return c;
    })
    .filter(Boolean);

  return `${prefix}，${chars.join('、')}`;
}

export const soundFX = new SoundEffects();
