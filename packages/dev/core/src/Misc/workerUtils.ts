/**
 * Calculate a number of workers to use based on the number of logical processors available.
 * @internal
 */
export function _GetDefaultNumWorkers(): number {
    if (typeof navigator !== "object" || !navigator.hardwareConcurrency) {
        return 1;
    }

    // Use 50% of the available logical processors but capped at 4.
    return Math.min(Math.floor(navigator.hardwareConcurrency * 0.5), 4);
}

/**
 * Verifies that WebAssembly is supported in the current environment.
 * Then checks if the configuration is available.
 * @internal
 */
export function _IsWasmConfigurationAvailable(wasmModuleUrl?: string, wasmBinaryUrl?: string, wasmBinary?: ArrayBuffer, wasmModule?: unknown): boolean {
    if (typeof WebAssembly !== "object") {
        return false;
    }
    return !!((wasmModuleUrl || wasmModule) && (wasmBinaryUrl || wasmBinary));
}
