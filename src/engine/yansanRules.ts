/**
 * YanSan (Four Players Poker Classic) Rules Engine
 * 52 cards (no Jokers), 13 cards per player
 * Diamond 4 (♦4) starts first and must be played on the first trick.
 * Ranking: 3 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4
 * Suits: ♠ > ♥ > ♣ > ♦
 * Allowed Combos: Single, Pair, Triple, Straight (no 10JQKA), Fulu, Four-With-One, Straight Flush.
 * No pure 4-card bomb, no pure flush, free pass (no must-beat), no top-defense required.
 * Qiang Gong returns played cards to hand (no redeal) and resets lead to Diamond 4.
 */

export interface YansanCard {
  id: string;
  rank: number; // 3..15 (15=2, 14=A, 13=K... 3=3)
  suitVal: number; // 4=♠, 3=♥, 2=♣, 1=♦
  label: string;
  suit: '♠' | '♥' | '♣' | '♦';
  isRed: boolean;
}

export type YansanComboType = 'single' | 'pair' | 'triplet' | '5_card';

export interface YansanCombo {
  type: YansanComboType;
  comboTier?: number; // 1=Straight, 2=Flush, 3=Fulu, 4=Four-With-One, 5=Straight Flush
  rank: number;
  suitVal?: number;
  length?: number;
  cards: YansanCard[];
  seat?: number;
  label?: string;
}

export function getYansanRankLabel(rank: number): string {
  if (rank === 15) return '2';
  if (rank === 14) return 'A';
  if (rank === 13) return 'K';
  if (rank === 12) return 'Q';
  if (rank === 11) return 'J';
  return String(rank);
}

export function getYansanComboLabel(combo: YansanCombo): string {
  const rLabel = getYansanRankLabel(combo.rank);
  if (combo.type === 'single') return `单张 ${combo.cards[0]?.suit || ''}${rLabel}`;
  if (combo.type === 'pair') return `对 ${rLabel}`;
  if (combo.type === 'triplet') return `三条 ${rLabel}`;
  if (combo.type === '5_card') {
    if (combo.comboTier === 5) return `同花顺 (${rLabel})`;
    if (combo.comboTier === 4) return `四带一 (${rLabel})`;
    if (combo.comboTier === 3) return `俘虏/葫芦 (${rLabel})`;
    if (combo.comboTier === 2) return `同花 (${combo.cards[0]?.suit || ''}${rLabel})`;
    return `顺子 (至${rLabel})`;
  }
  return combo.label || '组合牌';
}

export function getYansanRankWeight(rank: number): number {
  if (rank === 3) return 13;
  if (rank === 15) return 12; // 2
  if (rank === 14) return 11; // A
  if (rank === 13) return 10; // K
  if (rank === 12) return 9;  // Q
  if (rank === 11) return 8;  // J
  if (rank === 10) return 7;  // 10
  if (rank === 9) return 6;   // 9
  if (rank === 8) return 5;   // 8
  if (rank === 7) return 4;   // 7
  if (rank === 6) return 3;   // 6
  if (rank === 5) return 2;   // 5
  if (rank === 4) return 1;   // 4
  return 0;
}

export function getYansanCardPower(c: YansanCard): number {
  return getYansanRankWeight(c.rank) * 10 + c.suitVal;
}

export function parseYansanCombo(cards: YansanCard[]): YansanCombo | null {
  if (!cards || cards.length === 0) return null;
  const count = cards.length;
  const sorted = [...cards].sort((a, b) => getYansanCardPower(b) - getYansanCardPower(a));

  const rankCounts = new Map<number, number>();
  for (const c of sorted) {
    rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1);
  }
  const entries = Array.from(rankCounts.entries());

  let result: YansanCombo | null = null;

  if (count === 1) {
    result = { type: 'single', rank: sorted[0].rank, suitVal: sorted[0].suitVal, cards: sorted };
  } else if (count === 2 && entries.length === 1) {
    const highestSuit = Math.max(...sorted.map((c) => c.suitVal));
    result = { type: 'pair', rank: entries[0][0], suitVal: highestSuit, cards: sorted };
  } else if (count === 3 && entries.length === 1) {
    result = { type: 'triplet', rank: entries[0][0], cards: sorted };
  } else if (count === 5) {
    const isFlush = sorted.every((c) => c.suit === sorted[0].suit);
    const ranks = sorted.map((c) => c.rank).sort((a, b) => a - b);
    
    let isNormalSeq = true;
    for (let i = 1; i < 5; i++) {
      if (ranks[i] !== ranks[i - 1] + 1) {
        isNormalSeq = false;
        break;
      }
    }
    if (ranks.includes(15)) isNormalSeq = false;
    const isA2345 = ranks[0] === 3 && ranks[1] === 4 && ranks[2] === 5 && ranks[3] === 14 && ranks[4] === 15;
    const is10JQKA = ranks[0] === 10 && ranks[1] === 11 && ranks[2] === 12 && ranks[3] === 13 && ranks[4] === 14;
    const isLegalStraight = (isNormalSeq || isA2345) && !is10JQKA;

    // ① 同花顺 (Tier 5)：同花色且构成合法顺子 (允许A2345/34567，不可出10JQKA)
    if (isFlush && isLegalStraight) {
      const maxCard = sorted[0];
      result = { type: '5_card', comboTier: 5, rank: maxCard.rank, suitVal: sorted[0].suitVal, cards: sorted };
    } else if (entries.some(([, cnt]) => cnt === 4)) {
      // ② 四带一 (Tier 4)：4张相同点数 + 任意1张单牌
      const fourRank = entries.find(([, cnt]) => cnt === 4)![0];
      result = { type: '5_card', comboTier: 4, rank: fourRank, cards: sorted };
    } else if (entries.some(([, cnt]) => cnt === 3) && entries.length === 2) {
      // ③ 俘虏 (Tier 3)：3张同点 + 1对子 (三带一对 / 葫芦)
      const threeRank = entries.find(([, cnt]) => cnt === 3)![0];
      result = { type: '5_card', comboTier: 3, rank: threeRank, cards: sorted };
    } else if (isFlush) {
      // ④ 同花 (Tier 2)：5张同花色牌
      const maxCard = sorted[0];
      result = { type: '5_card', comboTier: 2, rank: maxCard.rank, suitVal: sorted[0].suitVal, cards: sorted };
    } else if (isLegalStraight) {
      // ⑤ 顺子 (Tier 1)：5张相连
      const maxCard = sorted[0];
      result = { type: '5_card', comboTier: 1, rank: maxCard.rank, suitVal: maxCard.suitVal, cards: sorted };
    }
  }

  if (result) {
    result.label = getYansanComboLabel(result);
  }
  return result;
}

export function canBeatYansanCombo(candidate: YansanCombo, target: YansanCombo | null): boolean {
  if (!target) return true;
  if (candidate.type !== target.type) return false;

  if (candidate.type === 'single' || candidate.type === 'pair') {
    const candRW = getYansanRankWeight(candidate.rank);
    const targetRW = getYansanRankWeight(target.rank);
    if (candRW !== targetRW) return candRW > targetRW;
    return (candidate.suitVal || 0) > (target.suitVal || 0);
  }

  if (candidate.type === 'triplet') {
    return getYansanRankWeight(candidate.rank) > getYansanRankWeight(target.rank);
  }

  if (candidate.type === '5_card') {
    const candTier = candidate.comboTier || 1;
    const targTier = target.comboTier || 1;
    if (candTier !== targTier) return candTier > targTier;

    // 同花顺 (Tier 5) 或 同花 (Tier 2)：先比花色(♠>♥>♣>♦)，相同花色比单张最大牌
    if (candTier === 5 || candTier === 2) {
      const candSuit = candidate.suitVal || 0;
      const targSuit = target.suitVal || 0;
      if (candSuit !== targSuit) return candSuit > targSuit;
      const candRW = getYansanRankWeight(candidate.rank);
      const targRW = getYansanRankWeight(target.rank);
      return candRW > targRW;
    }

    // 四带一 (Tier 4) 或 俘虏 (Tier 3)：比主牌点数权重
    if (candTier === 4 || candTier === 3) {
      return getYansanRankWeight(candidate.rank) > getYansanRankWeight(target.rank);
    }

    // 顺子 (Tier 1)：比单张最大的牌（先比点数权重，相同比花色）
    if (candTier === 1) {
      const candRW = getYansanRankWeight(candidate.rank);
      const targRW = getYansanRankWeight(target.rank);
      if (candRW !== targRW) return candRW > targRW;
      return (candidate.suitVal || 0) > (target.suitVal || 0);
    }
  }

  return false;
}

export interface YansanSeatBelief {
  seat: number;
  relation: 'confirmed_ally' | 'suspected_ally' | 'unknown' | 'suspected_enemy' | 'confirmed_enemy' | 'solo_enemy';
  score: number; // -1.0 (certain enemy) to +1.0 (certain ally)
  confidence: number; // 0.0 to 1.0
  isConfirmed: boolean;
  reason: string;
  hasSpade3: boolean;
  hasSpadeA: boolean;
  playedCardsCount: number;
  remainingCardsCount: number;
}

export interface YansanPlayRecord {
  seat: number;
  cards: YansanCard[];
  combo: YansanCombo | null;
  targetCombo: YansanCombo | null;
  isPass: boolean;
  actionSeq?: number;
  timestamp?: number;
}

export interface YansanAllianceInference {
  observerSeat: number;
  spade3Seat: number | null;
  spadeASeat: number | null;
  isSolo: boolean;
  soloSeat: number | null;
  beliefs: [YansanSeatBelief, YansanSeatBelief, YansanSeatBelief, YansanSeatBelief];
}

export interface YansanAIPlayResult {
  cards: YansanCard[] | null;
  thought: string;
  tacticalIntent: 'win_clear' | 'feed_ally' | 'cover_ally' | 'yield_ally' | 'block_enemy' | 'counter_enemy' | 'dump_combo' | 'lead_singleton' | 'strategic_pass' | 'first_turn_d4';
  deducedAlliances: YansanSeatBelief[];
}

