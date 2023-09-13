import { ErrorCodes, RuntimeError } from "core/Misc/error";
import { Constants } from "../constants";
import { INative } from "./nativeInterfaces";
import { VertexBuffer } from "core/Buffers/buffer";

declare const _native: INative;

export function getNativeTextureFormat(format: number, type: number): number {
    const textureFormats: { [format: number]: { [type: number]: number } } = {
        [Constants.TEXTUREFORMAT_RGB]: {
            [Constants.TEXTURETYPE_UNSIGNED_BYTE]: _native.Engine.TEXTURE_FORMAT_RGB8,
            [Constants.TEXTURETYPE_BYTE]: _native.Engine.TEXTURE_FORMAT_RGB8S,
            [Constants.TEXTURETYPE_INT]: _native.Engine.TEXTURE_FORMAT_RGB8I,
            [Constants.TEXTURETYPE_UNSIGNED_INTEGER]: _native.Engine.TEXTURE_FORMAT_RGB8U,
        },
        [Constants.TEXTUREFORMAT_RGBA]: {
            [Constants.TEXTURETYPE_UNSIGNED_BYTE]: _native.Engine.TEXTURE_FORMAT_RGBA8,
            [Constants.TEXTURETYPE_FLOAT]: _native.Engine.TEXTURE_FORMAT_RGBA32F,
            [Constants.TEXTURETYPE_HALF_FLOAT]: _native.Engine.TEXTURE_FORMAT_RGBA16F,
            [Constants.TEXTURETYPE_BYTE]: _native.Engine.TEXTURE_FORMAT_RGBA8S,
            [Constants.TEXTURETYPE_SHORT]: _native.Engine.TEXTURE_FORMAT_RGBA16I,
            [Constants.TEXTURETYPE_UNSIGNED_SHORT]: _native.Engine.TEXTURE_FORMAT_RGBA16U,
            [Constants.TEXTURETYPE_INT]: _native.Engine.TEXTURE_FORMAT_RGBA32I,
            [Constants.TEXTURETYPE_UNSIGNED_INTEGER]: _native.Engine.TEXTURE_FORMAT_RGBA32U,
        },
        [Constants.TEXTUREFORMAT_R]: {
            [Constants.TEXTURETYPE_UNSIGNED_BYTE]: _native.Engine.TEXTURE_FORMAT_R8,
            [Constants.TEXTURETYPE_FLOAT]: _native.Engine.TEXTURE_FORMAT_R32F,
            [Constants.TEXTURETYPE_HALF_FLOAT]: _native.Engine.TEXTURE_FORMAT_R16F,
            [Constants.TEXTURETYPE_BYTE]: _native.Engine.TEXTURE_FORMAT_R8S,
            [Constants.TEXTURETYPE_SHORT]: _native.Engine.TEXTURE_FORMAT_R16S,
            [Constants.TEXTURETYPE_UNSIGNED_SHORT]: _native.Engine.TEXTURE_FORMAT_R16U,
            [Constants.TEXTURETYPE_INT]: _native.Engine.TEXTURE_FORMAT_R32I,
            [Constants.TEXTURETYPE_UNSIGNED_INTEGER]: _native.Engine.TEXTURE_FORMAT_R32U,
        },
        [Constants.TEXTUREFORMAT_RG]: {
            [Constants.TEXTURETYPE_UNSIGNED_BYTE]: _native.Engine.TEXTURE_FORMAT_RG8,
            [Constants.TEXTURETYPE_FLOAT]: _native.Engine.TEXTURE_FORMAT_RG32F,
            [Constants.TEXTURETYPE_HALF_FLOAT]: _native.Engine.TEXTURE_FORMAT_RG16F,
            [Constants.TEXTURETYPE_BYTE]: _native.Engine.TEXTURE_FORMAT_RG8S,
            [Constants.TEXTURETYPE_SHORT]: _native.Engine.TEXTURE_FORMAT_RG16S,
            [Constants.TEXTURETYPE_UNSIGNED_SHORT]: _native.Engine.TEXTURE_FORMAT_RG16U,
            [Constants.TEXTURETYPE_INT]: _native.Engine.TEXTURE_FORMAT_RG32I,
            [Constants.TEXTURETYPE_UNSIGNED_INTEGER]: _native.Engine.TEXTURE_FORMAT_RG32U,
        },
        [Constants.TEXTUREFORMAT_BGRA]: {
            [Constants.TEXTURETYPE_UNSIGNED_BYTE]: _native.Engine.TEXTURE_FORMAT_BGRA8,
        },
    };

    const compressedTextureFormats: { [format: number]: number } = {
        [Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM]: _native.Engine.TEXTURE_FORMAT_BC7,
        [Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT]: _native.Engine.TEXTURE_FORMAT_BC6H,
        [Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5]: _native.Engine.TEXTURE_FORMAT_BC3,
        [Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3]: _native.Engine.TEXTURE_FORMAT_BC2,
        [Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1]: _native.Engine.TEXTURE_FORMAT_BC1,
        [Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1]: _native.Engine.TEXTURE_FORMAT_BC1,
        [Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4]: _native.Engine.TEXTURE_FORMAT_ASTC4x4,
        [Constants.TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL]: _native.Engine.TEXTURE_FORMAT_ETC1,
        [Constants.TEXTUREFORMAT_COMPRESSED_RGB8_ETC2]: _native.Engine.TEXTURE_FORMAT_ETC2,
        [Constants.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC]: _native.Engine.TEXTURE_FORMAT_ETC2A,
    };

    const depthTextureFormats: { [format: number]: number } = {
        [Constants.TEXTUREFORMAT_DEPTH16]: _native.Engine.TEXTURE_FORMAT_D16,
        [Constants.TEXTUREFORMAT_DEPTH24]: _native.Engine.TEXTURE_FORMAT_D24,
        [Constants.TEXTUREFORMAT_DEPTH24_STENCIL8]: _native.Engine.TEXTURE_FORMAT_D24S8,
        [Constants.TEXTUREFORMAT_DEPTH32_FLOAT]: _native.Engine.TEXTURE_FORMAT_D32F,
    };

    const depthFormat = depthTextureFormats[format];
    if (depthFormat) {
        return depthFormat;
    }

    const compressedFormat = compressedTextureFormats[format];
    if (compressedFormat) {
        return compressedFormat;
    }

    const formatTypes = textureFormats[format];
    if (formatTypes) {
        const format = formatTypes[type];
        if (format) {
            return format;
        }
    }

    throw new RuntimeError(`Unsupported texture format or type: format ${format}, type ${type}.`, ErrorCodes.UnsupportedTextureError);
}

