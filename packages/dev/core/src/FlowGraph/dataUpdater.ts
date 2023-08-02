/**
 * A type of node that updates its data outputs when the data is requested.
 * Represents "function" nodes such as arithmetic, get variables, etc.
 */
export interface iDataUpdater {
    _updateOutputs(): void;
}

export function isDataUpdater(block: any): block is iDataUpdater {
    return typeof block._updateOutputs === "function";
}
