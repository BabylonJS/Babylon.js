/** Defines the cross module used constants to avoid circular dependncies */
export class Constants {
    /** Defines that alpha blending is disabled */
    public static readonly ALPHA_DISABLE = 0;
    /** Defines that alpha blending is SRC ALPHA * SRC + DEST */
    public static readonly ALPHA_ADD = 1;
    /** Defines that alpha blending is SRC ALPHA * SRC + (1 - SRC ALPHA) * DEST */
    public static readonly ALPHA_COMBINE = 2;
    /** Defines that alpha blending is DEST - SRC * DEST */
    public static readonly ALPHA_SUBTRACT = 3;
    /** Defines that alpha blending is SRC * DEST */
    public static readonly ALPHA_MULTIPLY = 4;
    /** Defines that alpha blending is SRC ALPHA * SRC + (1 - SRC) * DEST */
    public static readonly ALPHA_MAXIMIZED = 5;
    /** Defines that alpha blending is SRC + DEST */
    public static readonly ALPHA_ONEONE = 6;
    /** Defines that alpha blending is SRC + (1 - SRC ALPHA) * DEST */
    public static readonly ALPHA_PREMULTIPLIED = 7;
    /**
     * Defines that alpha blending is SRC + (1 - SRC ALPHA) * DEST
     * Alpha will be set to (1 - SRC ALPHA) * DEST ALPHA
     */
    public static readonly ALPHA_PREMULTIPLIED_PORTERDUFF = 8;
    /** Defines that alpha blending is CST * SRC + (1 - CST) * DEST */
    public static readonly ALPHA_INTERPOLATE = 9;
    /**
     * Defines that alpha blending is SRC + (1 - SRC) * DEST
     * Alpha will be set to SRC ALPHA + (1 - SRC ALPHA) * DEST ALPHA
     */
    public static readonly ALPHA_SCREENMODE = 10;
    /**
     * Defines that alpha blending is SRC + DST
     * Alpha will be set to SRC ALPHA + DST ALPHA
     */
    public static readonly ALPHA_ONEONE_ONEONE = 11;
    /**
     * Defines that alpha blending is SRC * DST ALPHA + DST
     * Alpha will be set to 0
     */
    public static readonly ALPHA_ALPHATOCOLOR = 12;
    /**
     * Defines that alpha blending is SRC * (1 - DST) + DST * (1 - SRC)
     */
    public static readonly ALPHA_REVERSEONEMINUS = 13;
    /**
     * Defines that alpha blending is SRC + DST * (1 - SRC ALPHA)
     * Alpha will be set to SRC ALPHA + DST ALPHA * (1 - SRC ALPHA)
     */
    public static readonly ALPHA_SRC_DSTONEMINUSSRCALPHA = 14;
    /**
     * Defines that alpha blending is SRC + DST
     * Alpha will be set to SRC ALPHA
     */
    public static readonly ALPHA_ONEONE_ONEZERO = 15;
    /**
     * Defines that alpha blending is SRC * (1 - DST) + DST * (1 - SRC)
     * Alpha will be set to DST ALPHA
     */
    public static readonly ALPHA_EXCLUSION = 16;

    /** Defines that alpha blending equation a SUM */
    public static readonly ALPHA_EQUATION_ADD = 0;
    /** Defines that alpha blending equation a SUBSTRACTION */
    public static readonly ALPHA_EQUATION_SUBSTRACT = 1;
    /** Defines that alpha blending equation a REVERSE SUBSTRACTION */
    public static readonly ALPHA_EQUATION_REVERSE_SUBTRACT = 2;
    /** Defines that alpha blending equation a MAX operation */
    public static readonly ALPHA_EQUATION_MAX = 3;
    /** Defines that alpha blending equation a MIN operation */
    public static readonly ALPHA_EQUATION_MIN = 4;
    /**
     * Defines that alpha blending equation a DARKEN operation:
     * It takes the min of the src and sums the alpha channels.
     */
    public static readonly ALPHA_EQUATION_DARKEN = 5;

