import { DepthOfFieldEffectBlurLevel } from "babylonjs/PostProcesses/depthOfFieldEffect";

export interface IDefaultRenderingPipelineConfiguration {
    sharpenEnabled?: boolean;
    bloomEnabled?: boolean;
    bloomThreshold?: number;
    depthOfFieldEnabled?: boolean;
    depthOfFieldBlurLevel?: DepthOfFieldEffectBlurLevel;
    fxaaEnabled?: boolean;
    imageProcessingEnabled?: boolean;
    defaultPipelineTextureType?: number;
    bloomScale?: number;
    chromaticAberrationEnabled?: boolean;
    grainEnabled?: boolean;
    bloomKernel?: number;
    hardwareScaleLevel?: number;
    bloomWeight?: number;
    hdr?: boolean;
    samples?: number;
    glowLayerEnabled?: boolean;
}