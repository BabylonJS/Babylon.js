module BABYLON {
    /**
     * Define an interface for all classes that will hold resources
     */
    export interface IDisposable {
        /** 
         * Releases all held resources
         */
        dispose(): void;
    }

    /**
     * Interface used to let developers provide their own mesh selection mechanism
     */
    export interface IActiveMeshCandidateProvider {
        /**
         * Return the list of active meshes
         * @param scene defines the current scene
         * @returns the list of active meshes
         */
        getMeshes(scene: Scene): AbstractMesh[];
        /** 
         * Indicates if the meshes have been checked to make sure they are isEnabled()
         */
        readonly checksIsEnabled: boolean;
    }

    /** @ignore */
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
     * @see http://doc.babylonjs.com/features/scene
     */
    export class Scene implements IAnimatable {
        // Statics
        private static _FOGMODE_NONE = 0;
        private static _FOGMODE_EXP = 1;
        private static _FOGMODE_EXP2 = 2;
        private static _FOGMODE_LINEAR = 3;

        private static _uniqueIdCounter = 0;

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

        /** @ignore */
        public _environmentBRDFTexture: BaseTexture;

        /** @ignore */
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

        /** @ignore */
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
            this.markAllMaterialsAsDirty(Material.MiscDirtyFlag);
        }
        public get forceWireframe(): boolean {
            return this._forceWireframe;
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
            this.markAllMaterialsAsDirty(Material.MiscDirtyFlag);
        }
        public get forcePointsCloud(): boolean {
            return this._forcePointsCloud;
        }

        /**
         * Gets or sets a boolean indicating if all bounding boxes must be rendered
         */    
        public forceShowBoundingBoxes = false;

        /**
         * Gets or sets the active clipplane
         */
        public clipPlane: Nullable<Plane>;

        /**
         * Gets or sets a boolean indicating if animations are enabled
         */
        public animationsEnabled = true;
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
         * This is used to call preventDefault() on pointer down
         * in order to block unwanted artifacts like system double clicks
         */
        public preventDefaultOnPointerDown = true;

        // Metadata
        /**
         * Gets or sets user defined metadata
         */
        public metadata: any = null;
        /**
         * Gets the name of the plugin used to load this scene (null by default)
         */
        public loadingPluginName: string;

        /**
         * Use this array to add regular expressions used to disable offline support for specific urls
         */
        public disableOfflineSupportExceptionRules = new Array<RegExp>();        

        // Events

        private _spritePredicate: (sprite: Sprite) => boolean;

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
        * An event triggered when physic simulation is about to be run
        */
        public onBeforePhysicsObservable = new Observable<Scene>();

        /**
        * An event triggered when physic simulation has been done
        */
        public onAfterPhysicsObservable = new Observable<Scene>();

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
        * An event triggered when sprites rendering is about to start
        * Note: This event can be trigger more than once per frame (because sprites can be rendered by render target textures as well)
        */
        public onBeforeSpritesRenderingObservable = new Observable<Scene>();

        /**
        * An event triggered when sprites rendering is done
        * Note: This event can be trigger more than once per frame (because sprites can be rendered by render target textures as well)
        */
        public onAfterSpritesRenderingObservable = new Observable<Scene>();

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
         * This Observable will be triggered for each stage of each renderingGroup of each rendered camera.
         * The RenderinGroupInfo class contains all the information about the context in which the observable is called
         * If you wish to register an Observer only for a given set of renderingGroup, use the mask with a combination of the renderingGroup index elevated to the power of two (1 for renderingGroup 0, 2 for renderingrOup1, 4 for 2 and 8 for 3)
         */
        public onRenderingGroupObservable = new Observable<RenderingGroupInfo>();

        // Animations
        /**
         * Gets a list of Animations associated with the scene
         */        
        public animations: Animation[] = [];
        private _registeredForLateAnimationBindings = new SmartArrayNoDuplicate<any>(256);

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
        private _onPointerMove: (evt: PointerEvent) => void;
        private _onPointerDown: (evt: PointerEvent) => void;
        private _onPointerUp: (evt: PointerEvent) => void;

        /** Deprecated. Use onPointerObservable instead */
        public onPointerMove: (evt: PointerEvent, pickInfo: PickingInfo, type: PointerEventTypes) => void;
        /** Deprecated. Use onPointerObservable instead */
        public onPointerDown: (evt: PointerEvent, pickInfo: PickingInfo, type: PointerEventTypes) => void;
        /** Deprecated. Use onPointerObservable instead */
        public onPointerUp: (evt: PointerEvent, pickInfo: Nullable<PickingInfo>, type: PointerEventTypes) => void;
        /** Deprecated. Use onPointerObservable instead */
        public onPointerPick: (evt: PointerEvent, pickInfo: PickingInfo) => void;

        // Gamepads
        private _gamepadManager: Nullable<GamepadManager>;

        /**
         * Gets the gamepad manager associated with the scene
         * @see http://doc.babylonjs.com/how_to/how_to_use_gamepads
         */
        public get gamepadManager(): GamepadManager {
            if (!this._gamepadManager) {
                this._gamepadManager = new GamepadManager(this);
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

        /**
         * Gets the pointer coordinates without any translation (ie. straight out of the pointer event)
         */
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
        /** @ignore */
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
        private _onKeyDown: (evt: KeyboardEvent) => void;
        private _onKeyUp: (evt: KeyboardEvent) => void;
        private _onCanvasFocusObserver: Nullable<Observer<Engine>>;
        private _onCanvasBlurObserver: Nullable<Observer<Engine>>;

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
            this.markAllMaterialsAsDirty(Material.MiscDirtyFlag);
        }
        public get useRightHandedSystem(): boolean {
            return this._useRightHandedSystem;
        }

        /**
         * Sets the step Id used by deterministic lock step
         * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
         * @param newStepId defines the step Id
         */
        public setStepId(newStepId: number): void {
            this._currentStepId = newStepId;
        };

        /**
         * Gets the step Id used by deterministic lock step
         * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
         * @returns the step Id
         */
        public getStepId(): number {
            return this._currentStepId;
        };

        /**
         * Gets the internal step used by deterministic lock step
         * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
         * @returns the internal step
         */        
        public getInternalStep(): number {
            return this._currentInternalStep;
        };

        // Fog

        private _fogEnabled = true;
        /**
        * Gets or sets a boolean indicating if fog is enabled on this scene
        * @see http://doc.babylonjs.com/babylon101/environment#fog
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
        /**
        * Gets or sets the fog mode to use
        * @see http://doc.babylonjs.com/babylon101/environment#fog
        */        
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

        /**
        * Gets or sets the fog color to use
        * @see http://doc.babylonjs.com/babylon101/environment#fog
        */          
        public fogColor = new Color3(0.2, 0.2, 0.3);
        /**
        * Gets or sets the fog density to use
        * @see http://doc.babylonjs.com/babylon101/environment#fog
        */  
        public fogDensity = 0.1;
        /**
        * Gets or sets the fog start distance to use
        * @see http://doc.babylonjs.com/babylon101/environment#fog
        */          
        public fogStart = 0;
        /**
        * Gets or sets the fog end distance to use
        * @see http://doc.babylonjs.com/babylon101/environment#fog
        */          
        public fogEnd = 1000.0;

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
            this.markAllMaterialsAsDirty(Material.LightDirtyFlag);
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
            this.markAllMaterialsAsDirty(Material.LightDirtyFlag);
        }

        public get lightsEnabled(): boolean {
            return this._lightsEnabled;
        }

        /**
        * All of the lights added to this scene
        * @see http://doc.babylonjs.com/babylon101/lights
        */
        public lights = new Array<Light>();

        // Cameras
        /** All of the cameras added to this scene. 
         * @see http://doc.babylonjs.com/babylon101/cameras
         */
        public cameras = new Array<Camera>();
        /** All of the active cameras added to this scene. */
        public activeCameras = new Array<Camera>();
        /** The current active camera */
        public activeCamera: Nullable<Camera>;

        // Meshes
        /**
        * All of the tranform nodes added to this scene
        * @see http://doc.babylonjs.com/how_to/transformnode
        */
        public transformNodes = new Array<TransformNode>();

        /**
        * All of the (abstract) meshes added to this scene
        */
        public meshes = new Array<AbstractMesh>();

        /**
        * All of the animation groups added to this scene
        * @see http://doc.babylonjs.com/how_to/group
        */
        public animationGroups = new Array<AnimationGroup>();

        // Geometries
        private _geometries = new Array<Geometry>();

        /**
        * All of the materials added to this scene
        * @see http://doc.babylonjs.com/babylon101/materials
        */        
        public materials = new Array<Material>();
        /**
        * All of the multi-materials added to this scene
        * @see http://doc.babylonjs.com/how_to/multi_materials
        */        
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
        /**
        * Gets or sets a boolean indicating if textures are enabled on this scene
        */        
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

        /**
        * All of the textures added to this scene
        */       
        public textures = new Array<BaseTexture>();

        // Particles
        /**
        * Gets or sets a boolean indicating if particles are enabled on this scene
        */           
        public particlesEnabled = true;

        /**
        * All of the particle systems added to this scene
        * @see http://doc.babylonjs.com/babylon101/particles
        */            
        public particleSystems = new Array<IParticleSystem>();

        // Sprites
        /**
        * Gets or sets a boolean indicating if sprites are enabled on this scene
        */           
        public spritesEnabled = true;
        /**
        * All of the sprite managers added to this scene
        * @see http://doc.babylonjs.com/babylon101/sprites
        */          
        public spriteManagers = new Array<SpriteManager>();

        /**
         * The list of layers (background and foreground) of the scene
         */
        public layers = new Array<Layer>();

        /**
         * The list of effect layers (highlights/glow) added to the scene
         * @see http://doc.babylonjs.com/how_to/highlight_layer
         * @see http://doc.babylonjs.com/how_to/glow_layer
         */
        public effectLayers = new Array<EffectLayer>();

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
            this.markAllMaterialsAsDirty(Material.AttributesDirtyFlag);
        }

        public get skeletonsEnabled(): boolean {
            return this._skeletonsEnabled;
        }

        /**
         * The list of skeletons added to the scene
         * @see http://doc.babylonjs.com/how_to/how_to_use_bones_and_skeletons
         */        
        public skeletons = new Array<Skeleton>();

        // Morph targets
        /**
         * The list of morph target managers added to the scene
         * @see http://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh
         */            
        public morphTargetManagers = new Array<MorphTargetManager>();

        // Lens flares
        /**
        * Gets or sets a boolean indicating if lens flares are enabled on this scene
        */          
        public lensFlaresEnabled = true;
        /**
         * The list of lens flare system added to the scene
         * @see http://doc.babylonjs.com/how_to/how_to_use_lens_flares
         */         
        public lensFlareSystems = new Array<LensFlareSystem>();

        // Collisions
        /**
        * Gets or sets a boolean indicating if collisions are enabled on this scene
        * @see http://doc.babylonjs.com/babylon101/cameras,_mesh_collisions_and_gravity
        */           
        public collisionsEnabled = true;
        private _workerCollisions: boolean;
        /** @ignore */
        public collisionCoordinator: ICollisionCoordinator;
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
        private _postProcessRenderPipelineManager: PostProcessRenderPipelineManager
        /**
         * Gets the postprocess render pipeline manager
         * @see http://doc.babylonjs.com/how_to/how_to_use_postprocessrenderpipeline
         * @see http://doc.babylonjs.com/how_to/using_default_rendering_pipeline
         */
        public get postProcessRenderPipelineManager(): PostProcessRenderPipelineManager {
            if (!this._postProcessRenderPipelineManager) {
                this._postProcessRenderPipelineManager = new PostProcessRenderPipelineManager();
            }

            return this._postProcessRenderPipelineManager;
        }

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
        /**
         * The list of reflection probes added to the scene
         * @see http://doc.babylonjs.com/how_to/how_to_use_reflection_probes
         */           
        public reflectionProbes = new Array<ReflectionProbe>();

        // Database
        /**
         * @ignore
         */
        public database: Database;

        /**
         * Gets or sets the action manager associated with the scene
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions
        */
        public actionManager: ActionManager;

        /** @ignore */
        public _actionManagers = new Array<ActionManager>();
        private _meshesForIntersections = new SmartArrayNoDuplicate<AbstractMesh>(256);

        // Procedural textures
        /**
        * Gets or sets a boolean indicating if procedural textures are enabled on this scene
        */         
        public proceduralTexturesEnabled = true;
        /**
         * The list of procedural textures added to the scene
         * @see http://doc.babylonjs.com/how_to/how_to_use_procedural_textures
         */             
        public proceduralTextures = new Array<ProceduralTexture>();

        // Sound Tracks
        private _mainSoundTrack: SoundTrack;
        /**
         * The list of sound tracks added to the scene
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
         */     
        public soundTracks = new Array<SoundTrack>();
        private _audioEnabled = true;
        private _headphone = false;

        /**
         * Gets the main soundtrack associated with the scene
         */
        public get mainSoundTrack(): SoundTrack {
            if (!this._mainSoundTrack) {
                this._mainSoundTrack = new SoundTrack(this, { mainTrack: true });
            }

            return this._mainSoundTrack;
        }

        /**
         * Gets or sets the VRExperienceHelper attached to the scene
         * @see http://doc.babylonjs.com/how_to/webvr_helper
         * @ignoreNaming
         */
        public VRHelper: VRExperienceHelper;

        /**
         * Gets or sets the simplification queue attached to the scene
         * @see http://doc.babylonjs.com/how_to/in-browser_mesh_simplification
         */
        public simplificationQueue: SimplificationQueue;

        // Private
        private _engine: Engine;

        // Performance counters
        private _totalVertices = new PerfCounter();
        /** @ignore */
        public _activeIndices = new PerfCounter();
        /** @ignore */
        public _activeParticles = new PerfCounter();
        /** @ignore */
        public _activeBones = new PerfCounter();

        private _animationRatio: number;

        private _animationTimeLast: number;
        private _animationTime: number = 0;
        /**
         * Gets or sets a general scale for animation speed
         * @see https://www.babylonjs-playground.com/#IBU2W7#3
         */
        public animationTimeScale: number = 1;

        /** @ignore */
        public _cachedMaterial: Nullable<Material>;
        /** @ignore */
        public _cachedEffect: Nullable<Effect>;
        /** @ignore */
        public _cachedVisibility: Nullable<number>;

        private _renderId = 0;
        private _executeWhenReadyTimeoutId = -1;
        private _intermediateRendering = false;

        private _viewUpdateFlag = -1;
        private _projectionUpdateFlag = -1;
        private _alternateViewUpdateFlag = -1;
        private _alternateProjectionUpdateFlag = -1;

        /** @ignore */
        public _toBeDisposed = new SmartArray<Nullable<IDisposable>>(256);
        private _activeRequests = new Array<IFileRequest>();
        private _pendingData = new Array();
        private _isDisposed = false;

        /**
         * Gets or sets a boolean indicating that all submeshes of active meshes must be rendered
         * Use this boolean to avoid computing frustum clipping on submeshes (This could help when you are CPU bound)
         */
        public dispatchAllSubMeshesOfActiveMeshes: boolean = false;
        private _activeMeshes = new SmartArray<AbstractMesh>(256);
        private _processedMaterials = new SmartArray<Material>(256);
        private _renderTargets = new SmartArrayNoDuplicate<RenderTargetTexture>(256);
        /** @ignore */
        public _activeParticleSystems = new SmartArray<IParticleSystem>(256);
        private _activeSkeletons = new SmartArrayNoDuplicate<Skeleton>(32);
        private _softwareSkinnedMeshes = new SmartArrayNoDuplicate<Mesh>(32);

        private _renderingManager: RenderingManager;
        private _physicsEngine: Nullable<PhysicsEngine>;

        /** @ignore */
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
        /** @ignore */
        public _forcedViewPosition: Nullable<Vector3>;

        /** @ignore */
        public get _isAlternateRenderingEnabled(): boolean {
            return this._alternateRendering;
        }

        private _frustumPlanes: Plane[];
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

        private _selectionOctree: Octree<AbstractMesh>;

        private _pointerOverMesh: Nullable<AbstractMesh>;
        private _pointerOverSprite: Nullable<Sprite>;

        private _debugLayer: DebugLayer;

        private _depthRenderer: { [id: string]: DepthRenderer } = {};
        private _geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

        /**
         * Gets the current geometry buffer associated to the scene.
         */
        public get geometryBufferRenderer(): Nullable<GeometryBufferRenderer> {
            return this._geometryBufferRenderer;
        }
        /**
         * Sets the current geometry buffer for the scene.
         */
        public set geometryBufferRenderer(geometryBufferRenderer: Nullable<GeometryBufferRenderer>) {
            if (geometryBufferRenderer && geometryBufferRenderer.isSupported) {
                this._geometryBufferRenderer = geometryBufferRenderer;
            }
        }

        private _pickedDownMesh: Nullable<AbstractMesh>;
        private _pickedUpMesh: Nullable<AbstractMesh>;
        private _pickedDownSprite: Nullable<Sprite>;
        private _externalData: StringDictionary<Object>;
        private _uid: Nullable<string>;

        /**
         * Creates a new Scene
         * @param engine defines the engine to use to render this scene
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

        /**
         * Gets the debug layer associated with the scene
         * @see http://doc.babylonjs.com/features/playground_debuglayer
         */
        public get debugLayer(): DebugLayer {
            if (!this._debugLayer) {
                this._debugLayer = new DebugLayer(this);
            }
            return this._debugLayer;
        }

        public set workerCollisions(enabled: boolean) {
            if (!CollisionCoordinatorLegacy) {
                return;
            }

            enabled = (enabled && !!Worker && !!CollisionWorker);

            this._workerCollisions = enabled;
            if (this.collisionCoordinator) {
                this.collisionCoordinator.destroy();
            }

            this.collisionCoordinator = enabled ? new CollisionCoordinatorWorker() : new CollisionCoordinatorLegacy();

            this.collisionCoordinator.init(this);
        }

        /**
         * Gets a boolean indicating if collisions are processed on a web worker
         * @see http://doc.babylonjs.com/babylon101/cameras,_mesh_collisions_and_gravity#web-worker-based-collision-system-since-21
         */
        public get workerCollisions(): boolean {
            return this._workerCollisions;
        }

        /**
         * Gets the octree used to boost mesh selection (picking)
         * @see http://doc.babylonjs.com/how_to/optimizing_your_scene_with_octrees
         */
        public get selectionOctree(): Octree<AbstractMesh> {
            return this._selectionOctree;
        }

        /**
         * Gets the mesh that is currently under the pointer
         */
        public get meshUnderPointer(): Nullable<AbstractMesh> {
            return this._pointerOverMesh;
        }

        /**
         * Gets the current on-screen X position of the pointer
         */
        public get pointerX(): number {
            return this._pointerX;
        }

        /**
         * Gets the current on-screen Y position of the pointer
         */
        public get pointerY(): number {
            return this._pointerY;
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
         * Gets the bounding box renderer associated with the scene
         * @returns a BoundingBoxRenderer
         */
        public getBoundingBoxRenderer(): BoundingBoxRenderer {
            if (!this._boundingBoxRenderer) {
                this._boundingBoxRenderer = new BoundingBoxRenderer(this);
            }

            return this._boundingBoxRenderer;
        }

        /** 
         * Gets the outline renderer associated with the scene
         * @returns a OutlineRenderer
         */        
        public getOutlineRenderer(): OutlineRenderer {
            return this._outlineRenderer;
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

        /** @ignore */
        public getInterFramePerfCounter(): number {
            Tools.Warn("getInterFramePerfCounter is deprecated. Please use SceneInstrumentation class");
            return 0;
        }

        /** @ignore */
        public get interFramePerfCounter(): Nullable<PerfCounter> {
            Tools.Warn("interFramePerfCounter is deprecated. Please use SceneInstrumentation class");
            return null;
        }

        /** @ignore */
        public getLastFrameDuration(): number {
            Tools.Warn("getLastFrameDuration is deprecated. Please use SceneInstrumentation class");
            return 0;
        }

        /** @ignore */
        public get lastFramePerfCounter(): Nullable<PerfCounter> {
            Tools.Warn("lastFramePerfCounter is deprecated. Please use SceneInstrumentation class");
            return null;
        }

        /** @ignore */
        public getEvaluateActiveMeshesDuration(): number {
            Tools.Warn("getEvaluateActiveMeshesDuration is deprecated. Please use SceneInstrumentation class");
            return 0;
        }

        /** @ignore */
        public get evaluateActiveMeshesDurationPerfCounter(): Nullable<PerfCounter> {
            Tools.Warn("evaluateActiveMeshesDurationPerfCounter is deprecated. Please use SceneInstrumentation class");
            return null;
        }

        /** 
         * Gets the array of active meshes
         * @returns an array of AbstractMesh 
         */
        public getActiveMeshes(): SmartArray<AbstractMesh> {
            return this._activeMeshes;
        }

        /** @ignore */
        public getRenderTargetsDuration(): number {
            Tools.Warn("getRenderTargetsDuration is deprecated. Please use SceneInstrumentation class");
            return 0;
        }

        /** @ignore */
        public getRenderDuration(): number {
            Tools.Warn("getRenderDuration is deprecated. Please use SceneInstrumentation class");
            return 0;
        }

        /** @ignore */
        public get renderDurationPerfCounter(): Nullable<PerfCounter> {
            Tools.Warn("renderDurationPerfCounter is deprecated. Please use SceneInstrumentation class");
            return null;
        }

        /** @ignore */
        public getParticlesDuration(): number {
            Tools.Warn("getParticlesDuration is deprecated. Please use SceneInstrumentation class");
            return 0;
        }

        /** @ignore */
        public get particlesDurationPerfCounter(): Nullable<PerfCounter> {
            Tools.Warn("particlesDurationPerfCounter is deprecated. Please use SceneInstrumentation class");
            return null;
        }

        /** @ignore */
        public getSpritesDuration(): number {
            Tools.Warn("getSpritesDuration is deprecated. Please use SceneInstrumentation class");
            return 0;
        }

        /** @ignore */
        public get spriteDuractionPerfCounter(): Nullable<PerfCounter> {
            Tools.Warn("spriteDuractionPerfCounter is deprecated. Please use SceneInstrumentation class");
            return null;
        }

        /** 
         * Gets the animation ratio (which is 1.0 is the scene renders at 60fps and 2 if the scene renders at 30fps, etc.)
         * @returns a number
         */
        public getAnimationRatio(): number {
            return this._animationRatio;
        }

        /** 
         * Gets an unique Id for the current frame
         * @returns a number
         */
        public getRenderId(): number {
            return this._renderId;
        }

        /** Call this function if you want to manually increment the render Id*/
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
         * @param pickResult pickingInfo of the object wished to simulate pointer event on
         * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
         * @returns the current scene
         */
        public simulatePointerMove(pickResult: PickingInfo, pointerEventInit?: PointerEventInit): Scene {
            let evt = new PointerEvent("pointermove", pointerEventInit);
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
                let type = evt.type === "mousewheel" || evt.type === "DOMMouseScroll" ? PointerEventTypes.POINTERWHEEL : PointerEventTypes.POINTERMOVE;

                if (this.onPointerMove) {
                    this.onPointerMove(evt, pickResult, type);
                }

                if (this.onPointerObservable.hasObservers()) {
                    let pi = new PointerInfo(type, evt, pickResult);
                    this.onPointerObservable.notifyObservers(pi, type);
                }
            }

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
            let evt = new PointerEvent("pointerdown", pointerEventInit);

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
                let type = PointerEventTypes.POINTERDOWN;

                if (this.onPointerDown) {
                    this.onPointerDown(evt, pickResult, type);
                }

                if (this.onPointerObservable.hasObservers()) {
                    let pi = new PointerInfo(type, evt, pickResult);
                    this.onPointerObservable.notifyObservers(pi, type);
                }
            }

            return this;
        }

        /**
         * Use this method to simulate a pointer up on a mesh
         * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
         * @param pickResult pickingInfo of the object wished to simulate pointer event on
         * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
         * @returns the current scene
         */
        public simulatePointerUp(pickResult: PickingInfo, pointerEventInit?: PointerEventInit): Scene {
            let evt = new PointerEvent("pointerup", pointerEventInit);
            let clickInfo = new ClickInfo();
            clickInfo.singleClick = true;
            clickInfo.ignore = true;

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

            let type = PointerEventTypes.POINTERUP;
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
                    let pi = new PointerInfo(type, evt, pickResult);
                    this.onPointerObservable.notifyObservers(pi, type);
                }
            }

            if (this.onPointerUp) {
                this.onPointerUp(evt, pickResult, type);
            }

            return this;
        }

        /**
        * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
        * @param attachUp defines if you want to attach events to pointerup
        * @param attachDown defines if you want to attach events to pointerdown
        * @param attachMove defines if you want to attach events to pointermove
        */
        public attachControl(attachUp = true, attachDown = true, attachMove = true): void {
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
                if (!checkPicking && ActionManager && ActionManager.HasPickTriggers) {
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
                    if (!this._meshPickProceed && (ActionManager && ActionManager.HasTriggers || this.onPointerObservable.hasObservers())) {
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
            this._onCanvasFocusObserver = engine.onCanvasFocusObservable.add(() => {
                if (!canvas) {
                    return;
                }
                canvas.addEventListener("keydown", this._onKeyDown, false);
                canvas.addEventListener("keyup", this._onKeyUp, false);
            });

            this._onCanvasBlurObserver = engine.onCanvasBlurObservable.add(() => {
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
                canvas.addEventListener(eventPrefix + "move", <any>this._onPointerMove, false);
                // Wheel
                canvas.addEventListener('mousewheel', <any>this._onPointerMove, false);
                canvas.addEventListener('DOMMouseScroll', <any>this._onPointerMove, false);
            }

            if (attachDown) {
                canvas.addEventListener(eventPrefix + "down", <any>this._onPointerDown, false);
            }

            if (attachUp) {
                window.addEventListener(eventPrefix + "up", <any>this._onPointerUp, false);
            }

            canvas.tabIndex = 1;
        }

        /** Detaches all event handlers*/
        public detachControl() {
            let engine = this.getEngine();
            var eventPrefix = Tools.GetPointerPrefix();
            var canvas = engine.getRenderingCanvas();

            if (!canvas) {
                return;
            }

            canvas.removeEventListener(eventPrefix + "move", <any>this._onPointerMove);
            canvas.removeEventListener(eventPrefix + "down", <any>this._onPointerDown);
            window.removeEventListener(eventPrefix + "up", <any>this._onPointerUp);

            if (this._onCanvasBlurObserver) {
                engine.onCanvasBlurObservable.remove(this._onCanvasBlurObserver);
            }

            if (this._onCanvasFocusObserver) {
                engine.onCanvasFocusObservable.remove(this._onCanvasFocusObserver);
            }

            // Wheel
            canvas.removeEventListener('mousewheel', <any>this._onPointerMove);
            canvas.removeEventListener('DOMMouseScroll', <any>this._onPointerMove);

            // Keyboard
            canvas.removeEventListener("keydown", this._onKeyDown);
            canvas.removeEventListener("keyup", this._onKeyUp);

            // Observables
            this.onKeyboardObservable.clear();
            this.onPreKeyboardObservable.clear();
            this.onPointerObservable.clear();
            this.onPrePointerObservable.clear();
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

            if (this._pendingData.length > 0) {
                return false;
            }
            let index: number;
            let engine = this.getEngine();

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

                if (!mesh.isReady(true)) {
                    return false;
                }

                // Effect layers
                let hardwareInstancedRendering = mesh.getClassName() === "InstancedMesh" || engine.getCaps().instancedArrays && (<Mesh>mesh).instances.length > 0;
                for (var layer of this.effectLayers) {
                    if (!layer.hasMesh(mesh)) {
                        continue;
                    }

                    for (var subMesh of mesh.subMeshes) {
                        if (!layer.isReady(subMesh, hardwareInstancedRendering)) {
                            return false;
                        }
                    }
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
            }
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

        /** @ignore */            
        public _addPendingData(data: any): void {
            this._pendingData.push(data);
        }

        /** @ignore */
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
            return new Promise(resolve => {
                this.executeWhenReady(() => {
                    resolve();
                });
            });
        }

        /** @ignore */
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
         * @param target defines the target
         * @param from defines from which frame should animation start
         * @param to defines until which frame should animation run.
         * @param weight defines the weight to apply to the animation (1.0 by default)
         * @param loop defines if the animation loops
         * @param speedRatio defines the speed in which to run the animation (1.0 by default)
         * @param onAnimationEnd defines the function to be executed when the animation ends
         * @param animatable defines an animatable object. If not provided a new one will be created from the given params
         * @returns the animatable object created for this animation
         */
        public beginWeightedAnimation(target: any, from: number, to: number, weight = 1.0, loop?: boolean, speedRatio: number = 1.0, onAnimationEnd?: () => void, animatable?: Animatable): Animatable {
            let returnedAnimatable = this.beginAnimation(target, from, to, loop, speedRatio, onAnimationEnd, animatable, false);
            returnedAnimatable.weight = weight;

            return returnedAnimatable;
        }

        /**
         * Will start the animation sequence of a given target
         * @param target defines the target
         * @param from defines from which frame should animation start
         * @param to defines until which frame should animation run.
         * @param loop defines if the animation loops
         * @param speedRatio defines the speed in which to run the animation (1.0 by default)
         * @param onAnimationEnd defines the function to be executed when the animation ends
         * @param animatable defines an animatable object. If not provided a new one will be created from the given params
         * @param stopCurrent defines if the current animations must be stopped first (true by default)
         * @returns the animatable object created for this animation
         */
        public beginAnimation(target: any, from: number, to: number, loop?: boolean, speedRatio: number = 1.0, onAnimationEnd?: () => void, animatable?: Animatable, stopCurrent = true): Animatable {

            if (from > to && speedRatio > 0) {
                speedRatio *= -1;
            }

            if (stopCurrent) {
                this.stopAnimation(target);
            }

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
                    this.beginAnimation(animatables[index], from, to, loop, speedRatio, onAnimationEnd, animatable, stopCurrent);
                }
            }

            animatable.reset();

            return animatable;
        }

        /**
         * Begin a new animation on a given node
         * @param target defines the target where the animation will take place
         * @param animations defines the list of animations to start
         * @param from defines the initial value
         * @param to defines the final value
         * @param loop defines if you want animation to loop (off by default)
         * @param speedRatio defines the speed ratio to apply to all animations
         * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @returns the list of created animatables
         */
        public beginDirectAnimation(target: any, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Animatable {
            if (speedRatio === undefined) {
                speedRatio = 1.0;
            }

            var animatable = new Animatable(this, target, from, to, loop, speedRatio, onAnimationEnd, animations);

            return animatable;
        }

        /**
         * Begin a new animation on a given node and its hierarchy
         * @param target defines the root node where the animation will take place
         * @param directDescendantsOnly if true only direct descendants will be used, if false direct and also indirect (children of children, an so on in a recursive manner) descendants will be used.
         * @param animations defines the list of animations to start
         * @param from defines the initial value
         * @param to defines the final value
         * @param loop defines if you want animation to loop (off by default)
         * @param speedRatio defines the speed ratio to apply to all animations
         * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @returns the list of animatables created for all nodes
         */
        public beginDirectHierarchyAnimation(target: Node, directDescendantsOnly: boolean, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Animatable[] {
            let children = target.getDescendants(directDescendantsOnly);
            let result = [];
            for (var child of children) {
                result.push(this.beginDirectAnimation(child, animations, from, to, loop, speedRatio, onAnimationEnd));
            }

            return result;
        }

        /**
         * Gets the animatable associated with a specific target
         * @param target defines the target of the animatable
         * @returns the required animatable if found
         */
        public getAnimatableByTarget(target: any): Nullable<Animatable> {
            for (var index = 0; index < this._activeAnimatables.length; index++) {
                if (this._activeAnimatables[index].target === target) {
                    return this._activeAnimatables[index];
                }
            }

            return null;
        }

        /**
         * Gets all animatables associated with a given target
         * @param target defines the target to look animatables for
         * @returns an array of Animatables
         */
        public getAllAnimatablesByTarget(target: any): Array<Animatable> {
            let result = [];
            for (var index = 0; index < this._activeAnimatables.length; index++) {
                if (this._activeAnimatables[index].target === target) {
                    result.push(this._activeAnimatables[index]);
                }
            }

            return result;
        }        

        /**
         * Gets all animatable attached to the scene
         */
        public get animatables(): Animatable[] {
            return this._activeAnimatables;
        }

        /**
         * Will stop the animation of the given target
         * @param target - the target
         * @param animationName - the name of the animation to stop (all animations will be stopped if empty)
         */
        public stopAnimation(target: any, animationName?: string): void {
            var animatables = this.getAllAnimatablesByTarget(target);

            for (var animatable of animatables) {
                animatable.stop(animationName);
            }
        }

        /**
         * Stops and removes all animations that have been applied to the scene
         */
        public stopAllAnimations(): void {
            if (this._activeAnimatables) {
                for (let i = 0; i < this._activeAnimatables.length; i++) {
                    this._activeAnimatables[i].stop();
                }
                this._activeAnimatables = [];
            }

            for (var group of this.animationGroups) {
                group.stop();
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
            var deltaTime = this.useConstantAnimationDeltaTime ? 16.0 : (now - this._animationTimeLast) * this.animationTimeScale;
            this._animationTime += deltaTime;
            this._animationTimeLast = now;
            for (var index = 0; index < this._activeAnimatables.length; index++) {
                this._activeAnimatables[index]._animate(this._animationTime);
            }

            // Late animation bindings
            this._processLateAnimationBindings();
        }

        /** @ignore */
        public _registerTargetForLateAnimationBinding(runtimeAnimation: RuntimeAnimation): void {
            let target = runtimeAnimation.target;
            this._registeredForLateAnimationBindings.pushNoDuplicate(target);

            if (!target._lateAnimationHolders) {
                target._lateAnimationHolders = {};               
            }

            if (!target._lateAnimationHolders[runtimeAnimation.targetPath]) {
                target._lateAnimationHolders[runtimeAnimation.targetPath] = {
                    totalWeight: 0,
                    animations: []
                }
            }

            target._lateAnimationHolders[runtimeAnimation.targetPath].animations.push(runtimeAnimation);
            target._lateAnimationHolders[runtimeAnimation.targetPath].totalWeight += runtimeAnimation.weight;
        }

        private _processLateAnimationBindingsForMatrices(holder: {
            totalWeight: number,
            animations: RuntimeAnimation[]
        }, originalValue: Matrix): any {
            let normalizer = 1.0;
            let finalPosition = Tmp.Vector3[0];
            let finalScaling = Tmp.Vector3[1];
            let finalQuaternion = Tmp.Quaternion[0];
            let startIndex = 0;            
            let originalAnimation = holder.animations[0];

            var scale = 1;
            if (holder.totalWeight < 1.0) {
                // We need to mix the original value in                     
                originalValue.decompose(finalScaling, finalQuaternion, finalPosition);
                scale = 1.0 - holder.totalWeight;
            } else {
                startIndex = 1;            
                // We need to normalize the weights
                normalizer = holder.totalWeight;
                originalAnimation.currentValue.decompose(finalScaling, finalQuaternion, finalPosition);
                scale = originalAnimation.weight / normalizer;
                if (scale == 1) {
                    return originalAnimation.currentValue;
                }
            }

            finalScaling.scaleInPlace(scale);
            finalPosition.scaleInPlace(scale);
            finalQuaternion.scaleInPlace(scale);

            for (var animIndex = startIndex; animIndex < holder.animations.length; animIndex++) {
                var runtimeAnimation = holder.animations[animIndex];   
                var scale = runtimeAnimation.weight / normalizer;
                let currentPosition = Tmp.Vector3[2];
                let currentScaling = Tmp.Vector3[3];
                let currentQuaternion = Tmp.Quaternion[1];

                runtimeAnimation.currentValue.decompose(currentScaling, currentQuaternion, currentPosition);
                currentScaling.scaleAndAddToRef(scale, finalScaling);
                currentQuaternion.scaleAndAddToRef(scale, finalQuaternion);
                currentPosition.scaleAndAddToRef(scale, finalPosition);
            }  
            
            Matrix.ComposeToRef(finalScaling, finalQuaternion, finalPosition, originalAnimation._workValue);
            return originalAnimation._workValue;
        }

        private _processLateAnimationBindings(): void {
            if (!this._registeredForLateAnimationBindings.length) {
                return;
            }
            for (var index = 0; index < this._registeredForLateAnimationBindings.length; index++) {
                var target = this._registeredForLateAnimationBindings.data[index];

                for (var path in target._lateAnimationHolders) {
                    var holder = target._lateAnimationHolders[path];                     
                    let originalAnimation = holder.animations[0];
                    let originalValue = originalAnimation.originalValue;
                    let finalTarget = originalAnimation.target;   
                    
                    let matrixDecomposeMode = Animation.AllowMatrixDecomposeForInterpolation && originalValue.m; // ie. data is matrix

                    let finalValue: any;
                    if (matrixDecomposeMode) {
                        finalValue = this._processLateAnimationBindingsForMatrices(holder, originalValue);
                    } else {
                        let startIndex = 0;
                        let normalizer = 1.0;

                        if (holder.totalWeight < 1.0) {
                            // We need to mix the original value in     
                            if (originalValue.scale) {
                                finalValue = originalValue.scale(1.0 - holder.totalWeight);
                            } else {
                                finalValue = originalValue * (1.0 - holder.totalWeight);
                            }
                        } else {
                            // We need to normalize the weights
                            normalizer = holder.totalWeight;
                            let scale = originalAnimation.weight / normalizer;
                            if (scale !== 1) {
                                if (originalAnimation.currentValue.scale) {
                                    finalValue = originalAnimation.currentValue.scale(scale);
                                } else {
                                    finalValue = originalAnimation.currentValue * scale;
                                }
                            } else {
                                finalValue = originalAnimation.currentValue;
                            }

                            startIndex = 1;
                        }

                        for (var animIndex = startIndex; animIndex < holder.animations.length; animIndex++) {
                            var runtimeAnimation = holder.animations[animIndex];   
                            var scale = runtimeAnimation.weight / normalizer;
                            if (runtimeAnimation.currentValue.scaleAndAddToRef) {
                                runtimeAnimation.currentValue.scaleAndAddToRef(scale, finalValue);
                            } else {
                                finalValue += runtimeAnimation.currentValue * scale;
                            }

                            startIndex = 1;
                        }

                        for (var animIndex = startIndex; animIndex < holder.animations.length; animIndex++) {
                            var runtimeAnimation = holder.animations[animIndex];   
                            var scale = runtimeAnimation.weight / normalizer;
                            runtimeAnimation.currentValue.scaleAndAddToRef(scale, finalValue);
                        }
                    }

                    finalTarget[path] = finalValue;
                }

                target._lateAnimationHolders = {};
            }
            this._registeredForLateAnimationBindings.reset();
        }

        // Matrix
        /** @ignore */
        public _switchToAlternateCameraConfiguration(active: boolean): void {
            this._useAlternateCameraConfiguration = active;
        }

        /** 
         * Gets the current view matrix
         * @returns a Matrix
         */
        public getViewMatrix(): Matrix {
            return this._useAlternateCameraConfiguration ? this._alternateViewMatrix : this._viewMatrix;
        }

        /** 
         * Gets the current projection matrix
         * @returns a Matrix
         */
        public getProjectionMatrix(): Matrix {
            return this._useAlternateCameraConfiguration ? this._alternateProjectionMatrix : this._projectionMatrix;
        }

        /** 
         * Gets the current transform matrix
         * @returns a Matrix made of View * Projection
         */
        public getTransformMatrix(): Matrix {
            return this._useAlternateCameraConfiguration ? this._alternateTransformMatrix : this._transformMatrix;
        }

        /** 
         * Sets the current transform matrix
         * @param view defines the View matrix to use
         * @param projection defines the Projection matrix to use
         */
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

        /** @ignore */
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

        /**
         * Gets the uniform buffer used to store scene data
         * @returns a UniformBuffer
         */
        public getSceneUniformBuffer(): UniformBuffer {
            return this._useAlternateCameraConfiguration ? this._alternateSceneUbo : this._sceneUbo;
        }

        /** 
         * Gets an unique (relatively to the current scene) Id
         * @returns an unique number for the scene
         */
        public getUniqueId() {
            var result = Scene._uniqueIdCounter;
            Scene._uniqueIdCounter++;
            return result;
        }

        /**
         * Add a mesh to the list of scene's meshes
         * @param newMesh defines the mesh to add
         */
        public addMesh(newMesh: AbstractMesh) {
            this.meshes.push(newMesh);

            //notify the collision coordinator
            if (this.collisionCoordinator) {
                this.collisionCoordinator.onMeshAdded(newMesh);
            }
            newMesh._resyncLightSources();

            this.onNewMeshAddedObservable.notifyObservers(newMesh);
        }

        /**
         * Remove a mesh for the list of scene's meshes
         * @param toRemove defines the mesh to remove
         * @returns the index where the mesh was in the mesh list
         */
        public removeMesh(toRemove: AbstractMesh): number {
            var index = this.meshes.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found
                this.meshes.splice(index, 1);
            }

            this.onMeshRemovedObservable.notifyObservers(toRemove);

            return index;
        }

        /**
         * Add a transform node to the list of scene's transform nodes
         * @param newTransformNode defines the transform node to add
         */
        public addTransformNode(newTransformNode: TransformNode) {
            this.transformNodes.push(newTransformNode);

            this.onNewTransformNodeAddedObservable.notifyObservers(newTransformNode);
        }

        /**
         * Remove a transform node for the list of scene's transform nodes
         * @param toRemove defines the transform node to remove
         * @returns the index where the transform node was in the transform node list
         */
        public removeTransformNode(toRemove: TransformNode): number {
            var index = this.transformNodes.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if found
                this.transformNodes.splice(index, 1);
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
                    mesh._removeLightSource(toRemove);
                }

                // Remove from the scene if mesh found
                this.lights.splice(index, 1);
                this.sortLightsByPriority();
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
            var index = this.materials.indexOf(toRemove);
            if (index !== -1) {
                this.materials.splice(index, 1);
            }
            return index;
        }

        /**
         * Removes the given lens flare system from this scene.
         * @param toRemove The lens flare system to remove
         * @returns The index of the removed lens flare system
         */          
        public removeLensFlareSystem(toRemove: LensFlareSystem): number {
            var index = this.lensFlareSystems.indexOf(toRemove);
            if (index !== -1) {
                this.lensFlareSystems.splice(index, 1);
            }
            return index;
        }

        /**
         * Removes the given action manager from this scene.
         * @param toRemove The action manager to remove
         * @returns The index of the removed action manager
         */           
        public removeActionManager(toRemove: ActionManager): number {
            var index = this._actionManagers.indexOf(toRemove);
            if (index !== -1) {
                this._actionManagers.splice(index, 1);
            }
            return index;
        }

        
        /**
         * Removes the given effect layer from this scene.
         * @param toRemove defines the effect layer to remove
         * @returns the index of the removed effect layer
         */    
        public removeEffectLayer(toRemove: EffectLayer): number {
            var index = this.effectLayers.indexOf(toRemove);
            if (index !== -1) {
                this.effectLayers.splice(index, 1);
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
            return index;
        }

        /**
         * Adds the given light to this scene
         * @param newLight The light to add
         */        
        public addLight(newLight: Light): void {
            this.lights.push(newLight);
            this.sortLightsByPriority();

            // Add light to all meshes (To support if the light is removed and then readded)
            for (var mesh of this.meshes) {
                if (mesh._lightSources.indexOf(newLight) === -1) {
                    mesh._lightSources.push(newLight);
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
            this.cameras.push(newCamera);
            this.onNewCameraAddedObservable.notifyObservers(newCamera);
        }

        /**
         * Adds the given skeleton to this scene
         * @param newSkeleton The skeleton to add
         */          
        public addSkeleton(newSkeleton: Skeleton): void {
            this.skeletons.push(newSkeleton);
        }

        /**
         * Adds the given particle system to this scene
         * @param newParticleSystem The particle system to add
         */                 
        public addParticleSystem(newParticleSystem: IParticleSystem): void {
            this.particleSystems.push(newParticleSystem);
        }

        /**
         * Adds the given animation to this scene
         * @param newAnimation The animation to add
         */  
        public addAnimation(newAnimation: Animation): void {
            this.animations.push(newAnimation);
        }

        /**
         * Adds the given animation group to this scene.
         * @param newAnimationGroup The animation group to add
         */
        public addAnimationGroup(newAnimationGroup: AnimationGroup): void {
            this.animationGroups.push(newAnimationGroup);
        }

        /**
         * Adds the given multi-material to this scene
         * @param newMultiMaterial The multi-material to add
         */         
        public addMultiMaterial(newMultiMaterial: MultiMaterial): void {
            this.multiMaterials.push(newMultiMaterial);
        }

        /**
         * Adds the given material to this scene
         * @param newMaterial The material to add
         */          
        public addMaterial(newMaterial: Material): void {
            this.materials.push(newMaterial);
        }

        /**
         * Adds the given morph target to this scene
         * @param newMorphTargetManager The morph target to add
         */                
        public addMorphTargetManager(newMorphTargetManager: MorphTargetManager): void {
            this.morphTargetManagers.push(newMorphTargetManager);
        }

        /**
         * Adds the given geometry to this scene
         * @param newGeometry The geometry to add
         */           
        public addGeometry(newGeometry: Geometry): void {
            this._geometries.push(newGeometry);
        }

        /**
         * Adds the given lens flare system to this scene
         * @param newLensFlareSystem The lens flare system to add
         */          
        public addLensFlareSystem(newLensFlareSystem: LensFlareSystem): void {
            this.lensFlareSystems.push(newLensFlareSystem);
        }

        /**
         * Adds the given effect layer to this scene
         * @param newEffectLayer defines the effect layer to add
         */     
        public addEffectLayer(newEffectLayer: EffectLayer): void {
            this.effectLayers.push(newEffectLayer);
        }

        /**
         * Adds the given action manager to this scene
         * @param newActionManager The action manager to add
         */   
        public addActionManager(newActionManager: ActionManager): void {
            this._actionManagers.push(newActionManager);
        }

        /**
         * Adds the given texture to this scene.
         * @param newTexture The texture to add
         */
        public addTexture(newTexture: BaseTexture): void {
            this.textures.push(newTexture);
        }

        /**
         * Switch active camera
         * @param newCamera defines the new active camera
         * @param attachControl defines if attachControl must be called for the new active camera (default: true)
         */
        public switchActiveCamera(newCamera: Camera, attachControl = true): void {
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
         * Gets a lens flare system using its name
         * @param name defines the name to look for
         * @returns the lens flare system or null if not found
         */
        public getLensFlareSystemByName(name: string): Nullable<LensFlareSystem> {
            for (var index = 0; index < this.lensFlareSystems.length; index++) {
                if (this.lensFlareSystems[index].name === name) {
                    return this.lensFlareSystems[index];
                }
            }

            return null;
        }

        /**
         * Gets a lens flare system using its id
         * @param id defines the id to look for
         * @returns the lens flare system or null if not found
         */        
        public getLensFlareSystemByID(id: string): Nullable<LensFlareSystem> {
            for (var index = 0; index < this.lensFlareSystems.length; index++) {
                if (this.lensFlareSystems[index].id === id) {
                    return this.lensFlareSystems[index];
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
            for (var index = 0; index < this._geometries.length; index++) {
                if (this._geometries[index].id === id) {
                    return this._geometries[index];
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
         * @param geometry defines the geometry to be removed from the scene
         * @return a boolean defining if the geometry was removed or not
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

        /** 
         * Gets the list of geometries attached to the scene
         * @returns an array of Geometry
         */
        public getGeometries(): Geometry[] {
            return this._geometries;
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
            return this.meshes.filter(function (m) {
                return m.id === id;
            })
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
         * Gets a list of transform nodes using their id
         * @param id defines the id to search for
         * @returns a list of transform nodes
         */        
        public getTransformNodesByID(id: string): Array<TransformNode> {
            return this.transformNodes.filter(function (m) {
                return m.id === id;
            })
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

        /**
         * Gets a node (Mesh, Camera, Light) using a given name
         * @param name defines the name to search for
         * @return the found node or null if not found at all.
         */        
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
         * Gets a sound using a given name
         * @param name defines the name to search for
         * @return the found sound or null if not found at all.
         */          
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
         * Gets a boolean indicating if the given mesh is active
         * @param mesh defines the mesh to look for
         * @returns true if the mesh is in the active list
         */
        public isActiveMesh(mesh: AbstractMesh): boolean {
            return (this._activeMeshes.indexOf(mesh) !== -1);
        }

        /**
         * Return a the first highlight layer of the scene with a given name.
         * @param name The name of the highlight layer to look for.
         * @return The highlight layer if found otherwise null.
         */
        public getHighlightLayerByName(name: string): Nullable<HighlightLayer> {
            for (var index = 0; index < this.effectLayers.length; index++) {
                if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === HighlightLayer.EffectName) {
                    return (<any>this.effectLayers[index]) as HighlightLayer;
                }
            }

            return null;
        }

        /**
         * Return a the first highlight layer of the scene with a given name.
         * @param name The name of the highlight layer to look for.
         * @return The highlight layer if found otherwise null.
         */
        public getGlowLayerByName(name: string): Nullable<GlowLayer> {
            for (var index = 0; index < this.effectLayers.length; index++) {
                if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === GlowLayer.EffectName) {
                    return (<any>this.effectLayers[index]) as GlowLayer;
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
            if (this.dispatchAllSubMeshesOfActiveMeshes || mesh.alwaysSelectAsActiveMesh || mesh.subMeshes.length === 1 || subMesh.isInFrustum(this._frustumPlanes)) {
                if (mesh.showSubMeshesBoundingBox) {
                    const boundingInfo = subMesh.getBoundingInfo();
                    if (boundingInfo !== null && boundingInfo !== undefined) {
                        this.getBoundingBoxRenderer().renderList.push(boundingInfo.boundingBox);
                    }
                }

                const material = subMesh.getMaterial();
                if (material !== null && material !== undefined) {
                    // Render targets
                    if (material.getRenderTargetTextures !== undefined) {
                        if (this._processedMaterials.indexOf(material) === -1) {
                            this._processedMaterials.push(material);

                            this._renderTargets.concatWithNoDuplicate(material.getRenderTargetTextures());
                        }
                    }

                    // Dispatch
                    this._activeIndices.addCount(subMesh.indexCount, false);
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

        /**
         * Clear the active meshes smart array preventing retention point in mesh dispose.
         */
        public freeActiveMeshes(): void {
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

        /** @ignore */
        public _isInIntermediateRendering(): boolean {
            return this._intermediateRendering
        }

        private _activeMeshCandidateProvider: IActiveMeshCandidateProvider;
        /**
         * Defines the current active mesh candidate provider
         * @param provider defines the provider to use
         */
        public setActiveMeshCandidateProvider(provider: IActiveMeshCandidateProvider): void {
            this._activeMeshCandidateProvider = provider;
        }
        /**
         * Gets the current active mesh candidate provider
         * @returns the current active mesh candidate provider
         */
        public getActiveMeshCandidateProvider(): IActiveMeshCandidateProvider {
            return this._activeMeshCandidateProvider;
        }

        private _activeMeshesFrozen = false;

        /**
         * Use this function to stop evaluating active meshes. The current list will be keep alive between frames
         * @returns the current scene
         */
        public freezeActiveMeshes(): Scene {
            if (!this.activeCamera) {
                return this;
            }

            if (!this._frustumPlanes) {
                this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix());
            }

            this._evaluateActiveMeshes();
            this._activeMeshesFrozen = true;
            return this;
        }

        /**
         * Use this function to restart evaluating active meshes on every frame
         * @returns the current scene
         */
        public unfreezeActiveMeshes(): Scene {
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

            this.onBeforeActiveMeshesEvaluationObservable.notifyObservers(this);

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
            var checkIsEnabled = true;

            // Determine mesh candidates
            if (this._activeMeshCandidateProvider !== undefined) {
                // Use _activeMeshCandidateProvider
                meshes = this._activeMeshCandidateProvider.getMeshes(this);
                checkIsEnabled = this._activeMeshCandidateProvider.checksIsEnabled === false;
                if (meshes !== undefined) {
                    len = meshes.length;
                } else {
                    len = 0;
                }
            } else if (this._selectionOctree !== undefined) {
                // Octree
                var selection = this._selectionOctree.select(this._frustumPlanes);
                meshes = selection.data;
                len = selection.length;
            } else {
                // Full scene traversal
                len = this.meshes.length;
                meshes = this.meshes;
            }

            // Check each mesh
            for (var meshIndex = 0, mesh, meshLOD; meshIndex < len; meshIndex++) {
                mesh = meshes[meshIndex];

                if (mesh.isBlocked) {
                    continue;
                }

                this._totalVertices.addCount(mesh.getTotalVertices(), false);

                if (!mesh.isReady() || (checkIsEnabled && !mesh.isEnabled())) {
                    continue;
                }

                mesh.computeWorldMatrix();

                // Intersections
                if (mesh.actionManager && mesh.actionManager.hasSpecificTriggers([ActionManager.OnIntersectionEnterTrigger, ActionManager.OnIntersectionExitTrigger])) {
                    this._meshesForIntersections.pushNoDuplicate(mesh);
                }

                // Switch to current LOD
                meshLOD = mesh.getLOD(this.activeCamera);

                if (meshLOD === undefined || meshLOD === null) {
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
            if (this.skeletonsEnabled && mesh.skeleton !== null && mesh.skeleton !== undefined) {
                if (this._activeSkeletons.pushNoDuplicate(mesh.skeleton)) {
                    mesh.skeleton.prepare();
                }

                if (!mesh.computeBonesUsingShaders) {
                    this._softwareSkinnedMeshes.pushNoDuplicate(<Mesh>mesh);
                }
            }

            if (sourceMesh.showBoundingBox || this.forceShowBoundingBoxes) {
                let boundingInfo = sourceMesh.getBoundingInfo();

                this.getBoundingBoxRenderer().renderList.push(boundingInfo.boundingBox);
            }

            if (
                mesh !== undefined && mesh !== null
                && mesh.subMeshes !== undefined && mesh.subMeshes !== null && mesh.subMeshes.length > 0
            ) {
                // Submeshes Octrees
                var len: number;
                var subMeshes: SubMesh[];

                if (mesh.useOctreeForRenderingSelection && mesh._submeshesOctree !== undefined && mesh._submeshesOctree !== null) {
                    var intersections = mesh._submeshesOctree.select(this._frustumPlanes);

                    len = intersections.length;
                    subMeshes = intersections.data;
                } else {
                    subMeshes = mesh.subMeshes;
                    len = subMeshes.length;
                }

                for (var subIndex = 0, subMesh; subIndex < len; subIndex++) {
                    subMesh = subMeshes[subIndex];

                    this._evaluateSubMesh(subMesh, mesh);
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

        /**
         * Defines an alternate camera (used mostly in VR-like scenario where two cameras can render the same scene from a slightly different point of view)
         * @param alternateCamera defines the camera to use
         */
        public updateAlternateTransformMatrix(alternateCamera: Camera): void {
            this._setAlternateTransformMatrix(alternateCamera.getViewMatrix(), alternateCamera.getProjectionMatrix());
        }

        private _renderForCamera(camera: Camera, rigParent?: Camera): void {
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
            this.updateTransformMatrix();

            if (camera._alternateCamera) {
                this.updateAlternateTransformMatrix(camera._alternateCamera);
                this._alternateRendering = true;
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
            var needsRestoreFrameBuffer = false;

            if (camera.customRenderTargets && camera.customRenderTargets.length > 0) {
                this._renderTargets.concatWithNoDuplicate(camera.customRenderTargets);
            }

            if (rigParent && rigParent.customRenderTargets && rigParent.customRenderTargets.length > 0) {
                this._renderTargets.concatWithNoDuplicate(rigParent.customRenderTargets);
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

            // Render EffecttLayer Texture
            var stencilState = this._engine.getStencilBuffer();
            var renderEffects = false;
            var needStencil = false;
            if (this.renderTargetsEnabled && this.effectLayers && this.effectLayers.length > 0) {
                this._intermediateRendering = true;
                for (let i = 0; i < this.effectLayers.length; i++) {
                    let effectLayer = this.effectLayers[i];

                    if (effectLayer.shouldRender() &&
                        (!effectLayer.camera ||
                            (effectLayer.camera.cameraRigMode === Camera.RIG_MODE_NONE && camera === effectLayer.camera) ||
                            (effectLayer.camera.cameraRigMode !== Camera.RIG_MODE_NONE && effectLayer.camera._rigCameras.indexOf(camera) > -1))) {

                        renderEffects = true;
                        needStencil = needStencil || effectLayer.needStencil();

                        let renderTarget = (<RenderTargetTexture>(<any>effectLayer)._mainTexture);
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

            this.onAfterRenderTargetsRenderObservable.notifyObservers(this);

            // Prepare Frame
            this.postProcessManager._prepareFrame();

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

            // Activate effect Layer stencil
            if (needStencil) {
                this._engine.setStencilBuffer(true);
            }

            // Render
            this.onBeforeDrawPhaseObservable.notifyObservers(this);
            this._renderingManager.render(null, null, true, true);
            this.onAfterDrawPhaseObservable.notifyObservers(this);

            // Restore effect Layer stencil
            if (needStencil) {
                this._engine.setStencilBuffer(stencilState);
            }

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

            // Effect Layer
            if (renderEffects) {
                engine.setDepthBuffer(false);
                for (let i = 0; i < this.effectLayers.length; i++) {
                    if (this.effectLayers[i].shouldRender()) {
                        this.effectLayers[i].render();
                    }
                }
                engine.setDepthBuffer(true);
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

            // rig cameras
            for (var index = 0; index < camera._rigCameras.length; index++) {
                this._renderForCamera(camera._rigCameras[index], camera);
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
                            if (!sourceMesh.actionManager.hasSpecificTrigger(ActionManager.OnIntersectionExitTrigger, parameter => {
                                var parameterMesh = parameter instanceof AbstractMesh ? parameter : parameter.mesh;
                                return otherMesh === parameterMesh;
                            }) || action.trigger === ActionManager.OnIntersectionExitTrigger) {
                                sourceMesh._intersectionsInProgress.splice(currentIntersectionInProgress, 1);
                            }
                        }
                    }
                }
            }
        }

        /** 
         * Render the scene
         */
        public render(): void {
            if (this.isDisposed) {
                return;
            }

            this._activeParticles.fetchNewFrame();
            this._totalVertices.fetchNewFrame();
            this._activeIndices.fetchNewFrame();
            this._activeBones.fetchNewFrame();
            this._meshesForIntersections.reset();
            this.resetCachedMaterial();

            this.onBeforeAnimationsObservable.notifyObservers(this);

            // Actions
            if (this.actionManager) {
                this.actionManager.processTrigger(ActionManager.OnEveryFrameTrigger);
            }

            //Simplification Queue
            if (this.simplificationQueue && !this.simplificationQueue.running) {
                this.simplificationQueue.executeNext();
            }

            if (this._engine.isDeterministicLockStep()) {
                var deltaTime = Math.max(Scene.MinDeltaTime, Math.min(this._engine.getDeltaTime(), Scene.MaxDeltaTime)) + this._timeAccumulator;

                var defaultFPS = (60.0 / 1000.0);

                let defaultFrameTime = 1000 / 60; // frame time in MS

                if (this._physicsEngine) {
                    defaultFrameTime = this._physicsEngine.getTimeStep() * 1000;
                }
                let stepsTaken = 0;

                var maxSubSteps = this._engine.getLockstepMaxSteps();

                var internalSteps = Math.floor(deltaTime / (1000 * defaultFPS));
                internalSteps = Math.min(internalSteps, maxSubSteps);

                do {
                    this.onBeforeStepObservable.notifyObservers(this);

                    // Animations
                    this._animationRatio = defaultFrameTime * defaultFPS;
                    this._animate();
                    this.onAfterAnimationsObservable.notifyObservers(this);

                    // Physics
                    if (this._physicsEngine) {
                        this.onBeforePhysicsObservable.notifyObservers(this);
                        this._physicsEngine._step(defaultFrameTime / 1000);
                        this.onAfterPhysicsObservable.notifyObservers(this);
                    }

                    this.onAfterStepObservable.notifyObservers(this);
                    this._currentStepId++;

                    stepsTaken++;
                    deltaTime -= defaultFrameTime;

                } while (deltaTime > 0 && stepsTaken < internalSteps);

                this._timeAccumulator = deltaTime < 0 ? 0 : deltaTime;

            }
            else {
                // Animations
                var deltaTime = this.useConstantAnimationDeltaTime ? 16 : Math.max(Scene.MinDeltaTime, Math.min(this._engine.getDeltaTime(), Scene.MaxDeltaTime));
                this._animationRatio = deltaTime * (60.0 / 1000.0);
                this._animate();
                this.onAfterAnimationsObservable.notifyObservers(this);

                // Physics
                if (this._physicsEngine) {
                    this.onBeforePhysicsObservable.notifyObservers(this);
                    this._physicsEngine._step(deltaTime / 1000.0);
                    this.onAfterPhysicsObservable.notifyObservers(this);
                }
            }

            // update gamepad manager
            if (this._gamepadManager && this._gamepadManager._isMonitoring) {
                this._gamepadManager._checkGamepadsStatus();
            }

            // Update Cameras
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

            this.onAfterRenderTargetsRenderObservable.notifyObservers(this);
            this.activeCamera = currentActiveCamera;

            // Procedural textures
            if (this.proceduralTexturesEnabled) {
                Tools.StartPerformanceCounter("Procedural textures", this.proceduralTextures.length > 0);
                for (var proceduralIndex = 0; proceduralIndex < this.proceduralTextures.length; proceduralIndex++) {
                    var proceduralTexture = this.proceduralTextures[proceduralIndex];
                    if (proceduralTexture._shouldRender()) {
                        proceduralTexture.render();
                    }
                }
                Tools.EndPerformanceCounter("Procedural textures", this.proceduralTextures.length > 0);
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
            for (var key in this._depthRenderer) {
                this._renderTargets.push(this._depthRenderer[key].getDepthMap());
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
        /**
         * Gets or sets if audio support is enabled
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
         */
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

        /**
         * Gets or sets if audio will be output to headphones
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
         */
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

        /**
         * Creates a depth renderer a given camera which contains a depth map which can be used for post processing.
         * @param camera The camera to create the depth renderer on (default: scene's active camera)
         * @returns the created depth renderer
         */
        public enableDepthRenderer(camera?: Nullable<Camera>): DepthRenderer {
            camera = camera || this.activeCamera;
            if (!camera) {
                throw "No camera available to enable depth renderer";
            }
            if (!this._depthRenderer[camera.id]) {
                var textureType = 0;
                if (this._engine.getCaps().textureHalfFloatRender) {
                    textureType = Engine.TEXTURETYPE_HALF_FLOAT;
                }
                else if (this._engine.getCaps().textureFloatRender) {
                    textureType = Engine.TEXTURETYPE_FLOAT;
                } else {
                    throw "Depth renderer does not support int texture type";
                }
                this._depthRenderer[camera.id] = new DepthRenderer(this, textureType, camera);
            }

            return this._depthRenderer[camera.id];
        }

        /**
         * Disables a depth renderer for a given camera
         * @param camera The camera to disable the depth renderer on (default: scene's active camera)
         */
        public disableDepthRenderer(camera?: Nullable<Camera>): void {
            camera = camera || this.activeCamera;
            if (!camera || !this._depthRenderer[camera.id]) {
                return;
            }

            this._depthRenderer[camera.id].dispose();
            delete this._depthRenderer[camera.id];
        }

        /**
         * Enables a GeometryBufferRender and associates it with the scene
         * @param ratio defines the scaling ratio to apply to the renderer (1 by default which means same resolution)
         * @returns the GeometryBufferRenderer
         */
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

        /**
         * Disables the GeometryBufferRender associated with the scene
         */
        public disableGeometryBufferRenderer(): void {
            if (!this._geometryBufferRenderer) {
                return;
            }

            this._geometryBufferRenderer.dispose();
            this._geometryBufferRenderer = null;
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

            this.skeletons = [];
            this.morphTargetManagers = [];

            this.importedMeshesFiles = new Array<string>();

            this.stopAllAnimations();

            this.resetCachedMaterial();

            for (var key in this._depthRenderer) {
                this._depthRenderer[key].dispose();
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
            this._registeredForLateAnimationBindings.dispose();

            if (this._boundingBoxRenderer) {
                this._boundingBoxRenderer.dispose();
            }
            this._meshesForIntersections.dispose();
            this._toBeDisposed.dispose();

            // Abort active requests
            for (let request of this._activeRequests) {
                request.abort();
            }

            // Debug layer
            if (this._debugLayer) {
                this._debugLayer.hide();
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
            this.onBeforeSpritesRenderingObservable.clear();
            this.onAfterSpritesRenderingObservable.clear();
            this.onBeforeDrawPhaseObservable.clear();
            this.onAfterDrawPhaseObservable.clear();
            this.onBeforePhysicsObservable.clear();
            this.onAfterPhysicsObservable.clear();
            this.onBeforeAnimationsObservable.clear();
            this.onAfterAnimationsObservable.clear();
            this.onDataLoadedObservable.clear();

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
                this.removeTransformNode(this.transformNodes[0]);
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
            while (this.effectLayers.length) {
                this.effectLayers[0].dispose();
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
         *  Releases sounds & soundtracks
         */
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
            this.meshes.filter(filterPredicate).forEach(mesh => {
                mesh.computeWorldMatrix(true);

                if (!mesh.subMeshes || mesh.subMeshes.length === 0 || mesh.infiniteDistance) {
                    return;
                }

                let boundingInfo = mesh.getBoundingInfo();

                var minBox = boundingInfo.boundingBox.minimumWorld;
                var maxBox = boundingInfo.boundingBox.maximumWorld;

                Tools.CheckExtends(minBox, min, max);
                Tools.CheckExtends(maxBox, min, max);
            })

            return {
                min: min,
                max: max
            };
        }

        /**
         * Creates or updates the octree used to boost selection (picking)
         * @see http://doc.babylonjs.com/how_to/optimizing_your_scene_with_octrees
         * @param maxCapacity defines the maximum capacity per leaf
         * @param maxDepth defines the maximum depth of the octree
         * @returns an octree of AbstractMesh
         */
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
            let result = Ray.Zero();

            this.createPickingRayToRef(x, y, world, result, camera, cameraViewSpace);

            return result;
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

            result.update(x, y, viewport.width, viewport.height, world ? world : Matrix.Identity(), cameraViewSpace ? Matrix.Identity() : camera.getViewMatrix(), camera.getProjectionMatrix());
            return this;
        }

        /**
         * Creates a ray that can be used to pick in the scene
         * @param x defines the x coordinate of the origin (on-screen)
         * @param y defines the y coordinate of the origin (on-screen)
         * @param camera defines the camera to use for the picking
         * @returns a Ray
         */        
        public createPickingRayInCameraSpace(x: number, y: number, camera?: Camera): Ray {
            let result = Ray.Zero();

            this.createPickingRayInCameraSpaceToRef(x, y, result, camera);

            return result;
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
            if (!PickingInfo) {
                return this;
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
            result.update(x, y, viewport.width, viewport.height, identity, identity, camera.getProjectionMatrix());
            return this;
        }

        private _internalPick(rayFunction: (world: Matrix) => Ray, predicate?: (mesh: AbstractMesh) => boolean, fastCheck?: boolean): Nullable<PickingInfo> {
            if (!PickingInfo) {
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
            if (!PickingInfo) {
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
            if (!PickingInfo) {
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

        private _tempPickingRay: Nullable<Ray> = Ray ? Ray.Zero() : null;

        /** Launch a ray to try to pick a mesh in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
         * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         * @returns a PickingInfo
         */
        public pick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean, fastCheck?: boolean, camera?: Nullable<Camera>): Nullable<PickingInfo> {
            if (!PickingInfo) {
                return null;
            }

            return this._internalPick(world => {
                this.createPickingRayToRef(x, y, world, this._tempPickingRay!, camera || null);
                return this._tempPickingRay!;
            }, predicate, fastCheck);
        }

        /** Launch a ray to try to pick a sprite in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         * @returns a PickingInfo
         */
        public pickSprite(x: number, y: number, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo> {
            this.createPickingRayInCameraSpaceToRef(x, y, this._tempPickingRay!, camera);

            return this._internalPickSprites(this._tempPickingRay!, predicate, fastCheck, camera);
        }

        private _cachedRayForTransform: Ray;

        /** Use the given ray to pick a mesh in the scene
         * @param ray The ray to use to pick meshes
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null
         * @returns a PickingInfo
         */
        public pickWithRay(ray: Ray, predicate: (mesh: AbstractMesh) => boolean, fastCheck?: boolean): Nullable<PickingInfo> {
            return this._internalPick(world => {
                if (!this._pickWithRayInverseMatrix) {
                    this._pickWithRayInverseMatrix = Matrix.Identity();
                }
                world.invertToRef(this._pickWithRayInverseMatrix);

                if (!this._cachedRayForTransform) {
                    this._cachedRayForTransform = Ray.Zero();
                }

                Ray.TransformToRef(ray, this._pickWithRayInverseMatrix, this._cachedRayForTransform);
                return this._cachedRayForTransform;
            }, predicate, fastCheck);
        }

        /**
         * Launch a ray to try to pick a mesh in the scene
         * @param x X position on screen
         * @param y Y position on screen
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         * @returns an array of PickingInfo
         */
        public multiPick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean, camera?: Camera): Nullable<PickingInfo[]> {
            return this._internalMultiPick(world => this.createPickingRay(x, y, world, camera || null), predicate);
        }

        /**
         * Launch a ray to try to pick a mesh in the scene
         * @param ray Ray to use
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         * @returns an array of PickingInfo
         */
        public multiPickWithRay(ray: Ray, predicate: (mesh: AbstractMesh) => boolean): Nullable<PickingInfo[]> {
            return this._internalMultiPick(world => {
                if (!this._pickWithRayInverseMatrix) {
                    this._pickWithRayInverseMatrix = Matrix.Identity();
                }
                world.invertToRef(this._pickWithRayInverseMatrix);

                if (!this._cachedRayForTransform) {
                    this._cachedRayForTransform = Ray.Zero();
                }

                Ray.TransformToRef(ray, this._pickWithRayInverseMatrix, this._cachedRayForTransform);
                return this._cachedRayForTransform;
            }, predicate);
        }

        /**
         * Force the value of meshUnderPointer
         * @param mesh defines the mesh to use
         */
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

        /** 
         * Gets the mesh under the pointer
         * @returns a Mesh or null if no mesh is under the pointer
         */
        public getPointerOverMesh(): Nullable<AbstractMesh> {
            return this._pointerOverMesh;
        }

        /** 
         * Force the sprite under the pointer
         * @param sprite defines the sprite to use
         */        
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

        /** 
         * Gets the sprite under the pointer
         * @returns a Sprite or null if no sprite is under the pointer
         */        
        public getPointerOverSprite(): Nullable<Sprite> {
            return this._pointerOverSprite;
        }

        // Physics

        /** 
         * Gets the current physics engine
         * @returns a PhysicsEngine or null if none attached
         */
        public getPhysicsEngine(): Nullable<PhysicsEngine> {
            return this._physicsEngine;
        }

        /**
         * Enables physics to the current scene
         * @param gravity defines the scene's gravity for the physics engine
         * @param plugin defines the physics engine to be used. defaults to OimoJS.
         * @return a boolean indicating if the physics engine was initialized
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

        /** 
         * Disables and disposes the physics engine associated with the scene
         */
        public disablePhysicsEngine(): void {
            if (!this._physicsEngine) {
                return;
            }

            this._physicsEngine.dispose();
            this._physicsEngine = null;
        }

        /**
         * Gets a boolean indicating if there is an active physics engine
         * @returns a boolean indicating if there is an active physics engine
         */
        public isPhysicsEnabled(): boolean {
            return this._physicsEngine !== undefined;
        }

        /**
         * Deletes a physics compound impostor
         * @param compound defines the compound to delete
         */
        public deleteCompoundImpostor(compound: any): void {
            var mesh: AbstractMesh = compound.parts[0].mesh;

            if (mesh.physicsImpostor) {
                mesh.physicsImpostor.dispose(/*true*/);
                mesh.physicsImpostor = null;
            }
        }

        // Misc.
        /** @ignore */
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

            for (var effectLayer of this.effectLayers) {
                effectLayer._rebuild();
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

        /** @ignore */
        public _rebuildTextures(): void {
            for (var texture of this.textures) {
                texture._rebuild();
            }

            this.markAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }

        /**
         * Creates a default light for the scene.
         * @param replace Whether to replace the existing lights in the scene.
         */
        public createDefaultLight(replace = false): void {
            // Dispose existing light in replace mode.
            if (replace) {
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
        }

        /**
         * Creates a default camera for the scene.
         * @param createArcRotateCamera Whether to create an arc rotate or a free camera.
         * @param replace Whether to replace the existing active camera in the scene.
         * @param attachCameraControls Whether to attach camera controls to the canvas.
         */
        public createDefaultCamera(createArcRotateCamera = false, replace = false, attachCameraControls = false): void {
            // Dispose existing camera in replace mode.
            if (replace) {
                if (this.activeCamera) {
                    this.activeCamera.dispose();
                    this.activeCamera = null;
                }
            }

            // Camera
            if (!this.activeCamera) {
                var worldExtends = this.getWorldExtends();
                var worldSize = worldExtends.max.subtract(worldExtends.min);
                var worldCenter = worldExtends.min.add(worldSize.scale(0.5));

                var camera: TargetCamera;
                var radius = worldSize.length() * 1.5;
                // empty scene scenario!
                if (!isFinite(radius)) {
                    radius = 1;
                    worldCenter.copyFromFloats(0, 0, 0);
                }
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
                camera.maxZ = radius * 1000;
                camera.speed = radius * 0.2;
                this.activeCamera = camera;

                let canvas = this.getEngine().getRenderingCanvas();
                if (attachCameraControls && canvas) {
                    camera.attachControl(canvas);
                }
            }
        }

        /**
         * Creates a default camera and a default light 
         * @param createArcRotateCamera defines that the camera will be an ArcRotateCamera
         * @param replace defines if the camera and/or light will replace the existing ones
         * @param attachCameraControls defines if attachControl will be called on the new camera
         */
        public createDefaultCameraOrLight(createArcRotateCamera = false, replace = false, attachCameraControls = false): void {
            this.createDefaultLight(replace);
            this.createDefaultCamera(createArcRotateCamera, replace, attachCameraControls);
        }

        /**
         * Creates a new sky box
         * @see http://doc.babylonjs.com/babylon101/environment#skybox
         * @param environmentTexture defines the texture to use as environment texture
         * @param pbr defines if PBRMaterial must be used instead of StandardMaterial
         * @param scale defines the overall scale of the skybox
         * @param blur defines if blurring must be applied to the environment texture (works only with pbr === true)
         * @returns a new mesh holding the sky box
         */
        public createDefaultSkybox(environmentTexture?: BaseTexture, pbr = false, scale = 1000, blur = 0): Nullable<Mesh> {
            if (environmentTexture) {
                this.environmentTexture = environmentTexture;
            }

            if (!this.environmentTexture) {
                Tools.Warn("Can not create default skybox without environment texture.");
                return null;
            }

            // Skybox
            var hdrSkybox = Mesh.CreateBox("hdrSkyBox", scale, this);
            if (pbr) {
                let hdrSkyboxMaterial = new PBRMaterial("skyBox", this);
                hdrSkyboxMaterial.backFaceCulling = false;
                hdrSkyboxMaterial.reflectionTexture = this.environmentTexture.clone();
                if (hdrSkyboxMaterial.reflectionTexture) {
                    hdrSkyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
                }
                hdrSkyboxMaterial.microSurface = 1.0 - blur;
                hdrSkyboxMaterial.disableLighting = true;
                hdrSkyboxMaterial.twoSidedLighting = true;
                hdrSkybox.infiniteDistance = true;
                hdrSkybox.material = hdrSkyboxMaterial;
            }
            else {
                let skyboxMaterial = new StandardMaterial("skyBox", this);
                skyboxMaterial.backFaceCulling = false;
                skyboxMaterial.reflectionTexture = this.environmentTexture.clone();
                if (skyboxMaterial.reflectionTexture) {
                    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
                }
                skyboxMaterial.disableLighting = true;
                hdrSkybox.infiniteDistance = true;
                hdrSkybox.material = skyboxMaterial;
            }

            return hdrSkybox;
        }

        /**
         * Creates a new environment
         * @see http://doc.babylonjs.com/babylon101/environment#skybox
         * @param options defines the options you can use to configure the environment
         * @returns the new EnvironmentHelper
         */
        public createDefaultEnvironment(options: Partial<IEnvironmentHelperOptions>): Nullable<EnvironmentHelper> {
            if (EnvironmentHelper) {
                return new EnvironmentHelper(options, this);
            }
            return null;
        }

        /**
         * Creates a new VREXperienceHelper
         * @see http://doc.babylonjs.com/how_to/webvr_helper
         * @param webVROptions defines the options used to create the new VREXperienceHelper
         * @returns a new VREXperienceHelper
         */
        public createDefaultVRExperience(webVROptions: VRExperienceHelperOptions = {}): VRExperienceHelper {
            return new VRExperienceHelper(this, webVROptions);
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
         * Will flag all materials as dirty to trigger new shader compilation
         * @param flag defines the flag used to specify which material part must be marked as dirty
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

        /** @ignore */
        public _loadFile(url: string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void, onProgress?: (data: any) => void, useDatabase?: boolean, useArrayBuffer?: boolean, onError?: (request?: XMLHttpRequest, exception?: any) => void): IFileRequest {
            let request = Tools.LoadFile(url, onSuccess, onProgress, useDatabase ? this.database : undefined, useArrayBuffer, onError);
            this._activeRequests.push(request);
            request.onCompleteObservable.add(request => {
                this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
            });
            return request;
        }

        /** @ignore */
        public _loadFileAsync(url: string, useDatabase?: boolean, useArrayBuffer?: boolean): Promise<string | ArrayBuffer> {
            return new Promise((resolve, reject) => {
                this._loadFile(url, (data) => {
                    resolve(data);
                }, undefined, useDatabase, useArrayBuffer, (request, exception) => {
                    reject(exception);
                })
            });
        }
    }
}
