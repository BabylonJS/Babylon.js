/* eslint-disable babylonjs/available */
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as WebGPUConstants from "./webgpuConstants";
import { Scalar } from "../../Maths/math.scalar";
import { Constants } from "../constants";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { HardwareTextureWrapper } from "../../Materials/Textures/hardwareTextureWrapper";

/** @internal */
export class WebGPUTextureHelper {
    public static ComputeNumMipmapLevels(width: number, height: number) {
        return Scalar.ILog2(Math.max(width, height)) + 1;
    }

    public static GetTextureTypeFromFormat(format: GPUTextureFormat): number {
        switch (format) {
            // One Component = 8 bits
            case WebGPUConstants.TextureFormat.R8Unorm:
            case WebGPUConstants.TextureFormat.R8Snorm:
            case WebGPUConstants.TextureFormat.R8Uint:
            case WebGPUConstants.TextureFormat.R8Sint:
            case WebGPUConstants.TextureFormat.RG8Unorm:
            case WebGPUConstants.TextureFormat.RG8Snorm:
            case WebGPUConstants.TextureFormat.RG8Uint:
            case WebGPUConstants.TextureFormat.RG8Sint:
            case WebGPUConstants.TextureFormat.RGBA8Unorm:
            case WebGPUConstants.TextureFormat.RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGBA8Snorm:
            case WebGPUConstants.TextureFormat.RGBA8Uint:
            case WebGPUConstants.TextureFormat.RGBA8Sint:
            case WebGPUConstants.TextureFormat.BGRA8Unorm:
            case WebGPUConstants.TextureFormat.BGRA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGB10A2UINT: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.RGB10A2Unorm: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.RGB9E5UFloat: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.RG11B10UFloat: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.BC7RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC7RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC6HRGBUFloat:
            case WebGPUConstants.TextureFormat.BC6HRGBFloat:
            case WebGPUConstants.TextureFormat.BC5RGUnorm:
            case WebGPUConstants.TextureFormat.BC5RGSnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC2RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC2RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC4RUnorm:
            case WebGPUConstants.TextureFormat.BC4RSnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGB8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGBA8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.EACR11Unorm:
            case WebGPUConstants.TextureFormat.EACR11Snorm:
            case WebGPUConstants.TextureFormat.EACRG11Unorm:
            case WebGPUConstants.TextureFormat.EACRG11Snorm:
            case WebGPUConstants.TextureFormat.ASTC4x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC4x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x12Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x12UnormSRGB:
            case WebGPUConstants.TextureFormat.Stencil8:
                return Constants.TEXTURETYPE_UNSIGNED_BYTE;

            // One component = 16 bits
            case WebGPUConstants.TextureFormat.R16Uint:
            case WebGPUConstants.TextureFormat.R16Sint:
            case WebGPUConstants.TextureFormat.RG16Uint:
            case WebGPUConstants.TextureFormat.RG16Sint:
            case WebGPUConstants.TextureFormat.RGBA16Uint:
            case WebGPUConstants.TextureFormat.RGBA16Sint:
            case WebGPUConstants.TextureFormat.Depth16Unorm:
                return Constants.TEXTURETYPE_UNSIGNED_SHORT;

            case WebGPUConstants.TextureFormat.R16Float:
            case WebGPUConstants.TextureFormat.RG16Float:
            case WebGPUConstants.TextureFormat.RGBA16Float:
                return Constants.TEXTURETYPE_HALF_FLOAT;

            // One component = 32 bits
            case WebGPUConstants.TextureFormat.R32Uint:
            case WebGPUConstants.TextureFormat.R32Sint:
            case WebGPUConstants.TextureFormat.RG32Uint:
            case WebGPUConstants.TextureFormat.RG32Sint:
            case WebGPUConstants.TextureFormat.RGBA32Uint:
            case WebGPUConstants.TextureFormat.RGBA32Sint:
                return Constants.TEXTURETYPE_UNSIGNED_INTEGER;

            case WebGPUConstants.TextureFormat.R32Float:
            case WebGPUConstants.TextureFormat.RG32Float:
            case WebGPUConstants.TextureFormat.RGBA32Float:
            case WebGPUConstants.TextureFormat.Depth32Float:
            case WebGPUConstants.TextureFormat.Depth32FloatStencil8:
            case WebGPUConstants.TextureFormat.Depth24Plus:
            case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
                return Constants.TEXTURETYPE_FLOAT;
        }

        return Constants.TEXTURETYPE_UNSIGNED_BYTE;
    }

