export interface DataUpdater {
    updateOutputs(): void;
}

export function isDataUpdater(block: any): block is DataUpdater {
    return typeof block.updateOutputs === "function";
}
