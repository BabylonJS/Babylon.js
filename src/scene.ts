import { Nullable } from "./types";
import { Tools } from "./Misc/tools";
import { IAnimatable } from './Animations/animatable.interface';
import { PrecisionDate } from "./Misc/precisionDate";
import { Observable, Observer } from "./Misc/observable";
import { SmartArrayNoDuplicate, SmartArray, ISmartArrayLike } from "./Misc/smartArray";
import { StringDictionary } from "./Misc/stringDictionary";
import { Tags } from "./Misc/tags";
import { Vector2, Vector3, Matrix } from "./Maths/math.vector";
import { Geometry } from "./Meshes/geometry";
import { TransformNode } from "./Meshes/transformNode";
import { SubMesh } from "./Meshes/subMesh";
import { AbstractMesh } from "./Meshes/abstractMesh";
import { Mesh } from "./Meshes/mesh";
import { IParticleSystem } from "./Particles/IParticleSystem";
import { Bone } from "./Bones/bone";
import { Skeleton } from "./Bones/skeleton";
import { MorphTargetManager } from "./Morph/morphTargetManager";
import { Camera } from "./Cameras/camera";
import { AbstractScene } from "./abstractScene";
import { BaseTexture } from "./Materials/Textures/baseTexture";
import { Texture } from "./Materials/Textures/texture";
import { RenderTargetTexture } from "./Materials/Textures/renderTargetTexture";
import { Material } from "./Materials/material";
import { ImageProcessingConfiguration } from "./Materials/imageProcessingConfiguration";
import { Effect } from "./Materials/effect";
import { UniformBuffer } from "./Materials/uniformBuffer";
import { MultiMaterial } from "./Materials/multiMaterial";
import { Light } from "./Lights/light";
import { PickingInfo } from "./Collisions/pickingInfo";
import { ICollisionCoordinator } from "./Collisions/collisionCoordinator";
import { PointerEventTypes, PointerInfoPre, PointerInfo } from "./Events/pointerEvents";
import { KeyboardInfoPre, KeyboardInfo } from "./Events/keyboardEvents";
import { ActionEvent } from "./Actions/actionEvent";
import { PostProcess } from "./PostProcesses/postProcess";
import { PostProcessManager } from "./PostProcesses/postProcessManager";
import { IOfflineProvider } from "./Offline/IOfflineProvider";
import { RenderingGroupInfo, RenderingManager, IRenderingManagerAutoClearSetup } from "./Rendering/renderingManager";
import { ISceneComponent, ISceneSerializableComponent, Stage, SimpleStageAction, RenderTargetsStageAction, RenderTargetStageAction, MeshStageAction, EvaluateSubMeshStageAction, ActiveMeshStageAction, CameraStageAction, RenderingGroupStageAction, RenderingMeshStageAction, PointerMoveStageAction, PointerUpDownStageAction, CameraStageFrameBufferAction } from "./sceneComponent";
import { Engine } from "./Engines/engine";
import { Node } from "./node";
import { MorphTarget } from "./Morph/morphTarget";
import { Constants } from "./Engines/constants";
import { DomManagement } from "./Misc/domManagement";
import { Logger } from "./Misc/logger";
import { EngineStore } from "./Engines/engineStore";
import { AbstractActionManager } from './Actions/abstractActionManager';
import { _DevTools } from './Misc/devTools';
import { WebRequest } from './Misc/webRequest';
import { InputManager } from './Inputs/scene.inputManager';
import { PerfCounter } from './Misc/perfCounter';
import { IFileRequest } from './Misc/fileRequest';
import { Color4, Color3 } from './Maths/math.color';
import { Plane } from './Maths/math.plane';
import { Frustum } from './Maths/math.frustum';
import { UniqueIdGenerator } from './Misc/uniqueIdGenerator';
import { FileTools, LoadFileError, RequestFileError, ReadFileError } from './Misc/fileTools';

declare type Ray = import("./Culling/ray").Ray;
declare type TrianglePickingPredicate = import("./Culling/ray").TrianglePickingPredicate;
declare type Animation = import("./Animations/animation").Animation;
declare type Animatable = import("./Animations/animatable").Animatable;
declare type AnimationGroup = import("./Animations/animationGroup").AnimationGroup;
declare type AnimationPropertiesOverride = import("./Animations/animationPropertiesOverride").AnimationPropertiesOverride;
declare type Collider = import("./Collisions/collider").Collider;

/**
 * Define an interface for all classes that will hold resources
 */
export interface IDisposable {
    /**
     * Releases all held resources
     */
    dispose(): void;
}

/** Interface defining initialization parameters for Scene class */
export interface SceneOptions {
    /**
     * Defines that scene should keep up-to-date a map of geometry to enable fast look-up by uniqueId
     * It will improve performance when the number of geometries becomes important.
     */
    useGeometryUniqueIdsMap?: boolean;

    /**
     * Defines that each material of the scene should keep up-to-date a map of referencing meshes for fast diposing
     * It will improve performance when the number of mesh becomes important, but might consume a bit more memory
     */
    useMaterialMeshMap?: boolean;

    /**
     * Defines that each mesh of the scene should keep up-to-date a map of referencing cloned meshes for fast diposing
     * It will improve performance when the number of mesh becomes important, but might consume a bit more memory
     */
    useClonedMeshMap?: boolean;

    /** Defines if the creation of the scene should impact the engine (Eg. UtilityLayer's scene) */
    virtual?: boolean;
}

/**
 * Represents a scene to be rendered by the engine.
 * @see http://doc.babylonjs.com/features/scene
 */
export class Scene extends AbstractScene implements IAnimatable {
    /** The fog is deactivated */
    public static readonly FOGMODE_NONE = 0;
    /** The fog density is following an exponential function */
    public static readonly FOGMODE_EXP = 1;
    /** The fog density is following an exponential function faster than FOGMODE_EXP */
    public static readonly FOGMODE_EXP2 = 2;
    /** The fog density is following a linear function. */
    public static readonly FOGMODE_LINEAR = 3;

    /**
     * Gets or sets the minimum deltatime when deterministic lock step is enabled
     * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
     */
    public static MinDeltaTime = 1.0;
    /**
     * Gets or sets the maximum deltatime when deterministic lock step is enabled
     * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
     */
    public static MaxDeltaTime = 1000.0;

    /**
     * Factory used to create the default material.
     * @param name The name of the material to create
     * @param scene The scene to create the material for
     * @returns The default material
     */
    public static DefaultMaterialFactory(scene: Scene): Material {
        throw _DevTools.WarnImport("StandardMaterial");
    }

    /**
     * Factory used to create the a collision coordinator.
     * @returns The collision coordinator
     */
    public static CollisionCoordinatorFactory(): ICollisionCoordinator {
        throw _DevTools.WarnImport("DefaultCollisionCoordinator");
    }

    // Members

    /** @hidden */
    public _inputManager = new InputManager(this);

    /** Define this parameter if you are using multiple cameras and you want to specify which one should be used for pointer position */
    public cameraToUseForPointers: Nullable<Camera> = null;

    /** @hidden */
    public readonly _isScene = true;

    /** @hidden */
    public _blockEntityCollection = false;

    /**
     * Gets or sets a boolean that indicates if the scene must clear the render buffer before rendering a frame
     */
    public autoClear = true;
    /**
     * Gets or sets a boolean that indicates if the scene must clear the depth and stencil buffers before rendering a frame
     */
    public autoClearDepthAndStencil = true;
    /**
     * Defines the color used to clear the render buffer (Default is (0.2, 0.2, 0.3, 1.0))
     */
    public clearColor: Color4 = new Color4(0.2, 0.2, 0.3, 1.0);
    /**
     * Defines the color used to simulate the ambient color (Default is (0, 0, 0))
     */
    public ambientColor = new Color3(0, 0, 0);

    /**
     * Defines the ratio real world => scene units.
     * Used for subsurface scattering
     */
    public metersPerUnit: number = 1;

    /**
     * This is use to store the default BRDF lookup for PBR materials in your scene.
     * It should only be one of the following (if not the default embedded one):
     * * For uncorrelated BRDF (pbr.brdf.useEnergyConservation = false and pbr.brdf.useSmithVisibilityHeightCorrelated = false) : https://assets.babylonjs.com/environments/uncorrelatedBRDF.dds
     * * For correlated BRDF (pbr.brdf.useEnergyConservation = false and pbr.brdf.useSmithVisibilityHeightCorrelated = true) : https://assets.babylonjs.com/environments/correlatedBRDF.dds
     * * For correlated multi scattering BRDF (pbr.brdf.useEnergyConservation = true and pbr.brdf.useSmithVisibilityHeightCorrelated = true) : https://assets.babylonjs.com/environments/correlatedMSBRDF.dds
     * The material properties need to be setup according to the type of texture in use.
     */
    public environmentBRDFTexture: BaseTexture;

    /** @hidden */
    protected _environmentTexture: Nullable<BaseTexture>;
    /**
     * Texture used in all pbr material as the reflection texture.
     * As in the majority of the scene they are the same (exception for multi room and so on),
     * this is easier to reference from here than from all the materials.
     */
    public get environmentTexture(): Nullable<BaseTexture> {
        return this._environmentTexture;
    }
    /**
     * Texture used in all pbr material as the reflection texture.
     * As in the majority of the scene they are the same (exception for multi room and so on),
     * this is easier to set here than in all the materials.
     */
    public set environmentTexture(value: Nullable<BaseTexture>) {
        if (this._environmentTexture === value) {
            return;
        }

        this._environmentTexture = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    /** @hidden */
    protected _environmentIntensity: number = 1;
    /**
     * Intensity of the environment in all pbr material.
     * This dims or reinforces the IBL lighting overall (reflection and diffuse).
     * As in the majority of the scene they are the same (exception for multi room and so on),
     * this is easier to reference from here than from all the materials.
     */
    public get environmentIntensity(): number {
        return this._environmentIntensity;
    }
    /**
     * Intensity of the environment in all pbr material.
     * This dims or reinforces the IBL lighting overall (reflection and diffuse).
     * As in the majority of the scene they are the same (exception for multi room and so on),
     * this is easier to set here than in all the materials.
     */
    public set environmentIntensity(value: number) {
        if (this._environmentIntensity === value) {
            return;
        }

        this._environmentIntensity = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    /** @hidden */
    protected _imageProcessingConfiguration: ImageProcessingConfiguration;
    /**
     * Default image processing configuration used either in the rendering
     * Forward main pass or through the imageProcessingPostProcess if present.
     * As in the majority of the scene they are the same (exception for multi camera),
     * this is easier to reference from here than from all the materials and post process.
     *
     * No setter as we it is a shared configuration, you can set the values instead.
     */
    public get imageProcessingConfiguration(): ImageProcessingConfiguration {
        return this._imageProcessingConfiguration;
    }

    private _forceWireframe = false;
    /**
     * Gets or sets a boolean indicating if all rendering must be done in wireframe
     */
    public set forceWireframe(value: boolean) {
        if (this._forceWireframe === value) {
            return;
        }
        this._forceWireframe = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_MiscDirtyFlag);
    }
    public get forceWireframe(): boolean {
        return this._forceWireframe;
    }

    private _skipFrustumClipping = false;
    /**
     * Gets or sets a boolean indicating if we should skip the frustum clipping part of the active meshes selection
     */
    public set skipFrustumClipping(value: boolean) {
        if (this._skipFrustumClipping === value) {
            return;
        }
        this._skipFrustumClipping = value;
    }
    public get skipFrustumClipping(): boolean {
        return this._skipFrustumClipping;
    }

    private _forcePointsCloud = false;
    /**
     * Gets or sets a boolean indicating if all rendering must be done in point cloud
     */
    public set forcePointsCloud(value: boolean) {
        if (this._forcePointsCloud === value) {
            return;
        }
        this._forcePointsCloud = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_MiscDirtyFlag);
    }
    public get forcePointsCloud(): boolean {
        return this._forcePointsCloud;
    }

    /**
     * Gets or sets the active clipplane 1
     */
    public clipPlane: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 2
     */
    public clipPlane2: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 3
     */
    public clipPlane3: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 4
     */
    public clipPlane4: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 5
     */
    public clipPlane5: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 6
     */
    public clipPlane6: Nullable<Plane>;

    /**
     * Gets or sets a boolean indicating if animations are enabled
     */
    public animationsEnabled = true;

    private _animationPropertiesOverride: Nullable<AnimationPropertiesOverride> = null;

    /**
     * Gets or sets the animation properties override
     */
    public get animationPropertiesOverride(): Nullable<AnimationPropertiesOverride> {
        return this._animationPropertiesOverride;
    }

    public set animationPropertiesOverride(value: Nullable<AnimationPropertiesOverride>) {
        this._animationPropertiesOverride = value;
    }

    /**
     * Gets or sets a boolean indicating if a constant deltatime has to be used
     * This is mostly useful for testing purposes when you do not want the animations to scale with the framerate
     */
    public useConstantAnimationDeltaTime = false;
    /**
     * Gets or sets a boolean indicating if the scene must keep the meshUnderPointer property updated
     * Please note that it requires to run a ray cast through the scene on every frame
     */
    public constantlyUpdateMeshUnderPointer = false;

    /**
     * Defines the HTML cursor to use when hovering over interactive elements
     */
    public hoverCursor = "pointer";
    /**
     * Defines the HTML default cursor to use (empty by default)
     */
    public defaultCursor: string = "";
    /**
     * Defines whether cursors are handled by the scene.
     */
    public doNotHandleCursors = false;
    /**
     * This is used to call preventDefault() on pointer down
     * in order to block unwanted artifacts like system double clicks
     */
    public preventDefaultOnPointerDown = true;

    /**
     * This is used to call preventDefault() on pointer up
     * in order to block unwanted artifacts like system double clicks
     */
    public preventDefaultOnPointerUp = true;

    // Metadata
    /**
     * Gets or sets user defined metadata
     */
    public metadata: any = null;

    /**
     * For internal use only. Please do not use.
     */
    public reservedDataStore: any = null;

    /**
     * Gets the name of the plugin used to load this scene (null by default)
     */
    public loadingPluginName: string;

    /**
     * Use this array to add regular expressions used to disable offline support for specific urls
     */
    public disableOfflineSupportExceptionRules = new Array<RegExp>();

    /**
    * An event triggered when the scene is disposed.
    */
    public onDisposeObservable = new Observable<Scene>();

