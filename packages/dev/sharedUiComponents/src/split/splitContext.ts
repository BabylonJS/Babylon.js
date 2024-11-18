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
     * @param source source element
     * @param minSize1 minimum size for the first element
     * @param minSize2 minimum size for the second element
     */
    drag: (offset: number, source: HTMLElement, minSize1?: number, minSize2?: number) => void;
    /**
     * Function called by splitters to begin dragging
     */
    beginDrag: () => void;
    /**
     * Function called by splitters to end dragging
     */
    endDrag: () => void;
}

// Create the context
export const SplitContext = createContext<ISplitContext>({ direction: "horizontal", drag: () => {}, beginDrag: () => {}, endDrag: () => {} });
