import * as ReactDOM from "react-dom";
import { App } from "./App";

const root = document.createElement("div");
root.style.width = "100%";
root.style.height = "100%";
document.body.appendChild(root);

ReactDOM.render(<App />, root);
