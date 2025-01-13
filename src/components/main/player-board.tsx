import { Player } from "@/lib/types/ttrm";
import { Button } from "../ui/button";
import BoardCanvas from "./board-canvas";
import { GameState } from "@/lib/types/game-state";

export const PlayerBoard = ({
  player,
  gameState,
  onHandleBatchEvents,
}: {
  player: Player;
  gameState: GameState;
  onHandleBatchEvents: (n: number) => void;
}) => {
  return (
    <div>
      <Button onClick={() => onHandleBatchEvents(1)}>Next Event</Button>
      <Button onClick={() => onHandleBatchEvents(5)}>Next Piece</Button>

      {player.username}

      <BoardCanvas gameState={gameState} />
    </div>
  );
};
