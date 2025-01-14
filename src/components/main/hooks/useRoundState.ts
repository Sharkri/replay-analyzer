import { useState, useCallback } from "react";
import { Round, ReplayEvent, Handling } from "@/lib/types/ttrm";
import { Command, createGameState, executeCommands } from "@/lib/engine/game";
import { GameRNG } from "@/lib/engine/rng";
import {
  getHeldKeyCommands,
  processKeyDown,
  handleKeyUp,
  HeldKeys,
  handleIGEEvent,
} from "@/lib/engine/event-replay";
import { GameState } from "@/lib/types/game-state";

type PlayerState = {
  heldKeys: HeldKeys;
  rng: GameRNG;
  rngex: GameRNG;
  eventIndex: number;
  gameState: GameState;
};

export const useRoundState = (round: Round[]) => {
  const [playerStates, setPlayerStates] = useState<PlayerState[]>(
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
    (
      event: ReplayEvent,
      heldKeys: HeldKeys,
      handling: Handling,
      rngex: GameRNG
    ) => {
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

  const processEventsToFrame = (
    player: PlayerState,
    round: Round,
    targetFrame: number
  ) => {
    let { rngex, eventIndex, gameState, heldKeys } = player;
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
      const evt = processEvent(event, heldKeys, options.handling, rngex);
      if (evt.garbage) newState.garbageQueued.push(evt.garbage);

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
          const newState = processEventsToFrame(state, round[idx], targetFrame);
          return newState;
        });
      });
    },
    [round, processEventsToFrame]
  );

  return { playerStates, handleNextFrame };
};