    /** Defines that the ressource is not delayed*/
    public static readonly DELAYLOADSTATE_NONE = 0;
    /** Defines that the ressource was successfully delay loaded */
    public static readonly DELAYLOADSTATE_LOADED = 1;
    /** Defines that the ressource is currently delay loading */
    public static readonly DELAYLOADSTATE_LOADING = 2;
    /** Defines that the ressource is delayed and has not started loading */
    public static readonly DELAYLOADSTATE_NOTLOADED = 4;

    // Depht or Stencil test Constants.
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn */
    public static readonly NEVER = 0x0200;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn */
    public static readonly ALWAYS = 0x0207;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value */
    public static readonly LESS = 0x0201;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value */
    public static readonly EQUAL = 0x0202;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value */
    public static readonly LEQUAL = 0x0203;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value */
    public static readonly GREATER = 0x0204;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value */
    public static readonly GEQUAL = 0x0206;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value */
    public static readonly NOTEQUAL = 0x0205;

    // Stencil Actions Constants.
    /** Passed to stencilOperation to specify that stencil value must be kept */
    public static readonly KEEP = 0x1E00;
    /** Passed to stencilOperation to specify that stencil value must be replaced */
    public static readonly REPLACE = 0x1E01;
    /** Passed to stencilOperation to specify that stencil value must be incremented */
    public static readonly INCR = 0x1E02;
    /** Passed to stencilOperation to specify that stencil value must be decremented */
    public static readonly DECR = 0x1E03;
    /** Passed to stencilOperation to specify that stencil value must be inverted */
    public static readonly INVERT = 0x150A;
    /** Passed to stencilOperation to specify that stencil value must be incremented with wrapping */
    public static readonly INCR_WRAP = 0x8507;
    /** Passed to stencilOperation to specify that stencil value must be decremented with wrapping */
    public static readonly DECR_WRAP = 0x8508;

    /** Texture is not repeating outside of 0..1 UVs */
    public static readonly TEXTURE_CLAMP_ADDRESSMODE = 0;
    /** Texture is repeating outside of 0..1 UVs */
    public static readonly TEXTURE_WRAP_ADDRESSMODE = 1;
    /** Texture is repeating and mirrored */
    public static readonly TEXTURE_MIRROR_ADDRESSMODE = 2;

    /** ALPHA */
    public static readonly TEXTUREFORMAT_ALPHA = 0;
    /** LUMINANCE */
    public static readonly TEXTUREFORMAT_LUMINANCE = 1;
    /** LUMINANCE_ALPHA */
    public static readonly TEXTUREFORMAT_LUMINANCE_ALPHA = 2;
    /** RGB */
    public static readonly TEXTUREFORMAT_RGB = 4;
    /** RGBA */
    public static readonly TEXTUREFORMAT_RGBA = 5;
    /** RED */
    public static readonly TEXTUREFORMAT_RED = 6;
    /** RED (2nd reference) */
    public static readonly TEXTUREFORMAT_R = 6;
    /** RG */
    public static readonly TEXTUREFORMAT_RG = 7;
    /** RED_INTEGER */
    public static readonly TEXTUREFORMAT_RED_INTEGER = 8;
    /** RED_INTEGER (2nd reference) */
    public static readonly TEXTUREFORMAT_R_INTEGER = 8;
    /** RG_INTEGER */
    public static readonly TEXTUREFORMAT_RG_INTEGER = 9;
    /** RGB_INTEGER */
    public static readonly TEXTUREFORMAT_RGB_INTEGER = 10;
    /** RGBA_INTEGER */
    public static readonly TEXTUREFORMAT_RGBA_INTEGER = 11;

