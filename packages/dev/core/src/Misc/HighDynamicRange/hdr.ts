import type { CubeMapInfo } from "./panoramaToCubemap";
import { PanoramaToCubeMapTools } from "./panoramaToCubemap";

/**
 * Header information of HDR texture files.
 */
export interface HDRInfo {
    /**
     * The height of the texture in pixels.
     */
    height: number;

    /**
     * The width of the texture in pixels.
     */
    width: number;

    /**
     * The index of the beginning of the data in the binary file.
     */
    dataPosition: number;
}

/**
 * This groups tools to convert HDR texture to native colors array.
 */
export class HDRTools {
    private static _Ldexp(mantissa: number, exponent: number): number {
        if (exponent > 1023) {
            return mantissa * Math.pow(2, 1023) * Math.pow(2, exponent - 1023);
        }

        if (exponent < -1074) {
            return mantissa * Math.pow(2, -1074) * Math.pow(2, exponent + 1074);
        }

        return mantissa * Math.pow(2, exponent);
    }

    private static _Rgbe2float(float32array: Float32Array, red: number, green: number, blue: number, exponent: number, index: number) {
        if (exponent > 0) {
            /*nonzero pixel*/
            exponent = this._Ldexp(1.0, exponent - (128 + 8));

            float32array[index + 0] = red * exponent;
            float32array[index + 1] = green * exponent;
            float32array[index + 2] = blue * exponent;
        } else {
            float32array[index + 0] = 0;
            float32array[index + 1] = 0;
            float32array[index + 2] = 0;
        }
    }

    private static _ReadStringLine(uint8array: Uint8Array, startIndex: number): string {
        let line = "";
        let character = "";

        for (let i = startIndex; i < uint8array.length - startIndex; i++) {
            character = String.fromCharCode(uint8array[i]);

            if (character == "\n") {
                break;
            }

            line += character;
        }

        return line;
    }

    /**
     * Reads header information from an RGBE texture stored in a native array.
     * More information on this format are available here:
     * https://en.wikipedia.org/wiki/RGBE_image_format
     *
     * @param uint8array The binary file stored in  native array.
     * @returns The header information.
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static RGBE_ReadHeader(uint8array: Uint8Array): HDRInfo {
        let height: number = 0;
        let width: number = 0;

        let line = this._ReadStringLine(uint8array, 0);
        if (line[0] != "#" || line[1] != "?") {
            // eslint-disable-next-line no-throw-literal
            throw "Bad HDR Format.";
        }

        let endOfHeader = false;
        let findFormat = false;
        let lineIndex: number = 0;

        do {
            lineIndex += line.length + 1;
            line = this._ReadStringLine(uint8array, lineIndex);

            if (line == "FORMAT=32-bit_rle_rgbe") {
                findFormat = true;
            } else if (line.length == 0) {
                endOfHeader = true;
            }
        } while (!endOfHeader);

        if (!findFormat) {
            // eslint-disable-next-line no-throw-literal
            throw "HDR Bad header format, unsupported FORMAT";
        }

        lineIndex += line.length + 1;
        line = this._ReadStringLine(uint8array, lineIndex);

        const sizeRegexp = /^-Y (.*) \+X (.*)$/g;
        const match = sizeRegexp.exec(line);

        // TODO. Support +Y and -X if needed.
        if (!match || match.length < 3) {
            // eslint-disable-next-line no-throw-literal
            throw "HDR Bad header format, no size";
        }
        width = parseInt(match[2]);
        height = parseInt(match[1]);

        if (width < 8 || width > 0x7fff) {
            // eslint-disable-next-line no-throw-literal
            throw "HDR Bad header format, unsupported size";
        }

        lineIndex += line.length + 1;

        return {
            height: height,
            width: width,
            dataPosition: lineIndex,
        };
    }

    /**
     * Returns the cubemap information (each faces texture data) extracted from an RGBE texture.
     * This RGBE texture needs to store the information as a panorama.
     *
     * More information on this format are available here:
     * https://en.wikipedia.org/wiki/RGBE_image_format
     *
     * @param buffer The binary file stored in an array buffer.
     * @param size The expected size of the extracted cubemap.
     * @param supersample enable supersampling the cubemap (default: false)
     * @returns The Cube Map information.
     */
    public static GetCubeMapTextureData(buffer: ArrayBuffer, size: number, supersample = false): CubeMapInfo {
        const uint8array = new Uint8Array(buffer);
        const hdrInfo = this.RGBE_ReadHeader(uint8array);
        const data = this.RGBE_ReadPixels(uint8array, hdrInfo);

        const cubeMapData = PanoramaToCubeMapTools.ConvertPanoramaToCubemap(data, hdrInfo.width, hdrInfo.height, size, supersample);

        return cubeMapData;
    }

