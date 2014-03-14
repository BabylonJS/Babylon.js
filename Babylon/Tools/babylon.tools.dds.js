"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.Tools = BABYLON.Tools|| {};

    // Based on demo done by Brandon Jones - http://media.tojicode.com/webgl-samples/dds.html
    // All values and structures referenced from:
    // http://msdn.microsoft.com/en-us/library/bb943991.aspx/
    var DDS_MAGIC = 0x20534444;

    var DDSD_CAPS = 0x1,
        DDSD_HEIGHT = 0x2,
        DDSD_WIDTH = 0x4,
        DDSD_PITCH = 0x8,
        DDSD_PIXELFORMAT = 0x1000,
        DDSD_MIPMAPCOUNT = 0x20000,
        DDSD_LINEARSIZE = 0x80000,
        DDSD_DEPTH = 0x800000;

    var DDSCAPS_COMPLEX = 0x8,
        DDSCAPS_MIPMAP = 0x400000,
        DDSCAPS_TEXTURE = 0x1000;

    var DDSCAPS2_CUBEMAP = 0x200,
        DDSCAPS2_CUBEMAP_POSITIVEX = 0x400,
        DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800,
        DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000,
        DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000,
        DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000,
        DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000,
        DDSCAPS2_VOLUME = 0x200000;

    var DDPF_ALPHAPIXELS = 0x1,
        DDPF_ALPHA = 0x2,
        DDPF_FOURCC = 0x4,
        DDPF_RGB = 0x40,
        DDPF_YUV = 0x200,
        DDPF_LUMINANCE = 0x20000;

    function FourCCToInt32(value) {
        return value.charCodeAt(0) +
            (value.charCodeAt(1) << 8) +
            (value.charCodeAt(2) << 16) +
            (value.charCodeAt(3) << 24);
    }

    function Int32ToFourCC(value) {
        return String.fromCharCode(
            value & 0xff,
            (value >> 8) & 0xff,
            (value >> 16) & 0xff,
            (value >> 24) & 0xff
        );
    }

    var FOURCC_DXT1 = FourCCToInt32("DXT1");
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


    BABYLON.Tools.GetDDSInfo = function (arrayBuffer) {
        var header = new Int32Array(arrayBuffer, 0, headerLengthInt);

        var mipmapCount = 1;
        if (header[off_flags] & DDSD_MIPMAPCOUNT) {
            mipmapCount = Math.max(1, header[off_mipmapCount]);
        }

        return {
            width: header[off_width],
            height: header[off_height],
            mipmapCount: mipmapCount
        };
    };

    BABYLON.Tools.UploadDDSLevels = function (gl, ext, arrayBuffer, loadMipmaps) {
        var header = new Int32Array(arrayBuffer, 0, headerLengthInt),
            fourCC, blockBytes, internalFormat,
            width, height, dataLength, dataOffset,
            byteArray, mipmapCount, i;

        if (header[off_magic] != DDS_MAGIC) {
            console.error("Invalid magic number in DDS header");
            return;
        }

        if (!header[off_pfFlags] & DDPF_FOURCC) {
            console.error("Unsupported format, must contain a FourCC code");
            return;
        }

        fourCC = header[off_pfFourCC];
        switch (fourCC) {
            case FOURCC_DXT1:
                blockBytes = 8;
                internalFormat = ext.COMPRESSED_RGBA_S3TC_DXT1_EXT;
                break;
            case FOURCC_DXT5:
                blockBytes = 16;
                internalFormat = ext.COMPRESSED_RGBA_S3TC_DXT5_EXT;
                break;
            default:
                console.error("Unsupported FourCC code:", Int32ToFourCC(fourCC));
                return;
        }

        mipmapCount = 1;
        if (header[off_flags] & DDSD_MIPMAPCOUNT && loadMipmaps !== false) {
            mipmapCount = Math.max(1, header[off_mipmapCount]);
        }

        width = header[off_width];
        height = header[off_height];
        dataOffset = header[off_size] + 4;

        for (i = 0; i < mipmapCount; ++i) {
            dataLength = Math.max(4, width) / 4 * Math.max(4, height) / 4 * blockBytes;
            byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
            gl.compressedTexImage2D(gl.TEXTURE_2D, i, internalFormat, width, height, 0, byteArray);
            dataOffset += dataLength;
            width *= 0.5;
            height *= 0.5;
        }
    };

})();