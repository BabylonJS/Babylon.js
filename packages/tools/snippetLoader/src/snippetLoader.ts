import { DecodeBase64ToBinary } from "@dev/core";
import type {
    ISnippetServerResponse,
    SnippetContentType,
    SnippetResult,
    IPlaygroundSnippetResult,
    IDataSnippetResult,
    IUnknownSnippetResult,
    IPlaygroundPayload,
    IV2Manifest,
    TranspileFn,
    ModuleFormat,
    ICreateEngineOptions,
    CreateEngineSource,
    IRuntimeFeatures,
    IInitializeRuntimeOptions,
} from "./types";
import { DefaultRuntimeBaseUrl, RuntimeScriptPaths } from "./types";
import { FetchSnippet, DEFAULT_SNIPPET_URL } from "./fetchSnippet";
// Monaco bundles a browser-safe TypeScript (require = void 0) that avoids
// Node.js builtins.  We only need the compiler API, not the editor.
import { typescript as ts } from "monaco-editor/esm/vs/language/typescript/lib/typescriptServices";

// -----------------------------------------------------------------------
// Base-64 / Unicode helpers
// -----------------------------------------------------------------------

/**
 * Reproduced from legacy Babylon 5.x StringUtils so that older playground
 * snippets (which may have been encoded with the old encoder) still decode
 * correctly even if `DecodeBase64ToBinary` from core behaves differently.
 *
 * @param base64Data - The Base64-encoded string to decode.
 * @returns The decoded binary data as an ArrayBuffer.
 */