export interface YansanAIContext {
  isFirstTurn?: boolean;
  seat?: number;
  teammateSeat?: number;
  handsCount?: number[];
  isTeammateTarget?: boolean;
  seatPlayedCards?: YansanCard[][];
  playHistory?: YansanPlayRecord[];
  isQiangGong?: boolean;
  qiangGongSeat?: number | null;
  downstreamSeat?: number;
  lastTargetSeat?: number;
}

/**
 * 基于出牌历史与行为深度推算各席位的敌友身份 (Alliance Inference Engine)
 * 核心逻辑：
 * 1. 铁证推导：黑桃3/黑桃A公开打出，或自身手牌持有时确立阵营
 * 2. 行为推断：
 *    - 进攻压制 (Attack)：对特定玩家的高频拦截，指示敌对关系
 *    - 战术让行 (Yield/Pass)：在特定玩家控盘时主动过牌，指示同盟掩护
 *    - 残局助攻 (Feeding)：在特定玩家报单(剩1~2张)时送出小单牌，极大概率是盟友
 *    - 残局封杀 (Blocking)：在特定玩家报单时顶大牌或变型组合封杀，必定是敌对
 */
export function inferYansanAlliances(
  observerSeat: number,
  observerHand: YansanCard[],
  seatPlayedCards: YansanCard[][] = [[], [], [], []],
  playHistory: YansanPlayRecord[] = [],
  handsCount: number[] = [13, 13, 13, 13],
  isQiangGong: boolean = false,
  qiangGongSeat: number | null = null
): YansanAllianceInference {
  const seatNames = ['本家', '西席', '北席', '东席'];

  // 1. 检查各家公开打出的牌中是否已出现 ♠3 或 ♠A
  let publicSpade3Seat: number | null = null;
  let publicSpadeASeat: number | null = null;

  for (let s = 0; s < 4; s++) {
    const played = seatPlayedCards[s] || [];
    if (played.some((c) => c.rank === 3 && c.suit === '♠')) publicSpade3Seat = s;
    if (played.some((c) => c.rank === 14 && c.suit === '♠')) publicSpadeASeat = s;
  }

  // 2. 检查出牌者自身的暗牌与打出的牌 (Observer Private Knowledge)
  const myCardsAll = [...(observerHand || []), ...(seatPlayedCards[observerSeat] || [])];
  const observerHasSpade3 = myCardsAll.some((c) => c.rank === 3 && c.suit === '♠');
  const observerHasSpadeA = myCardsAll.some((c) => c.rank === 14 && c.suit === '♠');

  const knownSpade3Seat = observerHasSpade3 ? observerSeat : publicSpade3Seat;
  const knownSpadeASeat = observerHasSpadeA ? observerSeat : publicSpadeASeat;

  // 3. 强攻特判：如果有人宣告强攻，强攻者与全场为敌，其余三人结盟
  if (isQiangGong && qiangGongSeat !== null) {
    const isObserverSolo = observerSeat === qiangGongSeat;
    const beliefs: YansanSeatBelief[] = [];

    for (let s = 0; s < 4; s++) {
      if (s === observerSeat) {
        beliefs.push({
          seat: s,
          relation: 'confirmed_ally',
          score: 1.0,
          confidence: 1.0,
          isConfirmed: true,
          reason: isObserverSolo ? '自身开启强攻，独战全场' : '自身为平民反抗防守阵营',
          hasSpade3: s === qiangGongSeat,
          hasSpadeA: s === qiangGongSeat,
          playedCardsCount: (seatPlayedCards[s] || []).length,
          remainingCardsCount: handsCount[s] || 0,
        });
      } else if (isObserverSolo) {
        beliefs.push({
          seat: s,
          relation: 'solo_enemy',
          score: -1.0,
          confidence: 1.0,
          isConfirmed: true,
          reason: `${seatNames[s]} 属于联合防守敌方`,
          hasSpade3: false,
          hasSpadeA: false,
          playedCardsCount: (seatPlayedCards[s] || []).length,
          remainingCardsCount: handsCount[s] || 0,
        });
      } else {
        const isEnemy = s === qiangGongSeat;
        beliefs.push({
          seat: s,
          relation: isEnemy ? 'solo_enemy' : 'confirmed_ally',
          score: isEnemy ? -1.0 : 1.0,
          confidence: 1.0,
          isConfirmed: true,
          reason: isEnemy ? `【${seatNames[s]}】开启强攻，全场公敌` : `【${seatNames[s]}】同为防守反击同盟`,
          hasSpade3: isEnemy,
          hasSpadeA: isEnemy,
          playedCardsCount: (seatPlayedCards[s] || []).length,
          remainingCardsCount: handsCount[s] || 0,
        });
      }
    }

    return {
      observerSeat,
      spade3Seat: qiangGongSeat,
      spadeASeat: qiangGongSeat,
      isSolo: true,
      soloSeat: qiangGongSeat,
      beliefs: beliefs as [YansanSeatBelief, YansanSeatBelief, YansanSeatBelief, YansanSeatBelief],
    };
  }

  // 4. 自身同时持 ♠3 和 ♠A (未开强攻独战)
  if (observerHasSpade3 && observerHasSpadeA) {
    const beliefs: YansanSeatBelief[] = [];
    for (let s = 0; s < 4; s++) {
      if (s === observerSeat) {
        beliefs.push({
          seat: s,
          relation: 'confirmed_ally',
          score: 1.0,
          confidence: 1.0,
          isConfirmed: true,
          reason: '自身独占♠3与♠A，以一敌三',
          hasSpade3: true,
          hasSpadeA: true,
          playedCardsCount: (seatPlayedCards[s] || []).length,
          remainingCardsCount: handsCount[s] || 0,
        });
      } else {
        beliefs.push({
          seat: s,
          relation: 'confirmed_enemy',
          score: -1.0,
          confidence: 1.0,
          isConfirmed: true,
          reason: `${seatNames[s]} 属于平民三人同盟，敌对目标`,
          hasSpade3: false,
          hasSpadeA: false,
          playedCardsCount: (seatPlayedCards[s] || []).length,
          remainingCardsCount: handsCount[s] || 0,
        });
      }
    }
    return {
      observerSeat,
      spade3Seat: observerSeat,
      spadeASeat: observerSeat,
      isSolo: true,
      soloSeat: observerSeat,
      beliefs: beliefs as [YansanSeatBelief, YansanSeatBelief, YansanSeatBelief, YansanSeatBelief],
    };
  }

  // 5. 统计历史攻击与助攻行为
  // hostility[A][B]: A 主动顶压 B 的次数/强度
  // support[A][B]: A 主动给 B 让行或送牌的次数/强度
  const hostilityMatrix = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const supportMatrix = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  for (const record of playHistory) {
    if (record.isPass) {
      if (record.targetCombo && record.targetCombo.seat !== undefined && record.targetCombo.seat !== record.seat) {
        const targetSeat = record.targetCombo.seat;
        // 如果目标牌只是较小的牌(如单张<=8或对子<=7)，该玩家过牌，显示出对目标席位的友好/让行倾向
        const isSmallTarget =
          (record.targetCombo.type === 'single' && getYansanRankWeight(record.targetCombo.rank) <= 6) ||
          (record.targetCombo.type === 'pair' && getYansanRankWeight(record.targetCombo.rank) <= 5);
        if (isSmallTarget) {
          supportMatrix[record.seat][targetSeat] += 1.5;
        } else {
          supportMatrix[record.seat][targetSeat] += 0.5;
        }
      }
    } else if (record.combo && record.targetCombo && record.targetCombo.seat !== undefined) {
      const targetSeat = record.targetCombo.seat;
      if (targetSeat !== record.seat) {
        // 主动压制：用较大牌型或大牌拦截
        const isBigAttack =
          getYansanRankWeight(record.combo.rank) >= 10 ||
          (record.combo.comboTier || 1) >= 2 ||
          record.combo.type === '5_card';
        // 如果被压制的人手牌较少(<=3张)，这种拦截极其致命，敌对倾向拉满
        const isTargetLowHand = (handsCount[targetSeat] || 10) <= 3;
        const hostilityAdd = isTargetLowHand ? 3.0 : isBigAttack ? 2.0 : 1.0;
        hostilityMatrix[record.seat][targetSeat] += hostilityAdd;
      }
    } else if (record.combo && !record.targetCombo) {
      // 领出牌：若某玩家仅剩1张牌，出牌者领出一张小单张(<=7)，极大可能是给下家/盟友喂牌！
      for (let s = 0; s < 4; s++) {
        if (s !== record.seat && (handsCount[s] || 10) === 1) {
          if (record.combo.type === 'single' && getYansanRankWeight(record.combo.rank) <= 5) {
            supportMatrix[record.seat][s] += 3.5;
          } else {
            // 出组合牌或顶大牌，封死报单玩家
            hostilityMatrix[record.seat][s] += 3.0;
          }
        }
      }
    }
  }

  // 6. 综合判定各席位阵营
  const beliefs: YansanSeatBelief[] = [];

  // 判断是否黑桃同盟已完全揭晓
  const isBothSpadesPublic = publicSpade3Seat !== null && publicSpadeASeat !== null;
  const isSoloPublic = isBothSpadesPublic && publicSpade3Seat === publicSpadeASeat;

  for (let s = 0; s < 4; s++) {
    if (s === observerSeat) {
      beliefs.push({
        seat: s,
        relation: 'confirmed_ally',
        score: 1.0,
        confidence: 1.0,
        isConfirmed: true,
        reason: observerHasSpade3 || observerHasSpadeA ? '自身属于黑桃同盟' : '自身属于平民同盟',
        hasSpade3: observerHasSpade3,
        hasSpadeA: observerHasSpadeA,
        playedCardsCount: (seatPlayedCards[s] || []).length,
        remainingCardsCount: handsCount[s] || 0,
      });
      continue;
    }

    const hasPSpade3 = publicSpade3Seat === s;
    const hasPSpadeA = publicSpadeASeat === s;

    // 情况 A：全场黑桃双牌已公开
    if (isBothSpadesPublic) {
      if (isSoloPublic) {
        const isSolo = s === publicSpade3Seat;
        beliefs.push({
          seat: s,
          relation: isSolo ? 'solo_enemy' : 'confirmed_ally',
          score: isSolo ? -1.0 : 1.0,
          confidence: 1.0,
          isConfirmed: true,
          reason: isSolo ? `【${seatNames[s]}】独揽♠3与♠A，以一敌三之公敌` : `【${seatNames[s]}】同为平民防守同盟`,
          hasSpade3: hasPSpade3,
          hasSpadeA: hasPSpadeA,
          playedCardsCount: (seatPlayedCards[s] || []).length,
          remainingCardsCount: handsCount[s] || 0,
        });
      } else {
        const isSpade = s === publicSpade3Seat || s === publicSpadeASeat;
        const observerIsSpade = observerHasSpade3 || observerHasSpadeA;
        const isAlly = isSpade === observerIsSpade;
        beliefs.push({
          seat: s,
          relation: isAlly ? 'confirmed_ally' : 'confirmed_enemy',
          score: isAlly ? 1.0 : -1.0,
          confidence: 1.0,
          isConfirmed: true,
          reason: isSpade
            ? `【${seatNames[s]}】打出${hasPSpade3 ? '♠3' : '♠A'}，确定为黑桃阵营`
            : `【${seatNames[s]}】未持黑桃双牌，确定为平民阵营`,
          hasSpade3: hasPSpade3,
          hasSpadeA: hasPSpadeA,
          playedCardsCount: (seatPlayedCards[s] || []).length,
          remainingCardsCount: handsCount[s] || 0,
        });
      }
      continue;
    }

    // 情况 B：出牌者属于黑桃阵营 (持♠3或♠A，需找出另一位黑桃盟友)
    if (observerHasSpade3 || observerHasSpadeA) {
      const partnerCardName = observerHasSpade3 ? '♠A' : '♠3';
      const hasPartnerCard = observerHasSpade3 ? hasPSpadeA : hasPSpade3;

      if (hasPartnerCard) {
        // 盟友已现身！
        beliefs.push({
          seat: s,
          relation: 'confirmed_ally',
          score: 1.0,
          confidence: 1.0,
          isConfirmed: true,
          reason: `【${seatNames[s]}】已打出${partnerCardName}，确认为同舟共济之黑桃盟友！`,
          hasSpade3: hasPSpade3,
          hasSpadeA: hasPSpadeA,
          playedCardsCount: (seatPlayedCards[s] || []).length,
          remainingCardsCount: handsCount[s] || 0,
        });
      } else {
        // 盟友尚未公开，通过历史配合与攻击推测
        const supportFromS = supportMatrix[s][observerSeat];
        const attackFromS = hostilityMatrix[s][observerSeat];
        const netAttitude = supportFromS - attackFromS;

        if (netAttitude >= 2.0) {
          beliefs.push({
            seat: s,
            relation: 'suspected_ally',
            score: 0.65,
            confidence: 0.7,
            isConfirmed: false,
            reason: `【${seatNames[s]}】多次主动让行并配合出牌，高度疑似持有${partnerCardName}的同盟`,
            hasSpade3: false,
            hasSpadeA: false,
            playedCardsCount: (seatPlayedCards[s] || []).length,
            remainingCardsCount: handsCount[s] || 0,
          });
        } else if (netAttitude <= -2.0) {
          beliefs.push({
            seat: s,
            relation: 'suspected_enemy',
            score: -0.75,
            confidence: 0.75,
            isConfirmed: false,
            reason: `【${seatNames[s]}】多次猛烈顶压进攻，判定为敌对平民`,
            hasSpade3: false,
            hasSpadeA: false,
            playedCardsCount: (seatPlayedCards[s] || []).length,
            remainingCardsCount: handsCount[s] || 0,
          });
        } else {
          beliefs.push({
            seat: s,
            relation: 'unknown',
            score: 0.0,
            confidence: 0.3,
            isConfirmed: false,
            reason: `【${seatNames[s]}】出牌克制，暗中试探阵营归属`,
            hasSpade3: false,
            hasSpadeA: false,
            playedCardsCount: (seatPlayedCards[s] || []).length,
            remainingCardsCount: handsCount[s] || 0,
          });
        }
      }
      continue;
    }

    // 情况 C：出牌者属于平民同盟 (手牌既无♠3也无♠A)
    // 需识别哪两位是黑桃敌人，哪一位是自己的平民盟友
    const isKnownSpade = hasPSpade3 || hasPSpadeA;
    if (isKnownSpade) {
      beliefs.push({
        seat: s,
        relation: 'confirmed_enemy',
        score: -1.0,
        confidence: 1.0,
        isConfirmed: true,
        reason: `【${seatNames[s]}】已亮明${hasPSpade3 ? '♠3' : '♠A'}，确定为黑桃敌对势力！`,
        hasSpade3: hasPSpade3,
        hasSpadeA: hasPSpadeA,
        playedCardsCount: (seatPlayedCards[s] || []).length,
        remainingCardsCount: handsCount[s] || 0,
      });
    } else {
      // 通过对已知黑桃的攻击态度推测
      let attacksOnSpade = 0;
      let supportsSpade = 0;

      if (knownSpade3Seat !== null) {
        attacksOnSpade += hostilityMatrix[s][knownSpade3Seat];
        supportsSpade += supportMatrix[s][knownSpade3Seat];
      }
      if (knownSpadeASeat !== null) {
        attacksOnSpade += hostilityMatrix[s][knownSpadeASeat];
        supportsSpade += supportMatrix[s][knownSpadeASeat];
      }

      const myAttitude = supportMatrix[s][observerSeat] - hostilityMatrix[s][observerSeat];

      if (attacksOnSpade >= 2.0 || myAttitude >= 2.0) {
        beliefs.push({
          seat: s,
          relation: 'suspected_ally',
          score: 0.7,
          confidence: 0.72,
          isConfirmed: false,
          reason: `【${seatNames[s]}】坚决顶压黑桃领牌并与本方协同，判定为同道平民盟友`,
          hasSpade3: false,
          hasSpadeA: false,
          playedCardsCount: (seatPlayedCards[s] || []).length,
          remainingCardsCount: handsCount[s] || 0,
        });
      } else if (supportsSpade >= 2.0 || myAttitude <= -2.0) {
        beliefs.push({
          seat: s,
          relation: 'suspected_enemy',
          score: -0.7,
          confidence: 0.7,
          isConfirmed: false,
          reason: `【${seatNames[s]}】处处庇护黑桃首出，高度疑似黑桃暗合隐蔽盟友`,
          hasSpade3: false,
          hasSpadeA: false,
          playedCardsCount: (seatPlayedCards[s] || []).length,
          remainingCardsCount: handsCount[s] || 0,
        });
      } else {
        beliefs.push({
          seat: s,
          relation: 'unknown',
          score: 0.0,
          confidence: 0.25,
          isConfirmed: false,
          reason: `【${seatNames[s]}】局势未明，正在通过走牌轨迹研判身份`,
          hasSpade3: false,
          hasSpadeA: false,
          playedCardsCount: (seatPlayedCards[s] || []).length,
          remainingCardsCount: handsCount[s] || 0,
        });
      }
    }
  }

  return {
    observerSeat,
    spade3Seat: knownSpade3Seat,
    spadeASeat: knownSpadeASeat,
    isSolo: isSoloPublic || (observerHasSpade3 && observerHasSpadeA),
    soloSeat: isSoloPublic ? publicSpade3Seat : observerHasSpade3 && observerHasSpadeA ? observerSeat : null,
    beliefs: beliefs as [YansanSeatBelief, YansanSeatBelief, YansanSeatBelief, YansanSeatBelief],
  };
}

