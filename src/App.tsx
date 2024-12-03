import { useState } from "react";
import "./App.css";
import { TTRM } from "./lib/types/ttrm";
import TTRMInput from "./components/main/ttrm-input";
import BoardCanvas from "./components/main/board-canvas";
import { GameState } from "./lib/types/game-state";
import { createGameState } from "./lib/engine/game";

function App() {
  const [ttrm, setTTRM] = useState<null | TTRM>(null);
  const [gameState, setGameState] = useState<null | GameState>(null);

  return (
    <div className="flex justify-center p-12">
      <div>
        <TTRMInput
          onChange={(value) => {
            setTTRM(value);

            setGameState(createGameState(["I", "L", "J", "T", "S", "Z"]));
          }}
        />

        {gameState && <BoardCanvas gameState={gameState} />}
      </div>
    </div>
  );
}

export default App;
