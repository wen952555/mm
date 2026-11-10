/**
 * 十三张预约场 · 每日06:00结算火车车厢赛核心引擎 (Train Carriage Asynchronous Tournament Engine)
 *
 * 核心机制：
 * 1. 结算周期：每日凌晨 06:00 准时统一比水结算，倒计时实时展示
 * 2. 火车车厢：预约场为一列持续进阶的火车，每节车厢为一个场次（第1节车厢、第2节车厢...）
 * 3. 牌桌规制：每节车厢包含正好 10 张独立牌桌（第1桌 ~ 第10桌）
 *    - 四人场 (four-booking)：1 副扑克 (52张)，东南西北 4 份各 13 张手牌
 *    - 八人场 (eight-booking)：2 副扑克 (104张)，8 个方位各 13 张手牌
 * 4. 选位入席：玩家进入车厢后，首先选择该车厢的固定坐席方位（如四人场选择【东】，八人场选择8个方位之一）
 * 5. 乱序派牌：系统从该车厢 10 张牌桌中随机抽取一张未挑战牌桌的对应方位手牌分配给玩家理牌
 * 6. 连战封牌：理牌确认后封牌提交，玩家可继续挑战，系统乱序分配剩余牌桌中对应方位的手牌
 * 7. 车厢通关：完成该车厢全部 10 张牌桌的选定方位挑战后，完成该场次，可随时发车进入下一节车厢（第二场次）
 * 8. 结算比水：支持每日 06:00 统一结算比水，亦支持随时「提前模拟06:00比水测算」即时查看10桌战绩
 */

import {
  SSSCard,
  autoArrangeThirteen,
  compareTwoPlayers,
  detectSpecialHand,
  SpecialHandResult,
  ThirteenVersusResult,
} from './shisanshuiRules';

export interface Card {
  id: string;
  rank: number;
  suit: '♠' | '♥' | '♣' | '♦';
  label: string;
  isRed: boolean;
}

export type BookingSeat4 = '东' | '南' | '西' | '北';
export type BookingSeat8 = '东' | '东南' | '南' | '西南' | '西' | '西北' | '北' | '东北';
export type BookingSeat = BookingSeat4 | BookingSeat8;

export const SEATS_4: BookingSeat4[] = ['东', '南', '西', '北'];
export const SEATS_8: BookingSeat8[] = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'];

export const SEAT_DESCRIPTIONS: Record<string, { title: string; desc: string; icon: string }> = {
  东: { title: '东风破浪', desc: '紫气东来 · 祥瑞吉位', icon: '🌅' },
  南: { title: '南方离火', desc: '运筹帷幄 · 势不可挡', icon: '🔥' },
  西: { title: '西方金坚', desc: '坚如磐石 · 稳若泰山', icon: '⛰️' },
  北: { title: '北斗定鼎', desc: '谋定后动 · 掌控全局', icon: '⭐' },
  东南: { title: '东南巽风', desc: '风生水起 · 变幻莫测', icon: '🍃' },
  西南: { title: '西南坤厚', desc: '厚德载物 · 气定神闲', icon: '🍂' },
  西北: { title: '西北乾天', desc: '天行健毅 · 破军夺魁', icon: '⚡' },
  东北: { title: '东北艮山', desc: '山海潜龙 · 蓄势待发', icon: '🏔️' },
};

export interface SubmittedHandTiers {
  front: Card[];
  mid: Card[];
  back: Card[];
  frontLabel: string;
  midLabel: string;
  backLabel: string;
  specialHand?: SpecialHandResult | null;
}

export interface TableSettlementDetail {
  isSettled: boolean;
  totalWater: number;
  netScore: number;
  isGrandSlam: boolean;
  opponentsBreakdown: ThirteenVersusResult[];
  settledAt?: number;
}

export interface BookingTableState {
  tableIndex: number; // 1 to 10
  tableName: string; // e.g. "第 1 桌"
  isSubmitted: boolean;
  submittedAt?: number;
  playerSeat: string;
  playerHand?: SubmittedHandTiers;
  tableDeckSeed: string;
  seatCards: Record<string, Card[]>;
  settlement?: TableSettlementDetail;
}

