/**
 * Helper to manipulate strings
 */
export class StringTools {
    /**
     * Checks for a matching suffix at the end of a string (for ES5 and lower)
     * @param str Source string
     * @param suffix Suffix to search for in the source string
     * @returns Boolean indicating whether the suffix was found (true) or not (false)
     */
    public static EndsWith(str: string, suffix: string): boolean {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    /**
     * Checks for a matching suffix at the beginning of a string (for ES5 and lower)
     * @param str Source string
     * @param suffix Suffix to search for in the source string
     * @returns Boolean indicating whether the suffix was found (true) or not (false)
     */
    public static StartsWith(str: string, suffix: string): boolean {
        return str.indexOf(suffix) === 0;
    }

    /**
     * Decodes a buffer into a string
     * @param buffer The buffer to decode
     * @returns The decoded string
     */
    public static Decode(buffer: Uint8Array | Uint16Array): string {
        if (typeof TextDecoder !== "undefined") {
            return new TextDecoder().decode(buffer);
        }

        let result = "";
        for (let i = 0; i < buffer.byteLength; i++) {
            result += String.fromCharCode(buffer[i]);
        }

        return result;
    }
}