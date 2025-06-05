import { createElement } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const reactRoot = createRoot(document.getElementById("root")!);
reactRoot.render(createElement(App));
