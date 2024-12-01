import { useState } from "react";
import "./App.css";
import { TTRM } from "./lib/types/ttrm";
import TTRMInput from "./components/main/ttrm-input";
import BoardCanvas from "./components/main/board-canvas";

function App() {
  const [ttrm, setTTRM] = useState<null | TTRM>(null);

  return (
    <div className="flex justify-center p-12">
      <div>
        <TTRMInput onChange={setTTRM} />
        <BoardCanvas queue={["I", "L", "J", "O", "S", "Z", "T"]} />
      </div>
    </div>
  );
}

export default App;