export interface BookingCarriageState {
  carriageNumber: number; // 1, 2, 3...
  sceneMode: 'four-booking' | 'eight-booking';
  selectedSeat: string | null; // e.g. '东'
  tables: BookingTableState[]; // exactly 10 tables
  unplayedTableIndices: number[]; // remaining tables to play (1..10)
  currentActiveTableIndex: number | null; // currently selected table
  isCompleted: boolean; // all 10 tables submitted
  completedAt?: number;
}

export interface BookingSettlementRecord {
  id: string;
  dateStr: string;
  sceneMode: 'four-booking' | 'eight-booking';
  carriageNumber: number;
  settledTablesCount: number;
  totalWater: number;
  netScore: number;
  settledAt: number;
  isSimulation: boolean;
  tablesSummary: {
    tableIndex: number;
    playerSeat: string;
    totalWater: number;
    specialHandName?: string;
  }[];
}

export interface BookingTrainStorage {
  'four-booking': {
    currentCarriageNumber: number;
    carriages: Record<number, BookingCarriageState>;
  };
  'eight-booking': {
    currentCarriageNumber: number;
    carriages: Record<number, BookingCarriageState>;
  };
  settlementHistory: BookingSettlementRecord[];
}

const STORAGE_KEY = 'sss_booking_train_data_v1';

const SUITS: { suit: '♠' | '♥' | '♣' | '♦'; isRed: boolean }[] = [
  { suit: '♠', isRed: false },
  { suit: '♥', isRed: true },
  { suit: '♣', isRed: false },
  { suit: '♦', isRed: true },
];

const RANKS = [
  { rank: 2, label: '2' }, { rank: 3, label: '3' }, { rank: 4, label: '4' },
  { rank: 5, label: '5' }, { rank: 6, label: '6' }, { rank: 7, label: '7' },
  { rank: 8, label: '8' }, { rank: 9, label: '9' }, { rank: 10, label: '10' },
  { rank: 11, label: 'J' }, { rank: 12, label: 'Q' }, { rank: 13, label: 'K' },
  { rank: 14, label: 'A' },
];

function generateShuffledDeck(deckCount: number, seed: string): Card[] {
  const pool: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const r of RANKS) {
      for (const s of SUITS) {
        pool.push({
          id: `${r.label}-${s.suit}-${d}-${seed}`,
          rank: r.rank,
          suit: s.suit,
          label: r.label,
          isRed: s.isRed,
        });
      }
    }
  }

  // Pseudo-random Fisher-Yates shuffle seeded with table seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const seededRandom = () => {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    return hash / 4294967296;
  };

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

export function toSSSCard(c: Card): SSSCard {
  const suitMap: Record<string, number> = { '♠': 4, '♥': 3, '♣': 2, '♦': 1 };
  return {
    id: c.id,
    rank: c.rank,
    suitVal: suitMap[c.suit] || 1,
    label: c.label,
    suit: c.suit,
    isRed: c.isRed,
  };
}

