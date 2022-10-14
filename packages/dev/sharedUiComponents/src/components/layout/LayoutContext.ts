import { createContext } from "react";
import type { Layout } from "./types";

export const LayoutContext = createContext<{
    /**
     * The layout object
     */
    layout: Layout;
    /**
     * Function to set the layout object in the context
     */
    setLayout: (layout: Layout) => void;
}>({ layout: {}, setLayout: () => {} });
