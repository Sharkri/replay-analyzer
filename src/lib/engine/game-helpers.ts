import { BoardRow, GameState } from "../types/game-state";
import { GameOptions } from "../types/ttrm";
import {
  ATTACK_TABLE,
  COMBO_BONUS,
  COMBO_MINIFIER,
  COMBO_MINIFIER_LOG,
} from "./game-options";
import { next, nextFloat } from "./rng";

export const calculateAttack = (
  state: GameState,
  clearedLines: number,
  immobile: boolean,
  options: GameOptions
) => {
  const { b2b, combo, current } = state;

  if (clearedLines == 0) {
    return { b2b, attack: 0, combo: 0 };
  }

  const attackTable = { ...ATTACK_TABLE, pc: options.allclear_garbage };

  let attack = 0;
  let b2bCount = b2b;
  let newCombo = combo + 1;

  if (immobile && current.piece === "T") {
    // TODO: tsm is detected as tss
    if (clearedLines === 1) attack += attackTable.tss;
    else if (clearedLines === 2) attack += attackTable.tsd;
    else if (clearedLines === 3) attack += attackTable.tst;
    b2bCount++;
  } else {
    switch (clearedLines) {
      case 1:
        attack += attackTable.single;
        if (options.spinbonuses.includes("all-mini") && immobile) b2bCount++;
        else b2bCount = 0;
        break;
      case 2:
        attack += attackTable.double;
        if (options.spinbonuses.includes("all-mini") && immobile) b2bCount++;
        else b2bCount = 0;
        break;
      case 3:
        attack += attackTable.triple;
        if (options.spinbonuses.includes("all-mini") && immobile) b2bCount++;
        else b2bCount = 0;
        break;
      case 4:
        attack += attackTable.quad;
        b2bCount++;
        break;
    }
  }

  if (b2bCount > 1) {
    attack += attackTable.b2b;
  }

  if (options.combotable === "multiplier") {
    attack *= 1 + COMBO_BONUS * (newCombo - 1);
    if (newCombo > 2) {
      attack = Math.max(
        Math.log(COMBO_MINIFIER * (newCombo - 1) * COMBO_MINIFIER_LOG + 1),
        attack
      );
    }
  }

  const surgeBreak =
    options.b2bcharging && b2b > options.b2bcharge_base && b2bCount === 0;
  if (surgeBreak) {
    attack += b2b;
  }

  // round down
  attack = Math.floor(attack);

  return { b2b: b2bCount, attack, combo: newCombo };
};

export const processGarbageQueued = (
  state: GameState,
  options: GameOptions,
  frame: number
) => {
  const { garbagecap, garbagespeed } = options;

  let garbageSum = 0;

  for (const garbage of state.garbageQueued) {
    const active = frame - garbage.frame > garbagespeed;
    if (!active) continue;

    while (garbageSum < garbagecap && garbage.amt--) {
      let column = state.lastcolumn;

      if (column == null || (state.rngex = next(state.rngex)) < 0) {
        const { float, nextSeed } = nextFloat(state.rngex);
        state.lastcolumn = Math.floor(float * 10);
        column = state.lastcolumn;
        state.rngex = nextSeed;
      }

      let line = generateGarbage(column);
      state.board.unshift(line);

      garbageSum++;
    }

    if (garbage.amt <= 0) {
      state.rngex = next(state.rngex);

      const { float, nextSeed } = nextFloat(state.rngex);
      state.lastcolumn = Math.floor(float * 10);
      state.rngex = nextSeed;
    }

    if (garbageSum >= garbagecap) break;
  }

  state.garbageQueued = state.garbageQueued.filter(
    (garbage) => garbage.amt > 0
  );
};

export const generateGarbage = (emptyIndex: number) => {
  const line: BoardRow = Array.from({ length: 10 }, () => "G");
  line[emptyIndex] = null;
  return line;
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