function createTableState(tableIndex: number, sceneMode: 'four-booking' | 'eight-booking', carriageNum: number): BookingTableState {
  const isEight = sceneMode === 'eight-booking';
  const deckCount = isEight ? 2 : 1;
  const seats = isEight ? SEATS_8 : SEATS_4;
  const seed = `train-car${carriageNum}-tab${tableIndex}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const deck = generateShuffledDeck(deckCount, seed);

  const seatCards: Record<string, Card[]> = {};
  seats.forEach((seat, idx) => {
    seatCards[seat] = deck.slice(idx * 13, (idx + 1) * 13);
  });

  return {
    tableIndex,
    tableName: `第 ${tableIndex} 桌`,
    isSubmitted: false,
    playerSeat: '',
    tableDeckSeed: seed,
    seatCards,
  };
}

export function createCarriage(carriageNumber: number, sceneMode: 'four-booking' | 'eight-booking'): BookingCarriageState {
  const tables: BookingTableState[] = [];
  for (let i = 1; i <= 10; i++) {
    tables.push(createTableState(i, sceneMode, carriageNumber));
  }
  return {
    carriageNumber,
    sceneMode,
    selectedSeat: null,
    tables,
    unplayedTableIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    currentActiveTableIndex: null,
    isCompleted: false,
  };
}

export function loadTrainStorage(): BookingTrainStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed['four-booking'] && parsed['eight-booking']) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load booking train state:', e);
  }

  const initial: BookingTrainStorage = {
    'four-booking': {
      currentCarriageNumber: 1,
      carriages: {
        1: createCarriage(1, 'four-booking'),
      },
    },
    'eight-booking': {
      currentCarriageNumber: 1,
      carriages: {
        1: createCarriage(1, 'eight-booking'),
      },
    },
    settlementHistory: [],
  };
  saveTrainStorage(initial);
  return initial;
}

export function saveTrainStorage(data: BookingTrainStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save booking train state:', e);
  }
}

export function getCurrentCarriage(sceneMode: 'four-booking' | 'eight-booking'): BookingCarriageState {
  const storage = loadTrainStorage();
  const modeData = storage[sceneMode];
  let carriage = modeData.carriages[modeData.currentCarriageNumber];
  if (!carriage) {
    carriage = createCarriage(modeData.currentCarriageNumber, sceneMode);
    modeData.carriages[modeData.currentCarriageNumber] = carriage;
    saveTrainStorage(storage);
  }
  return carriage;
}

/**
 * 玩家选择车厢的固定坐席（如东位），并乱序抽取第一张未挑战的牌桌
 */
export function selectCarriageSeat(
  sceneMode: 'four-booking' | 'eight-booking',
  seat: BookingSeat
): { carriage: BookingCarriageState; activeTable: BookingTableState } {
  const storage = loadTrainStorage();
  const modeData = storage[sceneMode];
  const carriage = modeData.carriages[modeData.currentCarriageNumber];

  carriage.selectedSeat = seat;

  // 从未挑战的桌次列表中乱序抽取一张
  if (carriage.unplayedTableIndices.length > 0) {
    const randIdx = Math.floor(Math.random() * carriage.unplayedTableIndices.length);
    const chosenTableNum = carriage.unplayedTableIndices[randIdx];
    carriage.currentActiveTableIndex = chosenTableNum;
  } else {
    carriage.currentActiveTableIndex = null;
    carriage.isCompleted = true;
  }

  saveTrainStorage(storage);
  const activeTable = carriage.tables.find((t) => t.tableIndex === carriage.currentActiveTableIndex)!;
  return { carriage, activeTable };
}

/**
 * 乱序抽取当前车厢中下一张未挑战的牌桌
 */
export function pickNextRandomTable(
  sceneMode: 'four-booking' | 'eight-booking'
): { carriage: BookingCarriageState; activeTable: BookingTableState | null } {
  const storage = loadTrainStorage();
  const modeData = storage[sceneMode];
  const carriage = modeData.carriages[modeData.currentCarriageNumber];

  if (!carriage.selectedSeat) {
    return { carriage, activeTable: null };
  }

  if (carriage.unplayedTableIndices.length === 0) {
    carriage.currentActiveTableIndex = null;
    carriage.isCompleted = true;
    saveTrainStorage(storage);
    return { carriage, activeTable: null };
  }

  const randIdx = Math.floor(Math.random() * carriage.unplayedTableIndices.length);
  const chosenTableNum = carriage.unplayedTableIndices[randIdx];
  carriage.currentActiveTableIndex = chosenTableNum;

  saveTrainStorage(storage);
  const activeTable = carriage.tables.find((t) => t.tableIndex === chosenTableNum)!;
  return { carriage, activeTable };
}

/**
 * 提交并封存当前牌桌手牌
 */
export function submitCurrentTableHand(
  sceneMode: 'four-booking' | 'eight-booking',
  handTiers: SubmittedHandTiers
): {
  carriage: BookingCarriageState;
  submittedTable: BookingTableState;
  isCarriageCompleted: boolean;
  remainingTablesCount: number;
} {
  const storage = loadTrainStorage();
  const modeData = storage[sceneMode];
  const carriage = modeData.carriages[modeData.currentCarriageNumber];

  if (!carriage.currentActiveTableIndex) {
    throw new Error('当前没有正在挑战的牌桌');
  }

  const table = carriage.tables.find((t) => t.tableIndex === carriage.currentActiveTableIndex);
  if (!table) {
    throw new Error('未找到对应牌桌数据');
  }

  table.isSubmitted = true;
  table.submittedAt = Date.now();
  table.playerSeat = carriage.selectedSeat || '东';
  table.playerHand = handTiers;

  // 从未挑战列表中移除该牌桌
  carriage.unplayedTableIndices = carriage.unplayedTableIndices.filter(
    (idx) => idx !== carriage.currentActiveTableIndex
  );

  const isCarriageCompleted = carriage.unplayedTableIndices.length === 0;
  if (isCarriageCompleted) {
    carriage.isCompleted = true;
    carriage.completedAt = Date.now();
  }

  // 封盘提交后，重置当前活动桌号，等待玩家点击「继续挑战下一桌」
  carriage.currentActiveTableIndex = null;

  saveTrainStorage(storage);
  return {
    carriage,
    submittedTable: table,
    isCarriageCompleted,
    remainingTablesCount: carriage.unplayedTableIndices.length,
  };
}

/**
 * 推进至下一节车厢（下一场次）
 */
export function advanceToNextCarriage(
  sceneMode: 'four-booking' | 'eight-booking'
): BookingCarriageState {
  const storage = loadTrainStorage();
  const modeData = storage[sceneMode];

  const nextCarriageNum = modeData.currentCarriageNumber + 1;
  modeData.currentCarriageNumber = nextCarriageNum;

  const newCarriage = createCarriage(nextCarriageNum, sceneMode);
  modeData.carriages[nextCarriageNum] = newCarriage;

  saveTrainStorage(storage);
  return newCarriage;
}

/**
 * 计算距离每日凌晨 06:00 的结算倒计时
 */
export function calculateNext0600Countdown(): {
  hours: number;
  minutes: number;
  seconds: number;
  countdownText: string;
  next0600Timestamp: number;
  formattedTargetTime: string;
} {
  const now = new Date();
  const target = new Date(now);

  target.setHours(6, 0, 0, 0);

  // 如果当前时间已经过了今天早上 06:00，则目标结算时间为明天凌晨 06:00
  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const countdownText = `${pad(hours)}小时 ${pad(minutes)}分 ${pad(seconds)}秒`;
  const formattedTargetTime = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())} 06:00:00`;

  return {
    hours,
    minutes,
    seconds,
    countdownText,
    next0600Timestamp: target.getTime(),
    formattedTargetTime,
  };
}

