/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Checks for a matching suffix at the end of a string (for ES5 and lower)
 * @param str Source string
 * @param suffix Suffix to search for in the source string
 * @returns Boolean indicating whether the suffix was found (true) or not (false)
 * @deprecated Please use native string function instead
 */
export const EndsWith = (str: string, suffix: string): boolean => {
    return str.endsWith(suffix);
};

/**
 * Checks for a matching suffix at the beginning of a string (for ES5 and lower)
 * @param str Source string
 * @param suffix Suffix to search for in the source string
 * @returns Boolean indicating whether the suffix was found (true) or not (false)
 * @deprecated Please use native string function instead
 */
export const StartsWith = (str: string, suffix: string): boolean => {
    if (!str) {
        return false;
    }
    return str.startsWith(suffix);
};

/**
 * Decodes a buffer into a string
 * @param buffer The buffer to decode
 * @returns The decoded string
 */
export const Decode = (buffer: Uint8Array | Uint16Array): string => {
    if (typeof TextDecoder !== "undefined") {
        return new TextDecoder().decode(buffer);
    }

    let result = "";
    for (let i = 0; i < buffer.byteLength; i++) {
        result += String.fromCharCode(buffer[i]);
    }

    return result;
};

declare global {
    interface Uint8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> {
        /**
         * Converts the `Uint8Array` to a base64-encoded string.
         * @param options If provided, sets the alphabet and padding behavior used.
         * @returns A base64-encoded string.
         */
        toBase64(options?: { alphabet?: "base64" | "base64url" | undefined; omitPadding?: boolean | undefined }): string;
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
        fromBase64(
            string: string,
            options?: {
                alphabet?: "base64" | "base64url" | undefined;
                lastChunkHandling?: "loose" | "strict" | "stop-before-partial" | undefined;
            }
        ): Uint8Array<ArrayBuffer>;
    }
}

/**
 * Checks if the native Uint8Array base64 API is available and spec-compliant,
 * rejecting known polyfills (core-js, es-shims).
 * @returns true if the native base64 API is available and trustworthy
 */
function HasNativeBase64(): boolean {
    if (!Uint8Array.prototype.toBase64 || !Uint8Array.fromBase64) {
        return false;
    }
    try {
        Uint8Array.prototype.toBase64.call(null);
        // spec here: https://tc39.es/ecma262/multipage/indexed-collections.html#sec-validateuint8array
        return false; // must throw, or not spec compliant
    } catch (e: unknown) {
        // e must be TypeError
        // chrome: Method Uint8Array.prototype.toBase64 called on incompatible receiver null
        // firefox: toBase64 method called on incompatible null
        // webkit: Uint8Array.prototype.toBase64 requires that |this| be a Uint8Array
        // core-js: Argument is not an Uint8Array
        // es-shims: `this` value must be a Uint8Array'
        const message = (e as Error).message;
        return message !== "Argument is not an Uint8Array" && message !== "`this` value must be a Uint8Array'";
    }
}

function NativeEncodeArrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferView): string {
    const bytes = ArrayBuffer.isView(buffer) ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) : new Uint8Array(buffer);
    return bytes.toBase64();
}

function JsEncodeArrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferView): string {
    const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    let i = 0;
    const bytes = ArrayBuffer.isView(buffer) ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) : new Uint8Array(buffer);

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
        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }

    return output;
}

function NativeDecodeBase64ToBinary(base64Data: string): ArrayBuffer {
    return Uint8Array.fromBase64(base64Data).buffer;
}

function JsDecodeBase64ToBinary(base64Data: string): ArrayBuffer {
    const decodedString = atob(base64Data);
    const bufferLength = decodedString.length;
    const bufferView = new Uint8Array(new ArrayBuffer(bufferLength));

    for (let i = 0; i < bufferLength; i++) {
        bufferView[i] = decodedString.charCodeAt(i);
    }

    return bufferView.buffer;
}

let ImplEncodeArrayBufferToBase64: (buffer: ArrayBuffer | ArrayBufferView) => string;
let ImplDecodeBase64ToBinary: (base64Data: string) => ArrayBuffer;

if (HasNativeBase64()) {
    ImplEncodeArrayBufferToBase64 = NativeEncodeArrayBufferToBase64;
    ImplDecodeBase64ToBinary = NativeDecodeBase64ToBinary;
} else {
    ImplEncodeArrayBufferToBase64 = JsEncodeArrayBufferToBase64;
    ImplDecodeBase64ToBinary = JsDecodeBase64ToBinary;
}

/**
 * Encode a buffer to a base64 string
 * @param buffer defines the buffer to encode
 * @returns the encoded string
 */
export const EncodeArrayBufferToBase64 = (buffer: ArrayBuffer | ArrayBufferView): string => {
    return ImplEncodeArrayBufferToBase64(buffer);
};

/**
 * Converts a given base64 string as an ASCII encoded stream of data
 * @param base64Data The base64 encoded string to decode
 * @returns Decoded ASCII string
 */
export const DecodeBase64ToString = (base64Data: string): string => {
    return atob(base64Data);
};

/**
 * Converts a given base64 string into an ArrayBuffer of raw byte data
 * @param base64Data The base64 encoded string to decode
 * @returns ArrayBuffer of byte data
 */
export const DecodeBase64ToBinary = (base64Data: string): ArrayBuffer => {
    return ImplDecodeBase64ToBinary(base64Data);
};

/**
 * Converts a number to string and pads with preceding zeroes until it is of specified length.
 * @param num the number to convert and pad
 * @param length the expected length of the string
 * @returns the padded string
 */
export const PadNumber = (num: number, length: number): string => {
    let str = String(num);
    while (str.length < length) {
        str = "0" + str;
    }
    return str;
};
/**
 * Helper to manipulate strings
 */
export const StringTools = {
    EndsWith,
    StartsWith,
    Decode,
    EncodeArrayBufferToBase64,
    DecodeBase64ToString,
    DecodeBase64ToBinary,
    PadNumber,
};