export interface YansanDecomposedHand {
  straightFlushes: YansanCard[][];
  fourOnes: YansanCard[][];
  fulus: YansanCard[][];
  flushes: YansanCard[][];
  straights: YansanCard[][];
  triplets: YansanCard[][];
  pairs: YansanCard[][];
  pureSingletons: YansanCard[];
  all5CardCombos: YansanCard[][];
}

/**
 * 智能手牌结构分解：保护顺子、同花、俘虏等整牌，提炼出真正无依无靠的散张 (Pure Singletons)
 */
export function decomposeYansanHand(cards: YansanCard[]): YansanDecomposedHand {
  const sorted = [...cards].sort((a, b) => getYansanCardPower(a) - getYansanCardPower(b));
  const rankGroups = new Map<number, YansanCard[]>();
  const suitGroups = new Map<string, YansanCard[]>();

  for (const c of sorted) {
    if (!rankGroups.has(c.rank)) rankGroups.set(c.rank, []);
    rankGroups.get(c.rank)!.push(c);
    if (!suitGroups.has(c.suit)) suitGroups.set(c.suit, []);
    suitGroups.get(c.suit)!.push(c);
  }

  const sortedRanks = Array.from(rankGroups.keys()).sort(
    (a, b) => getYansanRankWeight(a) - getYansanRankWeight(b)
  );

  const straightFlushes: YansanCard[][] = [];
  const fourOnes: YansanCard[][] = [];
  const fulus: YansanCard[][] = [];
  const flushes: YansanCard[][] = [];
  const straights: YansanCard[][] = [];

  // ① 提取顺子
  const uniqueRanks = Array.from(new Set(sorted.map((c) => c.rank))).sort((a, b) => a - b);
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    const sub = uniqueRanks.slice(i, i + 5);
    let isSeq = true;
    for (let j = 1; j < 5; j++) {
      if (sub[j] !== sub[j - 1] + 1) {
        isSeq = false;
        break;
      }
    }
    const is10JQKA = sub[0] === 10 && sub[4] === 14;
    if (isSeq && !is10JQKA) {
      const combo = sub.map((r) => sorted.find((c) => c.rank === r)!);
      const parsed = parseYansanCombo(combo);
      if (parsed && parsed.comboTier === 1) straights.push(combo);
    }
  }
  if ([3, 4, 5, 14, 15].every((r) => uniqueRanks.includes(r))) {
    const combo = [3, 4, 5, 14, 15].map((r) => sorted.find((c) => c.rank === r)!);
    const parsed = parseYansanCombo(combo);
    if (parsed && parsed.comboTier === 1) straights.push(combo);
  }

  // ② 提取同花与同花顺
  for (const group of suitGroups.values()) {
    if (group.length >= 5) {
      const sSorted = [...group].sort((a, b) => getYansanCardPower(a) - getYansanCardPower(b));
      for (let i = 0; i <= sSorted.length - 5; i++) {
        const sub = sSorted.slice(i, i + 5);
        const parsed = parseYansanCombo(sub);
        if (parsed) {
          if (parsed.comboTier === 5) straightFlushes.push(sub);
          else if (parsed.comboTier === 2) flushes.push(sub);
        }
      }
    }
  }

  // ③ 提取俘虏 (葫芦)
  const triplesList = sortedRanks.filter((rk) => rankGroups.get(rk)!.length >= 3);
  const pairsList = sortedRanks.filter((rk) => rankGroups.get(rk)!.length >= 2);
  for (const tRk of triplesList) {
    for (const pRk of pairsList) {
      if (tRk !== pRk) {
        const fh = [...rankGroups.get(tRk)!.slice(0, 3), ...rankGroups.get(pRk)!.slice(0, 2)];
        const parsed = parseYansanCombo(fh);
        if (parsed && parsed.comboTier === 3) fulus.push(fh);
      }
    }
  }

  // ④ 提取四带一
  const fourRanks = sortedRanks.filter((rk) => rankGroups.get(rk)!.length === 4);
  for (const fRk of fourRanks) {
    const kicker = sorted.find((c) => c.rank !== fRk);
    if (kicker) {
      const fo = [...rankGroups.get(fRk)!, kicker];
      const parsed = parseYansanCombo(fo);
      if (parsed && parsed.comboTier === 4) fourOnes.push(fo);
    }
  }

  const all5CardCombos = [...straightFlushes, ...fourOnes, ...fulus, ...flushes, ...straights];

  // ⑤ 提取三条
  const triplets: YansanCard[][] = [];
  for (const rk of sortedRanks) {
    const grp = rankGroups.get(rk)!;
    if (grp.length === 3) triplets.push(grp);
  }

  // ⑥ 提取对子
  const pairs: YansanCard[][] = [];
  for (const rk of sortedRanks) {
    const grp = rankGroups.get(rk)!;
    if (grp.length === 2) pairs.push(grp);
  }

  // ⑦ 提取纯散牌 (不属于任何顺子、三条、对子的真正孤牌)
  const lockedIn5s = new Set<string>();
  for (const c5 of all5CardCombos) {
    for (const c of c5) lockedIn5s.add(c.id);
  }

  const pureSingletons = sorted.filter((c) => {
    const rkCount = rankGroups.get(c.rank)!.length;
    // 点数只出现1次，且尽量避开优质5张套牌核心骨干
    if (rkCount === 1) {
      return !lockedIn5s.has(c.id);
    }
    return false;
  });

  return {
    straightFlushes,
    fourOnes,
    fulus,
    flushes,
    straights,
    triplets,
    pairs,
    pureSingletons: pureSingletons.length > 0 ? pureSingletons : sorted.filter((c) => rankGroups.get(c.rank)!.length === 1),
    all5CardCombos,
  };
}

