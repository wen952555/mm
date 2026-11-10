/**
 * 权威对局面板状态调度器 (Authoritative Board State Dispatcher)
 */
import { AuthoritativeBoardState } from '../../engine/gameStateTypes.ts';
import { GameType } from './types.ts';

export function createDefaultBoardState(roomId: string, gameType: string): AuthoritativeBoardState {
  const gType = (gameType as GameType) || 'yansan';
  const isEightSSS = gType === 'shisanshui' && roomId.includes('eight');

  return {
    roomId,
    gameType: gType,
    phase: 'playing',
    turnSeat: 0,
    actionSeq: 1,
    moveCount: 0,
    multiplier: 1,
    handsCount: isEightSSS
      ? [13, 13, 13, 13, 13, 13, 13, 13]
      : [13, 13, 13, 13],
    lastCombo: null,
    winnerSeat: null,
    discardsHistory: [],
    extraState: gType === 'mahjong'
      ? { mahjongDiscards: [], mahjongMelds: [[], [], [], []], lastDiscarded: null, wallRemaining: 83 }
      : (gType === 'yansan' ? { playedCardsHistory: [], consecutivePasses: 0 } : { shisanshuiSubmissions: {} }),
    updatedAt: Date.now(),
  };
}
