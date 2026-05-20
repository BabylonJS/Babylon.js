import { type IDataSnippetResult, type ISnippetMetadata, type ISnippetServerResponse, type SnippetContentType } from "./types";

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
 * @param base64Data - The Base64-encoded string.
 * @returns The decoded string.
 */
export function DecodeBase64ToString(base64Data: string): string {
    const bytes = new Uint8Array(DecodeBase64ToBinaryLegacy(base64Data));
    return new TextDecoder("utf-8").decode(bytes);
}

/**
 * Detects the content type of a parsed jsonPayload object by checking
 * for the presence of known keys.
 *
 * @param parsedPayload - The parsed JSON payload from the snippet server.
 * @returns The detected {@link SnippetContentType}.
 */
export function DetectContentType(parsedPayload: Record<string, unknown>): SnippetContentType {
    if (parsedPayload.files && typeof parsedPayload.files === "object" && parsedPayload.v !== undefined) {
        return "playground";
    }

    if (typeof parsedPayload.code === "string") {
        return "playground";
    }

    for (const [key, type] of PayloadKeyToType) {
        if (key in parsedPayload) {
            return type;
        }
    }

    return "unknown";
}

export function ParseDataPayload(
    parsedPayload: Record<string, unknown>,
    contentType: Exclude<SnippetContentType, "playground" | "unknown">,
    snippetId: string,
    metadata: ISnippetMetadata
): IDataSnippetResult {
    let data: unknown;

    switch (contentType) {
        case "gui": {
            if (typeof parsedPayload.encodedGui === "string") {
                data = JSON.parse(DecodeBase64ToString(parsedPayload.encodedGui));
            } else {
                data = typeof parsedPayload.gui === "string" ? JSON.parse(parsedPayload.gui) : parsedPayload.gui;
            }
            break;
        }
        case "animation": {
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
            const key = contentType as string;
            const raw = parsedPayload[key];
            data = typeof raw === "string" ? JSON.parse(raw) : raw;
            break;
        }
    }

    return { snippetId, type: contentType, metadata, data, load: (parser?: (d: unknown) => any) => (parser ? parser(data) : data) };
}

/**
 * Parses a snippet server response that is expected to contain editor data
 * rather than playground code.
 *
 * @param response - The raw server response envelope.
 * @param snippetId - The original snippet id.
 * @param expectedContentType - The editor data type expected by the caller.
 * @returns A parsed data snippet result.
 */
export function ParseDataSnippetResponse(
    response: ISnippetServerResponse,
    snippetId: string,
    expectedContentType: Exclude<SnippetContentType, "playground" | "unknown">
): IDataSnippetResult {
    const metadata = {
        name: response.name ?? "",
        description: response.description ?? "",
        tags: response.tags ?? "",
    };
    const rawPayloadStr = response.jsonPayload ?? response.payload ?? "{}";
    const parsedPayload = JSON.parse(rawPayloadStr) as Record<string, unknown>;
    const contentType = DetectContentType(parsedPayload);

    if (contentType !== expectedContentType) {
        throw new Error(`Snippet ${snippetId} contains ${contentType} data instead of ${expectedContentType}.`);
    }

    return ParseDataPayload(parsedPayload, contentType, snippetId, metadata);
}
