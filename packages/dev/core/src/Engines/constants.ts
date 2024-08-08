/* eslint-disable @typescript-eslint/naming-convention */
/* Defines the cross module used constants to avoid circular dependencies */

/** Sampler suffix when associated with a texture name */
export const AUTOSAMPLERSUFFIX = "Sampler";
/** Flag used to disable diagnostics for WebGPU */
export const DISABLEUA = "#define DISABLE_UNIFORMITY_ANALYSIS";
/** Defines that alpha blending is disabled */
export const ALPHA_DISABLE = 0;
/** Defines that alpha blending is SRC ALPHA * SRC + DEST */
export const ALPHA_ADD = 1;
/** Defines that alpha blending is SRC ALPHA * SRC + (1 - SRC ALPHA) * DEST */
export const ALPHA_COMBINE = 2;
/** Defines that alpha blending is DEST - SRC * DEST */
export const ALPHA_SUBTRACT = 3;
/** Defines that alpha blending is SRC * DEST */
export const ALPHA_MULTIPLY = 4;
/** Defines that alpha blending is SRC ALPHA * SRC + (1 - SRC) * DEST */
export const ALPHA_MAXIMIZED = 5;
/** Defines that alpha blending is SRC + DEST */
export const ALPHA_ONEONE = 6;
/** Defines that alpha blending is SRC + (1 - SRC ALPHA) * DEST */
export const ALPHA_PREMULTIPLIED = 7;
/**
 * Defines that alpha blending is SRC + (1 - SRC ALPHA) * DEST
 * Alpha will be set to (1 - SRC ALPHA) * DEST ALPHA
 */
export const ALPHA_PREMULTIPLIED_PORTERDUFF = 8;
/** Defines that alpha blending is CST * SRC + (1 - CST) * DEST */
export const ALPHA_INTERPOLATE = 9;
/**
 * Defines that alpha blending is SRC + (1 - SRC) * DEST
 * Alpha will be set to SRC ALPHA + (1 - SRC ALPHA) * DEST ALPHA
 */
export const ALPHA_SCREENMODE = 10;
/**
 * Defines that alpha blending is SRC + DST
 * Alpha will be set to SRC ALPHA + DST ALPHA
 */
export const ALPHA_ONEONE_ONEONE = 11;
/**
 * Defines that alpha blending is SRC * DST ALPHA + DST
 * Alpha will be set to 0
 */
export const ALPHA_ALPHATOCOLOR = 12;
/**
 * Defines that alpha blending is SRC * (1 - DST) + DST * (1 - SRC)
 */
export const ALPHA_REVERSEONEMINUS = 13;
/**
 * Defines that alpha blending is SRC + DST * (1 - SRC ALPHA)
 * Alpha will be set to SRC ALPHA + DST ALPHA * (1 - SRC ALPHA)
 */
export const ALPHA_SRC_DSTONEMINUSSRCALPHA = 14;
/**
 * Defines that alpha blending is SRC + DST
 * Alpha will be set to SRC ALPHA
 */
export const ALPHA_ONEONE_ONEZERO = 15;
/**
 * Defines that alpha blending is SRC * (1 - DST) + DST * (1 - SRC)
 * Alpha will be set to DST ALPHA
 */
export const ALPHA_EXCLUSION = 16;
/**
 * Defines that alpha blending is SRC * SRC ALPHA + DST * (1 - SRC ALPHA)
 * Alpha will be set to SRC ALPHA + (1 - SRC ALPHA) * DST ALPHA
 */
export const ALPHA_LAYER_ACCUMULATE = 17;

/** Defines that alpha blending equation a SUM */
export const ALPHA_EQUATION_ADD = 0;
/** Defines that alpha blending equation a SUBSTRACTION */
export const ALPHA_EQUATION_SUBSTRACT = 1;
/** Defines that alpha blending equation a REVERSE SUBSTRACTION */
export const ALPHA_EQUATION_REVERSE_SUBTRACT = 2;
/** Defines that alpha blending equation a MAX operation */
export const ALPHA_EQUATION_MAX = 3;
/** Defines that alpha blending equation a MIN operation */
export const ALPHA_EQUATION_MIN = 4;
/**
 * Defines that alpha blending equation a DARKEN operation:
 * It takes the min of the src and sums the alpha channels.
 */
export const ALPHA_EQUATION_DARKEN = 5;

/** Defines that the resource is not delayed*/
export const DELAYLOADSTATE_NONE = 0;
/** Defines that the resource was successfully delay loaded */
export const DELAYLOADSTATE_LOADED = 1;
/** Defines that the resource is currently delay loading */
export const DELAYLOADSTATE_LOADING = 2;
/** Defines that the resource is delayed and has not started loading */
export const DELAYLOADSTATE_NOTLOADED = 4;

// Depth or Stencil test Constants.
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn */
export const NEVER = 0x0200;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn */
export const ALWAYS = 0x0207;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value */
export const LESS = 0x0201;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value */
export const EQUAL = 0x0202;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value */
export const LEQUAL = 0x0203;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value */
export const GREATER = 0x0204;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value */
export const GEQUAL = 0x0206;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value */
export const NOTEQUAL = 0x0205;

// Stencil Actions Constants.
/** Passed to stencilOperation to specify that stencil value must be kept */
export const KEEP = 0x1e00;
/** Passed to stencilOperation to specify that stencil value must be zero */
export const ZERO = 0x0000;
/** Passed to stencilOperation to specify that stencil value must be replaced */
export const REPLACE = 0x1e01;
/** Passed to stencilOperation to specify that stencil value must be incremented */
export const INCR = 0x1e02;
/** Passed to stencilOperation to specify that stencil value must be decremented */
export const DECR = 0x1e03;
/** Passed to stencilOperation to specify that stencil value must be inverted */
export const INVERT = 0x150a;
/** Passed to stencilOperation to specify that stencil value must be incremented with wrapping */
export const INCR_WRAP = 0x8507;
/** Passed to stencilOperation to specify that stencil value must be decremented with wrapping */
export const DECR_WRAP = 0x8508;

