import { Replay } from "@/lib/types/ttrm";
import { Button } from "../ui/button";
import { useState } from "react";
import { GameRound } from "./round";

export const GameReplay = ({ replay }: { replay: Replay }) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const round = replay.rounds[roundIndex];

  const handleNextRound = () => {
    setRoundIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= replay.rounds.length) return prevIndex;
      return nextIndex;
    });
  };

  return (
    <div>
      <Button onClick={handleNextRound}>Next Round</Button>
      <div>Current Round: {roundIndex}</div>

      <div className="flex flex-wrap">
        <GameRound
          round={round}
          key={roundIndex}
          onNextRound={handleNextRound}
          onPlayingChange={(bool) => setPlaying(bool)}
          playing={playing}
        />
      </div>
    </div>
  );
};
