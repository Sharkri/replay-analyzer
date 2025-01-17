import { BoardRow, GameState } from "../types/game-state";
import { GameOptions } from "../types/ttrm";
import { ATTACK_TABLE } from "./game-options";
import { nextFloat } from "./rng";

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

  let attack = 0;
  let b2bCount = b2b;
  let newCombo = combo + 1;

  if (immobile && current.piece === "T") {
    // TODO: tsm is detected as tss
    if (clearedLines === 1) attack += ATTACK_TABLE.tss;
    else if (clearedLines === 2) attack += ATTACK_TABLE.tsd;
    else if (clearedLines === 3) attack += ATTACK_TABLE.tst;
    b2bCount++;
  } else {
    switch (clearedLines) {
      case 1:
        attack += ATTACK_TABLE.single;
        if (options.spinbonuses === "all-mini" && immobile) b2bCount++;
        else b2bCount = 0;
        break;
      case 2:
        attack += ATTACK_TABLE.double;
        if (options.spinbonuses === "all-mini" && immobile) b2bCount++;
        else b2bCount = 0;
        break;
      case 3:
        attack += ATTACK_TABLE.triple;
        if (options.spinbonuses === "all-mini" && immobile) b2bCount++;
        else b2bCount = 0;
        break;
      case 4:
        attack += ATTACK_TABLE.quad;
        b2bCount++;
        break;
    }
  }

  if (b2bCount > 1) {
    attack += ATTACK_TABLE.b2b;
  }

  const surgeBreak =
    options.b2bcharging && b2b > options.b2bcharge_base && b2bCount === 0;
  if (surgeBreak) {
    attack += b2b;
  }

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

    const { float, nextSeed } = nextFloat(state.rngex);
    const column = Math.floor(float * 10);
    state.rngex = nextSeed;

    while (garbageSum < garbagecap && garbage.amt--) {
      let line = generateGarbage(column);
      state.board.unshift(line);

      garbageSum++;
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