/** Texture is not repeating outside of 0..1 UVs */
export const TEXTURE_CLAMP_ADDRESSMODE = 0;
/** Texture is repeating outside of 0..1 UVs */
export const TEXTURE_WRAP_ADDRESSMODE = 1;
/** Texture is repeating and mirrored */
export const TEXTURE_MIRROR_ADDRESSMODE = 2;

/** Flag to create a storage texture */
export const TEXTURE_CREATIONFLAG_STORAGE = 1;

/** Texture formats */
export const enum TextureFormat {
    /** ALPHA */
    ALPHA = 0,
    /** LUMINANCE */
    LUMINANCE = 1,
    /** LUMINANCE_ALPHA */
    LUMINANCE_ALPHA = 2,
    /** RGB */
    RGB = 4,
    /** RGBA */
    RGBA = 5,
    /** RED */
    RED = 6,
    /** RED (2nd reference) */
    R = 6,
    /** RG */
    RG = 7,
    /** RED_INTEGER */
    RED_INTEGER = 8,
    /** RED_INTEGER (2nd reference) */
    R_INTEGER = 8,
    /** RG_INTEGER */
    RG_INTEGER = 9,
    /** RGB_INTEGER */
    RGB_INTEGER = 10,
    /** RGBA_INTEGER */
    RGBA_INTEGER = 11,
    /** BGRA */
    BGRA = 12,
    /** Depth 24 bits + Stencil 8 bits */
    DEPTH24_STENCIL8 = 13,
    /** Depth 32 bits float */
    DEPTH32_FLOAT = 14,
    /** Depth 16 bits */
    DEPTH16 = 15,
    /** Depth 24 bits */
    DEPTH24 = 16,
    /** Depth 24 bits unorm + Stencil 8 bits */
    DEPTH24UNORM_STENCIL8 = 17,
    /** Depth 32 bits float + Stencil 8 bits */
    DEPTH32FLOAT_STENCIL8 = 18,
    /** Stencil 8 bits */
    STENCIL8 = 19,
    /** Compressed BC7 */
    COMPRESSED_RGBA_BPTC_UNORM = 36492,
    /** Compressed BC7 (SRGB) */
    COMPRESSED_SRGB_ALPHA_BPTC_UNORM = 36493,
    /** Compressed BC6 unsigned float */
    COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT = 36495,
    /** Compressed BC6 signed float */
    COMPRESSED_RGB_BPTC_SIGNED_FLOAT = 36494,
    /** Compressed BC3 */
    COMPRESSED_RGBA_S3TC_DXT5 = 33779,
    /** Compressed BC3 (SRGB) */
    COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT = 35919,
    /** Compressed BC2 */
    COMPRESSED_RGBA_S3TC_DXT3 = 33778,
    /** Compressed BC2 (SRGB) */
    COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT = 35918,
    /** Compressed BC1 (RGBA) */
    COMPRESSED_RGBA_S3TC_DXT1 = 33777,
    /** Compressed BC1 (RGB) */
    COMPRESSED_RGB_S3TC_DXT1 = 33776,
    /** Compressed BC1 (SRGB+A) */
    COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT = 35917,
    /** Compressed BC1 (SRGB) */
    COMPRESSED_SRGB_S3TC_DXT1_EXT = 35916,
    /** Compressed ASTC 4x4 */
    COMPRESSED_RGBA_ASTC_4x4 = 37808,
    /** Compressed ASTC 4x4 (SRGB) */
    COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR = 37840,
    /** Compressed ETC1 (RGB) */
    COMPRESSED_RGB_ETC1_WEBGL = 36196,
    /** Compressed ETC2 (RGB) */
    COMPRESSED_RGB8_ETC2 = 37492,
    /** Compressed ETC2 (SRGB) */
    COMPRESSED_SRGB8_ETC2 = 37493,
    /** Compressed ETC2 (RGB+A1) */
    COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 37494,
    /** Compressed ETC2 (SRGB+A1)*/
    COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 37495,
    /** Compressed ETC2 (RGB+A) */
    COMPRESSED_RGBA8_ETC2_EAC = 37496,
    /** Compressed ETC2 (SRGB+1) */
    COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = 37497,
    /** UNDEFINED */
    UNDEFINED = 0xffffffff,
}

/** ALPHA @deprecated use TextureFormat */
export const TEXTUREFORMAT_ALPHA = TextureFormat.ALPHA;
/** LUMINANCE @deprecated use TextureFormat */
export const TEXTUREFORMAT_LUMINANCE = TextureFormat.LUMINANCE;
/** LUMINANCE_ALPHA @deprecated use TextureFormat */
export const TEXTUREFORMAT_LUMINANCE_ALPHA = TextureFormat.LUMINANCE_ALPHA;
/** RGB @deprecated use TextureFormat */
export const TEXTUREFORMAT_RGB = TextureFormat.RGB;
/** RGBA @deprecated use TextureFormat */
export const TEXTUREFORMAT_RGBA = TextureFormat.RGBA;
/** RED @deprecated use TextureFormat */
export const TEXTUREFORMAT_RED = TextureFormat.RED;
/** RED (2nd reference) @deprecated use TextureFormat */
export const TEXTUREFORMAT_R = TextureFormat.R;
/** RG @deprecated use TextureFormat */
export const TEXTUREFORMAT_RG = TextureFormat.RG;
/** RED_INTEGER @deprecated use TextureFormat */
export const TEXTUREFORMAT_RED_INTEGER = TextureFormat.RED_INTEGER;
/** RED_INTEGER (2nd reference) @deprecated use TextureFormat */
export const TEXTUREFORMAT_R_INTEGER = TextureFormat.R_INTEGER;
/** RG_INTEGER @deprecated use TextureFormat */
export const TEXTUREFORMAT_RG_INTEGER = TextureFormat.RG_INTEGER;
/** RGB_INTEGER @deprecated use TextureFormat */
export const TEXTUREFORMAT_RGB_INTEGER = TextureFormat.RGB_INTEGER;
/** RGBA_INTEGER @deprecated use TextureFormat */
export const TEXTUREFORMAT_RGBA_INTEGER = TextureFormat.RGBA_INTEGER;
/** BGRA @deprecated use TextureFormat */
export const TEXTUREFORMAT_BGRA = TextureFormat.BGRA;

