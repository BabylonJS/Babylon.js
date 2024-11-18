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
     * @param maxSize1 maximum size for the first element
     * @param maxSize2 maximum size for the second element
     */
    drag: (offset: number, source: HTMLElement, minSize1?: number, minSize2?: number, maxSize1?: number, maxSize2?: number) => void;
    /**
     * Function called by splitters to begin dragging
     */
    beginDrag: () => void;
    /**
     * Function called by splitters to end dragging
     */
    endDrag: () => void;

    /**
     * Defines initial sizes for the elements
     * @param source source element
     * @param size1 size of the first element
     * @param size2 size of the second element
     */
    init: (source: HTMLElement, size1?: number, size2?: number) => void;
}

// Create the context
export const SplitContext = createContext<ISplitContext>({ direction: "horizontal", drag: () => {}, beginDrag: () => {}, endDrag: () => {}, init: () => {} });
