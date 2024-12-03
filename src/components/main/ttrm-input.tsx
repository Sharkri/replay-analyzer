import { TTRM, TTRMSchema } from "@/lib/types/ttrm";
import { Input } from "../ui/input";

function TTRMInput({ onChange }: { onChange: (ttrm: TTRM) => void }) {
  const readFileContents = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const contents = event.target?.result as string; // This contains the file contents
        const parsedJSON = JSON.parse(contents);
        const validatedData = TTRMSchema.parse(parsedJSON);
        onChange(validatedData);
      } catch (error) {
        console.error("Validation failed:", error);
      }
    };

    reader.onerror = (error) => console.error("Error reading file:", error);
    reader.readAsText(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.name.endsWith("ttrm")) {
      readFileContents(file);
    } else {
      alert("bad!");
    }
  };

  return <Input type="file" onChange={onInputChange} />;
}

export default TTRMInput;