/** Depth 24 bits + Stencil 8 bits @deprecated use TextureFormat */
export const TEXTUREFORMAT_DEPTH24_STENCIL8 = TextureFormat.DEPTH24_STENCIL8;
/** Depth 32 bits float @deprecated use TextureFormat */
export const TEXTUREFORMAT_DEPTH32_FLOAT = TextureFormat.DEPTH32_FLOAT;
/** Depth 16 bits @deprecated use TextureFormat */
export const TEXTUREFORMAT_DEPTH16 = TextureFormat.DEPTH16;
/** Depth 24 bits @deprecated use TextureFormat */
export const TEXTUREFORMAT_DEPTH24 = TextureFormat.DEPTH24;
/** Depth 24 bits unorm + Stencil 8 bits @deprecated use TextureFormat */
export const TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 = TextureFormat.DEPTH24UNORM_STENCIL8;
/** Depth 32 bits float + Stencil 8 bits @deprecated use TextureFormat */
export const TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8 = TextureFormat.DEPTH32FLOAT_STENCIL8;
/** Stencil 8 bits @deprecated use TextureFormat */
export const TEXTUREFORMAT_STENCIL8 = TextureFormat.STENCIL8;
/** UNDEFINED @deprecated use TextureFormat */
export const TEXTUREFORMAT_UNDEFINED = TextureFormat.UNDEFINED;

/** Compressed BC7 @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM = TextureFormat.COMPRESSED_RGBA_BPTC_UNORM;
/** Compressed BC7 (SRGB) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_BPTC_UNORM = TextureFormat.COMPRESSED_SRGB_ALPHA_BPTC_UNORM;
/** Compressed BC6 unsigned float @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT = TextureFormat.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT;
/** Compressed BC6 signed float @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT = TextureFormat.COMPRESSED_RGB_BPTC_SIGNED_FLOAT;
/** Compressed BC3 @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5 = TextureFormat.COMPRESSED_RGBA_S3TC_DXT5;
/** Compressed BC3 (SRGB) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT = TextureFormat.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
/** Compressed BC2 @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3 = TextureFormat.COMPRESSED_RGBA_S3TC_DXT3;
/** Compressed BC2 (SRGB) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT = TextureFormat.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;
/** Compressed BC1 (RGBA) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1 = TextureFormat.COMPRESSED_RGBA_S3TC_DXT1;
/** Compressed BC1 (RGB) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1 = TextureFormat.COMPRESSED_RGB_S3TC_DXT1;
/** Compressed BC1 (SRGB+A) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT = TextureFormat.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
/** Compressed BC1 (SRGB) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_SRGB_S3TC_DXT1_EXT = TextureFormat.COMPRESSED_SRGB_S3TC_DXT1_EXT;
/** Compressed ASTC 4x4 @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4 = TextureFormat.COMPRESSED_RGBA_ASTC_4x4;
/** Compressed ASTC 4x4 (SRGB) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR = TextureFormat.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR;
/** Compressed ETC1 (RGB) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL = TextureFormat.COMPRESSED_RGB_ETC1_WEBGL;
/** Compressed ETC2 (RGB) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGB8_ETC2 = TextureFormat.COMPRESSED_RGB8_ETC2;
/** Compressed ETC2 (SRGB) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_SRGB8_ETC2 = TextureFormat.COMPRESSED_SRGB8_ETC2;
/** Compressed ETC2 (RGB+A1) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 = TextureFormat.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2;
/** Compressed ETC2 (SRGB+A1) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = TextureFormat.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2;
/** Compressed ETC2 (RGB+A) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC = TextureFormat.COMPRESSED_RGBA8_ETC2_EAC;
/** Compressed ETC2 (SRGB+1) @deprecated use TextureFormat */
export const TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = TextureFormat.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC;

export const enum TextureType {
    /** UNSIGNED_BYTE */
    UNSIGNED_BYTE = 0,
    /** UNSIGNED_BYTE (2nd reference) */
    UNSIGNED_INT = 0,
    /** FLOAT */
    FLOAT = 1,
    /** HALF_FLOAT */
    HALF_FLOAT = 2,
    /** BYTE */
    BYTE = 3,
    /** SHORT */
    SHORT = 4,
    /** UNSIGNED_SHORT */
    UNSIGNED_SHORT = 5,
    /** INT */
    INT = 6,
    /** UNSIGNED_INT */
    UNSIGNED_INTEGER = 7,
    /** UNSIGNED_SHORT_4_4_4_4 */
    UNSIGNED_SHORT_4_4_4_4 = 8,
    /** UNSIGNED_SHORT_5_5_5_1 */
    UNSIGNED_SHORT_5_5_5_1 = 9,
    /** UNSIGNED_SHORT_5_6_5 */
    UNSIGNED_SHORT_5_6_5 = 10,
    /** UNSIGNED_INT_2_10_10_10_REV */
    UNSIGNED_INT_2_10_10_10_REV = 11,
    /** UNSIGNED_INT_24_8 */
    UNSIGNED_INT_24_8 = 12,
    /** UNSIGNED_INT_10F_11F_11F_REV */
    UNSIGNED_INT_10F_11F_11F_REV = 13,
    /** UNSIGNED_INT_5_9_9_9_REV */
    UNSIGNED_INT_5_9_9_9_REV = 14,
    /** FLOAT_32_UNSIGNED_INT_24_8_REV */
    FLOAT_32_UNSIGNED_INT_24_8_REV = 15,
    /** UNDEFINED */
    UNDEFINED = 16,
}