/**
 * 终局神级连发推算器：推算手牌中是否存在“全场绝大牌 + 剩余唯一套牌”的100%连击必胜序列
 */
export function findYansanWinningSequence(
  hand: YansanCard[],
  availablePool: YansanCard[],
  maxOpponentHandSize: number
): YansanCard[] | null {
  if (!hand || hand.length === 0) return null;
  const sorted = [...hand].sort((a, b) => getYansanCardPower(a) - getYansanCardPower(b));

  const instant = parseYansanCombo(sorted);
  if (instant) return sorted; // 一手刷清

  if (sorted.length > 10) return null; // 手牌过多时不浪费算力

  const decomp = decomposeYansanHand(sorted);
  const candidateCombos: YansanCard[][] = [
    ...decomp.all5CardCombos,
    ...decomp.triplets,
    ...decomp.pairs,
    ...sorted.map((c) => [c]),
  ];

  for (const comboCards of candidateCombos) {
    const parsed = parseYansanCombo(comboCards);
    if (!parsed) continue;

    // 该组合是否在全场公开未出牌池中绝对无任何对手要得起？
    if (isYansanComboDeductivelyUnbeatable(parsed, availablePool, maxOpponentHandSize)) {
      const remainingHand = sorted.filter((c) => !comboCards.some((cc) => cc.id === c.id));
      if (remainingHand.length === 0) return comboCards;

      const remParsed = parseYansanCombo(remainingHand);
      if (remParsed) {
        // 发现神级必胜连击！先出絶大牌 Combo，取得绝对牌权，再出 Remaining，100%必胜！
        return comboCards;
      }
    }
  }

  return null;
}

/**
 * 增强型高智能 AI 决策中枢 (Smart AI Play Engine)
 * 能够依据出牌推断身份，执行保送盟友、封杀敌人、保护整牌、顶大牌与精准助攻
 */
