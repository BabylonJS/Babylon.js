import { createContext } from "react";

export enum ControlledSize {
    First,
    Second,
}

export enum SplitDirection {
    Horizontal,
    Vertical,
}

/**
 * Context used to share data with splitters
 */
export interface ISplitContext {
    /**
     * Split direction
     */
    direction: SplitDirection;
    /**
     * Function called by splitters to update the offset
     * @param offset new offet
     * @param source source element
     * @param controlledSide defined controlled element
     */
    drag: (offset: number, source: HTMLElement, controlledSide: ControlledSize) => void;
    /**
     * Function called by splitters to begin dragging
     */
    beginDrag: () => void;
    /**
     * Function called by splitters to end dragging
     */
    endDrag: () => void;

    /**
     * Sync sizes for the elements
     * @param source source element
     * @param controlledSide defined controlled element
     * @param size size of the controlled element
     * @param minSize minimum size for the controlled element
     * @param maxSize maximum size for the controlled element
     */
    sync: (source: HTMLElement, controlledSide: ControlledSize, size?: number, minSize?: number, maxSize?: number) => void;
}

// Create the context
export const SplitContext = createContext<ISplitContext>({ direction: SplitDirection.Horizontal, drag: () => {}, beginDrag: () => {}, endDrag: () => {}, sync: () => {} });
