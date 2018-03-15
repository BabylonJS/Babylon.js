declare module BabylonViewer {

    export let disableInit: boolean;

    export function disposeAll();

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
    interface TemplateManager {
        containerElement: HTMLElement;
        onInit: BABYLON.Observable<Template>;
        onLoaded: BABYLON.Observable<Template>;
        onStateChange: BABYLON.Observable<Template>;
        onAllLoaded: BABYLON.Observable<TemplateManager>;
        onEventTriggered: BABYLON.Observable<EventCallback>;
        eventManager: EventManager;
        initTemplate(templates: {
            [key: string]: ITemplateConfiguration;
        }): void;
        getCanvas(): HTMLCanvasElement | null;
        getTemplate(name: string): Template | undefined;
    }

    interface Template {
        name: string;
        onInit: BABYLON.Observable<Template>;
        onLoaded: BABYLON.Observable<Template>;
        onAppended: BABYLON.Observable<Template>;
        onStateChange: BABYLON.Observable<Template>;
        onEventTriggered: BABYLON.Observable<EventCallback>;
        isLoaded: boolean;
        isShown: boolean;
        parent: HTMLElement;
        initPromise: Promise<Template>;
        readonly configuration: ITemplateConfiguration;
        getChildElements(): Array<string>;
        appendTo(parent: HTMLElement): void;
        show(visibilityFunction?: (template: Template) => Promise<Template>): Promise<Template>;
        hide(visibilityFunction?: (template: Template) => Promise<Template>): Promise<Template>;
        dispose(): void;
    }

    interface ViewerManager {
        onViewerAdded: (viewer: AbstractViewer) => void;
        onViewerAddedObservable: BABYLON.Observable<AbstractViewer>;
        onViewerRemovedObservable: BABYLON.Observable<string>;
        addViewer(viewer: AbstractViewer): void;
        removeViewer(viewer: AbstractViewer): void;
        getViewerById(id: string): AbstractViewer;
        getViewerByHTMLElement(element: HTMLElement): AbstractViewer | undefined;
        getViewerPromiseById(id: string): Promise<AbstractViewer>;
    }
    export let viewerManager: ViewerManager;

    export const enum CameraBehavior {
        AUTOROTATION = 0,
        BOUNCING = 1,
        FRAMING = 2,
    }

    export function InitTags(selector?: string): void;

    interface EventManager {
        registerCallback(templateName: string, callback: (eventData: EventCallback) => void, eventType?: string, selector?: string): void;
        unregisterCallback(templateName: string, callback?: (eventData: EventCallback) => void, eventType?: string, selector?: string): void;
    }

    interface PromiseObservable<T> extends BABYLON.Observable<T> {
        notifyWithPromise(eventData: T, mask?: number, target?: any, currentTarget?: any): Promise<any>;
    }

    export interface IMapper {
        map(rawSource: any): ViewerConfiguration;
    }
    interface MapperManager {
        DefaultMapper: string;
        getMapper(type: string): IMapper;
        registerMapper(type: string, mapper: IMapper): void;
    }
    export let mapperManager: MapperManager;

    interface ConfigurationLoader {
        loadConfiguration(initConfig?: ViewerConfiguration): Promise<ViewerConfiguration>;
        getConfigurationType(type: string): void;
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

        animation?: {
            autoStart?: boolean | string;
            playOnce?: boolean;
        }

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

    export enum AnimationPlayMode {
        ONCE = 0,
        LOOP = 1,
    }
    export enum AnimationState {
        INIT = 0,
        PLAYING = 1,
        PAUSED = 2,
        STOPPED = 3,
        ENDED = 4,
    }
    export interface IModelAnimation extends BABYLON.IDisposable {
        readonly state: AnimationState;
        readonly name: string;
        readonly frames: number;
        readonly currentFrame: number;
        readonly fps: number;
        speedRatio: number;
        playMode: AnimationPlayMode;
        start(): any;
        stop(): any;
        pause(): any;
        reset(): any;
        restart(): any;
        goToFrame(frameNumber: number): any;
    }

    export interface ViewerModel extends BABYLON.IDisposable {
        loader: BABYLON.ISceneLoaderPlugin | BABYLON.ISceneLoaderPluginAsync;
        meshes: Array<BABYLON.AbstractMesh>;
        particleSystems: Array<BABYLON.ParticleSystem>;
        skeletons: Array<BABYLON.Skeleton>;
        currentAnimation: IModelAnimation;
        onLoadedObservable: BABYLON.Observable<ViewerModel>;
        onLoadProgressObservable: BABYLON.Observable<BABYLON.SceneLoaderProgressEvent>;
        onLoadErrorObservable: BABYLON.Observable<{
            message: string;
            exception: any;
        }>;
        load(): void;
        getAnimationNames(): string[];
        playAnimation(name: string): IModelAnimation;
        dispose(): void;
    }

    /////<viewer
    export abstract class AbstractViewer {
        containerElement: HTMLElement;
        templateManager: TemplateManager;
        engine: BABYLON.Engine;
        scene: BABYLON.Scene;
        camera: BABYLON.ArcRotateCamera;
        sceneOptimizer: BABYLON.SceneOptimizer;
        baseId: string;
        models: Array<ViewerModel>;
        lastUsedLoader: BABYLON.ISceneLoaderPlugin | BABYLON.ISceneLoaderPluginAsync;
        protected configuration: ViewerConfiguration;
        environmentHelper: BABYLON.EnvironmentHelper;
        protected defaultHighpTextureType: number;
        protected shadowGeneratorBias: number;
        protected defaultPipelineTextureType: number;
        protected maxShadows: number;
        readonly isHdrSupported: boolean;
        protected _isDisposed: boolean;
        onSceneInitObservable: BABYLON.Observable<BABYLON.Scene>;
        onEngineInitObservable: BABYLON.Observable<BABYLON.Engine>;
        onModelLoadedObservable: BABYLON.Observable<ViewerModel>;
        onModelLoadProgressObservable: BABYLON.Observable<BABYLON.SceneLoaderProgressEvent>;
        onModelLoadErrorObservable: BABYLON.Observable<{
            message: string;
            exception: any;
        }>;
        onLoaderInitObservable: BABYLON.Observable<BABYLON.ISceneLoaderPlugin | BABYLON.ISceneLoaderPluginAsync>;
        onInitDoneObservable: BABYLON.Observable<AbstractViewer>;
        canvas: HTMLCanvasElement;
        protected registeredOnBeforerenderFunctions: Array<() => void>;
        constructor(containerElement: HTMLElement, initialConfiguration?: ViewerConfiguration);
        getBaseId(): string;
        isCanvasInDOM(): boolean;
        protected resize: () => void;
        protected render: () => void;
        updateConfiguration(newConfiguration?: Partial<ViewerConfiguration>): void;
        protected configureEnvironment(skyboxConifguration?: ISkyboxConfiguration | boolean, groundConfiguration?: IGroundConfiguration | boolean): Promise<BABYLON.Scene> | undefined;
        protected configureScene(sceneConfig: ISceneConfiguration, optimizerConfig?: ISceneOptimizerConfiguration): void;
        protected configureOptimizer(optimizerConfig: ISceneOptimizerConfiguration | boolean): void;
        protected configureObservers(observersConfiguration: IObserversConfiguration): void;
        protected configureCamera(cameraConfig: ICameraConfiguration, model?: ViewerModel): void;
        protected configureLights(lightsConfiguration?: {
            [name: string]: ILightConfiguration | boolean;
        }, model?: ViewerModel): void;
        protected configureModel(modelConfiguration: Partial<IModelConfiguration>, model?: ViewerModel): void;
        dispose(): void;
        protected abstract prepareContainerElement(): any;
        protected onTemplatesLoaded(): Promise<AbstractViewer>;
        protected initEngine(): Promise<BABYLON.Engine>;
        protected initScene(): Promise<BABYLON.Scene>;
        loadModel(modelConfig?: any, clearScene?: boolean): Promise<ViewerModel>;
        protected initEnvironment(viewerModel?: ViewerModel): Promise<BABYLON.Scene>;
        protected handleHardwareLimitations(): void;
        protected injectCustomShaders(): void;
        protected extendClassWithConfig(object: any, config: any): void;
    }

    export class DefaultViewer extends AbstractViewer {
        containerElement: HTMLElement;
        camera: BABYLON.ArcRotateCamera;
        constructor(containerElement: HTMLElement, initialConfiguration?: ViewerConfiguration);
        initScene(): Promise<BABYLON.Scene>;
        protected onTemplatesLoaded(): Promise<AbstractViewer>;
        protected prepareContainerElement(): void;
        loadModel(model?: any): Promise<ViewerModel>;
        initEnvironment(viewerModel?: ViewerModel): Promise<BABYLON.Scene>;
        showOverlayScreen(subScreen: string): Promise<Template>;
        hideOverlayScreen(): Promise<Template>;
        showLoadingScreen(): Promise<Template>;
        hideLoadingScreen(): Promise<Template>;
    }
}