import { DecodeBase64ToBinary } from "@dev/core";
import type {
    SnippetServerResponse,
    SnippetContentType,
    SnippetResult,
    PlaygroundSnippetResult,
    DataSnippetResult,
    UnknownSnippetResult,
    PlaygroundPayload,
    V2Manifest,
    TranspileFn,
} from "./types";
import { fetchSnippet, DEFAULT_SNIPPET_URL } from "./fetchSnippet";
import * as ts from "typescript";

// -----------------------------------------------------------------------
// Base-64 / Unicode helpers
// -----------------------------------------------------------------------

/**
 * Reproduced from legacy Babylon 5.x StringUtils so that older playground
 * snippets (which may have been encoded with the old encoder) still decode
 * correctly even if `DecodeBase64ToBinary` from core behaves differently.
 */
function decodeBase64ToBinaryLegacy(base64Data: string): ArrayBuffer {
    const decoded = atob(base64Data);
    const buf = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
        buf[i] = decoded.charCodeAt(i);
    }
    return buf.buffer;
}

/**
 * Decodes a Base64-encoded UTF-8 string back to a JS string.
 * Falls back to the legacy decoder when the core helper is unavailable.
 */
function decodeBase64ToString(base64Data: string): string {
    const decode = DecodeBase64ToBinary ?? decodeBase64ToBinaryLegacy;
    const bytes = new Uint8Array(decode(base64Data));
    return new TextDecoder("utf-8").decode(bytes);
}

// -----------------------------------------------------------------------
// TypeScript transpilation
// -----------------------------------------------------------------------

/**
 * Built-in transpile function using the bundled TypeScript compiler.
 * Matches the compiler options used by the Playground's TsPipeline.
 */
function builtInTranspile(source: string, fileName: string): string {
    const result = ts.transpileModule(source, {
        compilerOptions: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            jsx: fileName.endsWith(".tsx") ? ts.JsxEmit.ReactJSX : undefined,
            esModuleInterop: true,
            allowJs: true,
            sourceMap: false,
        },
        fileName,
    });
    return result.outputText;
}

/**
 * Returns the built-in {@link TranspileFn} backed by the bundled
 * TypeScript compiler.
 *
 * Useful when you need the transpiler for purposes beyond
 * `loadSnippet` — e.g. transpiling user-edited code on the fly.
 *
 * @example
 * ```ts
 * const transpile = createTypeScriptTranspiler();
 * const js = transpile("const x: number = 1;", "example.ts");
 * ```
 */
export function createTypeScriptTranspiler(): TranspileFn {
    return builtInTranspile;
}

/**
 * Transpiles all `.ts`/`.tsx` files in a file map to JavaScript.
 * `.js` files are copied through unchanged.
 */
async function transpileFiles(files: Record<string, string>, transpile: TranspileFn): Promise<Record<string, string>> {
    const jsFiles: Record<string, string> = {};
    for (const [path, source] of Object.entries(files)) {
        if (/\.tsx?$/i.test(path)) {
            const jsPath = path.replace(/\.tsx?$/i, ".js");
            jsFiles[jsPath] = await transpile(source, path);
        } else {
            jsFiles[path] = source;
        }
    }
    return jsFiles;
}

// -----------------------------------------------------------------------
// JSON-payload key → content type mapping
// -----------------------------------------------------------------------

/**
 * Maps known keys that appear inside a parsed `jsonPayload` object to
 * their corresponding {@link SnippetContentType}.
 *
 * Order matters: we check the most specific keys first.
 */
const PAYLOAD_KEY_TO_TYPE: ReadonlyArray<[key: string, type: SnippetContentType]> = [
    ["nodeMaterial", "nodeMaterial"],
    ["nodeGeometry", "nodeGeometry"],
    ["nodeRenderGraph", "nodeRenderGraph"],
    ["nodeParticle", "nodeParticle"],
    ["gui", "gui"],
    ["encodedGui", "gui"],
    ["animations", "animation"],
    ["animation", "animation"],
    ["particleSystem", "particleSystem"],
    ["spriteManager", "spriteManager"],
    ["shaderMaterial", "shaderMaterial"],
];

// -----------------------------------------------------------------------
// Playground helpers
// -----------------------------------------------------------------------

/** Well-known JS function names that indicate a V1 playground snippet. */
const JS_ENTRY_FUNCTIONS = ["delayCreateScene", "createScene", "CreateScene", "createscene", "createEngine"];

/**
 * Guesses whether `code` is TypeScript or JavaScript using the same
 * heuristics the playground itself uses.
 */