/** UNSIGNED_BYTE @deprecated use TextureType */
export const TEXTURETYPE_UNSIGNED_BYTE = TextureType.UNSIGNED_BYTE;
/** UNSIGNED_BYTE (2nd reference) @deprecated use TextureType */
export const TEXTURETYPE_UNSIGNED_INT = TextureType.UNSIGNED_INT;
/** FLOAT @deprecated use TextureType */
export const TEXTURETYPE_FLOAT = TextureType.FLOAT;
/** HALF_FLOAT @deprecated use TextureType */
export const TEXTURETYPE_HALF_FLOAT = TextureType.HALF_FLOAT;
/** BYTE @deprecated use TextureType */
export const TEXTURETYPE_BYTE = TextureType.BYTE;
/** SHORT @deprecated use TextureType */
export const TEXTURETYPE_SHORT = TextureType.SHORT;
/** UNSIGNED_SHORT @deprecated use TextureType */
export const TEXTURETYPE_UNSIGNED_SHORT = TextureType.UNSIGNED_SHORT;
/** INT @deprecated use TextureType */
export const TEXTURETYPE_INT = TextureType.INT;
/** UNSIGNED_INT @deprecated use TextureType */
export const TEXTURETYPE_UNSIGNED_INTEGER = TextureType.UNSIGNED_INTEGER;
/** UNSIGNED_SHORT_4_4_4_4 @deprecated use TextureType */
export const TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 = TextureType.UNSIGNED_SHORT_4_4_4_4;
/** UNSIGNED_SHORT_5_5_5_1 @deprecated use TextureType */
export const TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 = TextureType.UNSIGNED_SHORT_5_5_5_1;
/** UNSIGNED_SHORT_5_6_5 @deprecated use TextureType */
export const TEXTURETYPE_UNSIGNED_SHORT_5_6_5 = TextureType.UNSIGNED_SHORT_5_6_5;
/** UNSIGNED_INT_2_10_10_10_REV @deprecated use TextureType */
export const TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV = TextureType.UNSIGNED_INT_2_10_10_10_REV;
/** UNSIGNED_INT_24_8 @deprecated use TextureType */
export const TEXTURETYPE_UNSIGNED_INT_24_8 = TextureType.UNSIGNED_INT_24_8;
/** UNSIGNED_INT_10F_11F_11F_REV @deprecated use TextureType */
export const TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV = TextureType.UNSIGNED_INT_10F_11F_11F_REV;
/** UNSIGNED_INT_5_9_9_9_REV @deprecated use TextureType */
export const TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV = TextureType.UNSIGNED_INT_5_9_9_9_REV;
/** FLOAT_32_UNSIGNED_INT_24_8_REV @deprecated use TextureType */
export const TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV = TextureType.FLOAT_32_UNSIGNED_INT_24_8_REV;
/** UNDEFINED @deprecated use TextureType */
export const TEXTURETYPE_UNDEFINED = TextureType.UNDEFINED;

/** 2D Texture target*/
export const TEXTURE_2D = 3553;
/** 2D Array Texture target */
export const TEXTURE_2D_ARRAY = 35866;
/** Cube Map Texture target */
export const TEXTURE_CUBE_MAP = 34067;
/** Cube Map Array Texture target */
export const TEXTURE_CUBE_MAP_ARRAY = 0xdeadbeef;
/** 3D Texture target */
export const TEXTURE_3D = 32879;

/** nearest is mag = nearest and min = nearest and no mip */
export const TEXTURE_NEAREST_SAMPLINGMODE = 1;
/** mag = nearest and min = nearest and mip = none */
export const TEXTURE_NEAREST_NEAREST = 1;

/** Bilinear is mag = linear and min = linear and no mip */
export const TEXTURE_BILINEAR_SAMPLINGMODE = 2;
/** mag = linear and min = linear and mip = none */
export const TEXTURE_LINEAR_LINEAR = 2;

/** Trilinear is mag = linear and min = linear and mip = linear */
export const TEXTURE_TRILINEAR_SAMPLINGMODE = 3;
/** Trilinear is mag = linear and min = linear and mip = linear */
export const TEXTURE_LINEAR_LINEAR_MIPLINEAR = 3;

/** mag = nearest and min = nearest and mip = nearest */
export const TEXTURE_NEAREST_NEAREST_MIPNEAREST = 4;
/** mag = nearest and min = linear and mip = nearest */
export const TEXTURE_NEAREST_LINEAR_MIPNEAREST = 5;
/** mag = nearest and min = linear and mip = linear */
export const TEXTURE_NEAREST_LINEAR_MIPLINEAR = 6;
/** mag = nearest and min = linear and mip = none */
export const TEXTURE_NEAREST_LINEAR = 7;
/** nearest is mag = nearest and min = nearest and mip = linear */
export const TEXTURE_NEAREST_NEAREST_MIPLINEAR = 8;
/** mag = linear and min = nearest and mip = nearest */
export const TEXTURE_LINEAR_NEAREST_MIPNEAREST = 9;
/** mag = linear and min = nearest and mip = linear */
export const TEXTURE_LINEAR_NEAREST_MIPLINEAR = 10;
/** Bilinear is mag = linear and min = linear and mip = nearest */
export const TEXTURE_LINEAR_LINEAR_MIPNEAREST = 11;
/** mag = linear and min = nearest and mip = none */
export const TEXTURE_LINEAR_NEAREST = 12;

