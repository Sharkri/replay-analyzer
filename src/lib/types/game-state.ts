import { Block, Piece } from "../engine/piece";

export const PIECE_BAG: Piece[] = ["Z", "L", "O", "S", "I", "J", "T"];

export type Board = (Block | null)[][];
export type Rotation = 0 | 1 | 2 | 3;

export type GameState = {
  queue: Piece[];
  board: Board;
  current: PieceData;
  dead: boolean;
  held?: Piece;
  canHold: boolean;
};

export type PieceData = {
  piece: Piece;
  x: number;
  y: number;
  rotation: Rotation;
};
