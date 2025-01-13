import { useState, useCallback } from "react";
import { Player, ReplayEvent } from "@/lib/types/ttrm";
import { Command, createGameState, executeCommands } from "@/lib/engine/game";
import { GameRNG } from "@/lib/engine/rng";
import {
  getHeldKeyCommands,
  processKeyDown,
  handleKeyUp,
  HeldKeys,
  handleIGEEvent,
} from "@/lib/engine/event-replay";

export const useRoundState = (round: Player[]) => {
  const [playerStates, setPlayerStates] = useState(
    round.map((player) => {
      const { seed } = player.replay.options;
      const [rng, rngex] = [new GameRNG(seed), new GameRNG(seed)];
      const gameState = createGameState(rng.getNextBag(10));
      const heldKeys = {
        moveLeft: null,
        moveRight: null,
        softDrop: null,
      } as HeldKeys;

      return { heldKeys, rng, rngex, eventIndex: 0, gameState };
    })
  );

  const processEvent = useCallback(
    (event: ReplayEvent, heldKeys: HeldKeys, handling: any, rngex: GameRNG) => {
      let newHeldKeys = structuredClone(heldKeys);
      const commands: Command[] = [];
      let garbage = null;

      switch (event.type) {
        case "start":
          console.log(`Game started at frame ${event.frame}`);
          break;
        case "keydown":
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
    },
    []
  );

  const handleBatchEvents = useCallback(
    (index: number, count: number) => {
      setPlayerStates((prevStates) =>
        prevStates.map((state, idx) => {
          if (idx !== index) return state;

          let { rngex, eventIndex, gameState, heldKeys } = state;

          const { replay } = round[idx];
          const { events, options } = replay;
          const { handling } = options;
          let newGameState = gameState;

          for (let i = 0; i < count; i++) {
            const event = events[eventIndex + i];
            const evt = processEvent(event, heldKeys, handling, rngex);
            if (evt.garbage) newGameState.garbageQueued.push(evt.garbage);

            newGameState = executeCommands(
              evt.commands,
              newGameState,
              event.frame
            );
            heldKeys = evt.newHeldKeys;
          }

          return {
            ...state,
            eventIndex: eventIndex + count,
            gameState: newGameState,
            heldKeys,
          };
        })
      );
    },
    [round, processEvent]
  );

  return { playerStates, handleBatchEvents };
};