    public static GetBlockInformationFromFormat(format: GPUTextureFormat): { width: number; height: number; length: number } {
        switch (format) {
            // 8 bits formats
            case WebGPUConstants.TextureFormat.R8Unorm:
            case WebGPUConstants.TextureFormat.R8Snorm:
            case WebGPUConstants.TextureFormat.R8Uint:
            case WebGPUConstants.TextureFormat.R8Sint:
                return { width: 1, height: 1, length: 1 };

            // 16 bits formats
            case WebGPUConstants.TextureFormat.R16Uint:
            case WebGPUConstants.TextureFormat.R16Sint:
            case WebGPUConstants.TextureFormat.R16Float:
            case WebGPUConstants.TextureFormat.RG8Unorm:
            case WebGPUConstants.TextureFormat.RG8Snorm:
            case WebGPUConstants.TextureFormat.RG8Uint:
            case WebGPUConstants.TextureFormat.RG8Sint:
                return { width: 1, height: 1, length: 2 };

            // 32 bits formats
            case WebGPUConstants.TextureFormat.R32Uint:
            case WebGPUConstants.TextureFormat.R32Sint:
            case WebGPUConstants.TextureFormat.R32Float:
            case WebGPUConstants.TextureFormat.RG16Uint:
            case WebGPUConstants.TextureFormat.RG16Sint:
            case WebGPUConstants.TextureFormat.RG16Float:
            case WebGPUConstants.TextureFormat.RGBA8Unorm:
            case WebGPUConstants.TextureFormat.RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGBA8Snorm:
            case WebGPUConstants.TextureFormat.RGBA8Uint:
            case WebGPUConstants.TextureFormat.RGBA8Sint:
            case WebGPUConstants.TextureFormat.BGRA8Unorm:
            case WebGPUConstants.TextureFormat.BGRA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGB9E5UFloat:
            case WebGPUConstants.TextureFormat.RGB10A2UINT:
            case WebGPUConstants.TextureFormat.RGB10A2Unorm:
            case WebGPUConstants.TextureFormat.RG11B10UFloat:
                return { width: 1, height: 1, length: 4 };

            // 64 bits formats
            case WebGPUConstants.TextureFormat.RG32Uint:
            case WebGPUConstants.TextureFormat.RG32Sint:
            case WebGPUConstants.TextureFormat.RG32Float:
            case WebGPUConstants.TextureFormat.RGBA16Uint:
            case WebGPUConstants.TextureFormat.RGBA16Sint:
            case WebGPUConstants.TextureFormat.RGBA16Float:
                return { width: 1, height: 1, length: 8 };

            // 128 bits formats
            case WebGPUConstants.TextureFormat.RGBA32Uint:
            case WebGPUConstants.TextureFormat.RGBA32Sint:
            case WebGPUConstants.TextureFormat.RGBA32Float:
                return { width: 1, height: 1, length: 16 };

            // Depth and stencil formats
            case WebGPUConstants.TextureFormat.Stencil8:
                // eslint-disable-next-line no-throw-literal
                throw "No fixed size for Stencil8 format!";
            case WebGPUConstants.TextureFormat.Depth16Unorm:
                return { width: 1, height: 1, length: 2 };
            case WebGPUConstants.TextureFormat.Depth24Plus:
                // eslint-disable-next-line no-throw-literal
                throw "No fixed size for Depth24Plus format!";
            case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
                // eslint-disable-next-line no-throw-literal
                throw "No fixed size for Depth24PlusStencil8 format!";
            case WebGPUConstants.TextureFormat.Depth32Float:
                return { width: 1, height: 1, length: 4 };
            case WebGPUConstants.TextureFormat.Depth32FloatStencil8:
                return { width: 1, height: 1, length: 5 };

            // BC compressed formats usable if "texture-compression-bc" is both
            // supported by the device/user agent and enabled in requestDevice.
            case WebGPUConstants.TextureFormat.BC7RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC7RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC6HRGBUFloat:
            case WebGPUConstants.TextureFormat.BC6HRGBFloat:
            case WebGPUConstants.TextureFormat.BC5RGUnorm:
            case WebGPUConstants.TextureFormat.BC5RGSnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC2RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC2RGBAUnormSRGB:
                return { width: 4, height: 4, length: 16 };

            case WebGPUConstants.TextureFormat.BC4RUnorm:
            case WebGPUConstants.TextureFormat.BC4RSnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB:
                return { width: 4, height: 4, length: 8 };

            // ETC2 compressed formats usable if "texture-compression-etc2" is both
            // supported by the device/user agent and enabled in requestDevice.
            case WebGPUConstants.TextureFormat.ETC2RGB8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1UnormSRGB:
            case WebGPUConstants.TextureFormat.EACR11Unorm:
            case WebGPUConstants.TextureFormat.EACR11Snorm:
                return { width: 4, height: 4, length: 8 };

            case WebGPUConstants.TextureFormat.ETC2RGBA8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.EACRG11Unorm:
            case WebGPUConstants.TextureFormat.EACRG11Snorm:
                return { width: 4, height: 4, length: 16 };

            // ASTC compressed formats usable if "texture-compression-astc" is both
            // supported by the device/user agent and enabled in requestDevice.
            case WebGPUConstants.TextureFormat.ASTC4x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC4x4UnormSRGB:
                return { width: 4, height: 4, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC5x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x4UnormSRGB:
                return { width: 5, height: 4, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC5x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x5UnormSRGB:
                return { width: 5, height: 5, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC6x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x5UnormSRGB:
                return { width: 6, height: 5, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC6x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x6UnormSRGB:
                return { width: 6, height: 6, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC8x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x5UnormSRGB:
                return { width: 8, height: 5, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC8x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x6UnormSRGB:
                return { width: 8, height: 6, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC8x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x8UnormSRGB:
                return { width: 8, height: 8, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC10x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x5UnormSRGB:
                return { width: 10, height: 5, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC10x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x6UnormSRGB:
                return { width: 10, height: 6, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC10x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x8UnormSRGB:
                return { width: 10, height: 8, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC10x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x10UnormSRGB:
                return { width: 10, height: 10, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC12x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x10UnormSRGB:
                return { width: 12, height: 10, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC12x12Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x12UnormSRGB:
                return { width: 12, height: 12, length: 16 };
        }

        return { width: 1, height: 1, length: 4 };
    }

    public static IsHardwareTexture(texture: HardwareTextureWrapper | GPUTexture): texture is HardwareTextureWrapper {
        return !!(texture as HardwareTextureWrapper).release;
    }

    public static IsInternalTexture(texture: InternalTexture | GPUTexture): texture is InternalTexture {
        return !!(texture as InternalTexture).dispose;
    }

    public static IsImageBitmap(imageBitmap: ImageBitmap | { width: number; height: number }): imageBitmap is ImageBitmap {
        return (imageBitmap as ImageBitmap).close !== undefined;
    }

    public static IsImageBitmapArray(imageBitmap: ImageBitmap[] | { width: number; height: number }): imageBitmap is ImageBitmap[] {
        return Array.isArray(imageBitmap as ImageBitmap[]) && (imageBitmap as ImageBitmap[])[0].close !== undefined;
    }

    public static IsCompressedFormat(format: GPUTextureFormat): boolean {
        switch (format) {
            case WebGPUConstants.TextureFormat.BC7RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC7RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC6HRGBFloat:
            case WebGPUConstants.TextureFormat.BC6HRGBUFloat:
            case WebGPUConstants.TextureFormat.BC5RGSnorm:
            case WebGPUConstants.TextureFormat.BC5RGUnorm:
            case WebGPUConstants.TextureFormat.BC4RSnorm:
            case WebGPUConstants.TextureFormat.BC4RUnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC3RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC2RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC2RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC1RGBAUnorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGBA8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.EACR11Unorm:
            case WebGPUConstants.TextureFormat.EACR11Snorm:
            case WebGPUConstants.TextureFormat.EACRG11Unorm:
            case WebGPUConstants.TextureFormat.EACRG11Snorm:
            case WebGPUConstants.TextureFormat.ASTC4x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC4x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x12Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x12UnormSRGB:
                return true;
        }

        return false;
    }

    public static GetWebGPUTextureFormat(type: number, format: number, useSRGBBuffer = false): GPUTextureFormat {
        switch (format) {
            case Constants.TEXTUREFORMAT_DEPTH16:
                return WebGPUConstants.TextureFormat.Depth16Unorm;
            case Constants.TEXTUREFORMAT_DEPTH24:
                return WebGPUConstants.TextureFormat.Depth24Plus;
            case Constants.TEXTUREFORMAT_DEPTH24_STENCIL8:
                return WebGPUConstants.TextureFormat.Depth24PlusStencil8;
            case Constants.TEXTUREFORMAT_DEPTH32_FLOAT:
                return WebGPUConstants.TextureFormat.Depth32Float;
            case Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8:
                return WebGPUConstants.TextureFormat.Depth32FloatStencil8;
            case Constants.TEXTUREFORMAT_STENCIL8:
                return WebGPUConstants.TextureFormat.Stencil8;

            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.BC7RGBAUnormSRGB : WebGPUConstants.TextureFormat.BC7RGBAUnorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT:
                return WebGPUConstants.TextureFormat.BC6HRGBUFloat;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT:
                return WebGPUConstants.TextureFormat.BC6HRGBFloat;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.BC3RGBAUnormSRGB : WebGPUConstants.TextureFormat.BC3RGBAUnorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.BC2RGBAUnormSRGB : WebGPUConstants.TextureFormat.BC2RGBAUnorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1:
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB : WebGPUConstants.TextureFormat.BC1RGBAUnorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.ASTC4x4UnormSRGB : WebGPUConstants.TextureFormat.ASTC4x4Unorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL:
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB8_ETC2:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.ETC2RGB8UnormSRGB : WebGPUConstants.TextureFormat.ETC2RGB8Unorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.ETC2RGBA8UnormSRGB : WebGPUConstants.TextureFormat.ETC2RGBA8Unorm;
        }

        switch (type) {
            case Constants.TEXTURETYPE_BYTE:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return WebGPUConstants.TextureFormat.R8Snorm;
                    case Constants.TEXTUREFORMAT_RG:
                        return WebGPUConstants.TextureFormat.RG8Snorm;
                    case Constants.TEXTUREFORMAT_RGB:
                        // eslint-disable-next-line no-throw-literal
                        throw "RGB format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R8Sint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG8Sint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        // eslint-disable-next-line no-throw-literal
                        throw "RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA8Sint;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA8Snorm;
                }
            case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return WebGPUConstants.TextureFormat.R8Unorm;
                    case Constants.TEXTUREFORMAT_RG:
                        return WebGPUConstants.TextureFormat.RG8Unorm;
                    case Constants.TEXTUREFORMAT_RGB:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_RGB format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA:
                        return useSRGBBuffer ? WebGPUConstants.TextureFormat.RGBA8UnormSRGB : WebGPUConstants.TextureFormat.RGBA8Unorm;
                    case Constants.TEXTUREFORMAT_BGRA:
                        return useSRGBBuffer ? WebGPUConstants.TextureFormat.BGRA8UnormSRGB : WebGPUConstants.TextureFormat.BGRA8Unorm;
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R8Uint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG8Uint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        // eslint-disable-next-line no-throw-literal
                        throw "RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA8Uint;
                    case Constants.TEXTUREFORMAT_ALPHA:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_ALPHA format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_LUMINANCE:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_LUMINANCE format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_LUMINANCE_ALPHA format not supported in WebGPU";
                    default:
                        return WebGPUConstants.TextureFormat.RGBA8Unorm;
                }
            case Constants.TEXTURETYPE_SHORT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R16Sint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG16Sint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA16Sint;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA16Sint;
                }
            case Constants.TEXTURETYPE_UNSIGNED_SHORT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R16Uint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG16Uint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA16Uint;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA16Uint;
                }
            case Constants.TEXTURETYPE_INT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R32Sint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG32Sint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA32Sint;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA32Sint;
                }
            case Constants.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R32Uint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG32Uint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA32Uint;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA32Uint;
                }
            case Constants.TEXTURETYPE_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return WebGPUConstants.TextureFormat.R32Float; // By default. Other possibility is R16Float.
                    case Constants.TEXTUREFORMAT_RG:
                        return WebGPUConstants.TextureFormat.RG32Float; // By default. Other possibility is RG16Float.
                    case Constants.TEXTUREFORMAT_RGB:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_RGB format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA:
                        return WebGPUConstants.TextureFormat.RGBA32Float; // By default. Other possibility is RGBA16Float.
                    default:
                        return WebGPUConstants.TextureFormat.RGBA32Float;
                }
            case Constants.TEXTURETYPE_HALF_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return WebGPUConstants.TextureFormat.R16Float;
                    case Constants.TEXTUREFORMAT_RG:
                        return WebGPUConstants.TextureFormat.RG16Float;
                    case Constants.TEXTUREFORMAT_RGB:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_RGB format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA:
                        return WebGPUConstants.TextureFormat.RGBA16Float;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA16Float;
                }
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                // eslint-disable-next-line no-throw-literal
                throw "TEXTURETYPE_UNSIGNED_SHORT_5_6_5 format not supported in WebGPU";
            case Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RGBA:
                        return WebGPUConstants.TextureFormat.RG11B10UFloat;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_RGBA_INTEGER format not supported in WebGPU when type is TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV";
                    default:
                        return WebGPUConstants.TextureFormat.RG11B10UFloat;
                }
            case Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RGBA:
                        return WebGPUConstants.TextureFormat.RGB9E5UFloat;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        // eslint-disable-next-line no-throw-literal
                        throw "TEXTUREFORMAT_RGBA_INTEGER format not supported in WebGPU when type is TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV";
                    default:
                        return WebGPUConstants.TextureFormat.RGB9E5UFloat;
                }
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                // eslint-disable-next-line no-throw-literal
                throw "TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 format not supported in WebGPU";
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                // eslint-disable-next-line no-throw-literal
                throw "TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 format not supported in WebGPU";
            case Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RGBA:
                        return WebGPUConstants.TextureFormat.RGB10A2Unorm;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGB10A2UINT;
                    default:
                        return WebGPUConstants.TextureFormat.RGB10A2Unorm;
                }
        }

        return useSRGBBuffer ? WebGPUConstants.TextureFormat.RGBA8UnormSRGB : WebGPUConstants.TextureFormat.RGBA8Unorm;
    }

    public static GetNumChannelsFromWebGPUTextureFormat(format: GPUTextureFormat): number {
        switch (format) {
            case WebGPUConstants.TextureFormat.R8Unorm:
            case WebGPUConstants.TextureFormat.R8Snorm:
            case WebGPUConstants.TextureFormat.R8Uint:
            case WebGPUConstants.TextureFormat.R8Sint:
            case WebGPUConstants.TextureFormat.BC4RUnorm:
            case WebGPUConstants.TextureFormat.BC4RSnorm:
            case WebGPUConstants.TextureFormat.R16Uint:
            case WebGPUConstants.TextureFormat.R16Sint:
            case WebGPUConstants.TextureFormat.Depth16Unorm:
            case WebGPUConstants.TextureFormat.R16Float:
            case WebGPUConstants.TextureFormat.R32Uint:
            case WebGPUConstants.TextureFormat.R32Sint:
            case WebGPUConstants.TextureFormat.R32Float:
            case WebGPUConstants.TextureFormat.Depth32Float:
            case WebGPUConstants.TextureFormat.Stencil8:
            case WebGPUConstants.TextureFormat.Depth24Plus:
            case WebGPUConstants.TextureFormat.EACR11Unorm:
            case WebGPUConstants.TextureFormat.EACR11Snorm:
                return 1;

            case WebGPUConstants.TextureFormat.RG8Unorm:
            case WebGPUConstants.TextureFormat.RG8Snorm:
            case WebGPUConstants.TextureFormat.RG8Uint:
            case WebGPUConstants.TextureFormat.RG8Sint:
            case WebGPUConstants.TextureFormat.Depth32FloatStencil8:
            case WebGPUConstants.TextureFormat.BC5RGUnorm:
            case WebGPUConstants.TextureFormat.BC5RGSnorm:
            case WebGPUConstants.TextureFormat.RG16Uint:
            case WebGPUConstants.TextureFormat.RG16Sint:
            case WebGPUConstants.TextureFormat.RG16Float:
            case WebGPUConstants.TextureFormat.RG32Uint:
            case WebGPUConstants.TextureFormat.RG32Sint:
            case WebGPUConstants.TextureFormat.RG32Float:
            case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
            case WebGPUConstants.TextureFormat.EACRG11Unorm:
            case WebGPUConstants.TextureFormat.EACRG11Snorm:
                return 2;

            case WebGPUConstants.TextureFormat.RGB9E5UFloat:
            case WebGPUConstants.TextureFormat.RG11B10UFloat:
            case WebGPUConstants.TextureFormat.BC6HRGBUFloat:
            case WebGPUConstants.TextureFormat.BC6HRGBFloat:
            case WebGPUConstants.TextureFormat.ETC2RGB8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8UnormSRGB:
                return 3;

            case WebGPUConstants.TextureFormat.RGBA8Unorm:
            case WebGPUConstants.TextureFormat.RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGBA8Snorm:
            case WebGPUConstants.TextureFormat.RGBA8Uint:
            case WebGPUConstants.TextureFormat.RGBA8Sint:
            case WebGPUConstants.TextureFormat.BGRA8Unorm:
            case WebGPUConstants.TextureFormat.BGRA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGB10A2UINT:
            case WebGPUConstants.TextureFormat.RGB10A2Unorm:
            case WebGPUConstants.TextureFormat.BC7RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC7RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC3RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC2RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC2RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC1RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.RGBA16Uint:
            case WebGPUConstants.TextureFormat.RGBA16Sint:
            case WebGPUConstants.TextureFormat.RGBA16Float:
            case WebGPUConstants.TextureFormat.RGBA32Uint:
            case WebGPUConstants.TextureFormat.RGBA32Sint:
            case WebGPUConstants.TextureFormat.RGBA32Float:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGBA8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC4x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC4x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x12Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x12UnormSRGB:
                return 4;
        }

        // eslint-disable-next-line no-throw-literal
        throw `Unknown format ${format}!`;
    }

    public static HasStencilAspect(format: GPUTextureFormat): boolean {
        switch (format) {
            case WebGPUConstants.TextureFormat.Stencil8:
            case WebGPUConstants.TextureFormat.Depth32FloatStencil8:
            case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
                return true;
        }

        return false;
    }

    public static HasDepthAndStencilAspects(format: GPUTextureFormat): boolean {
        switch (format) {
            case WebGPUConstants.TextureFormat.Depth32FloatStencil8:
            case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
                return true;
        }

        return false;
    }

    public static GetDepthFormatOnly(format: GPUTextureFormat): GPUTextureFormat {
        switch (format) {
            case WebGPUConstants.TextureFormat.Depth16Unorm:
                return WebGPUConstants.TextureFormat.Depth16Unorm;
            case WebGPUConstants.TextureFormat.Depth24Plus:
                return WebGPUConstants.TextureFormat.Depth24Plus;
            case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
                return WebGPUConstants.TextureFormat.Depth24Plus;
            case WebGPUConstants.TextureFormat.Depth32Float:
                return WebGPUConstants.TextureFormat.Depth32Float;
            case WebGPUConstants.TextureFormat.Depth32FloatStencil8:
                return WebGPUConstants.TextureFormat.Depth32Float;
        }

        return format;
    }

    public static GetSample(sampleCount: number) {
        // WebGPU only supports 1 or 4
        return sampleCount > 1 ? 4 : 1;
    }
}
