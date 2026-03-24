/**
 * Common options shared by IBL shadows frame graph tasks.
 */
export interface IFrameGraphIblShadowsCommonOptions {
    enabled?: boolean;
    shadowRenderSizeFactor?: number;
    coloredShadows?: boolean;
}

/**
 * Options used to configure the IBL shadows tracing task.
 */
export interface IFrameGraphIblShadowsTracingOptions extends IFrameGraphIblShadowsCommonOptions {
    sampleDirections?: number;
    voxelShadowOpacity?: number;
    voxelNormalBias?: number;
    voxelDirectionBias?: number;
    ssShadowOpacity?: number;
    ssShadowSampleCount?: number;
    ssShadowStride?: number;
    ssShadowDistanceScale?: number;
    ssShadowThicknessScale?: number;
    envRotation?: number;
}

/**
 * Options used to configure the IBL shadows accumulation task.
 */
export interface IFrameGraphIblShadowsAccumulationOptions extends IFrameGraphIblShadowsCommonOptions {
    remanence?: number;
}

/**
 * Options used to configure the IBL shadows voxelization task.
 */
export interface IFrameGraphIblShadowsVoxelizationOptions extends IFrameGraphIblShadowsCommonOptions {
    resolutionExp?: number;
    triPlanarVoxelization?: boolean;
    refreshRate?: number;
}
