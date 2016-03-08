var BABYLON;
(function (BABYLON) {
    var Internals;
    (function (Internals) {
        // Based on demo done by Brandon Jones - http://media.tojicode.com/webgl-samples/dds.html
        // All values and structures referenced from:
        // http://msdn.microsoft.com/en-us/library/bb943991.aspx/
        var DDS_MAGIC = 0x20534444;
        var DDSD_CAPS = 0x1, DDSD_HEIGHT = 0x2, DDSD_WIDTH = 0x4, DDSD_PITCH = 0x8, DDSD_PIXELFORMAT = 0x1000, DDSD_MIPMAPCOUNT = 0x20000, DDSD_LINEARSIZE = 0x80000, DDSD_DEPTH = 0x800000;
        var DDSCAPS_COMPLEX = 0x8, DDSCAPS_MIPMAP = 0x400000, DDSCAPS_TEXTURE = 0x1000;
        var DDSCAPS2_CUBEMAP = 0x200, DDSCAPS2_CUBEMAP_POSITIVEX = 0x400, DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800, DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000, DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000, DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000, DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000, DDSCAPS2_VOLUME = 0x200000;
        var DDPF_ALPHAPIXELS = 0x1, DDPF_ALPHA = 0x2, DDPF_FOURCC = 0x4, DDPF_RGB = 0x40, DDPF_YUV = 0x200, DDPF_LUMINANCE = 0x20000;
        function FourCCToInt32(value) {
            return value.charCodeAt(0) +
                (value.charCodeAt(1) << 8) +
                (value.charCodeAt(2) << 16) +
                (value.charCodeAt(3) << 24);
        }
        function Int32ToFourCC(value) {
            return String.fromCharCode(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
        }
        var FOURCC_DXT1 = FourCCToInt32("DXT1");
        var FOURCC_DXT3 = FourCCToInt32("DXT3");
        var FOURCC_DXT5 = FourCCToInt32("DXT5");
        var headerLengthInt = 31; // The header length in 32 bit ints
        // Offsets into the header array
        var off_magic = 0;
        var off_size = 1;
        var off_flags = 2;
        var off_height = 3;
        var off_width = 4;
        var off_mipmapCount = 7;
        var off_pfFlags = 20;
        var off_pfFourCC = 21;
        var off_RGBbpp = 22;
        var off_RMask = 23;
        var off_GMask = 24;
        var off_BMask = 25;
        var off_AMask = 26;
        var off_caps1 = 27;
        var off_caps2 = 28;
        ;
        var DDSTools = (function () {
            function DDSTools() {
            }
            DDSTools.GetDDSInfo = function (arrayBuffer) {
                var header = new Int32Array(arrayBuffer, 0, headerLengthInt);
                var mipmapCount = 1;
                if (header[off_flags] & DDSD_MIPMAPCOUNT) {
                    mipmapCount = Math.max(1, header[off_mipmapCount]);
                }
                return {
                    width: header[off_width],
                    height: header[off_height],
                    mipmapCount: mipmapCount,
                    isFourCC: (header[off_pfFlags] & DDPF_FOURCC) === DDPF_FOURCC,
                    isRGB: (header[off_pfFlags] & DDPF_RGB) === DDPF_RGB,
                    isLuminance: (header[off_pfFlags] & DDPF_LUMINANCE) === DDPF_LUMINANCE,
                    isCube: (header[off_caps2] & DDSCAPS2_CUBEMAP) === DDSCAPS2_CUBEMAP
                };
            };
            DDSTools.GetRGBAArrayBuffer = function (width, height, dataOffset, dataLength, arrayBuffer) {
                var byteArray = new Uint8Array(dataLength);
                var srcData = new Uint8Array(arrayBuffer);
                var index = 0;
                for (var y = height - 1; y >= 0; y--) {
                    for (var x = 0; x < width; x++) {
                        var srcPos = dataOffset + (x + y * width) * 4;
                        byteArray[index + 2] = srcData[srcPos];
                        byteArray[index + 1] = srcData[srcPos + 1];
                        byteArray[index] = srcData[srcPos + 2];
                        byteArray[index + 3] = srcData[srcPos + 3];
                        index += 4;
                    }
                }
                return byteArray;
            };
            DDSTools.GetRGBArrayBuffer = function (width, height, dataOffset, dataLength, arrayBuffer) {
                var byteArray = new Uint8Array(dataLength);
                var srcData = new Uint8Array(arrayBuffer);
                var index = 0;
                for (var y = height - 1; y >= 0; y--) {
                    for (var x = 0; x < width; x++) {
                        var srcPos = dataOffset + (x + y * width) * 3;
                        byteArray[index + 2] = srcData[srcPos];
                        byteArray[index + 1] = srcData[srcPos + 1];
                        byteArray[index] = srcData[srcPos + 2];
                        index += 3;
                    }
                }
                return byteArray;
            };
            DDSTools.GetLuminanceArrayBuffer = function (width, height, dataOffset, dataLength, arrayBuffer) {
                var byteArray = new Uint8Array(dataLength);
                var srcData = new Uint8Array(arrayBuffer);
                var index = 0;
                for (var y = height - 1; y >= 0; y--) {
                    for (var x = 0; x < width; x++) {
                        var srcPos = dataOffset + (x + y * width);
                        byteArray[index] = srcData[srcPos];
                        index++;
                    }
                }
                return byteArray;
            };
            DDSTools.UploadDDSLevels = function (gl, ext, arrayBuffer, info, loadMipmaps, faces) {
                var header = new Int32Array(arrayBuffer, 0, headerLengthInt), fourCC, blockBytes, internalFormat, width, height, dataLength, dataOffset, byteArray, mipmapCount, i;
                if (header[off_magic] != DDS_MAGIC) {
                    BABYLON.Tools.Error("Invalid magic number in DDS header");
                    return;
                }
                if (!info.isFourCC && !info.isRGB && !info.isLuminance) {
                    BABYLON.Tools.Error("Unsupported format, must contain a FourCC, RGB or LUMINANCE code");
                    return;
                }
                if (info.isFourCC) {
                    fourCC = header[off_pfFourCC];
                    switch (fourCC) {
                        case FOURCC_DXT1:
                            blockBytes = 8;
                            internalFormat = ext.COMPRESSED_RGBA_S3TC_DXT1_EXT;
                            break;
                        case FOURCC_DXT3:
                            blockBytes = 16;
                            internalFormat = ext.COMPRESSED_RGBA_S3TC_DXT3_EXT;
                            break;
                        case FOURCC_DXT5:
                            blockBytes = 16;
                            internalFormat = ext.COMPRESSED_RGBA_S3TC_DXT5_EXT;
                            break;
                        default:
                            console.error("Unsupported FourCC code:", Int32ToFourCC(fourCC));
                            return;
                    }
                }
                mipmapCount = 1;
                if (header[off_flags] & DDSD_MIPMAPCOUNT && loadMipmaps !== false) {
                    mipmapCount = Math.max(1, header[off_mipmapCount]);
                }
                var bpp = header[off_RGBbpp];
                for (var face = 0; face < faces; face++) {
                    var sampler = faces === 1 ? gl.TEXTURE_2D : (gl.TEXTURE_CUBE_MAP_POSITIVE_X + face);
                    width = header[off_width];
                    height = header[off_height];
                    dataOffset = header[off_size] + 4;
                    for (i = 0; i < mipmapCount; ++i) {
                        if (info.isRGB) {
                            if (bpp === 24) {
                                dataLength = width * height * 3;
                                byteArray = DDSTools.GetRGBArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
                                gl.texImage2D(sampler, i, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, byteArray);
                            }
                            else {
                                dataLength = width * height * 4;
                                byteArray = DDSTools.GetRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
                                gl.texImage2D(sampler, i, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, byteArray);
                            }
                        }
                        else if (info.isLuminance) {
                            var unpackAlignment = gl.getParameter(gl.UNPACK_ALIGNMENT);
                            var unpaddedRowSize = width;
                            var paddedRowSize = Math.floor((width + unpackAlignment - 1) / unpackAlignment) * unpackAlignment;
                            dataLength = paddedRowSize * (height - 1) + unpaddedRowSize;
                            byteArray = DDSTools.GetLuminanceArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
                            gl.texImage2D(sampler, i, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, byteArray);
                        }
                        else {
                            dataLength = Math.max(4, width) / 4 * Math.max(4, height) / 4 * blockBytes;
                            byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
                            gl.compressedTexImage2D(sampler, i, internalFormat, width, height, 0, byteArray);
                        }
                        dataOffset += dataLength;
                        width *= 0.5;
                        height *= 0.5;
                        width = Math.max(1.0, width);
                        height = Math.max(1.0, height);
                    }
                }
            };
            return DDSTools;
        }());
        Internals.DDSTools = DDSTools;
    })(Internals = BABYLON.Internals || (BABYLON.Internals = {}));
})(BABYLON || (BABYLON = {}));
