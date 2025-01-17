import { Round } from "@/lib/types/ttrm";
import { PlayerBoard } from "./player-board";
import { Button } from "../ui/button";
import { useRoundState } from "./hooks/useRoundState";
import { useEffect } from "react";

const FRAME_MS = 16.67;

export const GameRound = ({
  round,
  onNextRound,
  playing,
  onPlayingChange,
}: {
  round: Round[];
  onNextRound: () => void;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
}) => {
  const { playerStates, handleNextFrame, roundEnded } = useRoundState(round);
  useEffect(() => {
    if (roundEnded) {
      onNextRound();
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    if (playing) {
      intervalId = setInterval(() => handleNextFrame(1), FRAME_MS);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [playing, roundEnded, handleNextFrame, onNextRound]);

  return (
    <div>
      <Button onClick={() => onPlayingChange(true)}>Play</Button>
      <Button onClick={() => onPlayingChange(false)}>Pause</Button>

      <Button onClick={() => handleNextFrame(FRAME_MS)}>Advance Both</Button>
      <Button onClick={() => handleNextFrame(1)}>Advance Both tiny</Button>

      <div className="flex flex-wrap">
        {round.map((player, index) => (
          <PlayerBoard
            key={`${player.replay.options.gameid}`}
            player={player}
            gameState={playerStates[index].gameState}
          />
        ))}
      </div>
    </div>
  );
};
