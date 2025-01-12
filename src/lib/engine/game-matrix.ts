import { Board, PieceData, Rotation } from "../types/game-state";
import { BOARD_WIDTH, PIECE_SPAWN } from "./game-options";
import { I_KICKS, Piece, PIECE_MATRICES, WALLKICKS } from "./piece";

export const getMatrix = ({ piece, rotation }: PieceData) =>
  PIECE_MATRICES[piece][rotation & 0x03];

export const checkCollision = (board: Board, pieceData: PieceData) => {
  const pieceMatrix = getMatrix(pieceData);
  for (let y = 0; y < pieceMatrix.length; y++) {
    const row = pieceMatrix[y];

    const boardY = pieceData.y - y;
    const boardRow = board[boardY];

    for (let x = 0; x < row.length; x++) {
      if (row[x] === 0) continue;

      if (boardY < 0) return true;

      let boardX = pieceData.x + x;
      if (boardX < 0 || boardX >= 10) return true;
      if (boardRow && boardRow[boardX]) return true;
    }
  }

  return false;
};

export const checkImmobile = (board: Board, pieceData: PieceData) => {
  let directions = [
    [0, -1], // Down
    [0, 1], // Up
    [-1, 0], // Left
    [1, 0], // Right
  ];
  for (const [dx, dy] of directions) {
    let test_piece = { ...pieceData, x: pieceData.x + dx, y: pieceData.y + dy };
    if (!checkCollision(board, test_piece)) return false;
  }

  return true;
};

export const clearLines = (board: Board) => {
  let clearedLines = 0;
  for (let i = board.length - 1; i >= 0; i--) {
    const isFullRow = board[i].every((cell) => cell !== null);
    if (isFullRow) {
      clearedLines += 1;
      board.splice(i, 1);
    }
  }
  return clearedLines;
};

export const tryWallKicks = (
  board: Board,
  pieceData: PieceData,
  rotation: Rotation
) => {
  const newPieceData = { ...pieceData, rotation };
  const wallKicks = newPieceData.piece === "I" ? I_KICKS : WALLKICKS;

  const kickData = wallKicks[`${pieceData.rotation}${rotation}`]!;

  for (const [x, y] of kickData) {
    newPieceData.x += x;
    newPieceData.y += y;
    if (!checkCollision(board, newPieceData)) {
      return { pieceData: newPieceData, success: true };
    }
    newPieceData.x -= x;
    newPieceData.y -= y;
  }

  return { pieceData: newPieceData, success: false };
};

export const spawnPiece = (board: Board, piece: Piece) => {
  const matrix = piece == "I" ? 4 : piece == "O" ? 2 : 3;
  const piece_data = {
    piece,
    x: 5 - Math.ceil(matrix / 2.0),
    y: PIECE_SPAWN,
    rotation: 0 as Rotation,
  };
  const collides = board.length > 16 && checkCollision(board, piece_data);

  return { piece_data, collides };
};

export const placePiece = (board: Board, pieceData: PieceData) => {
  const pieceMatrix = getMatrix(pieceData);

  for (let pieceY = 0; pieceY < pieceMatrix.length; pieceY++) {
    const row = pieceMatrix[pieceY];
    const boardY = pieceData.y - pieceY;
    if (boardY < 0) continue;

    for (let pieceX = 0; pieceX < row.length; pieceX++) {
      const cell = row[pieceX];
      if (!cell) continue;
      // Expand board if needed
      while (boardY >= board.length) {
        board.push(new Array(BOARD_WIDTH).fill(null));
      }

      const boardX = pieceData.x + pieceX;
      board[boardY][boardX] = pieceData.piece;
    }
  }

  return board;
};
