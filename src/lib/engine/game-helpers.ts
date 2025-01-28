import { BoardRow, GameState, GarbageQueued } from "../types/game-state";
import { GameOptions } from "../types/ttrm";
import {
  ATTACK_TABLE,
  COMBO_BONUS,
  COMBO_MINIFIER,
  COMBO_MINIFIER_LOG,
} from "./game-options";
import { next, nextFloat } from "./rng";

function splitAttack(amt: number) {
  if (amt <= 0) return [];

  // Base size for each part
  const baseSize = Math.floor(amt / 3);
  const remainder = amt % 3;

  // Split into three parts
  const part1 = baseSize + (remainder > 0 ? 1 : 0); // Add 1 if there's a remainder
  const part2 = baseSize + (remainder > 1 ? 1 : 0); // Add 1 for the second remainder
  const part3 = baseSize; // Smallest part is the last

  // Return as an array
  return [part1, part2, part3];
}

export const calculateAttack = (
  state: GameState,
  clearedLines: number,
  isGarbageClear: boolean,
  immobile: boolean,
  options: GameOptions
) => {
  const { b2b, combo, current } = state;

  if (clearedLines === 0) {
    return { b2b, attack: 0, combo: 0, surgeAttack: [] };
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
    if (options.garbagespecialbonus && isGarbageClear) attack += 1;
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

  let surgeAttack: number[] = [];

  const surgeBreak =
    options.b2bcharging && b2b - 1 > options.b2bcharge_base && b2bCount === 0;
  if (surgeBreak) {
    surgeAttack = splitAttack(b2b - 1);
  }

  // round down
  attack = Math.floor(attack);

  return { b2b: b2bCount, attack, surgeAttack, combo: newCombo };
};

export const processGarbageQueued = (
  state: GameState,
  options: GameOptions,
  frame: number
) => {
  const { garbagecap, garbagespeed } = options;

  let garbageSum = 0;

  for (const garbage of state.garbageQueued) {
    const active =
      garbage.frame != null && frame - garbage.frame > garbagespeed;
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
 * Fights garbage queued with attack
 * It modifies the gameState in place.
 * @param state The current state of the game.
 */
export const fightLines = (
  state: GameState,
  attack: number,
  bonusAmt: number,
  frame: number,
  options: GameOptions
) => {
  let garbageIndex = 0;

  while (
    (attack > 0 || bonusAmt > 0) &&
    garbageIndex < state.garbageQueued.length
  ) {
    const garbage = state.garbageQueued[garbageIndex];

    const frameDiff = garbage.cancelFrame - frame;
    if (frameDiff > options.garbagespeed) {
      garbageIndex++;
      continue;
    }

    // First use attack.amt to cancel garbage
    const cancelFromAmt = Math.min(garbage.amt, attack);

    garbage.amt -= cancelFromAmt;
    attack -= cancelFromAmt;

    // If garbage still remains, use bonusAmt
    if (garbage.amt > 0) {
      const cancelFromBonus = Math.min(garbage.amt, bonusAmt);
      garbage.amt -= cancelFromBonus;
      bonusAmt -= cancelFromBonus;
    }

    // Remove fully canceled garbage
    if (garbage.amt === 0) state.garbageQueued.splice(garbageIndex, 1);
  }

  if (attack > 0) {
    return {
      amt: attack,
      bonusAmt: 0,
      frame,
      iid: ++state.iid,
    };
  }

  return null;
};

export const refreshGarbages = (garbage: GarbageQueued, state: GameState) => {
  let amt = garbage.amt;

  if (state.attackQueued.length > 0) {
    const list = [];

    for (const attack of state.attackQueued) {
      if (attack.iid <= garbage.ackiid) continue;

      const minAmt = Math.min(attack.amt, amt);
      attack.amt -= minAmt;
      amt -= minAmt;

      if (attack.amt > 0) list.push(attack);
    }

    state.attackQueued = list;
  }

  return amt;
};
