import { Player } from "@/lib/types/ttrm";
import { PlayerBoard } from "./player-board";
import { Button } from "../ui/button";
import { useRoundState } from "./hooks/useRoundState";

export const GameRound = ({ round }: { round: Player[] }) => {
  const { playerStates, handleBatchEvents } = useRoundState(round);

  return (
    <div>
      <Button
        onClick={() => {
          round.forEach((_, index) => handleBatchEvents(index, 5));
        }}
      >
        Advance Both
      </Button>
      <div className="flex flex-wrap">
        {round.map((player, index) => (
          <PlayerBoard
            key={`${player.replay.options.gameid}`}
            player={player}
            gameState={playerStates[index].gameState}
            onHandleBatchEvents={(n) => handleBatchEvents(index, n)}
          />
        ))}
      </div>
    </div>
  );
};
