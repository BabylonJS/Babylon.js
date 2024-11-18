import { createContext } from "react";

/**
 * Context used to share data with splitters
 */
export interface ISplitContext {
    /**
     * Split direction
     */
    direction: "horizontal" | "vertical";
}

// Create the context
export const SplitContext = createContext<ISplitContext>({ direction: "horizontal" });
