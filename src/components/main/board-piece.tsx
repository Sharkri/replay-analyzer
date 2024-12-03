import { PIECE_SPAWN } from "@/lib/engine/game";
import { Piece, PIECE_COLORS, PIECE_MATRICES } from "@/lib/engine/piece";
import { BLOCK_SIZE } from "@/lib/types/game-options";
import { PieceData } from "@/lib/types/game-state";
import { Graphics } from "@pixi/react";

export const BoardMino = ({
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

export const BoardPiece = ({ pieceData }: { pieceData: PieceData }) => {
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
