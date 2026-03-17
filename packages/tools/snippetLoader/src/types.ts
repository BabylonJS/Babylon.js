/**
 * Known snippet content types, determined by inspecting the keys present
 * in the parsed `jsonPayload`.
 *
 * - `"playground"` — Playground code snippet (V1 legacy or V2 multi-file manifest)
 * - `"nodeMaterial"` — Node Material Editor (NME) snippet
 * - `"nodeGeometry"` — Node Geometry Editor snippet
 * - `"nodeRenderGraph"` — Node Render Graph Editor snippet
 * - `"nodeParticle"` — Node Particle Editor snippet
 * - `"gui"` — GUI Editor snippet (may use `gui` or `encodedGui` key)
 * - `"animation"` — Animation snippet (single or array)
 * - `"particleSystem"` — Particle system snippet
 * - `"spriteManager"` — Sprite manager snippet
 * - `"shaderMaterial"` — Shader material snippet
 * - `"unknown"` — The payload could not be matched to a known type
 */
export type SnippetContentType =
    | "playground"
    | "nodeMaterial"
    | "nodeGeometry"
    | "nodeRenderGraph"
    | "nodeParticle"
    | "gui"
    | "animation"
    | "particleSystem"
    | "spriteManager"
    | "shaderMaterial"
    | "unknown";

/**
 * The module format used for transpiled JavaScript output.
 *
 * - `"esm"` — ES modules (`import`/`export`). Executed via blob URLs +
 *   dynamic `import()`. This is the default.
 * - `"script"` — Plain script code with no module syntax. Executed via
 *   `new Function()`. All imports are stripped; the code is expected to
 *   run in an environment where BABYLON is available as a global.
 */
export type ModuleFormat = "esm" | "script";

/**
 * The raw envelope returned by the snippet server for every snippet.
 */
export interface ISnippetServerResponse {
    /** Legacy stringified payload (older snippets). */
    payload?: string;
    /** Modern stringified JSON payload. */
    jsonPayload?: string;
    /** User-provided snippet title. */
    name: string;
    /** User-provided snippet description. */
    description: string;
    /** Comma-separated tags. */
    tags: string;
}

/**
 * V2 multi-file playground manifest (matches the playground's own type).
 */
export interface IV2Manifest {
    /** Manifest format version. */
    v: number;
    /** Source language of the snippet files. */
    language: "JS" | "TS";
    /** Relative path of the entry file. */
    entry: string;
    /** External import specifiers mapped to CDN URLs. */
    imports: Record<string, string>;
    /** All source files, keyed by relative path. */
    files: Record<string, string>;
    /** Optional CDN base URL for resolving imports. */
    cdnBase?: string;
}

/**
 * Inner payload structure used by playground snippets.
 */
export interface IPlaygroundPayload {
    /** The code string (may be a stringified V2Manifest for modern snippets). */
    code: string;
    /** Base64-encoded UTF-8 representation of `code` (optional, for Unicode safety). */
    unicode?: string;
    /** The engine type the snippet was saved with (e.g. "WebGL1", "WebGL2", "WebGPU"). */
    engine?: string;
    /** Manifest version — `2` for V2 multi-file snippets. */
    version?: number;
}

// ---------------------------------------------------------------------------
// Options types for the returned functions
// ---------------------------------------------------------------------------

/**
 * Options for the `createEngine` function returned by the snippet loader.
 */
