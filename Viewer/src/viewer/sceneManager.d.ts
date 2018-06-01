import { Scene, ArcRotateCamera, Light, SceneOptimizer, EnvironmentHelper, Color3, Observable, DefaultRenderingPipeline, Nullable } from 'babylonjs';
import { AbstractViewer } from './viewer';
import { ILightConfiguration, ISceneConfiguration, ISceneOptimizerConfiguration, ICameraConfiguration, ISkyboxConfiguration, ViewerConfiguration, IGroundConfiguration, IModelConfiguration } from '../configuration/configuration';
import { ViewerModel } from '../model/viewerModel';
import { ViewerLabs } from '../labs/viewerLabs';
/**
 * This interface describes the structure of the variable sent with the configuration observables of the scene manager.
 * O - the type of object we are dealing with (Light, ArcRotateCamera, Scene, etc')
 * T - the configuration type
 */
export interface IPostConfigurationCallback<OBJ, CONF> {
    newConfiguration: CONF;
    sceneManager: SceneManager;
    object: OBJ;
    model?: ViewerModel;
}
export declare class SceneManager {
    private _viewer;
    /**
     * Will notify when the scene was initialized
     */
    onSceneInitObservable: Observable<Scene>;
    /**
     * Will notify after the scene was configured. Can be used to further configure the scene
     */
    onSceneConfiguredObservable: Observable<IPostConfigurationCallback<Scene, ISceneConfiguration>>;
    /**
     * Will notify after the scene optimized was configured. Can be used to further configure the scene optimizer
     */
    onSceneOptimizerConfiguredObservable: Observable<IPostConfigurationCallback<SceneOptimizer, ISceneOptimizerConfiguration | boolean>>;
    /**
     * Will notify after the camera was configured. Can be used to further configure the camera
     */
    onCameraConfiguredObservable: Observable<IPostConfigurationCallback<ArcRotateCamera, ICameraConfiguration>>;
    /**
     * Will notify after the lights were configured. Can be used to further configure lights
     */
    onLightsConfiguredObservable: Observable<IPostConfigurationCallback<Array<Light>, {
        [name: string]: ILightConfiguration | boolean | number;
    }>>;
    /**
     * Will notify after the model(s) were configured. Can be used to further configure models
     */
    onModelsConfiguredObservable: Observable<IPostConfigurationCallback<Array<ViewerModel>, IModelConfiguration>>;
    /**
     * Will notify after the envirnoment was configured. Can be used to further configure the environment
     */
    onEnvironmentConfiguredObservable: Observable<IPostConfigurationCallback<EnvironmentHelper, {
        skybox?: ISkyboxConfiguration | boolean;
        ground?: IGroundConfiguration | boolean;
    }>>;
    /**
     * The Babylon Scene of this viewer
     */
    scene: Scene;
    /**
     * The camera used in this viewer
     */
    camera: ArcRotateCamera;
    /**
     * Babylon's scene optimizer
     */
    sceneOptimizer: SceneOptimizer;
    /**
     * Models displayed in this viewer.
     */
    models: Array<ViewerModel>;
    /**
     * Babylon's environment helper of this viewer
     */
    environmentHelper: EnvironmentHelper;
    private _animationBlendingEnabled;
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
    private _mainColor;
    private _reflectionColor;
    private readonly _white;
    private _forceShadowUpdate;
    /**
     * The labs variable consists of objects that will have their API change.
     * Please be careful when using labs in production.
     */
    labs: ViewerLabs;
    private _defaultRenderingPipeline;
    readonly defaultRenderingPipeline: Nullable<DefaultRenderingPipeline>;
    constructor(_viewer: AbstractViewer);
    /**
     * Returns a boolean representing HDR support
     */
    readonly isHdrSupported: boolean;
    /**
     * Return the main color defined in the configuration.
     */
    readonly mainColor: Color3;
    readonly reflectionColor: Color3;
    animationBlendingEnabled: boolean;
    private _processShadows;
    /**
     * The flag defining whether shadows are rendered constantly or once.
     */
    /**
     * Should shadows be rendered every frame, or only once and stop.
     * This can be used to optimize a scene.
     *
     * Not that the shadows will NOT disapear but will remain in place.
     * @param process if true shadows will be updated once every frame. if false they will stop being updated.
     */
    processShadows: boolean;
    private _groundEnabled;
    groundEnabled: boolean;
    private _groundMirrorEnabled;
    /**
     * gets wether the reflection is disabled.
     */
    /**
     * sets wether the reflection is disabled.
     */
    groundMirrorEnabled: boolean;
    private _defaultRenderingPipelineEnabled;
    defaultRenderingPipelineEnabled: boolean;
    /**
     * Sets the engine flags to unlock all babylon features.
     * Can also be configured using the scene.flags configuration object
     */
    unlockBabylonFeatures(): void;
    /**
     * initialize the scene. Calling this function again will dispose the old scene, if exists.
     */
    initScene(sceneConfiguration?: ISceneConfiguration, optimizerConfiguration?: boolean | ISceneOptimizerConfiguration): Promise<Scene>;
    clearScene(clearModels?: boolean, clearLights?: boolean): void;
    /**
     * This will update the scene's configuration, including camera, lights, environment.
     * @param newConfiguration the delta that should be configured. This includes only the changes
     * @param globalConfiguration The global configuration object, after the new configuration was merged into it
     */
    updateConfiguration(newConfiguration: Partial<ViewerConfiguration>, globalConfiguration: ViewerConfiguration): void;
    private _defaultRenderingPipelineShouldBuild;
    private _rebuildPostprocesses(configuration?);
    private _bloomEnabled;
    bloomEnabled: boolean;
    private _fxaaEnabled;
    fxaaEnabled: boolean;
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
     * configure all models using the configuration.
     * @param modelConfiguration the configuration to use to reconfigure the models
     */
    /**
     * (Re) configure the camera. The camera will only be created once and from this point will only be reconfigured.
     * @param cameraConfig the new camera configuration
     * @param model optionally use the model to configure the camera.
     */
    protected _configureCamera(cameraConfig?: ICameraConfiguration): void;
    private _focusOnModel;
    protected _configureEnvironment(skyboxConifguration?: ISkyboxConfiguration | boolean, groundConfiguration?: IGroundConfiguration | boolean): void;
    /**
     * configure the lights.
     *
     * @param lightsConfiguration the (new) light(s) configuration
     * @param model optionally use the model to configure the camera.
     */
    protected _configureLights(lightsConfiguration?: {
        [name: string]: ILightConfiguration | boolean | number;
    }): void;
    private _shadowGroundPlane;
    private _updateShadowRenderList(shadowGenerator, model?, resetList?);
    private _updateGroundMirrorRenderList(model?, resetList?);
    /**
     * Gets the shadow map blur kernel according to the light configuration.
     * @param light The light used to generate the shadows
     * @param bufferSize The size of the shadow map
     * @return the kernel blur size
     */
    getBlurKernel(light: BABYLON.IShadowLight, bufferSize: number): number;
    /**
     * Alters render settings to reduce features based on hardware feature limitations
     * @param enableHDR Allows the viewer to run in HDR mode.
     */
    protected _handleHardwareLimitations(enableHDR?: boolean): void;
    /**
     * Dispoe the entire viewer including the scene and the engine
     */
    dispose(): void;
    private _cameraBehaviorMapping;
    private _setCameraBehavior(name, behaviorConfig, payload?);
}
