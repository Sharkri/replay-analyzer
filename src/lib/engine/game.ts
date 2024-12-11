import { BOARD_WIDTH } from "../types/game-options";
import {
  Board,
  BoardRow,
  GameState,
  GarbageQueued,
  PieceData,
  Rotation,
} from "../types/game-state";
import { GameCommand } from "../types/ttrm";
import { I_KICKS, Piece, PIECE_MATRICES, WALLKICKS } from "./piece";

export type Command = GameCommand | "dasLeft" | "dasRight";

export const PIECE_SPAWN = 21;

export const getMatrix = ({ piece, rotation }: PieceData) =>
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

const clearLines = (board: Board) => {
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
    queue: gameQueue,
    current: current.piece_data,
    board,
    dead: false,
    canHold: true,
    garbageQueued: [],
  };
};

export const placePiece = (board: Board, pieceData: PieceData) => {
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

export function addGarbage(board: Board, garbage: GarbageQueued) {
  for (let i = 0; i < garbage.amt; i++) {
    const line: BoardRow = Array.from({ length: 10 }, () => "G");
    line[garbage.column] = null;
    board.unshift(line);
  }
}

export const hardDrop = (state: GameState) => {
  sonicDrop(state);
  // TODO: immobile checks and garbage + a bunch of others
  placePiece(state.board, state.current);
  const clearedLines = clearLines(state.board);

  const nextPiece = state.queue.shift();
  if (!nextPiece) throw new Error("Queue is empty");

  if (clearedLines == 0) {
    while (state.garbageQueued.length > 0) {
      const garbage = state.garbageQueued.shift();
      if (garbage != null) addGarbage(state.board, garbage);
    }
  }

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
    return false;
  }

  return true;
};
export const moveRight = (state: GameState) => {
  if (state.dead) throw new Error("Cannot act when dead");
  state.current.x += 1;

  if (checkCollision(state.board, state.current)) {
    state.current.x -= 1;
    return false;
  }

  return true;
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

  let { collides, piece_data } = state.held
    ? spawnPiece(state.board, state.held)
    : spawnPiece(state.board, state.queue.shift()!);

  // Swap current and held
  state.held = state.current.piece;

  state.dead = collides;
  state.current = piece_data;

  state.canHold = false;
};

export const executeCommand = (command: Command, state: GameState) => {
  const newGameState = structuredClone(state);

  switch (command) {
    case "hardDrop":
      hardDrop(newGameState);
      break;
    case "moveLeft":
      moveLeft(newGameState);
      break;
    case "moveRight":
      moveRight(newGameState);
      break;
    case "rotateCW":
      rotateCW(newGameState);
      break;
    case "rotateCCW":
      rotateCCW(newGameState);
      break;
    case "softDrop":
      // TODO: soft drop should not always be max
      softDrop(newGameState);
      break;
    case "hold":
      hold(newGameState);
      break;
    case "rotate180":
      console.log("180 not implemented yet...");
      break;
    case "dasLeft":
      while (moveLeft(newGameState)) {}
      break;
    case "dasRight":
      while (moveRight(newGameState)) {}
      break;

    default:
      console.log("Invalid command: ", command);
      break;
  }

  return newGameState;
};

export const executeCommands = (commands: Command[], state: GameState) => {
  let newState = state;
  // probably not the most efficient to use structuredClone a bunch of times but its probably fine
  for (const command of commands) {
    newState = executeCommand(command, newState);
  }

  return newState;
};
