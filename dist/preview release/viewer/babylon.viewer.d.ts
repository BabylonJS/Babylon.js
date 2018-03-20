declare module BabylonViewer {

    export let disableInit: boolean;

    export function disposeAll(): void;

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
    /**
     * The object sent when an event is triggered
     */
    export interface EventCallback {
        /**
         * The native javascript event triggered
         */
        event: Event;
        /**
         * The template on which the event was triggered
         */
        template: Template;
        /**
         * The selector provided
         */
        selector: string;
        /**
         * Payload, if provided by the viewer
         */
        payload?: any;
    }
    /**
     * The template manager, a member of the viewer class, will manage the viewer's templates and generate the HTML.
     * The template manager managers a single viewer and can be seen as the collection of all sub-templates of the viewer.
     */
    interface TemplateManager {
        /**
         * The element to which all the templates wil be appended
         */
        containerElement: HTMLElement;
        /**
         * Will be triggered when any template is initialized
         */
        onTemplateInit: BABYLON.Observable<Template>;
        /**
         * Will be triggered when any template is fully loaded
         */
        onTemplateLoaded: BABYLON.Observable<Template>;
        /**
         * Will be triggered when a template state changes
         */
        onTemplateStateChange: BABYLON.Observable<Template>;
        /**
         * Will be triggered when all templates finished loading
         */
        onAllLoaded: BABYLON.Observable<TemplateManager>;
        /**
         * Will be triggered when any event on any template is triggered.
         */
        onEventTriggered: BABYLON.Observable<EventCallback>;
        /**
         * This template manager's event manager. In charge of callback registrations to native event types
         */
        eventManager: EventManager;
        /**
         * Initialize the template(s) for the viewer. Called bay the Viewer class
         * @param templates the templates to be used to initialize the main template
         */
        initTemplate(templates: {
            [key: string]: ITemplateConfiguration;
        }): Promise<void>;
        /**
        /**
         * Get the canvas in the template tree.
         * There must be one and only one canvas inthe template.
         */
        getCanvas(): HTMLCanvasElement | null;
        /**
         * Get a specific template from the template tree
         * @param name the name of the template to load
         */
        getTemplate(name: string): Template | undefined;
        /**
         * Dispose the template manager
         */
        dispose(): void;
    }

    /**
     * This class represents a single template in the viewer's template tree.
     * An example for a template is a single canvas, an overlay (containing sub-templates) or the navigation bar.
     * A template is injected using the template manager in the correct position.
     * The template is rendered using Handlebars and can use Handlebars' features (such as parameter injection)
     *
     * For further information please refer to the documentation page, https://doc.babylonjs.com
    */
    interface Template {
        /**
         * The name of the template
         */
        name: string;
        /**
         * Will be triggered when the template is loaded
         */
        onLoaded: BABYLON.Observable<Template>;
        /**
         * will be triggered when the template is appended to the tree
         */
        onAppended: BABYLON.Observable<Template>;
        /**
         * Will be triggered when the template's state changed (shown, hidden)
         */
        onStateChange: BABYLON.Observable<Template>;
        /**
         * Will be triggered when an event is triggered on ths template.
         * The event is a native browser event (like mouse or pointer events)
         */
        onEventTriggered: BABYLON.Observable<EventCallback>;
        /**
         * is the template loaded?
         */
        isLoaded: boolean;
        /**
         * This is meant to be used to track the show and hide functions.
         * This is NOT (!!) a flag to check if the element is actually visible to the user.
         */
        isShown: boolean;
        /**
         * Is this template a part of the HTML tree (the template manager injected it)
         */
        isInHtmlTree: boolean;
        /**
         * The HTML element containing this template
         */
        parent: HTMLElement;
        /**
         * A promise that is fulfilled when the template finished loading.
         */
        initPromise: Promise<Template>;
        /**
         * Some templates have parameters (like background color for example).
         * The parameters are provided to Handlebars which in turn generates the template.
         * This function will update the template with the new parameters
         *
         * @param params the new template parameters
         */
        updateParams(params: {
            [key: string]: string | number | boolean | object;
        }): void;
        /**
         * Get the template'S configuration
         */
        readonly configuration: ITemplateConfiguration;
        /**
         * A template can be a parent element for other templates or HTML elements.
         * This function will deliver all child HTML elements of this template.
         */
        getChildElements(): Array<string>;
        /**
         * Appending the template to a parent HTML element.
         * If a parent is already set and you wish to replace the old HTML with new one, forceRemove should be true.
         * @param parent the parent to which the template is added
         * @param forceRemove if the parent already exists, shoud the template be removed from it?
         */
        appendTo(parent: HTMLElement, forceRemove?: boolean): void;
        /**
         * Show the template using the provided visibilityFunction, or natively using display: flex.
         * The provided function returns a promise that should be fullfilled when the element is shown.
         * Since it is a promise async operations are more than possible.
         * See the default viewer for an opacity example.
         * @param visibilityFunction The function to execute to show the template.
         */
        show(visibilityFunction?: (template: Template) => Promise<Template>): Promise<Template>;
        /**
         * Hide the template using the provided visibilityFunction, or natively using display: none.
         * The provided function returns a promise that should be fullfilled when the element is hidden.
         * Since it is a promise async operations are more than possible.
         * See the default viewer for an opacity example.
         * @param visibilityFunction The function to execute to show the template.
         */
        hide(visibilityFunction?: (template: Template) => Promise<Template>): Promise<Template>;
        /**
         * Dispose this template
         */
        dispose(): void;
    }

    /**
     * The viewer manager is the container for all viewers currently registered on this page.
     * It is possible to have more than one viewer on a single page.
     */
    interface ViewerManager {
        /**
         * A callback that will be triggered when a new viewer was added
         */
        onViewerAdded: (viewer: AbstractViewer) => void;
        /**
         * Will notify when a new viewer was added
         */
        onViewerAddedObservable: BABYLON.Observable<AbstractViewer>;
        /**
         * Will notify when a viewer was removed (disposed)
         */
        onViewerRemovedObservable: BABYLON.Observable<string>;
        /**
         * Adding a new viewer to the viewer manager and start tracking it.
         * @param viewer the viewer to add
         */
        addViewer(viewer: AbstractViewer): void;
        /**
         * remove a viewer from the viewer manager
         * @param viewer the viewer to remove
         */
        removeViewer(viewer: AbstractViewer): void;
        /**
         * Get a viewer by its baseId (if the container element has an ID, it is the this is. if not, a random id was assigned)
         * @param id the id of the HTMl element (or the viewer's, if none provided)
         */
        getViewerById(id: string): AbstractViewer;
        /**
         * Get a viewer using a container element
         * @param element the HTML element to search viewers associated with
         */
        getViewerByHTMLElement(element: HTMLElement): AbstractViewer | undefined;
        /**
         * Get a promise that will fullfil when this viewer was initialized.
         * Since viewer initialization and template injection is asynchronous, using the promise will guaranty that
         * you will get the viewer after everything was already configured.
         * @param id the viewer id to find
         */
        getViewerPromiseById(id: string): Promise<AbstractViewer>;
        /**
         * dispose the manager and all of its associated viewers
         */
        dispose(): void;
    }
    export let viewerManager: ViewerManager;

    export const enum CameraBehavior {
        AUTOROTATION = 0,
        BOUNCING = 1,
        FRAMING = 2,
    }

    /*
    * Select all HTML tags on the page that match the selector and initialize a viewer
    *
    * @param selector the selector to initialize the viewer on (default is 'babylon')
    */
    export function InitTags(selector?: string): void;

    /**
     * The EventManager is in charge of registering user interctions with the viewer.
     * It is used in the TemplateManager
     */
    interface EventManager {
        /**
         * Register a new callback to a specific template.
         * The best example for the usage can be found in the DefaultViewer
         *
         * @param templateName the templateName to register the event to
         * @param callback The callback to be executed
         * @param eventType the type of event to register
         * @param selector an optional selector. if not defined the parent object in the template will be selected
         */
        registerCallback(templateName: string, callback: (eventData: EventCallback) => void, eventType?: string, selector?: string): void;
        /**
         * This will remove a registered event from the defined template.
         * Each one of the variables apart from the template name are optional, but one must be provided.
         *
         * @param templateName the templateName
         * @param callback the callback to remove (optional)
         * @param eventType the event type to remove (optional)
         * @param selector the selector from which to remove the event (optional)
         */
        unregisterCallback(templateName: string, callback: (eventData: EventCallback) => void, eventType?: string, selector?: string): void;
        /**
         * Dispose the event manager
         */
        dispose(): void;
    }

    /**
     * This is the mapper's interface. Implement this function to create your own mapper and register it at the mapper manager
     */
    export interface IMapper {
        map(rawSource: any): ViewerConfiguration;
    }

    interface MapperManager {
        /**
         * The default mapper is the JSON mapper.
         */
        DefaultMapper: string;
        /**
         * Get a specific configuration mapper.
         *
         * @param type the name of the mapper to load
         */
        getMapper(type: string): IMapper;
        /**
         * Use this functio to register your own configuration mapper.
         * After a mapper is registered, it can be used to parse the specific type fo configuration to the standard ViewerConfiguration.
         * @param type the name of the mapper. This will be used to define the configuration type and/or to get the mapper
         * @param mapper The implemented mapper
         */
        registerMapper(type: string, mapper: IMapper): void;
        /**
         * Dispose the mapper manager and all of its mappers.
         */
        dispose(): void;
    }
    export let mapperManager: MapperManager;

    interface ConfigurationLoader {
        /**
         * load a configuration object that is defined in the initial configuration provided.
         * The viewer configuration can extend different types of configuration objects and have an extra configuration defined.
         *
         * @param initConfig the initial configuration that has the definitions of further configuration to load.
         * @param callback an optional callback that will be called sync, if noconfiguration needs to be loaded or configuration is payload-only
         * @returns A promise that delivers the extended viewer configuration, when done.
         */
        loadConfiguration(initConfig?: ViewerConfiguration, callback?: (config: ViewerConfiguration) => void): Promise<ViewerConfiguration>;
        /**
         * Dispose the configuration loader. This will cancel file requests, if active.
         */
        dispose(): void;
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
        root?: string;
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

    /**
     * Animation play mode enum - is the animation looping or playing once
     */
    export enum AnimationPlayMode {
        ONCE = 0,
        LOOP = 1,
    }
    /**
     * An enum representing the current state of an animation object
     */
    export enum AnimationState {
        INIT = 0,
        PLAYING = 1,
        PAUSED = 2,
        STOPPED = 3,
        ENDED = 4,
    }
    /**
     * This interface can be implemented to define new types of ModelAnimation objects.
     */
    export interface IModelAnimation {
        /**
         * Current animation state (playing, stopped etc')
         */
        readonly state: AnimationState;
        /**
         * the name of the animation
         */
        readonly name: string;
        /**
         * Get the max numbers of frame available in the animation group
         *
         * In correlation to an arry, this would be ".length"
         */
        readonly frames: number;
        /**
         * Get the current frame playing right now.
         * This can be used to poll the frame currently playing (and, for exmaple, display a progress bar with the data)
         *
         * In correlation to an array, this would be the current index
         */
        readonly currentFrame: number;
        /**
         * Animation's FPS value
         */
        readonly fps: number;
        /**
         * Get or set the animation's speed ration (Frame-to-fps)
         */
        speedRatio: number;
        /**
         * Gets or sets the aimation's play mode.
         */
        playMode: AnimationPlayMode;
        /**
         * Start the animation
         */
        start(): any;
        /**
         * Stop the animation.
         * This will fail silently if the animation group is already stopped.
         */
        stop(): any;
        /**
         * Pause the animation
         * This will fail silently if the animation is not currently playing
         */
        pause(): any;
        /**
         * Reset this animation
         */
        reset(): any;
        /**
         * Restart the animation
         */
        restart(): any;
        /**
         * Go to a specific
         * @param frameNumber the frame number to go to
         */
        goToFrame(frameNumber: number): any;
        /**
         * Dispose this animation
         */
        dispose(): any;
    }

    export enum ModelState {
        INIT,
        LOADING,
        LOADED,
        CANCELED,
        ERROR
    }

    /**
     * An instance of the class is in charge of loading the model correctly.
     * This class will continously be expended with tasks required from the specific loaders Babylon has.
     *
     * A Model loader is unique per (Abstract)Viewer. It is being generated by the viewer
     */
    export class ModelLoader {
        private _viewer;
        private _loadId;
        private _disposed;
        private _loaders;
        /**
         * Create a new Model loader
         * @param _viewer the viewer using this model loader
         */
        constructor(_viewer: AbstractViewer);
        /**
         * Load a model using predefined configuration
         * @param modelConfiguration the modelConfiguration to use to load the model
         */
        load(modelConfiguration: IModelConfiguration): ViewerModel;
        cancelLoad(model: ViewerModel): void;
        /**
         * dispose the model loader.
         * If loaders are registered and are in the middle of loading, they will be disposed and the request(s) will be cancelled.
         */
        dispose(): void;
    }

    export class ViewerModel {
        /**
         * The viewer associated with this viewer model
         */
        protected _viewer: AbstractViewer;
        /**
         * The loader used to load this model.
         */
        loader: BABYLON.ISceneLoaderPlugin | BABYLON.ISceneLoaderPluginAsync;
        private _animations;
        /**
         * the list of meshes that are a part of this model
         */
        meshes: Array<BABYLON.AbstractMesh>;
        /**
         * This model's root mesh (the parent of all other meshes).
         * This mesh also exist in the meshes array.
         */
        rootMesh: BABYLON.AbstractMesh;
        /**
         * ParticleSystems connected to this model
         */
        particleSystems: Array<BABYLON.ParticleSystem>;
        /**
         * Skeletons defined in this model
         */
        skeletons: Array<BABYLON.Skeleton>;
        /**
         * The current model animation.
         * On init, this will be undefined.
         */
        currentAnimation: IModelAnimation;
        /**
         * Observers registered here will be executed when the model is done loading
         */
        onLoadedObservable: BABYLON.Observable<ViewerModel>;
        /**
         * Observers registered here will be executed when the loader notified of a progress event
         */
        onLoadProgressObservable: BABYLON.Observable<BABYLON.SceneLoaderProgressEvent>;
        /**
         * Observers registered here will be executed when the loader notified of an error.
         */
        onLoadErrorObservable: BABYLON.Observable<{
            message: string;
            exception: any;
        }>;
        /**
         * Observers registered here will be executed every time the model is being configured.
         * This can be used to extend the model's configuration without extending the class itself
         */
        onAfterConfigure: BABYLON.Observable<ViewerModel>;
        /**
         * The current model state (loaded, error, etc)
         */
        state: ModelState;
        /**
         * A loadID provided by the modelLoader, unique to ths (Abstract)Viewer instance.
         */
        loadId: number;
        private _loadedUrl;
        private _modelConfiguration;
        constructor(_viewer: AbstractViewer, modelConfiguration: IModelConfiguration);
        /**
         * Get the model's configuration
         */
        /**
         * (Re-)set the model's entire configuration
         * @param newConfiguration the new configuration to replace the new one
         */
        configuration: IModelConfiguration;
        /**
         * Update the current configuration with new values.
         * Configuration will not be overwritten, but merged with the new configuration.
         * Priority is to the new configuration
         * @param newConfiguration the configuration to be merged into the current configuration;
         */
        updateConfiguration(newConfiguration: Partial<IModelConfiguration>): void;
        initAnimations(): void;
        /**
         * Add a new animation group to this model.
         * @param animationGroup the new animation group to be added
         */
        addAnimationGroup(animationGroup: BABYLON.AnimationGroup): void;
        /**
         * Get the ModelAnimation array
         */
        getAnimations(): Array<IModelAnimation>;
        /**
         * Get the animations' names. Using the names you can play a specific animation.
         */
        getAnimationNames(): Array<string>;
        /**
         * Get an animation by the provided name. Used mainly when playing n animation.
         * @param name the name of the animation to find
         */
        protected _getAnimationByName(name: string): BABYLON.Nullable<IModelAnimation>;
        /**
         * Choose an initialized animation using its name and start playing it
         * @param name the name of the animation to play
         * @returns The model aniamtion to be played.
         */
        playAnimation(name: string): IModelAnimation;
        private _configureModel();
        /**
         * Dispose this model, including all of its associated assets.
         */
        dispose(): void;
    }

    /////<viewer
    export abstract class AbstractViewer {
        containerElement: HTMLElement;
        /**
         * The corresponsing template manager of this viewer.
         */
        templateManager: TemplateManager;
        /**
         * Babylon Engine corresponding with this viewer
         */
        engine: BABYLON.Engine;
        /**
         * The Babylon Scene of this viewer
         */
        scene: BABYLON.Scene;
        /**
         * The camera used in this viewer
         */
        camera: BABYLON.ArcRotateCamera;
        /**
         * Babylon's scene optimizer
         */
        sceneOptimizer: BABYLON.SceneOptimizer;
        /**
         * The ID of this viewer. it will be generated randomly or use the HTML Element's ID.
         */
        readonly baseId: string;
        /**
         * Models displayed in this viewer.
         */
        models: Array<ViewerModel>;
        /**
         * The last loader used to load a model.
         */
        lastUsedLoader: BABYLON.ISceneLoaderPlugin | BABYLON.ISceneLoaderPluginAsync;
        /**
         * The ModelLoader instance connected with this viewer.
         */
        modelLoader: ModelLoader;
        /**
         * the viewer configuration object
         */
        protected _configuration: ViewerConfiguration;
        /**
         * Babylon's environment helper of this viewer
         */
        environmentHelper: BABYLON.EnvironmentHelper;
        protected _defaultHighpTextureType: number;
        protected _shadowGeneratorBias: number;
        protected _defaultPipelineTextureType: number;
        /**
         * The maximum number of shadows supported by the curent viewer
         */
        protected _maxShadows: number;
        /**
         * is HDR supported?
         */
        private _hdrSupport;
        /**
         * is this viewer disposed?
         */
        protected _isDisposed: boolean;
        /**
         * Returns a boolean representing HDR support
         */
        readonly isHdrSupported: boolean;
        /**
         * Will notify when the scene was initialized
         */
        onSceneInitObservable: BABYLON.Observable<BABYLON.Scene>;
        /**
         * will notify when the engine was initialized
         */
        onEngineInitObservable: BABYLON.Observable<BABYLON.Engine>;
        /**
         * will notify after every model load
         */
        onModelLoadedObservable: BABYLON.Observable<ViewerModel>;
        /**
         * will notify when any model notify of progress
         */
        onModelLoadProgressObservable: BABYLON.Observable<BABYLON.SceneLoaderProgressEvent>;
        /**
         * will notify when any model load failed.
         */
        onModelLoadErrorObservable: BABYLON.Observable<{
            message: string;
            exception: any;
        }>;
        /**
         * will notify when a new loader was initialized.
         * Used mainly to know when a model starts loading.
         */
        onLoaderInitObservable: BABYLON.Observable<BABYLON.ISceneLoaderPlugin | BABYLON.ISceneLoaderPluginAsync>;
        /**
         * Observers registered here will be executed when the entire load process has finished.
         */
        onInitDoneObservable: BABYLON.Observable<AbstractViewer>;
        /**
         * The canvas associated with this viewer
         */
        protected _canvas: HTMLCanvasElement;
        /**
         * The (single) canvas of this viewer
         */
        readonly canvas: HTMLCanvasElement;
        /**
         * registered onBeforeRender functions.
         * This functions are also registered at the native scene. The reference can be used to unregister them.
         */
        protected _registeredOnBeforeRenderFunctions: Array<() => void>;
        /**
         * The configuration loader of this viewer
         */
        protected _configurationLoader: ConfigurationLoader;
        constructor(containerElement: HTMLElement, initialConfiguration?: ViewerConfiguration);
        /**
         * get the baseId of this viewer
         */
        getBaseId(): string;
        /**
         * Do we have a canvas to render on, and is it a part of the scene
         */
        isCanvasInDOM(): boolean;
        /**
         * The resize function that will be registered with the window object
         */
        protected _resize: () => void;
        /**
         * render loop that will be executed by the engine
         */
        protected _render: () => void;
        /**
         * Update the current viewer configuration with new values.
         * Only provided information will be updated, old configuration values will be kept.
         * If this.configuration was manually changed, you can trigger this function with no parameters,
         * and the entire configuration will be updated.
         * @param newConfiguration
         */
        updateConfiguration(newConfiguration?: Partial<ViewerConfiguration>): void;
        protected _configureEnvironment(skyboxConifguration?: ISkyboxConfiguration | boolean, groundConfiguration?: IGroundConfiguration | boolean): Promise<BABYLON.Scene> | undefined;
        /**
         * internally configure the scene using the provided configuration.
         * The scene will not be recreated, but just updated.
         * @param sceneConfig the (new) scene configuration
         */
        protected _configureScene(sceneConfig: ISceneConfiguration): void;
        /**
         * Configure the scene optimizer.
         * The existing scene optimizer will be disposed and a new one will be created.
         * @param optimizerConfig the (new) optimizer configuration
         */
        protected _configureOptimizer(optimizerConfig: ISceneOptimizerConfiguration | boolean): void;
        /**
         * this is used to register native functions using the configuration object.
         * This will configure the observers.
         * @param observersConfiguration observers configuration
         */
        protected _configureObservers(observersConfiguration: IObserversConfiguration): void;
        /**
         * (Re) configure the camera. The camera will only be created once and from this point will only be reconfigured.
         * @param cameraConfig the new camera configuration
         * @param model optionally use the model to configure the camera.
         */
        protected _configureCamera(cameraConfig: ICameraConfiguration, model?: ViewerModel): void;
        /**
         * configure the lights.
         *
         * @param lightsConfiguration the (new) light(s) configuration
         * @param model optionally use the model to configure the camera.
         */
        protected _configureLights(lightsConfiguration?: {
            [name: string]: ILightConfiguration | boolean;
        }, model?: ViewerModel): void;
        /**
         * configure all models using the configuration.
         * @param modelConfiguration the configuration to use to reconfigure the models
         */
        protected _configureModel(modelConfiguration: Partial<IModelConfiguration>): void;
        /**
         * Dispoe the entire viewer including the scene and the engine
         */
        dispose(): void;
        /**
         * This will prepare the container element for the viewer
         */
        protected abstract _prepareContainerElement(): any;
        /**
         * This function will execute when the HTML templates finished initializing.
         * It should initialize the engine and continue execution.
         *
         * @returns {Promise<AbstractViewer>} The viewer object will be returned after the object was loaded.
         */
        protected _onTemplatesLoaded(): Promise<AbstractViewer>;
        /**
         * Initialize the engine. Retruns a promise in case async calls are needed.
         *
         * @protected
         * @returns {Promise<Engine>}
         * @memberof Viewer
         */
        protected _initEngine(): Promise<BABYLON.Engine>;
        /**
         * initialize the scene. Calling thsi function again will dispose the old scene, if exists.
         */
        protected _initScene(): Promise<BABYLON.Scene>;
        /**
         * Initialize a model loading. The returns object (a ViewerModel object) will be loaded in the background.
         * The difference between this and loadModel is that loadModel will fulfill the promise when the model finished loading.
         *
         * @param modelConfig model configuration to use when loading the model.
         * @param clearScene should the scene be cleared before loading this model
         * @returns a ViewerModel object that is not yet fully loaded.
         */
        initModel(modelConfig: IModelConfiguration, clearScene?: boolean): ViewerModel;
        /**
         * load a model using the provided configuration
         *
         * @param modelConfig the model configuration or URL to load.
         * @param clearScene Should the scene be cleared before loading the model
         * @returns a Promise the fulfills when the model finished loading successfully.
         */
        loadModel(modelConfig?: any, clearScene?: boolean): Promise<ViewerModel>;
        /**
         * initialize the environment for a specific model.
         * Per default it will use the viewer'S configuration.
         * @param model the model to use to configure the environment.
         * @returns a Promise that will resolve when the configuration is done.
         */
        protected _initEnvironment(model?: ViewerModel): Promise<BABYLON.Scene>;
        /**
         * Alters render settings to reduce features based on hardware feature limitations
         * @param options Viewer options to modify
         */
        protected _handleHardwareLimitations(): void;
        /**
         * Injects all the spectre shader in the babylon shader store
         */
        protected _injectCustomShaders(): void;
        /**
         * This will extend an object with configuration values.
         * What it practically does it take the keys from the configuration and set them on the object.
         * I the configuration is a tree, it will traverse into the tree.
         * @param object the object to extend
         * @param config the configuration object that will extend the object
         */
        protected _extendClassWithConfig(object: any, config: any): void;
    }

    export class DefaultViewer extends AbstractViewer {
        containerElement: HTMLElement;
        /**
         * Create a new default viewer
         * @param containerElement the element in which the templates will be rendered
         * @param initialConfiguration the initial configuration. Defaults to extending the default configuration
         */
        constructor(containerElement: HTMLElement, initialConfiguration?: ViewerConfiguration);
        /**
         * Overriding the AbstractViewer's _initScene fcuntion
         */
        protected _initScene(): Promise<BABYLON.Scene>;
        /**
         * This will be executed when the templates initialize.
         */
        protected _onTemplatesLoaded(): Promise<AbstractViewer>;
        private _initNavbar();
        /**
         * Preparing the container element to present the viewer
         */
        protected _prepareContainerElement(): void;
        /**
         * This function will configure the templates and update them after a model was loaded
         * It is mainly responsible to changing the title and subtitle etc'.
         * @param model the model to be used to configure the templates by
         */
        protected _configureTemplate(model: ViewerModel): void;
        /**
         * This will load a new model to the default viewer
         * overriding the AbstractViewer's loadModel.
         * The scene will automatically be cleared of the old models, if exist.
         * @param model the configuration object (or URL) to load.
         */
        loadModel(model?: any): Promise<ViewerModel>;
        private _onModelLoaded;
        /**
         * Show the overlay and the defined sub-screen.
         * Mainly used for help and errors
         * @param subScreen the name of the subScreen. Those can be defined in the configuration object
         */
        showOverlayScreen(subScreen: string): Promise<string> | Promise<Template>;
        /**
         * Hide the overlay screen.
         */
        hideOverlayScreen(): Promise<string> | Promise<Template>;
        /**
         * Show the loading screen.
         * The loading screen can be configured using the configuration object
         */
        showLoadingScreen(): Promise<string> | Promise<Template>;
        /**
         * Hide the loading screen
         */
        hideLoadingScreen(): Promise<string> | Promise<Template>;
        /**
         * An extension of the light configuration of the abstract viewer.
         * @param lightsConfiguration the light configuration to use
         * @param model the model that will be used to configure the lights (if the lights are model-dependant)
         */
        protected _configureLights(lightsConfiguration: {
            [name: string]: boolean | ILightConfiguration;
        } | undefined, model: ViewerModel): void;
    }
}