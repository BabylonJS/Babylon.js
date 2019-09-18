import { Engine } from "./engine";
import { Constants } from './constants';

let EngineAsAny = Engine as any;

// Const statics

/** Defines that alpha blending is disabled */
EngineAsAny.ALPHA_DISABLE = Constants.ALPHA_DISABLE;
/** Defines that alpha blending to SRC ALPHA * SRC + DEST */
EngineAsAny.ALPHA_ADD = Constants.ALPHA_ADD;
/** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC ALPHA) * DEST */
EngineAsAny.ALPHA_COMBINE = Constants.ALPHA_COMBINE;
/** Defines that alpha blending to DEST - SRC * DEST */
EngineAsAny.ALPHA_SUBTRACT = Constants.ALPHA_SUBTRACT;
/** Defines that alpha blending to SRC * DEST */
EngineAsAny.ALPHA_MULTIPLY = Constants.ALPHA_MULTIPLY;
/** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC) * DEST */
EngineAsAny.ALPHA_MAXIMIZED = Constants.ALPHA_MAXIMIZED;
/** Defines that alpha blending to SRC + DEST */
EngineAsAny.ALPHA_ONEONE = Constants.ALPHA_ONEONE;
/** Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST */
EngineAsAny.ALPHA_PREMULTIPLIED = Constants.ALPHA_PREMULTIPLIED;
/**
 * Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST
 * Alpha will be set to (1 - SRC ALPHA) * DEST ALPHA
 */
EngineAsAny.ALPHA_PREMULTIPLIED_PORTERDUFF = Constants.ALPHA_PREMULTIPLIED_PORTERDUFF;
/** Defines that alpha blending to CST * SRC + (1 - CST) * DEST */
EngineAsAny.ALPHA_INTERPOLATE = Constants.ALPHA_INTERPOLATE;
/**
 * Defines that alpha blending to SRC + (1 - SRC) * DEST
 * Alpha will be set to SRC ALPHA + (1 - SRC ALPHA) * DEST ALPHA
 */
EngineAsAny.ALPHA_SCREENMODE = Constants.ALPHA_SCREENMODE;

/** Defines that the ressource is not delayed*/
EngineAsAny.DELAYLOADSTATE_NONE = Constants.DELAYLOADSTATE_NONE;
/** Defines that the ressource was successfully delay loaded */
EngineAsAny.DELAYLOADSTATE_LOADED = Constants.DELAYLOADSTATE_LOADED;
/** Defines that the ressource is currently delay loading */
EngineAsAny.DELAYLOADSTATE_LOADING = Constants.DELAYLOADSTATE_LOADING;
/** Defines that the ressource is delayed and has not started loading */
EngineAsAny.DELAYLOADSTATE_NOTLOADED = Constants.DELAYLOADSTATE_NOTLOADED;

// Depht or Stencil test Constants.
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn */
EngineAsAny.NEVER = Constants.NEVER;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn */
EngineAsAny.ALWAYS = Constants.ALWAYS;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value */
EngineAsAny.LESS = Constants.LESS;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value */
EngineAsAny.EQUAL = Constants.EQUAL;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value */
EngineAsAny.LEQUAL = Constants.LEQUAL;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value */
EngineAsAny.GREATER = Constants.GREATER;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value */
EngineAsAny.GEQUAL = Constants.GEQUAL;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value */
EngineAsAny.NOTEQUAL = Constants.NOTEQUAL;

// Stencil Actions Constants.
/** Passed to stencilOperation to specify that stencil value must be kept */
EngineAsAny.KEEP = Constants.KEEP;
/** Passed to stencilOperation to specify that stencil value must be replaced */
EngineAsAny.REPLACE = Constants.REPLACE;
/** Passed to stencilOperation to specify that stencil value must be incremented */
EngineAsAny.INCR = Constants.INCR;
/** Passed to stencilOperation to specify that stencil value must be decremented */
EngineAsAny.DECR = Constants.DECR;
/** Passed to stencilOperation to specify that stencil value must be inverted */
EngineAsAny.INVERT = Constants.INVERT;
/** Passed to stencilOperation to specify that stencil value must be incremented with wrapping */
EngineAsAny.INCR_WRAP = Constants.INCR_WRAP;
/** Passed to stencilOperation to specify that stencil value must be decremented with wrapping */
EngineAsAny.DECR_WRAP = Constants.DECR_WRAP;

