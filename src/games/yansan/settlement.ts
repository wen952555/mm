/**
 * 经典烟三 (Yansan) 独立结算与复盘推演生成逻辑
 */
import { YansanMovePayload, YansanSettlementResult } from './types.ts';
import { calculateYansanSettlement as calculateYansanEngineSettlement } from './rules.ts';

export { calculateYansanEngineSettlement };

export function resolveYansanMoveSettlement(payload: YansanMovePayload): YansanSettlementResult {
  const isTie = payload.winner === -1 || (typeof payload.pointsDelta === 'number' && payload.pointsDelta === 0) || Boolean(payload.allianceScoreResult?.isTie);
  const isWin = typeof payload.pointsDelta === 'number' ? payload.pointsDelta > 0 : (payload.winner === 0 && !isTie);

  let scorePoints = 0;
  let coinsDelta = 0;
  let ratingDelta = 0;
  let detailText = '';

  if (typeof payload.pointsDelta === 'number') {
    const pts = payload.pointsDelta;
    scorePoints = pts;
    coinsDelta = pts;
    ratingDelta = Math.round(pts * 0.8);
    detailText = payload.detailText || (isTie ? '烟三势均力敌 · 本局打和' : (isWin ? '烟三先手出清大捷' : '烟三对局失利'));
  } else {
    scorePoints = isWin ? 10 : (isTie ? 0 : -10);
    coinsDelta = isWin ? 20 : (isTie ? 0 : -20);
    ratingDelta = isWin ? 20 : (isTie ? 0 : -12);
    detailText = isWin ? '烟三先手出清大捷' : (isTie ? '烟三势均力敌 · 本局打和' : '烟三对局失利');
  }

  if (scorePoints === 0 && !isTie) {
    scorePoints = isWin ? 10 : -10;
  }

  const allRes = payload.allianceScoreResult;
  const replaySummary = allRes?.summary || detailText;
  const replayAlliances = allRes?.winnerAlliance
    ? `胜方：${allRes.winnerAlliance}`
    : (isTie ? '双方打和平局' : '阵营对抗终局');

  const replayData = {
    summary: replaySummary,
    alliances: replayAlliances,
    rounds: [
      { step: 1, seatName: '首发开局', action: '方块4率先出牌开门', cards: ['♦4'], tag: '方块4' },
      { step: 2, seatName: '四方牌友', action: '依据♠3/♠A同盟与农民阵营展开战术攻防', tag: '阵营攻防' },
      {
        step: 3,
        seatName: '本家 (您)',
        action: isWin ? '连续打出绝大牌型出清手牌！' : '稳步跟牌推进',
        cards: isWin ? ['♠10', '♠J', '♠Q', '♠K', '♠A'] : ['♥K'],
        tag: isWin ? '出清大捷' : '战术跟出',
      },
      { step: 4, seatName: '裁判司仪', action: replaySummary, tag: '终局结算' },
    ],
  };

  return {
    isWin,
    isTie,
    scorePoints,
    coinsDelta,
    ratingDelta,
    detailText,
    replayData,
  };
}
