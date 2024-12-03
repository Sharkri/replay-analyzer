import {
  BLOCK_SIZE,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  X_OFFSET,
} from "@/lib/types/game-options";
import { GameState } from "@/lib/types/game-state";
import { Stage, Graphics } from "@pixi/react";
import { BoardMino, BoardPiece } from "./board-piece";
import { BoardQueue } from "./board-queue";

const BoardCanvas = ({ gameState }: { gameState: GameState }) => {
  const options = {
    x: { start: X_OFFSET, end: X_OFFSET + BOARD_WIDTH * BLOCK_SIZE },
    y: { start: 0, end: BLOCK_SIZE * BOARD_HEIGHT },
  };

  return (
    <Stage width={options.x.end + 160} height={options.y.end}>
      <Graphics
        draw={(g) => {
          g.clear();
          g.lineStyle(1, "#595959");

          for (let x = options.x.start; x <= options.x.end; x += BLOCK_SIZE) {
            g.moveTo(x, options.y.start);
            g.lineTo(x, options.y.end);
          }
          for (let y = 0; y <= options.y.end; y += BLOCK_SIZE) {
            g.moveTo(options.x.start, y);
            g.lineTo(options.x.end, y);
          }
        }}
      />
      {gameState.board.map((row, y) => {
        return row.map((block, x) => {
          if (block == null) return null;
          const boardY = BOARD_HEIGHT - y - 1;
          return (
            <BoardMino x={x} y={boardY} block={block} key={`${x}${boardY}`} />
          );
        });
      })}

      {gameState.held && (
        <BoardPiece
          pieceData={{ x: -4, y: 20, rotation: 0, piece: gameState.held }}
        />
      )}
      <BoardPiece pieceData={gameState.current} />
      <BoardQueue queue={gameState.queue} />
    </Stage>
  );
};

export default BoardCanvas;
