/**
 * 经典国标麻将 (Mahjong) 独立结算与复盘推演生成逻辑
 */
import { MahjongMovePayload, MahjongSettlementResult } from './types.ts';

export function calculateMahjongSettlement(payload: MahjongMovePayload): MahjongSettlementResult {
  const isWin = payload.winner === 0;
  const isTie = payload.winner === -1;

  const scorePoints = typeof payload.rewardCoins === 'number'
    ? payload.rewardCoins
    : (isWin
        ? (payload.payoutPerOpponent ? payload.payoutPerOpponent * 3 : 70)
        : -(payload.payoutPerOpponent || 30));

  const coinsDelta = typeof payload.rewardCoins === 'number'
    ? payload.rewardCoins
    : (isWin ? 300 : (isTie ? 0 : -150));

  const ratingDelta = isWin ? 20 : (isTie ? 0 : -10);
  const detailText = payload.detail || payload.detailText || (isWin ? '麻将自摸和牌' : (isTie ? '麻将荒庄流局' : '对手率先自摸和出'));

  const replayData = {
    summary: detailText,
    rounds: [
      { step: 1, seatName: '定庄开局', action: '打色子定庄开门，四道抓牌跳牌完成', tag: '定庄抓牌' },
      { step: 2, seatName: isWin ? '本家自摸' : '对手和出', action: detailText, tag: '终局和牌' },
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
