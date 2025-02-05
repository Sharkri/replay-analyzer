import { Piece } from "@/lib/engine/piece";
import { BoardPiece } from "./board-piece";
import { BOARD_WIDTH, PIECE_SPAWN } from "@/lib/engine/game-options";

export const BoardQueue = ({ queue }: { queue: Piece[] }) => {
  return queue.map((piece, index) => (
    <BoardPiece
      key={`${piece}${index}`}
      pieceData={{
        x: BOARD_WIDTH,
        y: PIECE_SPAWN - index * 3,
        piece,
        rotation: 0,
        spawnFrame: 0,
        lowest: 0,
      }}
    />
  ));
};
