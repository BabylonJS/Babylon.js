/// <reference path="../babylon.d.ts"/>

declare module BabylonViewer {

    export let disableInit: boolean;

    export interface ITemplateConfiguration {
        location?: string;
        html?: string;
        id?: string;
        params?: {
            [key: string]: string | number | boolean | object;
        };
        events?: {
            pointerdown?: boolean | {
                [id: string]: boolean;
            };
            pointerup?: boolean | {
                [id: string]: boolean;
            };
            pointermove?: boolean | {
                [id: string]: boolean;
            };
            pointerover?: boolean | {
                [id: string]: boolean;
            };
            pointerout?: boolean | {
                [id: string]: boolean;
            };
            pointerenter?: boolean | {
                [id: string]: boolean;
            };
            pointerleave?: boolean | {
                [id: string]: boolean;
            };
            pointercancel?: boolean | {
                [id: string]: boolean;
            };
            click?: boolean | {
                [id: string]: boolean;
            };
            dragstart?: boolean | {
                [id: string]: boolean;
            };
            drop?: boolean | {
                [id: string]: boolean;
            };
            [key: string]: boolean | {
                [id: string]: boolean;
            } | undefined;
        };
    }
    export interface EventCallback {
        event: Event;
        template: Template;
        selector: string;
        payload?: any;
    }
    class TemplateManager {
        containerElement: HTMLElement;
        onInit: BABYLON.Observable<Template>;
        onLoaded: BABYLON.Observable<Template>;
        onStateChange: BABYLON.Observable<Template>;
        onAllLoaded: BABYLON.Observable<TemplateManager>;
        onEventTriggered: BABYLON.Observable<EventCallback>;
        eventManager: EventManager;
        private templates;
        constructor(containerElement: HTMLElement);
        initTemplate(templates: {
            [key: string]: ITemplateConfiguration;
        }): void;
        private buildHTMLTree(templates);
        getCanvas(): HTMLCanvasElement | null;
        getTemplate(name: string): Template | undefined;
        private checkLoadedState();
    }

    class Template {
        name: string;
        private _configuration;
        onInit: BABYLON.Observable<Template>;
        onLoaded: BABYLON.Observable<Template>;
        onAppended: BABYLON.Observable<Template>;
        onStateChange: BABYLON.Observable<Template>;
        onEventTriggered: BABYLON.Observable<EventCallback>;
        isLoaded: boolean;
        isShown: boolean;
        parent: HTMLElement;
        initPromise: Promise<Template>;
        private fragment;
        constructor(name: string, _configuration: ITemplateConfiguration);
        readonly configuration: ITemplateConfiguration;
        getChildElements(): Array<string>;
        appendTo(parent: HTMLElement): void;
        show(visibilityFunction?: (template: Template) => Promise<Template>): Promise<Template>;
        hide(visibilityFunction?: (template: Template) => Promise<Template>): Promise<Template>;
        dispose(): void;
        private registerEvents();
    }

    class ViewerManager {
        private viewers;
        onViewerAdded: (viewer: AbstractViewer) => void;
        onViewerAddedObservable: BABYLON.Observable<AbstractViewer>;
        constructor();
        addViewer(viewer: AbstractViewer): void;
        getViewerById(id: string): AbstractViewer;
        getViewerByHTMLElement(element: HTMLElement): AbstractViewer | undefined;
        getViewerPromiseById(id: string): Promise<AbstractViewer>;
        private _onViewerAdded(viewer);
    }
    export let viewerManager: ViewerManager;

    export const enum CameraBehavior {
        AUTOROTATION = 0,
        BOUNCING = 1,
        FRAMING = 2,
    }

    export function InitTags(selector?: string): void;

    class EventManager {
        private templateManager;
        private callbacksContainer;
        constructor(templateManager: TemplateManager);
        registerCallback(templateName: string, callback: (eventData: EventCallback) => void, eventType?: string, selector?: string): void;
        unregisterCallback(templateName: string, callback?: (eventData: EventCallback) => void, eventType?: string, selector?: string): void;
        private eventTriggered(data);
    }

    class PromiseObservable<T> extends BABYLON.Observable<T> {
        notifyWithPromise(eventData: T, mask?: number, target?: any, currentTarget?: any): Promise<any>;
    }

    export interface IMapper {
        map(rawSource: any): ViewerConfiguration;
    }
    class MapperManager {
        private mappers;
        static DefaultMapper: string;
        constructor();
        getMapper(type: string): IMapper;
        registerMapper(type: string, mapper: IMapper): void;
    }
    export let mapperManager: MapperManager;

    class ConfigurationLoader {
        private configurationCache;
        constructor();
        loadConfiguration(initConfig?: ViewerConfiguration): Promise<ViewerConfiguration>;
        getConfigurationType(type: string): void;
        private loadFile(url);
    }
    export let configurationLoader: ConfigurationLoader;