export interface ICreateEngineOptions {
    /** Whether to enable antialiasing. Defaults to `true`. */
    antialias?: boolean;
    /** Raw engine constructor options passed to the Babylon.js engine. */
    engineOptions?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Parsed result types
// ---------------------------------------------------------------------------

/** Snippet metadata extracted from the server response envelope. */
export interface ISnippetMetadata {
    /** User-provided snippet title. */
    name: string;
    /** User-provided snippet description. */
    description: string;
    /** Comma-separated tags. */
    tags: string;
}

/** Base fields shared by every parsed snippet result. */
export interface ISnippetResultBase {
    /** The snippet id that was fetched (e.g. "ABC123#1"). */
    snippetId: string;
    /** Detected content type. */
    type: SnippetContentType;
    /** Snippet metadata from the server envelope. */
    metadata: ISnippetMetadata;
}

/**
 * A function that transpiles a single TypeScript source string to JavaScript.
 * The consumer provides this — it can wrap `ts.transpileModule`, Monaco's
 * TS worker, sucrase, esbuild-wasm, or any other transpiler that runs in the
 * browser or Node.
 *
 * @param source - The TypeScript source code.
 * @param fileName - The file path/name (e.g. `"index.ts"`) for diagnostics.
 * @returns The transpiled JavaScript string (sync or async).
 */
export type TranspileFn = (source: string, fileName: string) => string | Promise<string>;

/**
 * Indicates where the `createEngine` function came from.
 *
 * - `"snippet"` — The snippet code exports its own `createEngine`.
 * - `"default"` — The snippet does not define `createEngine`; a default
 *   implementation was provided by the loader.
 */
export type CreateEngineSource = "snippet" | "default";

/**
 * A fully parsed and executable playground snippet.
 *
 * All code has been decoded (Unicode / base64), transpiled if needed, and
 * analysed. The result exposes two ready-to-call functions — `createEngine`
 * and `createScene` — that abstract away legacy compatibility, module
 * format differences, and `this` binding quirks.
 */
export interface IPlaygroundSnippetResult extends ISnippetResultBase {
    /** Discriminant for playground snippets. */
    type: "playground";

    // ── Source information ──────────────────────────────────────────────

    /** The original language of the snippet source code. */
    language: "JS" | "TS";
    /**
     * Engine type the snippet was saved with (e.g. "WebGL2", "WebGPU").
     * May be `undefined` for older snippets that don't store this info.
     */
    engineType?: string;
    /**
     * Whether this is a V2 multi-file snippet (`true`) or a V1 legacy
     * single-file snippet (`false`).
     */
    isMultiFile: boolean;
    /**
     * The V2 manifest when the snippet uses the multi-file format.
     * `null` for legacy (V1) snippets.
     */
    manifest: IV2Manifest | null;

    // ── Code ───────────────────────────────────────────────────────────

    /**
     * The entry file's source code as authored (before transpilation).
     */
    code: string;
    /**
     * All source files in the snippet as authored (may include `.ts` files).
     * For V1 snippets this contains a single entry (`index.js` or `index.ts`).
     */
    files: Record<string, string>;
    /**
     * All files transpiled to JavaScript in the requested {@link ModuleFormat}.
     */
    jsFiles: Record<string, string>;
    /**
     * The transpiled JavaScript source of the entry file that is actually
     * executed (i.e. the file that contains `createScene`).
     * This is a convenience shorthand for `jsFiles[entryFileName]`.
     */
    executedCode: string;

    // ── Module format ──────────────────────────────────────────────────

    /**
     * The module format the `jsFiles` are transpiled to.
     */
    moduleFormat: ModuleFormat;

    // ── Executable functions ───────────────────────────────────────────

    /**
     * Creates a Babylon.js engine for this snippet.
     *
     * If the snippet defines its own `createEngine` this wraps that
     * implementation. Otherwise a sensible default is provided (see
     * {@link createEngineSource}).
     *
     * @param canvas - The canvas element to render to.
     * @param options - Optional engine creation options.
     * @returns The created engine instance.
     */
    createEngine: (canvas: HTMLCanvasElement, options?: ICreateEngineOptions) => Promise<any>;

    /**
     * Creates and returns the scene defined by the snippet.
     *
     * Handles legacy `this` binding, TS class patterns (`Playground.CreateScene`),
     * and all known function-name variants automatically.
     *
     * @param engine - A Babylon.js engine instance (e.g. from {@link createEngine}).
     * @param canvas - The canvas element the engine renders to.
     * @returns The created `Scene` instance.
     */
    createScene: (engine: any, canvas: HTMLCanvasElement) => Promise<any>;

