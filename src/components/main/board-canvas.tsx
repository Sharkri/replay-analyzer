import { Piece, PIECE_COLORS, PIECE_MATRICES } from "@/lib/engine/piece";
import { Stage, Graphics } from "@pixi/react";

const BLOCK_SIZE = 40; // Size of a single block
const BOARD_WIDTH = 10; // Number of blocks horizontally
const BOARD_HEIGHT = 20; // Number of blocks vertically

const BoardBlock = ({
  x,
  y,
  piece,
}: {
  x: number;
  y: number;
  piece: Piece;
}) => {
  return (
    <Graphics
      draw={(g) => {
        g.clear();
        g.beginFill(PIECE_COLORS[piece]);
        g.drawRect(0, 0, BLOCK_SIZE - 1, BLOCK_SIZE);
        g.endFill();
      }}
      x={x}
      y={y}
    />
  );
};

const BoardCanvas = ({ queue }: { queue: Piece[] }) => {
  const canvasWidth = BLOCK_SIZE * BOARD_WIDTH;
  const canvasHeight = BLOCK_SIZE * BOARD_HEIGHT;

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

      {queue.map((piece, index) => {
        const shape = PIECE_MATRICES[piece];

        return shape.map((row, pieceY) => {
          return row.map((cell, pieceX) => {
            if (cell === 0) {
              return null;
            }

            let blockX = canvasWidth + pieceX * BLOCK_SIZE;
            let blockY = pieceY * BLOCK_SIZE + index * 120;

            return (
              <BoardBlock
                key={crypto.randomUUID()}
                x={blockX}
                y={blockY}
                piece={piece}
              />
            );
          });
        });
      })}
    </Stage>
  );
};

export default BoardCanvas;
