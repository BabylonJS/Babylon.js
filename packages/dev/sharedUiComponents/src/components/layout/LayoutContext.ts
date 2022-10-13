import { createContext } from "react";
import type { Layout } from "./types";

export const LayoutContext = createContext<{ layout: Layout; setLayout: (layout: Layout) => void }>({ layout: {}, setLayout: () => {} });
