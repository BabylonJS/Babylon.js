module BABYLON {
    export interface IDisposable {
        dispose(): void;
    }

    class ClickInfo {
        private _singleClick = false;
        private _doubleClick = false;
        private _hasSwiped = false;
        private _ignore = false;

        public get singleClick(): boolean {
            return this._singleClick;
        }
        public get doubleClick(): boolean {
            return this._doubleClick;
        }
        public get hasSwiped(): boolean {
            return this._hasSwiped;
        }
        public get ignore(): boolean {
            return this._ignore;
        }

        public set singleClick(b: boolean) {
            this._singleClick = b;
        }
        public set doubleClick(b: boolean) {
            this._doubleClick = b;
        }
        public set hasSwiped(b: boolean) {
            this._hasSwiped = b;
        }
        public set ignore(b: boolean) {
            this._ignore = b;
        }
    }

    /**
     * This class is used by the onRenderingGroupObservable
     */
    export class RenderingGroupInfo {
        /**
         * The Scene that being rendered
         */
        scene: Scene;

        /**
         * The camera currently used for the rendering pass
         */
        camera: Nullable<Camera>;

        /**
         * The ID of the renderingGroup being processed
         */
        renderingGroupId: number;

        /**
         * The rendering stage, can be either STAGE_PRECLEAR, STAGE_PREOPAQUE, STAGE_PRETRANSPARENT, STAGE_POSTTRANSPARENT
         */
        renderStage: number;

        /**
         * Stage corresponding to the very first hook in the renderingGroup phase: before the render buffer may be cleared
         * This stage will be fired no matter what
         */
        static STAGE_PRECLEAR = 1;

        /**
         * Called before opaque object are rendered.
         * This stage will be fired only if there's 3D Opaque content to render
         */
        static STAGE_PREOPAQUE = 2;

        /**
         * Called after the opaque objects are rendered and before the transparent ones
         * This stage will be fired only if there's 3D transparent content to render
         */
        static STAGE_PRETRANSPARENT = 3;

        /**
         * Called after the transparent object are rendered, last hook of the renderingGroup phase
         * This stage will be fired no matter what
         */
        static STAGE_POSTTRANSPARENT = 4;
    }

    /**
     * Represents a scene to be rendered by the engine.
     * @see http://doc.babylonjs.com/page.php?p=21911
     */
    export class Scene implements IAnimatable {
        // Statics
        private static _FOGMODE_NONE = 0;
        private static _FOGMODE_EXP = 1;
        private static _FOGMODE_EXP2 = 2;
        private static _FOGMODE_LINEAR = 3;

        private static _uniqueIdCounter = 0;        

        public static MinDeltaTime = 1.0;
        public static MaxDeltaTime = 1000.0;

        /** The fog is deactivated */
        public static get FOGMODE_NONE(): number {
            return Scene._FOGMODE_NONE;
        }

        /** The fog density is following an exponential function */
        public static get FOGMODE_EXP(): number {
            return Scene._FOGMODE_EXP;
        }

        /** The fog density is following an exponential function faster than FOGMODE_EXP */
        public static get FOGMODE_EXP2(): number {
            return Scene._FOGMODE_EXP2;
        }

        /** The fog density is following a linear function. */
        public static get FOGMODE_LINEAR(): number {
            return Scene._FOGMODE_LINEAR;
        }

        // Members
        public autoClear = true;
        public autoClearDepthAndStencil = true;
        public clearColor: Color4 = new Color4(0.2, 0.2, 0.3, 1.0);
        public ambientColor = new Color3(0, 0, 0);

        public _environmentBRDFTexture: BaseTexture;

        protected _environmentTexture: BaseTexture;
        /**
         * Texture used in all pbr material as the reflection texture.
         * As in the majority of the scene they are the same (exception for multi room and so on),
         * this is easier to reference from here than from all the materials.
         */
        public get environmentTexture(): BaseTexture {
            return this._environmentTexture;
        }
        /**
         * Texture used in all pbr material as the reflection texture.
         * As in the majority of the scene they are the same (exception for multi room and so on),
         * this is easier to set here than in all the materials.
         */
        public set environmentTexture(value: BaseTexture) {
            if (this._environmentTexture === value) {
                return;
            }
            
            this._environmentTexture = value;
            this.markAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }

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

        public forceWireframe = false;
        private _forcePointsCloud = false;
        public set forcePointsCloud(value: boolean) {
            if (this._forcePointsCloud === value) {
                return;
            }
            this._forcePointsCloud = value;
            this.markAllMaterialsAsDirty(Material.MiscDirtyFlag);
        }
        public get forcePointsCloud(): boolean {
            return this._forcePointsCloud;
        }

        public forceShowBoundingBoxes = false;
        public clipPlane: Plane;
        public animationsEnabled = true;
        public constantlyUpdateMeshUnderPointer = false;

        public hoverCursor = "pointer";
        public defaultCursor: string = "";
        /**
         * This is used to call preventDefault() on pointer down
         * in order to block unwanted artifacts like system double clicks
         */
        public preventDefaultOnPointerDown = true;

        // Metadata
        public metadata: any = null;
        public loadingPluginName: string;

        // Events

        private _spritePredicate: (sprite: Sprite) => boolean;

        /**
        * An event triggered when the scene is disposed.
        * @type {BABYLON.Observable}
        */
        public onDisposeObservable = new Observable<Scene>();

        private _onDisposeObserver: Nullable<Observer<Scene>>;
        /** A function to be executed when this scene is disposed. */
        public set onDispose(callback: () => void) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        }

        /**
        * An event triggered before rendering the scene
        * @type {BABYLON.Observable}
        */
        public onBeforeRenderObservable = new Observable<Scene>();

        private _onBeforeRenderObserver: Nullable<Observer<Scene>>;
        /** A function to be executed before rendering this scene */
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
        * @type {BABYLON.Observable}
        */
        public onAfterRenderObservable = new Observable<Scene>();

        private _onAfterRenderObserver: Nullable<Observer<Scene>>;
        /** A function to be executed after rendering this scene */
        public set afterRender(callback: Nullable<() => void>) {
            if (this._onAfterRenderObserver) {
                this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
            }

            if (callback) {
                this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
            }
        }

        /**
        * An event triggered when the scene is ready
        * @type {BABYLON.Observable}
        */
        public onReadyObservable = new Observable<Scene>();

        /**
        * An event triggered before rendering a camera
        * @type {BABYLON.Observable}
        */
        public onBeforeCameraRenderObservable = new Observable<Camera>();

        private _onBeforeCameraRenderObserver: Nullable<Observer<Camera>>;
        public set beforeCameraRender(callback: () => void) {
            if (this._onBeforeCameraRenderObserver) {
                this.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
            }

            this._onBeforeCameraRenderObserver = this.onBeforeCameraRenderObservable.add(callback);
        }

        /**
        * An event triggered after rendering a camera
        * @type {BABYLON.Observable}
        */
        public onAfterCameraRenderObservable = new Observable<Camera>();

        private _onAfterCameraRenderObserver: Nullable<Observer<Camera>>;
        public set afterCameraRender(callback: () => void) {
            if (this._onAfterCameraRenderObserver) {
                this.onAfterCameraRenderObservable.remove(this._onAfterCameraRenderObserver);
            }
            this._onAfterCameraRenderObserver = this.onAfterCameraRenderObservable.add(callback);
        }

        /**
        * An event triggered when a camera is created
        * @type {BABYLON.Observable}
        */
        public onNewCameraAddedObservable = new Observable<Camera>();

        /**
        * An event triggered when a camera is removed
        * @type {BABYLON.Observable}
        */
        public onCameraRemovedObservable = new Observable<Camera>();

        /**
        * An event triggered when a light is created
        * @type {BABYLON.Observable}
        */
        public onNewLightAddedObservable = new Observable<Light>();

        /**
        * An event triggered when a light is removed
        * @type {BABYLON.Observable}
        */
        public onLightRemovedObservable = new Observable<Light>();

        /**
        * An event triggered when a geometry is created
        * @type {BABYLON.Observable}
        */
        public onNewGeometryAddedObservable = new Observable<Geometry>();

        /**
        * An event triggered when a geometry is removed
        * @type {BABYLON.Observable}
        */
        public onGeometryRemovedObservable = new Observable<Geometry>();

        /**
        * An event triggered when a mesh is created
        * @type {BABYLON.Observable}
        */
        public onNewMeshAddedObservable = new Observable<AbstractMesh>();

        /**
        * An event triggered when a mesh is removed
        * @type {BABYLON.Observable}
        */
        public onMeshRemovedObservable = new Observable<AbstractMesh>();

        /**
        * An event triggered before calculating deterministic simulation step
        * @type {BABYLON.Observable}
        */
        public onBeforeStepObservable = new Observable<Scene>();

        /**
        * An event triggered after calculating deterministic simulation step
        * @type {BABYLON.Observable}
        */
        public onAfterStepObservable = new Observable<Scene>();

        /**
         * This Observable will be triggered for each stage of each renderingGroup of each rendered camera.
         * The RenderinGroupInfo class contains all the information about the context in which the observable is called
         * If you wish to register an Observer only for a given set of renderingGroup, use the mask with a combination of the renderingGroup index elevated to the power of two (1 for renderingGroup 0, 2 for renderingrOup1, 4 for 2 and 8 for 3)
         */
        public onRenderingGroupObservable = new Observable<RenderingGroupInfo>();

        // Animations
        public animations: Animation[] = [];

        // Pointers
        public pointerDownPredicate: (Mesh: AbstractMesh) => boolean;
        public pointerUpPredicate: (Mesh: AbstractMesh) => boolean;
        public pointerMovePredicate: (Mesh: AbstractMesh) => boolean;
        private _onPointerMove: (evt: PointerEvent) => void;
        private _onPointerDown: (evt: PointerEvent) => void;
        private _onPointerUp: (evt: PointerEvent) => void;

        /** Deprecated. Use onPointerObservable instead */
        public onPointerMove: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        /** Deprecated. Use onPointerObservable instead */
        public onPointerDown: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        /** Deprecated. Use onPointerObservable instead */
        public onPointerUp: (evt: PointerEvent, pickInfo: Nullable<PickingInfo>) => void;
        /** Deprecated. Use onPointerObservable instead */
        public onPointerPick: (evt: PointerEvent, pickInfo: PickingInfo) => void;

        // Gamepads
        private _gamepadManager: Nullable<GamepadManager>;

        public get gamepadManager(): GamepadManager {
            if (!this._gamepadManager) {
                this._gamepadManager = new GamepadManager();
            }

            return this._gamepadManager;
        }

        /**
         * This observable event is triggered when any ponter event is triggered. It is registered during Scene.attachControl() and it is called BEFORE the 3D engine process anything (mesh/sprite picking for instance).
         * You have the possibility to skip the process and the call to onPointerObservable by setting PointerInfoPre.skipOnPointerObservable to true
         */
        public onPrePointerObservable = new Observable<PointerInfoPre>();

        /**
         * Observable event triggered each time an input event is received from the rendering canvas
         */
        public onPointerObservable = new Observable<PointerInfo>();

        public get unTranslatedPointer(): Vector2 {
            return new Vector2(this._unTranslatedPointerX, this._unTranslatedPointerY);
        }

        /** The distance in pixel that you have to move to prevent some events */
        public static DragMovementThreshold = 10; // in pixels
        /** Time in milliseconds to wait to raise long press events if button is still pressed */
        public static LongPressDelay = 500; // in milliseconds
        /** Time in milliseconds with two consecutive clicks will be considered as a double click */
        public static DoubleClickDelay = 300; // in milliseconds
        /** If you need to check double click without raising a single click at first click, enable this flag */
        public static ExclusiveDoubleClickMode = false;

        private _initClickEvent: (obs1: Observable<PointerInfoPre>, obs2: Observable<PointerInfo>, evt: PointerEvent, cb: (clickInfo: ClickInfo, pickResult: Nullable<PickingInfo>) => void) => void;
        private _initActionManager: (act: Nullable<ActionManager>, clickInfo: ClickInfo) => Nullable<ActionManager>;
        private _delayedSimpleClick: (btn: number, clickInfo: ClickInfo, cb: (clickInfo: ClickInfo, pickResult: Nullable<PickingInfo>) => void) => void;
        private _delayedSimpleClickTimeout: number;
        private _previousDelayedSimpleClickTimeout: number;
        private _meshPickProceed = false;

        private _previousButtonPressed: number;
        private _previousHasSwiped = false;
        private _currentPickResult: Nullable<PickingInfo> = null;
        private _previousPickResult: Nullable<PickingInfo> = null;
        private _totalPointersPressed = 0;
        private _doubleClickOccured = false;

        /** Define this parameter if you are using multiple cameras and you want to specify which one should be used for pointer position */
        public cameraToUseForPointers: Nullable<Camera> = null;
        private _pointerX: number;
        private _pointerY: number;
        private _unTranslatedPointerX: number;
        private _unTranslatedPointerY: number;
        private _startingPointerPosition = new Vector2(0, 0);
        private _previousStartingPointerPosition = new Vector2(0, 0);
        private _startingPointerTime = 0;
        private _previousStartingPointerTime = 0;

        // Deterministic lockstep
        private _timeAccumulator: number = 0;
        private _currentStepId: number = 0;
        private _currentInternalStep: number = 0;

        // Mirror
        public _mirroredCameraPosition: Vector3;

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
        private _onKeyDown: (evt: Event) => void;
        private _onKeyUp: (evt: Event) => void;
        private _onCanvasFocusObserver: Nullable<Observer<Engine>>;
        private _onCanvasBlurObserver: Nullable<Observer<Engine>>;

        // Coordinate system
        /**
        * use right-handed coordinate system on this scene.
        * @type {boolean}
        */
        private _useRightHandedSystem = false;
        public set useRightHandedSystem(value: boolean) {
            if (this._useRightHandedSystem === value) {
                return;
            }
            this._useRightHandedSystem = value;
            this.markAllMaterialsAsDirty(Material.MiscDirtyFlag);
        }
        public get useRightHandedSystem(): boolean {
            return this._useRightHandedSystem;
        }

        public setStepId(newStepId: number): void {
            this._currentStepId = newStepId;
        };

        public getStepId(): number {
            return this._currentStepId;
        };

        public getInternalStep(): number {
            return this._currentInternalStep;
        };

        // Fog

        private _fogEnabled = true;
        /**
        * is fog enabled on this scene.
        */
        public set fogEnabled(value: boolean) {
            if (this._fogEnabled === value) {
                return;
            }
            this._fogEnabled = value;
            this.markAllMaterialsAsDirty(Material.MiscDirtyFlag);
        }
        public get fogEnabled(): boolean {
            return this._fogEnabled;
        }

        private _fogMode = Scene.FOGMODE_NONE;
        public set fogMode(value: number) {
            if (this._fogMode === value) {
                return;
            }
            this._fogMode = value;
            this.markAllMaterialsAsDirty(Material.MiscDirtyFlag);
        }
        public get fogMode(): number {
            return this._fogMode;
        }

        public fogColor = new Color3(0.2, 0.2, 0.3);
        public fogDensity = 0.1;
        public fogStart = 0;
        public fogEnd = 1000.0;

        // Lights
        /**
        * is shadow enabled on this scene.
        * @type {boolean}
        */
        private _shadowsEnabled = true;
        public set shadowsEnabled(value: boolean) {
            if (this._shadowsEnabled === value) {
                return;
            }
            this._shadowsEnabled = value;
            this.markAllMaterialsAsDirty(Material.LightDirtyFlag);
        }
        public get shadowsEnabled(): boolean {
            return this._shadowsEnabled;
        }

        /**
        * is light enabled on this scene.
        * @type {boolean}
        */
        private _lightsEnabled = true;
        public set lightsEnabled(value: boolean) {
            if (this._lightsEnabled === value) {
                return;
            }
            this._lightsEnabled = value;
            this.markAllMaterialsAsDirty(Material.LightDirtyFlag);
        }

        public get lightsEnabled(): boolean {
            return this._lightsEnabled;
        }

        /**
        * All of the lights added to this scene.
        * @see BABYLON.Light
        * @type {BABYLON.Light[]}
        */
        public lights = new Array<Light>();

        // Cameras
        /** All of the cameras added to this scene. */
        public cameras = new Array<Camera>();
        /** All of the active cameras added to this scene. */
        public activeCameras = new Array<Camera>();
        /** The current active camera */
        public activeCamera: Nullable<Camera>;

        // Meshes
        /**
        * All of the (abstract) meshes added to this scene.
        * @see BABYLON.AbstractMesh
        * @type {BABYLON.AbstractMesh[]}
        */
        public meshes = new Array<AbstractMesh>();

        // Geometries
        private _geometries = new Array<Geometry>();

        public materials = new Array<Material>();
        public multiMaterials = new Array<MultiMaterial>();
        private _defaultMaterial: Material;

        /** The default material used on meshes when no material is affected */
        public get defaultMaterial(): Material {
            if (!this._defaultMaterial) {
                this._defaultMaterial = new StandardMaterial("default material", this);
            }

            return this._defaultMaterial;
        }

        /** The default material used on meshes when no material is affected */
        public set defaultMaterial(value: Material) {
            this._defaultMaterial = value;
        }

        // Textures
        private _texturesEnabled = true;
        public set texturesEnabled(value: boolean) {
            if (this._texturesEnabled === value) {
                return;
            }
            this._texturesEnabled = value;
            this.markAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }

        public get texturesEnabled(): boolean {
            return this._texturesEnabled;
        }

        public textures = new Array<BaseTexture>();

        // Particles
        public particlesEnabled = true;
        public particleSystems = new Array<IParticleSystem>();

        // Sprites
        public spritesEnabled = true;
        public spriteManagers = new Array<SpriteManager>();

        // Layers
        public layers = new Array<Layer>();
        public highlightLayers = new Array<HighlightLayer>();

        // Skeletons
        private _skeletonsEnabled = true;
        public set skeletonsEnabled(value: boolean) {
            if (this._skeletonsEnabled === value) {
                return;
            }
            this._skeletonsEnabled = value;
            this.markAllMaterialsAsDirty(Material.AttributesDirtyFlag);
        }

        public get skeletonsEnabled(): boolean {
            return this._skeletonsEnabled;
        }

        public skeletons = new Array<Skeleton>();

        // Morph targets
        public morphTargetManagers = new Array<MorphTargetManager>();

        // Lens flares
        public lensFlaresEnabled = true;
        public lensFlareSystems = new Array<LensFlareSystem>();

        // Collisions
        public collisionsEnabled = true;
        private _workerCollisions: boolean;
        public collisionCoordinator: ICollisionCoordinator;
        /** Defines the gravity applied to this scene */
        public gravity = new Vector3(0, -9.807, 0);

        // Postprocesses
        public postProcesses = new Array<PostProcess>();
        public postProcessesEnabled = true;
        public postProcessManager: PostProcessManager;
        private _postProcessRenderPipelineManager: PostProcessRenderPipelineManager
        public get postProcessRenderPipelineManager(): PostProcessRenderPipelineManager {
            if (!this._postProcessRenderPipelineManager) {
                this._postProcessRenderPipelineManager = new PostProcessRenderPipelineManager();
            }

            return this._postProcessRenderPipelineManager;
        }

        // Customs render targets
        public renderTargetsEnabled = true;
        public dumpNextRenderTargets = false;
        public customRenderTargets = new Array<RenderTargetTexture>();

        // Delay loading
        public useDelayedTextureLoading: boolean;

        // Imported meshes
        public importedMeshesFiles = new Array<String>();

        // Probes
        public probesEnabled = true;
        public reflectionProbes = new Array<ReflectionProbe>();

        // Database
        public database: Database;

        /**
         * This scene's action manager
         * @type {BABYLON.ActionManager}
        */
        public actionManager: ActionManager;

        public _actionManagers = new Array<ActionManager>();
        private _meshesForIntersections = new SmartArray<AbstractMesh>(256);

        // Procedural textures
        public proceduralTexturesEnabled = true;
        public _proceduralTextures = new Array<ProceduralTexture>();

        // Sound Tracks
        private _mainSoundTrack: SoundTrack;
        public soundTracks = new Array<SoundTrack>();
        private _audioEnabled = true;
        private _headphone = false;

        public get mainSoundTrack(): SoundTrack {
            if (!this._mainSoundTrack) {
                this._mainSoundTrack = new SoundTrack(this, { mainTrack: true });
            }

            return this._mainSoundTrack;
        }

        // VR Helper
        public VRHelper: VRExperienceHelper;

        //Simplification Queue
        public simplificationQueue: SimplificationQueue;

        // Private
        private _engine: Engine;

        // Performance counters
        private _totalMeshesCounter = new PerfCounter();
        private _totalLightsCounter = new PerfCounter();
        private _totalMaterialsCounter = new PerfCounter();
        private _totalTexturesCounter = new PerfCounter();
        private _totalVertices = new PerfCounter();
        public _activeIndices = new PerfCounter();
        public _activeParticles = new PerfCounter();
        private _interFrameDuration = new PerfCounter();
        private _lastFrameDuration = new PerfCounter();
        private _evaluateActiveMeshesDuration = new PerfCounter();
        private _renderTargetsDuration = new PerfCounter();
        public _particlesDuration = new PerfCounter();
        private _renderDuration = new PerfCounter();
        public _spritesDuration = new PerfCounter();
        public _activeBones = new PerfCounter();

        private _animationRatio: number;

        private _animationTimeLast: number;
        private _animationTime: number = 0;
        public animationTimeScale: number = 1;

        public _cachedMaterial: Nullable<Material>;
        public _cachedEffect: Nullable<Effect>;
        public _cachedVisibility: Nullable<number>;

        private _renderId = 0;
        private _executeWhenReadyTimeoutId = -1;
        private _intermediateRendering = false;

        private _viewUpdateFlag = -1;
        private _projectionUpdateFlag = -1;
        private _alternateViewUpdateFlag = -1;
        private _alternateProjectionUpdateFlag = -1;

        public _toBeDisposed = new SmartArray<Nullable<IDisposable>>(256);
        private _pendingData = new Array();

        private _activeMeshes = new SmartArray<AbstractMesh>(256);
        private _processedMaterials = new SmartArray<Material>(256);
        private _renderTargets = new SmartArray<RenderTargetTexture>(256);
        public _activeParticleSystems = new SmartArray<IParticleSystem>(256);
        private _activeSkeletons = new SmartArray<Skeleton>(32);
        private _softwareSkinnedMeshes = new SmartArray<Mesh>(32);

        private _renderingManager: RenderingManager;
        private _physicsEngine: Nullable<PhysicsEngine>;

        public _activeAnimatables = new Array<Animatable>();

        private _transformMatrix = Matrix.Zero();
        private _sceneUbo: UniformBuffer;
        private _alternateSceneUbo: UniformBuffer;

        private _pickWithRayInverseMatrix: Matrix;

        private _boundingBoxRenderer: BoundingBoxRenderer;
        private _outlineRenderer: OutlineRenderer;

        private _viewMatrix: Matrix;
        private _projectionMatrix: Matrix;
        private _alternateViewMatrix: Matrix;
        private _alternateProjectionMatrix: Matrix;
        private _alternateTransformMatrix: Matrix;
        private _useAlternateCameraConfiguration = false;
        private _alternateRendering = false;

        public get _isAlternateRenderingEnabled(): boolean {
            return this._alternateRendering;
        }

        private _frustumPlanes: Plane[];
        public get frustumPlanes(): Plane[] {
            return this._frustumPlanes;
        }

        public requireLightSorting = false;

        private _selectionOctree: Octree<AbstractMesh>;

        private _pointerOverMesh: Nullable<AbstractMesh>;
        private _pointerOverSprite: Nullable<Sprite>;

        private _debugLayer: DebugLayer;

        private _depthRenderer: Nullable<DepthRenderer>;
        private _geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

        private _pickedDownMesh: Nullable<AbstractMesh>;
        private _pickedUpMesh: Nullable<AbstractMesh>;
        private _pickedDownSprite: Nullable<Sprite>;
        private _externalData: StringDictionary<Object>;
        private _uid: Nullable<string>;

        /**
         * @constructor
         * @param {BABYLON.Engine} engine - the engine to be used to render this scene.
         */
        constructor(engine: Engine) {
            this._engine = engine || Engine.LastCreatedEngine;

            this._engine.scenes.push(this);
            this._uid = null;

            this._renderingManager = new RenderingManager(this);

            this.postProcessManager = new PostProcessManager(this);

            if (OutlineRenderer) {
                this._outlineRenderer = new OutlineRenderer(this);
            }

            if (Tools.IsWindowObjectExist()) {
                this.attachControl();
            }

            //simplification queue
            if (SimplificationQueue) {
                this.simplificationQueue = new SimplificationQueue();
            }

            //collision coordinator initialization. For now legacy per default.
            this.workerCollisions = false;//(!!Worker && (!!BABYLON.CollisionWorker || BABYLON.WorkerIncluded));

            // Uniform Buffer
            this._createUbo();

            // Default Image processing definition.
            this._imageProcessingConfiguration = new ImageProcessingConfiguration();
        }

        // Properties
        public get debugLayer(): DebugLayer {
            if (!this._debugLayer) {
                this._debugLayer = new DebugLayer(this);
            }
            return this._debugLayer;
        }

        public set workerCollisions(enabled: boolean) {
            if (!BABYLON.CollisionCoordinatorLegacy) {
                return;
            }

            enabled = (enabled && !!Worker);

            this._workerCollisions = enabled;
            if (this.collisionCoordinator) {
                this.collisionCoordinator.destroy();
            }

            this.collisionCoordinator = enabled ? new CollisionCoordinatorWorker() : new CollisionCoordinatorLegacy();

            this.collisionCoordinator.init(this);
        }

        public get workerCollisions(): boolean {
            return this._workerCollisions;
        }

        public get selectionOctree(): Octree<AbstractMesh> {
            return this._selectionOctree;
        }

        /**
         * The mesh that is currently under the pointer.
         * @return {BABYLON.AbstractMesh} mesh under the pointer/mouse cursor or null if none.
         */
        public get meshUnderPointer(): Nullable<AbstractMesh> {
            return this._pointerOverMesh;
        }

        /**
         * Current on-screen X position of the pointer
         * @return {number} X position of the pointer
         */
        public get pointerX(): number {
            return this._pointerX;
        }

        /**
         * Current on-screen Y position of the pointer
         * @return {number} Y position of the pointer
         */
        public get pointerY(): number {
            return this._pointerY;
        }

        public getCachedMaterial(): Nullable<Material> {
            return this._cachedMaterial;
        }

        public getCachedEffect(): Nullable<Effect> {
            return this._cachedEffect;
        }

        public getCachedVisibility(): Nullable<number> {
            return this._cachedVisibility;
        }

        public isCachedMaterialInvalid(material: Material, effect: Effect, visibility: number = 1) {
            return this._cachedEffect !== effect || this._cachedMaterial !== material || this._cachedVisibility !== visibility;
        }

        public getBoundingBoxRenderer(): BoundingBoxRenderer {
            if (!this._boundingBoxRenderer) {
                this._boundingBoxRenderer = new BoundingBoxRenderer(this);
            }

            return this._boundingBoxRenderer;
        }

        public getOutlineRenderer(): OutlineRenderer {
            return this._outlineRenderer;
        }

        public getEngine(): Engine {
            return this._engine;
        }

        public getTotalVertices(): number {
            return this._totalVertices.current;
        }

        public get totalVerticesPerfCounter(): PerfCounter {
            return this._totalVertices;
        }

        public getActiveIndices(): number {
            return this._activeIndices.current;
        }

        public get totalActiveIndicesPerfCounter(): PerfCounter {
            return this._activeIndices;
        }

        public getActiveParticles(): number {
            return this._activeParticles.current;
        }

        public get activeParticlesPerfCounter(): PerfCounter {
            return this._activeParticles;
        }

        public getActiveBones(): number {
            return this._activeBones.current;
        }

        public get activeBonesPerfCounter(): PerfCounter {
            return this._activeBones;
        }

        // Stats
        public getInterFramePerfCounter(): number {
            return this._interFrameDuration.current;
        }

        public get interFramePerfCounter(): PerfCounter {
            return this._interFrameDuration;
        }

        public getLastFrameDuration(): number {
            return this._lastFrameDuration.current;
        }

        public get lastFramePerfCounter(): PerfCounter {
            return this._lastFrameDuration;
        }

        public getEvaluateActiveMeshesDuration(): number {
            return this._evaluateActiveMeshesDuration.current;
        }

        public get evaluateActiveMeshesDurationPerfCounter(): PerfCounter {
            return this._evaluateActiveMeshesDuration;
        }

        public getActiveMeshes(): SmartArray<AbstractMesh> {
            return this._activeMeshes;
        }

        public getRenderTargetsDuration(): number {
            return this._renderTargetsDuration.current;
        }

        public getRenderDuration(): number {
            return this._renderDuration.current;
        }

        public get renderDurationPerfCounter(): PerfCounter {
            return this._renderDuration;
        }

        public getParticlesDuration(): number {
            return this._particlesDuration.current;
        }

        public get particlesDurationPerfCounter(): PerfCounter {
            return this._particlesDuration;
        }

        public getSpritesDuration(): number {
            return this._spritesDuration.current;
        }

        public get spriteDuractionPerfCounter(): PerfCounter {
            return this._spritesDuration;
        }

        public getAnimationRatio(): number {
            return this._animationRatio;
        }

        public getRenderId(): number {
            return this._renderId;
        }

        public incrementRenderId(): void {
            this._renderId++;
        }

        private _updatePointerPosition(evt: PointerEvent): void {
            var canvasRect = this._engine.getRenderingCanvasClientRect();

            if (!canvasRect) {
                return;
            }

            this._pointerX = evt.clientX - canvasRect.left;
            this._pointerY = evt.clientY - canvasRect.top;

            this._unTranslatedPointerX = this._pointerX;
            this._unTranslatedPointerY = this._pointerY;
        }

        private _createUbo(): void {
            this._sceneUbo = new UniformBuffer(this._engine, undefined, true);
            this._sceneUbo.addUniform("viewProjection", 16);
            this._sceneUbo.addUniform("view", 16);
        }

        private _createAlternateUbo(): void {
            this._alternateSceneUbo = new UniformBuffer(this._engine, undefined, true);
            this._alternateSceneUbo.addUniform("viewProjection", 16);
            this._alternateSceneUbo.addUniform("view", 16);
        }

        // Pointers handling

        /**
         * Use this method to simulate a pointer move on a mesh
         * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
         */
        public simulatePointerMove(pickResult: PickingInfo): Scene {
            let evt = new PointerEvent("pointermove");

            return this._processPointerMove(pickResult, evt);
        }

        private _processPointerMove(pickResult: Nullable<PickingInfo>, evt: PointerEvent): Scene {
            
            var canvas = this._engine.getRenderingCanvas();

            if (!canvas) {
                return this;
            }

            if (pickResult && pickResult.hit && pickResult.pickedMesh) {
                this.setPointerOverSprite(null);

                this.setPointerOverMesh(pickResult.pickedMesh);

                if (this._pointerOverMesh && this._pointerOverMesh.actionManager && this._pointerOverMesh.actionManager.hasPointerTriggers) {
                    if (this._pointerOverMesh.actionManager.hoverCursor) {
                        canvas.style.cursor = this._pointerOverMesh.actionManager.hoverCursor;
                    } else {
                        canvas.style.cursor = this.hoverCursor;
                    }
                } else {
                    canvas.style.cursor = this.defaultCursor;
                }
            } else {
                this.setPointerOverMesh(null);
                // Sprites
                pickResult = this.pickSprite(this._unTranslatedPointerX, this._unTranslatedPointerY, this._spritePredicate, false, this.cameraToUseForPointers || undefined);

                if (pickResult && pickResult.hit && pickResult.pickedSprite) {
                    this.setPointerOverSprite(pickResult.pickedSprite);
                    if (this._pointerOverSprite && this._pointerOverSprite.actionManager && this._pointerOverSprite.actionManager.hoverCursor) {
                        canvas.style.cursor = this._pointerOverSprite.actionManager.hoverCursor;
                    } else {
                        canvas.style.cursor = this.hoverCursor;
                    }
                } else {
                    this.setPointerOverSprite(null);
                    // Restore pointer
                    canvas.style.cursor = this.defaultCursor;
                }
            }

            if (pickResult) {
                if (this.onPointerMove) {
                    this.onPointerMove(evt, pickResult);
                }

                if (this.onPointerObservable.hasObservers()) {
                    let type = evt.type === "mousewheel" || evt.type === "DOMMouseScroll" ? PointerEventTypes.POINTERWHEEL : PointerEventTypes.POINTERMOVE;
                    let pi = new PointerInfo(type, evt, pickResult);
                    this.onPointerObservable.notifyObservers(pi, type);
                }
            }

            return this;            
        }

        /**
         * Use this method to simulate a pointer down on a mesh
         * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
         */
        public simulatePointerDown(pickResult: PickingInfo): Scene {
            let evt = new PointerEvent("pointerdown");

            return this._processPointerDown(pickResult, evt);
        }        

        private _processPointerDown(pickResult: Nullable<PickingInfo>, evt: PointerEvent): Scene {
            if (pickResult && pickResult.hit && pickResult.pickedMesh) {
                this._pickedDownMesh = pickResult.pickedMesh;
                var actionManager = pickResult.pickedMesh.actionManager;
                if (actionManager) {
                    if (actionManager.hasPickTriggers) {
                        actionManager.processTrigger(ActionManager.OnPickDownTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                        switch (evt.button) {
                            case 0:
                                actionManager.processTrigger(ActionManager.OnLeftPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                break;
                            case 1:
                                actionManager.processTrigger(ActionManager.OnCenterPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                break;
                            case 2:
                                actionManager.processTrigger(ActionManager.OnRightPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                break;
                        }
                    }

                    if (actionManager.hasSpecificTrigger(ActionManager.OnLongPressTrigger)) {
                        window.setTimeout(() => {
                            var pickResult = this.pick(this._unTranslatedPointerX, this._unTranslatedPointerY,
                                (mesh: AbstractMesh): boolean => (<boolean>(mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.actionManager && mesh.actionManager.hasSpecificTrigger(ActionManager.OnLongPressTrigger) && mesh == this._pickedDownMesh)),
                                false, this.cameraToUseForPointers);

                            if (pickResult && pickResult.hit && pickResult.pickedMesh && actionManager) {
                                if (this._totalPointersPressed !== 0 &&
                                    ((new Date().getTime() - this._startingPointerTime) > Scene.LongPressDelay) &&
                                    (Math.abs(this._startingPointerPosition.x - this._pointerX) < Scene.DragMovementThreshold &&
                                        Math.abs(this._startingPointerPosition.y - this._pointerY) < Scene.DragMovementThreshold)) {
                                    this._startingPointerTime = 0;
                                    actionManager.processTrigger(ActionManager.OnLongPressTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                }
                            }
                        }, Scene.LongPressDelay);
                    }
                }
            }

            if (pickResult) {
                if (this.onPointerDown) {
                    this.onPointerDown(evt, pickResult);
                }

                if (this.onPointerObservable.hasObservers()) {
                    let type = PointerEventTypes.POINTERDOWN;
                    let pi = new PointerInfo(type, evt, pickResult);
                    this.onPointerObservable.notifyObservers(pi, type);
                }
            }

            return this;
        }

        /**
         * Use this method to simulate a pointer up on a mesh
         * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
         */
        public simulatePointerUp(pickResult: PickingInfo): Scene {
            let evt = new PointerEvent("pointerup");
            let clickInfo = new ClickInfo();
            clickInfo.singleClick = true;

            return this._processPointerUp(pickResult, evt, clickInfo);
        }    

        private _processPointerUp(pickResult: Nullable<PickingInfo>, evt: PointerEvent, clickInfo: ClickInfo): Scene {            
            if (pickResult && pickResult && pickResult.pickedMesh) {
                this._pickedUpMesh = pickResult.pickedMesh;
                if (this._pickedDownMesh === this._pickedUpMesh) {
                    if (this.onPointerPick) {
                        this.onPointerPick(evt, pickResult);
                    }
                    if (clickInfo.singleClick && !clickInfo.ignore && this.onPointerObservable.hasObservers()) {
                        let type = PointerEventTypes.POINTERPICK;
                        let pi = new PointerInfo(type, evt, pickResult);
                        this.onPointerObservable.notifyObservers(pi, type);
                    }
                }
                if (pickResult.pickedMesh.actionManager) {
                    if (clickInfo.ignore) {
                        pickResult.pickedMesh.actionManager.processTrigger(ActionManager.OnPickUpTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                    }
                    if (!clickInfo.hasSwiped && !clickInfo.ignore && clickInfo.singleClick) {
                        pickResult.pickedMesh.actionManager.processTrigger(ActionManager.OnPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                    }
                    if (clickInfo.doubleClick && !clickInfo.ignore && pickResult.pickedMesh.actionManager.hasSpecificTrigger(ActionManager.OnDoublePickTrigger)) {
                        pickResult.pickedMesh.actionManager.processTrigger(ActionManager.OnDoublePickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                    }
                }
            }
            if (this._pickedDownMesh &&
                this._pickedDownMesh.actionManager &&
                this._pickedDownMesh.actionManager.hasSpecificTrigger(ActionManager.OnPickOutTrigger) &&
                this._pickedDownMesh !== this._pickedUpMesh) {
                this._pickedDownMesh.actionManager.processTrigger(ActionManager.OnPickOutTrigger, ActionEvent.CreateNew(this._pickedDownMesh, evt));
            }

            if (this.onPointerUp) {
                this.onPointerUp(evt, pickResult);
            }

            if (this.onPointerObservable.hasObservers()) {
                if (!clickInfo.ignore) {
                    if (!clickInfo.hasSwiped) {
                        if (clickInfo.singleClick && this.onPointerObservable.hasSpecificMask(PointerEventTypes.POINTERTAP)) {
                            let type = PointerEventTypes.POINTERTAP;
                            let pi = new PointerInfo(type, evt, pickResult);
                            this.onPointerObservable.notifyObservers(pi, type);
                        }
                        if (clickInfo.doubleClick && this.onPointerObservable.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP)) {
                            let type = PointerEventTypes.POINTERDOUBLETAP;
                            let pi = new PointerInfo(type, evt, pickResult);
                            this.onPointerObservable.notifyObservers(pi, type);
                        }
                    }
                }
                else {
                    let type = PointerEventTypes.POINTERUP;
                    let pi = new PointerInfo(type, evt, pickResult);
                    this.onPointerObservable.notifyObservers(pi, type);
                }
            }

            return this;
        }

        /**
        * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
        * @param attachUp defines if you want to attach events to pointerup
        * @param attachDown defines if you want to attach events to pointerdown
        * @param attachMove defines if you want to attach events to pointermove
        */
        public attachControl(attachUp = true, attachDown = true, attachMove = true) {
            this._initActionManager = (act: Nullable<ActionManager>, clickInfo: ClickInfo): Nullable<ActionManager> => {
                if (!this._meshPickProceed) {
                    let pickResult = this.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, this.pointerDownPredicate, false, this.cameraToUseForPointers);
                    this._currentPickResult = pickResult;
                    if (pickResult) {
                        act = (pickResult.hit && pickResult.pickedMesh) ? pickResult.pickedMesh.actionManager : null;
                    }
                    this._meshPickProceed = true;
                }
                return act;
            };

            this._delayedSimpleClick = (btn: number, clickInfo: ClickInfo, cb: (clickInfo: ClickInfo, pickResult: Nullable<PickingInfo>) => void) => {
                // double click delay is over and that no double click has been raised since, or the 2 consecutive keys pressed are different
                if ((new Date().getTime() - this._previousStartingPointerTime > Scene.DoubleClickDelay && !this._doubleClickOccured) ||
                    btn !== this._previousButtonPressed) {
                    this._doubleClickOccured = false;
                    clickInfo.singleClick = true;
                    clickInfo.ignore = false;
                    cb(clickInfo, this._currentPickResult);
                }
            }

            this._initClickEvent = (obs1: Observable<PointerInfoPre>, obs2: Observable<PointerInfo>, evt: PointerEvent, cb: (clickInfo: ClickInfo, pickResult: Nullable<PickingInfo>) => void): void => {
                let clickInfo = new ClickInfo();
                this._currentPickResult = null;
                let act: Nullable<ActionManager> = null;

                let checkPicking = obs1.hasSpecificMask(PointerEventTypes.POINTERPICK) || obs2.hasSpecificMask(PointerEventTypes.POINTERPICK)
                    || obs1.hasSpecificMask(PointerEventTypes.POINTERTAP) || obs2.hasSpecificMask(PointerEventTypes.POINTERTAP)
                    || obs1.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP) || obs2.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP);
                if (!checkPicking && BABYLON.ActionManager && ActionManager.HasPickTriggers) {
                    act = this._initActionManager(act, clickInfo);
                    if (act)
                        checkPicking = act.hasPickTriggers;
                }
                if (checkPicking) {
                    let btn = evt.button;
                    clickInfo.hasSwiped = Math.abs(this._startingPointerPosition.x - this._pointerX) > Scene.DragMovementThreshold ||
                        Math.abs(this._startingPointerPosition.y - this._pointerY) > Scene.DragMovementThreshold;

                    if (!clickInfo.hasSwiped) {
                        let checkSingleClickImmediately = !Scene.ExclusiveDoubleClickMode;

                        if (!checkSingleClickImmediately) {
                            checkSingleClickImmediately = !obs1.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP) &&
                                !obs2.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP);

                            if (checkSingleClickImmediately && !ActionManager.HasSpecificTrigger(ActionManager.OnDoublePickTrigger)) {
                                act = this._initActionManager(act, clickInfo);
                                if (act)
                                    checkSingleClickImmediately = !act.hasSpecificTrigger(ActionManager.OnDoublePickTrigger);
                            }
                        }

                        if (checkSingleClickImmediately) {
                            // single click detected if double click delay is over or two different successive keys pressed without exclusive double click or no double click required
                            if (new Date().getTime() - this._previousStartingPointerTime > Scene.DoubleClickDelay ||
                                btn !== this._previousButtonPressed) {
                                clickInfo.singleClick = true;

                                cb(clickInfo, this._currentPickResult);
                            }
                        }
                        // at least one double click is required to be check and exclusive double click is enabled
                        else {
                            // wait that no double click has been raised during the double click delay
                            this._previousDelayedSimpleClickTimeout = this._delayedSimpleClickTimeout;
                            this._delayedSimpleClickTimeout = window.setTimeout(this._delayedSimpleClick.bind(this, btn, clickInfo, cb), Scene.DoubleClickDelay);
                        }

                        let checkDoubleClick = obs1.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP) ||
                            obs2.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP);
                        if (!checkDoubleClick && ActionManager.HasSpecificTrigger(ActionManager.OnDoublePickTrigger)) {
                            act = this._initActionManager(act, clickInfo);
                            if (act)
                                checkDoubleClick = act.hasSpecificTrigger(ActionManager.OnDoublePickTrigger);
                        }
                        if (checkDoubleClick) {
                            // two successive keys pressed are equal, double click delay is not over and double click has not just occurred
                            if (btn === this._previousButtonPressed &&
                                new Date().getTime() - this._previousStartingPointerTime < Scene.DoubleClickDelay &&
                                !this._doubleClickOccured
                            ) {
                                // pointer has not moved for 2 clicks, it's a double click
                                if (!clickInfo.hasSwiped &&
                                    Math.abs(this._previousStartingPointerPosition.x - this._startingPointerPosition.x) < Scene.DragMovementThreshold &&
                                    Math.abs(this._previousStartingPointerPosition.y - this._startingPointerPosition.y) < Scene.DragMovementThreshold) {
                                    this._previousStartingPointerTime = 0;
                                    this._doubleClickOccured = true;
                                    clickInfo.doubleClick = true;
                                    clickInfo.ignore = false;
                                    if (Scene.ExclusiveDoubleClickMode && this._previousDelayedSimpleClickTimeout) {
                                        clearTimeout(this._previousDelayedSimpleClickTimeout);
                                    }
                                    this._previousDelayedSimpleClickTimeout = this._delayedSimpleClickTimeout;
                                    cb(clickInfo, this._currentPickResult);
                                }
                                // if the two successive clicks are too far, it's just two simple clicks
                                else {
                                    this._doubleClickOccured = false;
                                    this._previousStartingPointerTime = this._startingPointerTime;
                                    this._previousStartingPointerPosition.x = this._startingPointerPosition.x;
                                    this._previousStartingPointerPosition.y = this._startingPointerPosition.y;
                                    this._previousButtonPressed = btn;
                                    this._previousHasSwiped = clickInfo.hasSwiped;
                                    if (Scene.ExclusiveDoubleClickMode) {
                                        if (this._previousDelayedSimpleClickTimeout) {
                                            clearTimeout(this._previousDelayedSimpleClickTimeout);
                                        }
                                        this._previousDelayedSimpleClickTimeout = this._delayedSimpleClickTimeout;

                                        cb(clickInfo, this._previousPickResult);
                                    }
                                    else {
                                        cb(clickInfo, this._currentPickResult);
                                    }
                                }
                            }
                            // just the first click of the double has been raised
                            else {
                                this._doubleClickOccured = false;
                                this._previousStartingPointerTime = this._startingPointerTime;
                                this._previousStartingPointerPosition.x = this._startingPointerPosition.x;
                                this._previousStartingPointerPosition.y = this._startingPointerPosition.y;
                                this._previousButtonPressed = btn;
                                this._previousHasSwiped = clickInfo.hasSwiped;
                            }
                        }
                    }
                }
                clickInfo.ignore = true;
                cb(clickInfo, this._currentPickResult);
            };

            this._spritePredicate = (sprite: Sprite): boolean => {
                return sprite.isPickable && sprite.actionManager && sprite.actionManager.hasPointerTriggers;
            };

            this._onPointerMove = (evt: PointerEvent) => {

                this._updatePointerPosition(evt);

                // PreObservable support
                if (this.onPrePointerObservable.hasObservers()) {
                    let type = evt.type === "mousewheel" || evt.type === "DOMMouseScroll" ? PointerEventTypes.POINTERWHEEL : PointerEventTypes.POINTERMOVE;
                    let pi = new PointerInfoPre(type, evt, this._unTranslatedPointerX, this._unTranslatedPointerY);
                    this.onPrePointerObservable.notifyObservers(pi, type);
                    if (pi.skipOnPointerObservable) {
                        return;
                    }
                }

                if (!this.cameraToUseForPointers && !this.activeCamera) {
                    return;
                }

                if (!this.pointerMovePredicate) {
                    this.pointerMovePredicate = (mesh: AbstractMesh): boolean => mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.isEnabled() && (mesh.enablePointerMoveEvents || this.constantlyUpdateMeshUnderPointer || (mesh.actionManager !== null && mesh.actionManager !== undefined));
                }

                // Meshes
                var pickResult = this.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, this.pointerMovePredicate, false, this.cameraToUseForPointers);             

                this._processPointerMove(pickResult, evt);
            };

            this._onPointerDown = (evt: PointerEvent) => {
                this._totalPointersPressed++;
                this._pickedDownMesh = null;
                this._meshPickProceed = false;

                this._updatePointerPosition(evt);

                if (this.preventDefaultOnPointerDown && canvas) {
                    evt.preventDefault();
                    canvas.focus();
                }

                // PreObservable support
                if (this.onPrePointerObservable.hasObservers()) {
                    let type = PointerEventTypes.POINTERDOWN;
                    let pi = new PointerInfoPre(type, evt, this._unTranslatedPointerX, this._unTranslatedPointerY);
                    this.onPrePointerObservable.notifyObservers(pi, type);
                    if (pi.skipOnPointerObservable) {
                        return;
                    }
                }

                if (!this.cameraToUseForPointers && !this.activeCamera) {
                    return;
                }

                this._startingPointerPosition.x = this._pointerX;
                this._startingPointerPosition.y = this._pointerY;
                this._startingPointerTime = new Date().getTime();

                if (!this.pointerDownPredicate) {
                    this.pointerDownPredicate = (mesh: AbstractMesh): boolean => {
                        return mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.isEnabled();
                    };
                }

                // Meshes
                this._pickedDownMesh = null;
                var pickResult = this.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, this.pointerDownPredicate, false, this.cameraToUseForPointers);

                this._processPointerDown(pickResult, evt);

                // Sprites
                this._pickedDownSprite = null;
                if (this.spriteManagers.length > 0) {
                    pickResult = this.pickSprite(this._unTranslatedPointerX, this._unTranslatedPointerY, this._spritePredicate, false, this.cameraToUseForPointers || undefined);

                    if (pickResult && pickResult.hit && pickResult.pickedSprite) {
                        if (pickResult.pickedSprite.actionManager) {
                            this._pickedDownSprite = pickResult.pickedSprite;
                            switch (evt.button) {
                                case 0:
                                    pickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnLeftPickTrigger, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, this, evt));
                                    break;
                                case 1:
                                    pickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnCenterPickTrigger, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, this, evt));
                                    break;
                                case 2:
                                    pickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnRightPickTrigger, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, this, evt));
                                    break;
                            }
                            if (pickResult.pickedSprite.actionManager) {
                                pickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnPickDownTrigger, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, this, evt));
                            }
                        }
                    }
                }
            };

            this._onPointerUp = (evt: PointerEvent) => {
                if (this._totalPointersPressed === 0) {  // We are attaching the pointer up to windows because of a bug in FF                    
                    return;                             // So we need to test it the pointer down was pressed before.
                }

                this._totalPointersPressed--;
                this._pickedUpMesh = null;
                this._meshPickProceed = false;

                this._updatePointerPosition(evt);      

                this._initClickEvent(this.onPrePointerObservable, this.onPointerObservable, evt, (clickInfo: ClickInfo, pickResult: Nullable<PickingInfo>) => {
                    // PreObservable support
                    if (this.onPrePointerObservable.hasObservers()) {
                        if (!clickInfo.ignore) {
                            if (!clickInfo.hasSwiped) {
                                if (clickInfo.singleClick && this.onPrePointerObservable.hasSpecificMask(PointerEventTypes.POINTERTAP)) {
                                    let type = PointerEventTypes.POINTERTAP;
                                    let pi = new PointerInfoPre(type, evt, this._unTranslatedPointerX, this._unTranslatedPointerY);
                                    this.onPrePointerObservable.notifyObservers(pi, type);
                                    if (pi.skipOnPointerObservable) {
                                        return;
                                    }
                                }
                                if (clickInfo.doubleClick && this.onPrePointerObservable.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP)) {
                                    let type = PointerEventTypes.POINTERDOUBLETAP;
                                    let pi = new PointerInfoPre(type, evt, this._unTranslatedPointerX, this._unTranslatedPointerY);
                                    this.onPrePointerObservable.notifyObservers(pi, type);
                                    if (pi.skipOnPointerObservable) {
                                        return;
                                    }
                                }
                            }
                        }
                        else {
                            let type = PointerEventTypes.POINTERUP;
                            let pi = new PointerInfoPre(type, evt, this._unTranslatedPointerX, this._unTranslatedPointerY);
                            this.onPrePointerObservable.notifyObservers(pi, type);
                            if (pi.skipOnPointerObservable) {
                                return;
                            }
                        }
                    }

                    if (!this.cameraToUseForPointers && !this.activeCamera) {
                        return;
                    }

                    if (!this.pointerUpPredicate) {
                        this.pointerUpPredicate = (mesh: AbstractMesh): boolean => {
                            return mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.isEnabled();
                        };
                    }

                    // Meshes
                    if (!this._meshPickProceed && (BABYLON.ActionManager && ActionManager.HasTriggers || this.onPointerObservable.hasObservers())) {
                        this._initActionManager(null, clickInfo);
                    }
                    if (!pickResult) {
                        pickResult = this._currentPickResult;
                    }

                    this._processPointerUp(pickResult, evt, clickInfo);

                    // Sprites
                    if (this.spriteManagers.length > 0) {
                        let spritePickResult = this.pickSprite(this._unTranslatedPointerX, this._unTranslatedPointerY, this._spritePredicate, false, this.cameraToUseForPointers || undefined);

                        if (spritePickResult) {
                            if (spritePickResult.hit && spritePickResult.pickedSprite) {
                                if (spritePickResult.pickedSprite.actionManager) {
                                    spritePickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnPickUpTrigger, ActionEvent.CreateNewFromSprite(spritePickResult.pickedSprite, this, evt));
                                    if (spritePickResult.pickedSprite.actionManager) {
                                        if (Math.abs(this._startingPointerPosition.x - this._pointerX) < Scene.DragMovementThreshold && Math.abs(this._startingPointerPosition.y - this._pointerY) < Scene.DragMovementThreshold) {
                                            spritePickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnPickTrigger, ActionEvent.CreateNewFromSprite(spritePickResult.pickedSprite, this, evt));
                                        }
                                    }
                                }
                            }
                            if (this._pickedDownSprite && this._pickedDownSprite.actionManager && this._pickedDownSprite !== spritePickResult.pickedSprite) {
                                this._pickedDownSprite.actionManager.processTrigger(ActionManager.OnPickOutTrigger, ActionEvent.CreateNewFromSprite(this._pickedDownSprite, this, evt));
                            }
                        }
                    }
                    this._previousPickResult = this._currentPickResult;
                });
            };

            this._onKeyDown = (evt: KeyboardEvent) => {
                let type = KeyboardEventTypes.KEYDOWN;
                if (this.onPreKeyboardObservable.hasObservers()) {
                    let pi = new KeyboardInfoPre(type, evt);
                    this.onPreKeyboardObservable.notifyObservers(pi, type);
                    if (pi.skipOnPointerObservable) {
                        return;
                    }
                }

                if (this.onKeyboardObservable.hasObservers()) {
                    let pi = new KeyboardInfo(type, evt);
                    this.onKeyboardObservable.notifyObservers(pi, type);
                }

                if (this.actionManager) {
                    this.actionManager.processTrigger(ActionManager.OnKeyDownTrigger, ActionEvent.CreateNewFromScene(this, evt));
                }
            };

            this._onKeyUp = (evt: KeyboardEvent) => {
                let type = KeyboardEventTypes.KEYUP;
                if (this.onPreKeyboardObservable.hasObservers()) {
                    let pi = new KeyboardInfoPre(type, evt);
                    this.onPreKeyboardObservable.notifyObservers(pi, type);
                    if (pi.skipOnPointerObservable) {
                        return;
                    }
                }

                if (this.onKeyboardObservable.hasObservers()) {
                    let pi = new KeyboardInfo(type, evt);
                    this.onKeyboardObservable.notifyObservers(pi, type);
                }

                if (this.actionManager) {
                    this.actionManager.processTrigger(ActionManager.OnKeyUpTrigger, ActionEvent.CreateNewFromScene(this, evt));
                }
            };

            let engine = this.getEngine();
            this._onCanvasFocusObserver = engine.onCanvasFocusObservable.add(()=>{
                if (!canvas) {
                    return;
                }
                canvas.addEventListener("keydown", this._onKeyDown, false);
                canvas.addEventListener("keyup", this._onKeyUp, false);   
            });

            this._onCanvasBlurObserver = engine.onCanvasBlurObservable.add(()=>{       
                if (!canvas) {
                    return;
                }                         
                canvas.removeEventListener("keydown", this._onKeyDown);
                canvas.removeEventListener("keyup", this._onKeyUp);
            });

            var eventPrefix = Tools.GetPointerPrefix();
            var canvas = this._engine.getRenderingCanvas();

            if (!canvas) {
                return;
            }

            if (attachMove) {
                canvas.addEventListener(eventPrefix + "move", this._onPointerMove, false);
                // Wheel
                canvas.addEventListener('mousewheel', this._onPointerMove, false);
                canvas.addEventListener('DOMMouseScroll', this._onPointerMove, false);
            }

            if (attachDown) {
                canvas.addEventListener(eventPrefix + "down", this._onPointerDown, false);
            }

            if (attachUp) {
                window.addEventListener(eventPrefix + "up", this._onPointerUp, false);
            }

            canvas.tabIndex = 1;
        }

        public detachControl() {
            let engine = this.getEngine();
            var eventPrefix = Tools.GetPointerPrefix();
            var canvas = engine.getRenderingCanvas();

            if (!canvas) {
                return;
            }

            canvas.removeEventListener(eventPrefix + "move", this._onPointerMove);
            canvas.removeEventListener(eventPrefix + "down", this._onPointerDown);
            window.removeEventListener(eventPrefix + "up", this._onPointerUp);

            if (this._onCanvasBlurObserver) {
                engine.onCanvasBlurObservable.remove(this._onCanvasBlurObserver);
            }

            if (this._onCanvasFocusObserver) {
                engine.onCanvasFocusObservable.remove(this._onCanvasFocusObserver);
            }

            // Wheel
            canvas.removeEventListener('mousewheel', this._onPointerMove);
            canvas.removeEventListener('DOMMouseScroll', this._onPointerMove);

            // Keyboard
            canvas.removeEventListener("keydown", this._onKeyDown);
            canvas.removeEventListener("keyup", this._onKeyUp);

            // Observables
            this.onKeyboardObservable.clear();
            this.onPreKeyboardObservable.clear();
            this.onPointerObservable.clear();
            this.onPrePointerObservable.clear();     
        }

        // Ready
        public isReady(): boolean {
            if (this._pendingData.length > 0) {
                return false;
            }
            var index: number;

            // Geometries
            for (index = 0; index < this._geometries.length; index++) {
                var geometry = this._geometries[index];

                if (geometry.delayLoadState === Engine.DELAYLOADSTATE_LOADING) {
                    return false;
                }
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

                if (!mesh.isReady()) {
                    return false;
                }

                var mat = mesh.material;
                if (mat) {
                    if (!mat.isReady(mesh)) {
                        return false;
                    }
                }
            }

            return true;
        }

        public resetCachedMaterial(): void {
            this._cachedMaterial = null;
            this._cachedEffect = null;
            this._cachedVisibility = null;
        }

        public registerBeforeRender(func: () => void): void {
            this.onBeforeRenderObservable.add(func);
        }

        public unregisterBeforeRender(func: () => void): void {
            this.onBeforeRenderObservable.removeCallback(func);
        }

        public registerAfterRender(func: () => void): void {
            this.onAfterRenderObservable.add(func);
        }

        public unregisterAfterRender(func: () => void): void {
            this.onAfterRenderObservable.removeCallback(func);
        }

        public _addPendingData(data: any): void {
            this._pendingData.push(data);
        }

        public _removePendingData(data: any): void {
            var index = this._pendingData.indexOf(data);

            if (index !== -1) {
                this._pendingData.splice(index, 1);
            }
        }

        public getWaitingItemsCount(): number {
            return this._pendingData.length;
        }

        /**
         * Registers a function to be executed when the scene is ready.
         * @param {Function} func - the function to be executed.
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

        public _checkIsReady() {
            if (this.isReady()) {
                this.onReadyObservable.notifyObservers(this);

                this.onReadyObservable.clear();
                this._executeWhenReadyTimeoutId = -1;
                return;
            }

            this._executeWhenReadyTimeoutId = setTimeout(() => {
                this._checkIsReady();
            }, 150);
        }

        // Animations
        /**
         * Will start the animation sequence of a given target
         * @param target - the target
         * @param {number} from - from which frame should animation start
         * @param {number} to - till which frame should animation run.
         * @param {boolean} [loop] - should the animation loop
         * @param {number} [speedRatio] - the speed in which to run the animation
         * @param {Function} [onAnimationEnd] function to be executed when the animation ended.
         * @param {BABYLON.Animatable} [animatable] an animatable object. If not provided a new one will be created from the given params.
         * Returns {BABYLON.Animatable} the animatable object created for this animation
         * See BABYLON.Animatable
         */
        public beginAnimation(target: any, from: number, to: number, loop?: boolean, speedRatio: number = 1.0, onAnimationEnd?: () => void, animatable?: Animatable): Animatable {

            if (from > to && speedRatio > 0) {
                speedRatio *= -1;
            }

            this.stopAnimation(target);

            if (!animatable) {
                animatable = new Animatable(this, target, from, to, loop, speedRatio, onAnimationEnd);
            }

            // Local animations
            if (target.animations) {
                animatable.appendAnimations(target, target.animations);
            }

            // Children animations
            if (target.getAnimatables) {
                var animatables = target.getAnimatables();
                for (var index = 0; index < animatables.length; index++) {
                    this.beginAnimation(animatables[index], from, to, loop, speedRatio, onAnimationEnd, animatable);
                }
            }

            animatable.reset();

            return animatable;
        }

        public beginDirectAnimation(target: any, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Animatable {
            if (speedRatio === undefined) {
                speedRatio = 1.0;
            }

            var animatable = new Animatable(this, target, from, to, loop, speedRatio, onAnimationEnd, animations);

            return animatable;
        }

        public getAnimatableByTarget(target: any): Nullable<Animatable> {
            for (var index = 0; index < this._activeAnimatables.length; index++) {
                if (this._activeAnimatables[index].target === target) {
                    return this._activeAnimatables[index];
                }
            }

            return null;
        }

        public get Animatables(): Animatable[] {
            return this._activeAnimatables;
        }

        /**
         * Will stop the animation of the given target
         * @param target - the target
         * @param animationName - the name of the animation to stop (all animations will be stopped is empty)
         * @see beginAnimation
         */
        public stopAnimation(target: any, animationName?: string): void {
            var animatable = this.getAnimatableByTarget(target);

            if (animatable) {
                animatable.stop(animationName);
            }
        }

        private _animate(): void {
            if (!this.animationsEnabled || this._activeAnimatables.length === 0) {
                return;
            }

            // Getting time
            var now = Tools.Now;
            if (!this._animationTimeLast) {
                if (this._pendingData.length > 0) {
                    return;
                }
                this._animationTimeLast = now;
            }
            var deltaTime = (now - this._animationTimeLast) * this.animationTimeScale;
            this._animationTime += deltaTime;
            this._animationTimeLast = now;
            for (var index = 0; index < this._activeAnimatables.length; index++) {
                this._activeAnimatables[index]._animate(this._animationTime);
            }
        }

        // Matrix
        public _switchToAlternateCameraConfiguration(active: boolean): void {
            this._useAlternateCameraConfiguration = active;
        }

        public getViewMatrix(): Matrix {            
            return this._useAlternateCameraConfiguration ? this._alternateViewMatrix : this._viewMatrix;
        }

        public getProjectionMatrix(): Matrix {
            return this._useAlternateCameraConfiguration ? this._alternateProjectionMatrix : this._projectionMatrix;
        }

        public getTransformMatrix(): Matrix {
            return this._useAlternateCameraConfiguration ? this._alternateTransformMatrix : this._transformMatrix;
        }

        public setTransformMatrix(view: Matrix, projection: Matrix): void {
            if (this._viewUpdateFlag === view.updateFlag && this._projectionUpdateFlag === projection.updateFlag) {
                return;
            }

            this._viewUpdateFlag = view.updateFlag;
            this._projectionUpdateFlag = projection.updateFlag;
            this._viewMatrix = view;
            this._projectionMatrix = projection;

            this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);

            // Update frustum
            if (!this._frustumPlanes) {
                this._frustumPlanes = Frustum.GetPlanes(this._transformMatrix);
            } else {
                Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
            }

            if (this.activeCamera && this.activeCamera._alternateCamera) {
                let otherCamera = this.activeCamera._alternateCamera;
                otherCamera.getViewMatrix().multiplyToRef(otherCamera.getProjectionMatrix(), Tmp.Matrix[0]);
                Frustum.GetRightPlaneToRef(Tmp.Matrix[0], this._frustumPlanes[3]); // Replace right plane by second camera right plane
            }

            if (this._sceneUbo.useUbo) {
                this._sceneUbo.updateMatrix("viewProjection", this._transformMatrix);
                this._sceneUbo.updateMatrix("view", this._viewMatrix);
                this._sceneUbo.update();
            }
        }

        public _setAlternateTransformMatrix(view: Matrix, projection: Matrix): void {
            if (this._alternateViewUpdateFlag === view.updateFlag && this._alternateProjectionUpdateFlag === projection.updateFlag) {
                return;
            }

            this._alternateViewUpdateFlag = view.updateFlag;
            this._alternateProjectionUpdateFlag = projection.updateFlag;
            this._alternateViewMatrix = view;
            this._alternateProjectionMatrix = projection;

            if (!this._alternateTransformMatrix) {
                this._alternateTransformMatrix = Matrix.Zero();
            }

            this._alternateViewMatrix.multiplyToRef(this._alternateProjectionMatrix, this._alternateTransformMatrix);

            if (!this._alternateSceneUbo) {
                this._createAlternateUbo();
            }
            
            if (this._alternateSceneUbo.useUbo) {
                this._alternateSceneUbo.updateMatrix("viewProjection", this._alternateTransformMatrix);
                this._alternateSceneUbo.updateMatrix("view", this._alternateViewMatrix);
                this._alternateSceneUbo.update();
            }
        }

        public getSceneUniformBuffer(): UniformBuffer {
            return this._useAlternateCameraConfiguration ? this._alternateSceneUbo : this._sceneUbo;
        }

        // Methods

        public getUniqueId() {
            var result = Scene._uniqueIdCounter;
            Scene._uniqueIdCounter++;
            return result;
        }

        public addMesh(newMesh: AbstractMesh) {
            this.meshes.push(newMesh);

            //notify the collision coordinator
            if (this.collisionCoordinator) {
                this.collisionCoordinator.onMeshAdded(newMesh);
            }

            this.onNewMeshAddedObservable.notifyObservers(newMesh);
        }

        public removeMesh(toRemove: AbstractMesh): number {
            var index = this.meshes.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found
                this.meshes.splice(index, 1);
            }
            //notify the collision coordinator
            if (this.collisionCoordinator) {
                this.collisionCoordinator.onMeshRemoved(toRemove);
            }

            this.onMeshRemovedObservable.notifyObservers(toRemove);

            return index;
        }

        public removeSkeleton(toRemove: Skeleton): number {
            var index = this.skeletons.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if found
                this.skeletons.splice(index, 1);
            }

            return index;
        }

        public removeMorphTargetManager(toRemove: MorphTargetManager): number {
            var index = this.morphTargetManagers.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if found
                this.morphTargetManagers.splice(index, 1);
            }

            return index;
        }

        public removeLight(toRemove: Light): number {
            var index = this.lights.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found
                this.lights.splice(index, 1);
                this.sortLightsByPriority();
            }
            this.onLightRemovedObservable.notifyObservers(toRemove);
            return index;
        }

        public removeCamera(toRemove: Camera): number {
            var index = this.cameras.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found
                this.cameras.splice(index, 1);
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

        public addLight(newLight: Light) {
            this.lights.push(newLight);
            this.sortLightsByPriority();

            this.onNewLightAddedObservable.notifyObservers(newLight);
        }

        public sortLightsByPriority(): void {
            if (this.requireLightSorting) {
                this.lights.sort(Light.compareLightsPriority);
            }
        }

        public addCamera(newCamera: Camera) {
            this.cameras.push(newCamera);
            this.onNewCameraAddedObservable.notifyObservers(newCamera);
        }

        /**
         * Switch active camera
         * @param {Camera} newCamera - new active camera
		 * @param {boolean} attachControl - call attachControl for the new active camera (default: true)
         */
        public switchActiveCamera(newCamera: Camera, attachControl = true) {
            var canvas = this._engine.getRenderingCanvas();

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
         * @param {string} id - the camera's ID
         * @return {BABYLON.Camera|null} the new active camera or null if none found.
         * @see activeCamera
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
         * @param {string} name - the camera's name
         * @return {BABYLON.Camera|null} the new active camera or null if none found.
         * @see activeCamera
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
         * get a material using its id
         * @param {string} the material's ID
         * @return {BABYLON.Material|null} the material or null if none found.
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
         * get a material using its name
         * @param {string} the material's name
         * @return {BABYLON.Material|null} the material or null if none found.
         */
        public getMaterialByName(name: string): Nullable<Material> {
            for (var index = 0; index < this.materials.length; index++) {
                if (this.materials[index].name === name) {
                    return this.materials[index];
                }
            }

            return null;
        }

        public getLensFlareSystemByName(name: string): Nullable<LensFlareSystem> {
            for (var index = 0; index < this.lensFlareSystems.length; index++) {
                if (this.lensFlareSystems[index].name === name) {
                    return this.lensFlareSystems[index];
                }
            }

            return null;
        }

        public getLensFlareSystemByID(id: string): Nullable<LensFlareSystem> {
            for (var index = 0; index < this.lensFlareSystems.length; index++) {
                if (this.lensFlareSystems[index].id === id) {
                    return this.lensFlareSystems[index];
                }
            }

            return null;
        }

        public getCameraByID(id: string): Nullable<Camera> {
            for (var index = 0; index < this.cameras.length; index++) {
                if (this.cameras[index].id === id) {
                    return this.cameras[index];
                }
            }

            return null;
        }

        public getCameraByUniqueID(uniqueId: number): Nullable<Camera> {
            for (var index = 0; index < this.cameras.length; index++) {
                if (this.cameras[index].uniqueId === uniqueId) {
                    return this.cameras[index];
                }
            }

            return null;
        }

        /**
         * get a camera using its name
         * @param {string} the camera's name
         * @return {BABYLON.Camera|null} the camera or null if none found.
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
         * get a bone using its id
         * @param {string} the bone's id
         * @return {BABYLON.Bone|null} the bone or null if not found
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
        * get a bone using its id
        * @param {string} the bone's name
        * @return {BABYLON.Bone|null} the bone or null if not found
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
         * get a light node using its name
         * @param {string} the light's name
         * @return {BABYLON.Light|null} the light or null if none found.
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
         * get a light node using its ID
         * @param {string} the light's id
         * @return {BABYLON.Light|null} the light or null if none found.
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
         * get a light node using its scene-generated unique ID
         * @param {number} the light's unique id
         * @return {BABYLON.Light|null} the light or null if none found.
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
         * get a particle system by id
         * @param id {number} the particle system id
         * @return {BABYLON.IParticleSystem|null} the corresponding system or null if none found.
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
         * get a geometry using its ID
         * @param {string} the geometry's id
         * @return {BABYLON.Geometry|null} the geometry or null if none found.
         */
        public getGeometryByID(id: string): Nullable<Geometry> {
            for (var index = 0; index < this._geometries.length; index++) {
                if (this._geometries[index].id === id) {
                    return this._geometries[index];
                }
            }

            return null;
        }

        /**
         * add a new geometry to this scene.
         * @param {BABYLON.Geometry} geometry - the geometry to be added to the scene.
         * @param {boolean} [force] - force addition, even if a geometry with this ID already exists
         * @return {boolean} was the geometry added or not
         */
        public pushGeometry(geometry: Geometry, force?: boolean): boolean {
            if (!force && this.getGeometryByID(geometry.id)) {
                return false;
            }

            this._geometries.push(geometry);

            //notify the collision coordinator
            if (this.collisionCoordinator) {
                this.collisionCoordinator.onGeometryAdded(geometry);
            }

            this.onNewGeometryAddedObservable.notifyObservers(geometry);

            return true;
        }

        /**
         * Removes an existing geometry
         * @param {BABYLON.Geometry} geometry - the geometry to be removed from the scene.
         * @return {boolean} was the geometry removed or not
         */
        public removeGeometry(geometry: Geometry): boolean {
            var index = this._geometries.indexOf(geometry);

            if (index > -1) {
                this._geometries.splice(index, 1);

                //notify the collision coordinator
                if (this.collisionCoordinator) {
                    this.collisionCoordinator.onGeometryDeleted(geometry);
                }

                this.onGeometryRemovedObservable.notifyObservers(geometry);
                return true;
            }
            return false;
        }

        public getGeometries(): Geometry[] {
            return this._geometries;
        }

        /**
         * Get the first added mesh found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        public getMeshByID(id: string): Nullable<AbstractMesh> {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].id === id) {
                    return this.meshes[index];
                }
            }

            return null;
        }

        public getMeshesByID(id: string): Array<AbstractMesh> {
            return this.meshes.filter(function (m) {
                return m.id === id;
            })
        }

        /**
         * Get a mesh with its auto-generated unique id
         * @param {number} uniqueId - the unique id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
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
         * Get a the last added mesh found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
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
         * Get a the last added node (Mesh, Camera, Light) found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.Node|null} the node found or null if not found at all.
         */
        public getLastEntryByID(id: string): Nullable<Node> {
            var index: number;
            for (index = this.meshes.length - 1; index >= 0; index--) {
                if (this.meshes[index].id === id) {
                    return this.meshes[index];
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

        public getNodeByID(id: string): Nullable<Node> {
            var mesh = this.getMeshByID(id);

            if (mesh) {
                return mesh;
            }

            var light = this.getLightByID(id);

            if (light) {
                return light;
            }

            var camera = this.getCameraByID(id);

            if (camera) {
                return camera;
            }

            var bone = this.getBoneByID(id);

            return bone;
        }

        public getNodeByName(name: string): Nullable<Node> {
            var mesh = this.getMeshByName(name);

            if (mesh) {
                return mesh;
            }

            var light = this.getLightByName(name);

            if (light) {
                return light;
            }

            var camera = this.getCameraByName(name);

            if (camera) {
                return camera;
            }

            var bone = this.getBoneByName(name);

            return bone;
        }

        public getMeshByName(name: string): Nullable<AbstractMesh> {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].name === name) {
                    return this.meshes[index];
                }
            }

            return null;
        }

        public getSoundByName(name: string): Nullable<Sound> {
            var index: number;
            if (AudioEngine) {
                for (index = 0; index < this.mainSoundTrack.soundCollection.length; index++) {
                    if (this.mainSoundTrack.soundCollection[index].name === name) {
                        return this.mainSoundTrack.soundCollection[index];
                    }
                }

                for (var sdIndex = 0; sdIndex < this.soundTracks.length; sdIndex++) {
                    for (index = 0; index < this.soundTracks[sdIndex].soundCollection.length; index++) {
                        if (this.soundTracks[sdIndex].soundCollection[index].name === name) {
                            return this.soundTracks[sdIndex].soundCollection[index];
                        }
                    }
                }
            }

            return null;
        }

        public getLastSkeletonByID(id: string): Nullable<Skeleton> {
            for (var index = this.skeletons.length - 1; index >= 0; index--) {
                if (this.skeletons[index].id === id) {
                    return this.skeletons[index];
                }
            }

            return null;
        }

        public getSkeletonById(id: string): Nullable<Skeleton> {
            for (var index = 0; index < this.skeletons.length; index++) {
                if (this.skeletons[index].id === id) {
                    return this.skeletons[index];
                }
            }

            return null;
        }

        public getSkeletonByName(name: string): Nullable<Skeleton> {
            for (var index = 0; index < this.skeletons.length; index++) {
                if (this.skeletons[index].name === name) {
                    return this.skeletons[index];
                }
            }

            return null;
        }

        public getMorphTargetManagerById(id: number): Nullable<MorphTargetManager> {
            for (var index = 0; index < this.morphTargetManagers.length; index++) {
                if (this.morphTargetManagers[index].uniqueId === id) {
                    return this.morphTargetManagers[index];
                }
            }

            return null;
        }

        public isActiveMesh(mesh: AbstractMesh): boolean {
            return (this._activeMeshes.indexOf(mesh) !== -1);
        }

        /**
         * Return a the first highlight layer of the scene with a given name.
         * @param name The name of the highlight layer to look for.
         * @return The highlight layer if found otherwise null.
         */
        public getHighlightLayerByName(name: string): Nullable<HighlightLayer> {
            for (var index = 0; index < this.highlightLayers.length; index++) {
                if (this.highlightLayers[index].name === name) {
                    return this.highlightLayers[index];
                }
            }

            return null;
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

        private _evaluateSubMesh(subMesh: SubMesh, mesh: AbstractMesh): void {
            if (mesh.alwaysSelectAsActiveMesh || mesh.subMeshes.length === 1 || subMesh.isInFrustum(this._frustumPlanes)) {
                var material = subMesh.getMaterial();

                if (mesh.showSubMeshesBoundingBox) {
                    let boundingInfo = subMesh.getBoundingInfo();

                    if (boundingInfo) {
                        this.getBoundingBoxRenderer().renderList.push(boundingInfo.boundingBox);
                    }
                }

                if (material) {
                    // Render targets
                    if (material.getRenderTargetTextures) {
                        if (this._processedMaterials.indexOf(material) === -1) {
                            this._processedMaterials.push(material);

                            this._renderTargets.concatWithNoDuplicate(material.getRenderTargetTextures());
                        }
                    }

                    // Dispatch
                    this._activeIndices.addCount(subMesh.indexCount, false);
                    this._renderingManager.dispatch(subMesh);
                }
            }
        }

        public _isInIntermediateRendering(): boolean {
            return this._intermediateRendering
        }
        
        private _activeMeshesFrozen = false;

        /**
         * Use this function to stop evaluating active meshes. The current list will be keep alive between frames
         */
        public freezeActiveMeshes(): Scene {
            this._evaluateActiveMeshes();
            this._activeMeshesFrozen = true;
            return this;
        }
        
        /**
         * Use this function to restart evaluating active meshes on every frame
         */
        public unfreezeActiveMeshes() {
            this._activeMeshesFrozen = false;
            return this;
        }

        private _evaluateActiveMeshes(): void {
            if (this._activeMeshesFrozen && this._activeMeshes.length) {
                return;
            }

            if (!this.activeCamera) {
                return;
            }

            this.activeCamera._activeMeshes.reset();
            this._activeMeshes.reset();
            this._renderingManager.reset();
            this._processedMaterials.reset();
            this._activeParticleSystems.reset();
            this._activeSkeletons.reset();
            this._softwareSkinnedMeshes.reset();
            if (this._boundingBoxRenderer) {
                this._boundingBoxRenderer.reset();
            }

            // Meshes
            var meshes: AbstractMesh[];
            var len: number;

            if (this._selectionOctree) { // Octree
                var selection = this._selectionOctree.select(this._frustumPlanes);
                meshes = selection.data;
                len = selection.length;
            } else { // Full scene traversal
                len = this.meshes.length;
                meshes = this.meshes;
            }

            for (var meshIndex = 0; meshIndex < len; meshIndex++) {
                var mesh = meshes[meshIndex];

                if (mesh.isBlocked) {
                    continue;
                }

                this._totalVertices.addCount(mesh.getTotalVertices(), false);

                if (!mesh.isReady() || !mesh.isEnabled()) {
                    continue;
                }

                mesh.computeWorldMatrix();

                // Intersections
                if (mesh.actionManager && mesh.actionManager.hasSpecificTriggers([ActionManager.OnIntersectionEnterTrigger, ActionManager.OnIntersectionExitTrigger])) {
                    this._meshesForIntersections.pushNoDuplicate(mesh);
                }

                // Switch to current LOD
                var meshLOD = mesh.getLOD(this.activeCamera);

                if (!meshLOD) {
                    continue;
                }

                mesh._preActivate();

                if (mesh.alwaysSelectAsActiveMesh || mesh.isVisible && mesh.visibility > 0 && ((mesh.layerMask & this.activeCamera.layerMask) !== 0) && mesh.isInFrustum(this._frustumPlanes)) {
                    this._activeMeshes.push(mesh);
                    this.activeCamera._activeMeshes.push(mesh);
                        
                    mesh._activate(this._renderId);
                    if (meshLOD !== mesh) {
                        meshLOD._activate(this._renderId);
                    }

                    this._activeMesh(mesh, meshLOD);
                }
            }

            // Particle systems
            this._particlesDuration.beginMonitoring();
            if (this.particlesEnabled) {
                Tools.StartPerformanceCounter("Particles", this.particleSystems.length > 0);
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
                Tools.EndPerformanceCounter("Particles", this.particleSystems.length > 0);
            }
            this._particlesDuration.endMonitoring(false);
        }

        private _activeMesh(sourceMesh: AbstractMesh, mesh: AbstractMesh): void {
            if (mesh.skeleton && this.skeletonsEnabled) {
                if (this._activeSkeletons.pushNoDuplicate(mesh.skeleton)) {
                    mesh.skeleton.prepare();
                }

                if (!mesh.computeBonesUsingShaders) {
                    this._softwareSkinnedMeshes.pushNoDuplicate(<Mesh>mesh);
                }
            }

            if (sourceMesh.showBoundingBox || this.forceShowBoundingBoxes) {
                let boundingInfo = sourceMesh.getBoundingInfo();

                if (boundingInfo) {
                    this.getBoundingBoxRenderer().renderList.push(boundingInfo.boundingBox);    
                }
            }

            if (mesh && mesh.subMeshes) {
                // Submeshes Octrees
                var len: number;
                var subMeshes: SubMesh[];

                if (mesh._submeshesOctree && mesh.useOctreeForRenderingSelection) {
                    var intersections = mesh._submeshesOctree.select(this._frustumPlanes);

                    len = intersections.length;
                    subMeshes = intersections.data;
                } else {
                    subMeshes = mesh.subMeshes;
                    len = subMeshes.length;
                }

                for (var subIndex = 0; subIndex < len; subIndex++) {
                    var subMesh = subMeshes[subIndex];

                    this._evaluateSubMesh(subMesh, mesh);
                }
            }
        }

        public updateTransformMatrix(force?: boolean): void {
            if (!this.activeCamera) {
                return;
            }
            this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix(force));
        }

        public updateAlternateTransformMatrix(alternateCamera: Camera): void {
            this._setAlternateTransformMatrix(alternateCamera.getViewMatrix(), alternateCamera.getProjectionMatrix());
        }

        private _renderForCamera(camera: Camera): void {
            if (camera && camera._skipRendering) {
                return;
            }

            var engine = this._engine;

            this.activeCamera = camera;

            if (!this.activeCamera)
                throw new Error("Active camera not set");

            Tools.StartPerformanceCounter("Rendering camera " + this.activeCamera.name);
           
            // Viewport
            engine.setViewport(this.activeCamera.viewport);

            // Camera
            this.resetCachedMaterial();
            this._renderId++;
            this.activeCamera.update();
            this.updateTransformMatrix();

            if (camera._alternateCamera) {
                this.updateAlternateTransformMatrix(camera._alternateCamera);
                this._alternateRendering = true;
            }

            this.onBeforeCameraRenderObservable.notifyObservers(this.activeCamera);

            // Meshes
            this._evaluateActiveMeshesDuration.beginMonitoring();
            Tools.StartPerformanceCounter("Active meshes evaluation");
            this._evaluateActiveMeshes();
            this._evaluateActiveMeshesDuration.endMonitoring(false);
            Tools.EndPerformanceCounter("Active meshes evaluation");

            // Software skinning
            for (var softwareSkinnedMeshIndex = 0; softwareSkinnedMeshIndex < this._softwareSkinnedMeshes.length; softwareSkinnedMeshIndex++) {
                var mesh = this._softwareSkinnedMeshes.data[softwareSkinnedMeshIndex];

                mesh.applySkeleton(<Skeleton>mesh.skeleton);
            }

            // Render targets
            this._renderTargetsDuration.beginMonitoring();
            var needsRestoreFrameBuffer = false;

            if (camera.customRenderTargets && camera.customRenderTargets.length > 0) {
                this._renderTargets.concatWithNoDuplicate(camera.customRenderTargets);
            }

            if (this.renderTargetsEnabled && this._renderTargets.length > 0) {
                this._intermediateRendering = true;
                Tools.StartPerformanceCounter("Render targets", this._renderTargets.length > 0);
                for (var renderIndex = 0; renderIndex < this._renderTargets.length; renderIndex++) {
                    let renderTarget = this._renderTargets.data[renderIndex];
                    if (renderTarget._shouldRender()) {
                        this._renderId++;
                        var hasSpecialRenderTargetCamera = renderTarget.activeCamera && renderTarget.activeCamera !== this.activeCamera;
                        renderTarget.render((<boolean>hasSpecialRenderTargetCamera), this.dumpNextRenderTargets);
                    }
                }
                Tools.EndPerformanceCounter("Render targets", this._renderTargets.length > 0);

                this._intermediateRendering = false;
                this._renderId++;

                needsRestoreFrameBuffer = true; // Restore back buffer
            }

            // Render HighlightLayer Texture
            var stencilState = this._engine.getStencilBuffer();
            var renderhighlights = false;
            if (this.renderTargetsEnabled && this.highlightLayers && this.highlightLayers.length > 0) {
                this._intermediateRendering = true;
                for (let i = 0; i < this.highlightLayers.length; i++) {
                    let highlightLayer = this.highlightLayers[i];

                    if (highlightLayer.shouldRender() &&
                        (!highlightLayer.camera ||
                            (highlightLayer.camera.cameraRigMode === Camera.RIG_MODE_NONE && camera === highlightLayer.camera) ||
                            (highlightLayer.camera.cameraRigMode !== Camera.RIG_MODE_NONE && highlightLayer.camera._rigCameras.indexOf(camera) > -1))) {

                        renderhighlights = true;

                        let renderTarget = (<RenderTargetTexture>(<any>highlightLayer)._mainTexture);
                        if (renderTarget._shouldRender()) {
                            this._renderId++;
                            renderTarget.render(false, false);
                            needsRestoreFrameBuffer = true;
                        }
                    }
                }

                this._intermediateRendering = false;
                this._renderId++;
            }

            if (needsRestoreFrameBuffer) {
                engine.restoreDefaultFramebuffer(); // Restore back buffer
            }

            this._renderTargetsDuration.endMonitoring(false);

            // Prepare Frame
            this.postProcessManager._prepareFrame();

            this._renderDuration.beginMonitoring();

            // Backgrounds
            var layerIndex;
            var layer;
            if (this.layers.length) {
                engine.setDepthBuffer(false);
                for (layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
                    layer = this.layers[layerIndex];
                    if (layer.isBackground && ((layer.layerMask & this.activeCamera.layerMask) !== 0)) {
                        layer.render();
                    }
                }
                engine.setDepthBuffer(true);
            }

            // Render
            Tools.StartPerformanceCounter("Main render");

            // Activate HighlightLayer stencil
            if (renderhighlights) {
                this._engine.setStencilBuffer(true);
            }

            this._renderingManager.render(null, null, true, true);

            // Restore HighlightLayer stencil
            if (renderhighlights) {
                this._engine.setStencilBuffer(stencilState);
            }

            Tools.EndPerformanceCounter("Main render");

            // Bounding boxes
            if (this._boundingBoxRenderer) {
                this._boundingBoxRenderer.render();
            }

            // Lens flares
            if (this.lensFlaresEnabled) {
                Tools.StartPerformanceCounter("Lens flares", this.lensFlareSystems.length > 0);
                for (var lensFlareSystemIndex = 0; lensFlareSystemIndex < this.lensFlareSystems.length; lensFlareSystemIndex++) {

                    var lensFlareSystem = this.lensFlareSystems[lensFlareSystemIndex];
                    if ((camera.layerMask & lensFlareSystem.layerMask) !== 0) {
                        lensFlareSystem.render();
                    }
                }
                Tools.EndPerformanceCounter("Lens flares", this.lensFlareSystems.length > 0);
            }

            // Foregrounds
            if (this.layers.length) {
                engine.setDepthBuffer(false);
                for (layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
                    layer = this.layers[layerIndex];
                    if (!layer.isBackground && ((layer.layerMask & this.activeCamera.layerMask) !== 0)) {
                        layer.render();
                    }
                }
                engine.setDepthBuffer(true);
            }

            // Highlight Layer
            if (renderhighlights) {
                engine.setDepthBuffer(false);
                for (let i = 0; i < this.highlightLayers.length; i++) {
                    if (this.highlightLayers[i].shouldRender()) {
                        this.highlightLayers[i].render();
                    }
                }
                engine.setDepthBuffer(true);
            }

            this._renderDuration.endMonitoring(false);

            // Finalize frame
            this.postProcessManager._finalizeFrame(camera.isIntermediate);
           
            // Reset some special arrays
            this._renderTargets.reset();

            this._alternateRendering = false;

            this.onAfterCameraRenderObservable.notifyObservers(this.activeCamera);

            Tools.EndPerformanceCounter("Rendering camera " + this.activeCamera.name);
        }

        private _processSubCameras(camera: Camera): void {
            if (camera.cameraRigMode === Camera.RIG_MODE_NONE) {
                this._renderForCamera(camera);
                return;
            }

            // Update camera
            if (this.activeCamera) {
                this.activeCamera.update();
            }
            
            // rig cameras
            for (var index = 0; index < camera._rigCameras.length; index++) {
                this._renderForCamera(camera._rigCameras[index]);
            }

            this.activeCamera = camera;
            this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix());
        }

        private _checkIntersections(): void {
            for (var index = 0; index < this._meshesForIntersections.length; index++) {
                var sourceMesh = this._meshesForIntersections.data[index];

                if (!sourceMesh.actionManager) {
                    continue;
                }

                for (var actionIndex = 0; actionIndex < sourceMesh.actionManager.actions.length; actionIndex++) {
                    var action = sourceMesh.actionManager.actions[actionIndex];

                    if (action.trigger === ActionManager.OnIntersectionEnterTrigger || action.trigger === ActionManager.OnIntersectionExitTrigger) {
                        var parameters = action.getTriggerParameter();
                        var otherMesh = parameters instanceof AbstractMesh ? parameters : parameters.mesh;

                        var areIntersecting = otherMesh.intersectsMesh(sourceMesh, parameters.usePreciseIntersection);
                        var currentIntersectionInProgress = sourceMesh._intersectionsInProgress.indexOf(otherMesh);

                        if (areIntersecting && currentIntersectionInProgress === -1) {
                            if (action.trigger === ActionManager.OnIntersectionEnterTrigger) {
                                action._executeCurrent(ActionEvent.CreateNew(sourceMesh, undefined, otherMesh));
                                sourceMesh._intersectionsInProgress.push(otherMesh);
                            } else if (action.trigger === ActionManager.OnIntersectionExitTrigger) {
                                sourceMesh._intersectionsInProgress.push(otherMesh);
                            }
                        } else if (!areIntersecting && currentIntersectionInProgress > -1) {
                            //They intersected, and now they don't.

                            //is this trigger an exit trigger? execute an event.
                            if (action.trigger === ActionManager.OnIntersectionExitTrigger) {
                                action._executeCurrent(ActionEvent.CreateNew(sourceMesh, undefined, otherMesh));
                            }

                            //if this is an exit trigger, or no exit trigger exists, remove the id from the intersection in progress array.
                            if (!sourceMesh.actionManager.hasSpecificTrigger(ActionManager.OnIntersectionExitTrigger) || action.trigger === ActionManager.OnIntersectionExitTrigger) {
                                sourceMesh._intersectionsInProgress.splice(currentIntersectionInProgress, 1);
                            }
                        }
                    }
                }
            }
        }

        public render(): void {
            if (this.isDisposed) {
                return;
            }

            this._interFrameDuration.endMonitoring();
            this._lastFrameDuration.beginMonitoring();
            this._particlesDuration.fetchNewFrame();
            this._spritesDuration.fetchNewFrame();
            this._activeParticles.fetchNewFrame();
            this._renderDuration.fetchNewFrame();
            this._renderTargetsDuration.fetchNewFrame();
            this._evaluateActiveMeshesDuration.fetchNewFrame();
            this._totalVertices.fetchNewFrame();
            this._activeIndices.fetchNewFrame();
            this._activeBones.fetchNewFrame();
            this.getEngine().drawCallsPerfCounter.fetchNewFrame();
            this._meshesForIntersections.reset();
            this.resetCachedMaterial();

            Tools.StartPerformanceCounter("Scene rendering");

            // Actions
            if (this.actionManager) {
                this.actionManager.processTrigger(ActionManager.OnEveryFrameTrigger);
            }

            //Simplification Queue
            if (this.simplificationQueue && !this.simplificationQueue.running) {
                this.simplificationQueue.executeNext();
            }

            if(this._engine.isDeterministicLockStep()){
              var deltaTime = Math.max(Scene.MinDeltaTime, Math.min(this._engine.getDeltaTime(), Scene.MaxDeltaTime)) / 1000;

              var defaultTimeStep = (60.0 / 1000.0);
              if (this._physicsEngine) {
                defaultTimeStep = this._physicsEngine.getTimeStep();
              }

              var maxSubSteps = this._engine.getLockstepMaxSteps();

              this._timeAccumulator += deltaTime;

              // compute the amount of fixed steps we should have taken since the last step
              var internalSteps = Math.floor(this._timeAccumulator / defaultTimeStep);
              internalSteps = Math.min(internalSteps, maxSubSteps);

              for(this._currentInternalStep = 0; this._currentInternalStep < internalSteps; this._currentInternalStep++){

                this.onBeforeStepObservable.notifyObservers(this);

                // Animations
                this._animationRatio = defaultTimeStep * (60.0 / 1000.0);
                this._animate();

                // Physics
                if (this._physicsEngine) {
                   Tools.StartPerformanceCounter("Physics");
                   this._physicsEngine._step(defaultTimeStep);
                   Tools.EndPerformanceCounter("Physics");
                }
                this._timeAccumulator -= defaultTimeStep;

                this.onAfterStepObservable.notifyObservers(this);
                this._currentStepId++;

                if((internalSteps > 1) && (this._currentInternalStep != internalSteps - 1)) {
                    this._evaluateActiveMeshes();
                }
              }
            }
            else {
              // Animations
              var deltaTime = Math.max(Scene.MinDeltaTime, Math.min(this._engine.getDeltaTime(), Scene.MaxDeltaTime));
              this._animationRatio = deltaTime * (60.0 / 1000.0);
              this._animate();

              // Physics
              if (this._physicsEngine) {
                 Tools.StartPerformanceCounter("Physics");
                 this._physicsEngine._step(deltaTime / 1000.0);
                 Tools.EndPerformanceCounter("Physics");
              }
            }

            // Before render
            this.onBeforeRenderObservable.notifyObservers(this);

            // Customs render targets
            this._renderTargetsDuration.beginMonitoring();
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

                        if (!this.activeCamera)
                            throw new Error("Active camera not set");

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
            if (this.customRenderTargets.length > 0) {
                engine.restoreDefaultFramebuffer();
            }

            this._renderTargetsDuration.endMonitoring();
            this.activeCamera = currentActiveCamera;

            // Procedural textures
            if (this.proceduralTexturesEnabled) {
                Tools.StartPerformanceCounter("Procedural textures", this._proceduralTextures.length > 0);
                for (var proceduralIndex = 0; proceduralIndex < this._proceduralTextures.length; proceduralIndex++) {
                    var proceduralTexture = this._proceduralTextures[proceduralIndex];
                    if (proceduralTexture._shouldRender()) {
                        proceduralTexture.render();
                    }
                }
                Tools.EndPerformanceCounter("Procedural textures", this._proceduralTextures.length > 0);
            }

            // Clear
            if (this.autoClearDepthAndStencil || this.autoClear) {
                this._engine.clear(this.clearColor, this.autoClear || this.forceWireframe || this.forcePointsCloud, this.autoClearDepthAndStencil, this.autoClearDepthAndStencil);
            }

            // Shadows
            if (this.shadowsEnabled) {
                for (var lightIndex = 0; lightIndex < this.lights.length; lightIndex++) {
                    var light = this.lights[lightIndex];
                    var shadowGenerator = light.getShadowGenerator();

                    if (light.isEnabled() && light.shadowEnabled && shadowGenerator) {
                        var shadowMap = <RenderTargetTexture>(shadowGenerator.getShadowMap());
                        if (this.textures.indexOf(shadowMap) !== -1) {
                            this._renderTargets.push(shadowMap);
                        }
                    }
                }
            }

            // Depth renderer
            if (this._depthRenderer) {
                this._renderTargets.push(this._depthRenderer.getDepthMap());
            }

            // Geometry renderer
            if (this._geometryBufferRenderer) {
                this._renderTargets.push(this._geometryBufferRenderer.getGBuffer());
            }

            // RenderPipeline
            if (this._postProcessRenderPipelineManager) {
                this._postProcessRenderPipelineManager.update();
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

            // Update the audio listener attached to the camera
            if (AudioEngine) {
                this._updateAudioParameters();
            }

            // After render
            if (this.afterRender) {
                this.afterRender();
            }

            this.onAfterRenderObservable.notifyObservers(this);

            // Cleaning
            for (var index = 0; index < this._toBeDisposed.length; index++) {
                var data = this._toBeDisposed.data[index];
                if (data) {
                    data.dispose();
                }
                this._toBeDisposed[index] = null;
            }

            this._toBeDisposed.reset();

            if (this.dumpNextRenderTargets) {
                this.dumpNextRenderTargets = false;
            }

            Tools.EndPerformanceCounter("Scene rendering");
            this._interFrameDuration.beginMonitoring();           
            this._lastFrameDuration.endMonitoring();
            this._totalMeshesCounter.addCount(this.meshes.length, true);
            this._totalLightsCounter.addCount(this.lights.length, true);
            this._totalMaterialsCounter.addCount(this.materials.length, true);
            this._totalTexturesCounter.addCount(this.textures.length, true);
            this._activeBones.addCount(0, true);
            this._activeIndices.addCount(0, true);
            this._activeParticles.addCount(0, true);
        }

        private _updateAudioParameters() {
            if (!this.audioEnabled || !this._mainSoundTrack || (this._mainSoundTrack.soundCollection.length === 0 && this.soundTracks.length === 1)) {
                return;
            }

            var listeningCamera: Nullable<Camera>;
            var audioEngine = Engine.audioEngine;

            if (this.activeCameras.length > 0) {
                listeningCamera = this.activeCameras[0];
            } else {
                listeningCamera = this.activeCamera;
            }

            if (listeningCamera && audioEngine.canUseWebAudio && audioEngine.audioContext) {
                audioEngine.audioContext.listener.setPosition(listeningCamera.position.x, listeningCamera.position.y, listeningCamera.position.z);
                // for VR cameras
                if (listeningCamera.rigCameras && listeningCamera.rigCameras.length > 0) {
                    listeningCamera = listeningCamera.rigCameras[0];
                }
                var mat = Matrix.Invert(listeningCamera.getViewMatrix());
                var cameraDirection = Vector3.TransformNormal(new Vector3(0, 0, -1), mat);
                cameraDirection.normalize();
                // To avoid some errors on GearVR
                if (!isNaN(cameraDirection.x) && !isNaN(cameraDirection.y) && !isNaN(cameraDirection.z)) {
                    audioEngine.audioContext.listener.setOrientation(cameraDirection.x, cameraDirection.y, cameraDirection.z, 0, 1, 0);
                }
                var i: number;
                for (i = 0; i < this.mainSoundTrack.soundCollection.length; i++) {
                    var sound = this.mainSoundTrack.soundCollection[i];
                    if (sound.useCustomAttenuation) {
                        sound.updateDistanceFromListener();
                    }
                }
                for (i = 0; i < this.soundTracks.length; i++) {
                    for (var j = 0; j < this.soundTracks[i].soundCollection.length; j++) {
                        sound = this.soundTracks[i].soundCollection[j];
                        if (sound.useCustomAttenuation) {
                            sound.updateDistanceFromListener();
                        }
                    }
                }
            }
        }

        // Audio
        public get audioEnabled(): boolean {
            return this._audioEnabled;
        }

        public set audioEnabled(value: boolean) {
            this._audioEnabled = value;
            if (AudioEngine) {
                if (this._audioEnabled) {
                    this._enableAudio();
                }
                else {
                    this._disableAudio();
                }
            }
        }

        private _disableAudio() {
            var i: number;
            for (i = 0; i < this.mainSoundTrack.soundCollection.length; i++) {
                this.mainSoundTrack.soundCollection[i].pause();
            }
            for (i = 0; i < this.soundTracks.length; i++) {
                for (var j = 0; j < this.soundTracks[i].soundCollection.length; j++) {
                    this.soundTracks[i].soundCollection[j].pause();
                }
            }
        }

        private _enableAudio() {
            var i: number;
            for (i = 0; i < this.mainSoundTrack.soundCollection.length; i++) {
                if (this.mainSoundTrack.soundCollection[i].isPaused) {
                    this.mainSoundTrack.soundCollection[i].play();
                }
            }
            for (i = 0; i < this.soundTracks.length; i++) {
                for (var j = 0; j < this.soundTracks[i].soundCollection.length; j++) {
                    if (this.soundTracks[i].soundCollection[j].isPaused) {
                        this.soundTracks[i].soundCollection[j].play();
                    }
                }
            }
        }

        public get headphone(): boolean {
            return this._headphone;
        }

        public set headphone(value: boolean) {
            this._headphone = value;
            if (AudioEngine) {
                if (this._headphone) {
                    this._switchAudioModeForHeadphones();
                }
                else {
                    this._switchAudioModeForNormalSpeakers();
                }
            }
        }

        private _switchAudioModeForHeadphones() {
            this.mainSoundTrack.switchPanningModelToHRTF();

            for (var i = 0; i < this.soundTracks.length; i++) {
                this.soundTracks[i].switchPanningModelToHRTF();
            }
        }

        private _switchAudioModeForNormalSpeakers() {
            this.mainSoundTrack.switchPanningModelToEqualPower();

            for (var i = 0; i < this.soundTracks.length; i++) {
                this.soundTracks[i].switchPanningModelToEqualPower();
            }
        }

        public enableDepthRenderer(): DepthRenderer {
            if (this._depthRenderer) {
                return this._depthRenderer;
            }

            this._depthRenderer = new DepthRenderer(this);

            return this._depthRenderer;
        }

        public disableDepthRenderer(): void {
            if (!this._depthRenderer) {
                return;
            }

            this._depthRenderer.dispose();
            this._depthRenderer = null;
        }

        public enableGeometryBufferRenderer(ratio: number = 1): Nullable<GeometryBufferRenderer> {
            if (this._geometryBufferRenderer) {
                return this._geometryBufferRenderer;
            }

            this._geometryBufferRenderer = new GeometryBufferRenderer(this, ratio);
            if (!this._geometryBufferRenderer.isSupported) {
                this._geometryBufferRenderer = null;
            }

            return this._geometryBufferRenderer;
        }

        public disableGeometryBufferRenderer(): void {
            if (!this._geometryBufferRenderer) {
                return;
            }

            this._geometryBufferRenderer.dispose();
            this._geometryBufferRenderer = null;
        }

        public freezeMaterials(): void {
            for (var i = 0; i < this.materials.length; i++) {
                this.materials[i].freeze();
            }
        }

        public unfreezeMaterials(): void {
            for (var i = 0; i < this.materials.length; i++) {
                this.materials[i].unfreeze();
            }
        }

        public dispose(): void {
            this.beforeRender = null;
            this.afterRender = null;

            this.skeletons = [];
            this.morphTargetManagers = [];

            this.importedMeshesFiles = new Array<string>();

            this.resetCachedMaterial();

            if (this._depthRenderer) {
                this._depthRenderer.dispose();
            }

            if (this._gamepadManager) {
                this._gamepadManager.dispose();
                this._gamepadManager = null;
            }

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

            if (this._boundingBoxRenderer) {
                this._boundingBoxRenderer.dispose();
            }
            this._meshesForIntersections.dispose();
            this._toBeDisposed.dispose();

            // Debug layer
            if (this._debugLayer) {
                this._debugLayer.hide();
            }

            // Events
            this.onDisposeObservable.notifyObservers(this);

            this.onDisposeObservable.clear();
            this.onBeforeRenderObservable.clear();
            this.onAfterRenderObservable.clear();

            this.detachControl();

            // Release sounds & sounds tracks
            if (AudioEngine) {
                this.disposeSounds();
            }

            // VR Helper
            if (this.VRHelper) {
                this.VRHelper.dispose();
            }

            // Detach cameras
            var canvas = this._engine.getRenderingCanvas();

            if (canvas) {
                var index;
                for (index = 0; index < this.cameras.length; index++) {
                    this.cameras[index].detachControl(canvas);
                }
            }

            // Release lights
            while (this.lights.length) {
                this.lights[0].dispose();
            }

            // Release meshes
            while (this.meshes.length) {
                this.meshes[0].dispose(true);
            }

            // Release cameras
            while (this.cameras.length) {
                this.cameras[0].dispose();
            }

            // Release materials
            if (this.defaultMaterial) {
                this.defaultMaterial.dispose()
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

            // Release sprites
            while (this.spriteManagers.length) {
                this.spriteManagers[0].dispose();
            }

            // Release postProcesses
            while (this.postProcesses.length) {
                this.postProcesses[0].dispose();
            }

            // Release layers
            while (this.layers.length) {
                this.layers[0].dispose();
            }
            while (this.highlightLayers.length) {
                this.highlightLayers[0].dispose();
            }

            // Release textures
            while (this.textures.length) {
                this.textures[0].dispose();
            }

            // Release UBO
            this._sceneUbo.dispose();

            if (this._alternateSceneUbo) {
                this._alternateSceneUbo.dispose();
            }

            // Post-processes
            this.postProcessManager.dispose();

            if (this._postProcessRenderPipelineManager) {
                this._postProcessRenderPipelineManager.dispose();
            }

            // Physics
            if (this._physicsEngine) {
                this.disablePhysicsEngine();
            }

            // Remove from engine
            index = this._engine.scenes.indexOf(this);

            if (index > -1) {
                this._engine.scenes.splice(index, 1);
            }

            this._engine.wipeCaches();
        }

        public get isDisposed(): boolean {
            return !this._engine;
        }

        // Release sounds & sounds tracks
        public disposeSounds() {
            if (!this._mainSoundTrack) {
                return;
            }

            this.mainSoundTrack.dispose();

            for (var scIndex = 0; scIndex < this.soundTracks.length; scIndex++) {
                this.soundTracks[scIndex].dispose();
            }
        }

        // Octrees
        public getWorldExtends(): { min: Vector3; max: Vector3 } {
            var min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (var index = 0; index < this.meshes.length; index++) {
                var mesh = this.meshes[index];

                if (!mesh.subMeshes || mesh.subMeshes.length === 0) {
                    continue;
                }

                mesh.computeWorldMatrix(true);
                let boundingInfo = mesh.getBoundingInfo();

                if (boundingInfo) {
                    var minBox = boundingInfo.boundingBox.minimumWorld;
                    var maxBox = boundingInfo.boundingBox.maximumWorld;

                    Tools.CheckExtends(minBox, min, max);
                    Tools.CheckExtends(maxBox, min, max);
                }
            }

            return {
                min: min,
                max: max
            };
        }

        public createOrUpdateSelectionOctree(maxCapacity = 64, maxDepth = 2): Octree<AbstractMesh> {
            if (!this._selectionOctree) {
                this._selectionOctree = new Octree<AbstractMesh>(Octree.CreationFuncForMeshes, maxCapacity, maxDepth);
            }

            var worldExtends = this.getWorldExtends();

            // Update octree
            this._selectionOctree.update(worldExtends.min, worldExtends.max, this.meshes);

            return this._selectionOctree;
        }

        // Picking
        public createPickingRay(x: number, y: number, world: Matrix, camera: Nullable<Camera>, cameraViewSpace = false): Ray {
            var engine = this._engine;

            if (!camera) {
                if (!this.activeCamera)
                    throw new Error("Active camera not set");

                camera = this.activeCamera;
            }

            var cameraViewport = camera.viewport;
            var viewport = cameraViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());

            // Moving coordinates to local viewport world
            x = x / this._engine.getHardwareScalingLevel() - viewport.x;
            y = y / this._engine.getHardwareScalingLevel() - (this._engine.getRenderHeight() - viewport.y - viewport.height);
            return Ray.CreateNew(x, y, viewport.width, viewport.height, world ? world : Matrix.Identity(), cameraViewSpace ? Matrix.Identity() : camera.getViewMatrix(), camera.getProjectionMatrix());
            //       return BABYLON.Ray.CreateNew(x / window.devicePixelRatio, y / window.devicePixelRatio, viewport.width, viewport.height, world ? world : BABYLON.Matrix.Identity(), camera.getViewMatrix(), camera.getProjectionMatrix());
        }

        public createPickingRayInCameraSpace(x: number, y: number, camera?: Camera): Nullable<Ray> {
            if (!BABYLON.PickingInfo) {
                return null;
            }

            var engine = this._engine;

            if (!camera) {
                if (!this.activeCamera)
                    throw new Error("Active camera not set");

                camera = this.activeCamera;
            }

            var cameraViewport = camera.viewport;
            var viewport = cameraViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            var identity = Matrix.Identity();

            // Moving coordinates to local viewport world
            x = x / this._engine.getHardwareScalingLevel() - viewport.x;
            y = y / this._engine.getHardwareScalingLevel() - (this._engine.getRenderHeight() - viewport.y - viewport.height);
            return Ray.CreateNew(x, y, viewport.width, viewport.height, identity, identity, camera.getProjectionMatrix());
        }

        private _internalPick(rayFunction: (world: Matrix) => Ray, predicate?: (mesh: AbstractMesh) => boolean, fastCheck?: boolean): Nullable<PickingInfo> {
            if (!BABYLON.PickingInfo) {
                return null;
            }

            var pickingInfo = null;

            for (var meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
                var mesh = this.meshes[meshIndex];

                if (predicate) {
                    if (!predicate(mesh)) {
                        continue;
                    }
                } else if (!mesh.isEnabled() || !mesh.isVisible || !mesh.isPickable) {
                    continue;
                }

                var world = mesh.getWorldMatrix();
                var ray = rayFunction(world);

                var result = mesh.intersects(ray, fastCheck);
                if (!result || !result.hit)
                    continue;

                if (!fastCheck && pickingInfo != null && result.distance >= pickingInfo.distance)
                    continue;

                pickingInfo = result;

                if (fastCheck) {
                    break;
                }
            }

            return pickingInfo || new PickingInfo();
        }

        private _internalMultiPick(rayFunction: (world: Matrix) => Ray, predicate?: (mesh: AbstractMesh) => boolean): Nullable<PickingInfo[]> {
            if (!BABYLON.PickingInfo) {
                return null;
            }
            var pickingInfos = new Array<PickingInfo>();

            for (var meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
                var mesh = this.meshes[meshIndex];

                if (predicate) {
                    if (!predicate(mesh)) {
                        continue;
                    }
                } else if (!mesh.isEnabled() || !mesh.isVisible || !mesh.isPickable) {
                    continue;
                }

                var world = mesh.getWorldMatrix();
                var ray = rayFunction(world);

                var result = mesh.intersects(ray, false);
                if (!result || !result.hit)
                    continue;

                pickingInfos.push(result);
            }

            return pickingInfos;
        }


        private _internalPickSprites(ray: Ray, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo> {
            if (!BABYLON.PickingInfo) {
                return null;
            }

            var pickingInfo = null;

            if (!camera) {
                if (!this.activeCamera) {
                    return null;
                }
                camera = this.activeCamera;
            }

            if (this.spriteManagers.length > 0) {
                for (var spriteIndex = 0; spriteIndex < this.spriteManagers.length; spriteIndex++) {
                    var spriteManager = this.spriteManagers[spriteIndex];

                    if (!spriteManager.isPickable) {
                        continue;
                    }

                    var result = spriteManager.intersects(ray, camera, predicate, fastCheck);
                    if (!result || !result.hit)
                        continue;

                    if (!fastCheck && pickingInfo != null && result.distance >= pickingInfo.distance)
                        continue;

                    pickingInfo = result;

                    if (fastCheck) {
                        break;
                    }
                }
            }

            return pickingInfo || new PickingInfo();
        }

        /** Launch a ray to try to pick a mesh in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
         * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         */
        public pick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean, fastCheck?: boolean, camera?: Nullable<Camera>): Nullable<PickingInfo> {
            return this._internalPick(world => this.createPickingRay(x, y, world, camera || null), predicate, fastCheck);
        }

        /** Launch a ray to try to pick a sprite in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         */
        public pickSprite(x: number, y: number, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo> {
            let ray = this.createPickingRayInCameraSpace(x, y, camera);

            if (!ray) {
                return null;
            }

            return this._internalPickSprites(ray, predicate, fastCheck, camera);
        }

        /** Use the given ray to pick a mesh in the scene
         * @param ray The ray to use to pick meshes
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
         */
        public pickWithRay(ray: Ray, predicate: (mesh: AbstractMesh) => boolean, fastCheck?: boolean): Nullable<PickingInfo> {
            return this._internalPick(world => {
                if (!this._pickWithRayInverseMatrix) {
                    this._pickWithRayInverseMatrix = Matrix.Identity();
                }
                world.invertToRef(this._pickWithRayInverseMatrix);
                return Ray.Transform(ray, this._pickWithRayInverseMatrix);
            }, predicate, fastCheck);
        }

        /**
         * Launch a ray to try to pick a mesh in the scene
         * @param x X position on screen
         * @param y Y position on screen
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         */
        public multiPick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean, camera?: Camera): Nullable<PickingInfo[]> {
            return this._internalMultiPick(world => this.createPickingRay(x, y, world, camera || null), predicate);
        }

        /**
         * Launch a ray to try to pick a mesh in the scene
         * @param ray Ray to use
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         */
        public multiPickWithRay(ray: Ray, predicate: (mesh: AbstractMesh) => boolean): Nullable<PickingInfo[]> {
            return this._internalMultiPick(world => {
                if (!this._pickWithRayInverseMatrix) {
                    this._pickWithRayInverseMatrix = Matrix.Identity();
                }
                world.invertToRef(this._pickWithRayInverseMatrix);
                return Ray.Transform(ray, this._pickWithRayInverseMatrix);
            }, predicate);
        }

        public setPointerOverMesh(mesh: Nullable<AbstractMesh>): void {
            if (this._pointerOverMesh === mesh) {
                return;
            }

            if (this._pointerOverMesh && this._pointerOverMesh.actionManager) {
                this._pointerOverMesh.actionManager.processTrigger(ActionManager.OnPointerOutTrigger, ActionEvent.CreateNew(this._pointerOverMesh));
            }

            this._pointerOverMesh = mesh;
            if (this._pointerOverMesh && this._pointerOverMesh.actionManager) {
                this._pointerOverMesh.actionManager.processTrigger(ActionManager.OnPointerOverTrigger, ActionEvent.CreateNew(this._pointerOverMesh));
            }
        }

        public getPointerOverMesh(): Nullable<AbstractMesh> {
            return this._pointerOverMesh;
        }

        public setPointerOverSprite(sprite: Nullable<Sprite>): void {
            if (this._pointerOverSprite === sprite) {
                return;
            }

            if (this._pointerOverSprite && this._pointerOverSprite.actionManager) {
                this._pointerOverSprite.actionManager.processTrigger(ActionManager.OnPointerOutTrigger, ActionEvent.CreateNewFromSprite(this._pointerOverSprite, this));
            }

            this._pointerOverSprite = sprite;
            if (this._pointerOverSprite && this._pointerOverSprite.actionManager) {
                this._pointerOverSprite.actionManager.processTrigger(ActionManager.OnPointerOverTrigger, ActionEvent.CreateNewFromSprite(this._pointerOverSprite, this));
            }
        }

        public getPointerOverSprite(): Nullable<Sprite> {
            return this._pointerOverSprite;
        }

        // Physics
        public getPhysicsEngine(): Nullable<PhysicsEngine> {
            return this._physicsEngine;
        }

        /**
         * Enables physics to the current scene
         * @param {BABYLON.Vector3} [gravity] - the scene's gravity for the physics engine
         * @param {BABYLON.IPhysicsEnginePlugin} [plugin] - The physics engine to be used. defaults to OimoJS.
         * @return {boolean} was the physics engine initialized
         */
        public enablePhysics(gravity: Nullable<Vector3> = null, plugin?: IPhysicsEnginePlugin): boolean {
            if (this._physicsEngine) {
                return true;
            }

            try {
                this._physicsEngine = new PhysicsEngine(gravity, plugin);
                return true;
            } catch (e) {
                Tools.Error(e.message);
                return false;
            }

        }

        public disablePhysicsEngine(): void {
            if (!this._physicsEngine) {
                return;
            }

            this._physicsEngine.dispose();
            this._physicsEngine = null;
        }

        public isPhysicsEnabled(): boolean {
            return this._physicsEngine !== undefined;
        }

        public deleteCompoundImpostor(compound: any): void {
            var mesh: AbstractMesh = compound.parts[0].mesh;

            if (mesh.physicsImpostor) {
                mesh.physicsImpostor.dispose(/*true*/);
                mesh.physicsImpostor = null;
            }
        }

        // Misc.
        public _rebuildGeometries(): void {
            for (var geometry of this._geometries) {
                geometry._rebuild();
            }

            for (var mesh of this.meshes) {
                mesh._rebuild();
            }

            if (this.postProcessManager) {
                this.postProcessManager._rebuild();
            }         

            for (var layer of this.layers) {
                layer._rebuild();
            }

            for (var highlightLayer of this.highlightLayers) {
                highlightLayer._rebuild();
            }

            if (this._boundingBoxRenderer) {
                this._boundingBoxRenderer._rebuild();
            }

            for (var system of this.particleSystems) {
                system.rebuild();
            }

            if (this._postProcessRenderPipelineManager) {
                this._postProcessRenderPipelineManager._rebuild();
            }            
        }

        public _rebuildTextures(): void {
            for (var texture of this.textures) {
                texture._rebuild();
            }

            this.markAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }

        public createDefaultCameraOrLight(createArcRotateCamera = false, replace = false, attachCameraControls = false) {
            // Dispose existing camera or light in replace mode.
            if (replace) {
                if (this.activeCamera) {
                    this.activeCamera.dispose();
                    this.activeCamera = null;
                }

                if (this.lights) {
                    for (var i = 0; i < this.lights.length; i++) {
                        this.lights[i].dispose();
                    }
                }
            }

            // Light
            if (this.lights.length === 0) {
                new HemisphericLight("default light", Vector3.Up(), this);
            }

            // Camera
            if (!this.activeCamera) {
                var worldExtends = this.getWorldExtends();
                var worldSize = worldExtends.max.subtract(worldExtends.min);
                var worldCenter = worldExtends.min.add(worldSize.scale(0.5));

                var camera: TargetCamera;
                var radius = worldSize.length() * 1.5;
                if (createArcRotateCamera) {
                    var arcRotateCamera = new ArcRotateCamera("default camera", -(Math.PI / 2), Math.PI / 2, radius, worldCenter, this);
                    arcRotateCamera.lowerRadiusLimit = radius * 0.01;
                    arcRotateCamera.wheelPrecision = 100 / radius;
                    camera = arcRotateCamera;
                }
                else {
                    var freeCamera = new FreeCamera("default camera", new Vector3(worldCenter.x, worldCenter.y, -radius), this);
                    freeCamera.setTarget(worldCenter);
                    camera = freeCamera;
                }
                camera.minZ = radius * 0.01;
                camera.maxZ = radius * 100;
                camera.speed = radius * 0.2;
                this.activeCamera = camera;

                let canvas = this.getEngine().getRenderingCanvas();
                if (attachCameraControls && canvas) {
                    camera.attachControl(canvas);
                }
            }
        }

        public createDefaultSkybox(environmentTexture?: BaseTexture, pbr = false, scale = 1000, blur = 0): Nullable<Mesh> {
            if (environmentTexture) {
                this.environmentTexture = environmentTexture;
            }

            if (!this.environmentTexture) {
                Tools.Warn("Can not create default skybox without environment texture.");
                return null;
            }

            // Skybox
            var hdrSkybox = BABYLON.Mesh.CreateBox("hdrSkyBox", scale, this);
            if (pbr) {
                let hdrSkyboxMaterial = new BABYLON.PBRMaterial("skyBox", this);
                hdrSkyboxMaterial.backFaceCulling = false;
                hdrSkyboxMaterial.reflectionTexture = this.environmentTexture.clone();
                if (hdrSkyboxMaterial.reflectionTexture) {
                    hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
                }
                hdrSkyboxMaterial.microSurface = 1.0 - blur;
                hdrSkyboxMaterial.disableLighting = true;
                hdrSkyboxMaterial.twoSidedLighting = true;
                hdrSkybox.infiniteDistance = true;
                hdrSkybox.material = hdrSkyboxMaterial;
            }
            else {
                let skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this);
                skyboxMaterial.backFaceCulling = false;
                skyboxMaterial.reflectionTexture = this.environmentTexture.clone();
                if (skyboxMaterial.reflectionTexture) {
                    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
                }
                skyboxMaterial.disableLighting = true;
                hdrSkybox.infiniteDistance = true;
                hdrSkybox.material = skyboxMaterial;
            }

            return hdrSkybox;
        }

        public createDefaultVRExperience(webVROptions: WebVROptions = {}) {
            this.VRHelper = new BABYLON.VRExperienceHelper(this, webVROptions);
        }

        // Tags
        private _getByTags(list: any[], tagsQuery: string, forEach?: (item: any) => void): any[] {
            if (tagsQuery === undefined) {
                // returns the complete list (could be done with BABYLON.Tags.MatchesQuery but no need to have a for-loop here)
                return list;
            }

            var listByTags = [];

            forEach = forEach || ((item: any) => { return; });

            for (var i in list) {
                var item = list[i];
                if (Tags.MatchesQuery(item, tagsQuery)) {
                    listByTags.push(item);
                    forEach(item);
                }
            }

            return listByTags;
        }

        public getMeshesByTags(tagsQuery: string, forEach?: (mesh: AbstractMesh) => void): Mesh[] {
            return this._getByTags(this.meshes, tagsQuery, forEach);
        }

        public getCamerasByTags(tagsQuery: string, forEach?: (camera: Camera) => void): Camera[] {
            return this._getByTags(this.cameras, tagsQuery, forEach);
        }

        public getLightsByTags(tagsQuery: string, forEach?: (light: Light) => void): Light[] {
            return this._getByTags(this.lights, tagsQuery, forEach);
        }

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
         * Will flag all materials as dirty to trigger new shader compilation
         * @param predicate If not null, it will be used to specifiy if a material has to be marked as dirty
         */
        public markAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void {
            for (var material of this.materials) {
                if (predicate && !predicate(material)) {
                    continue;
                }
                material.markAsDirty(flag);
            }
        }
    }
}
