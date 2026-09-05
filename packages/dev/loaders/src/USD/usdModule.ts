/* eslint-disable @typescript-eslint/naming-convention */

export interface NativeImportResult {
    ok(): boolean;
    error(): string;
    commandPtr(): number;
    commandSize(): number;
    dataPtr(): number;
    dataSize(): number;
    totalMs(): number;
    stageOpenMs(): number;
    stageReadMs(): number;
    preparationMs(): number;
    packingMs(): number;
    nodeCount(): number;
    meshCount(): number;
    analyticPrimitiveCount(): number;
    instanceCount(): number;
    materialCount(): number;
    vertexCount(): number;
    triangleCount(): number;
    delete(): void;
}

export interface ImporterModule {
    HEAPU8: Uint8Array;
    FS: {
        writeFile(path: string, data: Uint8Array): void;
        unlink(path: string): void;
        mkdir(path: string): void;
        rmdir(path: string): void;
        analyzePath(path: string): { exists: boolean };
    };
    extract(path: string): NativeImportResult;
    setLogCallback(callback: (level: number, message: string) => void): void;
    registerAssetDirectory(path: string): void;
    clearAssetIndex(): void;
    setRootAssetPath(path: string): void;
    setAssetFallbackEnabled(enabled: boolean): void;
    getUnresolvedAssets(): string;
}

export type ImporterModuleFactory = (options?: { locateFile?: (path: string, scriptDirectory: string) => string; noExitRuntime?: boolean }) => Promise<ImporterModule>;
