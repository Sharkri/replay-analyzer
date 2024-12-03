import { Board, GameState, PieceData, Rotation } from "../types/game-state";
import { Piece, PIECE_MATRICES } from "./piece";

export const PIECE_SPAWN = 21;

const getMatrix = ({ piece, rotation }: PieceData) =>
  PIECE_MATRICES[piece][rotation & 0x03];

const check_collision = (board: Board, pieceData: PieceData) => {
  const pieceMatrix = getMatrix(pieceData);

  for (let y = 0; y < pieceMatrix.length; y++) {
    const row = pieceMatrix[y];

    const boardY = pieceData.y - y;
    const boardRow = board[boardY];

    for (let x = 0; x < row.length; x++) {
      if (row[x] === 0) continue;

      if (!boardRow) return true;

      let boardX = pieceData.x + x;
      if (boardX < 0 || boardX >= 10) return true;

      if ((boardRow & (1 << boardX)) != 0) {
        return true;
      }
    }
  }

  return false;
};

export const spawnPiece = (board: Board, piece: Piece) => {
  const matrix = piece == "I" ? 4 : piece == "O" ? 2 : 3;

  const piece_data = {
    piece,
    x: 5 - Math.ceil(matrix / 2.0),
    y: PIECE_SPAWN,
    rotation: 0 as Rotation,
  };

  const collides = board.length > 16 && check_collision(board, piece_data);

  return { piece_data, collides };
};

export const createGameState = (queue: Piece[]): GameState => {
  const board: Board = [];

  const gameQueue = [...queue];
  const current = spawnPiece(board, gameQueue.shift() || "I");

  return { queue, current: current.piece_data, board };
};
