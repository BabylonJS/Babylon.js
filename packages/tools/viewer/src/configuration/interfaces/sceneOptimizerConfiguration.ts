export interface ISceneOptimizerConfiguration {
    targetFrameRate?: number;
    trackerDuration?: number;
    autoGeneratePriorities?: boolean;
    improvementMode?: boolean;
    degradation?: string; // low, moderate, high
    types?: {
        texture?: ISceneOptimizerParameters;
        hardwareScaling?: ISceneOptimizerParameters;
        shadow?: ISceneOptimizerParameters;
        postProcess?: ISceneOptimizerParameters;
        lensFlare?: ISceneOptimizerParameters;
        particles?: ISceneOptimizerParameters;
        renderTarget?: ISceneOptimizerParameters;
        mergeMeshes?: ISceneOptimizerParameters;
    };
    custom?: string;
}

export interface ISceneOptimizerParameters {
    priority?: number;
    maximumSize?: number;
    step?: number;
}