export function getNativeSamplingMode(samplingMode: number): number {
    switch (samplingMode) {
        case Constants.TEXTURE_NEAREST_NEAREST:
            return _native.Engine.TEXTURE_NEAREST_NEAREST;
        case Constants.TEXTURE_LINEAR_LINEAR:
            return _native.Engine.TEXTURE_LINEAR_LINEAR;
        case Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR:
            return _native.Engine.TEXTURE_LINEAR_LINEAR_MIPLINEAR;
        case Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST:
            return _native.Engine.TEXTURE_NEAREST_NEAREST_MIPNEAREST;
        case Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST:
            return _native.Engine.TEXTURE_NEAREST_LINEAR_MIPNEAREST;
        case Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR:
            return _native.Engine.TEXTURE_NEAREST_LINEAR_MIPLINEAR;
        case Constants.TEXTURE_NEAREST_LINEAR:
            return _native.Engine.TEXTURE_NEAREST_LINEAR;
        case Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR:
            return _native.Engine.TEXTURE_NEAREST_NEAREST_MIPLINEAR;
        case Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST:
            return _native.Engine.TEXTURE_LINEAR_NEAREST_MIPNEAREST;
        case Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR:
            return _native.Engine.TEXTURE_LINEAR_NEAREST_MIPLINEAR;
        case Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST:
            return _native.Engine.TEXTURE_LINEAR_LINEAR_MIPNEAREST;
        case Constants.TEXTURE_LINEAR_NEAREST:
            return _native.Engine.TEXTURE_LINEAR_NEAREST;
        default:
            throw new Error(`Unsupported sampling mode: ${samplingMode}.`);
    }
}

export function getNativeAddressMode(wrapMode: number): number {
    switch (wrapMode) {
        case Constants.TEXTURE_WRAP_ADDRESSMODE:
            return _native.Engine.ADDRESS_MODE_WRAP;
        case Constants.TEXTURE_CLAMP_ADDRESSMODE:
            return _native.Engine.ADDRESS_MODE_CLAMP;
        case Constants.TEXTURE_MIRROR_ADDRESSMODE:
            return _native.Engine.ADDRESS_MODE_MIRROR;
        default:
            throw new Error("Unexpected wrap mode: " + wrapMode + ".");
    }
}

export function getNativeStencilFunc(func: number): number {
    switch (func) {
        case Constants.LESS:
            return _native.Engine.STENCIL_TEST_LESS;
        case Constants.LEQUAL:
            return _native.Engine.STENCIL_TEST_LEQUAL;
        case Constants.EQUAL:
            return _native.Engine.STENCIL_TEST_EQUAL;
        case Constants.GEQUAL:
            return _native.Engine.STENCIL_TEST_GEQUAL;
        case Constants.GREATER:
            return _native.Engine.STENCIL_TEST_GREATER;
        case Constants.NOTEQUAL:
            return _native.Engine.STENCIL_TEST_NOTEQUAL;
        case Constants.NEVER:
            return _native.Engine.STENCIL_TEST_NEVER;
        case Constants.ALWAYS:
            return _native.Engine.STENCIL_TEST_ALWAYS;
        default:
            throw new Error(`Unsupported stencil func mode: ${func}.`);
    }
}

