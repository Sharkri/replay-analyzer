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

// Based on https://four.lol/srs/t-spin
export const isTSpin = (
  board: Board,
  target: PieceData,
  kickIndex: number,
  rotationToFrom: string
) => {
  if (target.piece !== "T") return null;

  const cornerOffsets = [
    [-1, -1], // Top-left corner
    [1, -1], // Top-right corner
    [-1, 1], // Bottom-left corner
    [1, 1], // Bottom-right corner
  ];

  let occupiedCorners = 0;
  let facingCorners = 0;

  // Offset to correctly position the T-piece
  const offsetX = target.x + 1;
  const offsetY = target.y - 1;

  for (let i = 0; i < cornerOffsets.length; i++) {
    const [cx, cy] = cornerOffsets[i];
    const x = offsetX + cx;
    const y = offsetY + cy;

    const isOccupied = y < 0 || (board[y] && board[y][x] !== null);

    if (isOccupied) {
      occupiedCorners++;

      // check if occupied cell is facing the t-piece
      if (
        (target.rotation === 0 && cy === 1) ||
        (target.rotation === 1 && cx === 1) ||
        (target.rotation === 2 && cy === -1) ||
        (target.rotation === 3 && cx === -1)
      ) {
        facingCorners++;
      }
    }
  }

  if (occupiedCorners < 3) {
    return null;
  }

  if (
    facingCorners === 2 ||
    (kickIndex === 4 && ["03", "01", "23", "21"].includes(rotationToFrom))
  ) {
    return "full"; // Full T-spin if facing 2 corners or using special kicks (like TST)
  }

  return "mini"; // Otherwise, classify as a mini T-spin
};

export const clearLines = (board: Board) => {
  let clearedLines = 0;
  let isGarbageClear = false;

  for (let i = board.length - 1; i >= 0; i--) {
    const row = board[i];
    const isFullRow = row.every((cell) => cell !== null);

    if (isFullRow) {
      const garbageRow = row.some((cell) => cell === "G");
      if (garbageRow) isGarbageClear = true;

      clearedLines += 1;
      board.splice(i, 1);
    }
  }
  return { clearedLines, isGarbageClear };
};

export const tryWallKicks = (
  board: Board,
  pieceData: PieceData,
  rotation: Rotation
) => {
  const newPieceData = { ...pieceData, rotation };
  const wallKicks = newPieceData.piece === "I" ? I_KICKS : WALLKICKS;

  const rotationToFrom = `${pieceData.rotation}${rotation}`;
  const kickData = wallKicks[rotationToFrom]!;

  for (const [index, [x, y]] of kickData.entries()) {
    newPieceData.x += x;
    newPieceData.y += y;
    if (!checkCollision(board, newPieceData)) {
      return { pieceData: newPieceData, success: true, index, rotationToFrom };
    }
    newPieceData.x -= x;
    newPieceData.y -= y;
  }

  return { pieceData: newPieceData, success: false, index: 0, rotationToFrom };
};

export const spawnPiece = (board: Board, piece: Piece, frame: number) => {
  const matrix = piece == "I" ? 4 : piece == "O" ? 2 : 3;
  const piece_data = {
    piece,
    x: 5 - Math.ceil(matrix / 2.0),
    y: PIECE_SPAWN,
    rotation: 0 as Rotation,
    spawnFrame: frame,
    lowest: PIECE_SPAWN,
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