/** Explicit coordinates mode */
export const TEXTURE_EXPLICIT_MODE = 0;
/** Spherical coordinates mode */
export const TEXTURE_SPHERICAL_MODE = 1;
/** Planar coordinates mode */
export const TEXTURE_PLANAR_MODE = 2;
/** Cubic coordinates mode */
export const TEXTURE_CUBIC_MODE = 3;
/** Projection coordinates mode */
export const TEXTURE_PROJECTION_MODE = 4;
/** Skybox coordinates mode */
export const TEXTURE_SKYBOX_MODE = 5;
/** Inverse Cubic coordinates mode */
export const TEXTURE_INVCUBIC_MODE = 6;
/** Equirectangular coordinates mode */
export const TEXTURE_EQUIRECTANGULAR_MODE = 7;
/** Equirectangular Fixed coordinates mode */
export const TEXTURE_FIXED_EQUIRECTANGULAR_MODE = 8;
/** Equirectangular Fixed Mirrored coordinates mode */
export const TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE = 9;

/** Offline (baking) quality for texture filtering */
export const TEXTURE_FILTERING_QUALITY_OFFLINE = 4096;

/** High quality for texture filtering */
export const TEXTURE_FILTERING_QUALITY_HIGH = 64;

/** Medium quality for texture filtering */
export const TEXTURE_FILTERING_QUALITY_MEDIUM = 16;

/** Low quality for texture filtering */
export const TEXTURE_FILTERING_QUALITY_LOW = 8;

/** Texture rescaling mode */
export const enum ScaleMode {
    /** Defines that texture rescaling will use a floor to find the closer power of 2 size */
    FLOOR = 1,
    /** Defines that texture rescaling will look for the nearest power of 2 size */
    NEAREST = 2,
    /** Defines that texture rescaling will use a ceil to find the closer power of 2 size */
    CEILING = 3,
}

/** @deprecated use ScaleMode */
export const SCALEMODE_FLOOR = ScaleMode.FLOOR;
/** @deprecated use ScaleMode */
export const SCALEMODE_NEAREST = ScaleMode.NEAREST;
/** @deprecated use ScaleMode */
export const SCALEMODE_CEILING = ScaleMode.CEILING;

/**
 * The dirty texture flag value
 */
export const MATERIAL_TextureDirtyFlag = 1;
/**
 * The dirty light flag value
 */
export const MATERIAL_LightDirtyFlag = 2;
/**
 * The dirty fresnel flag value
 */
export const MATERIAL_FresnelDirtyFlag = 4;
/**
 * The dirty attribute flag value
 */
export const MATERIAL_AttributesDirtyFlag = 8;
/**
 * The dirty misc flag value
 */
export const MATERIAL_MiscDirtyFlag = 16;
/**
 * The dirty prepass flag value
 */
export const MATERIAL_PrePassDirtyFlag = 32;
/**
 * The all dirty flag value
 */
export const MATERIAL_AllDirtyFlag = 63;

/**
 * Returns the triangle fill mode
 */
export const MATERIAL_TriangleFillMode = 0;
/**
 * Returns the wireframe mode
 */
export const MATERIAL_WireFrameFillMode = 1;
/**
 * Returns the point fill mode
 */
export const MATERIAL_PointFillMode = 2;
/**
 * Returns the point list draw mode
 */
export const MATERIAL_PointListDrawMode = 3;
/**
 * Returns the line list draw mode
 */
export const MATERIAL_LineListDrawMode = 4;
/**
 * Returns the line loop draw mode
 */
export const MATERIAL_LineLoopDrawMode = 5;
/**
 * Returns the line strip draw mode
 */
export const MATERIAL_LineStripDrawMode = 6;

/**
 * Returns the triangle strip draw mode
 */
export const MATERIAL_TriangleStripDrawMode = 7;
/**
 * Returns the triangle fan draw mode
 */
export const MATERIAL_TriangleFanDrawMode = 8;

/**
 * Stores the clock-wise side orientation
 */
export const MATERIAL_ClockWiseSideOrientation = 0;
/**
 * Stores the counter clock-wise side orientation
 */
export const MATERIAL_CounterClockWiseSideOrientation = 1;

/**
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const enum ActionTrigger {
    /** Nothing */
    Nothing = 0,
    /** On pick */
    OnPick = 1,
    /** On left pick */
    OnLeftPick = 2,
    /** On right pick */
    OnRightPick = 3,
    /** On center pick */
    OnCenterPick = 4,
    /** On pick down */
    OnPickDown = 5,
    /** On double pick */
    OnDoublePick = 6,
    /** On pick up */
    OnPickUp = 7,
    /** On pick out. This trigger will only be raised if you also declared a OnPickDown */
    OnPickOut = 16,
    /** On long press */
    OnLongPress = 8,
    /** On pointer over */
    OnPointerOver = 9,
    /** On pointer out */
    OnPointerOut = 10,
    /** On every frame */
    OnEveryFrame = 11,
    /** On intersection enter */
    OnIntersectionEnter = 12,
    /** On intersection exit */
    OnIntersectionExit = 13,
    /** On key down */
    OnKeyDown = 14,
    /** On key up */
    OnKeyUp = 15,
}

