import { GameState, Rotation } from "../types/game-state";
import { GameOptions } from "../types/ttrm";
import {
  processGarbageQueued,
  calculateAttack,
  fightLines,
} from "./game-helpers";
import {
  checkCollision,
  checkImmobile,
  clearLines,
  placePiece,
  spawnPiece,
  tryWallKicks,
} from "./game-matrix";
import { getNextBag } from "./rng";

export const moveLeft = (state: GameState) => {
  if (state.dead) console.error("Cannot act when dead");
  state.current.x -= 1;

  if (checkCollision(state.board, state.current)) {
    state.current.x += 1;
    return false;
  }

  return true;
};
export const moveRight = (state: GameState) => {
  if (state.dead) console.error("Cannot act when dead");
  state.current.x += 1;

  if (checkCollision(state.board, state.current)) {
    state.current.x -= 1;
    return false;
  }

  return true;
};

const rotate = (state: GameState, direction: 1 | -1) => {
  if (state.dead) console.error("Cannot act when dead");
  const delta = direction === 1 ? 1 : 3;
  const newRotation = ((state.current.rotation + delta) % 4) as Rotation;
  const wallKickData = tryWallKicks(state.board, state.current, newRotation);

  if (wallKickData.success) {
    state.current = wallKickData.pieceData;
  }
};
export const rotateCW = (state: GameState) => rotate(state, 1);
export const rotateCCW = (state: GameState) => rotate(state, -1);
export const rotate180 = (state: GameState) => {
  if (state.dead) console.error("Cannot act when dead");
  const newRotation = ((state.current.rotation + 2) % 4) as Rotation;
  const wallKickData = tryWallKicks(state.board, state.current, newRotation);
  if (wallKickData.success) {
    state.current = wallKickData.pieceData;
  }
};

export const softDrop = (state: GameState) => {
  if (state.dead) console.error("Cannot act when dead");

  while (!checkCollision(state.board, state.current)) {
    state.current.y -= 1;
  }
  state.current.y += 1;
};
export const drop = (state: GameState) => {
  if (state.dead) console.error("Cannot act when dead");

  state.current.y -= 1;

  if (checkCollision(state.board, state.current)) {
    state.current.y += 1;
  }
};

export const sonicDrop = (state: GameState) => {
  if (state.dead) console.error("Cannot act when dead");

  while (!checkCollision(state.board, state.current)) {
    state.current.y -= 1;
  }
  state.current.y += 1;
};

export const hold = (state: GameState, frame: number) => {
  if (state.dead) console.error("Cannot act when dead");
  if (!state.canHold) return;

  let { collides, piece_data } = state.held
    ? spawnPiece(state.board, state.held, frame + 1)
    : spawnPiece(state.board, state.queue.shift()!, frame + 1);

  // Swap current and held
  state.held = state.current.piece;
  state.current = piece_data;

  state.canHold = false;
  state.dead = collides;
};

export const hardDrop = (
  state: GameState,
  frame: number,
  options: GameOptions
) => {
  state.piecesPlaced++;

  const immobile = checkImmobile(state.board, state.current);

  sonicDrop(state);
  placePiece(state.board, state.current);

  const { clearedLines, isGarbageClear } = clearLines(state.board);

  let { attack, b2b, combo, surgeAttack } = calculateAttack(
    state,
    clearedLines,
    isGarbageClear,
    immobile,
    options
  );
  state.b2b = b2b;
  state.combo = combo;

  const doubled = state.piecesPlaced < options.openerphase;

  const attackSegments = surgeAttack;
  if (attack > 0) attackSegments.push(attack);

  for (const segment of attackSegments) {
    const bonusAmt = doubled ? segment : 0;
    const attackLine = fightLines(state, segment, bonusAmt, frame, options);
    if (attackLine) {
      state.attackQueued.push(attackLine);
    }
  }

  if (clearedLines == 0) processGarbageQueued(state, options, frame);

  if (state.queue.length < 7) {
    const bag = getNextBag(state.rng, 5);
    state.queue.push(...bag.queue);
    state.rng = bag.nextSeed;
  }

  const nextPiece = state.queue.shift()!;
  const { collides, piece_data } = spawnPiece(
    state.board,
    nextPiece,
    frame + 1
  );
  state.dead = collides;
  state.current = piece_data;
  state.canHold = true;
};
