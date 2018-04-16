import { ITemplateConfiguration } from './../templateManager';
import { EngineOptions } from 'babylonjs';

export interface ViewerConfiguration {

    // configuration version
    version?: string;
    extends?: string; // is this configuration extending an existing configuration?

    pageUrl?: string; // will be used for sharing and other fun stuff. This is the page showing the model (not the model's url!)

    configuration?: string | {
        url?: string;
        payload?: any;
        mapper?: string; // json (default), html, yaml, xml, etc'. if not provided, file extension will be used.
    };

    // names of functions in the window context.
    observers?: IObserversConfiguration;

    canvasElement?: string; // if there is a need to override the standard implementation - ID of HTMLCanvasElement

    model?: IModelConfiguration | string;

    scene?: ISceneConfiguration;
    optimizer?: ISceneOptimizerConfiguration | boolean;
    // at the moment, support only a single camera.
    camera?: ICameraConfiguration,
    skybox?: boolean | ISkyboxConfiguration;

    ground?: boolean | IGroundConfiguration;
    lights?: { [name: string]: boolean | ILightConfiguration },
    // engine configuration. optional!
    engine?: {
        antialiasing?: boolean;
        disableResize?: boolean;
        engineOptions?: EngineOptions;
        adaptiveQuality?: boolean;
    },
    //templateStructure?: ITemplateStructure,
    templates?: {
        main: ITemplateConfiguration,
        [key: string]: ITemplateConfiguration
    };

    customShaders?: {
        shaders?: {
            [key: string]: string;
        };
        includes?: {
            [key: string]: string;
        }
    }

    // features that are being tested.
    // those features' syntax will change and move out! 
    // Don't use in production (or be ready to make the changes :) )
    lab?: {
        flashlight?: boolean | {
            exponent?: number;
            angle?: number;
            intensity?: number;
            diffuse?: { r: number, g: number, b: number };
            specular?: { r: number, g: number, b: number };
        }
        hideLoadingDelay?: number;
        environmentAssetsRootURL?: string;
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
        }
    }
}

export interface IModelConfiguration {
    id?: string;
    url?: string;
    root?: string; //optional
    loader?: string; // obj, gltf?
    position?: { x: number, y: number, z: number };
    rotation?: { x: number, y: number, z: number, w?: number };
    scaling?: { x: number, y: number, z: number };
    parentObjectIndex?: number; // the index of the parent object of the model in the loaded meshes array.

    castShadow?: boolean;
    receiveShadows?: boolean;
    normalize?: boolean | {
        center?: boolean;
        unitSize?: boolean;
        parentIndex?: number;
    }; // should the model be scaled to unit-size

    title?: string;
    subtitle?: string;
    thumbnail?: string; // URL or data-url

    animation?: {
        autoStart?: boolean | string;
        playOnce?: boolean;
    }

    material?: {
        directEnabled?: boolean;
        directIntensity?: number;
        emissiveIntensity?: number;
        environmentIntensity?: number;
        [propName: string]: any;
    }

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

    // [propName: string]: any; // further configuration, like title and creator
}

export interface ISkyboxConfiguration {
    cubeTexture?: {
        noMipMap?: boolean;
        gammaSpace?: boolean;
        url?: string | Array<string>;
    };
    color?: { r: number, g: number, b: number };
    pbr?: boolean; // deprecated
    scale?: number;
    blur?: number; // deprecated
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
    shadowOnly?: boolean; // deprecated
    mirror?: boolean | {
        sizeRatio?: number;
        blurKernel?: number;
        amount?: number;
        fresnelWeight?: number;
        fallOffDistance?: number;
        textureType?: number;
    };
    texture?: string;
    color?: { r: number, g: number, b: number };
    opacity?: number;
    material?: { // deprecated!
        [propName: string]: any;
    };
}

export interface ISceneConfiguration {
    debug?: boolean;
    clearColor?: { r: number, g: number, b: number, a: number };
    mainColor?: { r: number, g: number, b: number };
    imageProcessingConfiguration?: IImageProcessingConfiguration;
    environmentTexture?: string;
    colorGrading?: IColorGradingConfiguration;
    environmentRotationY?: number;
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
    }
}

export interface IObserversConfiguration {
    onEngineInit?: string;
    onSceneInit?: string;
    onModelLoaded?: string;
}

export interface ICameraConfiguration {
    position?: { x: number, y: number, z: number };
    rotation?: { x: number, y: number, z: number, w: number };
    fov?: number;
    fovMode?: number;
    minZ?: number;
    maxZ?: number;
    inertia?: number;
    behaviors?: {
        [name: string]: number | {
            type: number;
            [propName: string]: any;
        };
    };
    disableCameraControl?: boolean;
    disableCtrlForPanning?: boolean;
    disableAutoFocus?: boolean;

    [propName: string]: any;
}

export interface ILightConfiguration {
    type: number;
    name?: string;
    disabled?: boolean;
    position?: { x: number, y: number, z: number };
    target?: { x: number, y: number, z: number };
    direction?: { x: number, y: number, z: number };
    diffuse?: { r: number, g: number, b: number };
    specular?: { r: number, g: number, b: number };
    intensity?: number;
    intensityMode?: number;
    radius?: number;
    shadownEnabled?: boolean; // only on specific lights!
    shadowConfig?: {
        useBlurExponentialShadowMap?: boolean;
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

    // no behaviors for light at the moment, but allowing configuration for future reference.
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
    vignetteColor?: { r: number, g: number, b: number, a?: number };
    vignetteCameraFov?: number;
    vignetteBlendMode?: number;
    vignetteM?: boolean;
    applyByPostProcess?: boolean;
    isEnabled?: boolean;
}