export function getNativeStencilOpFail(opFail: number): number {
    switch (opFail) {
        case Constants.KEEP:
            return _native.Engine.STENCIL_OP_FAIL_S_KEEP;
        case Constants.ZERO:
            return _native.Engine.STENCIL_OP_FAIL_S_ZERO;
        case Constants.REPLACE:
            return _native.Engine.STENCIL_OP_FAIL_S_REPLACE;
        case Constants.INCR:
            return _native.Engine.STENCIL_OP_FAIL_S_INCR;
        case Constants.DECR:
            return _native.Engine.STENCIL_OP_FAIL_S_DECR;
        case Constants.INVERT:
            return _native.Engine.STENCIL_OP_FAIL_S_INVERT;
        case Constants.INCR_WRAP:
            return _native.Engine.STENCIL_OP_FAIL_S_INCRSAT;
        case Constants.DECR_WRAP:
            return _native.Engine.STENCIL_OP_FAIL_S_DECRSAT;
        default:
            throw new Error(`Unsupported stencil OpFail mode: ${opFail}.`);
    }
}

export function getNativeStencilDepthFail(depthFail: number): number {
    switch (depthFail) {
        case Constants.KEEP:
            return _native.Engine.STENCIL_OP_FAIL_Z_KEEP;
        case Constants.ZERO:
            return _native.Engine.STENCIL_OP_FAIL_Z_ZERO;
        case Constants.REPLACE:
            return _native.Engine.STENCIL_OP_FAIL_Z_REPLACE;
        case Constants.INCR:
            return _native.Engine.STENCIL_OP_FAIL_Z_INCR;
        case Constants.DECR:
            return _native.Engine.STENCIL_OP_FAIL_Z_DECR;
        case Constants.INVERT:
            return _native.Engine.STENCIL_OP_FAIL_Z_INVERT;
        case Constants.INCR_WRAP:
            return _native.Engine.STENCIL_OP_FAIL_Z_INCRSAT;
        case Constants.DECR_WRAP:
            return _native.Engine.STENCIL_OP_FAIL_Z_DECRSAT;
        default:
            throw new Error(`Unsupported stencil depthFail mode: ${depthFail}.`);
    }
}

export function getNativeStencilDepthPass(opPass: number): number {
    switch (opPass) {
        case Constants.KEEP:
            return _native.Engine.STENCIL_OP_PASS_Z_KEEP;
        case Constants.ZERO:
            return _native.Engine.STENCIL_OP_PASS_Z_ZERO;
        case Constants.REPLACE:
            return _native.Engine.STENCIL_OP_PASS_Z_REPLACE;
        case Constants.INCR:
            return _native.Engine.STENCIL_OP_PASS_Z_INCR;
        case Constants.DECR:
            return _native.Engine.STENCIL_OP_PASS_Z_DECR;
        case Constants.INVERT:
            return _native.Engine.STENCIL_OP_PASS_Z_INVERT;
        case Constants.INCR_WRAP:
            return _native.Engine.STENCIL_OP_PASS_Z_INCRSAT;
        case Constants.DECR_WRAP:
            return _native.Engine.STENCIL_OP_PASS_Z_DECRSAT;
        default:
            throw new Error(`Unsupported stencil opPass mode: ${opPass}.`);
    }
}

export function getNativeAlphaMode(mode: number): number {
    switch (mode) {
        case Constants.ALPHA_DISABLE:
            return _native.Engine.ALPHA_DISABLE;
        case Constants.ALPHA_ADD:
            return _native.Engine.ALPHA_ADD;
        case Constants.ALPHA_COMBINE:
            return _native.Engine.ALPHA_COMBINE;
        case Constants.ALPHA_SUBTRACT:
            return _native.Engine.ALPHA_SUBTRACT;
        case Constants.ALPHA_MULTIPLY:
            return _native.Engine.ALPHA_MULTIPLY;
        case Constants.ALPHA_MAXIMIZED:
            return _native.Engine.ALPHA_MAXIMIZED;
        case Constants.ALPHA_ONEONE:
            return _native.Engine.ALPHA_ONEONE;
        case Constants.ALPHA_PREMULTIPLIED:
            return _native.Engine.ALPHA_PREMULTIPLIED;
        case Constants.ALPHA_PREMULTIPLIED_PORTERDUFF:
            return _native.Engine.ALPHA_PREMULTIPLIED_PORTERDUFF;
        case Constants.ALPHA_INTERPOLATE:
            return _native.Engine.ALPHA_INTERPOLATE;
        case Constants.ALPHA_SCREENMODE:
            return _native.Engine.ALPHA_SCREENMODE;
        default:
            throw new Error(`Unsupported alpha mode: ${mode}.`);
    }
}

export function getNativeAttribType(type: number): number {
    switch (type) {
        case VertexBuffer.BYTE:
            return _native.Engine.ATTRIB_TYPE_INT8;
        case VertexBuffer.UNSIGNED_BYTE:
            return _native.Engine.ATTRIB_TYPE_UINT8;
        case VertexBuffer.SHORT:
            return _native.Engine.ATTRIB_TYPE_INT16;
        case VertexBuffer.UNSIGNED_SHORT:
            return _native.Engine.ATTRIB_TYPE_UINT16;
        case VertexBuffer.FLOAT:
            return _native.Engine.ATTRIB_TYPE_FLOAT;
        default:
            throw new Error(`Unsupported attribute type: ${type}.`);
    }
}
