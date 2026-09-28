/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Binary input accepted for supporting USD layers and assets.
 */
export type USDBinaryInput = ArrayBuffer | ArrayBufferView;

/**
 * Virtual files supplied alongside the root USD layer, keyed by their path relative to the
 * root layer.
 */
export type USDVirtualFiles = Readonly<Record<string, USDBinaryInput>>;

/**
 * Progress phases reported by the USD worker and Babylon materializer.
 */
export interface USDLoadProgress {
    /**
     * Current importer phase.
     */
    phase: "initializing" | "staging" | "extracting" | "materializing";

    /**
     * Human-readable phase description.
     */
    message: string;
}

/**
 * Options for the OpenUSD scene loader.
 */
export interface USDFileLoaderOptions {
    /**
     * Virtual path used to stage the root layer. Set this when supporting files need
     * to resolve relative to a directory hierarchy.
     */
    rootFileName?: string;

    /**
     * Supporting layers, payloads, and textures keyed by virtual path in the same
     * virtual file system as `rootFileName`.
     */
    files?: USDVirtualFiles;

    /**
     * Enables conservative file-name fallback for unresolved absolute references.
     * Defaults to true.
     */
    resolveByFileName?: boolean;

    /**
     * URL of the module worker. Defaults to the protocol-versioned worker hosted on the Babylon.js CDN.
     */
    workerUrl?: string | URL;

    /**
     * URL of the generated Emscripten JavaScript module.
     */
    glueUrl?: string;

    /**
     * URL of the OpenUSD WebAssembly binary.
     */
    wasmUrl?: string;

    /**
     * URL of the OpenUSD preloaded resource bundle.
     */
    dataUrl?: string;

    /**
     * Called when the importer moves to a new processing phase.
     */
    onProgress?: (progress: USDLoadProgress) => void;

    /**
     * Called for OpenUSD diagnostic messages.
     */
    onLog?: (level: "info" | "warning" | "error", message: string) => void;

    /**
     * Called after extraction and Babylon.js object creation complete.
     */
    onComplete?: (diagnostics: USDImportDiagnostics) => void;
}

/**
 * Timing data measured by the OpenUSD worker and Babylon materializer.
 */
export interface USDImportTimings {
    /** Total extraction time, including the final Wasm heap copy. */
    totalMs: number;
    /** Time spent opening and composing the USD stage. */
    stageOpenMs: number;
    /** Time spent traversing the composed stage. */
    stageReadMs: number;
    /** Time spent preparing renderable vertex streams. */
    preparationMs: number;
    /** Time spent packing the command and raw-data buffers. */
    packingMs: number;
    /** Time spent copying command and data buffers from the Wasm heap. */
    heapCopyMs: number;
    /** Time spent creating Babylon.js objects. */
    materializeMs: number;
}

/**
 * Statistics reported for an imported USD stage.
 */
export interface USDImportStatistics {
    /** Number of transform nodes extracted from the composed stage. */
    nodes: number;
    /** Number of polygonal `UsdGeomMesh` sources. */
    meshes: number;
    /** Number of analytic cube, sphere, cylinder, and cone sources. */
    analyticPrimitives: number;
    /** Number of native Babylon instances created from shared USD geometry. */
    instances: number;
    /** Number of authored USD materials translated. */
    materials: number;
    /** Number of unique vertices in polygonal source meshes. */
    vertices: number;
    /** Number of unique triangles in polygonal source meshes. */
    triangles: number;
    /** Size of the command buffer in bytes. */
    commandBytes: number;
    /** Size of the raw-data buffer in bytes. */
    dataBytes: number;
}

/**
 * Diagnostics reported after a USD import completes.
 */
export interface USDImportDiagnostics {
    /** Timing data for extraction and Babylon.js object creation. */
    timings: USDImportTimings;
    /** Counts and buffer sizes reported by the OpenUSD extractor. */
    statistics: USDImportStatistics;
    /** Asset references OpenUSD could not resolve from the supplied virtual files. */
    missingAssets: readonly string[];
}
