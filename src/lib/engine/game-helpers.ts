import { Board, BoardRow, GameState, GarbageQueued } from "../types/game-state";
import { GameOptions } from "../types/ttrm";
import { ATTACK_TABLE } from "./game-options";

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
  let isB2BClear = false;
  let newCombo = combo + 1;

  if (immobile && current.piece === "T") {
    if (clearedLines === 1) attack += ATTACK_TABLE.tss;
    else if (clearedLines === 2) attack += ATTACK_TABLE.tsd;
    else if (clearedLines === 3) attack += ATTACK_TABLE.tst;
    isB2BClear = true;
  } else {
    switch (clearedLines) {
      case 1:
        attack += ATTACK_TABLE.single;
        isB2BClear = false;
        break;
      case 2:
        attack += ATTACK_TABLE.double;
        isB2BClear = false;
        break;
      case 3:
        attack += ATTACK_TABLE.triple;
        isB2BClear = false;
        break;
      case 4:
        attack += ATTACK_TABLE.quad;
        isB2BClear = true;
        break;
      default:
        break;
    }
  }

  if (b2b && isB2BClear) {
    attack += ATTACK_TABLE.b2b;
  }

  return { b2b: isB2BClear, attack, combo: newCombo };
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
export const cancelGarbage = (state: GameState, options: GameOptions) => {
  let attackIndex = 0;
  let garbageIndex = 0;

  while (
    attackIndex < state.attackQueued.length &&
    garbageIndex < state.garbageQueued.length
  ) {
    const attack = state.attackQueued[attackIndex];
    const garbage = state.garbageQueued[garbageIndex];

    const frameDiff = garbage.cancelFrame - attack.frame;
    if (frameDiff > options.garbagespeed) {
      attackIndex++;
      continue;
    }

    // Effective attack: double during opener phase, otherwise normal
    const effectiveAttack = attack.doubled ? attack.amt * 2 : attack.amt;

    if (effectiveAttack >= garbage.amt) {
      const leftover = effectiveAttack - garbage.amt;

      // halve leftover attack in opener phase to account for the x2
      attack.amt = attack.doubled ? Math.floor(leftover / 2) : leftover;

      state.garbageQueued.splice(garbageIndex, 1);

      if (attack.amt === 0) attackIndex++;
    } else {
      // Partially cancel garbage with attack
      const leftoverGarbage = garbage.amt - effectiveAttack;
      garbage.amt = leftoverGarbage;

      attack.amt = 0;
      attackIndex++;
    }
  }

  // Remove fully used attacks
  state.attackQueued = state.attackQueued.filter((a) => a.amt > 0);
};
