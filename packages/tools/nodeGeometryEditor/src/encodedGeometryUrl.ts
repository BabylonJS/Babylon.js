const EncodedGeometryHashPrefix = "nge=";

/**
 * Encodes a serialized Node Geometry document for the NGE URL fragment.
 * @param value - Serialized Node Geometry document.
 * @param hostWindow - Window providing browser base64 helpers.
 * @returns A URL fragment without the leading hash.
 */
export function EncodeNodeGeometryUrlHash(value: unknown, hostWindow: Window): string {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return `${EncodedGeometryHashPrefix}${hostWindow.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "")}`;
}

/**
 * Decodes an NGE document URL fragment.
 * @param hash - URL fragment with or without the leading hash.
 * @param hostWindow - Window providing browser base64 helpers.
 * @returns The decoded document, or undefined when the fragment is a snippet id.
 */
export function DecodeNodeGeometryUrlHash(hash: string, hostWindow: Window): unknown | undefined {
    const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!normalizedHash.startsWith(EncodedGeometryHashPrefix)) {
        return undefined;
    }

    const encoded = normalizedHash.slice(EncodedGeometryHashPrefix.length).replaceAll("-", "+").replaceAll("_", "/");
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const binary = hostWindow.atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
}
