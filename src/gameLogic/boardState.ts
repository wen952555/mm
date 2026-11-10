/**
 * Authoritative Board State Logic
 * 权威对局面板状态调度已拆分至独立文件：
 * • Common Board State: src/games/common/boardState.ts
 */
export { createDefaultBoardState } from '../games/common/boardState.ts';
export type { AuthoritativeBoardState } from '../engine/gameStateTypes.ts';
