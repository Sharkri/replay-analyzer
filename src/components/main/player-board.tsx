import { Round } from "@/lib/types/ttrm";
import BoardCanvas from "./board-canvas";
import { GameState } from "@/lib/types/game-state";

export const PlayerBoard = ({
  player,
  gameState,
}: {
  player: Round;
  gameState: GameState;
}) => {
  return (
    <div>
      {player.username}

      <BoardCanvas gameState={gameState} />
    </div>
  );
};
