import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, AnimationGroup, AbstractMesh, Observable, SceneLoaderProgressEvent, ParticleSystem, Skeleton, IDisposable, Nullable, Animation, Material } from "babylonjs";
import { GLTF2 } from "babylonjs-loaders";
import { IModelConfiguration } from "../configuration/configuration";
import { IModelAnimation } from "./modelAnimation";
import { AbstractViewer } from "..";
/**
 * The current state of the model
 */
export declare enum ModelState {
    INIT = 0,
    LOADING = 1,
    LOADED = 2,
    ENTRY = 3,
    ENTRYDONE = 4,
    COMPLETE = 5,
    CANCELED = 6,
    ERROR = 7,
}
/**
 * The viewer model is a container for all assets representing a sngle loaded model.
 */
export declare class ViewerModel implements IDisposable {
    protected _viewer: AbstractViewer;
    /**
     * The loader used to load this model.
     */
    loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync;
    private _animations;
    /**
     * the list of meshes that are a part of this model
     */
    private _meshes;
    /**
     * This model's root mesh (the parent of all other meshes).
     * This mesh does not(!) exist in the meshes array.
     */
    rootMesh: AbstractMesh;
    private _pivotMesh;
    /**
     * ParticleSystems connected to this model
     */
    particleSystems: Array<ParticleSystem>;
    /**
     * Skeletons defined in this model
     */
    skeletons: Array<Skeleton>;
    /**
     * The current model animation.
     * On init, this will be undefined.
     */
    currentAnimation: IModelAnimation;
    /**
     * Observers registered here will be executed when the model is done loading
     */
    onLoadedObservable: Observable<ViewerModel>;
    /**
     * Observers registered here will be executed when the loader notified of a progress event
     */
    onLoadProgressObservable: Observable<SceneLoaderProgressEvent>;
    /**
     * Observers registered here will be executed when the loader notified of an error.
     */
    onLoadErrorObservable: Observable<{
        message: string;
        exception: any;
    }>;
    /**
     * Will be executed after the model finished loading and complete, including entry animation and lod
     */
    onCompleteObservable: Observable<ViewerModel>;
    /**
     * Observers registered here will be executed every time the model is being configured.
     * This can be used to extend the model's configuration without extending the class itself
     */
    onAfterConfigure: Observable<ViewerModel>;
    /**
     * The current model state (loaded, error, etc)
     */
    state: ModelState;
    /**
     * A loadID provided by the modelLoader, unique to ths (Abstract)Viewer instance.
     */
    loadId: number;
    loadInfo: GLTF2.IAsset;
    private _loadedUrl;
    private _modelConfiguration;
    private _loaderDone;
    private _entryAnimation;
    private _exitAnimation;
    private _scaleTransition;
    private _animatables;
    private _frameRate;
    private _shadowsRenderedAfterLoad;
    constructor(_viewer: AbstractViewer, modelConfiguration: IModelConfiguration);
    shadowsRenderedAfterLoad: boolean;
    /**
     * Is this model enabled?
     */
    /**
     * Set whether this model is enabled or not.
     */
    enabled: boolean;
    loaderDone: boolean;
    private _checkCompleteState();
    /**
     * Get the viewer showing this model
     */
    getViewer(): AbstractViewer;
    /**
     * Add a mesh to this model.
     * Any mesh that has no parent will be provided with the root mesh as its new parent.
     *
     * @param mesh the new mesh to add
     * @param triggerLoaded should this mesh trigger the onLoaded observable. Used when adding meshes manually.
     */
    addMesh(mesh: AbstractMesh, triggerLoaded?: boolean): Promise<ViewerModel> | undefined;
    /**
     * get the list of meshes (excluding the root mesh)
     */
    readonly meshes: AbstractMesh[];
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
    private _initAnimations();
    /**
     * Animates the model from the current position to the default position
     * @param completeCallback A function to call when the animation has completed
     */
    private _enterScene(completeCallback?);
    /**
     * Animates the model from the current position to the exit-screen position
     * @param completeCallback A function to call when the animation has completed
     */
    private _exitScene(completeCallback);
    private _modelComplete();
    /**
     * Add a new animation group to this model.
     * @param animationGroup the new animation group to be added
     */
    addAnimationGroup(animationGroup: AnimationGroup): void;
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
    protected _getAnimationByName(name: string): Nullable<IModelAnimation>;
    /**
     * Choose an initialized animation using its name and start playing it
     * @param name the name of the animation to play
     * @returns The model aniamtion to be played.
     */
    playAnimation(name: string): IModelAnimation;
    setCurrentAnimationByName(name: string): IModelAnimation;
    private _configureModel();
    private _modelAnimationConfigurationToObject(animConfig);
    /**
     * Apply a material configuration to a material
     * @param material Material to apply configuration to
     */
    _applyModelMaterialConfiguration(material: Material): void;
    /**
     * Start entry/exit animation given an animation configuration
     * @param animationConfiguration Entry/Exit animation configuration
     * @param isEntry Pass true if the animation is an entry animation
     * @param completeCallback Callback to execute when the animation completes
     */
    private _applyAnimation(animationConfiguration, isEntry, completeCallback?);
    /**
    * Begin @animations with the specified @easingFunction
    * @param animations The BABYLON Animations to begin
    * @param duration of transition, in seconds
    * @param easingFunction An easing function to apply
    * @param easingMode A easing mode to apply to the easingFunction
    * @param onAnimationEnd Call back trigger at the end of the animation.
    */
    transitionTo(animations: Animation[], duration: number, easingFunction: any, easingMode: number | undefined, onAnimationEnd: () => void): void;
    /**
     * Sets key values on an Animation from first to last frame.
     * @param animation The Babylon animation object to set keys on
     * @param startValue The value of the first key
     * @param endValue The value of the last key
     * @param duration The duration of the animation, used to determine the end frame
     */
    private _setLinearKeys(animation, startValue, endValue, duration);
    /**
     * Creates and returns a Babylon easing funtion object based on a string representing the Easing function
     * @param easingFunctionID The enum of the easing funtion to create
     * @return The newly created Babylon easing function object
     */
    private _createEasingFunction(easingFunctionID?);
    /**
     * Stops and removes all animations that have been applied to the model
     */
    stopAllAnimations(): void;
    /**
     * Will remove this model from the viewer (but NOT dispose it).
     */
    remove(): void;
    /**
     * Dispose this model, including all of its associated assets.
     */
    dispose(): void;
}
