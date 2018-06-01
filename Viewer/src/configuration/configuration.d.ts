import { ITemplateConfiguration } from './../templateManager';
import { EngineOptions, IGlowLayerOptions, DepthOfFieldEffectBlurLevel } from 'babylonjs';
export declare function getConfigurationKey(key: string, configObject: any): any;
export interface ViewerConfiguration {
    version?: string;
    extends?: string;
    pageUrl?: string;
    configuration?: string | {
        url?: string;
        payload?: any;
        mapper?: string;
    };
    observers?: IObserversConfiguration;
    canvasElement?: string;
    model?: IModelConfiguration | string;
    scene?: ISceneConfiguration;
    optimizer?: ISceneOptimizerConfiguration | boolean;
    camera?: ICameraConfiguration;
    skybox?: boolean | ISkyboxConfiguration;
    ground?: boolean | IGroundConfiguration;
    lights?: {
        [name: string]: number | boolean | ILightConfiguration;
    };
    engine?: {
        renderInBackground?: boolean;
        antialiasing?: boolean;
        disableResize?: boolean;
        engineOptions?: EngineOptions;
        adaptiveQuality?: boolean;
    };
    templates?: {
        main: ITemplateConfiguration;
        [key: string]: ITemplateConfiguration;
    };
    customShaders?: {
        shaders?: {
            [key: string]: string;
        };
        includes?: {
            [key: string]: string;
        };
    };
    loaderPlugins?: {
        extendedMaterial?: boolean;
        msftLod?: boolean;
        telemetry?: boolean;
        minecraft?: boolean;
        [propName: string]: boolean | undefined;
    };
    lab?: {
        flashlight?: boolean | {
            exponent?: number;
            angle?: number;
            intensity?: number;
            diffuse?: {
                r: number;
                g: number;
                b: number;
            };
            specular?: {
                r: number;
                g: number;
                b: number;
            };
        };
        hideLoadingDelay?: number;
        assetsRootURL?: string;
        environmentMainColor?: {
            r: number;
            g: number;
            b: number;
        };
        environmentMap?: {
            /**
             * Environment map texture path in relative to the asset folder.
             */
            texture: string;
            /**
             * Default rotation to apply to the environment map.
             */
            rotationY: number;
            /**
             * Tint level of the main color on the environment map.
             */
            tintLevel: number;
        };
        defaultRenderingPipelines?: boolean | IDefaultRenderingPipelineConfiguration;
        globalLightRotation?: number;
    };
}
/**
 * Defines an animation to be applied to a model (translation, scale or rotation).
 */
