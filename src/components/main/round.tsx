import { Round } from "@/lib/types/ttrm";
import { PlayerBoard } from "./player-board";
import { Button } from "../ui/button";
import { useRoundState } from "./hooks/useRoundState";
import { useEffect, useState } from "react";

const FRAME_MS = 16.67;

export const GameRound = ({ round }: { round: Round[] }) => {
  const { playerStates, handleNextFrame } = useRoundState(round);
  const [playing, setPlaying] = useState(false);
  const [intervalId, setIntervalId] = useState<null | NodeJS.Timeout>(null);

  useEffect(() => {
    if (playing) {
      const id = setInterval(() => handleNextFrame(1), FRAME_MS);
      setIntervalId(id);
    } else if (intervalId != null) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [playing]);

  return (
    <div>
      <Button onClick={() => setPlaying(true)}>Play</Button>
      <Button onClick={() => setPlaying(false)}>Pause</Button>

      <Button onClick={() => handleNextFrame(16.67)}>Advance Both</Button>
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
