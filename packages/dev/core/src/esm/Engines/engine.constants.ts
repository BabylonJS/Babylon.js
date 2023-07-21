/* eslint-disable @typescript-eslint/naming-convention */

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

/** ALPHA */
export const TEXTUREFORMAT_ALPHA = 0;
/** LUMINANCE */
export const TEXTUREFORMAT_LUMINANCE = 1;
/** LUMINANCE_ALPHA */
export const TEXTUREFORMAT_LUMINANCE_ALPHA = 2;
/** RGB */
export const TEXTUREFORMAT_RGB = 4;
/** RGBA */
export const TEXTUREFORMAT_RGBA = 5;
/** RED */
export const TEXTUREFORMAT_RED = 6;
/** RED (2nd reference) */
export const TEXTUREFORMAT_R = 6;
/** RG */
export const TEXTUREFORMAT_RG = 7;
/** RED_INTEGER */
export const TEXTUREFORMAT_RED_INTEGER = 8;
/** RED_INTEGER (2nd reference) */
export const TEXTUREFORMAT_R_INTEGER = 8;
/** RG_INTEGER */
export const TEXTUREFORMAT_RG_INTEGER = 9;
/** RGB_INTEGER */
export const TEXTUREFORMAT_RGB_INTEGER = 10;
/** RGBA_INTEGER */
export const TEXTUREFORMAT_RGBA_INTEGER = 11;
/** BGRA */
export const TEXTUREFORMAT_BGRA = 12;

/** Depth 24 bits + Stencil 8 bits */
export const TEXTUREFORMAT_DEPTH24_STENCIL8 = 13;
/** Depth 32 bits float */
export const TEXTUREFORMAT_DEPTH32_FLOAT = 14;
/** Depth 16 bits */
export const TEXTUREFORMAT_DEPTH16 = 15;
/** Depth 24 bits */
export const TEXTUREFORMAT_DEPTH24 = 16;
/** Depth 24 bits unorm + Stencil 8 bits */
export const TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 = 17;
/** Depth 32 bits float + Stencil 8 bits */
export const TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8 = 18;
/** Stencil 8 bits */
export const TEXTUREFORMAT_STENCIL8 = 19;

/** Compressed BC7 */
export const TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM = 36492;
/** Compressed BC7 (SRGB) */
export const TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_BPTC_UNORM = 36493;
/** Compressed BC6 unsigned float */
export const TEXTUREFORMAT_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT = 36495;
/** Compressed BC6 signed float */
export const TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT = 36494;
/** Compressed BC3 */
export const TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5 = 33779;
/** Compressed BC3 (SRGB) */
export const TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT = 35919;
/** Compressed BC2 */
export const TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3 = 33778;
/** Compressed BC2 (SRGB) */
export const TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT = 35918;
/** Compressed BC1 (RGBA) */
export const TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1 = 33777;
/** Compressed BC1 (RGB) */
export const TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1 = 33776;
/** Compressed BC1 (SRGB+A) */
export const TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT = 35917;
/** Compressed BC1 (SRGB) */
export const TEXTUREFORMAT_COMPRESSED_SRGB_S3TC_DXT1_EXT = 35916;
/** Compressed ASTC 4x4 */
export const TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4 = 37808;
/** Compressed ASTC 4x4 (SRGB) */
export const TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR = 37840;
/** Compressed ETC1 (RGB) */
export const TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL = 36196;
/** Compressed ETC2 (RGB) */
export const TEXTUREFORMAT_COMPRESSED_RGB8_ETC2 = 37492;
/** Compressed ETC2 (SRGB) */
export const TEXTUREFORMAT_COMPRESSED_SRGB8_ETC2 = 37493;
/** Compressed ETC2 (RGB+A1) */
export const TEXTUREFORMAT_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 37494;
/** Compressed ETC2 (SRGB+A1)*/
export const TEXTUREFORMAT_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 37495;
/** Compressed ETC2 (RGB+A) */
export const TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC = 37496;
/** Compressed ETC2 (SRGB+1) */
export const TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = 37497;

/** UNSIGNED_BYTE */
export const TEXTURETYPE_UNSIGNED_BYTE = 0;
/** UNSIGNED_BYTE (2nd reference) */
export const TEXTURETYPE_UNSIGNED_INT = 0;
/** FLOAT */
export const TEXTURETYPE_FLOAT = 1;
/** HALF_FLOAT */
export const TEXTURETYPE_HALF_FLOAT = 2;
/** BYTE */
export const TEXTURETYPE_BYTE = 3;
/** SHORT */
export const TEXTURETYPE_SHORT = 4;
/** UNSIGNED_SHORT */
export const TEXTURETYPE_UNSIGNED_SHORT = 5;
/** INT */
export const TEXTURETYPE_INT = 6;
/** UNSIGNED_INT */
export const TEXTURETYPE_UNSIGNED_INTEGER = 7;
/** UNSIGNED_SHORT_4_4_4_4 */
export const TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 = 8;
/** UNSIGNED_SHORT_5_5_5_1 */
export const TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 = 9;
/** UNSIGNED_SHORT_5_6_5 */
export const TEXTURETYPE_UNSIGNED_SHORT_5_6_5 = 10;
/** UNSIGNED_INT_2_10_10_10_REV */
export const TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV = 11;
/** UNSIGNED_INT_24_8 */
export const TEXTURETYPE_UNSIGNED_INT_24_8 = 12;
/** UNSIGNED_INT_10F_11F_11F_REV */
export const TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV = 13;
/** UNSIGNED_INT_5_9_9_9_REV */
export const TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV = 14;
/** FLOAT_32_UNSIGNED_INT_24_8_REV */
export const TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV = 15;
/** UNDEFINED */
export const TEXTURETYPE_UNDEFINED = 16;

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