    /** UNSIGNED_BYTE */
    public static readonly TEXTURETYPE_UNSIGNED_BYTE = 0;
    /** UNSIGNED_BYTE (2nd reference) */
    public static readonly TEXTURETYPE_UNSIGNED_INT = 0;
    /** FLOAT */
    public static readonly TEXTURETYPE_FLOAT = 1;
    /** HALF_FLOAT */
    public static readonly TEXTURETYPE_HALF_FLOAT = 2;
    /** BYTE */
    public static readonly TEXTURETYPE_BYTE = 3;
    /** SHORT */
    public static readonly TEXTURETYPE_SHORT = 4;
    /** UNSIGNED_SHORT */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT = 5;
    /** INT */
    public static readonly TEXTURETYPE_INT = 6;
    /** UNSIGNED_INT */
    public static readonly TEXTURETYPE_UNSIGNED_INTEGER = 7;
    /** UNSIGNED_SHORT_4_4_4_4 */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 = 8;
    /** UNSIGNED_SHORT_5_5_5_1 */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 = 9;
    /** UNSIGNED_SHORT_5_6_5 */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_5_6_5 = 10;
    /** UNSIGNED_INT_2_10_10_10_REV */
    public static readonly TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV = 11;
    /** UNSIGNED_INT_24_8 */
    public static readonly TEXTURETYPE_UNSIGNED_INT_24_8 = 12;
    /** UNSIGNED_INT_10F_11F_11F_REV */
    public static readonly TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV = 13;
    /** UNSIGNED_INT_5_9_9_9_REV */
    public static readonly TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV = 14;
    /** FLOAT_32_UNSIGNED_INT_24_8_REV */
    public static readonly TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV = 15;

    /** nearest is mag = nearest and min = nearest and no mip */
    public static readonly TEXTURE_NEAREST_SAMPLINGMODE = 1;
    /** mag = nearest and min = nearest and mip = none */
    public static readonly TEXTURE_NEAREST_NEAREST = 1;

    /** Bilinear is mag = linear and min = linear and no mip */
    public static readonly TEXTURE_BILINEAR_SAMPLINGMODE = 2;
    /** mag = linear and min = linear and mip = none */
    public static readonly TEXTURE_LINEAR_LINEAR = 2;

    /** Trilinear is mag = linear and min = linear and mip = linear */
    public static readonly TEXTURE_TRILINEAR_SAMPLINGMODE = 3;
    /** Trilinear is mag = linear and min = linear and mip = linear */
    public static readonly TEXTURE_LINEAR_LINEAR_MIPLINEAR = 3;

    /** mag = nearest and min = nearest and mip = nearest */
    public static readonly TEXTURE_NEAREST_NEAREST_MIPNEAREST = 4;
    /** mag = nearest and min = linear and mip = nearest */
    public static readonly TEXTURE_NEAREST_LINEAR_MIPNEAREST = 5;
    /** mag = nearest and min = linear and mip = linear */
    public static readonly TEXTURE_NEAREST_LINEAR_MIPLINEAR = 6;
    /** mag = nearest and min = linear and mip = none */
    public static readonly TEXTURE_NEAREST_LINEAR = 7;
    /** nearest is mag = nearest and min = nearest and mip = linear */
    public static readonly TEXTURE_NEAREST_NEAREST_MIPLINEAR = 8;
    /** mag = linear and min = nearest and mip = nearest */
    public static readonly TEXTURE_LINEAR_NEAREST_MIPNEAREST = 9;
    /** mag = linear and min = nearest and mip = linear */
    public static readonly TEXTURE_LINEAR_NEAREST_MIPLINEAR = 10;
    /** Bilinear is mag = linear and min = linear and mip = nearest */
    public static readonly TEXTURE_LINEAR_LINEAR_MIPNEAREST = 11;
    /** mag = linear and min = nearest and mip = none */
    public static readonly TEXTURE_LINEAR_NEAREST = 12;

