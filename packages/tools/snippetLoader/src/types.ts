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
 * The raw envelope returned by the snippet server for every snippet.
 */
export interface SnippetServerResponse {
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
export interface V2Manifest {
    v: number;
    language: "JS" | "TS";
    entry: string;
    imports: Record<string, string>;
    files: Record<string, string>;
    cdnBase?: string;
}

/**
 * Inner payload structure used by playground snippets.
 */
export interface PlaygroundPayload {
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
// Parsed result types
// ---------------------------------------------------------------------------

/** Base fields shared by every parsed snippet result. */
export interface SnippetResultBase {
    /** The snippet id that was fetched (e.g. "ABC123#1"). */
    snippetId: string;
    /** Detected content type. */
    type: SnippetContentType;
    /** Snippet metadata from the server envelope. */
    metadata: {
        name: string;
        description: string;
        tags: string;
    };
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
 * A parsed playground snippet. The code has been fully decoded (Unicode,
 * base64) and, for V2 snippets, the manifest is available.
 */
export interface PlaygroundSnippetResult extends SnippetResultBase {
    type: "playground";
    /** The detected language of the snippet. */
    language: "JS" | "TS";
    /** Engine type the snippet was saved with, if available. */
    engine?: string;
    /**
     * The V2 manifest when the snippet uses the multi-file format.
     * `null` for legacy (V1) snippets.
     */
    manifest: V2Manifest | null;
    /**
     * For V1 (legacy) snippets this is the raw code string.
     * For V2 snippets this is the entry file's content.
     */
    code: string;
    /**
     * All source files in the snippet as authored (may include `.ts` files).
     * For V1 snippets this contains a single entry (`index.js` or `index.ts`).
     */
    files: Record<string, string>;
    /**
     * All files transpiled to JavaScript. `.ts`/`.tsx` files are transpiled
     * using the {@link TranspileFn} provided in options; `.js` files are
     * copied as-is. This is `null` when no `transpile` function was supplied
     * and the snippet contains TypeScript files.
     */
    jsFiles: Record<string, string> | null;
}

/**
 * A parsed non-playground snippet (NME, GUI, particles, etc.).
 * The `data` field contains the already-parsed serialization object
 * that can be passed directly to the corresponding `Parse` method.
 */
export interface DataSnippetResult extends SnippetResultBase {
    type: Exclude<SnippetContentType, "playground" | "unknown">;
    /** The parsed serialization object from the snippet payload. */
    data: unknown;
}

/** Snippet whose type could not be determined. */
export interface UnknownSnippetResult extends SnippetResultBase {
    type: "unknown";
    /** The raw parsed jsonPayload object, for the consumer to inspect. */
    rawPayload: unknown;
}

/** Union of all possible snippet results. */
export type SnippetResult = PlaygroundSnippetResult | DataSnippetResult | UnknownSnippetResult;
