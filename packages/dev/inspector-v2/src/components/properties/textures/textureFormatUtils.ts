import { Constants } from "core/Engines/constants";

export const TextureFormat = [
    { label: "Alpha", normalizable: false, value: Constants.TEXTUREFORMAT_ALPHA },
    { label: "Luminance", normalizable: false, value: Constants.TEXTUREFORMAT_LUMINANCE },
    { label: "Luminance/Alpha", normalizable: false, value: Constants.TEXTUREFORMAT_LUMINANCE_ALPHA },
    { label: "RGB", normalizable: true, value: Constants.TEXTUREFORMAT_RGB },
    { label: "RGBA", normalizable: true, value: Constants.TEXTUREFORMAT_RGBA },
    { label: "R (red)", normalizable: true, value: Constants.TEXTUREFORMAT_RED },
    { label: "RG (red/green)", normalizable: true, value: Constants.TEXTUREFORMAT_RG },
    { label: "R (red) integer", normalizable: false, value: Constants.TEXTUREFORMAT_RED_INTEGER },
    { label: "RG (red/green) integer", normalizable: false, value: Constants.TEXTUREFORMAT_RG_INTEGER },
    { label: "RGB integer", normalizable: false, value: Constants.TEXTUREFORMAT_RGB_INTEGER },
    { label: "RGBA integer", normalizable: false, value: Constants.TEXTUREFORMAT_RGBA_INTEGER },
    { label: "BGRA", normalizable: true, value: Constants.TEXTUREFORMAT_BGRA },
    { label: "Depth24/Stencil8", normalizable: false, hideType: true, value: Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 },
    { label: "Depth32 float", normalizable: false, hideType: true, value: Constants.TEXTUREFORMAT_DEPTH32_FLOAT },
    { label: "Depth16", normalizable: false, value: Constants.TEXTUREFORMAT_DEPTH16 },
    { label: "Depth24", normalizable: false, value: Constants.TEXTUREFORMAT_DEPTH24 },
    { label: "Depth24Unorm/Stencil8", normalizable: false, hideType: true, value: Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 },
    { label: "Depth32Float/Stencil8", normalizable: false, hideType: true, value: Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8 },
    { label: "RGBA BPTC UNorm", normalizable: false, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM },
    { label: "RGB BPTC UFloat", normalizable: false, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT },
    { label: "RGB BPTC SFloat", normalizable: false, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT },
    { label: "RGBA S3TC DXT5", normalizable: false, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5 },
    { label: "RGBA S3TC DXT3", normalizable: false, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3 },
    { label: "RGBA S3TC DXT1", normalizable: false, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1 },
    { label: "RGB S3TC DXT1", normalizable: false, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1 },
    { label: "RGBA ASTC 4x4", normalizable: false, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4 },
];

export function FindTextureFormat(format: number) {
    for (let i = 0; i < TextureFormat.length; ++i) {
        if (TextureFormat[i].value === format) {
            return TextureFormat[i];
        }
    }
    return null;
}

export const TextureType = [
    { label: "unsigned byte", normalizable: true, value: Constants.TEXTURETYPE_UNSIGNED_BYTE },
    { label: "32-bit float", normalizable: false, value: Constants.TEXTURETYPE_FLOAT },
    { label: "16-bit float", normalizable: false, value: Constants.TEXTURETYPE_HALF_FLOAT },
    { label: "signed byte", normalizable: true, value: Constants.TEXTURETYPE_BYTE },
    { label: "signed short", normalizable: false, value: Constants.TEXTURETYPE_SHORT },
    { label: "unsigned short", normalizable: false, value: Constants.TEXTURETYPE_UNSIGNED_SHORT },
    { label: "signed int", normalizable: false, value: Constants.TEXTURETYPE_INT },
    { label: "unsigned int", normalizable: false, value: Constants.TEXTURETYPE_UNSIGNED_INTEGER },
    { label: "unsigned 4/4/4/4 short", normalizable: false, value: Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 },
    { label: "unsigned 5/5/5/1 short", normalizable: false, value: Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 },
    { label: "unsigned 5/6/5 short", normalizable: false, value: Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5 },
    { label: "unsigned 2/10/10/10 int", normalizable: false, value: Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV },
    { label: "unsigned 24/8 int", normalizable: false, value: Constants.TEXTURETYPE_UNSIGNED_INT_24_8 },
    { label: "unsigned 10f/11f/11f int", normalizable: false, value: Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV },
    { label: "unsigned 5/9/9/9 int", normalizable: false, value: Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV },
    { label: "32-bits with only 8-bit used (stencil)", normalizable: false, value: Constants.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV },
];

export function FindTextureType(type: number) {
    for (let i = 0; i < TextureType.length; ++i) {
        if (TextureType[i].value === type) {
            return TextureType[i];
        }
    }
    return null;
}
