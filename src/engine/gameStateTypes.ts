/**
 * Server-Authoritative Game State Types and Wire Protocol DTOs
 */

export type GameType = 'yansan' | 'shisanshui' | 'mahjong';

export interface ServerCardDTO {
  id: string;
  rank: number;
  suit: string;
  label: string;
  isRed: boolean;
}

export interface ServerComboDTO {
  type: string;
  rank: number;
  cards: ServerCardDTO[];
  seat: number;
  length?: number;
}

export interface AuthoritativeBoardState {
  roomId: string;
  gameType: GameType;
  phase: 'idle' | 'bidding' | 'playing' | 'comparing' | 'ended';
  turnSeat: number;
  actionSeq: number;
  moveCount: number;
  multiplier: number;
  handsCount: number[];
  lastCombo: ServerComboDTO | null;
  winnerSeat?: number | null;
  wallRemaining?: number;
  discardsHistory?: ServerComboDTO[];
  finishedSeats?: number[];
  allianceScoreResult?: any;
  settlement?: any;
  extraState?: Record<string, any>;
  updatedAt: number;
}

export interface ReconnectAckPayload {
  type: 'reconnect_ack';
  room: any;
  boardState?: AuthoritativeBoardState;
  serverTs: number;
}

export interface GameEventPayload {
  type: 'game_event';
  roomId: string;
  seat: number;
  actionSeq?: number;
  boardState?: AuthoritativeBoardState;
  payload: any;
  moveCount: number;
}
