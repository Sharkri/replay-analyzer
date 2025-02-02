import { Board, GameState } from "../types/game-state";
import { GameCommand, GameOptions } from "../types/ttrm";
import { spawnPiece } from "./game-matrix";
import {
  drop,
  hardDrop,
  hold,
  moveLeft,
  moveRight,
  rotate180,
  rotateCCW,
  rotateCW,
  softDrop,
} from "./game-actions";
import { getNextBag, getRngSeed } from "./rng";

export type Command = GameCommand | "dasLeft" | "dasRight" | "drop";

export const createGameState = (bags: number, seed: number): GameState => {
  const board: Board = [];

  let rng = getRngSeed(seed);
  const bag = getNextBag(rng, bags);
  rng = bag.nextSeed;

  const gameQueue = [...bag.queue];

  const current = spawnPiece(board, gameQueue.shift() || "I", 0);

  return {
    queue: gameQueue,
    current: current.piece_data,
    board,
    dead: false,
    canHold: true,
    garbageQueued: [],
    b2b: 0,
    combo: 0,
    attackQueued: [],
    piecesPlaced: 0,
    rng,
    rngex: getRngSeed(seed),
    lastcolumn: null,
    iid: 0,
    tspinType: null,
  };
};

export const executeCommand = (
  command: Command,
  state: GameState,
  frame: number,
  options: GameOptions
) => {
  const newGameState = structuredClone(state);

  switch (command) {
    case "hardDrop":
      hardDrop(newGameState, frame, options);
      break;
    case "moveLeft":
      moveLeft(newGameState);
      break;
    case "moveRight":
      moveRight(newGameState);
      break;
    case "rotateCW":
      rotateCW(newGameState);
      break;
    case "rotateCCW":
      rotateCCW(newGameState);
      break;
    case "softDrop":
      // TODO: soft drop should not always be max
      softDrop(newGameState);
      break;
    case "drop":
      drop(newGameState);
      break;
    case "hold":
      hold(newGameState, frame);
      break;
    case "rotate180":
      rotate180(newGameState);
      break;
    case "dasLeft":
      while (moveLeft(newGameState)) {}
      break;
    case "dasRight":
      while (moveRight(newGameState)) {}
      break;

    default:
      console.log("Invalid command: ", command);
      break;
  }

  return newGameState;
};

export const executeCommands = (
  commands: Command[],
  state: GameState,
  frame: number,
  options: GameOptions
) => {
  let newState = state;
  // probably not the most efficient to use structuredClone a bunch of times but its probably fine
  for (const command of commands) {
    newState = executeCommand(command, newState, frame, options);
  }
  return newState;
};