/**
 * 比水结算一张牌桌（比对玩家提交手牌 vs 牌桌其余坐席预设手牌）
 */
export function settleSingleTable(
  table: BookingTableState,
  sceneMode: 'four-booking' | 'eight-booking'
): TableSettlementDetail {
  if (!table.isSubmitted || !table.playerHand) {
    return {
      isSettled: false,
      totalWater: 0,
      netScore: 0,
      isGrandSlam: false,
      opponentsBreakdown: [],
    };
  }

  const isEight = sceneMode === 'eight-booking';
  const allSeats = isEight ? SEATS_8 : SEATS_4;
  const otherSeats = allSeats.filter((s) => s !== table.playerSeat);

  const myHandSSS = {
    head: table.playerHand.front.map(toSSSCard),
    mid: table.playerHand.mid.map(toSSSCard),
    tail: table.playerHand.back.map(toSSSCard),
  };

  const breakdowns: ThirteenVersusResult[] = [];
  let totalWater = 0;
  let gunshotWinsCount = 0;

  otherSeats.forEach((seat, idx) => {
    const oppCards = table.seatCards[seat] || [];
    const oppCardsSSS = oppCards.map(toSSSCard);
    const oppArrangement = autoArrangeThirteen(oppCardsSSS, 'optimal');

    const vsResult = compareTwoPlayers(
      myHandSSS,
      {
        head: oppArrangement.head,
        mid: oppArrangement.mid,
        tail: oppArrangement.tail,
      },
      idx + 1,
      `【${seat}位】牌友`
    );

    breakdowns.push(vsResult);
    totalWater += vsResult.finalWater;
    if (vsResult.isShot && vsResult.finalWater > 0) {
      gunshotWinsCount++;
    }
  });

  const isGrandSlam = gunshotWinsCount === otherSeats.length && otherSeats.length > 0;
  if (isGrandSlam) {
    totalWater *= 2;
  }

  // 十三张一水即一分，净分与净水数 1:1 精确对应
  const netScore = totalWater;

  const result: TableSettlementDetail = {
    isSettled: true,
    totalWater,
    netScore,
    isGrandSlam,
    opponentsBreakdown: breakdowns,
    settledAt: Date.now(),
  };

  table.settlement = result;
  return result;
}

