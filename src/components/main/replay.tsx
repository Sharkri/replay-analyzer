import { Replay } from "@/lib/types/ttrm";
import { Button } from "../ui/button";
import { useState } from "react";
import { ReplayRound } from "./replay-round";

export const GameReplay = ({ replay }: { replay: Replay }) => {
  const [round, setRound] = useState(0);

  return (
    <div>
      <Button
        onClick={() => {
          setRound((prev) => prev + 1);
        }}
      >
        Next Round
      </Button>

      <div className="flex flex-wrap">
        {replay.rounds[round].map((r) => (
          <ReplayRound round={r} key={`${round}-${r.id}`} />
        ))}
      </div>
    </div>
  );
};