    /** Explicit coordinates mode */
    public static readonly TEXTURE_EXPLICIT_MODE = 0;
    /** Spherical coordinates mode */
    public static readonly TEXTURE_SPHERICAL_MODE = 1;
    /** Planar coordinates mode */
    public static readonly TEXTURE_PLANAR_MODE = 2;
    /** Cubic coordinates mode */
    public static readonly TEXTURE_CUBIC_MODE = 3;
    /** Projection coordinates mode */
    public static readonly TEXTURE_PROJECTION_MODE = 4;
    /** Skybox coordinates mode */
    public static readonly TEXTURE_SKYBOX_MODE = 5;
    /** Inverse Cubic coordinates mode */
    public static readonly TEXTURE_INVCUBIC_MODE = 6;
    /** Equirectangular coordinates mode */
    public static readonly TEXTURE_EQUIRECTANGULAR_MODE = 7;
    /** Equirectangular Fixed coordinates mode */
    public static readonly TEXTURE_FIXED_EQUIRECTANGULAR_MODE = 8;
    /** Equirectangular Fixed Mirrored coordinates mode */
    public static readonly TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE = 9;

    /** Offline (baking) quality for texture filtering */
    public static readonly TEXTURE_FILTERING_QUALITY_OFFLINE = 4096;

    /** High quality for texture filtering */
    public static readonly TEXTURE_FILTERING_QUALITY_HIGH = 64;

    /** Medium quality for texture filtering */
    public static readonly TEXTURE_FILTERING_QUALITY_MEDIUM = 16;

    /** Low quality for texture filtering */
    public static readonly TEXTURE_FILTERING_QUALITY_LOW = 8;

    // Texture rescaling mode
    /** Defines that texture rescaling will use a floor to find the closer power of 2 size */
    public static readonly SCALEMODE_FLOOR = 1;
    /** Defines that texture rescaling will look for the nearest power of 2 size */
    public static readonly SCALEMODE_NEAREST = 2;
    /** Defines that texture rescaling will use a ceil to find the closer power of 2 size */
    public static readonly SCALEMODE_CEILING = 3;

    /**
     * The dirty texture flag value
     */
    public static readonly MATERIAL_TextureDirtyFlag = 1;
    /**
     * The dirty light flag value
     */
    public static readonly MATERIAL_LightDirtyFlag = 2;
    /**
     * The dirty fresnel flag value
     */
    public static readonly MATERIAL_FresnelDirtyFlag = 4;
    /**
     * The dirty attribute flag value
     */
    public static readonly MATERIAL_AttributesDirtyFlag = 8;
    /**
     * The dirty misc flag value
     */
    public static readonly MATERIAL_MiscDirtyFlag = 16;
    /**
     * The all dirty flag value
     */
    public static readonly MATERIAL_AllDirtyFlag = 31;

    /**
     * Returns the triangle fill mode
     */
    public static readonly MATERIAL_TriangleFillMode = 0;
    /**
     * Returns the wireframe mode
     */
    public static readonly MATERIAL_WireFrameFillMode = 1;
    /**
     * Returns the point fill mode
     */
    public static readonly MATERIAL_PointFillMode = 2;
    /**
     * Returns the point list draw mode
     */
    public static readonly MATERIAL_PointListDrawMode = 3;
    /**
     * Returns the line list draw mode
     */
    public static readonly MATERIAL_LineListDrawMode = 4;
    /**
     * Returns the line loop draw mode
     */
    public static readonly MATERIAL_LineLoopDrawMode = 5;
    /**
     * Returns the line strip draw mode
     */
    public static readonly MATERIAL_LineStripDrawMode = 6;

    /**
     * Returns the triangle strip draw mode
     */
    public static readonly MATERIAL_TriangleStripDrawMode = 7;
    /**
     * Returns the triangle fan draw mode
     */
    public static readonly MATERIAL_TriangleFanDrawMode = 8;

    /**
     * Stores the clock-wise side orientation
     */
    public static readonly MATERIAL_ClockWiseSideOrientation = 0;
    /**
     * Stores the counter clock-wise side orientation
     */
    public static readonly MATERIAL_CounterClockWiseSideOrientation = 1;