    // ── Function provenance metadata ───────────────────────────────────

    /**
     * Where the `createEngine` function came from.
     * - `"snippet"` — exported by the snippet code.
     * - `"default"` — loader-provided default.
     */
    createEngineSource: CreateEngineSource;

    /**
     * The name of the scene-creation function that was detected in the
     * snippet module, e.g. `"createScene"`, `"CreateScene"`,
     * `"delayCreateScene"`, `"default"`, etc.
     */
    sceneFunctionName: string;

    // ── Runtime features ───────────────────────────────────────────────

    /**
     * Runtime dependencies detected by probing the snippet source code.
     * Consumers can inspect these flags to decide which external scripts
     * need to be loaded before calling {@link initializeRuntimeAsync}.
     */
    runtimeFeatures: IRuntimeFeatures;

    /**
     * Initialises runtime globals required by the snippet.
     *
     * By default this only calls factory functions **already on `window`**
     * (e.g. `window.HK = await HavokPhysics()`).
     *
     * Pass `{ loadScripts: true }` to also inject `<script>` tags from
     * the Babylon.js CDN for any missing feature, mirroring the
     * Playground's behaviour.  Custom URLs can be provided via
     * `scriptUrls`.
     *
     * Call this **before** `createScene`.
     *
     * @param options - Optional configuration.
     */
    initializeRuntimeAsync: (options?: IInitializeRuntimeOptions) => Promise<void>;
}

/**
 * A parsed non-playground snippet (NME, GUI, particles, etc.).
 * The `data` field contains the already-parsed serialization object
 * that can be passed directly to the corresponding `Parse` method.
 */
export interface IDataSnippetResult extends ISnippetResultBase {
    /** The specific non-playground content type (e.g. "nme", "gui"). */
    type: Exclude<SnippetContentType, "playground" | "unknown">;
    /** The parsed serialization object from the snippet payload. */
    data: unknown;
    /**
     * Convenience loader.  Calls `parser(data)` when a parser is provided,
     * otherwise returns the raw `data` for the consumer to handle.
     *
     * @param parser - Optional function that knows how to instantiate the
     *                 data (e.g. `(d) => NodeMaterial.Parse(d, scene)`).
     * @returns The result of the parser, or the raw data.
     */
    load: (parser?: (data: unknown) => any) => any;
}

/** Snippet whose type could not be determined. */
export interface IUnknownSnippetResult extends ISnippetResultBase {
    /** Discriminant for snippets whose type could not be determined. */
    type: "unknown";
    /** The raw parsed jsonPayload object, for the consumer to inspect. */
    rawPayload: unknown;
}

// ---------------------------------------------------------------------------
// Runtime features
// ---------------------------------------------------------------------------

/**
 * Runtime dependencies detected by probing the snippet source code for known
 * class references (e.g. `HavokPlugin`, `AmmoJSPlugin`, `RecastJSPlugin`).
 *
 * The consumer can inspect these flags to decide which external scripts to
 * load, or simply call {@link IPlaygroundSnippetResult.initializeRuntimeAsync}
 * to initialise any globals that are already on `window`.
 */
export interface IRuntimeFeatures {
    /** `true` when the snippet references `HavokPlugin`. */
    havok: boolean;
    /** `true` when the snippet references `AmmoJSPlugin`. */
    ammo: boolean;
    /** `true` when the snippet references `RecastJSPlugin`. */
    recast: boolean;
}

/** Default CDN base URL for runtime dependency scripts. */
export const DefaultRuntimeBaseUrl = "https://cdn.babylonjs.com";

/**
 * Relative paths for each runtime dependency script, appended to a base URL.
 */
export const RuntimeScriptPaths: Readonly<Record<keyof IRuntimeFeatures, string>> = {
    havok: "havok/HavokPhysics_umd.js",
    ammo: "ammo/ammo.js",
    recast: "recast.js",
};

/**
 * Options for {@link IPlaygroundSnippetResult.initializeRuntimeAsync}.
 */
export interface IInitializeRuntimeOptions {
    /**
     * When `true`, injects `<script>` tags for any detected feature whose
     * factory function is not already on `window`.
     * Defaults to `false`.
     */
    loadScripts?: boolean;
    /**
     * Base URL for runtime scripts. The relative path for each feature
     * (e.g. `"havok/HavokPhysics_umd.js"`) is appended to this.
     * Defaults to `"https://cdn.babylonjs.com"`.
     *
     * Ignored when the corresponding entry in `scriptUrls` provides a
     * full override.
     */
    baseUrl?: string;
    /**
     * Override the full URL for individual features.
     * Takes precedence over `baseUrl`.
     * Only used when `loadScripts` is `true`.
     */
    scriptUrls?: Partial<Record<keyof IRuntimeFeatures, string>>;
}

/** Union of all possible snippet results. */
export type SnippetResult = IPlaygroundSnippetResult | IDataSnippetResult | IUnknownSnippetResult;

// ---------------------------------------------------------------------------
// Save types
// ---------------------------------------------------------------------------

/**
 * Input for saving a playground snippet from a single code string (V1 style).
 */
export interface ISavePlaygroundCodeInput {
    /** Discriminant for playground snippets. */
    type: "playground";
    /** The code string to save. */
    code: string;
    /** Source language. When omitted the loader guesses from the code content on load. When provided, it is persisted in the payload. */
    language?: "JS" | "TS";
    /** The engine type to store (e.g. "WebGL2", "WebGPU"). */
    engine?: string;
}

/**
 * Input for saving a playground snippet from a V2 multi-file manifest.
 */
export interface ISavePlaygroundManifestInput {
    /** Discriminant for playground snippets. */
    type: "playground";
    /** The V2 multi-file manifest to save. */
    manifest: IV2Manifest;
    /** The engine type to store (e.g. "WebGL2", "WebGPU"). */
    engine?: string;
}

/** Content types that use the data snippet format (excludes playground and unknown). */
export type DataSnippetType = Exclude<SnippetContentType, "playground" | "unknown">;

/**
 * Input for saving a data snippet (NME, NGE, GUI, particles, etc.).
 *
 * This is a discriminated union on `type` — each snippet content type
 * is a distinct member. `data` is typed as `unknown` because the
 * serialisation schemas are owned by each tool's package, not by the
 * snippet loader.  Callers with access to the concrete data types can
 * narrow via the `type` discriminant.
 */
export type SaveDataSnippetInput = {
    [K in DataSnippetType]: {
        /** The snippet content type. */
        type: K;
        /** The data to save (JSON-serialisable). */
        data: unknown;
    };
}[DataSnippetType];

/** Discriminated union of all save input shapes. */
export type SaveSnippetInput = ISavePlaygroundCodeInput | ISavePlaygroundManifestInput | SaveDataSnippetInput;

/**
 * Options for the {@link SaveSnippet} function.
 */
export interface ISaveSnippetOptions {
    /** Override the snippet server URL. Defaults to `https://snippet.babylonjs.com`. */
    snippetUrl?: string;
    /**
     * An existing snippet ID to create a new revision of.
     * When provided the server stores the payload as a new version
     * of this snippet rather than creating a brand-new ID.
     *
     * Accepts formats like `"ABC123"` or `"ABC123#2"` — the `#revision`
     * part is stripped automatically (only the base ID is sent).
     */
    snippetId?: string;
    /** Optional metadata to attach to the snippet envelope. */
    metadata?: Partial<ISnippetMetadata>;
}

/**
 * Result returned by {@link SaveSnippet} after a successful save.
 */
export interface ISaveSnippetResult {
    /**
     * Full snippet identifier including revision, e.g. `"ABC123#1"`.
     * For the first revision this is just the base ID (e.g. `"ABC123"`).
     */
    snippetId: string;
    /** The base snippet ID without revision, e.g. `"ABC123"`. */
    id: string;
    /** The revision number as a string, e.g. `"0"`, `"1"`. */
    version: string;
}