// Texture rescaling mode
/** Defines that texture rescaling will use a floor to find the closer power of 2 size */
export const SCALEMODE_FLOOR = 1;
/** Defines that texture rescaling will look for the nearest power of 2 size */
export const SCALEMODE_NEAREST = 2;
/** Defines that texture rescaling will use a ceil to find the closer power of 2 size */
export const SCALEMODE_CEILING = 3;

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
 * Nothing
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_NothingTrigger = 0;
/**
 * On pick
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnPickTrigger = 1;
/**
 * On left pick
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnLeftPickTrigger = 2;
/**
 * On right pick
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnRightPickTrigger = 3;
/**
 * On center pick
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnCenterPickTrigger = 4;
/**
 * On pick down
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnPickDownTrigger = 5;
/**
 * On double pick
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnDoublePickTrigger = 6;
/**
 * On pick up
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnPickUpTrigger = 7;
/**
 * On pick out.
 * This trigger will only be raised if you also declared a OnPickDown
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnPickOutTrigger = 16;
/**
 * On long press
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnLongPressTrigger = 8;
/**
 * On pointer over
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnPointerOverTrigger = 9;
/**
 * On pointer out
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnPointerOutTrigger = 10;
/**
 * On every frame
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnEveryFrameTrigger = 11;
/**
 * On intersection enter
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnIntersectionEnterTrigger = 12;
/**
 * On intersection exit
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnIntersectionExitTrigger = 13;
/**
 * On key down
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnKeyDownTrigger = 14;
/**
 * On key up
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
export const ACTION_OnKeyUpTrigger = 15;

/**
 * Billboard mode will only apply to Y axis
 */
export const PARTICLES_BILLBOARDMODE_Y = 2;
/**
 * Billboard mode will apply to all axes
 */
export const PARTICLES_BILLBOARDMODE_ALL = 7;
/**
 * Special billboard mode where the particle will be biilboard to the camera but rotated to align with direction
 */
export const PARTICLES_BILLBOARDMODE_STRETCHED = 8;
/**
 * Special billboard mode where the particle will be billboard to the camera but only around the axis of the direction of particle emission
 */
export const PARTICLES_BILLBOARDMODE_STRETCHED_LOCAL = 9;

/** Default culling strategy : this is an exclusion test and it's the more accurate.
 *  Test order :
 *  Is the bounding sphere outside the frustum ?
 *  If not, are the bounding box vertices outside the frustum ?
 *  It not, then the cullable object is in the frustum.
 */
export const MESHES_CULLINGSTRATEGY_STANDARD = 0;
/** Culling strategy : Bounding Sphere Only.
 *  This is an exclusion test. It's faster than the standard strategy because the bounding box is not tested.
 *  It's also less accurate than the standard because some not visible objects can still be selected.
 *  Test : is the bounding sphere outside the frustum ?
 *  If not, then the cullable object is in the frustum.
 */
export const MESHES_CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY = 1;
/** Culling strategy : Optimistic Inclusion.
 *  This in an inclusion test first, then the standard exclusion test.
 *  This can be faster when a cullable object is expected to be almost always in the camera frustum.
 *  This could also be a little slower than the standard test when the tested object center is not the frustum but one of its bounding box vertex is still inside.
 *  Anyway, it's as accurate as the standard strategy.
 *  Test :
 *  Is the cullable object bounding sphere center in the frustum ?
 *  If not, apply the default culling strategy.
 */
export const MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION = 2;
/** Culling strategy : Optimistic Inclusion then Bounding Sphere Only.
 *  This in an inclusion test first, then the bounding sphere only exclusion test.
 *  This can be the fastest test when a cullable object is expected to be almost always in the camera frustum.
 *  This could also be a little slower than the BoundingSphereOnly strategy when the tested object center is not in the frustum but its bounding sphere still intersects it.
 *  It's less accurate than the standard strategy and as accurate as the BoundingSphereOnly strategy.
 *  Test :
 *  Is the cullable object bounding sphere center in the frustum ?
 *  If not, apply the Bounding Sphere Only strategy. No Bounding Box is tested here.
 */
export const MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY = 3;

/**
 * No logging while loading
 */
export const SCENELOADER_NO_LOGGING = 0;
/**
 * Minimal logging while loading
 */
export const SCENELOADER_MINIMAL_LOGGING = 1;
/**
 * Summary logging while loading
 */
export const SCENELOADER_SUMMARY_LOGGING = 2;
/**
 * Detailed logging while loading
 */
export const SCENELOADER_DETAILED_LOGGING = 3;

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
 * Defines that both eyes of the camera should be renderered in a VR mode (webVR).
 */
export const RIG_MODE_WEBVR = 21;
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
