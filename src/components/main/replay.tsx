import { Replay } from "@/lib/types/ttrm";
import { Button } from "../ui/button";
import { useState } from "react";
import { GameRound } from "./round";

export const GameReplay = ({ replay }: { replay: Replay }) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const round = replay.rounds[roundIndex];

  return (
    <div>
      <Button
        onClick={() => {
          setRoundIndex((prev) => prev + 1);
        }}
      >
        Next Round
      </Button>

      <div className="flex flex-wrap">
        <GameRound round={round} key={roundIndex} />
      </div>
    </div>
  );
};