/** Texture is not repeating outside of 0..1 UVs */
EngineAsAny.TEXTURE_CLAMP_ADDRESSMODE = Constants.TEXTURE_CLAMP_ADDRESSMODE;
/** Texture is repeating outside of 0..1 UVs */
EngineAsAny.TEXTURE_WRAP_ADDRESSMODE = Constants.TEXTURE_WRAP_ADDRESSMODE;
/** Texture is repeating and mirrored */
EngineAsAny.TEXTURE_MIRROR_ADDRESSMODE = Constants.TEXTURE_MIRROR_ADDRESSMODE;

/** ALPHA */
EngineAsAny.TEXTUREFORMAT_ALPHA = Constants.TEXTUREFORMAT_ALPHA;
/** LUMINANCE */
EngineAsAny.TEXTUREFORMAT_LUMINANCE = Constants.TEXTUREFORMAT_LUMINANCE;
/** LUMINANCE_ALPHA */
EngineAsAny.TEXTUREFORMAT_LUMINANCE_ALPHA = Constants.TEXTUREFORMAT_LUMINANCE_ALPHA;
/** RGB */
EngineAsAny.TEXTUREFORMAT_RGB = Constants.TEXTUREFORMAT_RGB;
/** RGBA */
EngineAsAny.TEXTUREFORMAT_RGBA = Constants.TEXTUREFORMAT_RGBA;
/** RED */
EngineAsAny.TEXTUREFORMAT_RED = Constants.TEXTUREFORMAT_RED;
/** RED (2nd reference) */
EngineAsAny.TEXTUREFORMAT_R = Constants.TEXTUREFORMAT_R;
/** RG */
EngineAsAny.TEXTUREFORMAT_RG = Constants.TEXTUREFORMAT_RG;
/** RED_INTEGER */
EngineAsAny.TEXTUREFORMAT_RED_INTEGER = Constants.TEXTUREFORMAT_RED_INTEGER;
/** RED_INTEGER (2nd reference) */
EngineAsAny.TEXTUREFORMAT_R_INTEGER = Constants.TEXTUREFORMAT_R_INTEGER;
/** RG_INTEGER */
EngineAsAny.TEXTUREFORMAT_RG_INTEGER = Constants.TEXTUREFORMAT_RG_INTEGER;
/** RGB_INTEGER */
EngineAsAny.TEXTUREFORMAT_RGB_INTEGER = Constants.TEXTUREFORMAT_RGB_INTEGER;
/** RGBA_INTEGER */
EngineAsAny.TEXTUREFORMAT_RGBA_INTEGER = Constants.TEXTUREFORMAT_RGBA_INTEGER;

/** UNSIGNED_BYTE */
EngineAsAny.TEXTURETYPE_UNSIGNED_BYTE = Constants.TEXTURETYPE_UNSIGNED_BYTE;
/** UNSIGNED_BYTE (2nd reference) */
EngineAsAny.TEXTURETYPE_UNSIGNED_INT = Constants.TEXTURETYPE_UNSIGNED_INT;
/** FLOAT */
EngineAsAny.TEXTURETYPE_FLOAT = Constants.TEXTURETYPE_FLOAT;
/** HALF_FLOAT */
EngineAsAny.TEXTURETYPE_HALF_FLOAT = Constants.TEXTURETYPE_HALF_FLOAT;
/** BYTE */
EngineAsAny.TEXTURETYPE_BYTE = Constants.TEXTURETYPE_BYTE;
/** SHORT */
EngineAsAny.TEXTURETYPE_SHORT = Constants.TEXTURETYPE_SHORT;
/** UNSIGNED_SHORT */
EngineAsAny.TEXTURETYPE_UNSIGNED_SHORT = Constants.TEXTURETYPE_UNSIGNED_SHORT;
/** INT */
EngineAsAny.TEXTURETYPE_INT = Constants.TEXTURETYPE_INT;
/** UNSIGNED_INT */
EngineAsAny.TEXTURETYPE_UNSIGNED_INTEGER = Constants.TEXTURETYPE_UNSIGNED_INTEGER;
/** UNSIGNED_SHORT_4_4_4_4 */
EngineAsAny.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 = Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4;
/** UNSIGNED_SHORT_5_5_5_1 */
EngineAsAny.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1;
/** UNSIGNED_SHORT_5_6_5 */
EngineAsAny.TEXTURETYPE_UNSIGNED_SHORT_5_6_5 = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5;
/** UNSIGNED_INT_2_10_10_10_REV */
EngineAsAny.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV = Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV;
/** UNSIGNED_INT_24_8 */
EngineAsAny.TEXTURETYPE_UNSIGNED_INT_24_8 = Constants.TEXTURETYPE_UNSIGNED_INT_24_8;
/** UNSIGNED_INT_10F_11F_11F_REV */
EngineAsAny.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV = Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV;
/** UNSIGNED_INT_5_9_9_9_REV */
EngineAsAny.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV = Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV;
/** FLOAT_32_UNSIGNED_INT_24_8_REV */
EngineAsAny.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV = Constants.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV;

