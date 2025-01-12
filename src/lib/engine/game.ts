import { Board, GameState } from "../types/game-state";
import { GameCommand } from "../types/ttrm";
import { Piece } from "./piece";
import { spawnPiece } from "./game-matrix";
import {
  hardDrop,
  hold,
  moveLeft,
  moveRight,
  rotateCCW,
  rotateCW,
  softDrop,
} from "./game-actions";

export type Command = GameCommand | "dasLeft" | "dasRight";

export const createGameState = (queue: Piece[]): GameState => {
  const board: Board = [];

  const gameQueue = [...queue];
  const current = spawnPiece(board, gameQueue.shift() || "I");

  return {
    queue: gameQueue,
    current: current.piece_data,
    board,
    dead: false,
    canHold: true,
    garbageQueued: [],
    b2b: false,
    combo: 0,
    attackQueued: [],
  };
};

export const executeCommand = (
  command: Command,
  state: GameState,
  frame: number
) => {
  const newGameState = structuredClone(state);

  switch (command) {
    case "hardDrop":
      hardDrop(newGameState, frame);
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
    case "hold":
      hold(newGameState);
      break;
    case "rotate180":
      console.log("180 not implemented yet...");
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
  frame: number
) => {
  let newState = state;
  // probably not the most efficient to use structuredClone a bunch of times but its probably fine
  for (const command of commands) {
    newState = executeCommand(command, newState, frame);
  }
  return newState;
};