    /**
     * Returns the pixels data extracted from an RGBE texture.
     * This pixels will be stored left to right up to down in the R G B order in one array.
     *
     * More information on this format are available here:
     * https://en.wikipedia.org/wiki/RGBE_image_format
     *
     * @param uint8array The binary file stored in an array buffer.
     * @param hdrInfo The header information of the file.
     * @returns The pixels data in RGB right to left up to down order.
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static RGBE_ReadPixels(uint8array: Uint8Array, hdrInfo: HDRInfo): Float32Array {
        return this._RGBEReadPixelsRLE(uint8array, hdrInfo);
    }

    private static _RGBEReadPixelsRLE(uint8array: Uint8Array, hdrInfo: HDRInfo): Float32Array {
        let num_scanlines = hdrInfo.height;
        const scanline_width = hdrInfo.width;

        let a: number, b: number, c: number, d: number, count: number;
        let dataIndex = hdrInfo.dataPosition;
        let index = 0,
            endIndex = 0,
            i = 0;

        const scanLineArrayBuffer = new ArrayBuffer(scanline_width * 4); // four channel R G B E
        const scanLineArray = new Uint8Array(scanLineArrayBuffer);

        // 3 channels of 4 bytes per pixel in float.
        const resultBuffer = new ArrayBuffer(hdrInfo.width * hdrInfo.height * 4 * 3);
        const resultArray = new Float32Array(resultBuffer);

        // read in each successive scanline
        while (num_scanlines > 0) {
            a = uint8array[dataIndex++];
            b = uint8array[dataIndex++];
            c = uint8array[dataIndex++];
            d = uint8array[dataIndex++];

            if (a != 2 || b != 2 || c & 0x80 || hdrInfo.width < 8 || hdrInfo.width > 32767) {
                return this._RGBEReadPixelsNOTRLE(uint8array, hdrInfo);
            }

            if (((c << 8) | d) != scanline_width) {
                // eslint-disable-next-line no-throw-literal
                throw "HDR Bad header format, wrong scan line width";
            }

            index = 0;

            // read each of the four channels for the scanline into the buffer
            for (i = 0; i < 4; i++) {
                endIndex = (i + 1) * scanline_width;

                while (index < endIndex) {
                    a = uint8array[dataIndex++];
                    b = uint8array[dataIndex++];

                    if (a > 128) {
                        // a run of the same value
                        count = a - 128;
                        if (count == 0 || count > endIndex - index) {
                            // eslint-disable-next-line no-throw-literal
                            throw "HDR Bad Format, bad scanline data (run)";
                        }

                        while (count-- > 0) {
                            scanLineArray[index++] = b;
                        }
                    } else {
                        // a non-run
                        count = a;
                        if (count == 0 || count > endIndex - index) {
                            // eslint-disable-next-line no-throw-literal
                            throw "HDR Bad Format, bad scanline data (non-run)";
                        }

                        scanLineArray[index++] = b;
                        if (--count > 0) {
                            for (let j = 0; j < count; j++) {
                                scanLineArray[index++] = uint8array[dataIndex++];
                            }
                        }
                    }
                }
            }

            // now convert data from buffer into floats
            for (i = 0; i < scanline_width; i++) {
                a = scanLineArray[i];
                b = scanLineArray[i + scanline_width];
                c = scanLineArray[i + 2 * scanline_width];
                d = scanLineArray[i + 3 * scanline_width];

                this._Rgbe2float(resultArray, a, b, c, d, (hdrInfo.height - num_scanlines) * scanline_width * 3 + i * 3);
            }

            num_scanlines--;
        }

        return resultArray;
    }

    private static _RGBEReadPixelsNOTRLE(uint8array: Uint8Array, hdrInfo: HDRInfo): Float32Array {
        // this file is not run length encoded
        // read values sequentially

        let num_scanlines = hdrInfo.height;
        const scanline_width = hdrInfo.width;

        let a: number, b: number, c: number, d: number, i: number;
        let dataIndex = hdrInfo.dataPosition;

        // 3 channels of 4 bytes per pixel in float.
        const resultBuffer = new ArrayBuffer(hdrInfo.width * hdrInfo.height * 4 * 3);
        const resultArray = new Float32Array(resultBuffer);

        // read in each successive scanline
        while (num_scanlines > 0) {
            for (i = 0; i < hdrInfo.width; i++) {
                a = uint8array[dataIndex++];
                b = uint8array[dataIndex++];
                c = uint8array[dataIndex++];
                d = uint8array[dataIndex++];

                this._Rgbe2float(resultArray, a, b, c, d, (hdrInfo.height - num_scanlines) * scanline_width * 3 + i * 3);
            }

            num_scanlines--;
        }

        return resultArray;
    }
}