function DecodeBase64ToBinaryLegacy(base64Data: string): ArrayBuffer {
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
 *
 * @param base64Data - The Base64-encoded UTF-8 string.
 * @returns The decoded JavaScript string.
 */
function DecodeBase64ToString(base64Data: string): string {
    const decode = DecodeBase64ToBinary ?? DecodeBase64ToBinaryLegacy;
    const bytes = new Uint8Array(decode(base64Data));
    return new TextDecoder("utf-8").decode(bytes);
}

// -----------------------------------------------------------------------
// TypeScript transpilation
// -----------------------------------------------------------------------

/**
 * Built-in transpile function using Monaco's browser-safe TypeScript bundle.
 * Compiler options match the Playground's TsPipeline.
 *
 * @param source - The TypeScript source code to transpile.
 * @param fileName - The file name for diagnostics (e.g. `"index.ts"`).
 * @param moduleFormat - Target module format. `"esm"` uses ESNext modules;
 *                       `"script"` uses `ModuleKind.None` (no imports/exports).
 * @returns The transpiled JavaScript string.
 */
function BuiltInTranspile(source: string, fileName: string, moduleFormat: ModuleFormat = "esm"): string {
    const result = ts.transpileModule(source, {
        compilerOptions: {
            target: ts.ScriptTarget.ESNext,
            module: moduleFormat === "esm" ? ts.ModuleKind.ESNext : ts.ModuleKind.None,
            jsx: fileName.endsWith(".tsx") ? ts.JsxEmit.ReactJSX : undefined,
            esModuleInterop: false,
            allowJs: true,
            sourceMap: false,
            experimentalDecorators: true,
            emitDecoratorMetadata: false,
            isolatedModules: true,
            strict: false,
            allowUmdGlobalAccess: true,
        },
        fileName,
    });
    return result.outputText;
}

/**
 * Creates a {@link TranspileFn} from a TypeScript compiler instance.
 *
 * @param tsInstance - TypeScript namespace (must expose `transpileModule`,
 *                     `ScriptTarget`, `ModuleKind`, `JsxEmit`).
 * @param moduleFormat - Target module format (default: `"esm"`).
 * @returns A transpile function that converts TS source to JS.
 */
export function CreateTypeScriptTranspiler(tsInstance: any, moduleFormat: ModuleFormat = "esm"): TranspileFn {
    return (source: string, fileName: string): string => {
        const result = tsInstance.transpileModule(source, {
            compilerOptions: {
                target: tsInstance.ScriptTarget.ESNext,
                module: moduleFormat === "esm" ? tsInstance.ModuleKind.ESNext : tsInstance.ModuleKind.None,
                jsx: fileName.endsWith(".tsx") ? tsInstance.JsxEmit.ReactJSX : undefined,
                esModuleInterop: false,
                allowJs: true,
                sourceMap: false,
                experimentalDecorators: true,
                emitDecoratorMetadata: false,
                isolatedModules: true,
                strict: false,
                allowUmdGlobalAccess: true,
            },
            fileName,
        });
        return result.outputText;
    };
}

/**
 * Transpiles all `.ts`/`.tsx` files in a file map to JavaScript.
 * `.js` files are copied through unchanged.
 *
 * @param files - Map of file paths to their TypeScript/JavaScript source code.
 * @param transpile - The transpile function to use for TS → JS conversion.
 * @returns A new map with all `.ts`/`.tsx` entries replaced by `.js` equivalents.
 */
async function TranspileFiles(files: Record<string, string>, transpile: TranspileFn): Promise<Record<string, string>> {
    const jsFiles: Record<string, string> = {};
    const transpileJobs: Array<Promise<void>> = [];
    for (const [path, source] of Object.entries(files)) {
        if (/\.tsx?$/i.test(path)) {
            const jsPath = path.replace(/\.tsx?$/i, ".js");
            transpileJobs.push(
                (async () => {
                    jsFiles[jsPath] = await Promise.resolve(transpile(source, path));
                })()
            );
        } else {
            jsFiles[path] = source;
        }
    }
    await Promise.all(transpileJobs);
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
const PayloadKeyToType: ReadonlyArray<[key: string, type: SnippetContentType]> = [
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
const JsEntryFunctions = ["delayCreateScene", "delayLoadScene", "createScene", "CreateScene", "createscene"];

/**
 * Guesses whether `code` is TypeScript or JavaScript using the same
 * heuristics the playground itself uses.
 *
 * @param code - The source code to inspect.
 * @returns `"TS"` or `"JS"`.
 */
function GuessLanguage(code: string): "TS" | "JS" {
    if (code.includes("class Playground")) {
        return "TS";
    }
    if (JsEntryFunctions.some((fn) => code.includes(fn))) {
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
 *
 * For JS snippets, also strips top-level `canvas`/`engine` declarations
 * that are standard boilerplate from the old playground template. They
 * would shadow the globals the loader has already set up (or will set up)
 * and typically reference a canvas by a hard-coded ID that doesn't match
 * the host page.  Only lines *before* the first function/var-function
 * declaration are considered to avoid false positives inside function bodies.
 *
 * @param code - The original snippet source code.
 * @param language - The detected language of the snippet.
 * @returns The code with appended export statements.
 */
function AppendLegacyExports(code: string, language: "TS" | "JS"): string {
    let result = code;

    if (language === "JS") {
        // Find the character offset of the first function-like declaration.
        // We only strip canvas/engine boilerplate lines that appear before
        // this point (i.e., top-level preamble), so that identical patterns
        // inside createEngine or similar functions are left untouched.
        const fnStart = result.search(/(?:var|let|const|function)\s+(?:createScene|delayCreateScene|delayLoadScene|createEngine|CreateScene)\b/);
        const preamble = fnStart > 0 ? result.slice(0, fnStart) : "";

        if (preamble) {
            const stripped = preamble
                .replace(/^[^\S\n]*(?:var|let|const)\s+canvas\s*=\s*document\.getElementById\s*\([^)]*\)\s*;?[^\S\n]*$/gm, "// [snippet-loader] canvas provided by host")
                .replace(/^[^\S\n]*(?:var|let|const)\s+engine\s*=\s*new\s+BABYLON\.\w*Engine\b[^;]*;?[^\S\n]*$/gm, "// [snippet-loader] engine provided by host");
            result = stripped + result.slice(fnStart);
        }
    }

    const defaultExport = language === "TS" ? "Playground" : (JsEntryFunctions.find((fn) => result.includes(fn)) ?? "createScene");
    result += `\nexport default ${defaultExport}\n`;
    // Only export createEngine if there's an actual function declaration/expression for it.
    if (language === "JS" && /\bfunction\s+createEngine\b|\bvar\s+createEngine\s*=|\bconst\s+createEngine\s*=|\blet\s+createEngine\s*=/.test(result)) {
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
 *
 * @param parsedPayload - The parsed JSON payload from the snippet server.
 * @returns The detected {@link SnippetContentType}.
 */
function DetectContentType(parsedPayload: Record<string, unknown>): SnippetContentType {
    // Check if it looks like a V2 playground manifest
    if (parsedPayload.files && typeof parsedPayload.files === "object" && parsedPayload.v !== undefined) {
        return "playground";
    }

    // Check if it has a `code` key (playground inner payload)
    if (typeof parsedPayload.code === "string") {
        return "playground";
    }

    // Check known data-snippet keys
    for (const [key, type] of PayloadKeyToType) {
        if (key in parsedPayload) {
            return type;
        }
    }

    return "unknown";
}

// -----------------------------------------------------------------------
// Playground payload parsing
// -----------------------------------------------------------------------

/**
 * Intermediate type for ParsePlaygroundPayload before functions are attached.
 * Contains everything except the executable functions (which are added by
 * ParseSnippetResponse after transpilation).
 */
type PlaygroundParseResult = Omit<
    IPlaygroundSnippetResult,
    "createEngine" | "createScene" | "createEngineSource" | "sceneFunctionName" | "jsFiles" | "moduleFormat" | "runtimeFeatures" | "initializeRuntimeAsync"
>;

function ParsePlaygroundPayload(parsedPayload: Record<string, unknown>, snippetId: string, metadata: SnippetResult["metadata"]): PlaygroundParseResult {
    // Case 1: the parsedPayload *is* a V2 manifest (loaded from local JSON export).
    if (parsedPayload.files && typeof parsedPayload.files === "object" && parsedPayload.v !== undefined) {
        const v2 = parsedPayload as unknown as IV2Manifest;
        const entry = v2.entry || (v2.language === "JS" ? "index.js" : "index.ts");
        return {
            snippetId,
            type: "playground",
            metadata,
            language: v2.language ?? "JS",
            engineType: undefined,
            isMultiFile: true,
            manifest: { ...v2, entry },
            code: v2.files[entry] ?? "",
            files: { ...v2.files },
        };
    }

    // Case 2: standard playground inner payload with `code` key.
    const payload = parsedPayload as unknown as IPlaygroundPayload;
    let code: string = String(payload.code ?? "");

    // Decode Unicode-safe payload when present.
    if (payload.unicode) {
        code = DecodeBase64ToString(payload.unicode);
    }

    // Attempt to parse `code` as a V2 manifest JSON.
    try {
        const maybeV2 = JSON.parse(code);
        if (maybeV2 && maybeV2.files && typeof maybeV2.files === "object") {
            const v2 = maybeV2 as IV2Manifest;
            const entry = v2.entry || (v2.language === "JS" ? "index.js" : "index.ts");
            return {
                snippetId,
                type: "playground",
                metadata,
                language: v2.language ?? "JS",
                engineType: payload.engine,
                isMultiFile: true,
                manifest: { ...v2, entry },
                code: v2.files[entry] ?? "",
                files: { ...v2.files },
            };
        }
    } catch {
        // Not a V2 manifest — treat as V1 legacy code below.
    }

    // V1 legacy snippet.
    const language = GuessLanguage(code);
    const fileName = language === "TS" ? "index.ts" : "index.js";
    const codeWithExports = AppendLegacyExports(code, language);

    return {
        snippetId,
        type: "playground",
        metadata,
        language,
        engineType: payload.engine,
        isMultiFile: false,
        manifest: null,
        code: codeWithExports,
        files: { [fileName]: codeWithExports },
    };
}

// -----------------------------------------------------------------------
// Data-snippet parsing (NME, GUI, etc.)
// -----------------------------------------------------------------------

function ParseDataPayload(
    parsedPayload: Record<string, unknown>,
    contentType: Exclude<SnippetContentType, "playground" | "unknown">,
    snippetId: string,
    metadata: SnippetResult["metadata"]
): IDataSnippetResult {
    let data: unknown;

    switch (contentType) {
        case "gui": {
            // GUI can be stored in `gui` (plain) or `encodedGui` (Base64 UTF-8).
            if (typeof parsedPayload.encodedGui === "string") {
                data = JSON.parse(DecodeBase64ToString(parsedPayload.encodedGui));
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

    return { snippetId, type: contentType, metadata, data, load: (parser?: (d: unknown) => any) => (parser ? parser(data) : data) };
}

// -----------------------------------------------------------------------
// Playground runner — ESM strategy (blob URLs + dynamic import)
// -----------------------------------------------------------------------

function ResolveRelative(fromPath: string, rel: string): string {
    const base = fromPath.split("/");
    base.pop();
    for (const s of rel.split("/")) {
        if (!s || s === ".") {
            continue;
        }
        if (s === "..") {
            base.pop();
        } else {
            base.push(s);
        }
    }
    return base.join("/");
}

/**
 * Resolves a relative import specifier to a filename in `jsFiles`,
 * trying the resolved path as-is, with a `.js` suffix, and with a
 * `./` prefix.
 *
 * @param resolved - The resolved relative path.
 * @param jsFiles - Map of file names to their JS source code.
 * @returns The matching file key, or `undefined`.
 */
function FindFileForSpec(resolved: string, jsFiles: Record<string, string>): string | undefined {
    const candidates = [resolved, `./${resolved}`, `${resolved}.js`, `./${resolved}.js`];
    for (const c of candidates) {
        if (c in jsFiles) {
            return c;
        }
    }
    return undefined;
}

/**
 * Loads a snippet's JS files as ES modules via blob URLs and returns
 * the imported module namespace.
 *
 * Uses a recursive DFS to process files in dependency order (leaves
 * first) so that every blob URL contains fully-rewritten code — no
 * blob URL ever holds an unresolved relative specifier.
 *
 * Bare specifiers (e.g. `@babylonjs/core`) are resolved via a synthetic
 * ES module that proxies the global `BABYLON` namespace, so snippets that
 * use `import { Scene } from "@babylonjs/core"` work in a UMD environment.
 *
 * @param jsFiles - Map of file names to their JS source code.
 * @param entryName - The entry file name to import.
 * @param externalImports - Optional map of bare specifiers to CDN URLs
 *                          (from the V2 manifest `imports` field).
 * @returns The imported module namespace.
 */
async function LoadModuleEsm(jsFiles: Record<string, string>, entryName: string, externalImports?: Record<string, string>): Promise<any> {
    const finalUrls: Record<string, string> = {};
    const processing = new Set<string>();

    // Maps bare specifiers (e.g. "@babylonjs/core") to synthetic blob URLs
    // that proxy the global BABYLON namespace.
    const bareSpecifierUrls: Record<string, string> = {};

    /**
     * Creates a synthetic ES module blob URL that re-exports all own
     * properties of `globalThis.BABYLON` as named exports plus a default
     * export of the entire namespace.  This lets code like
     * `import { Scene, Vector3 } from "@babylonjs/core"` work when
     * Babylon.js is loaded via UMD `<script>` tags.
     *
     * @returns The blob URL for the synthetic BABYLON proxy module.
     */
    function getBabylonProxyUrl(): string {
        if (bareSpecifierUrls["__babylonProxy__"]) {
            return bareSpecifierUrls["__babylonProxy__"];
        }
        const ns = (globalThis as any).BABYLON;
        const lines: string[] = [`const B = globalThis.BABYLON || {};`, `export default B;`];
        if (ns && typeof ns === "object") {
            for (const key of Object.keys(ns)) {
                // Only re-export valid JS identifiers.
                if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
                    lines.push(`export const ${key} = B[${JSON.stringify(key)}];`);
                }
            }
        }
        const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/javascript" }));
        bareSpecifierUrls["__babylonProxy__"] = url;
        return url;
    }

    /**
     * Returns a blob URL for a bare specifier.  All `@babylonjs/*` specifiers
     * share a single synthetic proxy module since they all map to the global
     * `BABYLON` namespace in UMD builds.
     *
     * @param specifier - The bare import specifier.
     * @returns The blob URL, or `undefined` if this specifier is unknown.
     */
    function resolveBareSpecifier(specifier: string): string | undefined {
        if (bareSpecifierUrls[specifier]) {
            return bareSpecifierUrls[specifier];
        }
        // Recognise any @babylonjs/* package.
        if (specifier.startsWith("@babylonjs/")) {
            const url = getBabylonProxyUrl();
            bareSpecifierUrls[specifier] = url;
            return url;
        }
        // Recognise specifiers listed in the V2 manifest imports map.
        if (externalImports && specifier in externalImports) {
            // The imports map value is a CDN URL — we can use it directly.
            return externalImports[specifier];
        }
        return undefined;
    }

    /**
     * Returns `true` when the file name looks like a JavaScript / module
     * file that the browser can execute directly.  Everything else (shaders,
     * JSON, text assets, …) needs to be wrapped as a synthetic ES module
     * that re-exports the raw content as `default`.
     *
     * @param name - File name or relative path.
     * @returns Whether the file is a JS source file.
     */
    function isJsFile(name: string): boolean {
        return /\.m?jsx?$/i.test(name);
    }

    /**
     * Wraps raw text content as a synthetic ES module that exports the
     * content as the default export.  This allows JS files to
     * `import shaderCode from "./myShader.glsl"` and receive the text.
     *
     * @param content - The raw file content.
     * @returns JavaScript source for a module that exports `content`.
     */
    function wrapAsTextModule(content: string): string {
        return `export default ${JSON.stringify(content)};\n`;
    }

    /**
     * Ensures `fileName` has a fully-rewritten blob URL.  Dependencies
     * are processed first (recursively).  Circular dependencies are
     * broken by creating a blob from the original (unrewritten) code
     * so the import chain doesn't deadlock.
     *
     * Non-JS files (shaders, JSON, text) are wrapped as synthetic ES
     * modules that export their raw text as the default export.
     *
     * @param fileName - The file to process.
     * @returns The blob URL for the processed file.
     */
    function processFile(fileName: string): string {
        if (finalUrls[fileName]) {
            return finalUrls[fileName];
        }

        // Non-JS asset — wrap as a text-exporting ES module.
        if (!isJsFile(fileName)) {
            const url = URL.createObjectURL(new Blob([wrapAsTextModule(jsFiles[fileName])], { type: "text/javascript" }));
            finalUrls[fileName] = url;
            return url;
        }

        if (processing.has(fileName)) {
            // Circular dependency — create a blob from the original code
            // so we don't infinite-loop.  Innermost cycle member may have
            // unresolved relative specifiers, but this is an edge case
            // that practically never occurs in playground snippets.
            const url = URL.createObjectURL(new Blob([jsFiles[fileName]], { type: "text/javascript" }));
            finalUrls[fileName] = url;
            return url;
        }

        processing.add(fileName);

        const relativeRewriter = (_m: string, pre: string, spec: string, post: string): string => {
            const resolved = ResolveRelative(fileName, spec);
            const target = FindFileForSpec(resolved, jsFiles);
            if (target) {
                // Recurse: ensure the target file is processed first.
                const url = processFile(target);
                return `${pre}${url}${post}`;
            }
            // Not a snippet-internal import — leave as-is.
            return `${pre}${spec}${post}`;
        };

        // Rewrite bare (non-relative) specifiers like "@babylonjs/core" to
        // blob URLs that proxy the global BABYLON namespace.
        const bareRewriter = (_m: string, pre: string, spec: string, post: string): string => {
            const url = resolveBareSpecifier(spec);
            if (url) {
                return `${pre}${url}${post}`;
            }
            return `${pre}${spec}${post}`;
        };

        let code = jsFiles[fileName];
        // Pass 1: rewrite relative specifiers (./foo, ../bar).
        code = code.replace(/((?:from|import)\s*["'])(\.[^"']+)(["'])/g, relativeRewriter).replace(/(import\s*\(\s*["'])(\.[^"']+)(["']\s*\))/g, relativeRewriter);
        // Pass 2: rewrite bare specifiers (@babylonjs/core, etc.).
        code = code.replace(/((?:from|import)\s*["'])([^"'./][^"']*)(["'])/g, bareRewriter).replace(/(import\s*\(\s*["'])([^"'./][^"']*)(["']\s*\))/g, bareRewriter);

        const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
        finalUrls[fileName] = url;
        processing.delete(fileName);
        return url;
    }

    // Start from the entry — dependencies are pulled in recursively.
    processFile(entryName);

    // Also process any files not reachable from the entry (side-effect modules).
    // Only process JS files — non-JS assets are only loaded when imported.
    for (const name of Object.keys(jsFiles)) {
        if (!finalUrls[name] && isJsFile(name)) {
            processFile(name);
        }
    }

    const entryUrl = finalUrls[entryName] ?? Object.values(finalUrls)[0];
    const mod = await import(/* webpackIgnore: true */ entryUrl);

    for (const u of Object.values(finalUrls)) {
        URL.revokeObjectURL(u);
    }
    for (const u of Object.values(bareSpecifierUrls)) {
        URL.revokeObjectURL(u);
    }
    return mod;
}

// -----------------------------------------------------------------------
// Playground runner — Script strategy (new Function, no module syntax)
// -----------------------------------------------------------------------

/**
 * Strips remaining import/export/require statements from script-mode code.
 * After TypeScript transpiles with `ModuleKind.None`, there should be very
 * few left, but we clean up any remnants.
 *
 * @param code - The JavaScript code to clean up.
 * @returns The code with module syntax removed.
 */
function StripModuleSyntax(code: string): string {
    return code
        .replace(/^\s*import\s+.*?;?\s*$/gm, "")
        .replace(/^\s*export\s+(default\s+)?/gm, "")
        .replace(/^\s*exports\.\w+\s*=.*?;?\s*$/gm, "")
        .replace(/\brequire\s*\(\s*["'][^"']+["']\s*\)/g, "undefined");
}

/**
 * Loads a snippet's JS files in script mode: concatenates all files,
 * strips module syntax, wraps in a function, and extracts exports.
 *
 * @param jsFiles - Map of file names to their JS source code.
 * @param entryName - The entry file name.
 * @returns A dictionary of top-level function/class declarations found
 *          in the code (e.g. `createScene`, `createEngine`, `Playground`, etc.).
 */
function LoadModuleScript(jsFiles: Record<string, string>, entryName: string): Record<string, any> {
    // Concatenate only JS files: entry file last so it can reference helpers.
    // Non-JS assets (shaders, JSON, etc.) are skipped — they cannot be
    // concatenated as script code.
    const orderedFiles = Object.entries(jsFiles)
        .filter(([name]) => /\.m?jsx?$/i.test(name))
        .sort(([a], [b]) => {
            if (a === entryName) {
                return 1;
            }
            if (b === entryName) {
                return -1;
            }
            return 0;
        });
    let combined = orderedFiles.map(([, code]) => StripModuleSyntax(code)).join("\n;\n");

    // Build a return object that captures known function names.
    const knownNames = ["createScene", "CreateScene", "createscene", "delayCreateScene", "delayLoadScene", "DelayCreateScene", "createEngine", "Playground"];
    const returnExpr = knownNames.map((n) => `${n}: typeof ${n} !== 'undefined' ? ${n} : undefined`).join(", ");
    combined += `\n; return { ${returnExpr} };`;

    const factory = new Function(combined);
    return factory() ?? {};
}

// -----------------------------------------------------------------------
// Detect scene function from module exports
// -----------------------------------------------------------------------

interface IDetectedFunctions {
    createSceneFn: ((...args: any[]) => any) | null;
    sceneFunctionName: string;
    createEngineFn: ((...args: any[]) => any) | null;
}

function DetectFunctions(mod: Record<string, any>): IDetectedFunctions {
    let createSceneFn: any = null;
    let sceneFunctionName = "";

    const checks: [() => any, string][] = [
        [() => mod.default?.CreateScene, "default.CreateScene"],
        [() => mod.default?.DelayCreateScene, "default.DelayCreateScene"],
        [() => mod.Playground?.CreateScene, "Playground.CreateScene"],
        [() => mod.Playground?.DelayCreateScene, "Playground.DelayCreateScene"],
        [() => (typeof mod.delayCreateScene === "function" ? mod.delayCreateScene : null), "delayCreateScene"],
        [() => (typeof mod.delayLoadScene === "function" ? mod.delayLoadScene : null), "delayLoadScene"],
        [() => (typeof mod.createScene === "function" ? mod.createScene : null), "createScene"],
        [() => (typeof mod.CreateScene === "function" ? mod.CreateScene : null), "CreateScene"],
        [() => (typeof mod.createscene === "function" ? mod.createscene : null), "createscene"],
        [() => (typeof mod.default === "function" ? mod.default : null), "default"],
    ];

    for (const [getter, name] of checks) {
        const fn = getter();
        if (fn) {
            createSceneFn = fn;
            sceneFunctionName = name;
            break;
        }
    }

    let createEngineFn: any = null;
    if (typeof mod.createEngine === "function") {
        createEngineFn = mod.createEngine;
    }

    return { createSceneFn, sceneFunctionName, createEngineFn };
}

// -----------------------------------------------------------------------
// Build the createEngine / createScene functions for the result
// -----------------------------------------------------------------------

interface IBuildResult {
    createEngine: IPlaygroundSnippetResult["createEngine"];
    createScene: IPlaygroundSnippetResult["createScene"];
    createEngineSource: CreateEngineSource;
    sceneFunctionName: string;
}

/**
 * Default engine factory used when the snippet doesn't define `createEngine`.
 * Uses the global `BABYLON.Engine` or `BABYLON.WebGPUEngine` based on the
 * snippet's saved engine type.
 *
 * @param engineType - The engine type from the snippet metadata.
 * @returns An async function that creates a Babylon.js engine.
 */
function DefaultCreateEngine(engineType: string | undefined): IPlaygroundSnippetResult["createEngine"] {
    return async (canvas: HTMLCanvasElement, options?: ICreateEngineOptions) => {
        const antialias = options?.antialias ?? true;
        const engineOptions = options?.engineOptions ?? { preserveDrawingBuffer: true, stencil: true };
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const BABYLON = (globalThis as any).BABYLON;
        if (!BABYLON) {
            throw new Error("BABYLON is not available on globalThis. Ensure Babylon.js is loaded before calling createEngine.");
        }
        if (engineType === "WebGPU" && BABYLON.WebGPUEngine) {
            const eng = new BABYLON.WebGPUEngine(canvas, { antialias, enableAllFeatures: true, setMaximumLimits: true, ...engineOptions });
            await eng.initAsync();
            return eng;
        }
        return new BABYLON.Engine(canvas, antialias, engineOptions);
    };
}

// -----------------------------------------------------------------------
// Runtime feature detection & initialisation
// -----------------------------------------------------------------------

/**
 * Probes the snippet source code for references to runtime dependencies
 * that may require external scripts and global initialisation.
 *
 * @param files - All source files to probe.
 * @returns The detected runtime feature flags.
 */
function DetectRuntimeFeatures(files: Record<string, string>): IRuntimeFeatures {
    const allSource = Object.values(files).join("\n");
    return {
        havok: /\bHavokPlugin\b/.test(allSource),
        ammo: /\bAmmoJSPlugin\b/.test(allSource),
        recast: /\bRecastJSPlugin\b/.test(allSource),
    };
}

/**
 * Injects a `<script>` tag for the given URL and resolves when it loads.
 * Each URL is loaded at most once.
 */
const LoadScriptOnce = (() => {
    const seen = new Set<string>();
    return async (url: string): Promise<void> =>
        await new Promise<void>((resolve, reject) => {
            if (seen.has(url)) {
                return resolve();
            }
            const s = document.createElement("script");
            s.src = url;
            s.async = true;
            s.onload = () => {
                seen.add(url);
                resolve();
            };
            s.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(s);
        });
})();

/**
 * Initialises runtime globals that the snippet expects, mirroring the
 * Playground runner's `initRuntime()` logic.
 *
 * When `options.loadScripts` is `true`, missing factory functions are
 * loaded from the Babylon.js CDN (or custom URLs) before calling them.
 *
 * @param features - The detected runtime feature flags.
 * @param options - Optional configuration.
 */
async function InitializeRuntimeAsync(features: IRuntimeFeatures, options?: IInitializeRuntimeOptions): Promise<void> {
    const g = globalThis as any;
    const inject = options?.loadScripts === true;
    const urls = options?.scriptUrls ?? {};
    const base = (options?.baseUrl ?? DefaultRuntimeBaseUrl).replace(/\/+$/, "");

    const resolveUrl = (feature: keyof IRuntimeFeatures): string => urls[feature] ?? `${base}/${RuntimeScriptPaths[feature]}`;

    // AMMO
    if (features.ammo) {
        if (typeof g.Ammo !== "function" && inject) {
            try {
                await LoadScriptOnce(resolveUrl("ammo"));
            } catch {
                /* best-effort */
            }
        }
        if (typeof g.Ammo === "function") {
            try {
                await g.Ammo();
            } catch {
                /* best-effort */
            }
        }
    }

    // RECAST
    if (features.recast) {
        if (typeof g.Recast !== "function" && inject) {
            try {
                await LoadScriptOnce(resolveUrl("recast"));
            } catch {
                /* best-effort */
            }
        }
        if (typeof g.Recast === "function") {
            try {
                await g.Recast();
            } catch {
                /* best-effort */
            }
        }
    }

    // HAVOK
    if (features.havok) {
        if (typeof g.HavokPhysics !== "function" && inject) {
            try {
                await LoadScriptOnce(resolveUrl("havok"));
            } catch {
                /* best-effort */
            }
        }
        if (typeof g.HavokPhysics === "function" && typeof g.HK === "undefined") {
            try {
                g.HK = await g.HavokPhysics();
            } catch {
                /* best-effort */
            }
        }
    }
}

function BuildFunctions(
    jsFiles: Record<string, string>,
    entryName: string,
    moduleFormat: ModuleFormat,
    engineType: string | undefined,
    externalImports?: Record<string, string>
): IBuildResult {
    // We defer the actual module loading to when createScene/createEngine
    // are first called, so the result object can be inspected synchronously.
    let mod: Record<string, any> | null = null;
    let detected: IDetectedFunctions | null;

    const ensureLoadedAsync = async (): Promise<IDetectedFunctions> => {
        if (!detected) {
            if (moduleFormat === "esm") {
                mod = await LoadModuleEsm(jsFiles, entryName, externalImports);
            } else {
                mod = LoadModuleScript(jsFiles, entryName);
            }
            // eslint-disable-next-line require-atomic-updates
            detected = DetectFunctions(mod!);
        }
        return detected;
    };

    let createEngineSource: CreateEngineSource = "default";
    let sceneFunctionName = "";

    // eslint-disable-next-line no-restricted-syntax
    const createEngine: IPlaygroundSnippetResult["createEngine"] = async (canvas, options) => {
        const { createEngineFn } = await ensureLoadedAsync();
        if (createEngineFn) {
            createEngineSource = "snippet";
            return await createEngineFn(canvas, options);
        }
        createEngineSource = "default";
        return await DefaultCreateEngine(engineType)(canvas, options);
    };

    // eslint-disable-next-line no-restricted-syntax
    const createScene: IPlaygroundSnippetResult["createScene"] = async (engine, canvas) => {
        const { createSceneFn, sceneFunctionName: name } = await ensureLoadedAsync();
        sceneFunctionName = name;
        if (!createSceneFn) {
            throw new Error("No createScene export found in snippet " + "(tried: default.CreateScene, Playground.CreateScene, createScene, delayCreateScene, default).");
        }
        // Bind `this` to a proxy for legacy snippet compatibility.
        let sceneResult: any;
        const bound = createSceneFn.bind(
            new Proxy(
                {},
                {
                    get(_target: any, prop: PropertyKey) {
                        if (prop === "scene") {
                            return sceneResult;
                        }
                        if (prop === "engine") {
                            return engine;
                        }
                        if (prop === "canvas") {
                            return canvas;
                        }
                        return (globalThis as any)[prop];
                    },
                    set(_target: any, prop: PropertyKey, value: any) {
                        if (prop === "scene") {
                            sceneResult = value;
                            return true;
                        }
                        (globalThis as any)[prop] = value;
                        return true;
                    },
                }
            )
        );
        const returnValue = await bound(engine, canvas);
        // Prefer the explicit return value; fall back to the value set via
        // `this.scene = ...` in the proxy (common in legacy snippets that
        // don't return the scene).
        if (returnValue !== undefined && returnValue !== null) {
            sceneResult = returnValue;
        }
        return sceneResult;
    };

    // We eagerly load in script mode since it's synchronous, so we can
    // populate metadata fields immediately.
    if (moduleFormat === "script") {
        mod = LoadModuleScript(jsFiles, entryName);
        detected = DetectFunctions(mod);
        sceneFunctionName = detected.sceneFunctionName;
        createEngineSource = detected.createEngineFn ? "snippet" : "default";
    }

    return { createEngine, createScene, createEngineSource, sceneFunctionName };
}

// -----------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------

/**
 * Options for the {@link LoadSnippet} and {@link ParseSnippetResponse} functions.
 */
export interface ILoadSnippetOptions {
    /** Override the snippet server URL. Defaults to `https://snippet.babylonjs.com`. */
    snippetUrl?: string;
    /**
     * Custom transpile function for TS → JS conversion.
     * When not provided, the built-in transpiler (Monaco's bundled
     * TypeScript compiler) is used automatically.
     */
    transpile?: TranspileFn;
    /**
     * Target module format for the transpiled JS files and execution strategy.
     *
     * - `"esm"` (default) — ES modules, loaded via blob URLs + dynamic import.
     * - `"script"` — Plain script code (no imports/exports), loaded via `new Function()`.
     *   Suitable for environments where BABYLON is a global (e.g. UMD script-tag setups).
     */
    moduleFormat?: ModuleFormat;
}

/**
 * Loads a snippet from the snippet server, detects its type, decodes
 * the payload, and returns a typed result.
 *
 * For playground snippets containing TypeScript, the files are
 * automatically transpiled to JavaScript. The result's `jsFiles`
 * will contain ready-to-run JS.
 *
 * @param snippetId - Snippet identifier, e.g. `"ABC123"` or `"ABC123#2"`.
 * @param options - Optional configuration.
 * @returns A fully parsed {@link SnippetResult}.
 *
 * @example
 * ```ts
 * import { LoadSnippet } from "@tools/snippet-loader";
 *
 * const result = await LoadSnippet("ABC123#0");
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
export async function LoadSnippet(snippetId: string, options?: ILoadSnippetOptions): Promise<SnippetResult> {
    const serverResponse = await FetchSnippet(snippetId, options?.snippetUrl ?? DEFAULT_SNIPPET_URL);
    return await ParseSnippetResponse(serverResponse, snippetId, options);
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
export async function ParseSnippetResponse(response: ISnippetServerResponse, snippetId: string, options?: ILoadSnippetOptions): Promise<SnippetResult> {
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
        return { snippetId, type: "unknown", metadata, rawPayload: rawPayloadStr } satisfies IUnknownSnippetResult;
    }

    const contentType = DetectContentType(parsedPayload);
    const moduleFormat: ModuleFormat = options?.moduleFormat ?? "esm";

    switch (contentType) {
        case "playground": {
            const parsed = ParsePlaygroundPayload(parsedPayload, snippetId, metadata);
            const entryName = parsed.manifest?.entry?.replace(/\.tsx?$/i, ".js") ?? "index.js";

            // Transpile TS → JS.
            const hasTs = Object.keys(parsed.files).some((p) => /\.tsx?$/i.test(p));
            let jsFiles: Record<string, string>;
            if (hasTs) {
                const transpile = options?.transpile ?? ((src: string, fn: string) => BuiltInTranspile(src, fn, moduleFormat));
                jsFiles = await TranspileFiles(parsed.files, transpile);
            } else {
                jsFiles = { ...parsed.files };
            }

            // For script mode, strip module syntax from JS files.
            if (moduleFormat === "script") {
                for (const [path, code] of Object.entries(jsFiles)) {
                    jsFiles[path] = StripModuleSyntax(code);
                }
            }

            // Build the executable functions.
            const fns = BuildFunctions(jsFiles, entryName, moduleFormat, parsed.engineType, parsed.manifest?.imports);

            // Detect runtime dependencies from the original source (pre-transpile).
            const runtimeFeatures = DetectRuntimeFeatures(parsed.files);

            const result: IPlaygroundSnippetResult = {
                ...parsed,
                jsFiles,
                moduleFormat,
                createEngine: fns.createEngine,
                createScene: fns.createScene,
                createEngineSource: fns.createEngineSource,
                sceneFunctionName: fns.sceneFunctionName,
                runtimeFeatures,
                initializeRuntimeAsync: async (opts?: IInitializeRuntimeOptions) => await InitializeRuntimeAsync(runtimeFeatures, opts),
            };
            return result;
        }
        case "unknown":
            return { snippetId, type: "unknown", metadata, rawPayload: parsedPayload } satisfies IUnknownSnippetResult;
        default:
            return ParseDataPayload(parsedPayload, contentType, snippetId, metadata);
    }
}
