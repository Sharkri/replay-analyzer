export const BLOCK_SIZE = 30;
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const X_OFFSET = 160;
export const Y_OFFSET = 320;

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
export const COMBO_TABLE = {
  none: [0],
  multiplier: [0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4],
};

export const COMBO_MINIFIER = 1;
export const COMBO_MINIFIER_LOG = 1.25;
export const COMBO_BONUS = 0.25;

export const PIECE_SPAWN = 22;