function guessLanguage(code: string): "TS" | "JS" {
    if (code.includes("class Playground")) {
        return "TS";
    }
    if (JS_ENTRY_FUNCTIONS.some((fn) => code.includes(fn))) {
        return "JS";
    }
    if (!code) {
        return "JS";
    }

    // Strong TS signals
    const tsSignals = [
        /\binterface\s+[A-Za-z_]\w*/m,
        /\benum\s+[A-Za-z_]\w*/m,
        /\btype\s+[A-Za-z_]\w*\s*=/m,
        /\bimplements\s+[A-Za-z_]/m,
        /\breadonly\b/m,
        /\bpublic\b|\bprivate\b|\bprotected\b/m,
        /\babstract\s+class\b/m,
        /\bas\s+const\b/m,
        /\bimport\s+type\s+/m,
    ];
    const hasTypeAnn = /[:]\s*[A-Za-z_$][\w$.<>,\s?\\[\]|&]*\b(?![:=])/m.test(code);

    if (tsSignals.some((r) => r.test(code)) || hasTypeAnn) {
        return "TS";
    }
    return "JS";
}

/**
 * Appends export statements to legacy (V1) code so it can work in the
 * modern module-based runner. Mirrors the playground's own logic.
 */
function appendLegacyExports(code: string, language: "TS" | "JS"): string {
    let result = code;
    const defaultExport = language === "TS" ? "Playground" : (JS_ENTRY_FUNCTIONS.find((fn) => code.includes(fn)) ?? "createScene");
    result += `\nexport default ${defaultExport}\n`;
    if (language === "JS" && code.includes("createEngine")) {
        result += `\nexport { createEngine }\n`;
    }
    return result;
}

// -----------------------------------------------------------------------
// Type detection
// -----------------------------------------------------------------------

/**
 * Detects the content type of a parsed jsonPayload object by checking
 * for the presence of known keys.
 */
function detectContentType(parsedPayload: Record<string, unknown>): SnippetContentType {
    // Check if it looks like a V2 playground manifest
    if (parsedPayload.files && typeof parsedPayload.files === "object" && parsedPayload.v !== undefined) {
        return "playground";
    }

    // Check if it has a `code` key (playground inner payload)
    if (typeof parsedPayload.code === "string") {
        return "playground";
    }

    // Check known data-snippet keys
    for (const [key, type] of PAYLOAD_KEY_TO_TYPE) {
        if (key in parsedPayload) {
            return type;
        }
    }

    return "unknown";
}

// -----------------------------------------------------------------------
// Playground payload parsing
// -----------------------------------------------------------------------

function parsePlaygroundPayload(parsedPayload: Record<string, unknown>, snippetId: string, metadata: SnippetResult["metadata"]): PlaygroundSnippetResult {
    // Case 1: the parsedPayload *is* a V2 manifest (loaded from local JSON export).
    if (parsedPayload.files && typeof parsedPayload.files === "object" && parsedPayload.v !== undefined) {
        const v2 = parsedPayload as unknown as V2Manifest;
        const entry = v2.entry || (v2.language === "JS" ? "index.js" : "index.ts");
        return {
            snippetId,
            type: "playground",
            metadata,
            language: v2.language ?? "JS",
            manifest: { ...v2, entry },
            code: v2.files[entry] ?? "",
            files: { ...v2.files },
            jsFiles: null, // populated later by transpilation step
        };
    }

    // Case 2: standard playground inner payload with `code` key.
    const payload = parsedPayload as unknown as PlaygroundPayload;
    let code: string = String(payload.code ?? "");

    // Decode Unicode-safe payload when present.
    if (payload.unicode) {
        code = decodeBase64ToString(payload.unicode);
    }

    // Attempt to parse `code` as a V2 manifest JSON.
    try {
        const maybeV2 = JSON.parse(code);
        if (maybeV2 && maybeV2.files && typeof maybeV2.files === "object") {
            const v2 = maybeV2 as V2Manifest;
            const entry = v2.entry || (v2.language === "JS" ? "index.js" : "index.ts");
            return {
                snippetId,
                type: "playground",
                metadata,
                language: v2.language ?? "JS",
                engine: payload.engine,
                manifest: { ...v2, entry },
                code: v2.files[entry] ?? "",
                files: { ...v2.files },
                jsFiles: null,
            };
        }
    } catch {
        // Not a V2 manifest — treat as V1 legacy code below.
    }

    // V1 legacy snippet.
    const language = guessLanguage(code);
    const fileName = language === "TS" ? "index.ts" : "index.js";
    const codeWithExports = appendLegacyExports(code, language);

    return {
        snippetId,
        type: "playground",
        metadata,
        language,
        engine: payload.engine,
        manifest: null,
        code: codeWithExports,
        files: { [fileName]: codeWithExports },
        jsFiles: null,
    };
}

// -----------------------------------------------------------------------
// Data-snippet parsing (NME, GUI, etc.)
// -----------------------------------------------------------------------

