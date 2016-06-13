var BABYLON;
(function (BABYLON) {
    var Internals;
    (function (Internals) {
        ;
        /**
         * This groups tools to convert HDR texture to native colors array.
         */
        var HDRTools = (function () {
            function HDRTools() {
            }
            HDRTools.Ldexp = function (mantissa, exponent) {
                if (exponent > 1023) {
                    return mantissa * Math.pow(2, 1023) * Math.pow(2, exponent - 1023);
                }
                if (exponent < -1074) {
                    return mantissa * Math.pow(2, -1074) * Math.pow(2, exponent + 1074);
                }
                return mantissa * Math.pow(2, exponent);
            };
            HDRTools.Rgbe2float = function (float32array, red, green, blue, exponent, index) {
                if (exponent > 0) {
                    exponent = this.Ldexp(1.0, exponent - (128 + 8));
                    float32array[index + 0] = red * exponent;
                    float32array[index + 1] = green * exponent;
                    float32array[index + 2] = blue * exponent;
                }
                else {
                    float32array[index + 0] = 0;
                    float32array[index + 1] = 0;
                    float32array[index + 2] = 0;
                }
            };
            HDRTools.readStringLine = function (uint8array, startIndex) {
                var line = "";
                var character = "";
                for (var i = startIndex; i < uint8array.length - startIndex; i++) {
                    character = String.fromCharCode(uint8array[i]);
                    if (character == "\n") {
                        break;
                    }
                    line += character;
                }
                return line;
            };
            /**
             * Reads header information from an RGBE texture stored in a native array.
             * More information on this format are available here:
             * https://en.wikipedia.org/wiki/RGBE_image_format
             *
             * @param uint8array The binary file stored in  native array.
             * @return The header information.
             */
            HDRTools.RGBE_ReadHeader = function (uint8array) {
                var height = 0;
                var width = 0;
                var line = this.readStringLine(uint8array, 0);
                if (line[0] != '#' || line[1] != '?') {
                    throw "Bad HDR Format.";
                }
                var endOfHeader = false;
                var findFormat = false;
                var lineIndex = 0;
                do {
                    lineIndex += (line.length + 1);
                    line = this.readStringLine(uint8array, lineIndex);
                    if (line == "FORMAT=32-bit_rle_rgbe") {
                        findFormat = true;
                    }
                    else if (line.length == 0) {
                        endOfHeader = true;
                    }
                } while (!endOfHeader);
                if (!findFormat) {
                    throw "HDR Bad header format, unsupported FORMAT";
                }
                lineIndex += (line.length + 1);
                line = this.readStringLine(uint8array, lineIndex);
                var sizeRegexp = /^\-Y (.*) \+X (.*)$/g;
                var match = sizeRegexp.exec(line);
                // TODO. Support +Y and -X if needed.
                if (match.length < 3) {
                    throw "HDR Bad header format, no size";
                }
                width = parseInt(match[2]);
                height = parseInt(match[1]);
                if (width < 8 || width > 0x7fff) {
                    throw "HDR Bad header format, unsupported size";
                }
                lineIndex += (line.length + 1);
                return {
                    height: height,
                    width: width,
                    dataPosition: lineIndex
                };
            };
            /**
             * Returns the cubemap information (each faces texture data) extracted from an RGBE texture.
             * This RGBE texture needs to store the information as a panorama.
             *
             * More information on this format are available here:
             * https://en.wikipedia.org/wiki/RGBE_image_format
             *
             * @param buffer The binary file stored in an array buffer.
             * @param size The expected size of the extracted cubemap.
             * @return The Cube Map information.
             */
            HDRTools.GetCubeMapTextureData = function (buffer, size) {
                var uint8array = new Uint8Array(buffer);
                var hdrInfo = this.RGBE_ReadHeader(uint8array);
                var data = this.RGBE_ReadPixels_RLE(uint8array, hdrInfo);
                var cubeMapData = Internals.PanoramaToCubeMapTools.ConvertPanoramaToCubemap(data, hdrInfo.width, hdrInfo.height, size);
                return cubeMapData;
            };
            /**
             * Returns the pixels data extracted from an RGBE texture.
             * This pixels will be stored left to right up to down in the R G B order in one array.
             *
             * More information on this format are available here:
             * https://en.wikipedia.org/wiki/RGBE_image_format
             *
             * @param uint8array The binary file stored in an array buffer.
             * @param hdrInfo The header information of the file.
             * @return The pixels data in RGB right to left up to down order.
             */
            HDRTools.RGBE_ReadPixels = function (uint8array, hdrInfo) {
                // Keep for multi format supports.
                return this.RGBE_ReadPixels_RLE(uint8array, hdrInfo);
            };
            HDRTools.RGBE_ReadPixels_RLE = function (uint8array, hdrInfo) {
                var num_scanlines = hdrInfo.height;
                var scanline_width = hdrInfo.width;
                var a, b, c, d, count;
                var dataIndex = hdrInfo.dataPosition;
                var index = 0, endIndex = 0, i = 0;
                var scanLineArrayBuffer = new ArrayBuffer(scanline_width * 4); // four channel R G B E
                var scanLineArray = new Uint8Array(scanLineArrayBuffer);
                // 3 channels of 4 bytes per pixel in float.
                var resultBuffer = new ArrayBuffer(hdrInfo.width * hdrInfo.height * 4 * 3);
                var resultArray = new Float32Array(resultBuffer);
                // read in each successive scanline
                while (num_scanlines > 0) {
                    a = uint8array[dataIndex++];
                    b = uint8array[dataIndex++];
                    c = uint8array[dataIndex++];
                    d = uint8array[dataIndex++];
                    if (a != 2 || b != 2 || (c & 0x80)) {
                        // this file is not run length encoded
                        throw "HDR Bad header format, not RLE";
                    }
                    if (((c << 8) | d) != scanline_width) {
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
                                if ((count == 0) || (count > endIndex - index)) {
                                    throw "HDR Bad Format, bad scanline data (run)";
                                }
                                while (count-- > 0) {
                                    scanLineArray[index++] = b;
                                }
                            }
                            else {
                                // a non-run
                                count = a;
                                if ((count == 0) || (count > endIndex - index)) {
                                    throw "HDR Bad Format, bad scanline data (non-run)";
                                }
                                scanLineArray[index++] = b;
                                if (--count > 0) {
                                    for (var j = 0; j < count; j++) {
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
                        this.Rgbe2float(resultArray, a, b, c, d, (hdrInfo.height - num_scanlines) * scanline_width * 3 + i * 3);
                    }
                    num_scanlines--;
                }
                return resultArray;
            };
            return HDRTools;
        }());
        Internals.HDRTools = HDRTools;
    })(Internals = BABYLON.Internals || (BABYLON.Internals = {}));
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.tools.hdr.js.map