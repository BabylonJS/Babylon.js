import { createRoot } from "react-dom/client";
import { App } from "./App";

const Root = createRoot(document.getElementById("root") as HTMLCanvasElement);
Root.render(<App />);
