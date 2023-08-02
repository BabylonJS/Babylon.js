/**
 * A type of node that updates its data outputs when the data is requested.
 * Represents "function" nodes such as arithmetic, get variables, etc.
 */
export interface IDataUpdater {
    _updateOutputs(): void;
}

export function isDataUpdater(block: any): block is IDataUpdater {
    return typeof block._updateOutputs === "function";
}
