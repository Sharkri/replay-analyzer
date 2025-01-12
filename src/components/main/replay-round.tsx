import { ReplayEvent, Round } from "@/lib/types/ttrm";
import { Button } from "../ui/button";
import { useState } from "react";
import { Command, createGameState, executeCommands } from "@/lib/engine/game";
import { GameRNG } from "@/lib/engine/rng";
import BoardCanvas from "./board-canvas";
import {
  getHeldKeyCommands,
  processKeyDown,
  handleKeyUp,
  HeldKeys,
  handleIGEEvent,
} from "@/lib/engine/event-replay";

export const ReplayRound = ({ round }: { round: Round }) => {
  const { replay } = round;
  const { events, options } = replay;
  const { handling, seed } = options;

  console.log(seed);

  const rng = new GameRNG(seed);
  const rngex = new GameRNG(seed);

  const [eventIndex, setEventIndex] = useState(0);
  const [gameState, setGameState] = useState(
    createGameState(rng.getNextBag(10))
  );

  const [heldKeys, setHeldKeys] = useState<HeldKeys>({
    moveLeft: null,
    moveRight: null,
    softDrop: null,
  });

  const currEvent = events[eventIndex];

  const processEvent = (event: ReplayEvent, heldKeys: HeldKeys) => {
    let newHeldKeys = structuredClone(heldKeys);
    const commands: Command[] = [];
    let garbage = null;

    switch (event.type) {
      case "start":
        console.log(`Game started at frame ${event.frame}`);
        break;

      case "keydown":
        // important to process the held key commands before the keydown for DAS reasons
        commands.push(...getHeldKeyCommands(event, heldKeys, handling));
        commands.push(processKeyDown(event, newHeldKeys));
        break;

      case "keyup":
        handleKeyUp(event, newHeldKeys);
        commands.push(...getHeldKeyCommands(event, heldKeys, handling));
        break;

      case "ige":
        garbage = handleIGEEvent(event, rngex);
        break;

      case "end":
        console.log(`Game ended at frame ${event.frame}`);
        break;

      default:
        console.error(`Unknown event type: ${event}`);
    }

    return { commands, newHeldKeys, garbage };
  };

  const handleNextEvent = () => {
    const { commands, newHeldKeys, garbage } = processEvent(
      currEvent,
      heldKeys
    );
    setHeldKeys(newHeldKeys);
    setGameState((prev) => {
      if (garbage) prev.garbageQueued.push(garbage);
      return executeCommands(commands, prev, currEvent.frame);
    });
    setEventIndex((prev) => prev + 1);
  };

  const handleBatchEvents = (count: number) => {
    let newGameState = gameState;
    let newHeldKeys = heldKeys;

    for (let i = 0; i < count; i++) {
      const event = events[eventIndex + i];
      let result = processEvent(event, newHeldKeys);
      if (result.garbage) newGameState.garbageQueued.push(result.garbage);

      newGameState = executeCommands(
        result.commands,
        newGameState,
        event.frame
      );

      newHeldKeys = result.newHeldKeys;
    }

    setEventIndex((prev) => prev + count);
    setGameState(newGameState);
    setHeldKeys(newHeldKeys);
  };

  return (
    <div>
      <Button onClick={handleNextEvent}>Next Event</Button>

      <Button onClick={() => handleBatchEvents(5)}>Next Piece</Button>

      {round.username}

      <BoardCanvas gameState={gameState} />
    </div>
  );
};