/** @deprecated use ActionTrigger */
export const ACTION_NothingTrigger = ActionTrigger.Nothing;
/** @deprecated use ActionTrigger */
export const ACTION_OnPickTrigger = ActionTrigger.OnPick;
/** @deprecated use ActionTrigger */
export const ACTION_OnLeftPickTrigger = ActionTrigger.OnLeftPick;
/** @deprecated use ActionTrigger */
export const ACTION_OnRightPickTrigger = ActionTrigger.OnRightPick;
/** @deprecated use ActionTrigger */
export const ACTION_OnCenterPickTrigger = ActionTrigger.OnCenterPick;
/** @deprecated use ActionTrigger */
export const ACTION_OnPickDownTrigger = ActionTrigger.OnPickDown;
/** @deprecated use ActionTrigger */
export const ACTION_OnDoublePickTrigger = ActionTrigger.OnDoublePick;
/** @deprecated use ActionTrigger */
export const ACTION_OnPickUpTrigger = ActionTrigger.OnPickUp;
/** @deprecated use ActionTrigger */
export const ACTION_OnPickOutTrigger = ActionTrigger.OnPickOut;
/** @deprecated use ActionTrigger */
export const ACTION_OnLongPressTrigger = ActionTrigger.OnLongPress;
/** @deprecated use ActionTrigger */
export const ACTION_OnPointerOverTrigger = ActionTrigger.OnPointerOver;
/** @deprecated use ActionTrigger */
export const ACTION_OnPointerOutTrigger = ActionTrigger.OnPointerOut;
/** @deprecated use ActionTrigger */
export const ACTION_OnEveryFrameTrigger = ActionTrigger.OnEveryFrame;
/** @deprecated use ActionTrigger */
export const ACTION_OnIntersectionEnterTrigger = ActionTrigger.OnIntersectionEnter;
/** @deprecated use ActionTrigger */
export const ACTION_OnIntersectionExitTrigger = ActionTrigger.OnIntersectionExit;
/** @deprecated use ActionTrigger */
export const ACTION_OnKeyDownTrigger = ActionTrigger.OnKeyDown;
/** @deprecated use ActionTrigger */
export const ACTION_OnKeyUpTrigger = ActionTrigger.OnKeyUp;

export const enum ParticlesBillboardMode {
    /**
     * Billboard mode will only apply to Y axis
     */
    Y = 2,
    /**
     * Billboard mode will apply to all axes
     */
    ALL = 7,
    /**
     * Special billboard mode where the particle will be biilboard to the camera but rotated to align with direction
     */
    STRETCHED = 8,
    /**
     * Special billboard mode where the particle will be billboard to the camera but only around the axis of the direction of particle emission
     */
    STRETCHED_LOCAL = 9,
}

/** @deprecated use ParticlesBillboardMode */
export const PARTICLES_BILLBOARDMODE_Y = ParticlesBillboardMode.Y;
/** @deprecated use ParticlesBillboardMode */
export const PARTICLES_BILLBOARDMODE_ALL = ParticlesBillboardMode.ALL;
/** @deprecated use ParticlesBillboardMode */
export const PARTICLES_BILLBOARDMODE_STRETCHED = ParticlesBillboardMode.STRETCHED;
/** @deprecated use ParticlesBillboardMode */
export const PARTICLES_BILLBOARDMODE_STRETCHED_LOCAL = ParticlesBillboardMode.STRETCHED_LOCAL;

export const enum CullingStrategy {
    /** Default culling strategy : this is an exclusion test and it's the more accurate.
     *  Test order :
     *  Is the bounding sphere outside the frustum ?
     *  If not, are the bounding box vertices outside the frustum ?
     *  It not, then the cullable object is in the frustum.
     */
    STANDARD = 0,
    /** Culling strategy : Bounding Sphere Only.
     *  This is an exclusion test. It's faster than the standard strategy because the bounding box is not tested.
     *  It's also less accurate than the standard because some not visible objects can still be selected.
     *  Test : is the bounding sphere outside the frustum ?
     *  If not, then the cullable object is in the frustum.
     */
    BOUNDINGSPHERE_ONLY = 1,
    /** Culling strategy : Optimistic Inclusion.
     *  This in an inclusion test first, then the standard exclusion test.
     *  This can be faster when a cullable object is expected to be almost always in the camera frustum.
     *  This could also be a little slower than the standard test when the tested object center is not the frustum but one of its bounding box vertex is still inside.
     *  Anyway, it's as accurate as the standard strategy.
     *  Test :
     *  Is the cullable object bounding sphere center in the frustum ?
     *  If not, apply the default culling strategy.
     */
    OPTIMISTIC_INCLUSION = 2,
    /** Culling strategy : Optimistic Inclusion then Bounding Sphere Only.
     *  This in an inclusion test first, then the bounding sphere only exclusion test.
     *  This can be the fastest test when a cullable object is expected to be almost always in the camera frustum.
     *  This could also be a little slower than the BoundingSphereOnly strategy when the tested object center is not in the frustum but its bounding sphere still intersects it.
     *  It's less accurate than the standard strategy and as accurate as the BoundingSphereOnly strategy.
     *  Test :
     *  Is the cullable object bounding sphere center in the frustum ?
     *  If not, apply the Bounding Sphere Only strategy. No Bounding Box is tested here.
     */
    OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY = 3,
}

/** @deprecated use CullingStrategy */
export const MESHES_CULLINGSTRATEGY_STANDARD = CullingStrategy.STANDARD;
/** @deprecated use CullingStrategy */
export const MESHES_CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY = CullingStrategy.BOUNDINGSPHERE_ONLY;
/** @deprecated use CullingStrategy */
export const MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION = CullingStrategy.OPTIMISTIC_INCLUSION;
/** @deprecated use CullingStrategy */
export const MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY = CullingStrategy.OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY;

export const enum SceneLoaderLogging {
    /** No logging while loading */
    NONE = 0,
    /** Minimal logging while loading */
    MINIMAL = 1,
    /** Summary logging while loading */
    SUMMARY = 2,
    /** Detailed logging while loading */
    DETAILED = 3,
}

/** @deprecated use SceneLoaderLogging */
export const SCENELOADER_NO_LOGGING = SceneLoaderLogging.NONE;
/** @deprecated use SceneLoaderLogging */
export const SCENELOADER_MINIMAL_LOGGING = SceneLoaderLogging.MINIMAL;
/** @deprecated use SceneLoaderLogging */
export const SCENELOADER_SUMMARY_LOGGING = SceneLoaderLogging.SUMMARY;
/** @deprecated use SceneLoaderLogging */
export const SCENELOADER_DETAILED_LOGGING = SceneLoaderLogging.DETAILED;

