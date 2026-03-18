// TODO: these interfaces will not be needed in the future
//  (once the version of typescript we are using has that as part of the standard declaration)
// NOTE: This is in a standalone .d.ts file (rather than inline in stringTools.ts) to avoid
// rollup-plugin-dts interpreting "declare global" as an exported variable named "global".

interface Uint8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> {
    /**
     * Converts the `Uint8Array` to a base64-encoded string.
     * @param options If provided, sets the alphabet and padding behavior used.
     * @returns A base64-encoded string.
     */
    toBase64?(options?: { alphabet?: "base64" | "base64url" | undefined; omitPadding?: boolean | undefined }): string;
}

interface Uint8ArrayConstructor {
    /**
     * Creates a new `Uint8Array` from a base64-encoded string.
     * @param string The base64-encoded string.
     * @param options If provided, specifies the alphabet and handling of the last chunk.
     * @returns A new `Uint8Array` instance.
     * @throws {SyntaxError} If the input string contains characters outside the specified alphabet, or if the last
     * chunk is inconsistent with the `lastChunkHandling` option.
     */
    fromBase64?(
        string: string,
        options?: {
            alphabet?: "base64" | "base64url" | undefined;
            lastChunkHandling?: "loose" | "strict" | "stop-before-partial" | undefined;
        }
    ): Uint8Array<ArrayBuffer>;
}
