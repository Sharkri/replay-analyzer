import { useState, useCallback } from "react";
import { Round, ReplayEvent, Handling } from "@/lib/types/ttrm";
import { Command, createGameState, executeCommands } from "@/lib/engine/game";
import {
  getHeldKeyCommands,
  processKeyDown,
  handleKeyUp,
  HeldKeys,
  handleIGEEvent,
} from "@/lib/engine/event-replay";
import { GameState } from "@/lib/types/game-state";
import { PIECE_SPAWN } from "@/lib/engine/game-options";

type PlayerState = {
  heldKeys: HeldKeys;
  eventIndex: number;
  gameState: GameState;
};

export const useRoundState = (round: Round[]) => {
  const [playerStates, setPlayerStates] = useState<PlayerState[]>(
    round.map((player) => {
      const { seed } = player.replay.options;

      const gameState = createGameState(10, seed);
      const heldKeys = {
        moveLeft: null,
        moveRight: null,
        softDrop: null,
      } as HeldKeys;

      return { heldKeys, eventIndex: 0, gameState };
    })
  );

  const processEvent = useCallback(
    (event: ReplayEvent, heldKeys: HeldKeys, handling: Handling) => {
      let newHeldKeys = structuredClone(heldKeys);
      const commands: Command[] = [];
      let garbage = null;

      switch (event.type) {
        case "start":
          console.log(`Game started at frame ${event.frame}`);
          break;
        case "keydown":
          commands.push(...getHeldKeyCommands(event, heldKeys, handling));
          const data = processKeyDown(event, newHeldKeys);
          newHeldKeys = data.heldKeys;
          commands.push(data.key);
          break;
        case "keyup":
          handleKeyUp(event, newHeldKeys);
          commands.push(...getHeldKeyCommands(event, heldKeys, handling));
          break;
        case "ige":
          garbage = handleIGEEvent(event);
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

  const processEvents = (
    player: PlayerState,
    round: Round,
    targetFrame: number
  ) => {
    let { eventIndex, gameState, heldKeys } = player;
    const { events, options } = round.replay;

    let newState = structuredClone(gameState);

    let i = eventIndex;
    for (; i < events.length; i++) {
      const event = events[i];
      // if target frame is reached, exit
      if (event.frame > targetFrame) {
        break;
      }

      // process events and apply changes
      const evt = processEvent(event, heldKeys, options.handling);
      if (evt.garbage) newState.garbageQueued.push(evt.garbage);
      // initial tick of gravity
      if (
        event.frame > newState.current.spawnFrame &&
        newState.current.y === PIECE_SPAWN
      ) {
        evt.commands.unshift("drop");
      }

      newState = executeCommands(evt.commands, newState, event.frame, options);
      heldKeys = evt.newHeldKeys;
    }

    return {
      ...player,
      eventIndex: i,
      gameState: newState,
      heldKeys,
    };
  };

  const handleNextFrame = useCallback(
    (frameIncrement: number) => {
      setPlayerStates((prevStates) => {
        // Calculate the min next frame across all players
        const nextFrame = Math.min(
          ...prevStates.map((state, idx) => {
            const { eventIndex } = state;
            const { replay } = round[idx];
            const event = replay.events[eventIndex];
            return event ? event.frame : Infinity;
          })
        );
        if (nextFrame === Infinity) return prevStates;

        // Process all players up to the target frame
        return prevStates.map((state, idx) => {
          const targetFrame = nextFrame + frameIncrement;
          const newState = processEvents(state, round[idx], targetFrame);
          return newState;
        });
      });
    },
    [round, processEvents]
  );

  return { playerStates, handleNextFrame };
};