export interface IModelAnimationConfiguration {
    /**
     * Time of animation, in seconds
     */
    time?: number;
    /**
     * Scale to apply
     */
    scaling?: {
        x: number;
        y: number;
        z: number;
    };
    /**
     * Easing function to apply
     * See SPECTRE.EasingFunction
     */
    easingFunction?: number;
    /**
     * An Easing mode to apply to the easing function
     * See BABYLON.EasingFunction
     */
    easingMode?: number;
}
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
export interface IModelConfiguration {
    id?: string;
    url?: string;
    root?: string;
    file?: string | File;
    loader?: string;
    position?: {
        x: number;
        y: number;
        z: number;
    };
    rotation?: {
        x: number;
        y: number;
        z: number;
        w?: number;
    };
    scaling?: {
        x: number;
        y: number;
        z: number;
    };
    parentObjectIndex?: number;
    castShadow?: boolean;
    receiveShadows?: boolean;
    normalize?: boolean | {
        center?: boolean;
        unitSize?: boolean;
        parentIndex?: number;
    };
    title?: string;
    subtitle?: string;
    thumbnail?: string;
    animation?: {
        autoStart?: boolean | string;
        playOnce?: boolean;
        autoStartIndex?: number;
    };
    entryAnimation?: IModelAnimationConfiguration;
    exitAnimation?: IModelAnimationConfiguration;
    material?: {
        directEnabled?: boolean;
        directIntensity?: number;
        emissiveIntensity?: number;
        environmentIntensity?: number;
        [propName: string]: any;
    };
    /**
     * Rotation offset axis definition
     */
    rotationOffsetAxis?: {
        x: number;
        y: number;
        z: number;
    };
    /**
     * the offset angle
     */
    rotationOffsetAngle?: number;
    loaderConfiguration?: {
        maxLODsToLoad?: number;
        progressiveLoading?: boolean;
    };
}
export interface ISkyboxConfiguration {
    cubeTexture?: {
        noMipMap?: boolean;
        gammaSpace?: boolean;
        url?: string | Array<string>;
    };
    color?: {
        r: number;
        g: number;
        b: number;
    };
    pbr?: boolean;
    scale?: number;
    blur?: number;
    material?: {
        imageProcessingConfiguration?: IImageProcessingConfiguration;
        [propName: string]: any;
    };
    infiniteDistance?: boolean;
}
export interface IGroundConfiguration {
    size?: number;
    receiveShadows?: boolean;
    shadowLevel?: number;
    shadowOnly?: boolean;
    mirror?: boolean | {
        sizeRatio?: number;
        blurKernel?: number;
        amount?: number;
        fresnelWeight?: number;
        fallOffDistance?: number;
        textureType?: number;
    };
    texture?: string;
    color?: {
        r: number;
        g: number;
        b: number;
    };
    opacity?: number;
    material?: {
        [propName: string]: any;
    };
}
export interface ISceneConfiguration {
    debug?: boolean;
    clearColor?: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    mainColor?: {
        r?: number;
        g?: number;
        b?: number;
    };
    imageProcessingConfiguration?: IImageProcessingConfiguration;
    environmentTexture?: string;
    colorGrading?: IColorGradingConfiguration;
    environmentRotationY?: number;
    /**
     * Deprecated, please use default rendering pipeline
     */
    glow?: boolean | IGlowLayerOptions;
    disableHdr?: boolean;
    renderInBackground?: boolean;
    disableCameraControl?: boolean;
    animationPropertiesOverride?: {
        [propName: string]: any;
    };
    defaultMaterial?: {
        materialType: "standard" | "pbr";
        [propName: string]: any;
    };
    flags?: {
        shadowsEnabled?: boolean;
        particlesEnabled?: boolean;
        collisionsEnabled?: boolean;
        lightsEnabled?: boolean;
        texturesEnabled?: boolean;
        lensFlaresEnabled?: boolean;
        proceduralTexturesEnabled?: boolean;
        renderTargetsEnabled?: boolean;
        spritesEnabled?: boolean;
        skeletonsEnabled?: boolean;
        audioEnabled?: boolean;
    };
}
/**
 * The Color Grading Configuration groups the different settings used to define the color grading used in the viewer.
 */
