import { Board, BoardRow, GameState, GarbageQueued } from "../types/game-state";
import { ATTACK_TABLE, Options } from "./game-options";

export const calculateAttack = (
  state: GameState,
  clearedLines: number,
  immobile: boolean
) => {
  const { b2b, combo, current } = state;

  if (clearedLines == 0) {
    return { b2b, attack: 0, combo: 0 };
  }

  let attack = 0;
  let isB2B = false;
  let newCombo = combo + 1;

  if (immobile && current.piece === "T") {
    if (clearedLines === 1) attack += ATTACK_TABLE.tss;
    else if (clearedLines === 2) attack += ATTACK_TABLE.tsd;
    else if (clearedLines === 3) attack += ATTACK_TABLE.tst;
    isB2B = true;
  } else {
    switch (clearedLines) {
      case 1:
        attack += ATTACK_TABLE.single;
        isB2B = false;
        break;
      case 2:
        attack += ATTACK_TABLE.double;
        isB2B = false;
        break;
      case 3:
        attack += ATTACK_TABLE.triple;
        isB2B = false;
        break;
      case 4:
        attack += ATTACK_TABLE.quad;
        isB2B = true;
        break;

      default:
        break;
    }
  }

  if (isB2B) {
    attack += ATTACK_TABLE.b2b;
  }

  return { b2b: isB2B, attack, combo: newCombo };
};

export const addGarbage = (board: Board, garbage: GarbageQueued) => {
  for (let i = 0; i < garbage.amt; i++) {
    const line: BoardRow = Array.from({ length: 10 }, () => "G");
    line[garbage.column] = null;
    board.unshift(line);
  }
};

/**
 * Cancels garbageQueued using attackQueued.
 * It modifies the gameState in place.
 * @param state The current state of the game.
 */
export const cancelGarbage = (state: GameState, options: Options) => {
  let attackIndex = 0;
  let garbageIndex = 0;

  while (
    attackIndex < state.attackQueued.length &&
    garbageIndex < state.garbageQueued.length
  ) {
    const attack = state.attackQueued[attackIndex];
    const garbage = state.garbageQueued[garbageIndex];

    const frameDiff = Math.abs(attack.frame - garbage.cancelFrame);
    if (frameDiff > options.garbagespeed) {
      attackIndex++;
      continue;
    }

    if (attack.amt >= garbage.amt) {
      attack.amt -= garbage.amt;
      state.garbageQueued.splice(garbageIndex, 1);

      // move to next attack index if fully used
      if (attack.amt === 0) attackIndex++;
    } else {
      // partial cancel garbage with attack
      garbage.amt -= attack.amt;
      attackIndex++;
    }
  }

  // Remove any attacks that have been fully used
  state.attackQueued = state.attackQueued.slice(attackIndex);
};
