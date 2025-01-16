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
      {/* <div className="overflow-scroll max-w-14 whitespace-nowrap">
        {JSON.stringify(
          {
            garbage: gameState.garbageQueued,
          },
          null,
          2
        )}
      </div> */}
      b2b: {gameState.b2b}
      <BoardCanvas gameState={gameState} />
    </div>
  );
};
