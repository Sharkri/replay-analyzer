import { useState, useCallback, useEffect } from "react";
import { Round, ReplayEvent, Handling, GameCommand } from "@/lib/types/ttrm";
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
import { checkCollision } from "@/lib/engine/game-matrix";
import { hardDrop } from "@/lib/engine/game-actions";

type PlayerState = {
  heldKeys: HeldKeys;
  eventIndex: number;
  currFrame: number;
  gameState: GameState;
};

const priorityMap: Record<GameCommand, number> = {
  moveRight: -2,
  moveLeft: -2,
  softDrop: -1,
  hardDrop: -1,
  rotateCW: -1,
  rotateCCW: -1,
  rotate180: -1,
  hold: -1,
};

const initializePlayerState = (player: Round) => {
  const { seed } = player.replay.options;
  const gameState = createGameState(1, seed);
  const heldKeys = {
    moveLeft: null,
    moveRight: null,
    softDrop: null,
  } as HeldKeys;
  return { heldKeys, eventIndex: 0, currFrame: 0, gameState };
};

export const useRoundState = (roundPlayers: Round[]) => {
  const [playerStates, setPlayerStates] = useState<PlayerState[]>(
    roundPlayers.map(initializePlayerState)
  );
  const [roundEnded, setRoundEnded] = useState(false);

  useEffect(() => {
    roundPlayers.map((r) => {
      r.replay.events.sort((a, b) => {
        const frameDiff = a.frame - b.frame;
        if (frameDiff !== 0) return frameDiff;
        if (
          (a.type !== "keydown" && a.type !== "keyup") ||
          (b.type !== "keydown" && b.type !== "keyup")
        ) {
          return 0;
        }
        const subframeDiff = (a.data.subframe || 0) - (b.data.subframe || 0);
        if (subframeDiff !== 0) return subframeDiff;
        return priorityMap[a.data.key] - priorityMap[b.data.key];
      });
      return r;
    });
  }, [roundPlayers]);

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

      const isFloor = checkCollision(p.gameState.board, {
        ...p.gameState.current,
        y: p.gameState.current.y - 1,
      });
      if (isFloor) {
        if (
          p.gameState.locking >= options.locktime ||
          p.gameState.lockResets >= 15
        ) {
          hardDrop(p.gameState, p.currFrame, options);
          p.gameState.locking = 0;
        }

        p.gameState.locking++;
      }

      const { y, spawnFrame } = p.gameState.current;

      const isInitialY = y === PIECE_SPAWN; // initial tick of gravity
      if (event.frame > spawnFrame && isInitialY) commands.push("drop");

      if (event.frame === p.currFrame) {
        if (event.type === "end") {
          setRoundEnded(true);
          break;
        }

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

      p.gameState = executeCommands(
        commands,
        p.gameState,
        event.frame,
        options
      );
    }

    return p;
  };

  const handleNextFrame = useCallback(
    (frameIncrement: number) => {
      setPlayerStates((prevStates) => {
        return prevStates.map((state, idx) => {
          const newState = processNextFrame(
            state,
            roundPlayers[idx],
            frameIncrement
          );
          return newState;
        });
      });
    },
    [roundPlayers]
  );

  const handleBackFrame = useCallback(
    (frameBack: number) => {
      setPlayerStates((prevStates) => {
        return prevStates.map((state, idx) => {
          const targetFrame = Math.max(state.currFrame - frameBack, 0);
          const player = roundPlayers[idx];
          const initialState = initializePlayerState(player);
          const newState = processNextFrame(initialState, player, targetFrame);
          return newState;
        });
      });
    },
    [roundPlayers]
  );

  return { playerStates, handleNextFrame, roundEnded, handleBackFrame };
};
