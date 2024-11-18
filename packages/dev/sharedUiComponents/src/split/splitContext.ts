import { createContext } from "react";

/**
 * Context used to share data with splitters
 */
export interface ISplitContext {
    /**
     * Split direction
     */
    direction: "horizontal" | "vertical";
    /**
     * Function called by splitters to update the offset
     * @param offset new offet
     */
    updateOffset: (offset: number) => void;
}

// Create the context
export const SplitContext = createContext<ISplitContext>({ direction: "horizontal", updateOffset: () => {} });
