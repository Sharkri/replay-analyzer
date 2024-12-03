import { useState } from "react";
import "./App.css";
import { TTRM } from "./lib/types/ttrm";
import TTRMInput from "./components/main/ttrm-input";
import BoardCanvas from "./components/main/board-canvas";
import { GameState } from "./lib/types/game-state";
import { createGameState, executeCommand } from "./lib/engine/game";
import { Button } from "./components/ui/button";

function App() {
  const [ttrm, setTTRM] = useState<null | TTRM>(null);
  const [gameState, setGameState] = useState<null | GameState>(null);
  console.log(gameState);
  return (
    <div className="flex justify-center p-12">
      <div>
        <TTRMInput
          onChange={(value) => {
            setTTRM(value);

            setGameState(createGameState(["I", "L", "J", "T", "S", "Z"]));
          }}
        />

        <Button
          onClick={() => {
            if (gameState) {
              const xd = executeCommand("move_left", gameState);
              setGameState(xd);
            }
          }}
        >
          left
        </Button>
        <Button
          onClick={() => {
            if (gameState) {
              const xd = executeCommand("rotate_cw", gameState);
              setGameState(xd);
            }
          }}
        >
          roate cw
        </Button>
        <Button
          onClick={() => {
            if (gameState) {
              const xd = executeCommand("hard_drop", gameState);
              setGameState(xd);
            }
          }}
        >
          hd
        </Button>
        <Button
          onClick={() => {
            if (gameState) {
              const xd = executeCommand("hold", gameState);
              setGameState(xd);
            }
          }}
        >
          hodl
        </Button>

        {gameState && <BoardCanvas gameState={gameState} />}
      </div>
    </div>
  );
}

export default App;
