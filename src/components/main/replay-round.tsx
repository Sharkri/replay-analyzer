import { GameCommand, ReplayEvent, Round } from "@/lib/types/ttrm";
import { Button } from "../ui/button";
import { useState } from "react";
import { createGameState, executeCommand } from "@/lib/engine/game";
import { GameRNG } from "@/lib/engine/rng";
import BoardCanvas from "./board-canvas";

type Haha = { frame: number; order: number };

export const ReplayRound = ({ round }: { round: Round }) => {
  const { replay } = round;

  const rng = new GameRNG(replay.options.seed);

  const [event, setEvent] = useState(0);
  const [gameState, setGameState] = useState(
    createGameState(rng.getNextBag(10))
  );
  // null or number (the frame at which the key was pressed)
  const [heldKeys, setHeldKeys] = useState<Record<string, null | Haha>>({
    moveLeft: null,
    moveRight: null,
    softDrop: null,
  });

  const processEvent = (event: ReplayEvent) => {
    switch (event.type) {
      case "start":
        console.log(`Game started at frame ${event.frame}`);
        break;

      case "keydown":
        handleFrame(event.frame, event.data.subframe);
        handleKeyDown(event.data.key, event.frame, event.data.subframe);

        break;

      case "keyup":
        handleKeyUp(event.data.key, event.frame, event.data.subframe);
        handleFrame(event.frame, event.data.subframe);

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
  };

  const handleKeyDown = (key: GameCommand, frame: number, subframe: number) => {
    console.log(`Key pressed: ${key} at frame ${frame}`);

    const currFrame = frame + subframe;

    setHeldKeys((prev) => {
      Object.keys(prev).forEach((k) => {
        if (key === "moveLeft" && prev.moveRight !== null) {
          prev.moveRight = { frame: currFrame, order: 0 };
        } else if (key === "moveRight" && prev.moveLeft !== null) {
          prev.moveLeft = { frame: currFrame, order: 0 };
        }

        if (prev[k]) prev[k].order += 1;
      });
      return { ...prev, [key]: { frame: currFrame, order: 0 } };
    });
    setGameState((prevGameState) => executeCommand(key, prevGameState));
  };

  const handleKeyUp = (key: string, frame: number, subframe: number) => {
    console.log("released key:", key, "frame", frame + subframe);
    setHeldKeys((prev) => ({ ...prev, [key]: null }));
  };

  const handleIGEEvent = (data: unknown) => {
    console.log(`Processing IGE event:`, data);
    // Add logic to handle IGE events based on their structure
  };

  const handleFrame = (frame: number, subframe: number) => {
    const { das, arr } = replay.options.handling;

    const currentFrame = frame + subframe;

    console.log(heldKeys);

    const keys = Object.entries(heldKeys).filter(([, v]) => v);
    keys.sort(([, a], [, b]) => b!.order - a!.order);
    // Handle DAS and ARR for left and right
    keys.forEach(([key, pressTime]) => {
      if (pressTime !== null && (key == "moveLeft" || key == "moveRight")) {
        const framesHeld = currentFrame - pressTime.frame;
        if (framesHeld >= das) {
          // DAS threshold reached, trigger ARR
          const arrFrames = framesHeld - das;

          // Trigger movement at every ARR interval
          if (arr === 0 || arrFrames % arr === 0) {
            const command = key === "moveLeft" ? "dasLeft" : "dasRight";
            setGameState((prev) => executeCommand(command, prev));
          }
        }
      }
    });
  };

  return (
    <div>
      <Button
        onClick={() => {
          processEvent(replay.events[event]);
          setEvent((prev) => prev + 1);
        }}
      >
        Next Event
      </Button>

      {round.username}

      <BoardCanvas gameState={gameState} />
    </div>
  );
};