export function getYansanSmartAIPlay(
  hand: YansanCard[],
  target: YansanCombo | null,
  ctx: YansanAIContext = {}
): YansanAIPlayResult {
  const seat = ctx.seat !== undefined ? ctx.seat : 0;
  const handsCount = ctx.handsCount || [13, 13, 13, 13];
  const sorted = [...hand].sort((a, b) => getYansanCardPower(a) - getYansanCardPower(b));
  const isFirstTurn = !!ctx.isFirstTurn;

  // 1. 推断当前各玩家阵营与敌友置信度
  const inference = inferYansanAlliances(
    seat,
    hand,
    ctx.seatPlayedCards || [[], [], [], []],
    ctx.playHistory || [],
    handsCount,
    ctx.isQiangGong || false,
    ctx.qiangGongSeat ?? null
  );

  const beliefs = inference.beliefs;
  const myBelief = beliefs[seat];

  // 找到最可靠盟友与最危险敌人
  let allySeat: number | null = null;
  let maxAllyScore = 0.3;
  let mostHostileEnemySeat: number | null = null;
  let minEnemyScore = -0.3;

  for (let s = 0; s < 4; s++) {
    if (s === seat) continue;
    if (beliefs[s].score > maxAllyScore) {
      maxAllyScore = beliefs[s].score;
      allySeat = s;
    }
    if (beliefs[s].score < minEnemyScore) {
      minEnemyScore = beliefs[s].score;
      mostHostileEnemySeat = s;
    }
  }

  const downstream = (seat - 1 + 4) % 4; // 逆时针下家
  const isDownstreamEnemy = beliefs[downstream].score < -0.2;
  const isDownstreamAlly = beliefs[downstream].score > 0.4;

  const decomp = decomposeYansanHand(sorted);

  // -------------------------------------------------------------------------
  // 终局一击：若一手牌直接合法且能管上/领出，直接走完获胜！
  // -------------------------------------------------------------------------
  const instantCombo = parseYansanCombo(sorted);
  if (instantCombo) {
    if (isFirstTurn) {
      if (sorted.some((c) => c.rank === 4 && c.suit === '♦')) {
        return {
          cards: sorted,
          thought: '手牌完美成型，首出直接打出整套牌型一击清空获胜！',
          tacticalIntent: 'win_clear',
          deducedAlliances: beliefs,
        };
      }
    } else if (!target || canBeatYansanCombo(instantCombo, target)) {
      return {
        cards: sorted,
        thought: '手牌一次性出清！直接终局获胜！',
        tacticalIntent: 'win_clear',
        deducedAlliances: beliefs,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 领出阶段 (Lead: 当桌面无目标牌时自由领出)
  // -------------------------------------------------------------------------
  if (!target) {
    // 0. 推断全场公开未出牌池 (availablePool) 与必胜连发策略
    const playedCardIds = new Set<string>();
    if (ctx.seatPlayedCards) {
      for (const pList of ctx.seatPlayedCards) {
        if (pList) for (const c of pList) playedCardIds.add(c.id);
      }
    }
    for (const c of hand) playedCardIds.add(c.id);

    const allSuits: ('♠' | '♥' | '♣' | '♦')[] = ['♠', '♥', '♣', '♦'];
    const availablePool: YansanCard[] = [];
    for (let r = 3; r <= 15; r++) {
      for (let s = 1; s <= 4; s++) {
        const suitStr = allSuits[s - 1];
        const cardId = `yansan-${r}-${s}`;
        if (!playedCardIds.has(cardId)) {
          availablePool.push({
            id: cardId,
            rank: r,
            suitVal: s,
            label: `${suitStr}${getYansanRankLabel(r)}`,
            suit: suitStr,
            isRed: suitStr === '♥' || suitStr === '♦',
          });
        }
      }
    }

    let maxOpponentHandSize = 0;
    for (let s = 0; s < 4; s++) {
      if (s !== seat && (handsCount[s] || 0) > maxOpponentHandSize) {
        maxOpponentHandSize = handsCount[s] || 0;
      }
    }

    // 0a. 神级必胜连发算力 (Master Winning Sequence Solver)
    const winSeqCombo = findYansanWinningSequence(sorted, availablePool, maxOpponentHandSize);
    if (winSeqCombo) {
      const p = parseYansanCombo(winSeqCombo);
      return {
        cards: winSeqCombo,
        thought: `【神级必胜连发】推算出【${p?.label || '绝大牌'}】全场无任何人要得起，先手打出拿盘，后续直接连击清盘获胜！`,
        tacticalIntent: 'win_clear',
        deducedAlliances: beliefs,
      };
    }

    // 1. 首出必须带方块4 (♦4)
    if (isFirstTurn) {
      const diamond4 = sorted.find((c) => c.rank === 4 && c.suit === '♦');
      if (diamond4) {
        // 策略A：如果有带♦4的顺子，优先出顺子一下子出5张
        for (const st of decomp.straights) {
          if (st.some((c) => c.id === diamond4.id)) {
            return {
              cards: st,
              thought: '首出方块4，顺势甩出5张连贯顺子占尽先机',
              tacticalIntent: 'first_turn_d4',
              deducedAlliances: beliefs,
            };
          }
        }
        // 策略B：如果有4的对子或三条
        const fours = sorted.filter((c) => c.rank === 4);
        if (fours.length >= 2) {
          return {
            cards: fours.length >= 3 ? fours.slice(0, 3) : fours,
            thought: `首出方块4，出对4/三条4起步`,
            tacticalIntent: 'first_turn_d4',
            deducedAlliances: beliefs,
          };
        }
        // 策略C：单出方块4
        return {
          cards: [diamond4],
          thought: '首出打出底牌方块4试探全局',
          tacticalIntent: 'first_turn_d4',
          deducedAlliances: beliefs,
        };
      }
    }

    // 2. 盟友报单助攻 (Ally Feeding)
    if (allySeat !== null && handsCount[allySeat] === 1) {
      // 盟友只剩最后1张牌！果断送一张全场最小的单牌，保送盟友头游获胜！
      const lowestCard = sorted[0];
      return {
        cards: [lowestCard],
        thought: `【精准助攻】推断【${['本家', '西席', '北席', '东席'][allySeat]}】为己方同盟且已报单，送出底牌${lowestCard.label}保送头游出清！`,
        tacticalIntent: 'feed_ally',
        deducedAlliances: beliefs,
      };
    }

    if (allySeat !== null && handsCount[allySeat] === 2) {
      // 盟友剩2张牌，若我们有低阶对子，出对子协助盟友跑牌
      if (decomp.pairs.length > 0) {
        const lowPair = decomp.pairs[0];
        if (getYansanRankWeight(lowPair[0].rank) <= 8) {
          return {
            cards: lowPair,
            thought: `【配合同盟】盟友手牌仅剩2张，打出对${lowPair[0].label}协助盟友出清对子`,
            tacticalIntent: 'feed_ally',
            deducedAlliances: beliefs,
          };
        }
      }
    }

    // 3. 敌方报单封杀 (Enemy Threat Suppression)
    let enemySingleThreat = false;
    let enemyPairThreat = false;
    for (let s = 0; s < 4; s++) {
      if (s !== seat && beliefs[s].score <= -0.1) {
        if (handsCount[s] === 1) enemySingleThreat = true;
        if (handsCount[s] === 2) enemyPairThreat = true;
      }
    }

    if (enemySingleThreat) {
      // 铁律：敌方报单时，绝对禁止出小单牌！
      // 优先打 5张组合、三条、对子，让只有1张牌的敌人彻底无法出手！
      if (decomp.all5CardCombos.length > 0) {
        const c5 = decomp.all5CardCombos[0];
        return {
          cards: c5,
          thought: `【防敌报单】检测到敌方报单仅剩1张牌，果断出5张组合封死敌方！`,
          tacticalIntent: 'block_enemy',
          deducedAlliances: beliefs,
        };
      }
      if (decomp.triplets.length > 0) {
        return {
          cards: decomp.triplets[0],
          thought: `【防敌报单】出三条封杀，不给报单敌方任何过牌机会`,
          tacticalIntent: 'block_enemy',
          deducedAlliances: beliefs,
        };
      }
      if (decomp.pairs.length > 0) {
        return {
          cards: decomp.pairs[0],
          thought: `【防敌报单】出对子阻断单张，严防报单敌方走脱`,
          tacticalIntent: 'block_enemy',
          deducedAlliances: beliefs,
        };
      }
      // 若万不得已只有单张，必须顶全场最大的单牌压死！
      const highestCard = sorted[sorted.length - 1];
      return {
        cards: [highestCard],
        thought: `【顶大牌控场】只有单牌可出，打出最大牌${highestCard.label}强力顶死报单敌方`,
        tacticalIntent: 'block_enemy',
        deducedAlliances: beliefs,
      };
    }

    if (enemyPairThreat) {
      // 敌方剩2张，切忌乱出小对子！
      if (decomp.all5CardCombos.length > 0) {
        return {
          cards: decomp.all5CardCombos[0],
          thought: `【残局防守】敌方仅余2张牌，出5张组合拆解敌方可能持有的对子`,
          tacticalIntent: 'block_enemy',
          deducedAlliances: beliefs,
        };
      }
      // 优先出单张破坏敌方对子结构
      if (decomp.pureSingletons.length > 0) {
        return {
          cards: [decomp.pureSingletons[0]],
          thought: `【拆解对子】出孤张单牌，逼迫持2张牌的敌方拆牌`,
          tacticalIntent: 'lead_singleton',
          deducedAlliances: beliefs,
        };
      }
    }

    // 4. 常规领牌中局策略
    // ① 优先甩 5 张牌组合 (同花顺、四带一、俘虏、同花、顺子) —— 一口气出5张大幅减牌！
    if (decomp.all5CardCombos.length > 0) {
      return {
        cards: decomp.all5CardCombos[0],
        thought: '中局先手，甩出5张组合大幅削减手牌负担',
        tacticalIntent: 'dump_combo',
        deducedAlliances: beliefs,
      };
    }

    // ② 甩三条
    if (decomp.triplets.length > 0) {
      return {
        cards: decomp.triplets[0],
        thought: '出三条掌握主导权并压制对手',
        tacticalIntent: 'dump_combo',
        deducedAlliances: beliefs,
      };
    }

    // ③ 甩对子
    if (decomp.pairs.length > 0) {
      return {
        cards: decomp.pairs[0],
        thought: '打出对子消耗对手牌力',
        tacticalIntent: 'dump_combo',
        deducedAlliances: beliefs,
      };
    }

    // ④ 针对下家位置：若下家是盟友，优先送散张
    if (isDownstreamAlly && decomp.pureSingletons.length > 0) {
      return {
        cards: [decomp.pureSingletons[0]],
        thought: `下家为盟友，送出散张${decomp.pureSingletons[0].label}安全移交牌权`,
        tacticalIntent: 'feed_ally',
        deducedAlliances: beliefs,
      };
    }

    // ⑤ 甩纯散张
    if (decomp.pureSingletons.length > 0) {
      return {
        cards: [decomp.pureSingletons[0]],
        thought: `打出孤张${decomp.pureSingletons[0].label}，保护连贯整牌`,
        tacticalIntent: 'lead_singleton',
        deducedAlliances: beliefs,
      };
    }

    // ⑥ 兜底出最小手牌
    return {
      cards: [sorted[0]],
      thought: `从容出单张${sorted[0].label}`,
      tacticalIntent: 'lead_singleton',
      deducedAlliances: beliefs,
    };
  }

  // -------------------------------------------------------------------------
  // 跟牌阶段 (Follow: 目标牌型在桌)
  // -------------------------------------------------------------------------
  const targetSeat = target.seat !== undefined ? target.seat : (seat + 1) % 4;
  const isTargetFromAlly = beliefs[targetSeat].score >= 0.4;
  const isTargetFromEnemy = beliefs[targetSeat].score <= -0.2;

  // 1. 盟友出牌保送与让行原则
  if (isTargetFromAlly) {
    const isTargetStrong =
      (target.type === 'single' && getYansanRankWeight(target.rank) >= 10) ||
      (target.type === 'pair' && getYansanRankWeight(target.rank) >= 9) ||
      (target.type === 'triplet') ||
      (target.type === '5_card' && (target.comboTier || 1) >= 2);

    // 如果盟友的牌已经很大，或者盟友手牌很少(<=3张)，果断让行！
    if (isTargetStrong || handsCount[targetSeat] <= 3) {
      return {
        cards: null,
        thought: `【盟友让行】桌面牌由盟友【${['本家', '西席', '北席', '东席'][targetSeat]}】掌控，主动过牌保送盟友连击！`,
        tacticalIntent: 'yield_ally',
        deducedAlliances: beliefs,
      };
    }

    // 如果盟友打出的是较弱的牌，但后续敌人还没过牌，且我方有中档牌可以替盟友顶起
    // 否则过牌保全自身实力
    const cand = findMinimumEffectiveBeat(sorted, target, decomp);
    if (cand && getYansanRankWeight(cand[0].rank) <= 10 && Math.random() < 0.6) {
      return {
        cards: cand,
        thought: `【接风护航】盟友小牌处于险境，替盟友接风顶起牌局防范敌人`,
        tacticalIntent: 'cover_ally',
        deducedAlliances: beliefs,
      };
    }

    return {
      cards: null,
      thought: `【让牌配合】盟友出牌，保留自身大牌以待决战`,
      tacticalIntent: 'yield_ally',
      deducedAlliances: beliefs,
    };
  }

  // 2. 对手出牌拦截 (Enemy Interception)
  const enemyCardCount = handsCount[targetSeat] || 10;
  const isEnemyDesperate = enemyCardCount <= 3;

  // 寻找最小能管上的牌型，兼顾流畅度与强力阻截
  const winningPlay = findMinimumEffectiveBeat(sorted, target, decomp, isEnemyDesperate);

  if (winningPlay) {
    const playCombo = parseYansanCombo(winningPlay)!;
    // 只有绝对大牌(2或黑桃3)且处于局中手牌丰富时才考虑战术隐忍；对敌方告急或双煞绝对不隐忍
    const isTrueSupreme = playCombo.rank === 3 && playCombo.suitVal === 4; // 黑桃3
    const isEarlyGame = sorted.length >= 8;

    if (isTrueSupreme && isEarlyGame && !isEnemyDesperate && !isTargetFromEnemy) {
      return {
        cards: null,
        thought: `【战术隐忍】保留黑桃3终极大杀器，伺机一击必杀`,
        tacticalIntent: 'strategic_pass',
        deducedAlliances: beliefs,
      };
    }

    return {
      cards: winningPlay,
      thought: isEnemyDesperate
        ? `【绝境封锁】敌方手牌告急，果断动用重牌强力拦截阻断敌方！`
        : `【精准拦截】打出${playCombo.label}管上对手，夺回牌桌主导权`,
      tacticalIntent: isEnemyDesperate ? 'block_enemy' : 'counter_enemy',
      deducedAlliances: beliefs,
    };
  }

  // 确实要不起
  return {
    cards: null,
    thought: '牌力不济，暂时过牌以逸待劳',
    tacticalIntent: 'strategic_pass',
    deducedAlliances: beliefs,
  };
}

/**
 * 寻找最小能管上目标的合法组合，兼顾牌型保护与适度拆牌打压
 */
function findMinimumEffectiveBeat(
  hand: YansanCard[],
  target: YansanCombo,
  decomp: YansanDecomposedHand,
  isEmergency: boolean = false
): YansanCard[] | null {
  const sorted = [...hand].sort((a, b) => getYansanCardPower(a) - getYansanCardPower(b));
  const rankGroups = new Map<number, YansanCard[]>();
  for (const c of sorted) {
    if (!rankGroups.has(c.rank)) rankGroups.set(c.rank, []);
    rankGroups.get(c.rank)!.push(c);
  }

  // 1. 单张管牌
  if (target.type === 'single') {
    const targetRW = getYansanRankWeight(target.rank);

    // ① 优先从纯散牌中找能管上的最小单张
    for (const c of decomp.pureSingletons) {
      const cand = parseYansanCombo([c]);
      if (cand && canBeatYansanCombo(cand, target)) {
        // 高牌保护原则：若目标只是小单牌(<=10)，且敌人并未告急，不轻易交出 Ace/2/♠3 顶级控场大牌！
        const isControlCard = c.rank >= 14 || (c.rank === 3 && c.suitVal === 4);
        if (isControlCard && targetRW <= 7 && !isEmergency && sorted.length > 3) {
          continue;
        }
        return [c];
      }
    }

    // ② 从所有独立单张中找 (count === 1)
    for (const c of sorted) {
      if (rankGroups.get(c.rank)!.length === 1) {
        const cand = parseYansanCombo([c]);
        if (cand && canBeatYansanCombo(cand, target)) {
          const isControlCard = c.rank >= 14 || (c.rank === 3 && c.suitVal === 4);
          if (isControlCard && targetRW <= 7 && !isEmergency && sorted.length > 3) {
            continue;
          }
          return [c];
        }
      }
    }

    // ③ 从 3 张或 4 张相同点数的组里拆出 1 张 (损失小)
    for (const c of sorted) {
      if (rankGroups.get(c.rank)!.length >= 3) {
        const cand = parseYansanCombo([c]);
        if (cand && canBeatYansanCombo(cand, target)) {
          return [c];
        }
      }
    }

    // ④ 拆对子（最后手段）：只有在目标是大牌/敌方告急/或手牌非常少时，才允许拆小对子！
    const pairCount = Array.from(rankGroups.values()).filter((g) => g.length === 2).length;
    const isTargetHigh = targetRW >= 8;
    if (isEmergency || sorted.length <= 4 || (isTargetHigh && pairCount >= 2)) {
      for (const c of sorted) {
        // 绝不拆对2/对A/黑桃3
        const isHighPair = c.rank >= 14 || (c.rank === 3 && c.suitVal === 4);
        if (isHighPair && !isEmergency && sorted.length > 3) continue;

        const cand = parseYansanCombo([c]);
        if (cand && canBeatYansanCombo(cand, target)) {
          return [c];
        }
      }
    }
    return null;
  }

  // 2. 对子管牌
  if (target.type === 'pair') {
    const targetRW = getYansanRankWeight(target.rank);

    // ① 纯对子
    for (const p of decomp.pairs) {
      const cand = parseYansanCombo(p);
      if (cand && canBeatYansanCombo(cand, target)) {
        const isControlPair = p[0].rank >= 14;
        if (isControlPair && targetRW <= 5 && !isEmergency && sorted.length > 4) {
          continue;
        }
        return p;
      }
    }

    // ② 拆三条的对子
    for (const t of decomp.triplets) {
      const subPair = t.slice(0, 2);
      const cand = parseYansanCombo(subPair);
      if (cand && canBeatYansanCombo(cand, target)) {
        return subPair;
      }
    }

    // ③ 拆多于2张的组 (最后手段，排除高位对子)
    if (isEmergency || sorted.length <= 4) {
      for (const grp of rankGroups.values()) {
        if (grp.length >= 2) {
          const subPair = grp.slice(0, 2);
          const cand = parseYansanCombo(subPair);
          if (cand && canBeatYansanCombo(cand, target)) {
            return subPair;
          }
        }
      }
    }
    return null;
  }

  // 3. 三条管牌
  if (target.type === 'triplet') {
    for (const t of decomp.triplets) {
      const cand = parseYansanCombo(t);
      if (cand && canBeatYansanCombo(cand, target)) {
        return t;
      }
    }
    for (const grp of rankGroups.values()) {
      if (grp.length >= 3) {
        const sub = grp.slice(0, 3);
        const cand = parseYansanCombo(sub);
        if (cand && canBeatYansanCombo(cand, target)) {
          return sub;
        }
      }
    }
    return null;
  }

  // 4. 5张牌型管牌
  if (target.type === '5_card') {
    const winning5s: YansanCard[][] = [];
    for (const c5 of decomp.all5CardCombos) {
      const cand = parseYansanCombo(c5);
      if (cand && canBeatYansanCombo(cand, target)) {
        winning5s.push(c5);
      }
    }
    if (winning5s.length > 0) {
      winning5s.sort((a, b) => {
        const ca = parseYansanCombo(a)!;
        const cb = parseYansanCombo(b)!;
        return (
          (ca.comboTier || 1) - (cb.comboTier || 1) ||
          getYansanRankWeight(ca.rank) - getYansanRankWeight(cb.rank)
        );
      });
    }
  }

  // 5. 紧急高阶 5 张牌型压制：若常规牌型未能管上，且敌方处于告急状态(<=2张)或目标牌为大牌(>=Q)，动用四带一/同花顺阻截！
  if (isEmergency || (target && getYansanRankWeight(target.rank) >= 11)) {
    if (decomp.all5CardCombos.length > 0) {
      for (const c5 of decomp.all5CardCombos) {
        const cand = parseYansanCombo(c5);
        if (cand && (target.type !== '5_card' || (cand.comboTier || 1) > (target.comboTier || 1))) {
          return c5;
        }
      }
    }
  }

  return null;
}

export function getYansanAIPlay(
  hand: YansanCard[],
  target: YansanCombo | null,
  isFirstTurnOrContext: boolean | YansanAIContext = false
): YansanCard[] | null {
  if (!hand || hand.length === 0) return null;
  const ctx: YansanAIContext =
    typeof isFirstTurnOrContext === 'boolean'
      ? { isFirstTurn: isFirstTurnOrContext }
      : isFirstTurnOrContext;

  const result = getYansanSmartAIPlay(hand, target, ctx);
  return result.cards;
}

/**
 * 判定某一特定玩家手牌中是否存在任何合法牌型能够压制目标 target 牌型
 */
export function canHandBeatYansanCombo(hand: YansanCard[], target: YansanCombo): boolean {
  if (!hand || hand.length === 0 || !target) return false;

  // 1. 单张
  if (target.type === 'single') {
    const sortedDesc = [...hand].sort((a, b) => getYansanCardPower(b) - getYansanCardPower(a));
    const maxCard = sortedDesc[0];
    const cand = parseYansanCombo([maxCard]);
    return !!(cand && canBeatYansanCombo(cand, target));
  }

  // 2. 对子
  if (target.type === 'pair') {
    if (hand.length < 2) return false;
    const rankMap = new Map<number, YansanCard[]>();
    for (const c of hand) {
      if (!rankMap.has(c.rank)) rankMap.set(c.rank, []);
      rankMap.get(c.rank)!.push(c);
    }
    for (const grp of rankMap.values()) {
      if (grp.length >= 2) {
        const sortedByPower = [...grp].sort((a, b) => getYansanCardPower(b) - getYansanCardPower(a));
        const cand = parseYansanCombo([sortedByPower[0], sortedByPower[1]]);
        if (cand && canBeatYansanCombo(cand, target)) {
          return true;
        }
      }
    }
    return false;
  }

  // 3. 三条
  if (target.type === 'triplet') {
    if (hand.length < 3) return false;
    const rankMap = new Map<number, YansanCard[]>();
    for (const c of hand) {
      if (!rankMap.has(c.rank)) rankMap.set(c.rank, []);
      rankMap.get(c.rank)!.push(c);
    }
    for (const grp of rankMap.values()) {
      if (grp.length >= 3) {
        const cand = parseYansanCombo(grp.slice(0, 3));
        if (cand && canBeatYansanCombo(cand, target)) {
          return true;
        }
      }
    }
    return false;
  }

  // 4. 五张牌型
  if (target.type === '5_card') {
    if (hand.length < 5) return false;
    // 如果当前是黑桃至尊同花顺且具有最高单牌，全场绝大
    if (target.comboTier === 5 && target.suitVal === 4 && target.rank === 3) {
      return false;
    }
    const aiPlay = getYansanAIPlay(hand, target);
    return !!(aiPlay && aiPlay.length === 5);
  }

  return false;
}

/**
 * 判定其他三位玩家中，是否有任意一位玩家的独立手牌能够压制当前打出的 combo。
 */
export function canOpponentsBeatYansanCombo(
  playedCombo: YansanCombo,
  opponentHands: YansanCard[][]
): boolean {
  if (!playedCombo) return false;
  for (const hand of opponentHands) {
    if (hand && hand.length > 0 && canHandBeatYansanCombo(hand, playedCombo)) {
      return true;
    }
  }
  return false;
}

/**
 * 检验剩余未知牌池中，是否能组合出任何大于 target 的 5 张牌型
 */
export function canPoolBeatYansan5CardCombo(
  pool: YansanCard[],
  target: YansanCombo
): boolean {
  if (!pool || pool.length < 5) return false;

  const targetTier = target.comboTier || 1;
  const targetRW = getYansanRankWeight(target.rank);
  const targetSuit = target.suitVal || 0;

  // 准备花色分组与点数分组
  const suitMap = new Map<string, YansanCard[]>();
  const rankMap = new Map<number, YansanCard[]>();
  for (const c of pool) {
    if (!suitMap.has(c.suit)) suitMap.set(c.suit, []);
    suitMap.get(c.suit)!.push(c);
    if (!rankMap.has(c.rank)) rankMap.set(c.rank, []);
    rankMap.get(c.rank)!.push(c);
  }

  const legalStraightRankSets = [
    [3, 4, 5, 14, 15],
    [3, 4, 5, 6, 7],
    [4, 5, 6, 7, 8],
    [5, 6, 7, 8, 9],
    [6, 7, 8, 9, 10],
    [7, 8, 9, 10, 11],
    [8, 9, 10, 11, 12],
    [9, 10, 11, 12, 13],
  ];

  // (1) 检查同花顺 (Tier 5)
  for (const [, sCards] of suitMap.entries()) {
    if (sCards.length >= 5) {
      const sRankSet = new Set(sCards.map((c) => c.rank));
      for (const rSet of legalStraightRankSets) {
        if (rSet.every((r) => sRankSet.has(r))) {
          const straightCards = rSet.map((r) => sCards.find((c) => c.rank === r)!);
          const parsed = parseYansanCombo(straightCards);
          if (parsed && canBeatYansanCombo(parsed, target)) {
            return true;
          }
        }
      }
    }
  }

  if (targetTier === 5) return false;

  // (2) 检查四带一 (Tier 4)
  const fourRanks = Array.from(rankMap.entries())
    .filter(([, list]) => list.length === 4)
    .map(([r]) => r);
  if (fourRanks.length > 0 && pool.length >= 5) {
    if (targetTier < 4) return true;
    for (const fr of fourRanks) {
      if (getYansanRankWeight(fr) > targetRW) return true;
    }
  }

  if (targetTier === 4) return false;

  // (3) 检查俘虏 (Tier 3)
  const tripleRanks = Array.from(rankMap.entries())
    .filter(([, list]) => list.length >= 3)
    .map(([r]) => r);
  const pairRanks = Array.from(rankMap.entries())
    .filter(([, list]) => list.length >= 2)
    .map(([r]) => r);

  for (const tr of tripleRanks) {
    for (const pr of pairRanks) {
      if (tr !== pr) {
        if (targetTier < 3) return true;
        if (targetTier === 3 && getYansanRankWeight(tr) > targetRW) return true;
      }
    }
  }

  if (targetTier === 3) return false;

  // (4) 检查同花 (Tier 2)
  for (const [, sCards] of suitMap.entries()) {
    if (sCards.length >= 5) {
      const suitVal = sCards[0].suitVal;
      if (targetTier < 2) return true;
      if (targetTier === 2) {
        if (suitVal > targetSuit) return true;
        if (suitVal === targetSuit) {
          const sortedDesc = [...sCards].sort((a, b) => getYansanCardPower(b) - getYansanCardPower(a));
          const maxPower = getYansanCardPower(sortedDesc[0]);
          const targetPower = getYansanRankWeight(target.rank) * 10 + targetSuit;
          if (maxPower > targetPower) return true;
        }
      }
    }
  }

  if (targetTier === 2) return false;

  // (5) 检查顺子 (Tier 1)
  for (const rSet of legalStraightRankSets) {
    if (rSet.every((r) => rankMap.has(r) && rankMap.get(r)!.length > 0)) {
      const cards = rSet.map((r) => {
        const list = rankMap.get(r)!;
        return [...list].sort((a, b) => getYansanCardPower(b) - getYansanCardPower(a))[0];
      });
      const parsed = parseYansanCombo(cards);
      if (parsed && canBeatYansanCombo(parsed, target)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 烟三基于公开已出牌库（公开记牌推算）的绝对压制判定：
 * 
 * 核心设计原则（杜绝信息泄露，确保绝对公开推算）：
 * 1. 绝不可通过读取对手暗牌来判定！
 * 2. 严禁结合出牌者自身的剩余手牌来推算！
 *    因为全场最大并直接连出是公开的全局广播行为。如果结合出牌者自己手里还保留的手牌（例如出了一对三红桃方块，自己手里还捏着梅花三）
 *    而判定全场最大连出，就会直接向全场暴露该玩家手里还藏有另一张三！
 * 3. 必须严格仅依据公开打出过的废牌堆 (playedCardsHistory) 与对手剩余张数，推算出“全场公开未出牌池 (availablePool)”中是否存在任何理论上能压制当前牌型的组合：
 *    - 张数推算：若全场对手中最多手牌者张数不足（如打出5张牌，但对手最多只剩4张），则必定绝大！
 *    - 单张推算：若公开未出牌池中不存在任何点数更大、或同点数花色更大的单张（如♠3全场至尊，或♠3已出后的♥3），则必定绝大！
 *    - 对子推算：若公开未出牌池中任何大于当前对子的点数，剩余可用张数都小于2张（无法凑出一对）；且同点数的无法产生更大花色对子，则必定绝大！
 *    - 三条推算：若公开未出牌池中任何大于当前三条的点数，剩余可用张数都小于3张（如3张3已出，打出三条2），则必定绝大！
 *    - 五张牌型推算：若公开未出牌池完全无法拼出任何能够压制当前牌型的五张组合（同花顺、四带一、俘虏、同花、顺子），则必定绝大！
 * 
 * 若返回 true，说明从全场公开信息推算，任何对手在数学物理意义上都不可能要得起，无需等待对手过牌，首出者直接保留出牌权连打！
 */
export function isYansanComboDeductivelyUnbeatable(
  combo: YansanCombo,
  availablePool: YansanCard[],
  maxOpponentHandSize: number
): boolean {
  if (!combo) return false;

  // 1. 张数推算：若对手最多手牌数少于当前牌型所需张数，全场无人能接
  const neededCards = combo.type === '5_card' ? 5 : combo.type === 'triplet' ? 3 : combo.type === 'pair' ? 2 : 1;
  if (maxOpponentHandSize < neededCards || availablePool.length < neededCards) {
    return true;
  }

  // 2. 单张推算
  if (combo.type === 'single') {
    const targetPower = getYansanRankWeight(combo.rank) * 10 + (combo.suitVal || 0);
    for (const c of availablePool) {
      const p = getYansanRankWeight(c.rank) * 10 + c.suitVal;
      if (p > targetPower) {
        return false;
      }
    }
    return true;
  }

  // 3. 对子推算
  if (combo.type === 'pair') {
    const targetRW = getYansanRankWeight(combo.rank);
    const targetSuit = combo.suitVal || 0;

    const rankMap = new Map<number, YansanCard[]>();
    for (const c of availablePool) {
      if (!rankMap.has(c.rank)) rankMap.set(c.rank, []);
      rankMap.get(c.rank)!.push(c);
    }

    for (const [rank, grp] of rankMap.entries()) {
      if (grp.length >= 2) {
        const rw = getYansanRankWeight(rank);
        if (rw > targetRW) return false;
        if (rw === targetRW) {
          const maxSuitInPool = Math.max(...grp.map((c) => c.suitVal));
          if (maxSuitInPool > targetSuit) return false;
        }
      }
    }
    return true;
  }

  // 4. 三条推算
  if (combo.type === 'triplet') {
    const targetRW = getYansanRankWeight(combo.rank);
    const rankCounts = new Map<number, number>();
    for (const c of availablePool) {
      rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1);
    }
    for (const [rank, count] of rankCounts.entries()) {
      if (count >= 3 && getYansanRankWeight(rank) > targetRW) {
        return false;
      }
    }
    return true;
  }

  // 5. 五张牌型推算
  if (combo.type === '5_card') {
    return !canPoolBeatYansan5CardCombo(availablePool, combo);
  }

  return false;
}

export interface YansanSpecialHolders {
  spade3Seat: number;
  spadeASeat: number;
  isSolo: boolean; // True if same seat holds both ♠3 and ♠A
  soloSeat: number | null;
}

export function detectYansanSpecialHolders(
  hands: YansanCard[][],
  seatPlayedCards?: YansanCard[][]
): YansanSpecialHolders {
  let spade3Seat = -1;
  let spadeASeat = -1;

  for (let s = 0; s < hands.length; s++) {
    const hand = hands[s] || [];
    const played = seatPlayedCards ? (seatPlayedCards[s] || []) : [];
    if (hand.some((c) => c.rank === 3 && c.suit === '♠') || played.some((c) => c.rank === 3 && c.suit === '♠')) {
      spade3Seat = s;
    }
    if (hand.some((c) => c.rank === 14 && c.suit === '♠') || played.some((c) => c.rank === 14 && c.suit === '♠')) {
      spadeASeat = s;
    }
  }

  if (spade3Seat === -1) spade3Seat = 0;
  if (spadeASeat === -1) spadeASeat = 0;

  const isSolo = spade3Seat === spadeASeat;
  return {
    spade3Seat,
    spadeASeat,
    isSolo,
    soloSeat: isSolo ? spade3Seat : null,
  };
}

export interface YansanSettlement {
  winnerSeat: number;
  winnerAlliance: string;
  isQiangGong: boolean;
  qiangGongSeat: number | null;
  seatScores: [number, number, number, number];
  summary: string;
  isTie?: boolean;
}

export function calculateYansanSettlement(
  roomType: string,
  winnerSeat: number,
  isQiangGong: boolean,
  qiangGongSeat: number | null,
  spade3Seat: number,
  spadeASeat: number,
  finishedSeats: number[]
): YansanSettlement {
  const lowStake = roomType === '20-40' ? 20 : roomType === '10-20' ? 10 : 5;
  const highStake = lowStake * 2;
  const seatNames = ['本家', '西席', '北席', '东席'];

  if (isQiangGong && qiangGongSeat !== null) {
    // 强攻规则：全胜翻倍或翻倍全输，根据所选场景底分判定：
    // 5-10分场：强攻者赢60分（其余3家各输20分）；强攻者输60分（其余3家各得20分）
    // 10-20分场：强攻者赢120分（其余3家各输40分）；强攻者输120分（其余3家各得40分）
    // 20-40分场：强攻者赢240分（其余3家各输80分）；强攻者输240分（其余3家各得80分）
    const eachStake = highStake * 2;
    const totalStake = eachStake * 3;
    const isSoloWin = winnerSeat === qiangGongSeat;

    const scores: [number, number, number, number] = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      if (i === qiangGongSeat) {
        scores[i] = isSoloWin ? totalStake : -totalStake;
      } else {
        scores[i] = isSoloWin ? -eachStake : eachStake;
      }
    }

    const summary = isSoloWin
      ? `${seatNames[qiangGongSeat]} 开启强攻率先出清，全胜翻倍！独赢 +${totalStake} 分，其余三家各输 -${eachStake} 分`
      : `强攻被破！${seatNames[winnerSeat]} 率先出清，强攻者 ${seatNames[qiangGongSeat]} 翻倍全输 -${totalStake} 分，其余三家各得 +${eachStake} 分`;

    return {
      winnerSeat,
      winnerAlliance: isSoloWin ? `${seatNames[qiangGongSeat]} (强攻独胜)` : `${seatNames[winnerSeat]} (防守同盟)`,
      isQiangGong: true,
      qiangGongSeat,
      seatScores: scores,
      summary,
    };
  }

  const scores: [number, number, number, number] = [0, 0, 0, 0];

  // 经典 2v2 对局：同盟由 ♠3 与 ♠A 持有者构成
  if (spade3Seat !== spadeASeat) {
    const isSpade = (s: number) => s === spade3Seat || s === spadeASeat;

    const p1 = finishedSeats[0] ?? winnerSeat;
    const p2 = finishedSeats[1] ?? -1;
    const p3 = finishedSeats[2] ?? -1;

    let spadeWinPoints = 0;
    let winningAllianceName = '';
    let summary = '';
    let isTie = false;

    // 规则判定：
    // ① 双胜（双跑）：同一阵营两人包揽前两名（如1和3或2和4先出清手牌）
    // 5-10分场：胜方各得10分，负方各输10分
    if (p2 !== -1 && isSpade(p1) === isSpade(p2)) {
      if (isSpade(p1) && isSpade(p2)) {
        // 1号与3号玩家包揽前二 (1,3 或 3,1)
        spadeWinPoints = highStake;
        winningAllianceName = '黑桃同盟 (♠3 & ♠A)';
        summary = `黑桃同盟 (♠3 & ♠A) 双跑全胜！包揽前两名率先出清，各得 +${highStake} 分，平民各输 -${highStake} 分`;
      } else {
        // 2号与4号玩家包揽前二 (2,4 或 4,2)
        spadeWinPoints = -highStake;
        winningAllianceName = '平民同盟';
        summary = `平民同盟 双跑全胜！包揽前两名率先出清，各得 +${highStake} 分，黑桃同盟各输 -${highStake} 分`;
      }
    } else if (p3 !== -1) {
      // ② 出清三人时分出胜负或打和：
      const p1IsSpade = isSpade(p1);
      const p3IsSpade = isSpade(p3);

      if (p1IsSpade && p3IsSpade) {
        // 顺序 123 / 321 / 143 / 341：黑桃同盟拿下第1名与第3名出清
        // 5-10分场：1和3各得5分，2和4各输5分
        spadeWinPoints = lowStake;
        winningAllianceName = '黑桃同盟 (♠3 & ♠A)';
        summary = `黑桃同盟 (♠3 & ♠A) 单胜！夺得第一名及第三名出清，各得 +${lowStake} 分，平民各输 -${lowStake} 分`;
      } else if (!p1IsSpade && !p3IsSpade) {
        // 顺序 214 / 234 / 412 / 432：平民同盟拿下第1名与第3名出清
        // 5-10分场：2和4各得5分，1和3各输5分
        spadeWinPoints = -lowStake;
        winningAllianceName = '平民同盟';
        summary = `平民同盟 单胜！夺得第一名及第三名出清，各得 +${lowStake} 分，黑桃同盟各输 -${lowStake} 分`;
      } else {
        // ③ 打和：顺序 124 / 142 / 324 / 342 / 213 / 231 / 413 / 431
        // 一方拿第1名，但另一方包揽第2名和第3名出清，双方打和，大家都没有输赢 (各得0分)
        spadeWinPoints = 0;
        winningAllianceName = '双方平局 (打和)';
        isTie = true;
        summary = `势均力敌 · 本局打和！一方拿下头彩但另一方包揽二三名，双方势均力敌，大家都没有输赢 (各 0 分)`;
      }
    } else {
      // 容错备用
      if (isSpade(p1)) {
        spadeWinPoints = lowStake;
        winningAllianceName = '黑桃同盟 (♠3 & ♠A)';
        summary = `黑桃同盟率先出清，各得 +${lowStake} 分，平民同盟各输 -${lowStake} 分`;
      } else {
        spadeWinPoints = -lowStake;
        winningAllianceName = '平民同盟';
        summary = `平民同盟率先出清，各得 +${lowStake} 分，黑桃同盟各输 -${lowStake} 分`;
      }
    }

    for (let i = 0; i < 4; i++) {
      scores[i] = isSpade(i) ? spadeWinPoints : -spadeWinPoints;
    }

    return {
      winnerSeat,
      winnerAlliance: winningAllianceName,
      isQiangGong: false,
      qiangGongSeat: null,
      seatScores: scores,
      summary,
      isTie,
    };
  } else {
    // 独占 ♠3 & ♠A 但未开启强攻（1对3 双煞对局）
    const solo = spade3Seat;
    // 找到双煞出清的名次 (0: 头游/第1名; 1: 二游/第2名; 2: 三游/第3名; -1 或 3: 未出清/第4名末游垫底)
    const soloFinishedRank = finishedSeats.indexOf(solo);
    let soloScore = 0;
    let eachFarmerScore = 0;
    let winningAllianceName = '';
    let summary = '';
    let isTie = false;

    if (soloFinishedRank === 0) {
      // ① 双煞第 1 个打完手牌（头游出清）：全赢！
      // 5-10 分场: +30 / -10; 10-20 分场: +60 / -20; 20-40 分场: +120 / -40
      soloScore = highStake * 3;
      eachFarmerScore = -highStake;
      winningAllianceName = `${seatNames[solo]} (双煞全胜)`;
      summary = `${seatNames[solo]} (持双煞♠3♠A) 第一个打完手牌夺得头游，1打3全胜大捷！独赢 +${soloScore} 分，其余三家各输 -${highStake} 分`;
    } else if (soloFinishedRank === 1) {
      // ② 双煞第 2 个打完手牌（二游出清）：半赢！
      // 5-10 分场: +15 / -5; 10-20 分场: +30 / -10; 20-40 分场: +60 / -20
      soloScore = lowStake * 3;
      eachFarmerScore = -lowStake;
      winningAllianceName = `${seatNames[solo]} (双煞半胜)`;
      summary = `${seatNames[solo]} (双煞) 第二个打完手牌出清，1打3半赢！独赢 +${soloScore} 分，其余三家各输 -${lowStake} 分`;
    } else if (soloFinishedRank === 2) {
      // ③ 双煞第 3 个打完手牌（三游出清）：半输！
      // 5-10 分场: -15 / +5; 10-20 分场: -30 / +10; 20-40 分场: -60 / +20
      soloScore = -(lowStake * 3);
      eachFarmerScore = lowStake;
      winningAllianceName = '平民同盟 (半胜)';
      summary = `前两名平民率先出清，${seatNames[solo]} (双煞) 第三个打完手牌出清半输，扣 -${Math.abs(soloScore)} 分，其余三家各得 +${lowStake} 分`;
    } else {
      // ④ 其他三个玩家全部打完手牌只剩下双煞（末游第四名）：全输！
      // 5-10 分场: -30 / +10; 10-20 分场: -60 / +20; 20-40 分场: -120 / +40
      soloScore = -(highStake * 3);
      eachFarmerScore = highStake;
      winningAllianceName = '平民同盟 (全胜)';
      summary = `其他三名平民全部打完手牌包揽前三，只剩下双煞 ${seatNames[solo]}，双煞全输！扣 -${Math.abs(soloScore)} 分，其余三家各得 +${highStake} 分`;
    }

    for (let i = 0; i < 4; i++) {
      scores[i] = i === solo ? soloScore : eachFarmerScore;
    }

    return {
      winnerSeat: soloFinishedRank === 0 ? solo : (finishedSeats[0] ?? winnerSeat),
      winnerAlliance: winningAllianceName,
      isQiangGong: false,
      qiangGongSeat: null,
      seatScores: scores,
      summary,
      isTie,
    };
  }
}

export function calculateYansanSurrenderSettlement(
  roomType: string,
  surrenderSeat: number
): YansanSettlement {
  // 5-10分场：投降输给其他玩家各5分，共输15分 (eachStake = 5, totalStake = 15)
  // 10-20分场：投降输给其他玩家各10分，共输30分 (eachStake = 10, totalStake = 30)
  // 20-40分场：投降输给其他玩家各20分，共输60分 (eachStake = 20, totalStake = 60)
  const eachStake = roomType === '20-40' ? 20 : roomType === '10-20' ? 10 : 5;
  const totalStake = eachStake * 3;
  const seatNames = ['本家', '西席', '北席', '东席'];

  const scores: [number, number, number, number] = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    if (i === surrenderSeat) {
      scores[i] = -totalStake;
    } else {
      scores[i] = eachStake;
    }
  }

  const summary = `${seatNames[surrenderSeat]} 在起手手牌未动时选择投降认输！输给其他玩家各 ${eachStake} 分，共输 -${totalStake} 分，其余三家各得 +${eachStake} 分`;

  return {
    winnerSeat: (surrenderSeat + 1) % 4,
    winnerAlliance: '胜方同盟 (对手投降)',
    isQiangGong: false,
    qiangGongSeat: null,
    seatScores: scores,
    summary,
  };
}
