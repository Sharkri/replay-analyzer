import { GameState, Rotation } from "../types/game-state";
import { addGarbage, calculateAttack, cancelGarbage } from "./game-helpers";
import {
  checkCollision,
  checkImmobile,
  clearLines,
  placePiece,
  spawnPiece,
  tryWallKicks,
} from "./game-matrix";
import { DEFAULT_OPTIONS } from "./game-options";

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

const rotate = (state: GameState, direction: 1 | -1) => {
  if (state.dead) throw new Error("Cannot act when dead");
  const delta = direction === 1 ? 1 : 3;
  const newRotation = ((state.current.rotation + delta) % 4) as Rotation;
  const wallKickData = tryWallKicks(state.board, state.current, newRotation);
  if (wallKickData.success) state.current = wallKickData.pieceData;
};
export const rotateCW = (state: GameState) => rotate(state, 1);
export const rotateCCW = (state: GameState) => rotate(state, -1);
export const rotate180 = (state: GameState) => {
  if (state.dead) throw new Error("Cannot act when dead");
  const newRotation = ((state.current.rotation + 2) % 4) as Rotation;
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
  state.current = piece_data;

  state.canHold = false;
  state.dead = collides;
};

export const hardDrop = (state: GameState, frame: number) => {
  const options = DEFAULT_OPTIONS;
  sonicDrop(state);
  // note: immobile check must be before placing piece
  const immobile = checkImmobile(state.board, state.current);

  placePiece(state.board, state.current);
  const clearedLines = clearLines(state.board);

  let { attack, b2b, combo } = calculateAttack(state, clearedLines, immobile);
  state.b2b = b2b;
  state.combo = combo;

  if (attack > 0) state.attackQueued.push({ frame, amt: attack });
  cancelGarbage(state, options);

  console.log({ attack, b2b, qed: state.garbageQueued, clearedLines });

  if (clearedLines == 0) {
    state.garbageQueued = state.garbageQueued.filter((garbage) => {
      const diff = frame - garbage.frame;
      if (diff <= options.garbagespeed) return true;

      addGarbage(state.board, garbage);
      return false;
    });
  }

  const nextPiece = state.queue.shift();
  if (!nextPiece) throw new Error("Queue is empty");
  const { collides, piece_data } = spawnPiece(state.board, nextPiece);
  state.dead = collides;
  state.current = piece_data;

  state.canHold = true;
};
