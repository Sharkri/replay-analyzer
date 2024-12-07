import { PIECE_BAG } from "../types/game-state";
import { Piece } from "./piece";

const RNG_SEED = 2147483647;

export class GameRNG {
  seed: number;
  constructor(seed: number) {
    this.seed = seed % RNG_SEED;
    if (this.seed <= 0) {
      this.seed += RNG_SEED - 1;
      this.seed = this.seed || 1;
    }
  }

  next() {
    this.seed = (16807 * this.seed) % RNG_SEED;
    return this.seed;
  }

  nextFloat() {
    return (this.next() - 1) / (RNG_SEED - 1);
  }

  shuffleArray(arr: Piece[]) {
    let n = arr.length;
    for (; n > 1; n--) {
      let t = Math.floor(this.nextFloat() * n);
      [arr[n - 1], arr[t]] = [arr[t], arr[n - 1]];
    }

    return arr;
  }

  getNextBag(bags = 1) {
    const queue = [];

    for (let i = 0; i < bags; i++) {
      queue.push(...this.shuffleArray([...PIECE_BAG]));
    }

    return queue as Piece[];
  }
}
