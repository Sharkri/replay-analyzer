import { KeyEvent, ReplayEvent, Round } from "@/lib/types/ttrm";
import { Button } from "../ui/button";
import { useState } from "react";
import {
  Command,
  createGameState,
  executeCommand,
  executeCommands,
} from "@/lib/engine/game";
import { GameRNG } from "@/lib/engine/rng";
import BoardCanvas from "./board-canvas";
import { GameState } from "@/lib/types/game-state";

type HeldKey = { frame: number; order: number };
type HeldKeys = Record<string, HeldKey>;

export const ReplayRound = ({ round }: { round: Round }) => {
  const { replay } = round;

  const rng = new GameRNG(replay.options.seed);

  const [event, setEvent] = useState(0);
  const [gameState, setGameState] = useState(
    createGameState(rng.getNextBag(10))
  );
  const [heldKeys, setHeldKeys] = useState<HeldKeys>({});

  const processEvent = (
    event: ReplayEvent,
    gameState: GameState,
    heldKeys: HeldKeys
  ) => {
    let newState = gameState;
    let newHeldKeys = structuredClone(heldKeys);

    switch (event.type) {
      case "start":
        console.log(`Game started at frame ${event.frame}`);
        break;

      case "keydown":
        newState = executeCommands(getFrameCommands(event, heldKeys), newState);
        newState = handleKeyDown(event, newState, newHeldKeys);
        break;

      case "keyup":
        handleKeyUp(event, newHeldKeys);
        newState = executeCommands(getFrameCommands(event, heldKeys), newState);
        break;

      case "ige":
        handleIGEEvent(event.data);
        break;

      case "end":
        console.log(`Game ended at frame ${event.frame}`);
        break;

      default:
        console.error(`Unknown event type: ${event}`);
    }

    return { newState, newHeldKeys };
  };

  const handleKeyDown = (
    event: KeyEvent,
    gameState: GameState,
    heldKeys: HeldKeys
  ) => {
    const { data, frame } = event;

    console.log(`Key pressed: ${data.key} at frame ${frame}`);
    const currFrame = frame + data.subframe;

    Object.keys(heldKeys).forEach((k) => {
      if (data.key === "moveLeft" && heldKeys.moveRight) {
        heldKeys.moveRight = { frame: currFrame, order: 0 };
      } else if (data.key === "moveRight" && heldKeys.moveLeft) {
        heldKeys.moveLeft = { frame: currFrame, order: 0 };
      }

      heldKeys[k].order += 1;
    });
    heldKeys[data.key] = { frame: currFrame, order: 0 };

    return executeCommand(data.key, gameState);
  };

  const handleKeyUp = (event: KeyEvent, heldKeys: HeldKeys) => {
    const { frame, data } = event;

    console.log("released key:", data.key, "frame", frame + data.subframe);
    delete heldKeys[data.key];
  };

  const handleIGEEvent = (data: unknown) => {
    console.log(`Processing IGE event:`, data);
    // Add logic to handle IGE events based on their structure
  };

  const getFrameCommands = (event: KeyEvent, heldKeys: HeldKeys) => {
    const { das, arr } = replay.options.handling;
    const currentFrame = event.frame + event.data.subframe;
    const commands: Command[] = [];

    console.log(heldKeys);

    const keys = Object.entries(heldKeys);
    keys.sort(([, a], [, b]) => b.order - a.order);

    keys.forEach(([key, pressTime]) => {
      if (key == "moveLeft" || key == "moveRight") {
        const framesHeld = currentFrame - pressTime.frame;
        if (framesHeld >= das) {
          // DAS threshold reached, trigger ARR
          const arrFrames = framesHeld - das;

          // Trigger movement at every ARR interval
          if (arr === 0 || arrFrames % arr === 0) {
            commands.push(key === "moveLeft" ? "dasLeft" : "dasRight");
          }
        }
      } else if (key == "softDrop") {
        commands.push(key);
      }
    });

    return commands;
  };

  return (
    <div>
      <Button
        onClick={() => {
          const { newState, newHeldKeys } = processEvent(
            replay.events[event],
            gameState,
            heldKeys
          );
          setHeldKeys(newHeldKeys);
          setGameState(newState); // Set state after processing
          setEvent((prev) => prev + 1);
        }}
      >
        Next Event
      </Button>

      <Button
        onClick={() => {
          let newGameState = gameState;
          let newHeldKeys = heldKeys;
          let currEvent = 0;

          for (; currEvent < 5; currEvent++) {
            let a = processEvent(
              replay.events[event + currEvent],
              newGameState,
              newHeldKeys
            );
            newGameState = a.newState;
            newHeldKeys = a.newHeldKeys;
          }
          setEvent((prev) => prev + currEvent);
          setGameState(newGameState); // Set state after batch processing
          setHeldKeys(newHeldKeys);
        }}
      >
        Next Piece
      </Button>

      {round.username}

      <BoardCanvas gameState={gameState} />
    </div>
  );
};
