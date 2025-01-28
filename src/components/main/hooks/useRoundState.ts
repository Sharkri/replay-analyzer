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
  currFrame: number;
  gameState: GameState;
};

export const useRoundState = (round: Round[]) => {
  const [playerStates, setPlayerStates] = useState<PlayerState[]>(
    round.map((player) => {
      const { seed } = player.replay.options;

      const gameState = createGameState(1, seed);
      const heldKeys = {
        moveLeft: null,
        moveRight: null,
        softDrop: null,
      } as HeldKeys;

      return { heldKeys, eventIndex: 0, currFrame: 0, gameState };
    })
  );
  const [roundEnded, setRoundEnded] = useState(false);

  const processEvent = useCallback(
    (
      event: ReplayEvent,
      heldKeys: HeldKeys,
      handling: Handling,
      state: GameState
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
          const data = processKeyDown(event, newHeldKeys);
          newHeldKeys = data.heldKeys;
          commands.push(data.key);
          break;
        case "keyup":
          handleKeyUp(event, newHeldKeys);
          commands.push(...getHeldKeyCommands(event, heldKeys, handling));
          break;
        case "ige":
          garbage = handleIGEEvent(event, state);
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

  const processNextFrame = (
    player: PlayerState,
    round: Round,
    frameIncrement: number
  ) => {
    if (roundEnded) {
      return player;
    }
    const p = structuredClone(player);
    const { events, options } = round.replay;

    const targetFrame = p.currFrame + frameIncrement;

    while (p.currFrame < targetFrame) {
      const event = events[p.eventIndex];
      if (event == null) {
        setRoundEnded(true);
        break;
      }

      const commands: Command[] = [];

      const { y, spawnFrame } = p.gameState.current;

      const isInitialY = y === PIECE_SPAWN; // initial tick of gravity
      if (event.frame > spawnFrame && isInitialY) commands.push("drop");

      if (event.frame === p.currFrame) {
        const res = processEvent(
          event,
          p.heldKeys,
          options.handling,
          p.gameState
        );
        commands.push(...res.commands);
        p.heldKeys = res.newHeldKeys;
        p.eventIndex++;
      } else {
        p.currFrame++;
      }

      if (commands.length > 0) {
        p.gameState = executeCommands(
          commands,
          p.gameState,
          event.frame,
          options
        );
      }
    }

    return p;
  };

  const handleNextFrame = useCallback(
    (frameIncrement: number) => {
      setPlayerStates((prevStates) => {
        return prevStates.map((state, idx) => {
          const newState = processNextFrame(state, round[idx], frameIncrement);
          return newState;
        });
      });
    },
    [round, processNextFrame]
  );

  return { playerStates, handleNextFrame, roundEnded };
};