    /////> configuration
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
            engineOptions?: { [key: string]: any };
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
        }
    }

    export interface IModelConfiguration {
        url?: string;
        loader?: string; // obj, gltf?
        position?: { x: number, y: number, z: number };
        rotation?: { x: number, y: number, z: number, w?: number };
        scaling?: { x: number, y: number, z: number };
        parentObjectIndex?: number; // the index of the parent object of the model in the loaded meshes array.

        castShadow?: boolean;
        normalize?: boolean | {
            center?: boolean;
            unitSize?: boolean;
            parentIndex?: number;
        }; // shoud the model be scaled to unit-size

        title?: string;
        subtitle?: string;
        thumbnail?: string; // URL or data-url

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
        infiniteDIstance?: boolean;

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
        autoRotate?: boolean; // deprecated
        rotationSpeed?: number; // deprecated
        defaultCamera?: boolean; // deprecated
        defaultLight?: boolean; // deprecated
        clearColor?: { r: number, g: number, b: number, a: number };
        imageProcessingConfiguration?: IImageProcessingConfiguration;
        environmentTexture?: string;
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
            [propName: string]: any;
        }
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

    }
    /////>configuration

    /////<viewer
    export abstract class AbstractViewer {
        containerElement: HTMLElement;
        templateManager: TemplateManager;
        camera: BABYLON.ArcRotateCamera;
        engine: BABYLON.Engine;
        scene: BABYLON.Scene;
        baseId: string;
        canvas: HTMLCanvasElement;
        protected configuration: ViewerConfiguration;
        environmentHelper: BABYLON.EnvironmentHelper;
        protected defaultHighpTextureType: number;
        protected shadowGeneratorBias: number;
        protected defaultPipelineTextureType: number;
        protected maxShadows: number;
        onSceneInitObservable: BABYLON.Observable<BABYLON.Scene>;
        onEngineInitObservable: BABYLON.Observable<BABYLON.Engine>;
        onModelLoadedObservable: BABYLON.Observable<BABYLON.AbstractMesh[]>;
        onModelLoadProgressObservable: BABYLON.Observable<BABYLON.SceneLoaderProgressEvent>;
        onModelLoadErrorObservable: BABYLON.Observable<{ message: string; exception: any }>;
        onLoaderInitObservable: BABYLON.Observable<BABYLON.ISceneLoaderPlugin | BABYLON.ISceneLoaderPluginAsync>;
        onInitDoneObservable: BABYLON.Observable<AbstractViewer>;
        constructor(containerElement: HTMLElement, initialConfiguration?: ViewerConfiguration);
        getBaseId(): string;
        protected abstract prepareContainerElement(): any;
        protected onTemplatesLoaded(): Promise<AbstractViewer>;
        protected initEngine(): Promise<BABYLON.Engine>;
        protected initScene(): Promise<BABYLON.Scene>;
        dispose(): void;
        loadModel(model?: any, clearScene?: boolean): Promise<BABYLON.Scene>;
        lastUsedLoader: BABYLON.ISceneLoaderPlugin | BABYLON.ISceneLoaderPluginAsync;
        sceneOptimizer: BABYLON.SceneOptimizer;
        protected registeredOnBeforerenderFunctions: Array<() => void>;
        isCanvasInDOM(): boolean;
        protected resize: () => void;
        protected render: () => void;
        updateConfiguration(newConfiguration: Partial<ViewerConfiguration>): void;
        protected configureEnvironment(skyboxConifguration?: ISkyboxConfiguration | boolean, groundConfiguration?: IGroundConfiguration | boolean): void;
        protected configureScene(sceneConfig: ISceneConfiguration, optimizerConfig?: ISceneOptimizerConfiguration): void;
        protected configureOptimizer(optimizerConfig: ISceneOptimizerConfiguration | boolean): void;
        protected configureObservers(observersConfiguration: IObserversConfiguration): void;
        protected configureCamera(cameraConfig: ICameraConfiguration, focusMeshes: Array<BABYLON.AbstractMesh>): void;
        protected configureLights(lightsConfiguration: { [name: string]: ILightConfiguration | boolean }, focusMeshes: Array<BABYLON.AbstractMesh>): void;
        protected configureModel(modelConfiguration: Partial<IModelConfiguration>, focusMeshes: Array<BABYLON.AbstractMesh>): void;
        dispose(): void;
        protected initEnvironment(focusMeshes: Array<BABYLON.AbstractMesh>): Promise<BABYLON.Scene>;
        protected injectCustomShaders(): void;
        protected extendClassWithConfig(object: any, config: any): void;
        protected handleHardwareLimitations(): void;


    }

    export class DefaultViewer extends AbstractViewer {
        containerElement: HTMLElement;
        camera: BABYLON.ArcRotateCamera;
        constructor(containerElement: HTMLElement, initialConfiguration?: ViewerConfiguration);
        initScene(): Promise<BABYLON.Scene>;
        protected onTemplatesLoaded(): Promise<AbstractViewer>;
        protected prepareContainerElement(): void;
        loadModel(model?: any): Promise<BABYLON.Scene>;
        initEnvironment(focusMeshes?: Array<BABYLON.AbstractMesh>): Promise<BABYLON.Scene>;
        showOverlayScreen(subScreen: string): Promise<Template>;
        hideOverlayScreen(): Promise<Template>;
        showLoadingScreen(): Promise<Template>;
        hideLoadingScreen(): Promise<Template>;
    }
}