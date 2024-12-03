import {
  BLOCK_SIZE,
  BOARD_HEIGHT,
  BOARD_WIDTH,
} from "@/lib/types/game-options";
import { GameState } from "@/lib/types/game-state";
import { Stage, Graphics } from "@pixi/react";
import { BoardPiece } from "./board-piece";
import { BoardQueue } from "./board-queue";

const BoardCanvas = ({ gameState }: { gameState: GameState }) => {
  const canvasWidth = BLOCK_SIZE * BOARD_WIDTH;
  const canvasHeight = BLOCK_SIZE * BOARD_HEIGHT;

  console.log(gameState.current);

  return (
    <Stage width={canvasWidth + 160} height={canvasHeight}>
      <Graphics
        draw={(g) => {
          g.clear();
          g.lineStyle(1, "#595959");
          for (let x = 0; x <= canvasWidth; x += BLOCK_SIZE) {
            g.moveTo(x, 0);
            g.lineTo(x, 800);
          }
          for (let y = 0; y <= canvasHeight; y += BLOCK_SIZE) {
            g.moveTo(0, y);
            g.lineTo(400, y);
          }
        }}
      />

      <BoardPiece pieceData={gameState.current} />

      <BoardQueue queue={gameState.queue} />
    </Stage>
  );
};

export default BoardCanvas;
