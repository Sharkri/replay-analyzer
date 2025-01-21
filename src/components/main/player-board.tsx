import { Round } from "@/lib/types/ttrm";
import BoardCanvas from "./board-canvas";
import { GameState } from "@/lib/types/game-state";
import { Button } from "../ui/button";

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
      <Button
        onClick={() => {
          console.log(gameState);
        }}
      >
        Log state
      </Button>
      <BoardCanvas gameState={gameState} />
    </div>
  );
};
