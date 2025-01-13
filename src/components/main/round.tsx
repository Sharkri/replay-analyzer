import { Round } from "@/lib/types/ttrm";
import { PlayerBoard } from "./player-board";
import { Button } from "../ui/button";
import { useRoundState } from "./hooks/useRoundState";

export const GameRound = ({ round }: { round: Round[] }) => {
  const { playerStates, handleNextFrame } = useRoundState(round);

  return (
    <div>
      <Button onClick={() => handleNextFrame(16.67)}>Advance Both</Button>
      <Button onClick={() => handleNextFrame(0)}>Advance Both tiny</Button>

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
