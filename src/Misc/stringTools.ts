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
        if (!str) {
            return false;
        }
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

    /**
     * Encode a buffer to a base64 string
     * @param buffer defines the buffer to encode
     * @returns the encoded string
     */
    public static EncodeArrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferView): string {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        var bytes = ArrayBuffer.isView(buffer) ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) : new Uint8Array(buffer);

        while (i < bytes.length) {
            chr1 = bytes[i++];
            chr2 = i < bytes.length ? bytes[i++] : Number.NaN;
            chr3 = i < bytes.length ? bytes[i++] : Number.NaN;

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                keyStr.charAt(enc3) + keyStr.charAt(enc4);
        }

        return output;
    }

    /**
    * Converts a number to string and pads with preceeding zeroes until it is of specified length.
    * @param num the number to convert and pad
    * @param length the expected length of the string
    * @returns the padded string
    */
    public static PadNumber(num: number, length: number): string {
        var str = String(num);
        while (str.length < length) { str = "0" + str; }
        return str;
    }

}