/** nearest is mag = nearest and min = nearest and mip = linear */
EngineAsAny.TEXTURE_NEAREST_SAMPLINGMODE = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
/** Bilinear is mag = linear and min = linear and mip = nearest */
EngineAsAny.TEXTURE_BILINEAR_SAMPLINGMODE = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
/** Trilinear is mag = linear and min = linear and mip = linear */
EngineAsAny.TEXTURE_TRILINEAR_SAMPLINGMODE = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
/** nearest is mag = nearest and min = nearest and mip = linear */
EngineAsAny.TEXTURE_NEAREST_NEAREST_MIPLINEAR = Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR;
/** Bilinear is mag = linear and min = linear and mip = nearest */
EngineAsAny.TEXTURE_LINEAR_LINEAR_MIPNEAREST = Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST;
/** Trilinear is mag = linear and min = linear and mip = linear */
EngineAsAny.TEXTURE_LINEAR_LINEAR_MIPLINEAR = Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR;
/** mag = nearest and min = nearest and mip = nearest */
EngineAsAny.TEXTURE_NEAREST_NEAREST_MIPNEAREST = Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST;
/** mag = nearest and min = linear and mip = nearest */
EngineAsAny.TEXTURE_NEAREST_LINEAR_MIPNEAREST = Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST;
/** mag = nearest and min = linear and mip = linear */
EngineAsAny.TEXTURE_NEAREST_LINEAR_MIPLINEAR = Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR;
/** mag = nearest and min = linear and mip = none */
EngineAsAny.TEXTURE_NEAREST_LINEAR = Constants.TEXTURE_NEAREST_LINEAR;
/** mag = nearest and min = nearest and mip = none */
EngineAsAny.TEXTURE_NEAREST_NEAREST = Constants.TEXTURE_NEAREST_NEAREST;
/** mag = linear and min = nearest and mip = nearest */
EngineAsAny.TEXTURE_LINEAR_NEAREST_MIPNEAREST = Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST;
/** mag = linear and min = nearest and mip = linear */
EngineAsAny.TEXTURE_LINEAR_NEAREST_MIPLINEAR = Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR;
/** mag = linear and min = linear and mip = none */
EngineAsAny.TEXTURE_LINEAR_LINEAR = Constants.TEXTURE_LINEAR_LINEAR;
/** mag = linear and min = nearest and mip = none */
EngineAsAny.TEXTURE_LINEAR_NEAREST = Constants.TEXTURE_LINEAR_NEAREST;

/** Explicit coordinates mode */
EngineAsAny.TEXTURE_EXPLICIT_MODE = Constants.TEXTURE_EXPLICIT_MODE;
/** Spherical coordinates mode */
EngineAsAny.TEXTURE_SPHERICAL_MODE = Constants.TEXTURE_SPHERICAL_MODE;
/** Planar coordinates mode */
EngineAsAny.TEXTURE_PLANAR_MODE = Constants.TEXTURE_PLANAR_MODE;
/** Cubic coordinates mode */
EngineAsAny.TEXTURE_CUBIC_MODE = Constants.TEXTURE_CUBIC_MODE;
/** Projection coordinates mode */
EngineAsAny.TEXTURE_PROJECTION_MODE = Constants.TEXTURE_PROJECTION_MODE;
/** Skybox coordinates mode */
EngineAsAny.TEXTURE_SKYBOX_MODE = Constants.TEXTURE_SKYBOX_MODE;
/** Inverse Cubic coordinates mode */
EngineAsAny.TEXTURE_INVCUBIC_MODE = Constants.TEXTURE_INVCUBIC_MODE;
/** Equirectangular coordinates mode */
EngineAsAny.TEXTURE_EQUIRECTANGULAR_MODE = Constants.TEXTURE_EQUIRECTANGULAR_MODE;
/** Equirectangular Fixed coordinates mode */
EngineAsAny.TEXTURE_FIXED_EQUIRECTANGULAR_MODE = Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MODE;
/** Equirectangular Fixed Mirrored coordinates mode */
EngineAsAny.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE = Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE;

// Texture rescaling mode
/** Defines that texture rescaling will use a floor to find the closer power of 2 size */
EngineAsAny.SCALEMODE_FLOOR = Constants.SCALEMODE_FLOOR;
/** Defines that texture rescaling will look for the nearest power of 2 size */
EngineAsAny.SCALEMODE_NEAREST = Constants.SCALEMODE_NEAREST;
/** Defines that texture rescaling will use a ceil to find the closer power of 2 size */
EngineAsAny.SCALEMODE_CEILING = Constants.SCALEMODE_CEILING;