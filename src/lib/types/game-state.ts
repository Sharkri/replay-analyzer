import { Block, Piece } from "../engine/piece";

export const PIECE_BAG: Piece[] = ["Z", "L", "O", "S", "I", "J", "T"];

export type BoardRow = (Block | null)[];
export type Board = BoardRow[];
export type Rotation = 0 | 1 | 2 | 3;
export type GarbageQueued = {
  cancelFrame: number;
  amt: number;
  frame: number;
};
export type AttackQueued = { amt: number; frame: number; doubled: boolean };

export type GameState = {
  queue: Piece[];
  board: Board;
  current: PieceData;
  dead: boolean;
  held?: Piece;
  canHold: boolean;
  garbageQueued: GarbageQueued[];
  combo: number;
  b2b: number;
  attackQueued: AttackQueued[];
  piecesPlaced: number;
  rng: number;
  rngex: number;
};

export type PieceData = {
  piece: Piece;
  x: number;
  y: number;
  rotation: Rotation;
};
