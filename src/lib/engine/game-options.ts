export const BLOCK_SIZE = 40;
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const X_OFFSET = 160;
export const Y_OFFSET = 120;

export const ATTACK_TABLE = {
  single: 0,
  double: 1,
  triple: 2,
  quad: 4,
  tsd: 4,
  tss: 2,
  tst: 6,
  pc: 10,
  b2b: 1,
};

export const DEFAULT_OPTIONS: Options = {
  garbagespeed: 20,
};

export type Options = { garbagespeed: number };
