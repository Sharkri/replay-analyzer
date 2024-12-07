import { useState } from "react";
import "./App.css";
import { TTRM } from "./lib/types/ttrm";
import TTRMInput from "./components/main/ttrm-input";
import { GameReplay } from "./components/main/replay";

function App() {
  const [ttrm, setTtrm] = useState<null | TTRM>(null);

  return (
    <div className="flex justify-center p-12">
      <div>
        <TTRMInput onChange={(value) => setTtrm(value)} />

        {ttrm && <GameReplay replay={ttrm.replay} />}
      </div>
    </div>
  );
}

export default App;
