import { PIECE_SPAWN } from "@/lib/engine/game";
import { Block, BLOCK_COLORS, PIECE_MATRICES } from "@/lib/engine/piece";
import { BLOCK_SIZE, X_OFFSET } from "@/lib/types/game-options";
import { PieceData } from "@/lib/types/game-state";
import { Graphics } from "@pixi/react";

export const BoardMino = ({
  x,
  y,
  block,
}: {
  x: number;
  y: number;
  block: Block;
}) => {
  return (
    <Graphics
      draw={(g) => {
        g.clear();
        g.beginFill(BLOCK_COLORS[block]);
        g.drawRect(0, 0, BLOCK_SIZE - 1, BLOCK_SIZE);
        g.endFill();
      }}
      x={x * BLOCK_SIZE + X_OFFSET}
      y={y * BLOCK_SIZE}
    />
  );
};

export const BoardPiece = ({ pieceData }: { pieceData: PieceData }) => {
  const { piece, rotation, x, y } = pieceData;

  const shape = PIECE_MATRICES[piece][rotation];

  return shape.map((row, pieceY) =>
    row.map((cell, pieceX) => {
      if (cell === 0) return null;

      let blockX = pieceX + x;
      let blockY = pieceY + (PIECE_SPAWN - y);

      return (
        <BoardMino
          key={`${blockX}${blockY}`}
          x={blockX}
          y={blockY}
          block={piece}
        />
      );
    })
  );
};
