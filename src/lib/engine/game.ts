import { BOARD_WIDTH } from "../types/game-options";
import { Board, GameState, PieceData, Rotation } from "../types/game-state";
import { I_KICKS, Piece, PIECE_MATRICES, WALLKICKS } from "./piece";

export const PIECE_SPAWN = 21;
export type GameCommand =
  | "hard_drop"
  | "move_left"
  | "move_right"
  | "soft_drop"
  | "rotate_cw"
  | "rotate_ccw"
  | "hold";

const getMatrix = ({ piece, rotation }: PieceData) =>
  PIECE_MATRICES[piece][rotation & 0x03];

const checkCollision = (board: Board, pieceData: PieceData) => {
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

      if (boardRow?.[boardX]) return true;
    }
  }

  return false;
};

function tryWallKicks(board: Board, pieceData: PieceData, rotation: Rotation) {
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
}

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

export const createGameState = (queue: Piece[]): GameState => {
  const board: Board = [];

  const gameQueue = [...queue];
  const current = spawnPiece(board, gameQueue.shift() || "I");

  return {
    queue,
    current: current.piece_data,
    board,
    dead: false,
    canHold: true,
  };
};

const placePiece = (board: Board, pieceData: PieceData) => {
  const pieceMatrix = getMatrix(pieceData); // Assuming `getMatrix` gives the piece's matrix.

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

export const hardDrop = (state: GameState) => {
  sonicDrop(state);
  // TODO: immobile checks and garbage + a bunch of others
  placePiece(state.board, state.current);

  const nextPiece = state.queue.shift();
  if (!nextPiece) throw new Error("Queue is empty");

  const { collides, piece_data } = spawnPiece(state.board, nextPiece);
  state.dead = collides;
  state.current = piece_data;

  state.canHold = true;
};

export const moveLeft = (state: GameState) => {
  if (state.dead) throw new Error("Cannot act when dead");
  state.current.x -= 1;

  if (checkCollision(state.board, state.current)) {
    state.current.x += 1;
  }
};
export const moveRight = (state: GameState) => {
  if (state.dead) throw new Error("Cannot act when dead");
  state.current.x += 1;

  if (checkCollision(state.board, state.current)) {
    state.current.x -= 1;
  }
};
export const rotateCW = (state: GameState) => {
  if (state.dead) throw new Error("Cannot act when dead");

  const newRotation = ((state.current.rotation + 1) % 4) as Rotation;

  const wallKickData = tryWallKicks(state.board, state.current, newRotation);
  if (wallKickData.success) state.current = wallKickData.pieceData;
};

export const rotateCCW = (state: GameState) => {
  if (state.dead) throw new Error("Cannot act when dead");

  const newRotation = ((state.current.rotation + 3) % 4) as Rotation;

  const wallKickData = tryWallKicks(state.board, state.current, newRotation);
  if (wallKickData.success) state.current = wallKickData.pieceData;
};

export const softDrop = (state: GameState) => {
  if (state.dead) throw new Error("Cannot act when dead");

  while (!checkCollision(state.board, state.current)) {
    state.current.y -= 1;
  }
  state.current.y += 1;
};

export const sonicDrop = (state: GameState) => {
  if (state.dead) throw new Error("Cannot act when dead");

  while (!checkCollision(state.board, state.current)) {
    state.current.y -= 1;
  }
  state.current.y += 1;
};

export const hold = (state: GameState) => {
  if (state.dead) throw new Error("Cannot act when dead");
  if (!state.canHold) return;

  // Swap current and held
  state.held = state.current.piece;

  let newPiece = state.held
    ? spawnPiece(state.board, state.held)
    : spawnPiece(state.board, state.queue.shift()!);

  state.dead = newPiece.collides;
  state.current = newPiece.piece_data;

  state.canHold = false;
};

export const executeCommand = (command: GameCommand, state: GameState) => {
  const newGameState = structuredClone(state);

  switch (command) {
    case "hard_drop":
      hardDrop(newGameState);
      break;
    case "move_left":
      moveLeft(newGameState);
      break;
    case "move_right":
      moveRight(newGameState);
      break;
    case "rotate_cw":
      rotateCW(newGameState);
      break;
    case "rotate_ccw":
      rotateCCW(newGameState);
      break;
    case "soft_drop":
      break;
    case "hold":
      hold(newGameState);
      break;

    default:
      console.log("Invalid command: ", command);
      break;
  }

  return newGameState;
};
