import {
    type ISaveSnippetOptions,
    type ISaveSnippetResult,
    type ISavePlaygroundCodeInput,
    type ISavePlaygroundManifestInput,
    type SaveDataSnippetInput,
    type SaveSnippetInput,
} from "./types";
import { DEFAULT_SNIPPET_URL } from "./fetchSnippet";

// -----------------------------------------------------------------------
// Payload builders
// -----------------------------------------------------------------------

/**
 * Encodes a string to Base64 via UTF-8, returning `undefined` when the
 * round-trip is lossless (i.e. the string contains only ASCII-safe chars
 * and Base64 encoding is unnecessary).
 *
 * @param source - The string to encode.
 * @returns The Base64-encoded string, or `undefined` if encoding is unnecessary.
 */
function EncodeUnicode(source: string): string | undefined {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(source);
    let testData = "";
    for (let i = 0; i < buffer.length; i++) {
        testData += String.fromCharCode(buffer[i]);
    }
    if (testData === source) {
        return undefined;
    }
    // btoa-safe: the Uint8Array → string step above produces a Latin-1 string.
    return btoa(testData);
}

/**
 * Builds the outer snippet envelope that the server expects.
 *
 * @param innerPayload - The already-stringified inner payload.
 * @param options - Save options containing metadata.
 * @returns The JSON string to POST to the snippet server.
 */
function BuildEnvelope(innerPayload: string, options?: ISaveSnippetOptions): string {
    return JSON.stringify({
        payload: innerPayload,
        name: options?.metadata?.name ?? "",
        description: options?.metadata?.description ?? "",
        tags: options?.metadata?.tags ?? "",
    });
}

/**
 * Builds the inner payload for a playground snippet saved from raw code.
 *
 * @param input - The playground code input.
 * @returns The stringified inner payload.
 */
function BuildPlaygroundCodePayload(input: ISavePlaygroundCodeInput): string {
    const code = input.code;
    const unicode = EncodeUnicode(code);
    return JSON.stringify({
        code,
        unicode,
        engine: input.engine,
        language: input.language,
    });
}

/**
 * Builds the inner payload for a playground snippet saved from a V2 manifest.
 *
 * @param input - The playground manifest input.
 * @returns The stringified inner payload.
 */
function BuildPlaygroundManifestPayload(input: ISavePlaygroundManifestInput): string {
    const manifestJson = JSON.stringify(input.manifest);
    const unicode = EncodeUnicode(manifestJson);
    return JSON.stringify({
        code: manifestJson,
        unicode,
        engine: input.engine,
        version: input.manifest.v,
    });
}

/**
 * Builds the inner payload for a data snippet (NME, NGE, GUI, etc.).
 *
 * The value stored under the type key follows the same convention the
 * existing editors use: objects are JSON-stringified, strings are kept
 * as-is.
 *
 * @param input - The data snippet input.
 * @returns The stringified inner payload.
 */
function BuildDataPayload(input: SaveDataSnippetInput): string {
    const key = input.type === "animation" ? "animations" : (input.type as string);
    const value = typeof input.data === "string" ? input.data : JSON.stringify(input.data);
    return JSON.stringify({ [key]: value });
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

/**
 * Type guard: input has a `manifest` property (playground V2).
 *
 * @param input - The save snippet input to check.
 * @returns `true` when the input is a V2 manifest input.
 */
function IsManifestInput(input: SaveSnippetInput): input is ISavePlaygroundManifestInput {
    return input.type === "playground" && "manifest" in input;
}

/**
 * Extracts the base snippet ID (without `#revision`) for the POST URL.
 *
 * @param snippetId - The full snippet ID (e.g. `"ABC123#2"`).
 * @returns The base ID without revision (e.g. `"ABC123"`).
 */
function BaseSnippetId(snippetId: string): string {
    const hash = snippetId.indexOf("#");
    return hash >= 0 ? snippetId.slice(0, hash) : snippetId;
}

// -----------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------

/**
 * Saves a snippet to the snippet server.
 *
 * Supports all snippet content types: playground (V1 code or V2 manifest),
 * node material, node geometry, node render graph, node particle, GUI,
 * animation, particle system, sprite manager, and shader material.
 *
 * To create a **new** snippet, omit `options.snippetId`.
 * To create a **new revision** of an existing snippet, pass the existing
 * ID in `options.snippetId`.
 *
 * @param input - Describes what to save — see {@link SaveSnippetInput}.
 * @param options - Optional configuration (server URL, existing snippet ID, metadata).
 * @returns The saved snippet's ID and version information.
 *
 * @example
 * ```ts
 * import { SaveSnippet } from "@tools/snippet-loader";
 *
 * // Save a playground snippet
 * const result = await SaveSnippet(
 *   { type: "playground", code: "var createScene = function(engine, canvas) { ... }" },
 *   { metadata: { name: "My snippet", description: "Demo", tags: "test" } }
 * );
 * console.log(result.snippetId); // "ABC123"
 *
 * // Save a node material
 * const nmeResult = await SaveSnippet(
 *   { type: "nodeMaterial", data: nodeMaterialSerializedJson }
 * );
 *
 * // Update an existing snippet (creates a new revision)
 * const updated = await SaveSnippet(
 *   { type: "playground", code: "updated code..." },
 *   { snippetId: result.snippetId }
 * );
 * ```
 */
export async function SaveSnippet(input: SaveSnippetInput, options?: ISaveSnippetOptions): Promise<ISaveSnippetResult> {
    // Build the inner payload string based on snippet type.
    let innerPayload: string;
    if (input.type === "playground") {
        innerPayload = IsManifestInput(input) ? BuildPlaygroundManifestPayload(input) : BuildPlaygroundCodePayload(input);
    } else {
        innerPayload = BuildDataPayload(input);
    }

    // Build the final envelope.
    const body = BuildEnvelope(innerPayload, options);

    // Determine the POST URL.
    const baseUrl = (options?.snippetUrl ?? DEFAULT_SNIPPET_URL).replace(/\/+$/, "");
    const existingId = options?.snippetId ? BaseSnippetId(options.snippetId) : "";
    const url = existingId ? `${baseUrl}/${existingId}` : baseUrl;

    const response = await fetch(url, {
        method: "POST",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { "Content-Type": "application/json" },
        body,
    });

    if (!response.ok) {
        throw new Error(`Failed to save snippet: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const id: string = result.id;
    const version: string = String(result.version ?? "0");

    let snippetId = id;
    if (version && version !== "0") {
        snippetId += "#" + version;
    }

    return { snippetId, id, version };
}
