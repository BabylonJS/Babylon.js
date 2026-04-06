/**
 * Common options shared by IBL shadows frame graph tasks.
 */
export interface IFrameGraphIblShadowsCommonOptions {
    /**
     * A size multiplier for the internal shadow render targets (default 1.0). A value of 1.0 represents
     * full-resolution. Scaling this below 1.0 reduces memory and GPU cost at the expense of shadow sharpness.
     */
    shadowRenderSizeFactor?: number;
    /**
     * When true, shadows are tinted by the colour of the IBL light instead of being rendered as greyscale.
     * Requires the environment texture to be provided to the tracing task.
     */
    coloredShadows?: boolean;
}

/**
 * Options used to configure the IBL shadows tracing task.
 */
export interface IFrameGraphIblShadowsTracingOptions extends IFrameGraphIblShadowsCommonOptions {
    /**
     * The number of IBL directions sampled per pixel during the voxel shadow tracing pass.
     * Higher values produce more stable, higher-quality shadows at greater GPU cost.
     */
    sampleDirections?: number;
    /**
     * Opacity of the voxel-traced shadows. 1.0 is fully opaque, 0.0 disables voxel shadows.
     */
    voxelShadowOpacity?: number;
    /**
     * Normal bias applied to the voxel shadow ray origin to reduce self-shadowing artefacts.
     */
    voxelNormalBias?: number;
    /**
     * Direction bias applied along the shadow ray to reduce self-shadowing artefacts.
     */
    voxelDirectionBias?: number;
    /**
     * Opacity of the screen-space shadow contribution. 1.0 is fully opaque, 0.0 disables screen-space shadows.
     */
    ssShadowOpacity?: number;
    /**
     * Number of samples taken per pixel in the screen-space shadow pass. Higher values reduce noise
     * but increase GPU cost.
     */
    ssShadowSampleCount?: number;
    /**
     * Step size in pixels between consecutive screen-space shadow samples.
     */
    ssShadowStride?: number;
    /**
     * Scale factor for the maximum screen-space shadow ray distance in world space. The base distance
     * is derived from the voxel grid size and resolution exponent, so this value generally does not
     * need to change when the scene is scaled.
     */
    ssShadowDistanceScale?: number;
    /**
     * Scale factor for the assumed surface thickness used in the screen-space shadow pass. The base
     * thickness is derived from the voxel grid size, so this value generally does not need to change
     * when the scene is scaled.
     */
    ssShadowThicknessScale?: number;
    /**
     * Y-axis rotation of the IBL environment in radians. This should match the rotation applied to
     * the environment map on materials and the skybox.
     */
    envRotation?: number;
}

/**
 * Options used to configure the IBL shadows accumulation task.
 */
export interface IFrameGraphIblShadowsAccumulationOptions extends IFrameGraphIblShadowsCommonOptions {
    /**
     * Controls how much of the previous frame's shadow result is carried forward (temporal accumulation).
     * 0.0 means no persistence (shadows fully recomputed each frame), 1.0 means full persistence.
     * Must be in the range [0, 1]. While the camera is stationary the pipeline automatically increases
     * remanence to allow shadows to converge.
     */
    remanence?: number;
}

/**
 * Options used to configure the IBL shadows voxelization task.
 */
export interface IFrameGraphIblShadowsVoxelizationOptions extends IFrameGraphIblShadowsCommonOptions {
    /**
     * Exponent that controls the resolution of the voxel shadow grid. The actual grid resolution is
     * 2^resolutionExp. Higher values produce sharper shadows but require more memory and GPU time.
     */
    resolutionExp?: number;
    /**
     * When true, the scene is voxelized along all three axes and the results are combined. This
     * reduces missing-geometry artefacts in the voxel grid at the cost of additional GPU work.
     */
    triPlanarVoxelization?: boolean;
    /**
     * How often the voxel grid is rebuilt, expressed as the number of frames to skip between rebuilds.
     * 0 rebuilds every frame, 1 rebuilds every other frame, and so on.
     * Use -1 to only rebuild when explicitly requested (e.g. when the scene changes).
     */
    refreshRate?: number;
}