/**
 * Constant used to retrieve the irradiance texture index in the textures array in the prepass
 * using getIndex(Constants.PREPASS_IRRADIANCE_TEXTURE_TYPE)
 */
export const PREPASS_IRRADIANCE_TEXTURE_TYPE = 0;
/**
 * Constant used to retrieve the position texture index in the textures array in the prepass
 * using getIndex(Constants.PREPASS_POSITION_TEXTURE_INDEX)
 */
export const PREPASS_POSITION_TEXTURE_TYPE = 1;
/**
 * Constant used to retrieve the velocity texture index in the textures array in the prepass
 * using getIndex(Constants.PREPASS_VELOCITY_TEXTURE_INDEX)
 */
export const PREPASS_VELOCITY_TEXTURE_TYPE = 2;
/**
 * Constant used to retrieve the reflectivity texture index in the textures array in the prepass
 * using the getIndex(Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE)
 */
export const PREPASS_REFLECTIVITY_TEXTURE_TYPE = 3;
/**
 * Constant used to retrieve the lit color texture index in the textures array in the prepass
 * using the getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE)
 */
export const PREPASS_COLOR_TEXTURE_TYPE = 4;
/**
 * Constant used to retrieve depth index in the textures array in the prepass
 * using the getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE)
 */
export const PREPASS_DEPTH_TEXTURE_TYPE = 5;
/**
 * Constant used to retrieve normal index in the textures array in the prepass
 * using the getIndex(Constants.PREPASS_NORMAL_TEXTURE_TYPE)
 */
export const PREPASS_NORMAL_TEXTURE_TYPE = 6;
/**
 * Constant used to retrieve albedo index in the textures array in the prepass
 * using the getIndex(Constants.PREPASS_ALBEDO_SQRT_TEXTURE_TYPE)
 */
export const PREPASS_ALBEDO_SQRT_TEXTURE_TYPE = 7;

/** Flag to create a readable buffer (the buffer can be the source of a copy) */
export const BUFFER_CREATIONFLAG_READ = 1;
/** Flag to create a writable buffer (the buffer can be the destination of a copy) */
export const BUFFER_CREATIONFLAG_WRITE = 2;
/** Flag to create a readable and writable buffer */
export const BUFFER_CREATIONFLAG_READWRITE = 3;
/** Flag to create a buffer suitable to be used as a uniform buffer */
export const BUFFER_CREATIONFLAG_UNIFORM = 4;
/** Flag to create a buffer suitable to be used as a vertex buffer */
export const BUFFER_CREATIONFLAG_VERTEX = 8;
/** Flag to create a buffer suitable to be used as an index buffer */
export const BUFFER_CREATIONFLAG_INDEX = 16;
/** Flag to create a buffer suitable to be used as a storage buffer */
export const BUFFER_CREATIONFLAG_STORAGE = 32;
/** Flag to create a buffer suitable to be used for indirect calls, such as `dispatchIndirect` */
export const BUFFER_CREATIONFLAG_INDIRECT = 64;

/**
 * Prefixes used by the engine for sub mesh draw wrappers
 */

/** @internal */
export const RENDERPASS_MAIN = 0;

/**
 * Constant used as key code for Alt key
 */
export const INPUT_ALT_KEY = 18;

/**
 * Constant used as key code for Ctrl key
 */
export const INPUT_CTRL_KEY = 17;

/**
 * Constant used as key code for Meta key (Left Win, Left Cmd)
 */
export const INPUT_META_KEY1 = 91;

/**
 * Constant used as key code for Meta key (Right Win)
 */
export const INPUT_META_KEY2 = 92;

/**
 * Constant used as key code for Meta key (Right Win, Right Cmd)
 */
export const INPUT_META_KEY3 = 93;

/**
 * Constant used as key code for Shift key
 */
export const INPUT_SHIFT_KEY = 16;

/** Standard snapshot rendering. In this mode, some form of dynamic behavior is possible (for eg, uniform buffers are still updated) */
export const SNAPSHOTRENDERING_STANDARD = 0;

/** Fast snapshot rendering. In this mode, everything is static and only some limited form of dynamic behaviour is possible */
export const SNAPSHOTRENDERING_FAST = 1;

/**
 * This is the default projection mode used by the cameras.
 * It helps recreating a feeling of perspective and better appreciate depth.
 * This is the best way to simulate real life cameras.
 */
export const PERSPECTIVE_CAMERA = 0;
/**
 * This helps creating camera with an orthographic mode.
 * Orthographic is commonly used in engineering as a means to produce object specifications that communicate dimensions unambiguously, each line of 1 unit length (cm, meter..whatever) will appear to have the same length everywhere on the drawing. This allows the drafter to dimension only a subset of lines and let the reader know that other lines of that length on the drawing are also that length in reality. Every parallel line in the drawing is also parallel in the object.
 */
export const ORTHOGRAPHIC_CAMERA = 1;

/**
 * This is the default FOV mode for perspective cameras.
 * This setting aligns the upper and lower bounds of the viewport to the upper and lower bounds of the camera frustum.
 */
export const FOVMODE_VERTICAL_FIXED = 0;
/**
 * This setting aligns the left and right bounds of the viewport to the left and right bounds of the camera frustum.
 */
export const FOVMODE_HORIZONTAL_FIXED = 1;

/**
 * This specifies there is no need for a camera rig.
 * Basically only one eye is rendered corresponding to the camera.
 */
export const RIG_MODE_NONE = 0;
/**
 * Simulates a camera Rig with one blue eye and one red eye.
 * This can be use with 3d blue and red glasses.
 */
