import { SceneManager } from './sceneManager';
import { TemplateManager } from './../templateManager';
import { ConfigurationLoader } from './../configuration/loader';
import { Observable, Engine, Scene, SceneLoaderProgressEvent, ISceneLoaderPlugin, ISceneLoaderPluginAsync } from 'babylonjs';
import { ViewerConfiguration, IObserversConfiguration, IModelConfiguration } from '../configuration/configuration';
import { ViewerModel } from '../model/viewerModel';
import { ModelLoader } from '../loader/modelLoader';
/**
 * The AbstractViewr is the center of Babylon's viewer.
 * It is the basic implementation of the default viewer and is responsible of loading and showing the model and the templates
 */
export declare abstract class AbstractViewer {
    containerElement: HTMLElement;
    /**
     * The corresponsing template manager of this viewer.
     */
    templateManager: TemplateManager;
    /**
     * Babylon Engine corresponding with this viewer
     */
    engine: Engine;
    /**
     * The ID of this viewer. it will be generated randomly or use the HTML Element's ID.
     */
    readonly baseId: string;
    /**
     * The last loader used to load a model.
     * @deprecated
     */
    lastUsedLoader: ISceneLoaderPlugin | ISceneLoaderPluginAsync;
    /**
     * The ModelLoader instance connected with this viewer.
     */
    modelLoader: ModelLoader;
    /**
     * A flag that controls whether or not the render loop should be executed
     */
    runRenderLoop: boolean;
    /**
     * The scene manager connected with this viewer instance
     */
    sceneManager: SceneManager;
    /**
     * the viewer configuration object
     */
    protected _configuration: ViewerConfiguration;
    /**
     * Will notify when the scene was initialized
     */
    onSceneInitObservable: Observable<Scene>;
    /**
     * will notify when the engine was initialized
     */
    onEngineInitObservable: Observable<Engine>;
    /**
     * Will notify when a new model was added to the scene.
     * Note that added does not neccessarily mean loaded!
     */
    onModelAddedObservable: Observable<ViewerModel>;
    /**
     * will notify after every model load
     */
    onModelLoadedObservable: Observable<ViewerModel>;
    /**
     * will notify when any model notify of progress
     */
    onModelLoadProgressObservable: Observable<SceneLoaderProgressEvent>;
    /**
     * will notify when any model load failed.
     */
    onModelLoadErrorObservable: Observable<{
        message: string;
        exception: any;
    }>;
    /**
     * Will notify when a model was removed from the scene;
     */
    onModelRemovedObservable: Observable<ViewerModel>;
    /**
     * will notify when a new loader was initialized.
     * Used mainly to know when a model starts loading.
     */
    onLoaderInitObservable: Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
    /**
     * Observers registered here will be executed when the entire load process has finished.
     */
    onInitDoneObservable: Observable<AbstractViewer>;
    /**
     * Functions added to this observable will be executed on each frame rendered.
     */
    onFrameRenderedObservable: Observable<AbstractViewer>;
    /**
     * The canvas associated with this viewer
     */
    protected _canvas: HTMLCanvasElement;
    /**
     * The (single) canvas of this viewer
     */
    readonly canvas: HTMLCanvasElement;
    /**
     * is this viewer disposed?
     */
    protected _isDisposed: boolean;
    /**
     * registered onBeforeRender functions.
     * This functions are also registered at the native scene. The reference can be used to unregister them.
     */
    protected _registeredOnBeforeRenderFunctions: Array<() => void>;
    /**
     * The configuration loader of this viewer
     */
    protected _configurationLoader: ConfigurationLoader;
    /**
     * Is the viewer already initialized. for internal use.
     */
    protected _isInit: boolean;
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
     * Is the engine currently set to rende even when the page is in background
     */
    /**
     * Set the viewer's background rendering flag.
     */
    renderInBackground: boolean;
    /**
     * Get the configuration object. This is a reference only.
     * The configuration can ONLY be updated using the updateConfiguration function.
     * changing this object will have no direct effect on the scene.
     */
    readonly configuration: ViewerConfiguration;
    /**
     * force resizing the engine.
     */
    forceResize(): void;
    /**
     * The resize function that will be registered with the window object
     */
    protected _resize: () => void;
    /**
     * Force a single render loop execution.
     */
    forceRender(): void;
    /**
     * render loop that will be executed by the engine
     */
    protected _render: (force?: boolean) => void;
    /**
     * Takes a screenshot of the scene and returns it as a base64 encoded png.
     * @param callback optional callback that will be triggered when screenshot is done.
     * @param width Optional screenshot width (default to 512).
     * @param height Optional screenshot height (default to 512).
     * @returns a promise with the screenshot data
     */
    takeScreenshot(callback?: (data: string) => void, width?: number, height?: number): Promise<string>;
    /**
     * Update the current viewer configuration with new values.
     * Only provided information will be updated, old configuration values will be kept.
     * If this.configuration was manually changed, you can trigger this function with no parameters,
     * and the entire configuration will be updated.
     * @param newConfiguration the partial configuration to update
     *
     */
    updateConfiguration(newConfiguration?: Partial<ViewerConfiguration>): void;
    /**
     * this is used to register native functions using the configuration object.
     * This will configure the observers.
     * @param observersConfiguration observers configuration
     */
    protected _configureObservers(observersConfiguration: IObserversConfiguration): void;
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
     * This will force the creation of an engine and a scene.
     * It will also load a model if preconfigured.
     * But first - it will load the extendible onTemplateLoaded()!
     */
    private _onTemplateLoaded();
    /**
     * Initialize the engine. Retruns a promise in case async calls are needed.
     *
     * @protected
     * @returns {Promise<Engine>}
     * @memberof Viewer
     */
    protected _initEngine(): Promise<Engine>;
    private _isLoading;
    /**
     * Initialize a model loading. The returned object (a ViewerModel object) will be loaded in the background.
     * The difference between this and loadModel is that loadModel will fulfill the promise when the model finished loading.
     *
     * @param modelConfig model configuration to use when loading the model.
     * @param clearScene should the scene be cleared before loading this model
     * @returns a ViewerModel object that is not yet fully loaded.
     */
    initModel(modelConfig: string | File | IModelConfiguration, clearScene?: boolean): ViewerModel;
    /**
     * load a model using the provided configuration.
     * This function, as opposed to initModel, will return a promise that resolves when the model is loaded, and rejects with error.
     * If you want to attach to the observables of the model, use initModle instead.
     *
     * @param modelConfig the model configuration or URL to load.
     * @param clearScene Should the scene be cleared before loading the model
     * @returns a Promise the fulfills when the model finished loading successfully.
     */
    loadModel(modelConfig: string | File | IModelConfiguration, clearScene?: boolean): Promise<ViewerModel>;
    private _fpsTimeoutInterval;
    protected _initTelemetryEvents(): void;
    /**
     * Injects all the spectre shader in the babylon shader store
     */
    protected _injectCustomShaders(): void;
}