    private _onDisposeObserver: Nullable<Observer<Scene>> = null;
    /** Sets a function to be executed when this scene is disposed. */
    public set onDispose(callback: () => void) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }

    /**
    * An event triggered before rendering the scene (right after animations and physics)
    */
    public onBeforeRenderObservable = new Observable<Scene>();

    private _onBeforeRenderObserver: Nullable<Observer<Scene>> = null;
    /** Sets a function to be executed before rendering this scene */
    public set beforeRender(callback: Nullable<() => void>) {
        if (this._onBeforeRenderObserver) {
            this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        }
        if (callback) {
            this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
        }
    }

    /**
    * An event triggered after rendering the scene
    */
    public onAfterRenderObservable = new Observable<Scene>();

    /**
    * An event triggered after rendering the scene for an active camera (When scene.render is called this will be called after each camera)
    */
    public onAfterRenderCameraObservable = new Observable<Camera>();

    private _onAfterRenderObserver: Nullable<Observer<Scene>> = null;
    /** Sets a function to be executed after rendering this scene */
    public set afterRender(callback: Nullable<() => void>) {
        if (this._onAfterRenderObserver) {
            this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
        }

        if (callback) {
            this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
        }
    }

    /**
    * An event triggered before animating the scene
    */
    public onBeforeAnimationsObservable = new Observable<Scene>();

    /**
    * An event triggered after animations processing
    */
    public onAfterAnimationsObservable = new Observable<Scene>();

    /**
    * An event triggered before draw calls are ready to be sent
    */
    public onBeforeDrawPhaseObservable = new Observable<Scene>();

    /**
    * An event triggered after draw calls have been sent
    */
    public onAfterDrawPhaseObservable = new Observable<Scene>();

    /**
    * An event triggered when the scene is ready
    */
    public onReadyObservable = new Observable<Scene>();

    /**
    * An event triggered before rendering a camera
    */
    public onBeforeCameraRenderObservable = new Observable<Camera>();

    private _onBeforeCameraRenderObserver: Nullable<Observer<Camera>> = null;
    /** Sets a function to be executed before rendering a camera*/
    public set beforeCameraRender(callback: () => void) {
        if (this._onBeforeCameraRenderObserver) {
            this.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
        }

        this._onBeforeCameraRenderObserver = this.onBeforeCameraRenderObservable.add(callback);
    }

    /**
    * An event triggered after rendering a camera
    */
    public onAfterCameraRenderObservable = new Observable<Camera>();

    private _onAfterCameraRenderObserver: Nullable<Observer<Camera>> = null;
    /** Sets a function to be executed after rendering a camera*/
    public set afterCameraRender(callback: () => void) {
        if (this._onAfterCameraRenderObserver) {
            this.onAfterCameraRenderObservable.remove(this._onAfterCameraRenderObserver);
        }
        this._onAfterCameraRenderObserver = this.onAfterCameraRenderObservable.add(callback);
    }

    /**
    * An event triggered when active meshes evaluation is about to start
    */
    public onBeforeActiveMeshesEvaluationObservable = new Observable<Scene>();

    /**
    * An event triggered when active meshes evaluation is done
    */
    public onAfterActiveMeshesEvaluationObservable = new Observable<Scene>();

    /**
    * An event triggered when particles rendering is about to start
    * Note: This event can be trigger more than once per frame (because particles can be rendered by render target textures as well)
    */
    public onBeforeParticlesRenderingObservable = new Observable<Scene>();

    /**
    * An event triggered when particles rendering is done
    * Note: This event can be trigger more than once per frame (because particles can be rendered by render target textures as well)
    */
    public onAfterParticlesRenderingObservable = new Observable<Scene>();

    /**
    * An event triggered when SceneLoader.Append or SceneLoader.Load or SceneLoader.ImportMesh were successfully executed
    */
    public onDataLoadedObservable = new Observable<Scene>();

    /**
    * An event triggered when a camera is created
    */
    public onNewCameraAddedObservable = new Observable<Camera>();

    /**
    * An event triggered when a camera is removed
    */
    public onCameraRemovedObservable = new Observable<Camera>();

    /**
    * An event triggered when a light is created
    */
    public onNewLightAddedObservable = new Observable<Light>();

    /**
    * An event triggered when a light is removed
    */
    public onLightRemovedObservable = new Observable<Light>();

    /**
    * An event triggered when a geometry is created
    */
    public onNewGeometryAddedObservable = new Observable<Geometry>();

    /**
    * An event triggered when a geometry is removed
    */
    public onGeometryRemovedObservable = new Observable<Geometry>();

    /**
    * An event triggered when a transform node is created
    */
    public onNewTransformNodeAddedObservable = new Observable<TransformNode>();

    /**
    * An event triggered when a transform node is removed
    */
    public onTransformNodeRemovedObservable = new Observable<TransformNode>();

    /**
    * An event triggered when a mesh is created
    */
    public onNewMeshAddedObservable = new Observable<AbstractMesh>();

    /**
    * An event triggered when a mesh is removed
    */
    public onMeshRemovedObservable = new Observable<AbstractMesh>();

    /**
     * An event triggered when a skeleton is created
     */
    public onNewSkeletonAddedObservable = new Observable<Skeleton>();

    /**
    * An event triggered when a skeleton is removed
    */
    public onSkeletonRemovedObservable = new Observable<Skeleton>();

    /**
    * An event triggered when a material is created
    */
    public onNewMaterialAddedObservable = new Observable<Material>();

    /**
    * An event triggered when a material is removed
    */
    public onMaterialRemovedObservable = new Observable<Material>();

    /**
    * An event triggered when a texture is created
    */
    public onNewTextureAddedObservable = new Observable<BaseTexture>();

    /**
    * An event triggered when a texture is removed
    */
    public onTextureRemovedObservable = new Observable<BaseTexture>();

    /**
    * An event triggered when render targets are about to be rendered
    * Can happen multiple times per frame.
    */
    public onBeforeRenderTargetsRenderObservable = new Observable<Scene>();

    /**
    * An event triggered when render targets were rendered.
    * Can happen multiple times per frame.
    */
    public onAfterRenderTargetsRenderObservable = new Observable<Scene>();

    /**
    * An event triggered before calculating deterministic simulation step
    */
    public onBeforeStepObservable = new Observable<Scene>();

    /**
    * An event triggered after calculating deterministic simulation step
    */
    public onAfterStepObservable = new Observable<Scene>();

    /**
     * An event triggered when the activeCamera property is updated
     */
    public onActiveCameraChanged = new Observable<Scene>();

    /**
     * This Observable will be triggered before rendering each renderingGroup of each rendered camera.
     * The RenderinGroupInfo class contains all the information about the context in which the observable is called
     * If you wish to register an Observer only for a given set of renderingGroup, use the mask with a combination of the renderingGroup index elevated to the power of two (1 for renderingGroup 0, 2 for renderingrOup1, 4 for 2 and 8 for 3)
     */
    public onBeforeRenderingGroupObservable = new Observable<RenderingGroupInfo>();

    /**
     * This Observable will be triggered after rendering each renderingGroup of each rendered camera.
     * The RenderinGroupInfo class contains all the information about the context in which the observable is called
     * If you wish to register an Observer only for a given set of renderingGroup, use the mask with a combination of the renderingGroup index elevated to the power of two (1 for renderingGroup 0, 2 for renderingrOup1, 4 for 2 and 8 for 3)
     */
    public onAfterRenderingGroupObservable = new Observable<RenderingGroupInfo>();

    /**
     * This Observable will when a mesh has been imported into the scene.
     */
    public onMeshImportedObservable = new Observable<AbstractMesh>();

    /**
     * This Observable will when an animation file has been imported into the scene.
     */
    public onAnimationFileImportedObservable = new Observable<Scene>();

    /**
     * Gets or sets a user defined funtion to select LOD from a mesh and a camera.
     * By default this function is undefined and Babylon.js will select LOD based on distance to camera
     */
    public customLODSelector: (mesh: AbstractMesh, camera: Camera) => Nullable<AbstractMesh>;

    // Animations

    /** @hidden */
    public _registeredForLateAnimationBindings = new SmartArrayNoDuplicate<any>(256);

    // Pointers
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer down event
     */
    public pointerDownPredicate: (Mesh: AbstractMesh) => boolean;
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer up event
     */
    public pointerUpPredicate: (Mesh: AbstractMesh) => boolean;
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer move event
     */
    public pointerMovePredicate: (Mesh: AbstractMesh) => boolean;

    /** Callback called when a pointer move is detected */
    public onPointerMove: (evt: PointerEvent, pickInfo: PickingInfo, type: PointerEventTypes) => void;
    /** Callback called when a pointer down is detected  */
    public onPointerDown: (evt: PointerEvent, pickInfo: PickingInfo, type: PointerEventTypes) => void;
    /** Callback called when a pointer up is detected  */
    public onPointerUp: (evt: PointerEvent, pickInfo: Nullable<PickingInfo>, type: PointerEventTypes) => void;
    /** Callback called when a pointer pick is detected */
    public onPointerPick: (evt: PointerEvent, pickInfo: PickingInfo) => void;

    /**
     * This observable event is triggered when any ponter event is triggered. It is registered during Scene.attachControl() and it is called BEFORE the 3D engine process anything (mesh/sprite picking for instance).
     * You have the possibility to skip the process and the call to onPointerObservable by setting PointerInfoPre.skipOnPointerObservable to true
     */
    public onPrePointerObservable = new Observable<PointerInfoPre>();

    /**
     * Observable event triggered each time an input event is received from the rendering canvas
     */
    public onPointerObservable = new Observable<PointerInfo>();

    /**
     * Gets the pointer coordinates without any translation (ie. straight out of the pointer event)
     */
    public get unTranslatedPointer(): Vector2 {
        return this._inputManager.unTranslatedPointer;
    }

    /**
     * Gets or sets the distance in pixel that you have to move to prevent some events. Default is 10 pixels
     */
    public static get DragMovementThreshold() {
        return InputManager.DragMovementThreshold;
    }

    public static set DragMovementThreshold(value: number) {
        InputManager.DragMovementThreshold = value;
    }

    /**
     * Time in milliseconds to wait to raise long press events if button is still pressed. Default is 500 ms
     */
    public static get LongPressDelay() {
        return InputManager.LongPressDelay;
    }

    public static set LongPressDelay(value: number) {
        InputManager.LongPressDelay = value;
    }

    /**
     * Time in milliseconds to wait to raise long press events if button is still pressed. Default is 300 ms
     */
    public static get DoubleClickDelay() {
        return InputManager.DoubleClickDelay;
    }

    public static set DoubleClickDelay(value: number) {
        InputManager.DoubleClickDelay = value;
    }

    /** If you need to check double click without raising a single click at first click, enable this flag */
    public static get ExclusiveDoubleClickMode() {
        return InputManager.ExclusiveDoubleClickMode;
    }

    public static set ExclusiveDoubleClickMode(value: boolean) {
        InputManager.ExclusiveDoubleClickMode = value;
    }

    // Mirror
    /** @hidden */
    public _mirroredCameraPosition: Nullable<Vector3>;

    // Keyboard

    /**
     * This observable event is triggered when any keyboard event si raised and registered during Scene.attachControl()
     * You have the possibility to skip the process and the call to onKeyboardObservable by setting KeyboardInfoPre.skipOnPointerObservable to true
     */
    public onPreKeyboardObservable = new Observable<KeyboardInfoPre>();

    /**
     * Observable event triggered each time an keyboard event is received from the hosting window
     */
    public onKeyboardObservable = new Observable<KeyboardInfo>();

    // Coordinates system

    private _useRightHandedSystem = false;
    /**
    * Gets or sets a boolean indicating if the scene must use right-handed coordinates system
    */
    public set useRightHandedSystem(value: boolean) {
        if (this._useRightHandedSystem === value) {
            return;
        }
        this._useRightHandedSystem = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_MiscDirtyFlag);
    }
    public get useRightHandedSystem(): boolean {
        return this._useRightHandedSystem;
    }

    // Deterministic lockstep
    private _timeAccumulator: number = 0;
    private _currentStepId: number = 0;
    private _currentInternalStep: number = 0;

    /**
     * Sets the step Id used by deterministic lock step
     * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
     * @param newStepId defines the step Id
     */
    public setStepId(newStepId: number): void {
        this._currentStepId = newStepId;
    }

    /**
     * Gets the step Id used by deterministic lock step
     * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
     * @returns the step Id
     */
    public getStepId(): number {
        return this._currentStepId;
    }

    /**
     * Gets the internal step used by deterministic lock step
     * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
     * @returns the internal step
     */
    public getInternalStep(): number {
        return this._currentInternalStep;
    }

    // Fog

    private _fogEnabled = true;
    /**
    * Gets or sets a boolean indicating if fog is enabled on this scene
    * @see http://doc.babylonjs.com/babylon101/environment#fog
    * (Default is true)
    */
    public set fogEnabled(value: boolean) {
        if (this._fogEnabled === value) {
            return;
        }
        this._fogEnabled = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_MiscDirtyFlag);
    }
    public get fogEnabled(): boolean {
        return this._fogEnabled;
    }

    private _fogMode = Scene.FOGMODE_NONE;
    /**
    * Gets or sets the fog mode to use
    * @see http://doc.babylonjs.com/babylon101/environment#fog
    * | mode | value |
    * | --- | --- |
    * | FOGMODE_NONE | 0 |
    * | FOGMODE_EXP | 1 |
    * | FOGMODE_EXP2 | 2 |
    * | FOGMODE_LINEAR | 3 |
    */
    public set fogMode(value: number) {
        if (this._fogMode === value) {
            return;
        }
        this._fogMode = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_MiscDirtyFlag);
    }
    public get fogMode(): number {
        return this._fogMode;
    }

    /**
    * Gets or sets the fog color to use
    * @see http://doc.babylonjs.com/babylon101/environment#fog
    * (Default is Color3(0.2, 0.2, 0.3))
    */
    public fogColor = new Color3(0.2, 0.2, 0.3);
    /**
    * Gets or sets the fog density to use
    * @see http://doc.babylonjs.com/babylon101/environment#fog
    * (Default is 0.1)
    */
    public fogDensity = 0.1;
    /**
    * Gets or sets the fog start distance to use
    * @see http://doc.babylonjs.com/babylon101/environment#fog
    * (Default is 0)
    */
    public fogStart = 0;
    /**
    * Gets or sets the fog end distance to use
    * @see http://doc.babylonjs.com/babylon101/environment#fog
    * (Default is 1000)
    */
    public fogEnd = 1000.0;

    /**
    * Flag indicating that the frame buffer binding is handled by another component
    */
    public prePass : boolean = false;

    // Lights
    private _shadowsEnabled = true;
    /**
    * Gets or sets a boolean indicating if shadows are enabled on this scene
    */
    public set shadowsEnabled(value: boolean) {
        if (this._shadowsEnabled === value) {
            return;
        }
        this._shadowsEnabled = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_LightDirtyFlag);
    }
    public get shadowsEnabled(): boolean {
        return this._shadowsEnabled;
    }

    private _lightsEnabled = true;
    /**
    * Gets or sets a boolean indicating if lights are enabled on this scene
    */
    public set lightsEnabled(value: boolean) {
        if (this._lightsEnabled === value) {
            return;
        }
        this._lightsEnabled = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_LightDirtyFlag);
    }

    public get lightsEnabled(): boolean {
        return this._lightsEnabled;
    }

    /** All of the active cameras added to this scene. */
    public activeCameras = new Array<Camera>();

    /** @hidden */
    public _activeCamera: Nullable<Camera>;
    /** Gets or sets the current active camera */
    public get activeCamera(): Nullable<Camera> {
        return this._activeCamera;
    }

    public set activeCamera(value: Nullable<Camera>) {
        if (value === this._activeCamera) {
            return;
        }

        this._activeCamera = value;
        this.onActiveCameraChanged.notifyObservers(this);
    }

    private _defaultMaterial: Material;

    /** The default material used on meshes when no material is affected */
    public get defaultMaterial(): Material {
        if (!this._defaultMaterial) {
            this._defaultMaterial = Scene.DefaultMaterialFactory(this);
        }

        return this._defaultMaterial;
    }

    /** The default material used on meshes when no material is affected */
    public set defaultMaterial(value: Material) {
        this._defaultMaterial = value;
    }

    // Textures
    private _texturesEnabled = true;
    /**
    * Gets or sets a boolean indicating if textures are enabled on this scene
    */
    public set texturesEnabled(value: boolean) {
        if (this._texturesEnabled === value) {
            return;
        }
        this._texturesEnabled = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    public get texturesEnabled(): boolean {
        return this._texturesEnabled;
    }

    // Physics
    /**
     * Gets or sets a boolean indicating if physic engines are enabled on this scene
     */
    public physicsEnabled = true;

    // Particles
    /**
    * Gets or sets a boolean indicating if particles are enabled on this scene
    */
    public particlesEnabled = true;

    // Sprites
    /**
    * Gets or sets a boolean indicating if sprites are enabled on this scene
    */
    public spritesEnabled = true;

    // Skeletons
    private _skeletonsEnabled = true;
    /**
    * Gets or sets a boolean indicating if skeletons are enabled on this scene
    */
    public set skeletonsEnabled(value: boolean) {
        if (this._skeletonsEnabled === value) {
            return;
        }
        this._skeletonsEnabled = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_AttributesDirtyFlag);
    }

    public get skeletonsEnabled(): boolean {
        return this._skeletonsEnabled;
    }

    // Lens flares
    /**
    * Gets or sets a boolean indicating if lens flares are enabled on this scene
    */
    public lensFlaresEnabled = true;

    // Collisions
    /**
    * Gets or sets a boolean indicating if collisions are enabled on this scene
    * @see http://doc.babylonjs.com/babylon101/cameras,_mesh_collisions_and_gravity
    */
    public collisionsEnabled = true;

    private _collisionCoordinator: ICollisionCoordinator;

    /** @hidden */
    public get collisionCoordinator(): ICollisionCoordinator {
        if (!this._collisionCoordinator) {
            this._collisionCoordinator = Scene.CollisionCoordinatorFactory();
            this._collisionCoordinator.init(this);
        }

        return this._collisionCoordinator;
    }

    /**
     * Defines the gravity applied to this scene (used only for collisions)
     * @see http://doc.babylonjs.com/babylon101/cameras,_mesh_collisions_and_gravity
     */
    public gravity = new Vector3(0, -9.807, 0);

    // Postprocesses
    /**
    * Gets or sets a boolean indicating if postprocesses are enabled on this scene
    */
    public postProcessesEnabled = true;
    /**
     * The list of postprocesses added to the scene
     */
    public postProcesses = new Array<PostProcess>();
    /**
     * Gets the current postprocess manager
     */
    public postProcessManager: PostProcessManager;

    // Customs render targets
    /**
    * Gets or sets a boolean indicating if render targets are enabled on this scene
    */
    public renderTargetsEnabled = true;
    /**
    * Gets or sets a boolean indicating if next render targets must be dumped as image for debugging purposes
    * We recommend not using it and instead rely on Spector.js: http://spector.babylonjs.com
    */
    public dumpNextRenderTargets = false;
    /**
     * The list of user defined render targets added to the scene
     */
    public customRenderTargets = new Array<RenderTargetTexture>();

    /**
     * Defines if texture loading must be delayed
     * If true, textures will only be loaded when they need to be rendered
     */
    public useDelayedTextureLoading: boolean;

    /**
     * Gets the list of meshes imported to the scene through SceneLoader
     */
    public importedMeshesFiles = new Array<String>();

    // Probes
    /**
    * Gets or sets a boolean indicating if probes are enabled on this scene
    */
    public probesEnabled = true;

    // Offline support
    /**
     * Gets or sets the current offline provider to use to store scene data
     * @see http://doc.babylonjs.com/how_to/caching_resources_in_indexeddb
     */
    public offlineProvider: IOfflineProvider;

    /**
     * Gets or sets the action manager associated with the scene
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions
    */
    public actionManager: AbstractActionManager;

    private _meshesForIntersections = new SmartArrayNoDuplicate<AbstractMesh>(256);

    // Procedural textures
    /**
    * Gets or sets a boolean indicating if procedural textures are enabled on this scene
    */
    public proceduralTexturesEnabled = true;

    // Private
    private _engine: Engine;

    // Performance counters
    private _totalVertices = new PerfCounter();
    /** @hidden */
    public _activeIndices = new PerfCounter();
    /** @hidden */
    public _activeParticles = new PerfCounter();
    /** @hidden */
    public _activeBones = new PerfCounter();

    private _animationRatio: number;

    /** @hidden */
    public _animationTimeLast: number;

    /** @hidden */
    public _animationTime: number = 0;

    /**
     * Gets or sets a general scale for animation speed
     * @see https://www.babylonjs-playground.com/#IBU2W7#3
     */
    public animationTimeScale: number = 1;

    /** @hidden */
    public _cachedMaterial: Nullable<Material>;
    /** @hidden */
    public _cachedEffect: Nullable<Effect>;
    /** @hidden */
    public _cachedVisibility: Nullable<number>;

    private _renderId = 0;
    private _frameId = 0;
    private _executeWhenReadyTimeoutId = -1;
    private _intermediateRendering = false;

    private _viewUpdateFlag = -1;
    private _projectionUpdateFlag = -1;

    /** @hidden */
    public _toBeDisposed = new Array<Nullable<IDisposable>>(256);
    private _activeRequests = new Array<IFileRequest>();

    /** @hidden */
    public _pendingData = new Array();
    private _isDisposed = false;

    /**
     * Gets or sets a boolean indicating that all submeshes of active meshes must be rendered
     * Use this boolean to avoid computing frustum clipping on submeshes (This could help when you are CPU bound)
     */
    public dispatchAllSubMeshesOfActiveMeshes: boolean = false;
    private _activeMeshes = new SmartArray<AbstractMesh>(256);
    private _processedMaterials = new SmartArray<Material>(256);
    private _renderTargets = new SmartArrayNoDuplicate<RenderTargetTexture>(256);
    /** @hidden */
    public _activeParticleSystems = new SmartArray<IParticleSystem>(256);
    private _activeSkeletons = new SmartArrayNoDuplicate<Skeleton>(32);
    private _softwareSkinnedMeshes = new SmartArrayNoDuplicate<Mesh>(32);

    private _renderingManager: RenderingManager;

    /** @hidden */
    public _activeAnimatables = new Array<Animatable>();

    private _transformMatrix = Matrix.Zero();
    private _sceneUbo: UniformBuffer;

    /** @hidden */
    public _viewMatrix: Matrix;
    private _projectionMatrix: Matrix;
    /** @hidden */
    public _forcedViewPosition: Nullable<Vector3>;

    /** @hidden */
    public _frustumPlanes: Plane[];
    /**
     * Gets the list of frustum planes (built from the active camera)
     */
    public get frustumPlanes(): Plane[] {
        return this._frustumPlanes;
    }

    /**
     * Gets or sets a boolean indicating if lights must be sorted by priority (off by default)
     * This is useful if there are more lights that the maximum simulteanous authorized
     */
    public requireLightSorting = false;

    /** @hidden */
    public readonly useMaterialMeshMap: boolean;
    /** @hidden */
    public readonly useClonedMeshMap: boolean;

    private _externalData: StringDictionary<Object>;
    private _uid: Nullable<string>;

    /**
     * @hidden
     * Backing store of defined scene components.
     */
    public _components: ISceneComponent[] = [];

    /**
     * @hidden
     * Backing store of defined scene components.
     */
    public _serializableComponents: ISceneSerializableComponent[] = [];

    /**
     * List of components to register on the next registration step.
     */
    private _transientComponents: ISceneComponent[] = [];

    /**
     * Registers the transient components if needed.
     */
    private _registerTransientComponents(): void {
        // Register components that have been associated lately to the scene.
        if (this._transientComponents.length > 0) {
            for (let component of this._transientComponents) {
                component.register();
            }
            this._transientComponents = [];
        }
    }

    /**
     * @hidden
     * Add a component to the scene.
     * Note that the ccomponent could be registered on th next frame if this is called after
     * the register component stage.
     * @param component Defines the component to add to the scene
     */
    public _addComponent(component: ISceneComponent) {
        this._components.push(component);
        this._transientComponents.push(component);

        const serializableComponent = component as ISceneSerializableComponent;
        if (serializableComponent.addFromContainer && serializableComponent.serialize) {
            this._serializableComponents.push(serializableComponent);
        }
    }

    /**
     * @hidden
     * Gets a component from the scene.
     * @param name defines the name of the component to retrieve
     * @returns the component or null if not present
     */
    public _getComponent(name: string): Nullable<ISceneComponent> {
        for (let component of this._components) {
            if (component.name === name) {
                return component;
            }
        }
        return null;
    }

    /**
     * @hidden
     * Defines the actions happening before camera updates.
     */
    public _beforeCameraUpdateStage = Stage.Create<SimpleStageAction>();
    /**
     * @hidden
     * Defines the actions happening before clear the canvas.
     */
    public _beforeClearStage = Stage.Create<SimpleStageAction>();
    /**
     * @hidden
     * Defines the actions when collecting render targets for the frame.
     */
    public _gatherRenderTargetsStage = Stage.Create<RenderTargetsStageAction>();
    /**
     * @hidden
     * Defines the actions happening for one camera in the frame.
     */
    public _gatherActiveCameraRenderTargetsStage = Stage.Create<RenderTargetsStageAction>();
    /**
     * @hidden
     * Defines the actions happening during the per mesh ready checks.
     */
    public _isReadyForMeshStage = Stage.Create<MeshStageAction>();
    /**
     * @hidden
     * Defines the actions happening before evaluate active mesh checks.
     */
    public _beforeEvaluateActiveMeshStage = Stage.Create<SimpleStageAction>();
    /**
     * @hidden
     * Defines the actions happening during the evaluate sub mesh checks.
     */
    public _evaluateSubMeshStage = Stage.Create<EvaluateSubMeshStageAction>();
    /**
     * @hidden
     * Defines the actions happening during the active mesh stage.
     */
    public _activeMeshStage = Stage.Create<ActiveMeshStageAction>();
    /**
     * @hidden
     * Defines the actions happening during the per camera render target step.
     */
    public _cameraDrawRenderTargetStage = Stage.Create<CameraStageFrameBufferAction>();
    /**
     * @hidden
     * Defines the actions happening just before the active camera is drawing.
     */
    public _beforeCameraDrawStage = Stage.Create<CameraStageAction>();
    /**
     * @hidden
     * Defines the actions happening just before a render target is drawing.
     */
    public _beforeRenderTargetDrawStage = Stage.Create<RenderTargetStageAction>();
    /**
     * @hidden
     * Defines the actions happening just before a rendering group is drawing.
     */
    public _beforeRenderingGroupDrawStage = Stage.Create<RenderingGroupStageAction>();
    /**
     * @hidden
     * Defines the actions happening just before a mesh is drawing.
     */
    public _beforeRenderingMeshStage = Stage.Create<RenderingMeshStageAction>();
    /**
     * @hidden
     * Defines the actions happening just after a mesh has been drawn.
     */
    public _afterRenderingMeshStage = Stage.Create<RenderingMeshStageAction>();
    /**
     * @hidden
     * Defines the actions happening just after a rendering group has been drawn.
     */
    public _afterRenderingGroupDrawStage = Stage.Create<RenderingGroupStageAction>();
    /**
     * @hidden
     * Defines the actions happening just after the active camera has been drawn.
     */
    public _afterCameraDrawStage = Stage.Create<CameraStageAction>();
    /**
     * @hidden
     * Defines the actions happening just after a render target has been drawn.
     */
    public _afterRenderTargetDrawStage = Stage.Create<RenderTargetStageAction>();
    /**
     * @hidden
     * Defines the actions happening just after rendering all cameras and computing intersections.
     */
    public _afterRenderStage = Stage.Create<SimpleStageAction>();
    /**
     * @hidden
     * Defines the actions happening when a pointer move event happens.
     */
    public _pointerMoveStage = Stage.Create<PointerMoveStageAction>();
    /**
     * @hidden
     * Defines the actions happening when a pointer down event happens.
     */
    public _pointerDownStage = Stage.Create<PointerUpDownStageAction>();
    /**
     * @hidden
     * Defines the actions happening when a pointer up event happens.
     */
    public _pointerUpStage = Stage.Create<PointerUpDownStageAction>();

    /**
     * an optional map from Geometry Id to Geometry index in the 'geometries' array
     */
    private geometriesByUniqueId: Nullable<{ [uniqueId: string]: number | undefined }> = null;

    /**
     * Creates a new Scene
     * @param engine defines the engine to use to render this scene
     * @param options defines the scene options
     */
    constructor(engine: Engine, options?: SceneOptions) {
        super();

        const fullOptions = {
            useGeometryUniqueIdsMap: true,
            useMaterialMeshMap: true,
            useClonedMeshMap: true,
            virtual: false,
            ...options
        };

        this._engine = engine || EngineStore.LastCreatedEngine;
        if (!fullOptions.virtual) {
            EngineStore._LastCreatedScene = this;
            this._engine.scenes.push(this);
        }

        this._uid = null;

        this._renderingManager = new RenderingManager(this);

        if (PostProcessManager) {
            this.postProcessManager = new PostProcessManager(this);
        }

        if (DomManagement.IsWindowObjectExist()) {
            this.attachControl();
        }

        // Uniform Buffer
        this._createUbo();

        // Default Image processing definition
        if (ImageProcessingConfiguration) {
            this._imageProcessingConfiguration = new ImageProcessingConfiguration();
        }

        this.setDefaultCandidateProviders();

        if (fullOptions.useGeometryUniqueIdsMap) {
            this.geometriesByUniqueId = {};
        }

        this.useMaterialMeshMap = fullOptions.useMaterialMeshMap;
        this.useClonedMeshMap = fullOptions.useClonedMeshMap;

        if (!options || !options.virtual) {
            this._engine.onNewSceneAddedObservable.notifyObservers(this);
        }
    }

    /**
     * Gets a string idenfifying the name of the class
     * @returns "Scene" string
     */
    public getClassName(): string {
        return "Scene";
    }

    private _defaultMeshCandidates: ISmartArrayLike<AbstractMesh> = {
        data: [],
        length: 0
    };

    /**
     * @hidden
     */
    public _getDefaultMeshCandidates(): ISmartArrayLike<AbstractMesh> {
        this._defaultMeshCandidates.data = this.meshes;
        this._defaultMeshCandidates.length = this.meshes.length;
        return this._defaultMeshCandidates;
    }

    private _defaultSubMeshCandidates: ISmartArrayLike<SubMesh> = {
        data: [],
        length: 0
    };

    /**
     * @hidden
     */
    public _getDefaultSubMeshCandidates(mesh: AbstractMesh): ISmartArrayLike<SubMesh> {
        this._defaultSubMeshCandidates.data = mesh.subMeshes;
        this._defaultSubMeshCandidates.length = mesh.subMeshes.length;
        return this._defaultSubMeshCandidates;
    }

    /**
     * Sets the default candidate providers for the scene.
     * This sets the getActiveMeshCandidates, getActiveSubMeshCandidates, getIntersectingSubMeshCandidates
     * and getCollidingSubMeshCandidates to their default function
     */
    public setDefaultCandidateProviders(): void {
        this.getActiveMeshCandidates = this._getDefaultMeshCandidates.bind(this);

        this.getActiveSubMeshCandidates = this._getDefaultSubMeshCandidates.bind(this);
        this.getIntersectingSubMeshCandidates = this._getDefaultSubMeshCandidates.bind(this);
        this.getCollidingSubMeshCandidates = this._getDefaultSubMeshCandidates.bind(this);
    }

    /**
     * Gets the mesh that is currently under the pointer
     */
    public get meshUnderPointer(): Nullable<AbstractMesh> {
        return this._inputManager.meshUnderPointer;
    }

    /**
     * Gets or sets the current on-screen X position of the pointer
     */
    public get pointerX(): number {
        return this._inputManager.pointerX;
    }

    public set pointerX(value: number) {
        this._inputManager.pointerX = value;
    }

    /**
     * Gets or sets the current on-screen Y position of the pointer
     */
    public get pointerY(): number {
        return this._inputManager.pointerY;
    }

    public set pointerY(value: number) {
        this._inputManager.pointerY = value;
    }

    /**
     * Gets the cached material (ie. the latest rendered one)
     * @returns the cached material
     */
    public getCachedMaterial(): Nullable<Material> {
        return this._cachedMaterial;
    }

    /**
     * Gets the cached effect (ie. the latest rendered one)
     * @returns the cached effect
     */
    public getCachedEffect(): Nullable<Effect> {
        return this._cachedEffect;
    }

    /**
     * Gets the cached visibility state (ie. the latest rendered one)
     * @returns the cached visibility state
     */
    public getCachedVisibility(): Nullable<number> {
        return this._cachedVisibility;
    }

    /**
     * Gets a boolean indicating if the current material / effect / visibility must be bind again
     * @param material defines the current material
     * @param effect defines the current effect
     * @param visibility defines the current visibility state
     * @returns true if one parameter is not cached
     */
    public isCachedMaterialInvalid(material: Material, effect: Effect, visibility: number = 1) {
        return this._cachedEffect !== effect || this._cachedMaterial !== material || this._cachedVisibility !== visibility;
    }

    /**
     * Gets the engine associated with the scene
     * @returns an Engine
     */
    public getEngine(): Engine {
        return this._engine;
    }

    /**
     * Gets the total number of vertices rendered per frame
     * @returns the total number of vertices rendered per frame
     */
    public getTotalVertices(): number {
        return this._totalVertices.current;
    }

    /**
     * Gets the performance counter for total vertices
     * @see http://doc.babylonjs.com/how_to/optimizing_your_scene#instrumentation
     */
    public get totalVerticesPerfCounter(): PerfCounter {
        return this._totalVertices;
    }

    /**
     * Gets the total number of active indices rendered per frame (You can deduce the number of rendered triangles by dividing this number by 3)
     * @returns the total number of active indices rendered per frame
     */
    public getActiveIndices(): number {
        return this._activeIndices.current;
    }

    /**
     * Gets the performance counter for active indices
     * @see http://doc.babylonjs.com/how_to/optimizing_your_scene#instrumentation
     */
    public get totalActiveIndicesPerfCounter(): PerfCounter {
        return this._activeIndices;
    }

    /**
     * Gets the total number of active particles rendered per frame
     * @returns the total number of active particles rendered per frame
     */
    public getActiveParticles(): number {
        return this._activeParticles.current;
    }

    /**
     * Gets the performance counter for active particles
     * @see http://doc.babylonjs.com/how_to/optimizing_your_scene#instrumentation
     */
    public get activeParticlesPerfCounter(): PerfCounter {
        return this._activeParticles;
    }

    /**
     * Gets the total number of active bones rendered per frame
     * @returns the total number of active bones rendered per frame
     */
    public getActiveBones(): number {
        return this._activeBones.current;
    }

    /**
     * Gets the performance counter for active bones
     * @see http://doc.babylonjs.com/how_to/optimizing_your_scene#instrumentation
     */
    public get activeBonesPerfCounter(): PerfCounter {
        return this._activeBones;
    }

    /**
     * Gets the array of active meshes
     * @returns an array of AbstractMesh
     */
    public getActiveMeshes(): SmartArray<AbstractMesh> {
        return this._activeMeshes;
    }

    /**
     * Gets the animation ratio (which is 1.0 is the scene renders at 60fps and 2 if the scene renders at 30fps, etc.)
     * @returns a number
     */
    public getAnimationRatio(): number {
        return this._animationRatio !== undefined ? this._animationRatio : 1;
    }

    /**
     * Gets an unique Id for the current render phase
     * @returns a number
     */
    public getRenderId(): number {
        return this._renderId;
    }

    /**
     * Gets an unique Id for the current frame
     * @returns a number
     */
    public getFrameId(): number {
        return this._frameId;
    }

    /** Call this function if you want to manually increment the render Id*/
    public incrementRenderId(): void {
        this._renderId++;
    }

    private _createUbo(): void {
        this._sceneUbo = new UniformBuffer(this._engine, undefined, true);
        this._sceneUbo.addUniform("viewProjection", 16);
        this._sceneUbo.addUniform("view", 16);
    }

    /**
     * Use this method to simulate a pointer move on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     * @returns the current scene
     */
    public simulatePointerMove(pickResult: PickingInfo, pointerEventInit?: PointerEventInit): Scene {
        this._inputManager.simulatePointerMove(pickResult, pointerEventInit);
        return this;
    }

    /**
     * Use this method to simulate a pointer down on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     * @returns the current scene
     */
    public simulatePointerDown(pickResult: PickingInfo, pointerEventInit?: PointerEventInit): Scene {
        this._inputManager.simulatePointerDown(pickResult, pointerEventInit);
        return this;
    }

    /**
     * Use this method to simulate a pointer up on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     * @param doubleTap indicates that the pointer up event should be considered as part of a double click (false by default)
     * @returns the current scene
     */
    public simulatePointerUp(pickResult: PickingInfo, pointerEventInit?: PointerEventInit, doubleTap?: boolean): Scene {
        this._inputManager.simulatePointerUp(pickResult, pointerEventInit, doubleTap);
        return this;
    }

    /**
     * Gets a boolean indicating if the current pointer event is captured (meaning that the scene has already handled the pointer down)
     * @param pointerId defines the pointer id to use in a multi-touch scenario (0 by default)
     * @returns true if the pointer was captured
     */
    public isPointerCaptured(pointerId = 0): boolean {
        return this._inputManager.isPointerCaptured(pointerId);
    }

    /**
    * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
    * @param attachUp defines if you want to attach events to pointerup
    * @param attachDown defines if you want to attach events to pointerdown
    * @param attachMove defines if you want to attach events to pointermove
    */
    public attachControl(attachUp = true, attachDown = true, attachMove = true): void {
        this._inputManager.attachControl(attachUp, attachDown, attachMove);
    }

    /** Detaches all event handlers*/
    public detachControl() {
        this._inputManager.detachControl();
    }

    /**
     * This function will check if the scene can be rendered (textures are loaded, shaders are compiled)
     * Delay loaded resources are not taking in account
     * @return true if all required resources are ready
     */
    public isReady(): boolean {
        if (this._isDisposed) {
            return false;
        }

        let index: number;
        let engine = this.getEngine();

        // Effects
        if (!engine.areAllEffectsReady()) {
            return false;
        }

        // Pending data
        if (this._pendingData.length > 0) {
            return false;
        }

        // Meshes
        for (index = 0; index < this.meshes.length; index++) {
            var mesh = this.meshes[index];

            if (!mesh.isEnabled()) {
                continue;
            }

            if (!mesh.subMeshes || mesh.subMeshes.length === 0) {
                continue;
            }

            if (!mesh.isReady(true)) {
                return false;
            }

            let hardwareInstancedRendering = mesh.hasThinInstances || mesh.getClassName() === "InstancedMesh" || mesh.getClassName() === "InstancedLinesMesh" || engine.getCaps().instancedArrays && (<Mesh>mesh).instances.length > 0;
            // Is Ready For Mesh
            for (let step of this._isReadyForMeshStage) {
                if (!step.action(mesh, hardwareInstancedRendering)) {
                    return false;
                }
            }
        }

        // Geometries
        for (index = 0; index < this.geometries.length; index++) {
            var geometry = this.geometries[index];

            if (geometry.delayLoadState === Constants.DELAYLOADSTATE_LOADING) {
                return false;
            }
        }

        // Post-processes
        if (this.activeCameras && this.activeCameras.length > 0) {
            for (var camera of this.activeCameras) {
                if (!camera.isReady(true)) {
                    return false;
                }
            }
        } else if (this.activeCamera) {
            if (!this.activeCamera.isReady(true)) {
                return false;
            }
        }

        // Particles
        for (var particleSystem of this.particleSystems) {
            if (!particleSystem.isReady()) {
                return false;
            }
        }

        return true;
    }

    /** Resets all cached information relative to material (including effect and visibility) */
    public resetCachedMaterial(): void {
        this._cachedMaterial = null;
        this._cachedEffect = null;
        this._cachedVisibility = null;
    }

    /**
     * Registers a function to be called before every frame render
     * @param func defines the function to register
     */
    public registerBeforeRender(func: () => void): void {
        this.onBeforeRenderObservable.add(func);
    }

    /**
     * Unregisters a function called before every frame render
     * @param func defines the function to unregister
     */
    public unregisterBeforeRender(func: () => void): void {
        this.onBeforeRenderObservable.removeCallback(func);
    }

    /**
     * Registers a function to be called after every frame render
     * @param func defines the function to register
     */
    public registerAfterRender(func: () => void): void {
        this.onAfterRenderObservable.add(func);
    }

    /**
     * Unregisters a function called after every frame render
     * @param func defines the function to unregister
     */
    public unregisterAfterRender(func: () => void): void {
        this.onAfterRenderObservable.removeCallback(func);
    }

    private _executeOnceBeforeRender(func: () => void): void {
        let execFunc = () => {
            func();
            setTimeout(() => {
                this.unregisterBeforeRender(execFunc);
            });
        };
        this.registerBeforeRender(execFunc);
    }

    /**
     * The provided function will run before render once and will be disposed afterwards.
     * A timeout delay can be provided so that the function will be executed in N ms.
     * The timeout is using the browser's native setTimeout so time percision cannot be guaranteed.
     * @param func The function to be executed.
     * @param timeout optional delay in ms
     */
    public executeOnceBeforeRender(func: () => void, timeout?: number): void {
        if (timeout !== undefined) {
            setTimeout(() => {
                this._executeOnceBeforeRender(func);
            }, timeout);
        } else {
            this._executeOnceBeforeRender(func);
        }
    }

    /** @hidden */
    public _addPendingData(data: any): void {
        this._pendingData.push(data);
    }

    /** @hidden */
    public _removePendingData(data: any): void {
        var wasLoading = this.isLoading;
        var index = this._pendingData.indexOf(data);

        if (index !== -1) {
            this._pendingData.splice(index, 1);
        }

        if (wasLoading && !this.isLoading) {
            this.onDataLoadedObservable.notifyObservers(this);
        }
    }

    /**
     * Returns the number of items waiting to be loaded
     * @returns the number of items waiting to be loaded
     */
    public getWaitingItemsCount(): number {
        return this._pendingData.length;
    }

    /**
     * Returns a boolean indicating if the scene is still loading data
     */
    public get isLoading(): boolean {
        return this._pendingData.length > 0;
    }

    /**
     * Registers a function to be executed when the scene is ready
     * @param {Function} func - the function to be executed
     */
    public executeWhenReady(func: () => void): void {
        this.onReadyObservable.add(func);

        if (this._executeWhenReadyTimeoutId !== -1) {
            return;
        }

        this._executeWhenReadyTimeoutId = setTimeout(() => {
            this._checkIsReady();
        }, 150);
    }

    /**
     * Returns a promise that resolves when the scene is ready
     * @returns A promise that resolves when the scene is ready
     */
    public whenReadyAsync(): Promise<void> {
        return new Promise((resolve) => {
            this.executeWhenReady(() => {
                resolve();
            });
        });
    }

    /** @hidden */
    public _checkIsReady() {
        this._registerTransientComponents();

        if (this.isReady()) {
            this.onReadyObservable.notifyObservers(this);

            this.onReadyObservable.clear();
            this._executeWhenReadyTimeoutId = -1;
            return;
        }

        if (this._isDisposed) {
            this.onReadyObservable.clear();
            this._executeWhenReadyTimeoutId = -1;
            return;
        }

        this._executeWhenReadyTimeoutId = setTimeout(() => {
            this._checkIsReady();
        }, 150);
    }

    /**
     * Gets all animatable attached to the scene
     */
    public get animatables(): Animatable[] {
        return this._activeAnimatables;
    }

    /**
     * Resets the last animation time frame.
     * Useful to override when animations start running when loading a scene for the first time.
     */
    public resetLastAnimationTimeFrame(): void {
        this._animationTimeLast = PrecisionDate.Now;
    }

    // Matrix

    /**
     * Gets the current view matrix
     * @returns a Matrix
     */
    public getViewMatrix(): Matrix {
        return this._viewMatrix;
    }

    /**
     * Gets the current projection matrix
     * @returns a Matrix
     */
    public getProjectionMatrix(): Matrix {
        return this._projectionMatrix;
    }

    /**
     * Gets the current transform matrix
     * @returns a Matrix made of View * Projection
     */
    public getTransformMatrix(): Matrix {
        return this._transformMatrix;
    }

    /**
     * Sets the current transform matrix
     * @param viewL defines the View matrix to use
     * @param projectionL defines the Projection matrix to use
     * @param viewR defines the right View matrix to use (if provided)
     * @param projectionR defines the right Projection matrix to use (if provided)
     */
    public setTransformMatrix(viewL: Matrix, projectionL: Matrix, viewR?: Matrix, projectionR?: Matrix): void {
        if (this._viewUpdateFlag === viewL.updateFlag && this._projectionUpdateFlag === projectionL.updateFlag) {
            return;
        }

        this._viewUpdateFlag = viewL.updateFlag;
        this._projectionUpdateFlag = projectionL.updateFlag;
        this._viewMatrix = viewL;
        this._projectionMatrix = projectionL;

        this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);

        // Update frustum
        if (!this._frustumPlanes) {
            this._frustumPlanes = Frustum.GetPlanes(this._transformMatrix);
        } else {
            Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
        }

        if (this._multiviewSceneUbo && this._multiviewSceneUbo.useUbo) {
            this._updateMultiviewUbo(viewR, projectionR);
        } else if (this._sceneUbo.useUbo) {
            this._sceneUbo.updateMatrix("viewProjection", this._transformMatrix);
            this._sceneUbo.updateMatrix("view", this._viewMatrix);
            this._sceneUbo.update();
        }
    }

    /**
     * Gets the uniform buffer used to store scene data
     * @returns a UniformBuffer
     */
    public getSceneUniformBuffer(): UniformBuffer {
        return this._multiviewSceneUbo ? this._multiviewSceneUbo : this._sceneUbo;
    }

    /**
     * Gets an unique (relatively to the current scene) Id
     * @returns an unique number for the scene
     */
    public getUniqueId() {
        return UniqueIdGenerator.UniqueId;
    }

    /**
     * Add a mesh to the list of scene's meshes
     * @param newMesh defines the mesh to add
     * @param recursive if all child meshes should also be added to the scene
     */
    public addMesh(newMesh: AbstractMesh, recursive = false) {
        if (this._blockEntityCollection) {
            return;
        }

        this.meshes.push(newMesh);

        newMesh._resyncLightSources();

        if (!newMesh.parent) {
            newMesh._addToSceneRootNodes();
        }

        this.onNewMeshAddedObservable.notifyObservers(newMesh);

        if (recursive) {
            newMesh.getChildMeshes().forEach((m) => {
                this.addMesh(m);
            });
        }
    }

    /**
     * Remove a mesh for the list of scene's meshes
     * @param toRemove defines the mesh to remove
     * @param recursive if all child meshes should also be removed from the scene
     * @returns the index where the mesh was in the mesh list
     */
    public removeMesh(toRemove: AbstractMesh, recursive = false): number {
        var index = this.meshes.indexOf(toRemove);
        if (index !== -1) {
            // Remove from the scene if mesh found
            this.meshes[index] = this.meshes[this.meshes.length - 1];
            this.meshes.pop();

            if (!toRemove.parent) {
                toRemove._removeFromSceneRootNodes();
            }
        }

        this.onMeshRemovedObservable.notifyObservers(toRemove);
        if (recursive) {
            toRemove.getChildMeshes().forEach((m) => {
                this.removeMesh(m);
            });
        }
        return index;
    }

    /**
     * Add a transform node to the list of scene's transform nodes
     * @param newTransformNode defines the transform node to add
     */
    public addTransformNode(newTransformNode: TransformNode) {
        if (this._blockEntityCollection) {
            return;
        }
        newTransformNode._indexInSceneTransformNodesArray = this.transformNodes.length;
        this.transformNodes.push(newTransformNode);

        if (!newTransformNode.parent) {
            newTransformNode._addToSceneRootNodes();
        }

        this.onNewTransformNodeAddedObservable.notifyObservers(newTransformNode);
    }

    /**
     * Remove a transform node for the list of scene's transform nodes
     * @param toRemove defines the transform node to remove
     * @returns the index where the transform node was in the transform node list
     */
    public removeTransformNode(toRemove: TransformNode): number {
        var index = toRemove._indexInSceneTransformNodesArray;
        if (index !== -1) {
            if (index !== this.transformNodes.length - 1) {
                const lastNode = this.transformNodes[this.transformNodes.length - 1];
                this.transformNodes[index] = lastNode;
                lastNode._indexInSceneTransformNodesArray = index;
            }

            toRemove._indexInSceneTransformNodesArray = -1;
            this.transformNodes.pop();
            if (!toRemove.parent) {
                toRemove._removeFromSceneRootNodes();
            }
        }

        this.onTransformNodeRemovedObservable.notifyObservers(toRemove);

        return index;
    }

    /**
     * Remove a skeleton for the list of scene's skeletons
     * @param toRemove defines the skeleton to remove
     * @returns the index where the skeleton was in the skeleton list
     */
    public removeSkeleton(toRemove: Skeleton): number {
        var index = this.skeletons.indexOf(toRemove);
        if (index !== -1) {
            // Remove from the scene if found
            this.skeletons.splice(index, 1);
            this.onSkeletonRemovedObservable.notifyObservers(toRemove);
        }

        return index;
    }

    /**
     * Remove a morph target for the list of scene's morph targets
     * @param toRemove defines the morph target to remove
     * @returns the index where the morph target was in the morph target list
     */
    public removeMorphTargetManager(toRemove: MorphTargetManager): number {
        var index = this.morphTargetManagers.indexOf(toRemove);
        if (index !== -1) {
            // Remove from the scene if found
            this.morphTargetManagers.splice(index, 1);
        }

        return index;
    }

    /**
     * Remove a light for the list of scene's lights
     * @param toRemove defines the light to remove
     * @returns the index where the light was in the light list
     */
    public removeLight(toRemove: Light): number {
        var index = this.lights.indexOf(toRemove);
        if (index !== -1) {
            // Remove from meshes
            for (var mesh of this.meshes) {
                mesh._removeLightSource(toRemove, false);
            }

            // Remove from the scene if mesh found
            this.lights.splice(index, 1);
            this.sortLightsByPriority();

            if (!toRemove.parent) {
                toRemove._removeFromSceneRootNodes();
            }
        }
        this.onLightRemovedObservable.notifyObservers(toRemove);
        return index;
    }

    /**
     * Remove a camera for the list of scene's cameras
     * @param toRemove defines the camera to remove
     * @returns the index where the camera was in the camera list
     */
    public removeCamera(toRemove: Camera): number {
        var index = this.cameras.indexOf(toRemove);
        if (index !== -1) {
            // Remove from the scene if mesh found
            this.cameras.splice(index, 1);
            if (!toRemove.parent) {
                toRemove._removeFromSceneRootNodes();
            }
        }
        // Remove from activeCameras
        var index2 = this.activeCameras.indexOf(toRemove);
        if (index2 !== -1) {
            // Remove from the scene if mesh found
            this.activeCameras.splice(index2, 1);
        }
        // Reset the activeCamera
        if (this.activeCamera === toRemove) {
            if (this.cameras.length > 0) {
                this.activeCamera = this.cameras[0];
            } else {
                this.activeCamera = null;
            }
        }
        this.onCameraRemovedObservable.notifyObservers(toRemove);
        return index;
    }

    /**
     * Remove a particle system for the list of scene's particle systems
     * @param toRemove defines the particle system to remove
     * @returns the index where the particle system was in the particle system list
     */
    public removeParticleSystem(toRemove: IParticleSystem): number {
        var index = this.particleSystems.indexOf(toRemove);
        if (index !== -1) {
            this.particleSystems.splice(index, 1);
        }
        return index;
    }

    /**
     * Remove a animation for the list of scene's animations
     * @param toRemove defines the animation to remove
     * @returns the index where the animation was in the animation list
     */
    public removeAnimation(toRemove: Animation): number {
        var index = this.animations.indexOf(toRemove);
        if (index !== -1) {
            this.animations.splice(index, 1);
        }
        return index;
    }

    /**
     * Will stop the animation of the given target
     * @param target - the target
     * @param animationName - the name of the animation to stop (all animations will be stopped if both this and targetMask are empty)
     * @param targetMask - a function that determines if the animation should be stopped based on its target (all animations will be stopped if both this and animationName are empty)
     */
    public stopAnimation(target: any, animationName?: string, targetMask?: (target: any) => boolean): void {
        // Do nothing as code will be provided by animation component
    }

    /**
     * Removes the given animation group from this scene.
     * @param toRemove The animation group to remove
     * @returns The index of the removed animation group
     */
    public removeAnimationGroup(toRemove: AnimationGroup): number {
        var index = this.animationGroups.indexOf(toRemove);
        if (index !== -1) {
            this.animationGroups.splice(index, 1);
        }
        return index;
    }

    /**
     * Removes the given multi-material from this scene.
     * @param toRemove The multi-material to remove
     * @returns The index of the removed multi-material
     */
    public removeMultiMaterial(toRemove: MultiMaterial): number {
        var index = this.multiMaterials.indexOf(toRemove);
        if (index !== -1) {
            this.multiMaterials.splice(index, 1);
        }
        return index;
    }

    /**
     * Removes the given material from this scene.
     * @param toRemove The material to remove
     * @returns The index of the removed material
     */
    public removeMaterial(toRemove: Material): number {
        var index = toRemove._indexInSceneMaterialArray;
        if (index !== -1 && index < this.materials.length) {
            if (index !== this.materials.length - 1) {
                const lastMaterial = this.materials[this.materials.length - 1];
                this.materials[index] = lastMaterial;
                lastMaterial._indexInSceneMaterialArray = index;
            }

            toRemove._indexInSceneMaterialArray = -1;
            this.materials.pop();
        }

        this.onMaterialRemovedObservable.notifyObservers(toRemove);

        return index;
    }

    /**
     * Removes the given action manager from this scene.
     * @param toRemove The action manager to remove
     * @returns The index of the removed action manager
     */
    public removeActionManager(toRemove: AbstractActionManager): number {
        var index = this.actionManagers.indexOf(toRemove);
        if (index !== -1) {
            this.actionManagers.splice(index, 1);
        }
        return index;
    }

    /**
     * Removes the given texture from this scene.
     * @param toRemove The texture to remove
     * @returns The index of the removed texture
     */
    public removeTexture(toRemove: BaseTexture): number {
        var index = this.textures.indexOf(toRemove);
        if (index !== -1) {
            this.textures.splice(index, 1);
        }
        this.onTextureRemovedObservable.notifyObservers(toRemove);

        return index;
    }

    /**
     * Adds the given light to this scene
     * @param newLight The light to add
     */
    public addLight(newLight: Light): void {
        if (this._blockEntityCollection) {
            return;
        }
        this.lights.push(newLight);
        this.sortLightsByPriority();

        if (!newLight.parent) {
            newLight._addToSceneRootNodes();
        }

        // Add light to all meshes (To support if the light is removed and then re-added)
        for (var mesh of this.meshes) {
            if (mesh.lightSources.indexOf(newLight) === -1) {
                mesh.lightSources.push(newLight);
                mesh._resyncLightSources();
            }
        }

        this.onNewLightAddedObservable.notifyObservers(newLight);
    }

    /**
     * Sorts the list list based on light priorities
     */
    public sortLightsByPriority(): void {
        if (this.requireLightSorting) {
            this.lights.sort(Light.CompareLightsPriority);
        }
    }

    /**
     * Adds the given camera to this scene
     * @param newCamera The camera to add
     */
    public addCamera(newCamera: Camera): void {
        if (this._blockEntityCollection) {
            return;
        }

        this.cameras.push(newCamera);
        this.onNewCameraAddedObservable.notifyObservers(newCamera);

        if (!newCamera.parent) {
            newCamera._addToSceneRootNodes();
        }
    }

    /**
     * Adds the given skeleton to this scene
     * @param newSkeleton The skeleton to add
     */
    public addSkeleton(newSkeleton: Skeleton): void {
        if (this._blockEntityCollection) {
            return;
        }
        this.skeletons.push(newSkeleton);
        this.onNewSkeletonAddedObservable.notifyObservers(newSkeleton);
    }

    /**
     * Adds the given particle system to this scene
     * @param newParticleSystem The particle system to add
     */
    public addParticleSystem(newParticleSystem: IParticleSystem): void {
        if (this._blockEntityCollection) {
            return;
        }
        this.particleSystems.push(newParticleSystem);
    }

    /**
     * Adds the given animation to this scene
     * @param newAnimation The animation to add
     */
    public addAnimation(newAnimation: Animation): void {
        if (this._blockEntityCollection) {
            return;
        }
        this.animations.push(newAnimation);
    }

    /**
     * Adds the given animation group to this scene.
     * @param newAnimationGroup The animation group to add
     */
    public addAnimationGroup(newAnimationGroup: AnimationGroup): void {
        if (this._blockEntityCollection) {
            return;
        }
        this.animationGroups.push(newAnimationGroup);
    }

    /**
     * Adds the given multi-material to this scene
     * @param newMultiMaterial The multi-material to add
     */
    public addMultiMaterial(newMultiMaterial: MultiMaterial): void {
        if (this._blockEntityCollection) {
            return;
        }
        this.multiMaterials.push(newMultiMaterial);
    }

    /**
     * Adds the given material to this scene
     * @param newMaterial The material to add
     */
    public addMaterial(newMaterial: Material): void {
        if (this._blockEntityCollection) {
            return;
        }

        newMaterial._indexInSceneMaterialArray = this.materials.length;
        this.materials.push(newMaterial);
        this.onNewMaterialAddedObservable.notifyObservers(newMaterial);
    }

    /**
     * Adds the given morph target to this scene
     * @param newMorphTargetManager The morph target to add
     */
    public addMorphTargetManager(newMorphTargetManager: MorphTargetManager): void {
        if (this._blockEntityCollection) {
            return;
        }
        this.morphTargetManagers.push(newMorphTargetManager);
    }

    /**
     * Adds the given geometry to this scene
     * @param newGeometry The geometry to add
     */
    public addGeometry(newGeometry: Geometry): void {
        if (this._blockEntityCollection) {
            return;
        }

        if (this.geometriesByUniqueId) {
            this.geometriesByUniqueId[newGeometry.uniqueId] = this.geometries.length;
        }

        this.geometries.push(newGeometry);
    }

    /**
     * Adds the given action manager to this scene
     * @param newActionManager The action manager to add
     */
    public addActionManager(newActionManager: AbstractActionManager): void {
        this.actionManagers.push(newActionManager);
    }

    /**
     * Adds the given texture to this scene.
     * @param newTexture The texture to add
     */
    public addTexture(newTexture: BaseTexture): void {
        if (this._blockEntityCollection) {
            return;
        }
        this.textures.push(newTexture);
        this.onNewTextureAddedObservable.notifyObservers(newTexture);
    }

    /**
     * Switch active camera
     * @param newCamera defines the new active camera
     * @param attachControl defines if attachControl must be called for the new active camera (default: true)
     */
    public switchActiveCamera(newCamera: Camera, attachControl = true): void {
        var canvas = this._engine.getInputElement();

        if (!canvas) {
            return;
        }

        if (this.activeCamera) {
            this.activeCamera.detachControl(canvas);
        }
        this.activeCamera = newCamera;
        if (attachControl) {
            newCamera.attachControl(canvas);
        }
    }

    /**
     * sets the active camera of the scene using its ID
     * @param id defines the camera's ID
     * @return the new active camera or null if none found.
     */
    public setActiveCameraByID(id: string): Nullable<Camera> {
        var camera = this.getCameraByID(id);

        if (camera) {
            this.activeCamera = camera;
            return camera;
        }

        return null;
    }

    /**
     * sets the active camera of the scene using its name
     * @param name defines the camera's name
     * @returns the new active camera or null if none found.
     */
    public setActiveCameraByName(name: string): Nullable<Camera> {
        var camera = this.getCameraByName(name);

        if (camera) {
            this.activeCamera = camera;
            return camera;
        }

        return null;
    }

    /**
     * get an animation group using its name
     * @param name defines the material's name
     * @return the animation group or null if none found.
     */
    public getAnimationGroupByName(name: string): Nullable<AnimationGroup> {
        for (var index = 0; index < this.animationGroups.length; index++) {
            if (this.animationGroups[index].name === name) {
                return this.animationGroups[index];
            }
        }

        return null;
    }

    /**
     * Get a material using its unique id
     * @param uniqueId defines the material's unique id
     * @return the material or null if none found.
     */
    public getMaterialByUniqueID(uniqueId: number): Nullable<Material> {
        for (var index = 0; index < this.materials.length; index++) {
            if (this.materials[index].uniqueId === uniqueId) {
                return this.materials[index];
            }
        }

        return null;
    }

    /**
     * get a material using its id
     * @param id defines the material's ID
     * @return the material or null if none found.
     */
    public getMaterialByID(id: string): Nullable<Material> {
        for (var index = 0; index < this.materials.length; index++) {
            if (this.materials[index].id === id) {
                return this.materials[index];
            }
        }

        return null;
    }

    /**
     * Gets a the last added material using a given id
     * @param id defines the material's ID
     * @return the last material with the given id or null if none found.
     */
    public getLastMaterialByID(id: string): Nullable<Material> {
        for (var index = this.materials.length - 1; index >= 0; index--) {
            if (this.materials[index].id === id) {
                return this.materials[index];
            }
        }

        return null;
    }

    /**
     * Gets a material using its name
     * @param name defines the material's name
     * @return the material or null if none found.
     */
    public getMaterialByName(name: string): Nullable<Material> {
        for (var index = 0; index < this.materials.length; index++) {
            if (this.materials[index].name === name) {
                return this.materials[index];
            }
        }

        return null;
    }

    /**
     * Get a texture using its unique id
     * @param uniqueId defines the texture's unique id
     * @return the texture or null if none found.
     */
    public getTextureByUniqueID(uniqueId: number): Nullable<BaseTexture> {
        for (var index = 0; index < this.textures.length; index++) {
            if (this.textures[index].uniqueId === uniqueId) {
                return this.textures[index];
            }
        }

        return null;
    }

    /**
     * Gets a camera using its id
     * @param id defines the id to look for
     * @returns the camera or null if not found
     */
    public getCameraByID(id: string): Nullable<Camera> {
        for (var index = 0; index < this.cameras.length; index++) {
            if (this.cameras[index].id === id) {
                return this.cameras[index];
            }
        }

        return null;
    }

    /**
     * Gets a camera using its unique id
     * @param uniqueId defines the unique id to look for
     * @returns the camera or null if not found
     */
    public getCameraByUniqueID(uniqueId: number): Nullable<Camera> {
        for (var index = 0; index < this.cameras.length; index++) {
            if (this.cameras[index].uniqueId === uniqueId) {
                return this.cameras[index];
            }
        }

        return null;
    }

    /**
     * Gets a camera using its name
     * @param name defines the camera's name
     * @return the camera or null if none found.
     */
    public getCameraByName(name: string): Nullable<Camera> {
        for (var index = 0; index < this.cameras.length; index++) {
            if (this.cameras[index].name === name) {
                return this.cameras[index];
            }
        }

        return null;
    }

    /**
     * Gets a bone using its id
     * @param id defines the bone's id
     * @return the bone or null if not found
     */
    public getBoneByID(id: string): Nullable<Bone> {
        for (var skeletonIndex = 0; skeletonIndex < this.skeletons.length; skeletonIndex++) {
            var skeleton = this.skeletons[skeletonIndex];
            for (var boneIndex = 0; boneIndex < skeleton.bones.length; boneIndex++) {
                if (skeleton.bones[boneIndex].id === id) {
                    return skeleton.bones[boneIndex];
                }
            }
        }

        return null;
    }

    /**
    * Gets a bone using its id
    * @param name defines the bone's name
    * @return the bone or null if not found
    */
    public getBoneByName(name: string): Nullable<Bone> {
        for (var skeletonIndex = 0; skeletonIndex < this.skeletons.length; skeletonIndex++) {
            var skeleton = this.skeletons[skeletonIndex];
            for (var boneIndex = 0; boneIndex < skeleton.bones.length; boneIndex++) {
                if (skeleton.bones[boneIndex].name === name) {
                    return skeleton.bones[boneIndex];
                }
            }
        }

        return null;
    }

    /**
     * Gets a light node using its name
     * @param name defines the the light's name
     * @return the light or null if none found.
     */
    public getLightByName(name: string): Nullable<Light> {
        for (var index = 0; index < this.lights.length; index++) {
            if (this.lights[index].name === name) {
                return this.lights[index];
            }
        }

        return null;
    }

    /**
     * Gets a light node using its id
     * @param id defines the light's id
     * @return the light or null if none found.
     */
    public getLightByID(id: string): Nullable<Light> {
        for (var index = 0; index < this.lights.length; index++) {
            if (this.lights[index].id === id) {
                return this.lights[index];
            }
        }

        return null;
    }

    /**
     * Gets a light node using its scene-generated unique ID
     * @param uniqueId defines the light's unique id
     * @return the light or null if none found.
     */
    public getLightByUniqueID(uniqueId: number): Nullable<Light> {
        for (var index = 0; index < this.lights.length; index++) {
            if (this.lights[index].uniqueId === uniqueId) {
                return this.lights[index];
            }
        }

        return null;
    }

    /**
     * Gets a particle system by id
     * @param id defines the particle system id
     * @return the corresponding system or null if none found
     */
    public getParticleSystemByID(id: string): Nullable<IParticleSystem> {
        for (var index = 0; index < this.particleSystems.length; index++) {
            if (this.particleSystems[index].id === id) {
                return this.particleSystems[index];
            }
        }

        return null;
    }

    /**
     * Gets a geometry using its ID
     * @param id defines the geometry's id
     * @return the geometry or null if none found.
     */
    public getGeometryByID(id: string): Nullable<Geometry> {
        for (var index = 0; index < this.geometries.length; index++) {
            if (this.geometries[index].id === id) {
                return this.geometries[index];
            }
        }

        return null;
    }

    private _getGeometryByUniqueID(uniqueId: number): Nullable<Geometry> {
        if (this.geometriesByUniqueId) {
            const index = this.geometriesByUniqueId[uniqueId];
            if (index !== undefined) {
                return this.geometries[index];
            }
        }
        else {
            for (var index = 0; index < this.geometries.length; index++) {
                if (this.geometries[index].uniqueId === uniqueId) {
                    return this.geometries[index];
                }
            }
        }

        return null;
    }

    /**
     * Add a new geometry to this scene
     * @param geometry defines the geometry to be added to the scene.
     * @param force defines if the geometry must be pushed even if a geometry with this id already exists
     * @return a boolean defining if the geometry was added or not
     */
    public pushGeometry(geometry: Geometry, force?: boolean): boolean {
        if (!force && this._getGeometryByUniqueID(geometry.uniqueId)) {
            return false;
        }

        this.addGeometry(geometry);

        this.onNewGeometryAddedObservable.notifyObservers(geometry);

        return true;
    }

    /**
     * Removes an existing geometry
     * @param geometry defines the geometry to be removed from the scene
     * @return a boolean defining if the geometry was removed or not
     */
    public removeGeometry(geometry: Geometry): boolean {
        let index;
        if (this.geometriesByUniqueId) {
            index = this.geometriesByUniqueId[geometry.uniqueId];
            if (index === undefined) {
                return false;
            }
        }
        else {
            index = this.geometries.indexOf(geometry);
            if (index < 0) {
                return false;
            }
        }

        if (index !== this.geometries.length - 1) {
            const lastGeometry = this.geometries[this.geometries.length - 1];
            this.geometries[index] = lastGeometry;
            if (this.geometriesByUniqueId) {
                this.geometriesByUniqueId[lastGeometry.uniqueId] = index;
                this.geometriesByUniqueId[geometry.uniqueId] = undefined;
            }
        }

        this.geometries.pop();

        this.onGeometryRemovedObservable.notifyObservers(geometry);
        return true;
    }

    /**
     * Gets the list of geometries attached to the scene
     * @returns an array of Geometry
     */
    public getGeometries(): Geometry[] {
        return this.geometries;
    }

    /**
     * Gets the first added mesh found of a given ID
     * @param id defines the id to search for
     * @return the mesh found or null if not found at all
     */
    public getMeshByID(id: string): Nullable<AbstractMesh> {
        for (var index = 0; index < this.meshes.length; index++) {
            if (this.meshes[index].id === id) {
                return this.meshes[index];
            }
        }

        return null;
    }

    /**
     * Gets a list of meshes using their id
     * @param id defines the id to search for
     * @returns a list of meshes
     */
    public getMeshesByID(id: string): Array<AbstractMesh> {
        return this.meshes.filter(function(m) {
            return m.id === id;
        });
    }

    /**
     * Gets the first added transform node found of a given ID
     * @param id defines the id to search for
     * @return the found transform node or null if not found at all.
     */
    public getTransformNodeByID(id: string): Nullable<TransformNode> {
        for (var index = 0; index < this.transformNodes.length; index++) {
            if (this.transformNodes[index].id === id) {
                return this.transformNodes[index];
            }
        }

        return null;
    }

    /**
     * Gets a transform node with its auto-generated unique id
     * @param uniqueId efines the unique id to search for
     * @return the found transform node or null if not found at all.
     */
    public getTransformNodeByUniqueID(uniqueId: number): Nullable<TransformNode> {
        for (var index = 0; index < this.transformNodes.length; index++) {
            if (this.transformNodes[index].uniqueId === uniqueId) {
                return this.transformNodes[index];
            }
        }

        return null;
    }

    /**
     * Gets a list of transform nodes using their id
     * @param id defines the id to search for
     * @returns a list of transform nodes
     */
    public getTransformNodesByID(id: string): Array<TransformNode> {
        return this.transformNodes.filter(function(m) {
            return m.id === id;
        });
    }

    /**
     * Gets a mesh with its auto-generated unique id
     * @param uniqueId defines the unique id to search for
     * @return the found mesh or null if not found at all.
     */
    public getMeshByUniqueID(uniqueId: number): Nullable<AbstractMesh> {
        for (var index = 0; index < this.meshes.length; index++) {
            if (this.meshes[index].uniqueId === uniqueId) {
                return this.meshes[index];
            }
        }

        return null;
    }

    /**
     * Gets a the last added mesh using a given id
     * @param id defines the id to search for
     * @return the found mesh or null if not found at all.
     */
    public getLastMeshByID(id: string): Nullable<AbstractMesh> {
        for (var index = this.meshes.length - 1; index >= 0; index--) {
            if (this.meshes[index].id === id) {
                return this.meshes[index];
            }
        }

        return null;
    }

    /**
     * Gets a the last added node (Mesh, Camera, Light) using a given id
     * @param id defines the id to search for
     * @return the found node or null if not found at all
     */
    public getLastEntryByID(id: string): Nullable<Node> {
        var index: number;
        for (index = this.meshes.length - 1; index >= 0; index--) {
            if (this.meshes[index].id === id) {
                return this.meshes[index];
            }
        }

        for (index = this.transformNodes.length - 1; index >= 0; index--) {
            if (this.transformNodes[index].id === id) {
                return this.transformNodes[index];
            }
        }

        for (index = this.cameras.length - 1; index >= 0; index--) {
            if (this.cameras[index].id === id) {
                return this.cameras[index];
            }
        }

        for (index = this.lights.length - 1; index >= 0; index--) {
            if (this.lights[index].id === id) {
                return this.lights[index];
            }
        }

        return null;
    }

    /**
     * Gets a node (Mesh, Camera, Light) using a given id
     * @param id defines the id to search for
     * @return the found node or null if not found at all
     */
    public getNodeByID(id: string): Nullable<Node> {
        const mesh = this.getMeshByID(id);
        if (mesh) {
            return mesh;
        }

        const transformNode = this.getTransformNodeByID(id);
        if (transformNode) {
            return transformNode;
        }

        const light = this.getLightByID(id);
        if (light) {
            return light;
        }

        const camera = this.getCameraByID(id);
        if (camera) {
            return camera;
        }

        const bone = this.getBoneByID(id);
        if (bone) {
            return bone;
        }

        return null;
    }

    /**
     * Gets a node (Mesh, Camera, Light) using a given name
     * @param name defines the name to search for
     * @return the found node or null if not found at all.
     */
    public getNodeByName(name: string): Nullable<Node> {
        const mesh = this.getMeshByName(name);
        if (mesh) {
            return mesh;
        }

        const transformNode = this.getTransformNodeByName(name);
        if (transformNode) {
            return transformNode;
        }

        const light = this.getLightByName(name);
        if (light) {
            return light;
        }

        const camera = this.getCameraByName(name);
        if (camera) {
            return camera;
        }

        const bone = this.getBoneByName(name);
        if (bone) {
            return bone;
        }

        return null;
    }

    /**
     * Gets a mesh using a given name
     * @param name defines the name to search for
     * @return the found mesh or null if not found at all.
     */
    public getMeshByName(name: string): Nullable<AbstractMesh> {
        for (var index = 0; index < this.meshes.length; index++) {
            if (this.meshes[index].name === name) {
                return this.meshes[index];
            }
        }

        return null;
    }

    /**
     * Gets a transform node using a given name
     * @param name defines the name to search for
     * @return the found transform node or null if not found at all.
     */
    public getTransformNodeByName(name: string): Nullable<TransformNode> {
        for (var index = 0; index < this.transformNodes.length; index++) {
            if (this.transformNodes[index].name === name) {
                return this.transformNodes[index];
            }
        }

        return null;
    }

    /**
     * Gets a skeleton using a given id (if many are found, this function will pick the last one)
     * @param id defines the id to search for
     * @return the found skeleton or null if not found at all.
     */
    public getLastSkeletonByID(id: string): Nullable<Skeleton> {
        for (var index = this.skeletons.length - 1; index >= 0; index--) {
            if (this.skeletons[index].id === id) {
                return this.skeletons[index];
            }
        }

        return null;
    }

    /**
     * Gets a skeleton using a given auto generated unique id
     * @param  uniqueId defines the unique id to search for
     * @return the found skeleton or null if not found at all.
     */
    public getSkeletonByUniqueId(uniqueId: number): Nullable<Skeleton> {
        for (var index = 0; index < this.skeletons.length; index++) {
            if (this.skeletons[index].uniqueId === uniqueId) {
                return this.skeletons[index];
            }
        }

        return null;
    }

    /**
     * Gets a skeleton using a given id (if many are found, this function will pick the first one)
     * @param id defines the id to search for
     * @return the found skeleton or null if not found at all.
     */
    public getSkeletonById(id: string): Nullable<Skeleton> {
        for (var index = 0; index < this.skeletons.length; index++) {
            if (this.skeletons[index].id === id) {
                return this.skeletons[index];
            }
        }

        return null;
    }

    /**
     * Gets a skeleton using a given name
     * @param name defines the name to search for
     * @return the found skeleton or null if not found at all.
     */
    public getSkeletonByName(name: string): Nullable<Skeleton> {
        for (var index = 0; index < this.skeletons.length; index++) {
            if (this.skeletons[index].name === name) {
                return this.skeletons[index];
            }
        }

        return null;
    }

    /**
     * Gets a morph target manager  using a given id (if many are found, this function will pick the last one)
     * @param id defines the id to search for
     * @return the found morph target manager or null if not found at all.
     */
    public getMorphTargetManagerById(id: number): Nullable<MorphTargetManager> {
        for (var index = 0; index < this.morphTargetManagers.length; index++) {
            if (this.morphTargetManagers[index].uniqueId === id) {
                return this.morphTargetManagers[index];
            }
        }

        return null;
    }

    /**
     * Gets a morph target using a given id (if many are found, this function will pick the first one)
     * @param id defines the id to search for
     * @return the found morph target or null if not found at all.
     */
    public getMorphTargetById(id: string): Nullable<MorphTarget> {
        for (let managerIndex = 0; managerIndex < this.morphTargetManagers.length; ++managerIndex) {
            const morphTargetManager = this.morphTargetManagers[managerIndex];
            for (let index = 0; index < morphTargetManager.numTargets; ++index) {
                const target = morphTargetManager.getTarget(index);
                if (target.id === id) {
                    return target;
                }
            }
        }
        return null;
    }

    /**
     * Gets a morph target using a given name (if many are found, this function will pick the first one)
     * @param name defines the name to search for
     * @return the found morph target or null if not found at all.
     */
    public getMorphTargetByName(name: string): Nullable<MorphTarget> {
        for (let managerIndex = 0; managerIndex < this.morphTargetManagers.length; ++managerIndex) {
            const morphTargetManager = this.morphTargetManagers[managerIndex];
            for (let index = 0; index < morphTargetManager.numTargets; ++index) {
                const target = morphTargetManager.getTarget(index);
                if (target.name === name) {
                    return target;
                }
            }
        }
        return null;
    }

    /**
     * Gets a boolean indicating if the given mesh is active
     * @param mesh defines the mesh to look for
     * @returns true if the mesh is in the active list
     */
    public isActiveMesh(mesh: AbstractMesh): boolean {
        return (this._activeMeshes.indexOf(mesh) !== -1);
    }

    /**
     * Return a unique id as a string which can serve as an identifier for the scene
     */
    public get uid(): string {
        if (!this._uid) {
            this._uid = Tools.RandomId();
        }
        return this._uid;
    }

    /**
     * Add an externaly attached data from its key.
     * This method call will fail and return false, if such key already exists.
     * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
     * @param key the unique key that identifies the data
     * @param data the data object to associate to the key for this Engine instance
     * @return true if no such key were already present and the data was added successfully, false otherwise
     */
    public addExternalData<T>(key: string, data: T): boolean {
        if (!this._externalData) {
            this._externalData = new StringDictionary<Object>();
        }
        return this._externalData.add(key, data);
    }

    /**
     * Get an externaly attached data from its key
     * @param key the unique key that identifies the data
     * @return the associated data, if present (can be null), or undefined if not present
     */
    public getExternalData<T>(key: string): Nullable<T> {
        if (!this._externalData) {
            return null;
        }
        return <T>this._externalData.get(key);
    }

    /**
     * Get an externaly attached data from its key, create it using a factory if it's not already present
     * @param key the unique key that identifies the data
     * @param factory the factory that will be called to create the instance if and only if it doesn't exists
     * @return the associated data, can be null if the factory returned null.
     */
    public getOrAddExternalDataWithFactory<T>(key: string, factory: (k: string) => T): T {
        if (!this._externalData) {
            this._externalData = new StringDictionary<Object>();
        }
        return <T>this._externalData.getOrAddWithFactory(key, factory);
    }

    /**
     * Remove an externaly attached data from the Engine instance
     * @param key the unique key that identifies the data
     * @return true if the data was successfully removed, false if it doesn't exist
     */
    public removeExternalData(key: string): boolean {
        return this._externalData.remove(key);
    }

    private _evaluateSubMesh(subMesh: SubMesh, mesh: AbstractMesh, initialMesh: AbstractMesh): void {
        if (initialMesh.hasInstances || initialMesh.isAnInstance || this.dispatchAllSubMeshesOfActiveMeshes || this._skipFrustumClipping || mesh.alwaysSelectAsActiveMesh || mesh.subMeshes.length === 1 || subMesh.isInFrustum(this._frustumPlanes)) {
            for (let step of this._evaluateSubMeshStage) {
                step.action(mesh, subMesh);
            }

            const material = subMesh.getMaterial();
            if (material !== null && material !== undefined) {
                // Render targets
                if (material.hasRenderTargetTextures && material.getRenderTargetTextures != null) {
                    if (this._processedMaterials.indexOf(material) === -1) {
                        this._processedMaterials.push(material);

                        this._renderTargets.concatWithNoDuplicate(material.getRenderTargetTextures!());
                    }
                }

                // Dispatch
                this._renderingManager.dispatch(subMesh, mesh, material);
            }
        }
    }

    /**
     * Clear the processed materials smart array preventing retention point in material dispose.
     */
    public freeProcessedMaterials(): void {
        this._processedMaterials.dispose();
    }

    private _preventFreeActiveMeshesAndRenderingGroups = false;

    /** Gets or sets a boolean blocking all the calls to freeActiveMeshes and freeRenderingGroups
     * It can be used in order to prevent going through methods freeRenderingGroups and freeActiveMeshes several times to improve performance
     * when disposing several meshes in a row or a hierarchy of meshes.
     * When used, it is the responsability of the user to blockfreeActiveMeshesAndRenderingGroups back to false.
     */
    public get blockfreeActiveMeshesAndRenderingGroups(): boolean {
        return this._preventFreeActiveMeshesAndRenderingGroups;
    }

    public set blockfreeActiveMeshesAndRenderingGroups(value: boolean) {
        if (this._preventFreeActiveMeshesAndRenderingGroups === value) {
            return;
        }

        if (value) {
            this.freeActiveMeshes();
            this.freeRenderingGroups();
        }

        this._preventFreeActiveMeshesAndRenderingGroups = value;
    }

    /**
     * Clear the active meshes smart array preventing retention point in mesh dispose.
     */
    public freeActiveMeshes(): void {
        if (this.blockfreeActiveMeshesAndRenderingGroups) {
            return;
        }

        this._activeMeshes.dispose();
        if (this.activeCamera && this.activeCamera._activeMeshes) {
            this.activeCamera._activeMeshes.dispose();
        }
        if (this.activeCameras) {
            for (let i = 0; i < this.activeCameras.length; i++) {
                let activeCamera = this.activeCameras[i];
                if (activeCamera && activeCamera._activeMeshes) {
                    activeCamera._activeMeshes.dispose();
                }
            }
        }
    }

    /**
     * Clear the info related to rendering groups preventing retention points during dispose.
     */
    public freeRenderingGroups(): void {
        if (this.blockfreeActiveMeshesAndRenderingGroups) {
            return;
        }

        if (this._renderingManager) {
            this._renderingManager.freeRenderingGroups();
        }
        if (this.textures) {
            for (let i = 0; i < this.textures.length; i++) {
                let texture = this.textures[i];
                if (texture && (<RenderTargetTexture>texture).renderList) {
                    (<RenderTargetTexture>texture).freeRenderingGroups();
                }
            }
        }
    }

    /** @hidden */
    public _isInIntermediateRendering(): boolean {
        return this._intermediateRendering;
    }

    /**
     * Lambda returning the list of potentially active meshes.
     */
    public getActiveMeshCandidates: () => ISmartArrayLike<AbstractMesh>;

    /**
     * Lambda returning the list of potentially active sub meshes.
     */
    public getActiveSubMeshCandidates: (mesh: AbstractMesh) => ISmartArrayLike<SubMesh>;

    /**
     * Lambda returning the list of potentially intersecting sub meshes.
     */
    public getIntersectingSubMeshCandidates: (mesh: AbstractMesh, localRay: Ray) => ISmartArrayLike<SubMesh>;

    /**
     * Lambda returning the list of potentially colliding sub meshes.
     */
    public getCollidingSubMeshCandidates: (mesh: AbstractMesh, collider: Collider) => ISmartArrayLike<SubMesh>;

    private _activeMeshesFrozen = false;
    private _skipEvaluateActiveMeshesCompletely = false;

    /**
     * Use this function to stop evaluating active meshes. The current list will be keep alive between frames
     * @param skipEvaluateActiveMeshes defines an optional boolean indicating that the evaluate active meshes step must be completely skipped
     * @returns the current scene
     */
    public freezeActiveMeshes(skipEvaluateActiveMeshes = false): Scene {
        this.executeWhenReady(() => {
            if (!this.activeCamera) {
                return;
            }

            if (!this._frustumPlanes) {
                this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix());
            }

            this._evaluateActiveMeshes();
            this._activeMeshesFrozen = true;
            this._skipEvaluateActiveMeshesCompletely = skipEvaluateActiveMeshes;

            for (var index = 0; index < this._activeMeshes.length; index++) {
                this._activeMeshes.data[index]._freeze();
            }
        });
        return this;
    }

    /**
     * Use this function to restart evaluating active meshes on every frame
     * @returns the current scene
     */
    public unfreezeActiveMeshes(): Scene {

        for (var index = 0; index < this.meshes.length; index++) {
            const mesh = this.meshes[index];
            if (mesh._internalAbstractMeshDataInfo) {
                mesh._internalAbstractMeshDataInfo._isActive = false;
            }
        }

        for (var index = 0; index < this._activeMeshes.length; index++) {
            this._activeMeshes.data[index]._unFreeze();
        }

        this._activeMeshesFrozen = false;
        return this;
    }

    private _evaluateActiveMeshes(): void {
        if (this._activeMeshesFrozen && this._activeMeshes.length) {

            if (!this._skipEvaluateActiveMeshesCompletely) {
                const len = this._activeMeshes.length;
                for (let i = 0; i < len; i++) {
                    let mesh = this._activeMeshes.data[i];
                    mesh.computeWorldMatrix();
                }
            }

            if (this._activeParticleSystems) {
                const psLength = this._activeParticleSystems.length;
                for (let i = 0; i < psLength; i++) {
                    this._activeParticleSystems.data[i].animate();
                }
            }

            return;
        }

        if (!this.activeCamera) {
            return;
        }

        this.onBeforeActiveMeshesEvaluationObservable.notifyObservers(this);

        this.activeCamera._activeMeshes.reset();
        this._activeMeshes.reset();
        this._renderingManager.reset();
        this._processedMaterials.reset();
        this._activeParticleSystems.reset();
        this._activeSkeletons.reset();
        this._softwareSkinnedMeshes.reset();
        for (let step of this._beforeEvaluateActiveMeshStage) {
            step.action();
        }

        // Determine mesh candidates
        const meshes = this.getActiveMeshCandidates();

        // Check each mesh
        const len = meshes.length;
        for (let i = 0; i < len; i++) {
            const mesh = meshes.data[i];
            if (mesh.isBlocked) {
                continue;
            }

            this._totalVertices.addCount(mesh.getTotalVertices(), false);

            if (!mesh.isReady() || !mesh.isEnabled() || mesh.scaling.lengthSquared() === 0) {
                continue;
            }

            mesh.computeWorldMatrix();

            // Intersections
            if (mesh.actionManager && mesh.actionManager.hasSpecificTriggers2(Constants.ACTION_OnIntersectionEnterTrigger, Constants.ACTION_OnIntersectionExitTrigger)) {
                this._meshesForIntersections.pushNoDuplicate(mesh);
            }

            // Switch to current LOD
            let meshToRender = this.customLODSelector ? this.customLODSelector(mesh, this.activeCamera) : mesh.getLOD(this.activeCamera);
            if (meshToRender === undefined || meshToRender === null) {
                continue;
            }

            // Compute world matrix if LOD is billboard
            if (meshToRender !== mesh && meshToRender.billboardMode !== TransformNode.BILLBOARDMODE_NONE) {
                meshToRender.computeWorldMatrix();
            }

            mesh._preActivate();

            if (mesh.isVisible && mesh.visibility > 0 && ((mesh.layerMask & this.activeCamera.layerMask) !== 0) && (this._skipFrustumClipping || mesh.alwaysSelectAsActiveMesh || mesh.isInFrustum(this._frustumPlanes))) {
                this._activeMeshes.push(mesh);
                this.activeCamera._activeMeshes.push(mesh);

                if (meshToRender !== mesh) {
                    meshToRender._activate(this._renderId, false);
                }

                if (mesh._activate(this._renderId, false)) {
                    if (!mesh.isAnInstance) {
                        meshToRender._internalAbstractMeshDataInfo._onlyForInstances = false;
                    } else {
                        if (mesh._internalAbstractMeshDataInfo._actAsRegularMesh) {
                            meshToRender = mesh;
                        }
                    }
                    meshToRender._internalAbstractMeshDataInfo._isActive = true;
                    this._activeMesh(mesh, meshToRender);
                }

                mesh._postActivate();
            }
        }

        this.onAfterActiveMeshesEvaluationObservable.notifyObservers(this);

        // Particle systems
        if (this.particlesEnabled) {
            this.onBeforeParticlesRenderingObservable.notifyObservers(this);
            for (var particleIndex = 0; particleIndex < this.particleSystems.length; particleIndex++) {
                var particleSystem = this.particleSystems[particleIndex];

                if (!particleSystem.isStarted() || !particleSystem.emitter) {
                    continue;
                }

                let emitter = <any>particleSystem.emitter;
                if (!emitter.position || emitter.isEnabled()) {
                    this._activeParticleSystems.push(particleSystem);
                    particleSystem.animate();
                    this._renderingManager.dispatchParticles(particleSystem);
                }
            }
            this.onAfterParticlesRenderingObservable.notifyObservers(this);
        }
    }

    private _activeMesh(sourceMesh: AbstractMesh, mesh: AbstractMesh): void {
        if (this._skeletonsEnabled && mesh.skeleton !== null && mesh.skeleton !== undefined) {
            if (this._activeSkeletons.pushNoDuplicate(mesh.skeleton)) {
                mesh.skeleton.prepare();
            }

            if (!mesh.computeBonesUsingShaders) {
                this._softwareSkinnedMeshes.pushNoDuplicate(<Mesh>mesh);
            }
        }

        for (let step of this._activeMeshStage) {
            step.action(sourceMesh, mesh);
        }

        if (
            mesh !== undefined && mesh !== null
            && mesh.subMeshes !== undefined && mesh.subMeshes !== null && mesh.subMeshes.length > 0
        ) {
            const subMeshes = this.getActiveSubMeshCandidates(mesh);
            const len = subMeshes.length;
            for (let i = 0; i < len; i++) {
                const subMesh = subMeshes.data[i];
                this._evaluateSubMesh(subMesh, mesh, sourceMesh);
            }
        }
    }

    /**
     * Update the transform matrix to update from the current active camera
     * @param force defines a boolean used to force the update even if cache is up to date
     */
    public updateTransformMatrix(force?: boolean): void {
        if (!this.activeCamera) {
            return;
        }
        this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix(force));
    }

    private _bindFrameBuffer() {
        if (this.activeCamera && this.activeCamera._multiviewTexture) {
            this.activeCamera._multiviewTexture._bindFrameBuffer();
        } else if (this.activeCamera && this.activeCamera.outputRenderTarget) {
            var useMultiview = this.getEngine().getCaps().multiview && this.activeCamera.outputRenderTarget && this.activeCamera.outputRenderTarget.getViewCount() > 1;
            if (useMultiview) {
                this.activeCamera.outputRenderTarget._bindFrameBuffer();
            } else {
                var internalTexture = this.activeCamera.outputRenderTarget.getInternalTexture();
                if (internalTexture) {
                    this.getEngine().bindFramebuffer(internalTexture);
                } else {
                    Logger.Error("Camera contains invalid customDefaultRenderTarget");
                }
            }
        } else {
            this.getEngine().restoreDefaultFramebuffer(); // Restore back buffer if needed
        }
    }
    /** @hidden */
    public _allowPostProcessClearColor = true;
    /** @hidden */
    public _renderForCamera(camera: Camera, rigParent?: Camera): void {
        if (camera && camera._skipRendering) {
            return;
        }

        var engine = this._engine;

        // Use _activeCamera instead of activeCamera to avoid onActiveCameraChanged
        this._activeCamera = camera;

        if (!this.activeCamera) {
            throw new Error("Active camera not set");
        }

        // Viewport
        engine.setViewport(this.activeCamera.viewport);

        // Camera
        this.resetCachedMaterial();
        this._renderId++;

        var useMultiview = this.getEngine().getCaps().multiview && camera.outputRenderTarget && camera.outputRenderTarget.getViewCount() > 1;
        if (useMultiview) {
            this.setTransformMatrix(camera._rigCameras[0].getViewMatrix(), camera._rigCameras[0].getProjectionMatrix(), camera._rigCameras[1].getViewMatrix(), camera._rigCameras[1].getProjectionMatrix());
        } else {
            this.updateTransformMatrix();
        }

        this.onBeforeCameraRenderObservable.notifyObservers(this.activeCamera);

        // Meshes
        this._evaluateActiveMeshes();

        // Software skinning
        for (var softwareSkinnedMeshIndex = 0; softwareSkinnedMeshIndex < this._softwareSkinnedMeshes.length; softwareSkinnedMeshIndex++) {
            var mesh = this._softwareSkinnedMeshes.data[softwareSkinnedMeshIndex];

            mesh.applySkeleton(<Skeleton>mesh.skeleton);
        }

        // Render targets
        this.onBeforeRenderTargetsRenderObservable.notifyObservers(this);

        if (camera.customRenderTargets && camera.customRenderTargets.length > 0) {
            this._renderTargets.concatWithNoDuplicate(camera.customRenderTargets);
        }

        if (rigParent && rigParent.customRenderTargets && rigParent.customRenderTargets.length > 0) {
            this._renderTargets.concatWithNoDuplicate(rigParent.customRenderTargets);
        }

        // Collects render targets from external components.
        for (let step of this._gatherActiveCameraRenderTargetsStage) {
            step.action(this._renderTargets);
        }

        let needRebind = false;
        if (this.renderTargetsEnabled) {
            this._intermediateRendering = true;

            if (this._renderTargets.length > 0) {
                Tools.StartPerformanceCounter("Render targets", this._renderTargets.length > 0);
                for (var renderIndex = 0; renderIndex < this._renderTargets.length; renderIndex++) {
                    let renderTarget = this._renderTargets.data[renderIndex];
                    if (renderTarget._shouldRender()) {
                        this._renderId++;
                        var hasSpecialRenderTargetCamera = renderTarget.activeCamera && renderTarget.activeCamera !== this.activeCamera;
                        renderTarget.render((<boolean>hasSpecialRenderTargetCamera), this.dumpNextRenderTargets);
                        needRebind = true;
                    }
                }
                Tools.EndPerformanceCounter("Render targets", this._renderTargets.length > 0);

                this._renderId++;
            }

            for (let step of this._cameraDrawRenderTargetStage) {
                needRebind = step.action(this.activeCamera) || needRebind;
            }

            this._intermediateRendering = false;

            // Need to bind if sub-camera has an outputRenderTarget eg. for webXR
            if (this.activeCamera && this.activeCamera.outputRenderTarget) {
                needRebind = true;
            }
        }

        // Restore framebuffer after rendering to targets
        if (needRebind && !this.prePass) {
            this._bindFrameBuffer();
        }

        this.onAfterRenderTargetsRenderObservable.notifyObservers(this);

        // Prepare Frame
        if (this.postProcessManager && !camera._multiviewTexture && !this.prePass) {
            this.postProcessManager._prepareFrame();
        }

        // Before Camera Draw
        for (let step of this._beforeCameraDrawStage) {
            step.action(this.activeCamera);
        }

        // Render
        this.onBeforeDrawPhaseObservable.notifyObservers(this);
        this._renderingManager.render(null, null, true, true);
        this.onAfterDrawPhaseObservable.notifyObservers(this);

        // After Camera Draw
        for (let step of this._afterCameraDrawStage) {
            step.action(this.activeCamera);
        }

        // Finalize frame
        if (this.postProcessManager && !camera._multiviewTexture) {
            this.postProcessManager._finalizeFrame(camera.isIntermediate);
        }

        // Reset some special arrays
        this._renderTargets.reset();

        this.onAfterCameraRenderObservable.notifyObservers(this.activeCamera);
    }

    private _processSubCameras(camera: Camera): void {
        if (camera.cameraRigMode === Camera.RIG_MODE_NONE || (camera.outputRenderTarget && camera.outputRenderTarget.getViewCount() > 1 && this.getEngine().getCaps().multiview)) {
            this._renderForCamera(camera);
            this.onAfterRenderCameraObservable.notifyObservers(camera);
            return;
        }

        if (camera._useMultiviewToSingleView) {
            this._renderMultiviewToSingleView(camera);
        } else {
            // rig cameras
            for (var index = 0; index < camera._rigCameras.length; index++) {
                this._renderForCamera(camera._rigCameras[index], camera);
            }
        }

        // Use _activeCamera instead of activeCamera to avoid onActiveCameraChanged
        this._activeCamera = camera;
        this.setTransformMatrix(this._activeCamera.getViewMatrix(), this._activeCamera.getProjectionMatrix());
        this.onAfterRenderCameraObservable.notifyObservers(camera);
    }

    private _checkIntersections(): void {
        for (var index = 0; index < this._meshesForIntersections.length; index++) {
            var sourceMesh = this._meshesForIntersections.data[index];

            if (!sourceMesh.actionManager) {
                continue;
            }

            for (var actionIndex = 0; sourceMesh.actionManager && actionIndex < sourceMesh.actionManager.actions.length; actionIndex++) {
                var action = sourceMesh.actionManager.actions[actionIndex];

                if (action.trigger === Constants.ACTION_OnIntersectionEnterTrigger || action.trigger === Constants.ACTION_OnIntersectionExitTrigger) {
                    var parameters = action.getTriggerParameter();
                    var otherMesh = parameters instanceof AbstractMesh ? parameters : parameters.mesh;

                    var areIntersecting = otherMesh.intersectsMesh(sourceMesh, parameters.usePreciseIntersection);
                    var currentIntersectionInProgress = sourceMesh._intersectionsInProgress.indexOf(otherMesh);

                    if (areIntersecting && currentIntersectionInProgress === -1) {
                        if (action.trigger === Constants.ACTION_OnIntersectionEnterTrigger) {
                            action._executeCurrent(ActionEvent.CreateNew(sourceMesh, undefined, otherMesh));
                            sourceMesh._intersectionsInProgress.push(otherMesh);
                        } else if (action.trigger === Constants.ACTION_OnIntersectionExitTrigger) {
                            sourceMesh._intersectionsInProgress.push(otherMesh);
                        }
                    } else if (!areIntersecting && currentIntersectionInProgress > -1) {
                        //They intersected, and now they don't.

                        //is this trigger an exit trigger? execute an event.
                        if (action.trigger === Constants.ACTION_OnIntersectionExitTrigger) {
                            action._executeCurrent(ActionEvent.CreateNew(sourceMesh, undefined, otherMesh));
                        }

                        //if this is an exit trigger, or no exit trigger exists, remove the id from the intersection in progress array.
                        if (!sourceMesh.actionManager.hasSpecificTrigger(Constants.ACTION_OnIntersectionExitTrigger, (parameter) => {
                            var parameterMesh = parameter instanceof AbstractMesh ? parameter : parameter.mesh;
                            return otherMesh === parameterMesh;
                        }) || action.trigger === Constants.ACTION_OnIntersectionExitTrigger) {
                            sourceMesh._intersectionsInProgress.splice(currentIntersectionInProgress, 1);
                        }
                    }
                }
            }
        }
    }

    /** @hidden */
    public _advancePhysicsEngineStep(step: number) {
        // Do nothing. Code will be replaced if physics engine component is referenced
    }

    /**
     * User updatable function that will return a deterministic frame time when engine is in deterministic lock step mode
     */
    public getDeterministicFrameTime: () => number = () => {
        return this._engine.getTimeStep();
    }

    /** @hidden */
    public _animate(): void {
        // Nothing to do as long as Animatable have not been imported.
    }

    /** Execute all animations (for a frame) */
    public animate() {
        if (this._engine.isDeterministicLockStep()) {
            var deltaTime = Math.max(Scene.MinDeltaTime, Math.min(this._engine.getDeltaTime(), Scene.MaxDeltaTime)) + this._timeAccumulator;

            let defaultFrameTime = this._engine.getTimeStep();
            var defaultFPS = (1000.0 / defaultFrameTime) / 1000.0;

            let stepsTaken = 0;

            var maxSubSteps = this._engine.getLockstepMaxSteps();

            var internalSteps = Math.floor(deltaTime / defaultFrameTime);
            internalSteps = Math.min(internalSteps, maxSubSteps);

            while (deltaTime > 0 && stepsTaken < internalSteps) {
                this.onBeforeStepObservable.notifyObservers(this);

                // Animations
                this._animationRatio = defaultFrameTime * defaultFPS;
                this._animate();
                this.onAfterAnimationsObservable.notifyObservers(this);

                // Physics
                if (this.physicsEnabled) {
                    this._advancePhysicsEngineStep(defaultFrameTime);
                }

                this.onAfterStepObservable.notifyObservers(this);
                this._currentStepId++;

                stepsTaken++;
                deltaTime -= defaultFrameTime;

            }

            this._timeAccumulator = deltaTime < 0 ? 0 : deltaTime;

        }
        else {
            // Animations
            var deltaTime = this.useConstantAnimationDeltaTime ? 16 : Math.max(Scene.MinDeltaTime, Math.min(this._engine.getDeltaTime(), Scene.MaxDeltaTime));
            this._animationRatio = deltaTime * (60.0 / 1000.0);
            this._animate();
            this.onAfterAnimationsObservable.notifyObservers(this);

            // Physics
            if (this.physicsEnabled) {
                this._advancePhysicsEngineStep(deltaTime);
            }
        }
    }

    /**
     * Render the scene
     * @param updateCameras defines a boolean indicating if cameras must update according to their inputs (true by default)
     * @param ignoreAnimations defines a boolean indicating if animations should not be executed (false by default)
     */
    public render(updateCameras = true, ignoreAnimations = false): void {
        if (this.isDisposed) {
            return;
        }

        if (this.onReadyObservable.hasObservers() && this._executeWhenReadyTimeoutId === -1) {
            this._checkIsReady();
        }

        this._frameId++;

        // Register components that have been associated lately to the scene.
        this._registerTransientComponents();

        this._activeParticles.fetchNewFrame();
        this._totalVertices.fetchNewFrame();
        this._activeIndices.fetchNewFrame();
        this._activeBones.fetchNewFrame();
        this._meshesForIntersections.reset();
        this.resetCachedMaterial();

        this.onBeforeAnimationsObservable.notifyObservers(this);

        // Actions
        if (this.actionManager) {
            this.actionManager.processTrigger(Constants.ACTION_OnEveryFrameTrigger);
        }

        // Animations
        if (!ignoreAnimations) {
            this.animate();
        }

        // Before camera update steps
        for (let step of this._beforeCameraUpdateStage) {
            step.action();
        }

        // Update Cameras
        if (updateCameras) {
            if (this.activeCameras.length > 0) {
                for (var cameraIndex = 0; cameraIndex < this.activeCameras.length; cameraIndex++) {
                    let camera = this.activeCameras[cameraIndex];
                    camera.update();
                    if (camera.cameraRigMode !== Camera.RIG_MODE_NONE) {
                        // rig cameras
                        for (var index = 0; index < camera._rigCameras.length; index++) {
                            camera._rigCameras[index].update();
                        }
                    }
                }
            } else if (this.activeCamera) {
                this.activeCamera.update();
                if (this.activeCamera.cameraRigMode !== Camera.RIG_MODE_NONE) {
                    // rig cameras
                    for (var index = 0; index < this.activeCamera._rigCameras.length; index++) {
                        this.activeCamera._rigCameras[index].update();
                    }
                }
            }
        }

        // Before render
        this.onBeforeRenderObservable.notifyObservers(this);

        // Customs render targets
        this.onBeforeRenderTargetsRenderObservable.notifyObservers(this);
        var engine = this.getEngine();
        var currentActiveCamera = this.activeCamera;
        if (this.renderTargetsEnabled) {
            Tools.StartPerformanceCounter("Custom render targets", this.customRenderTargets.length > 0);
            this._intermediateRendering = true;
            for (var customIndex = 0; customIndex < this.customRenderTargets.length; customIndex++) {
                var renderTarget = this.customRenderTargets[customIndex];
                if (renderTarget._shouldRender()) {
                    this._renderId++;

                    this.activeCamera = renderTarget.activeCamera || this.activeCamera;

                    if (!this.activeCamera) {
                        throw new Error("Active camera not set");
                    }

                    // Viewport
                    engine.setViewport(this.activeCamera.viewport);

                    // Camera
                    this.updateTransformMatrix();

                    renderTarget.render(currentActiveCamera !== this.activeCamera, this.dumpNextRenderTargets);
                }
            }
            Tools.EndPerformanceCounter("Custom render targets", this.customRenderTargets.length > 0);
            this._intermediateRendering = false;
            this._renderId++;
        }

        // Restore back buffer
        this.activeCamera = currentActiveCamera;
        if (this._activeCamera && this._activeCamera.cameraRigMode !== Camera.RIG_MODE_CUSTOM && !this.prePass) {
            this._bindFrameBuffer();
        }
        this.onAfterRenderTargetsRenderObservable.notifyObservers(this);

        for (let step of this._beforeClearStage) {
            step.action();
        }

        // Clear
        if ((this.autoClearDepthAndStencil || this.autoClear) && !this.prePass) {
            this._engine.clear(this.clearColor,
                this.autoClear || this.forceWireframe || this.forcePointsCloud,
                this.autoClearDepthAndStencil,
                this.autoClearDepthAndStencil);
        }

        // Collects render targets from external components.
        for (let step of this._gatherRenderTargetsStage) {
            step.action(this._renderTargets);
        }

        // Multi-cameras?
        if (this.activeCameras.length > 0) {
            for (var cameraIndex = 0; cameraIndex < this.activeCameras.length; cameraIndex++) {
                if (cameraIndex > 0) {
                    this._engine.clear(null, false, true, true);
                }

                this._processSubCameras(this.activeCameras[cameraIndex]);
            }
        } else {
            if (!this.activeCamera) {
                throw new Error("No camera defined");
            }

            this._processSubCameras(this.activeCamera);
        }

        // Intersection checks
        this._checkIntersections();

        // Executes the after render stage actions.
        for (let step of this._afterRenderStage) {
            step.action();
        }

        // After render
        if (this.afterRender) {
            this.afterRender();
        }

        this.onAfterRenderObservable.notifyObservers(this);

        // Cleaning
        if (this._toBeDisposed.length) {
            for (var index = 0; index < this._toBeDisposed.length; index++) {
                var data = this._toBeDisposed[index];
                if (data) {
                    data.dispose();
                }
            }

            this._toBeDisposed = [];
        }

        if (this.dumpNextRenderTargets) {
            this.dumpNextRenderTargets = false;
        }

        this._activeBones.addCount(0, true);
        this._activeIndices.addCount(0, true);
        this._activeParticles.addCount(0, true);
    }

    /**
     * Freeze all materials
     * A frozen material will not be updatable but should be faster to render
     */
    public freezeMaterials(): void {
        for (var i = 0; i < this.materials.length; i++) {
            this.materials[i].freeze();
        }
    }

    /**
     * Unfreeze all materials
     * A frozen material will not be updatable but should be faster to render
     */
    public unfreezeMaterials(): void {
        for (var i = 0; i < this.materials.length; i++) {
            this.materials[i].unfreeze();
        }
    }

    /**
     * Releases all held ressources
     */
    public dispose(): void {
        this.beforeRender = null;
        this.afterRender = null;

        if (EngineStore._LastCreatedScene === this) {
            EngineStore._LastCreatedScene = null;
        }

        this.skeletons = [];
        this.morphTargetManagers = [];
        this._transientComponents = [];
        this._isReadyForMeshStage.clear();
        this._beforeEvaluateActiveMeshStage.clear();
        this._evaluateSubMeshStage.clear();
        this._activeMeshStage.clear();
        this._cameraDrawRenderTargetStage.clear();
        this._beforeCameraDrawStage.clear();
        this._beforeRenderTargetDrawStage.clear();
        this._beforeRenderingGroupDrawStage.clear();
        this._beforeRenderingMeshStage.clear();
        this._afterRenderingMeshStage.clear();
        this._afterRenderingGroupDrawStage.clear();
        this._afterCameraDrawStage.clear();
        this._afterRenderTargetDrawStage.clear();
        this._afterRenderStage.clear();
        this._beforeCameraUpdateStage.clear();
        this._beforeClearStage.clear();
        this._gatherRenderTargetsStage.clear();
        this._gatherActiveCameraRenderTargetsStage.clear();
        this._pointerMoveStage.clear();
        this._pointerDownStage.clear();
        this._pointerUpStage.clear();

        for (let component of this._components) {
            component.dispose();
        }

        this.importedMeshesFiles = new Array<string>();

        if (this.stopAllAnimations) {
            this.stopAllAnimations();
        }

        this.resetCachedMaterial();

        // Smart arrays
        if (this.activeCamera) {
            this.activeCamera._activeMeshes.dispose();
            this.activeCamera = null;
        }
        this._activeMeshes.dispose();
        this._renderingManager.dispose();
        this._processedMaterials.dispose();
        this._activeParticleSystems.dispose();
        this._activeSkeletons.dispose();
        this._softwareSkinnedMeshes.dispose();
        this._renderTargets.dispose();
        this._registeredForLateAnimationBindings.dispose();
        this._meshesForIntersections.dispose();
        this._toBeDisposed = [];

        // Abort active requests
        for (let request of this._activeRequests) {
            request.abort();
        }

        // Events
        this.onDisposeObservable.notifyObservers(this);

        this.onDisposeObservable.clear();
        this.onBeforeRenderObservable.clear();
        this.onAfterRenderObservable.clear();
        this.onBeforeRenderTargetsRenderObservable.clear();
        this.onAfterRenderTargetsRenderObservable.clear();
        this.onAfterStepObservable.clear();
        this.onBeforeStepObservable.clear();
        this.onBeforeActiveMeshesEvaluationObservable.clear();
        this.onAfterActiveMeshesEvaluationObservable.clear();
        this.onBeforeParticlesRenderingObservable.clear();
        this.onAfterParticlesRenderingObservable.clear();
        this.onBeforeDrawPhaseObservable.clear();
        this.onAfterDrawPhaseObservable.clear();
        this.onBeforeAnimationsObservable.clear();
        this.onAfterAnimationsObservable.clear();
        this.onDataLoadedObservable.clear();
        this.onBeforeRenderingGroupObservable.clear();
        this.onAfterRenderingGroupObservable.clear();
        this.onMeshImportedObservable.clear();
        this.onBeforeCameraRenderObservable.clear();
        this.onAfterCameraRenderObservable.clear();
        this.onReadyObservable.clear();
        this.onNewCameraAddedObservable.clear();
        this.onCameraRemovedObservable.clear();
        this.onNewLightAddedObservable.clear();
        this.onLightRemovedObservable.clear();
        this.onNewGeometryAddedObservable.clear();
        this.onGeometryRemovedObservable.clear();
        this.onNewTransformNodeAddedObservable.clear();
        this.onTransformNodeRemovedObservable.clear();
        this.onNewMeshAddedObservable.clear();
        this.onMeshRemovedObservable.clear();
        this.onNewSkeletonAddedObservable.clear();
        this.onSkeletonRemovedObservable.clear();
        this.onNewMaterialAddedObservable.clear();
        this.onMaterialRemovedObservable.clear();
        this.onNewTextureAddedObservable.clear();
        this.onTextureRemovedObservable.clear();
        this.onPrePointerObservable.clear();
        this.onPointerObservable.clear();
        this.onPreKeyboardObservable.clear();
        this.onKeyboardObservable.clear();
        this.onActiveCameraChanged.clear();

        this.detachControl();

        // Detach cameras
        var canvas = this._engine.getInputElement();

        if (canvas) {
            var index;
            for (index = 0; index < this.cameras.length; index++) {
                this.cameras[index].detachControl(canvas);
            }
        }

        // Release animation groups
        while (this.animationGroups.length) {
            this.animationGroups[0].dispose();
        }

        // Release lights
        while (this.lights.length) {
            this.lights[0].dispose();
        }

        // Release meshes
        while (this.meshes.length) {
            this.meshes[0].dispose(true);
        }
        while (this.transformNodes.length) {
            this.transformNodes[0].dispose(true);
        }

        // Release cameras
        while (this.cameras.length) {
            this.cameras[0].dispose();
        }

        // Release materials
        if (this._defaultMaterial) {
            this._defaultMaterial.dispose();
        }
        while (this.multiMaterials.length) {
            this.multiMaterials[0].dispose();
        }
        while (this.materials.length) {
            this.materials[0].dispose();
        }

        // Release particles
        while (this.particleSystems.length) {
            this.particleSystems[0].dispose();
        }

        // Release postProcesses
        while (this.postProcesses.length) {
            this.postProcesses[0].dispose();
        }

        // Release textures
        while (this.textures.length) {
            this.textures[0].dispose();
        }

        // Release UBO
        this._sceneUbo.dispose();

        if (this._multiviewSceneUbo) {
            this._multiviewSceneUbo.dispose();
        }

        // Post-processes
        this.postProcessManager.dispose();

        // Remove from engine
        index = this._engine.scenes.indexOf(this);

        if (index > -1) {
            this._engine.scenes.splice(index, 1);
        }

        this._engine.wipeCaches(true);
        this._isDisposed = true;
    }

    /**
     * Gets if the scene is already disposed
     */
    public get isDisposed(): boolean {
        return this._isDisposed;
    }

    /**
     * Call this function to reduce memory footprint of the scene.
     * Vertex buffers will not store CPU data anymore (this will prevent picking, collisions or physics to work correctly)
     */
    public clearCachedVertexData(): void {
        for (var meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
            var mesh = this.meshes[meshIndex];
            var geometry = (<Mesh>mesh).geometry;

            if (geometry) {
                geometry._indices = [];

                for (var vbName in geometry._vertexBuffers) {
                    if (!geometry._vertexBuffers.hasOwnProperty(vbName)) {
                        continue;
                    }
                    geometry._vertexBuffers[vbName]._buffer._data = null;
                }
            }
        }
    }

    /**
     * This function will remove the local cached buffer data from texture.
     * It will save memory but will prevent the texture from being rebuilt
     */
    public cleanCachedTextureBuffer(): void {
        for (var baseTexture of this.textures) {
            let buffer = (<Texture>baseTexture)._buffer;

            if (buffer) {
                (<Texture>baseTexture)._buffer = null;
            }
        }
    }

    /**
     * Get the world extend vectors with an optional filter
     *
     * @param filterPredicate the predicate - which meshes should be included when calculating the world size
     * @returns {{ min: Vector3; max: Vector3 }} min and max vectors
     */
    public getWorldExtends(filterPredicate?: (mesh: AbstractMesh) => boolean): { min: Vector3; max: Vector3 } {
        var min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        var max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        filterPredicate = filterPredicate || (() => true);
        this.meshes.filter(filterPredicate).forEach((mesh) => {
            mesh.computeWorldMatrix(true);

            if (!mesh.subMeshes || mesh.subMeshes.length === 0 || mesh.infiniteDistance) {
                return;
            }

            let boundingInfo = mesh.getBoundingInfo();

            var minBox = boundingInfo.boundingBox.minimumWorld;
            var maxBox = boundingInfo.boundingBox.maximumWorld;

            Vector3.CheckExtends(minBox, min, max);
            Vector3.CheckExtends(maxBox, min, max);
        });

        return {
            min: min,
            max: max
        };
    }

    // Picking

    /**
     * Creates a ray that can be used to pick in the scene
     * @param x defines the x coordinate of the origin (on-screen)
     * @param y defines the y coordinate of the origin (on-screen)
     * @param world defines the world matrix to use if you want to pick in object space (instead of world space)
     * @param camera defines the camera to use for the picking
     * @param cameraViewSpace defines if picking will be done in view space (false by default)
     * @returns a Ray
     */
    public createPickingRay(x: number, y: number, world: Matrix, camera: Nullable<Camera>, cameraViewSpace = false): Ray {
        throw _DevTools.WarnImport("Ray");
    }

    /**
     * Creates a ray that can be used to pick in the scene
     * @param x defines the x coordinate of the origin (on-screen)
     * @param y defines the y coordinate of the origin (on-screen)
     * @param world defines the world matrix to use if you want to pick in object space (instead of world space)
     * @param result defines the ray where to store the picking ray
     * @param camera defines the camera to use for the picking
     * @param cameraViewSpace defines if picking will be done in view space (false by default)
     * @returns the current scene
     */
    public createPickingRayToRef(x: number, y: number, world: Matrix, result: Ray, camera: Nullable<Camera>, cameraViewSpace = false): Scene {
        throw _DevTools.WarnImport("Ray");
    }

    /**
     * Creates a ray that can be used to pick in the scene
     * @param x defines the x coordinate of the origin (on-screen)
     * @param y defines the y coordinate of the origin (on-screen)
     * @param camera defines the camera to use for the picking
     * @returns a Ray
     */
    public createPickingRayInCameraSpace(x: number, y: number, camera?: Camera): Ray {
        throw _DevTools.WarnImport("Ray");
    }

    /**
     * Creates a ray that can be used to pick in the scene
     * @param x defines the x coordinate of the origin (on-screen)
     * @param y defines the y coordinate of the origin (on-screen)
     * @param result defines the ray where to store the picking ray
     * @param camera defines the camera to use for the picking
     * @returns the current scene
     */
    public createPickingRayInCameraSpaceToRef(x: number, y: number, result: Ray, camera?: Camera): Scene {
        throw _DevTools.WarnImport("Ray");
    }

    /** Launch a ray to try to pick a mesh in the scene
     * @param x position on screen
     * @param y position on screen
     * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
     * @param fastCheck defines if the first intersection will be used (and not the closest)
     * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
     * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
     * @returns a PickingInfo
     */
    public pick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean,
        fastCheck?: boolean, camera?: Nullable<Camera>,
        trianglePredicate?: TrianglePickingPredicate
    ): Nullable<PickingInfo> {
        // Dummy info if picking as not been imported
        const pi = new PickingInfo();
        pi._pickingUnavailable = true;
        return pi;
    }

    /** Launch a ray to try to pick a mesh in the scene using only bounding information of the main mesh (not using submeshes)
     * @param x position on screen
     * @param y position on screen
     * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
     * @param fastCheck defines if the first intersection will be used (and not the closest)
     * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
     * @returns a PickingInfo (Please note that some info will not be set like distance, bv, bu and everything that cannot be capture by only using bounding infos)
     */
    public pickWithBoundingInfo(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean,
        fastCheck?: boolean, camera?: Nullable<Camera>): Nullable<PickingInfo> {
        // Dummy info if picking as not been imported
        const pi = new PickingInfo();
        pi._pickingUnavailable = true;
        return pi;
    }

    /** Use the given ray to pick a mesh in the scene
     * @param ray The ray to use to pick meshes
     * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must have isPickable set to true
     * @param fastCheck defines if the first intersection will be used (and not the closest)
     * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
     * @returns a PickingInfo
     */
    public pickWithRay(ray: Ray, predicate?: (mesh: AbstractMesh) => boolean, fastCheck?: boolean,
        trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo> {
        throw _DevTools.WarnImport("Ray");
    }

    /**
     * Launch a ray to try to pick a mesh in the scene
     * @param x X position on screen
     * @param y Y position on screen
     * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
     * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
     * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
     * @returns an array of PickingInfo
     */
    public multiPick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean, camera?: Camera,
        trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo[]> {
        throw _DevTools.WarnImport("Ray");
    }

    /**
     * Launch a ray to try to pick a mesh in the scene
     * @param ray Ray to use
     * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
     * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
     * @returns an array of PickingInfo
     */
    public multiPickWithRay(ray: Ray, predicate: (mesh: AbstractMesh) => boolean, trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo[]> {
        throw _DevTools.WarnImport("Ray");
    }

    /**
     * Force the value of meshUnderPointer
     * @param mesh defines the mesh to use
     */
    public setPointerOverMesh(mesh: Nullable<AbstractMesh>): void {
        this._inputManager.setPointerOverMesh(mesh);
    }

    /**
     * Gets the mesh under the pointer
     * @returns a Mesh or null if no mesh is under the pointer
     */
    public getPointerOverMesh(): Nullable<AbstractMesh> {
        return this._inputManager.getPointerOverMesh();
    }

    // Misc.
    /** @hidden */
    public _rebuildGeometries(): void {
        for (var geometry of this.geometries) {
            geometry._rebuild();
        }

        for (var mesh of this.meshes) {
            mesh._rebuild();
        }

        if (this.postProcessManager) {
            this.postProcessManager._rebuild();
        }

        for (let component of this._components) {
            component.rebuild();
        }

        for (var system of this.particleSystems) {
            system.rebuild();
        }
    }

    /** @hidden */
    public _rebuildTextures(): void {
        for (var texture of this.textures) {
            texture._rebuild();
        }

        this.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    // Tags
    private _getByTags(list: any[], tagsQuery: string, forEach?: (item: any) => void): any[] {
        if (tagsQuery === undefined) {
            // returns the complete list (could be done with Tags.MatchesQuery but no need to have a for-loop here)
            return list;
        }

        var listByTags = [];

        forEach = forEach || ((item: any) => { return; });

        for (var i in list) {
            var item = list[i];
            if (Tags && Tags.MatchesQuery(item, tagsQuery)) {
                listByTags.push(item);
                forEach(item);
            }
        }

        return listByTags;
    }

    /**
     * Get a list of meshes by tags
     * @param tagsQuery defines the tags query to use
     * @param forEach defines a predicate used to filter results
     * @returns an array of Mesh
     */
    public getMeshesByTags(tagsQuery: string, forEach?: (mesh: AbstractMesh) => void): Mesh[] {
        return this._getByTags(this.meshes, tagsQuery, forEach);
    }

    /**
     * Get a list of cameras by tags
     * @param tagsQuery defines the tags query to use
     * @param forEach defines a predicate used to filter results
     * @returns an array of Camera
     */
    public getCamerasByTags(tagsQuery: string, forEach?: (camera: Camera) => void): Camera[] {
        return this._getByTags(this.cameras, tagsQuery, forEach);
    }

    /**
     * Get a list of lights by tags
     * @param tagsQuery defines the tags query to use
     * @param forEach defines a predicate used to filter results
     * @returns an array of Light
     */
    public getLightsByTags(tagsQuery: string, forEach?: (light: Light) => void): Light[] {
        return this._getByTags(this.lights, tagsQuery, forEach);
    }

    /**
     * Get a list of materials by tags
     * @param tagsQuery defines the tags query to use
     * @param forEach defines a predicate used to filter results
     * @returns an array of Material
     */
    public getMaterialByTags(tagsQuery: string, forEach?: (material: Material) => void): Material[] {
        return this._getByTags(this.materials, tagsQuery, forEach).concat(this._getByTags(this.multiMaterials, tagsQuery, forEach));
    }

    /**
     * Overrides the default sort function applied in the renderging group to prepare the meshes.
     * This allowed control for front to back rendering or reversly depending of the special needs.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
     * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
     * @param transparentSortCompareFn The transparent queue comparison function use to sort.
     */
    public setRenderingOrder(renderingGroupId: number,
        opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        transparentSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null): void {

        this._renderingManager.setRenderingOrder(renderingGroupId,
            opaqueSortCompareFn,
            alphaTestSortCompareFn,
            transparentSortCompareFn);
    }

    /**
     * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
     * @param depth Automatically clears depth between groups if true and autoClear is true.
     * @param stencil Automatically clears stencil between groups if true and autoClear is true.
     */
    public setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean,
        depth = true,
        stencil = true): void {
        this._renderingManager.setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil, depth, stencil);
    }

    /**
     * Gets the current auto clear configuration for one rendering group of the rendering
     * manager.
     * @param index the rendering group index to get the information for
     * @returns The auto clear setup for the requested rendering group
     */
    public getAutoClearDepthStencilSetup(index: number): IRenderingManagerAutoClearSetup {
        return this._renderingManager.getAutoClearDepthStencilSetup(index);
    }

    private _blockMaterialDirtyMechanism = false;

    /** Gets or sets a boolean blocking all the calls to markAllMaterialsAsDirty (ie. the materials won't be updated if they are out of sync) */
    public get blockMaterialDirtyMechanism(): boolean {
        return this._blockMaterialDirtyMechanism;
    }

    public set blockMaterialDirtyMechanism(value: boolean) {
        if (this._blockMaterialDirtyMechanism === value) {
            return;
        }

        this._blockMaterialDirtyMechanism = value;

        if (!value) { // Do a complete update
            this.markAllMaterialsAsDirty(Constants.MATERIAL_AllDirtyFlag);
        }
    }

    /**
     * Will flag all materials as dirty to trigger new shader compilation
     * @param flag defines the flag used to specify which material part must be marked as dirty
     * @param predicate If not null, it will be used to specifiy if a material has to be marked as dirty
     */
    public markAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void {
        if (this._blockMaterialDirtyMechanism) {
            return;
        }

        for (var material of this.materials) {
            if (predicate && !predicate(material)) {
                continue;
            }
            material.markAsDirty(flag);
        }
    }

    /** @hidden */
    public _loadFile(url: string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void, onProgress?: (ev: ProgressEvent) => void, useOfflineSupport?: boolean, useArrayBuffer?: boolean, onError?: (request?: WebRequest, exception?: LoadFileError) => void): IFileRequest {
        const request = FileTools.LoadFile(url, onSuccess, onProgress, useOfflineSupport ? this.offlineProvider : undefined, useArrayBuffer, onError);
        this._activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
        });
        return request;
    }

    /** @hidden */
    public _loadFileAsync(url: string, onProgress?: (data: any) => void, useOfflineSupport?: boolean, useArrayBuffer?: boolean): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            this._loadFile(url, (data) => {
                resolve(data);
            }, onProgress, useOfflineSupport, useArrayBuffer, (request, exception) => {
                reject(exception);
            });
        });
    }

    /** @hidden */
    public _requestFile(url: string, onSuccess: (data: string | ArrayBuffer, request?: WebRequest) => void, onProgress?: (ev: ProgressEvent) => void, useOfflineSupport?: boolean, useArrayBuffer?: boolean, onError?: (error: RequestFileError) => void, onOpened?: (request: WebRequest) => void): IFileRequest {
        const request = FileTools.RequestFile(url, onSuccess, onProgress, useOfflineSupport ? this.offlineProvider : undefined, useArrayBuffer, onError, onOpened);
        this._activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
        });
        return request;
    }

    /** @hidden */
    public _requestFileAsync(url: string, onProgress?: (ev: ProgressEvent) => void, useOfflineSupport?: boolean, useArrayBuffer?: boolean, onOpened?: (request: WebRequest) => void): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            this._requestFile(url, (data) => {
                resolve(data);
            }, onProgress, useOfflineSupport, useArrayBuffer, (error) => {
                reject(error);
            }, onOpened);
        });
    }

    /** @hidden */
    public _readFile(file: File, onSuccess: (data: string | ArrayBuffer) => void, onProgress?: (ev: ProgressEvent) => any, useArrayBuffer?: boolean, onError?: (error: ReadFileError) => void): IFileRequest {
        const request = FileTools.ReadFile(file, onSuccess, onProgress, useArrayBuffer, onError);
        this._activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
        });
        return request;
    }

    /** @hidden */
    public _readFileAsync(file: File, onProgress?: (ev: ProgressEvent) => any, useArrayBuffer?: boolean): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            this._readFile(file, (data) => {
                resolve(data);
            }, onProgress, useArrayBuffer, (error) => {
                reject(error);
            });
        });
    }
}