function parseDataPayload(
    parsedPayload: Record<string, unknown>,
    contentType: Exclude<SnippetContentType, "playground" | "unknown">,
    snippetId: string,
    metadata: SnippetResult["metadata"]
): DataSnippetResult {
    let data: unknown;

    switch (contentType) {
        case "gui": {
            // GUI can be stored in `gui` (plain) or `encodedGui` (Base64 UTF-8).
            if (typeof parsedPayload.encodedGui === "string") {
                data = JSON.parse(decodeBase64ToString(parsedPayload.encodedGui));
            } else {
                data = typeof parsedPayload.gui === "string" ? JSON.parse(parsedPayload.gui) : parsedPayload.gui;
            }
            break;
        }
        case "animation": {
            // `animations` (plural) contains `{ animations: [...] }`;
            // `animation` (singular) is a single object.
            if (typeof parsedPayload.animations === "string") {
                data = JSON.parse(parsedPayload.animations);
            } else if (parsedPayload.animations !== undefined) {
                data = parsedPayload.animations;
            } else if (typeof parsedPayload.animation === "string") {
                data = JSON.parse(parsedPayload.animation);
            } else {
                data = parsedPayload.animation;
            }
            break;
        }
        default: {
            // All other types: the value at the key is a stringified JSON or an object.
            const key = contentType as string;
            const raw = parsedPayload[key];
            data = typeof raw === "string" ? JSON.parse(raw) : raw;
            break;
        }
    }

    return { snippetId, type: contentType, metadata, data };
}

// -----------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------

export interface LoadSnippetOptions {
    /** Override the snippet server URL. Defaults to `https://snippet.babylonjs.com`. */
    snippetUrl?: string;
    /**
     * Custom transpile function for TS → JS conversion.
     * When not provided, the bundled TypeScript compiler is used.
     *
     * Supply your own function if you already have a TypeScript instance
     * (e.g. Monaco's TS worker) or prefer a different transpiler (sucrase,
     * esbuild-wasm, etc.).
     */
    transpile?: TranspileFn;
}

/**
 * Loads a snippet from the snippet server, detects its type, decodes
 * the payload, and returns a typed result.
 *
 * For playground snippets containing TypeScript, the files are
 * automatically transpiled to JavaScript using the bundled TypeScript
 * compiler. The result's `jsFiles` will contain ready-to-run JS.
 *
 * @param snippetId - Snippet identifier, e.g. `"ABC123"` or `"ABC123#2"`.
 * @param options - Optional configuration.
 * @returns A fully parsed {@link SnippetResult}.
 *
 * @example
 * ```ts
 * import { loadSnippet } from "@tools/snippet-loader";
 *
 * const result = await loadSnippet("ABC123#0");
 *
 * if (result.type === "playground") {
 *     // jsFiles is always populated — TS has been transpiled to JS
 *     console.log(result.jsFiles);
 * } else if (result.type === "nodeMaterial") {
 *     // result.data is the NME serialization object
 *     NodeMaterial.Parse(result.data, scene);
 * }
 * ```
 */
export async function loadSnippet(snippetId: string, options?: LoadSnippetOptions): Promise<SnippetResult> {
    const serverResponse = await fetchSnippet(snippetId, options?.snippetUrl ?? DEFAULT_SNIPPET_URL);
    return parseSnippetResponse(serverResponse, snippetId, options);
}

/**
 * Parses an already-fetched snippet server response without making a
 * network call. Useful when the consumer has its own fetching strategy
 * or is working with locally saved snippet JSON.
 *
 * For playground snippets containing TypeScript, the files are
 * automatically transpiled to JavaScript.
 *
 * @param response - The raw server response envelope.
 * @param snippetId - The original snippet id (stored in the result for reference).
 * @param options - Optional configuration (e.g. custom transpile function).
 * @returns A fully parsed {@link SnippetResult}.
 */
export async function parseSnippetResponse(response: SnippetServerResponse, snippetId: string, options?: LoadSnippetOptions): Promise<SnippetResult> {
    const metadata = {
        name: response.name ?? "",
        description: response.description ?? "",
        tags: response.tags ?? "",
    };

    // The server stores the data in `jsonPayload`; older records may only have `payload`.
    const rawPayloadStr = response.jsonPayload ?? response.payload ?? "{}";
    let parsedPayload: Record<string, unknown>;
    try {
        parsedPayload = JSON.parse(rawPayloadStr) as Record<string, unknown>;
    } catch {
        return { snippetId, type: "unknown", metadata, rawPayload: rawPayloadStr } satisfies UnknownSnippetResult;
    }

    const contentType = detectContentType(parsedPayload);

    switch (contentType) {
        case "playground": {
            const result = parsePlaygroundPayload(parsedPayload, snippetId, metadata);

            // Transpile TS → JS to produce ready-to-run jsFiles.
            const hasTs = Object.keys(result.files).some((p) => /\.tsx?$/i.test(p));
            if (hasTs) {
                const transpile = options?.transpile ?? builtInTranspile;
                result.jsFiles = await transpileFiles(result.files, transpile);
            } else {
                // All files are already JS — jsFiles mirrors files.
                result.jsFiles = { ...result.files };
            }
            return result;
        }
        case "unknown":
            return { snippetId, type: "unknown", metadata, rawPayload: parsedPayload } satisfies UnknownSnippetResult;
        default:
            return parseDataPayload(parsedPayload, contentType, snippetId, metadata);
    }
}
