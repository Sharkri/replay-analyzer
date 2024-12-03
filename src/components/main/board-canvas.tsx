import { PIECE_SPAWN } from "@/lib/engine/game";
import { Piece, PIECE_COLORS, PIECE_MATRICES } from "@/lib/engine/piece";
import { GameState, PieceData } from "@/lib/types/game-state";
import { Stage, Graphics } from "@pixi/react";

const BLOCK_SIZE = 40;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const BoardMino = ({ x, y, piece }: { x: number; y: number; piece: Piece }) => {
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

const BoardPiece = ({ pieceData }: { pieceData: PieceData }) => {
  const { piece, rotation, x, y } = pieceData;

  const shape = PIECE_MATRICES[piece][rotation];

  return shape.map((row, pieceY) =>
    row.map((cell, pieceX) => {
      if (cell === 0) return null;

      let blockX = pieceX * BLOCK_SIZE + x * BLOCK_SIZE;
      let blockY = pieceY * BLOCK_SIZE + (PIECE_SPAWN - y) * BLOCK_SIZE;

      return (
        <BoardMino
          key={`${blockX}-${blockY}`}
          x={blockX}
          y={blockY}
          piece={piece}
        />
      );
    })
  );
};

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

      {gameState.queue.map((piece, index) => (
        <BoardPiece
          key={`${piece}${index}`}
          pieceData={{
            x: BOARD_WIDTH,
            y: PIECE_SPAWN - index * 3,
            piece,
            rotation: 0,
          }}
        />
      ))}
    </Stage>
  );
};

export default BoardCanvas;