export const RIG_MODE_STEREOSCOPIC_ANAGLYPH = 10;
/**
 * Defines that both eyes of the camera will be rendered side by side with a parallel target.
 */
export const RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL = 11;
/**
 * Defines that both eyes of the camera will be rendered side by side with a none parallel target.
 */
export const RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED = 12;
/**
 * Defines that both eyes of the camera will be rendered over under each other.
 */
export const RIG_MODE_STEREOSCOPIC_OVERUNDER = 13;
/**
 * Defines that both eyes of the camera will be rendered on successive lines interlaced for passive 3d monitors.
 */
export const RIG_MODE_STEREOSCOPIC_INTERLACED = 14;
/**
 * Defines that both eyes of the camera should be renderered in a VR mode (carbox).
 */
export const RIG_MODE_VR = 20;
/**
 * Custom rig mode allowing rig cameras to be populated manually with any number of cameras
 */
export const RIG_MODE_CUSTOM = 22;

/**
 * Maximum number of uv sets supported
 */
export const MAX_SUPPORTED_UV_SETS = 6;

/**
 * GL constants
 */
/** Alpha blend equation: ADD */
export const GL_ALPHA_EQUATION_ADD = 0x8006;
/** Alpha equation: MIN */
export const GL_ALPHA_EQUATION_MIN = 0x8007;
/** Alpha equation: MAX */
export const GL_ALPHA_EQUATION_MAX = 0x8008;
/** Alpha equation: SUBTRACT */
export const GL_ALPHA_EQUATION_SUBTRACT = 0x800a;
/** Alpha equation: REVERSE_SUBTRACT */
export const GL_ALPHA_EQUATION_REVERSE_SUBTRACT = 0x800b;

/** Alpha blend function: SRC */
export const GL_ALPHA_FUNCTION_SRC = 0x0300;
/** Alpha blend function: ONE_MINUS_SRC */
export const GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR = 0x0301;
/** Alpha blend function: SRC_ALPHA */
export const GL_ALPHA_FUNCTION_SRC_ALPHA = 0x0302;
/** Alpha blend function: ONE_MINUS_SRC_ALPHA */
export const GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA = 0x0303;
/** Alpha blend function: DST_ALPHA */
export const GL_ALPHA_FUNCTION_DST_ALPHA = 0x0304;
/** Alpha blend function: ONE_MINUS_DST_ALPHA */
export const GL_ALPHA_FUNCTION_ONE_MINUS_DST_ALPHA = 0x0305;
/** Alpha blend function: ONE_MINUS_DST */
export const GL_ALPHA_FUNCTION_DST_COLOR = 0x0306;
/** Alpha blend function: ONE_MINUS_DST */
export const GL_ALPHA_FUNCTION_ONE_MINUS_DST_COLOR = 0x0307;
/** Alpha blend function: SRC_ALPHA_SATURATED */
export const GL_ALPHA_FUNCTION_SRC_ALPHA_SATURATED = 0x0308;
/** Alpha blend function: CONSTANT */
export const GL_ALPHA_FUNCTION_CONSTANT_COLOR = 0x8001;
/** Alpha blend function: ONE_MINUS_CONSTANT */
export const GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_COLOR = 0x8002;
/** Alpha blend function: CONSTANT_ALPHA */
export const GL_ALPHA_FUNCTION_CONSTANT_ALPHA = 0x8003;
/** Alpha blend function: ONE_MINUS_CONSTANT_ALPHA */
export const GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_ALPHA = 0x8004;

/** URL to the snippet server. Points to the public snippet server by default */
export const SnippetUrl = "https://snippet.babylonjs.com";

/** The fog is deactivated */
export const FOGMODE_NONE = 0;
/** The fog density is following an exponential function */
export const FOGMODE_EXP = 1;
/** The fog density is following an exponential function faster than FOGMODE_EXP */
export const FOGMODE_EXP2 = 2;
/** The fog density is following a linear function. */
export const FOGMODE_LINEAR = 3;

/**
 * The byte type.
 */
export const BYTE = 5120;

/**
 * The unsigned byte type.
 */
export const UNSIGNED_BYTE = 5121;

/**
 * The short type.
 */
export const SHORT = 5122;

/**
 * The unsigned short type.
 */
export const UNSIGNED_SHORT = 5123;

/**
 * The integer type.
 */
export const INT = 5124;

/**
 * The unsigned integer type.
 */
export const UNSIGNED_INT = 5125;

/**
 * The float type.
 */
export const FLOAT = 5126;

/**
 * Positions
 */
export const PositionKind = "position";
/**
 * Normals
 */
export const NormalKind = "normal";
/**
 * Tangents
 */
export const TangentKind = "tangent";
/**
 * Texture coordinates
 */
export const UVKind = "uv";
/**
 * Texture coordinates 2
 */
export const UV2Kind = "uv2";
/**
 * Texture coordinates 3
 */
export const UV3Kind = "uv3";
/**
 * Texture coordinates 4
 */
export const UV4Kind = "uv4";
/**
 * Texture coordinates 5
 */
export const UV5Kind = "uv5";
/**
 * Texture coordinates 6
 */
export const UV6Kind = "uv6";
/**
 * Colors
 */
export const ColorKind = "color";
/**
 * Instance Colors
 */
export const ColorInstanceKind = "instanceColor";
/**
 * Matrix indices (for bones)
 */
export const MatricesIndicesKind = "matricesIndices";
/**
 * Matrix weights (for bones)
 */
export const MatricesWeightsKind = "matricesWeights";
/**
 * Additional matrix indices (for bones)
 */
export const MatricesIndicesExtraKind = "matricesIndicesExtra";
/**
 * Additional matrix weights (for bones)
 */
export const MatricesWeightsExtraKind = "matricesWeightsExtra";
