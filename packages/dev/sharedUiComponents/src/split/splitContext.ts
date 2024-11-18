import { createContext } from "react";

export enum ControlledSize {
    First,
    Second,
}

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
     * @param controlledSide defined controlled element
     * @param minSize minimum size for the controlled element
     * @param maxSize maximum size for the controlled element
     */
    drag: (offset: number, source: HTMLElement, controlledSide: ControlledSize, minSize?: number, maxSize?: number) => void;
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
     * @param controlledSide defined controlled element
     * @param size size of the controlled element
     * @param size2 size of the second element
     */
    init: (source: HTMLElement, controlledSide: ControlledSize, size: number) => void;
}

// Create the context
export const SplitContext = createContext<ISplitContext>({ direction: "horizontal", drag: () => {}, beginDrag: () => {}, endDrag: () => {}, init: () => {} });
