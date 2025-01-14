import { PIECE_BAG } from "../types/game-state";
import { Piece } from "./piece";

const RNG_SEED = 2147483647;

export const getRngSeed = (seed: number) => {
  let rngSeed = seed % RNG_SEED;
  if (rngSeed <= 0) {
    rngSeed += RNG_SEED - 1;
    rngSeed = rngSeed || 1;
  }

  return rngSeed;
};

export const next = (seed: number) => (16807 * seed) % RNG_SEED;
export const nextFloat = (seed: number) => {
  const nextSeed = next(seed);
  return { float: (nextSeed - 1) / (RNG_SEED - 1), nextSeed };
};

export const shuffleArray = (arr: Piece[], seed: number) => {
  let n = arr.length;
  const newArray = [...arr];
  let currSeed = seed;

  for (; n > 1; n--) {
    const { float, nextSeed } = nextFloat(currSeed);
    const t = Math.floor(float * n);
    [newArray[n - 1], newArray[t]] = [newArray[t], newArray[n - 1]];
    currSeed = nextSeed;
  }

  return { shuffled: newArray, nextSeed: currSeed };
};

export const getNextBag = (seed: number, bags = 1) => {
  let currSeed = seed;
  const queue: Piece[] = [];

  for (let i = 0; i < bags; i++) {
    const { shuffled, nextSeed } = shuffleArray([...PIECE_BAG], currSeed);
    queue.push(...shuffled);
    currSeed = nextSeed;
  }

  return { queue, nextSeed: currSeed };
};