    /**
     * Nothing
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_NothingTrigger = 0;
    /**
     * On pick
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnPickTrigger = 1;
    /**
     * On left pick
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnLeftPickTrigger = 2;
    /**
     * On right pick
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnRightPickTrigger = 3;
    /**
     * On center pick
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnCenterPickTrigger = 4;
    /**
     * On pick down
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnPickDownTrigger = 5;
    /**
     * On double pick
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnDoublePickTrigger = 6;
    /**
     * On pick up
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnPickUpTrigger = 7;
    /**
     * On pick out.
     * This trigger will only be raised if you also declared a OnPickDown
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnPickOutTrigger = 16;
    /**
     * On long press
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnLongPressTrigger = 8;
    /**
     * On pointer over
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnPointerOverTrigger = 9;
    /**
     * On pointer out
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnPointerOutTrigger = 10;
    /**
     * On every frame
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnEveryFrameTrigger = 11;
    /**
     * On intersection enter
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnIntersectionEnterTrigger = 12;
    /**
     * On intersection exit
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnIntersectionExitTrigger = 13;
    /**
     * On key down
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnKeyDownTrigger = 14;
    /**
     * On key up
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly ACTION_OnKeyUpTrigger = 15;

    /**
     * Billboard mode will only apply to Y axis
     */
    public static readonly PARTICLES_BILLBOARDMODE_Y = 2;
    /**
     * Billboard mode will apply to all axes
     */
    public static readonly PARTICLES_BILLBOARDMODE_ALL = 7;
    /**
     * Special billboard mode where the particle will be biilboard to the camera but rotated to align with direction
     */
    public static readonly PARTICLES_BILLBOARDMODE_STRETCHED = 8;

    /** Default culling strategy : this is an exclusion test and it's the more accurate.
     *  Test order :
     *  Is the bounding sphere outside the frustum ?
     *  If not, are the bounding box vertices outside the frustum ?
     *  It not, then the cullable object is in the frustum.
     */
    public static readonly MESHES_CULLINGSTRATEGY_STANDARD = 0;
    /** Culling strategy : Bounding Sphere Only.
     *  This is an exclusion test. It's faster than the standard strategy because the bounding box is not tested.
     *  It's also less accurate than the standard because some not visible objects can still be selected.
     *  Test : is the bounding sphere outside the frustum ?
     *  If not, then the cullable object is in the frustum.
     */
    public static readonly MESHES_CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY = 1;
    /** Culling strategy : Optimistic Inclusion.
     *  This in an inclusion test first, then the standard exclusion test.
     *  This can be faster when a cullable object is expected to be almost always in the camera frustum.
     *  This could also be a little slower than the standard test when the tested object center is not the frustum but one of its bounding box vertex is still inside.
     *  Anyway, it's as accurate as the standard strategy.
     *  Test :
     *  Is the cullable object bounding sphere center in the frustum ?
     *  If not, apply the default culling strategy.
     */
    public static readonly MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION = 2;
    /** Culling strategy : Optimistic Inclusion then Bounding Sphere Only.
     *  This in an inclusion test first, then the bounding sphere only exclusion test.
     *  This can be the fastest test when a cullable object is expected to be almost always in the camera frustum.
     *  This could also be a little slower than the BoundingSphereOnly strategy when the tested object center is not in the frustum but its bounding sphere still intersects it.
     *  It's less accurate than the standard strategy and as accurate as the BoundingSphereOnly strategy.
     *  Test :
     *  Is the cullable object bounding sphere center in the frustum ?
     *  If not, apply the Bounding Sphere Only strategy. No Bounding Box is tested here.
     */
    public static readonly MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY = 3;

    /**
     * No logging while loading
     */
    public static readonly SCENELOADER_NO_LOGGING = 0;
    /**
     * Minimal logging while loading
     */
    public static readonly SCENELOADER_MINIMAL_LOGGING = 1;
    /**
     * Summary logging while loading
     */
    public static readonly SCENELOADER_SUMMARY_LOGGING = 2;
    /**
     * Detailled logging while loading
     */
    public static readonly SCENELOADER_DETAILED_LOGGING = 3;
}