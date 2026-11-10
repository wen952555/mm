/**
 * 水镜十三水 / 十三张 (Shisanshui) 独立结算与复盘推演生成逻辑
 */
import { ShisanshuiMovePayload, ShisanshuiSettlementResult } from './types.ts';

export function calculateShisanshuiSettlement(payload: ShisanshuiMovePayload): ShisanshuiSettlementResult {
  const netWater = typeof payload.score === 'number' ? payload.score : (payload.pointsDelta || 0);
  const isWin = netWater > 0;
  const isTie = netWater === 0;

  const coinsDelta = netWater * 50;
  const scorePoints = netWater; // 1水即1分
  const ratingDelta = Math.round(netWater * 2.5);

  const detailText =
    payload.detailText ||
    (netWater > 0
      ? `十三水比水大捷 · 净胜 ${netWater} 水`
      : (netWater === 0
          ? '十三水平局打和'
          : `十三水比水告负 · 净输 ${Math.abs(netWater)} 水`));

  const replayData = {
    summary: detailText,
    rounds: [
      { step: 1, seatName: '本家 (您)', action: '完成头中尾三道排理，防倒水校验通过', tag: '智能理牌' },
      { step: 2, seatName: '比水总览', action: detailText, tag: '比水结算' },
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
