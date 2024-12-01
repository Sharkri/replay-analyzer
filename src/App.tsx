import { useState } from "react";
import "./App.css";
import { Input } from "./components/ui/input";
import { TTRM, TTRMSchema } from "./lib/types/ttrm";

function App() {
  const [ttrm, setTTRM] = useState<null | TTRM>(null);

  const readFileContents = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const contents = event.target?.result as string; // This contains the file contents
        const parsedJSON = JSON.parse(contents);
        console.log(parsedJSON);
        const validatedData = TTRMSchema.parse(parsedJSON);
        setTTRM(validatedData);
      } catch (error) {
        console.error("Validation failed:", error);
      }
    };
    reader.onerror = (error) => console.error("Error reading file:", error);

    reader.readAsText(file);
  };

  return (
    <div className="flex justify-center p-12">
      <div>
        <Input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file?.name.endsWith("ttrm")) {
              console.log(file);
              readFileContents(file);
            } else {
              alert("bad!");
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;