export interface IColorGradingConfiguration {
    /**
     * Transform data string, encoded as determined by transformDataFormat.
     */
    transformData: string;
    /**
     * The encoding format of TransformData (currently only raw-base16 is supported).
     */
    transformDataFormat: string;
    /**
     * The weight of the transform
     */
    transformWeight: number;
    /**
     * Color curve colorFilterHueGlobal value
     */
    colorFilterHueGlobal: number;
    /**
     * Color curve colorFilterHueShadows value
     */
    colorFilterHueShadows: number;
    /**
     * Color curve colorFilterHueMidtones value
     */
    colorFilterHueMidtones: number;
    /**
     * Color curve colorFilterHueHighlights value
     */
    colorFilterHueHighlights: number;
    /**
     * Color curve colorFilterDensityGlobal value
     */
    colorFilterDensityGlobal: number;
    /**
     * Color curve colorFilterDensityShadows value
     */
    colorFilterDensityShadows: number;
    /**
     * Color curve colorFilterDensityMidtones value
     */
    colorFilterDensityMidtones: number;
    /**
     * Color curve colorFilterDensityHighlights value
     */
    colorFilterDensityHighlights: number;
    /**
     * Color curve saturationGlobal value
     */
    saturationGlobal: number;
    /**
     * Color curve saturationShadows value
     */
    saturationShadows: number;
    /**
     * Color curve saturationMidtones value
     */
    saturationMidtones: number;
    /**
     * Color curve saturationHighlights value
     */
    saturationHighlights: number;
    /**
     * Color curve exposureGlobal value
     */
    exposureGlobal: number;
    /**
     * Color curve exposureShadows value
     */
    exposureShadows: number;
    /**
     * Color curve exposureMidtones value
     */
    exposureMidtones: number;
    /**
     * Color curve exposureHighlights value
     */
    exposureHighlights: number;
}
export interface ISceneOptimizerConfiguration {
    targetFrameRate?: number;
    trackerDuration?: number;
    autoGeneratePriorities?: boolean;
    improvementMode?: boolean;
    degradation?: string;
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
export interface IObserversConfiguration {
    onEngineInit?: string;
    onSceneInit?: string;
    onModelLoaded?: string;
}
export interface ICameraConfiguration {
    position?: {
        x: number;
        y: number;
        z: number;
    };
    rotation?: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    fov?: number;
    fovMode?: number;
    minZ?: number;
    maxZ?: number;
    inertia?: number;
    exposure?: number;
    pinchPrecision?: number;
    behaviors?: {
        [name: string]: boolean | number | ICameraBehaviorConfiguration;
    };
    disableCameraControl?: boolean;
    disableCtrlForPanning?: boolean;
    disableAutoFocus?: boolean;
    [propName: string]: any;
}
export interface ICameraBehaviorConfiguration {
    type: number;
    [propName: string]: any;
}
export interface ILightConfiguration {
    type: number;
    name?: string;
    disabled?: boolean;
    position?: {
        x: number;
        y: number;
        z: number;
    };
    target?: {
        x: number;
        y: number;
        z: number;
    };
    direction?: {
        x: number;
        y: number;
        z: number;
    };
    diffuse?: {
        r: number;
        g: number;
        b: number;
    };
    specular?: {
        r: number;
        g: number;
        b: number;
    };
    intensity?: number;
    intensityMode?: number;
    radius?: number;
    shadownEnabled?: boolean;
    shadowConfig?: {
        useBlurExponentialShadowMap?: boolean;
        useBlurCloseExponentialShadowMap?: boolean;
        useKernelBlur?: boolean;
        blurKernel?: number;
        blurScale?: number;
        minZ?: number;
        maxZ?: number;
        frustumSize?: number;
        angleScale?: number;
        frustumEdgeFalloff?: number;
        [propName: string]: any;
    };
    spotAngle?: number;
    shadowFieldOfView?: number;
    shadowBufferSize?: number;
    shadowFrustumSize?: number;
    shadowMinZ?: number;
    shadowMaxZ?: number;
    [propName: string]: any;
    behaviors?: {
        [name: string]: number | {
            type: number;
            [propName: string]: any;
        };
    };
}
export interface ISceneOptimizerParameters {
    priority?: number;
    maximumSize?: number;
    step?: number;
}
export interface IImageProcessingConfiguration {
    colorGradingEnabled?: boolean;
    colorCurvesEnabled?: boolean;
    colorCurves?: {
        globalHue?: number;
        globalDensity?: number;
        globalSaturation?: number;
        globalExposure?: number;
        highlightsHue?: number;
        highlightsDensity?: number;
        highlightsSaturation?: number;
        highlightsExposure?: number;
        midtonesHue?: number;
        midtonesDensity?: number;
        midtonesSaturation?: number;
        midtonesExposure?: number;
        shadowsHue?: number;
        shadowsDensity?: number;
        shadowsSaturation?: number;
        shadowsExposure?: number;
    };
    colorGradingWithGreenDepth?: boolean;
    colorGradingBGR?: boolean;
    exposure?: number;
    toneMappingEnabled?: boolean;
    contrast?: number;
    vignetteEnabled?: boolean;
    vignetteStretch?: number;
    vignetteCentreX?: number;
    vignetteCentreY?: number;
    vignetteWeight?: number;
    vignetteColor?: {
        r: number;
        g: number;
        b: number;
        a?: number;
    };
    vignetteCameraFov?: number;
    vignetteBlendMode?: number;
    vignetteM?: boolean;
    applyByPostProcess?: boolean;
    isEnabled?: boolean;
}
