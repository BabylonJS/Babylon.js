import { ICameraConfiguration, IDefaultRenderingPipelineConfiguration, IGroundConfiguration, ILightConfiguration, IModelConfiguration, IObserversConfiguration, ISceneConfiguration, ISceneOptimizerConfiguration, ISkyboxConfiguration, ITemplateConfiguration, IVRConfiguration } from './interfaces';
import { IEnvironmentMapConfiguration } from './interfaces/environmentMapConfiguration';
import { EngineOptions } from 'babylonjs/Engines/thinEngine';

export function getConfigurationKey(key: string, configObject: any) {
    let splits = key.split('.');

    if (splits.length === 0 || !configObject) { return; }
    else if (splits.length === 1) {
        if (configObject[key] !== undefined) {
            return configObject[key];
        }
    } else {
        let firstKey = splits.shift();
        return getConfigurationKey(splits.join("."), configObject[firstKey!]);
    }
}

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
    camera?: ICameraConfiguration;
    skybox?: boolean | ISkyboxConfiguration;

    ground?: boolean | IGroundConfiguration;
    lights?: {
        //globalRotation: number,
        [name: string]: number | boolean | ILightConfiguration
    };
    // engine configuration. optional!
    engine?: {
        renderInBackground?: boolean;
        antialiasing?: boolean;
        disableResize?: boolean;
        engineOptions?: EngineOptions;
        adaptiveQuality?: boolean;
        hdEnabled?: boolean;
    };
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
    };

    loaderPlugins?: {
        extendedMaterial?: boolean;
        msftLod?: boolean;
        telemetry?: boolean;
        minecraft?: boolean;

        [propName: string]: boolean | undefined;
    };

    environmentMap?: IEnvironmentMapConfiguration;

    vr?: IVRConfiguration;

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
        /** @deprecated */
        assetsRootURL?: string;
        environmentMainColor?: { r: number, g: number, b: number };
        /** @deprecated */
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
        defaultRenderingPipelines?: boolean | IDefaultRenderingPipelineConfiguration;
        globalLightRotation?: number;
    };
}