/**
 * 结算指定车厢所有已提交牌桌（每日 06:00 结算 或 玩家点击提前模拟测算）
 */
export function settleCarriageTables(
  sceneMode: 'four-booking' | 'eight-booking',
  carriageNumber?: number,
  isSimulation = false
): BookingSettlementRecord {
  const storage = loadTrainStorage();
  const modeData = storage[sceneMode];
  const targetCarriageNum = carriageNumber || modeData.currentCarriageNumber;
  const carriage = modeData.carriages[targetCarriageNum];

  if (!carriage) {
    throw new Error('未找到指定车厢');
  }

  const tablesSummary: BookingSettlementRecord['tablesSummary'] = [];
  let sumWater = 0;
  let sumScore = 0;
  let settledCount = 0;

  carriage.tables.forEach((table) => {
    if (table.isSubmitted && table.playerHand) {
      const detail = settleSingleTable(table, sceneMode);
      sumWater += detail.totalWater;
      sumScore += detail.netScore;
      settledCount++;
      tablesSummary.push({
        tableIndex: table.tableIndex,
        playerSeat: table.playerSeat,
        totalWater: detail.totalWater,
        specialHandName: table.playerHand.specialHand?.name,
      });
    }
  });

  const record: BookingSettlementRecord = {
    id: `settle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    dateStr: new Date().toLocaleDateString('zh-CN'),
    sceneMode,
    carriageNumber: targetCarriageNum,
    settledTablesCount: settledCount,
    totalWater: sumWater,
    netScore: sumScore,
    settledAt: Date.now(),
    isSimulation,
    tablesSummary,
  };

  if (!isSimulation) {
    storage.settlementHistory.unshift(record);
  }

  saveTrainStorage(storage);
  return record;
}

/**
 * 获取预约场全部车厢（含往期已归档车厢与当前出战车厢）
 */
export function getAllCarriages(sceneMode: 'four-booking' | 'eight-booking'): BookingCarriageState[] {
  const storage = loadTrainStorage();
  const modeData = storage[sceneMode];
  if (!modeData?.carriages) return [];
  return Object.values(modeData.carriages).sort((a, b) => b.carriageNumber - a.carriageNumber);
}

/**
 * 获取预约场历史 06:00 比水结算记录
 */
export function getBookingSettlementHistory(): BookingSettlementRecord[] {
  const storage = loadTrainStorage();
  return storage.settlementHistory || [];
}

/**
 * 自动检查并触发每日 06:00 比水结算
 */
export function checkAndAutoSettle0600(
  sceneMode: 'four-booking' | 'eight-booking'
): BookingSettlementRecord | null {
  const storage = loadTrainStorage();
  const modeData = storage[sceneMode];
  const carriage = modeData.carriages[modeData.currentCarriageNumber];

  if (!carriage) return null;

  const submittedTables = carriage.tables.filter((t) => t.isSubmitted);
  if (submittedTables.length === 0) return null;

  // 检查是否已经到达或过了今天 06:00，且尚未自动结算
  const now = new Date();
  const today0600 = new Date(now);
  today0600.setHours(6, 0, 0, 0);

  const hasUnsettled = submittedTables.some((t) => !t.settlement?.isSettled);
  if (now.getTime() >= today0600.getTime() && hasUnsettled) {
    return settleCarriageTables(sceneMode, carriage.carriageNumber, false);
  }

  return null;
}
