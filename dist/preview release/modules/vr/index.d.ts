declare module 'babylonjs/vr' {
    class VRDistortionCorrectionPostProcess extends PostProcess {
        aspectRatio: number;
        private _isRightEye;
        private _distortionFactors;
        private _postProcessScaleFactor;
        private _lensCenterOffset;
        private _scaleIn;
        private _scaleFactor;
        private _lensCenter;
        constructor(name: string, camera: Camera, isRightEye: boolean, vrMetrics: VRCameraMetrics);
    }
}

declare module 'babylonjs/vr' {
    class AnaglyphPostProcess extends PostProcess {
        private _passedProcess;
        constructor(name: string, options: number | PostProcessOptions, rigCameras: Camera[], samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}

declare module 'babylonjs/vr' {
    class StereoscopicInterlacePostProcess extends PostProcess {
        private _stepSize;
        private _passedProcess;
        constructor(name: string, rigCameras: Camera[], isStereoscopicHoriz: boolean, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}

declare module 'babylonjs/vr' {
    class FreeCameraDeviceOrientationInput implements ICameraInput<FreeCamera> {
        private _camera;
        private _screenOrientationAngle;
        private _constantTranform;
        private _screenQuaternion;
        private _alpha;
        private _beta;
        private _gamma;
        constructor();
        camera: FreeCamera;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        private _orientationChanged;
        private _deviceOrientation;
        detachControl(element: Nullable<HTMLElement>): void;
        checkInputs(): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module 'babylonjs/vr' {
    class ArcRotateCameraVRDeviceOrientationInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        alphaCorrection: number;
        betaCorrection: number;
        gammaCorrection: number;
        private _alpha;
        private _gamma;
        private _dirty;
        private _deviceOrientationHandler;
        constructor();
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        _onOrientationEvent(evt: DeviceOrientationEvent): void;
        checkInputs(): void;
        detachControl(element: Nullable<HTMLElement>): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module 'babylonjs/vr' {
    class VRCameraMetrics {
        hResolution: number;
        vResolution: number;
        hScreenSize: number;
        vScreenSize: number;
        vScreenCenter: number;
        eyeToScreenDistance: number;
        lensSeparationDistance: number;
        interpupillaryDistance: number;
        distortionK: number[];
        chromaAbCorrection: number[];
        postProcessScaleFactor: number;
        lensCenterOffset: number;
        compensateDistortion: boolean;
        readonly aspectRatio: number;
        readonly aspectRatioFov: number;
        readonly leftHMatrix: Matrix;
        readonly rightHMatrix: Matrix;
        readonly leftPreViewMatrix: Matrix;
        readonly rightPreViewMatrix: Matrix;
        static GetDefault(): VRCameraMetrics;
    }
}

declare var HMDVRDevice: any;
declare var VRDisplay: any;
declare var VRFrameData: any;
declare module 'babylonjs/vr' {
    /**
     * This is a copy of VRPose.
     * IMPORTANT!! The data is right-hand data.
     * @export
     * @interface DevicePose
     */
    interface DevicePose {
        readonly position?: Float32Array;
        readonly linearVelocity?: Float32Array;
        readonly linearAcceleration?: Float32Array;
        readonly orientation?: Float32Array;
        readonly angularVelocity?: Float32Array;
        readonly angularAcceleration?: Float32Array;
    }
    interface PoseControlled {
        position: Vector3;
        rotationQuaternion: Quaternion;
        devicePosition?: Vector3;
        deviceRotationQuaternion: Quaternion;
        rawPose: Nullable<DevicePose>;
        deviceScaleFactor: number;
        updateFromDevice(poseData: DevicePose): void;
    }
    interface WebVROptions {
        trackPosition?: boolean;
        positionScale?: number;
        displayName?: string;
        controllerMeshes?: boolean;
        defaultLightingOnControllers?: boolean;
        useCustomVRButton?: boolean;
        customVRButton?: HTMLButtonElement;
        rayLength?: number;
        defaultHeight?: number;
    }
    class WebVRFreeCamera extends FreeCamera implements PoseControlled {
        private webVROptions;
        _vrDevice: any;
        rawPose: Nullable<DevicePose>;
        private _onVREnabled;
        private _specsVersion;
        private _attached;
        private _frameData;
        protected _descendants: Array<Node>;
        private _deviceRoomPosition;
        private _deviceRoomRotationQuaternion;
        private _standingMatrix;
        devicePosition: Vector3;
        deviceRotationQuaternion: Quaternion;
        deviceScaleFactor: number;
        private _deviceToWorld;
        private _worldToDevice;
        controllers: Array<WebVRController>;
        onControllersAttachedObservable: Observable<WebVRController[]>;
        onControllerMeshLoadedObservable: Observable<WebVRController>;
        rigParenting: boolean;
        private _lightOnControllers;
        private _defaultHeight;
        constructor(name: string, position: Vector3, scene: Scene, webVROptions?: WebVROptions);
        deviceDistanceToRoomGround: () => number;
        useStandingMatrix: (callback?: (bool: boolean) => void) => void;
        dispose(): void;
        getControllerByName(name: string): Nullable<WebVRController>;
        private _leftController;
        readonly leftController: Nullable<WebVRController>;
        private _rightController;
        readonly rightController: Nullable<WebVRController>;
        getForwardRay(length?: number): Ray;
        _checkInputs(): void;
        updateFromDevice(poseData: DevicePose): void;
        /**
         * WebVR's attach control will start broadcasting frames to the device.
         * Note that in certain browsers (chrome for example) this function must be called
         * within a user-interaction callback. Example:
         * <pre> scene.onPointerDown = function() { camera.attachControl(canvas); }</pre>
         *
         * @param {HTMLElement} element
         * @param {boolean} [noPreventDefault]
         *
         * @memberOf WebVRFreeCamera
         */
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: HTMLElement): void;
        getClassName(): string;
        resetToCurrentRotation(): void;
        _updateRigCameras(): void;
        private _workingVector;
        private _oneVector;
        private _workingMatrix;
        private updateCacheCalled;
        _updateCache(ignoreParentClass?: boolean): void;
        update(): void;
        _getViewMatrix(): Matrix;
        /**
         * This function is called by the two RIG cameras.
         * 'this' is the left or right camera (and NOT (!!!) the WebVRFreeCamera instance)
         */
        protected _getWebVRViewMatrix(): Matrix;
        protected _getWebVRProjectionMatrix(): Matrix;
        private _onGamepadConnectedObserver;
        private _onGamepadDisconnectedObserver;
        initControllers(): void;
    }
}

declare module 'babylonjs/vr' {
    class DeviceOrientationCamera extends FreeCamera {
        private _initialQuaternion;
        private _quaternionCache;
        constructor(name: string, position: Vector3, scene: Scene);
        getClassName(): string;
        _checkInputs(): void;
        resetToCurrentRotation(axis?: Axis): void;
    }
}

declare module 'babylonjs/vr' {
    class VRDeviceOrientationFreeCamera extends DeviceOrientationCamera {
        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion?: boolean, vrCameraMetrics?: VRCameraMetrics);
        getClassName(): string;
    }
    class VRDeviceOrientationGamepadCamera extends VRDeviceOrientationFreeCamera {
        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion?: boolean, vrCameraMetrics?: VRCameraMetrics);
        getClassName(): string;
    }
    class VRDeviceOrientationArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene, compensateDistortion?: boolean, vrCameraMetrics?: VRCameraMetrics);
        getClassName(): string;
    }
}

declare module 'babylonjs/vr' {
    class AnaglyphFreeCamera extends FreeCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene);
        getClassName(): string;
    }
    class AnaglyphArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, interaxialDistance: number, scene: Scene);
        getClassName(): string;
    }
    class AnaglyphGamepadCamera extends GamepadCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene);
        getClassName(): string;
    }
    class AnaglyphUniversalCamera extends UniversalCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene);
        getClassName(): string;
    }
    class StereoscopicFreeCamera extends FreeCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene);
        getClassName(): string;
    }
    class StereoscopicArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene);
        getClassName(): string;
    }
    class StereoscopicGamepadCamera extends GamepadCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene);
        getClassName(): string;
    }
    class StereoscopicUniversalCamera extends UniversalCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene);
        getClassName(): string;
    }
}

declare module 'babylonjs/vr' {
    interface VRTeleportationOptions {
        floorMeshName?: string;
        floorMeshes?: Mesh[];
    }
    interface VRExperienceHelperOptions extends WebVROptions {
        createDeviceOrientationCamera?: boolean;
        createFallbackVRDeviceOrientationFreeCamera?: boolean;
    }
    class VRExperienceHelper {
        webVROptions: VRExperienceHelperOptions;
        private _scene;
        private _position;
        private _btnVR;
        private _btnVRDisplayed;
        private _webVRsupported;
        private _webVRready;
        private _webVRrequesting;
        private _webVRpresenting;
        private _fullscreenVRpresenting;
        private _canvas;
        private _webVRCamera;
        private _vrDeviceOrientationCamera;
        private _deviceOrientationCamera;
        private _existingCamera;
        private _onKeyDown;
        private _onVrDisplayPresentChange;
        private _onVRDisplayChanged;
        private _onVRRequestPresentStart;
        private _onVRRequestPresentComplete;
        /**
         * Observable raised when entering VR.
         */
        onEnteringVRObservable: Observable<VRExperienceHelper>;
        /**
         * Observable raised when exiting VR.
         */
        onExitingVRObservable: Observable<VRExperienceHelper>;
        /**
         * Observable raised when controller mesh is loaded.
         */
        onControllerMeshLoadedObservable: Observable<WebVRController>;
        /** Return this.onEnteringVRObservable
         * Note: This one is for backward compatibility. Please use onEnteringVRObservable directly
         */
        readonly onEnteringVR: Observable<VRExperienceHelper>;
        /** Return this.onExitingVRObservable
         * Note: This one is for backward compatibility. Please use onExitingVRObservable directly
         */
        readonly onExitingVR: Observable<VRExperienceHelper>;
        /** Return this.onControllerMeshLoadedObservable
         * Note: This one is for backward compatibility. Please use onControllerMeshLoadedObservable directly
         */
        readonly onControllerMeshLoaded: Observable<WebVRController>;
        private _rayLength;
        private _useCustomVRButton;
        private _teleportationRequested;
        private _teleportationEnabledOnLeftController;
        private _teleportationEnabledOnRightController;
        private _interactionsEnabledOnLeftController;
        private _interactionsEnabledOnRightController;
        private _leftControllerReady;
        private _rightControllerReady;
        private _floorMeshName;
        private _floorMeshesCollection;
        private _teleportationAllowed;
        private _rotationAllowed;
        private _teleportationRequestInitiated;
        private _teleportationBackRequestInitiated;
        private teleportBackwardsVector;
        private _rotationRightAsked;
        private _rotationLeftAsked;
        private _teleportationTarget;
        private _isDefaultTeleportationTarget;
        private _postProcessMove;
        private _passProcessMove;
        private _teleportationFillColor;
        private _teleportationBorderColor;
        private _rotationAngle;
        private _haloCenter;
        private _gazeTracker;
        private _padSensibilityUp;
        private _padSensibilityDown;
        private _leftLaserPointer;
        private _rightLaserPointer;
        private _currentMeshSelected;
        /**
         * Observable raised when a new mesh is selected based on meshSelectionPredicate
         */
        onNewMeshSelected: Observable<AbstractMesh>;
        /**
         * Observable raised when a new mesh is picked based on meshSelectionPredicate
         */
        onNewMeshPicked: Observable<PickingInfo>;
        private _circleEase;
        /**
         * Observable raised before camera teleportation
        */
        onBeforeCameraTeleport: Observable<Vector3>;
        /**
         *  Observable raised after camera teleportation
        */
        onAfterCameraTeleport: Observable<Vector3>;
        /**
        * Observable raised when current selected mesh gets unselected
        */
        onSelectedMeshUnselected: Observable<AbstractMesh>;
        private _raySelectionPredicate;
        /**
         * To be optionaly changed by user to define custom ray selection
         */
        raySelectionPredicate: (mesh: AbstractMesh) => boolean;
        /**
         * To be optionaly changed by user to define custom selection logic (after ray selection)
         */
        meshSelectionPredicate: (mesh: AbstractMesh) => boolean;
        /**
         * Set teleportation enabled. If set to false camera teleportation will be disabled but camera rotation will be kept.
         */
        teleportationEnabled: boolean;
        private _currentHit;
        private _pointerDownOnMeshAsked;
        private _isActionableMesh;
        private _defaultHeight;
        private _teleportationInitialized;
        private _interactionsEnabled;
        private _interactionsRequested;
        private _displayGaze;
        private _displayLaserPointer;
        private _dpadPressed;
        teleportationTarget: Mesh;
        displayGaze: boolean;
        displayLaserPointer: boolean;
        readonly deviceOrientationCamera: Nullable<DeviceOrientationCamera>;
        readonly currentVRCamera: Nullable<Camera>;
        readonly webVRCamera: WebVRFreeCamera;
        readonly vrDeviceOrientationCamera: Nullable<VRDeviceOrientationFreeCamera>;
        constructor(scene: Scene, webVROptions?: VRExperienceHelperOptions);
        private _onDefaultMeshLoaded(webVRController);
        private _onResize;
        private _onFullscreenChange;
        /**
         * Gets a value indicating if we are currently in VR mode.
         */
        readonly isInVRMode: boolean;
        private onVrDisplayPresentChange();
        private onVRDisplayChanged(eventArgs);
        private moveButtonToBottomRight();
        private displayVRButton();
        private updateButtonVisibility();
        /**
         * Attempt to enter VR. If a headset is connected and ready, will request present on that.
         * Otherwise, will use the fullscreen API.
         */
        enterVR(): void;
        /**
         * Attempt to exit VR, or fullscreen.
         */
        exitVR(): void;
        position: Vector3;
        enableInteractions(): void;
        private beforeRender;
        private _isTeleportationFloor(mesh);
        addFloorMesh(floorMesh: Mesh): void;
        removeFloorMesh(floorMesh: Mesh): void;
        enableTeleportation(vrTeleportationOptions?: VRTeleportationOptions): void;
        private _onNewGamepadConnected;
        private _tryEnableInteractionOnController;
        private _onNewGamepadDisconnected;
        private _enableInteractionOnController(webVRController);
        private _checkTeleportWithRay(stateObject, webVRController?);
        private _selectionPointerDown();
        private _selectionPointerUp();
        private _checkRotate(stateObject);
        private _checkTeleportBackwards(stateObject);
        private _enableTeleportationOnController(webVRController);
        private _createGazeTracker();
        private _createTeleportationCircles();
        private _displayTeleportationTarget();
        private _hideTeleportationTarget();
        private _rotateCamera(right);
        private _moveTeleportationSelectorTo(hit);
        private _workingVector;
        private _workingQuaternion;
        private _workingMatrix;
        private _teleportCamera(location?);
        private _castRayAndSelectObject();
        changeLaserColor(color: Color3): void;
        changeGazeColor(color: Color3): void;
        dispose(): void;
        getClassName(): string;
    }
}

import {EffectFallbacks,EffectCreationOptions,Effect,Nullable,float,double,int,FloatArray,IndicesArray,KeyboardEventTypes,KeyboardInfo,KeyboardInfoPre,PointerEventTypes,PointerInfoBase,PointerInfoPre,PointerInfo,ToGammaSpace,ToLinearSpace,Epsilon,Color3,Color4,Vector2,Vector3,Vector4,ISize,Size,Quaternion,Matrix,Plane,Viewport,Frustum,Space,Axis,BezierCurve,Orientation,Angle,Arc2,Path2,Path3D,Curve3,PositionNormalVertex,PositionNormalTextureVertex,Tmp,Scalar,expandToProperty,serialize,serializeAsTexture,serializeAsColor3,serializeAsFresnelParameters,serializeAsVector2,serializeAsVector3,serializeAsMeshReference,serializeAsColorCurves,serializeAsColor4,serializeAsImageProcessingConfiguration,serializeAsQuaternion,SerializationHelper,EventState,Observer,MultiObserver,Observable,SmartArray,SmartArrayNoDuplicate,IAnimatable,LoadFileError,RetryStrategy,IFileRequest,Tools,PerfCounter,className,AsyncLoop,_AlphaState,_DepthCullingState,_StencilState,InstancingAttributeInfo,RenderTargetCreationOptions,EngineCapabilities,EngineOptions,IDisplayChangedEventArgs,Engine,Node,BoundingSphere,BoundingBox,ICullable,BoundingInfo,TransformNode,AbstractMesh,Light,Camera,RenderingManager,RenderingGroup,IDisposable,IActiveMeshCandidateProvider,RenderingGroupInfo,Scene,Buffer,VertexBuffer,InternalTexture,BaseTexture,Texture,_InstancesBatch,Mesh,BaseSubMesh,SubMesh,MaterialDefines,Material,UniformBuffer,IGetSetVerticesData,VertexData,Geometry,_PrimitiveGeometry,RibbonGeometry,BoxGeometry,SphereGeometry,DiscGeometry,CylinderGeometry,TorusGeometry,GroundGeometry,TiledGroundGeometry,PlaneGeometry,TorusKnotGeometry,PostProcessManager,PerformanceMonitor,RollingAverage,IImageProcessingConfigurationDefines,ImageProcessingConfiguration,ColorGradingTexture,ColorCurves,Behavior,MaterialHelper,PushMaterial,StandardMaterialDefines,StandardMaterial} from 'babylonjs/core';
import {EngineInstrumentation,SceneInstrumentation,_TimeToken} from 'babylonjs/instrumentation';
import {Particle,IParticleSystem,ParticleSystem,BoxParticleEmitter,ConeParticleEmitter,SphereParticleEmitter,SphereDirectedParticleEmitter,IParticleEmitterType} from 'babylonjs/particles';
import {GPUParticleSystem} from 'babylonjs/gpuParticles';
import {FramingBehavior,BouncingBehavior,AutoRotationBehavior} from 'babylonjs/cameraBehaviors';
import {NullEngineOptions,NullEngine} from 'babylonjs/nullEngine';
import {TextureTools} from 'babylonjs/textureTools';
import {SolidParticle,ModelShape,DepthSortedParticle,SolidParticleSystem} from 'babylonjs/solidParticles';
import {Collider,CollisionWorker,ICollisionCoordinator,SerializedMesh,SerializedSubMesh,SerializedGeometry,BabylonMessage,SerializedColliderToWorker,WorkerTaskType,WorkerReply,CollisionReplyPayload,InitPayload,CollidePayload,UpdatePayload,WorkerReplyType,CollisionCoordinatorWorker,CollisionCoordinatorLegacy} from 'babylonjs/collisions';
import {IntersectionInfo,PickingInfo,Ray} from 'babylonjs/picking';
import {SpriteManager,Sprite} from 'babylonjs/sprites';
import {AnimationRange,AnimationEvent,PathCursor,Animation,TargetedAnimation,AnimationGroup,RuntimeAnimation,Animatable,IEasingFunction,EasingFunction,CircleEase,BackEase,BounceEase,CubicEase,ElasticEase,ExponentialEase,PowerEase,QuadraticEase,QuarticEase,QuinticEase,SineEase,BezierCurveEase} from 'babylonjs/animations';
import {Condition,ValueCondition,PredicateCondition,StateCondition,Action,ActionEvent,ActionManager,InterpolateValueAction,SwitchBooleanAction,SetStateAction,SetValueAction,IncrementValueAction,PlayAnimationAction,StopAnimationAction,DoNothingAction,CombineAction,ExecuteCodeAction,SetParentAction,PlaySoundAction,StopSoundAction} from 'babylonjs/actions';
import {GroundMesh,InstancedMesh,LinesMesh} from 'babylonjs/additionalMeshes';
import {ShaderMaterial} from 'babylonjs/shaderMaterial';
import {MeshBuilder} from 'babylonjs/meshBuilder';
import {PBRBaseMaterial,PBRBaseSimpleMaterial,PBRMaterial,PBRMetallicRoughnessMaterial,PBRSpecularGlossinessMaterial} from 'babylonjs/pbrMaterial';
import {CameraInputTypes,ICameraInput,CameraInputsMap,CameraInputsManager,TargetCamera} from 'babylonjs/targetCamera';
import {ArcRotateCameraKeyboardMoveInput,ArcRotateCameraMouseWheelInput,ArcRotateCameraPointersInput,ArcRotateCameraInputsManager,ArcRotateCamera} from 'babylonjs/arcRotateCamera';
import {FreeCameraMouseInput,FreeCameraKeyboardMoveInput,FreeCameraInputsManager,FreeCamera} from 'babylonjs/freeCamera';
import {HemisphericLight} from 'babylonjs/hemisphericLight';
import {IShadowLight,ShadowLight,PointLight} from 'babylonjs/pointLight';
import {DirectionalLight} from 'babylonjs/directionalLight';
import {SpotLight} from 'babylonjs/spotLight';
import {CubeTexture,RenderTargetTexture,IMultiRenderTargetOptions,MultiRenderTarget,MirrorTexture,RefractionTexture,DynamicTexture,VideoTexture,RawTexture} from 'babylonjs/additionalTextures';
import {AudioEngine,Sound,SoundTrack,Analyser} from 'babylonjs/audio';
import {ILoadingScreen,DefaultLoadingScreen,SceneLoaderProgressEvent,ISceneLoaderPluginExtensions,ISceneLoaderPluginFactory,ISceneLoaderPlugin,ISceneLoaderPluginAsync,SceneLoader,FilesInput} from 'babylonjs/loader';
import {IShadowGenerator,ShadowGenerator} from 'babylonjs/shadows';
import {StringDictionary} from 'babylonjs/stringDictionary';
import {Tags,AndOrNotEvaluator} from 'babylonjs/userData';
import {FresnelParameters} from 'babylonjs/fresnel';
import {MultiMaterial} from 'babylonjs/multiMaterial';
import {Database} from 'babylonjs/offline';
import {FreeCameraTouchInput,TouchCamera} from 'babylonjs/touchCamera';
import {ProceduralTexture,CustomProceduralTexture} from 'babylonjs/procedural';
import {FreeCameraGamepadInput,ArcRotateCameraGamepadInput,GamepadManager,StickValues,GamepadButtonChanges,Gamepad,GenericPad,Xbox360Button,Xbox360Dpad,Xbox360Pad,PoseEnabledControllerType,MutableGamepadButton,ExtendedGamepadButton,PoseEnabledControllerHelper,PoseEnabledController,WebVRController,OculusTouchController,ViveController,GenericController,WindowsMotionController} from 'babylonjs/gamepad';
import {FollowCamera,ArcFollowCamera,UniversalCamera,GamepadCamera} from 'babylonjs/additionalCameras';
import {DepthRenderer} from 'babylonjs/depthRenderer';
import {GeometryBufferRenderer} from 'babylonjs/geometryBufferRenderer';
import {PostProcessOptions,PostProcess,PassPostProcess} from 'babylonjs/postProcesses';
import {BlurPostProcess} from 'babylonjs/additionalPostProcess_blur';
import {FxaaPostProcess} from 'babylonjs/additionalPostProcess_fxaa';
import {HighlightsPostProcess} from 'babylonjs/additionalPostProcess_highlights';
import {RefractionPostProcess,BlackAndWhitePostProcess,ConvolutionPostProcess,FilterPostProcess,VolumetricLightScatteringPostProcess,ColorCorrectionPostProcess,TonemappingOperator,TonemapPostProcess,DisplayPassPostProcess,ImageProcessingPostProcess} from 'babylonjs/additionalPostProcesses';
import {PostProcessRenderPipelineManager,PostProcessRenderPass,PostProcessRenderEffect,PostProcessRenderPipeline} from 'babylonjs/renderingPipeline';
import {SSAORenderingPipeline,SSAO2RenderingPipeline,LensRenderingPipeline,StandardRenderingPipeline} from 'babylonjs/additionalRenderingPipeline';
import {DefaultRenderingPipeline} from 'babylonjs/defaultRenderingPipeline';
import {Bone,BoneIKController,BoneLookController,Skeleton} from 'babylonjs/bones';
import {SphericalPolynomial,SphericalHarmonics,CubeMapToSphericalPolynomialTools,CubeMapInfo,PanoramaToCubeMapTools,HDRInfo,HDRTools,HDRCubeTexture} from 'babylonjs/hdr';
import {CSG} from 'babylonjs/csg';
import {Polygon,PolygonMeshBuilder} from 'babylonjs/polygonMesh';
import {LensFlare,LensFlareSystem} from 'babylonjs/lensFlares';
import {PhysicsJointData,PhysicsJoint,DistanceJoint,MotorEnabledJoint,HingeJoint,Hinge2Joint,IMotorEnabledJoint,DistanceJointData,SpringJointData,PhysicsImpostorParameters,IPhysicsEnabledObject,PhysicsImpostor,PhysicsImpostorJoint,PhysicsEngine,IPhysicsEnginePlugin,PhysicsHelper,PhysicsRadialExplosionEvent,PhysicsGravitationalFieldEvent,PhysicsUpdraftEvent,PhysicsVortexEvent,PhysicsRadialImpulseFalloff,PhysicsUpdraftMode,PhysicsForceAndContactPoint,PhysicsRadialExplosionEventData,PhysicsGravitationalFieldEventData,PhysicsUpdraftEventData,PhysicsVortexEventData,CannonJSPlugin,OimoJSPlugin} from 'babylonjs/physics';
import {TGATools,DDSInfo,DDSTools,KhronosTextureContainer} from 'babylonjs/textureFormats';
import {Debug,RayHelper,DebugLayer,BoundingBoxRenderer} from 'babylonjs/debug';
import {MorphTarget,MorphTargetManager} from 'babylonjs/morphTargets';
import {IOctreeContainer,Octree,OctreeBlock} from 'babylonjs/octrees';
import {SIMDHelper} from 'babylonjs/simd';
import {JoystickAxis,VirtualJoystick,VirtualJoysticksCamera,FreeCameraVirtualJoystickInput} from 'babylonjs/virtualJoystick';
import {ISimplifier,ISimplificationSettings,SimplificationSettings,ISimplificationTask,SimplificationQueue,SimplificationType,DecimationTriangle,DecimationVertex,QuadraticMatrix,Reference,QuadraticErrorSimplification,MeshLODLevel,SceneOptimization,TextureOptimization,HardwareScalingOptimization,ShadowsOptimization,PostProcessesOptimization,LensFlaresOptimization,ParticlesOptimization,RenderTargetsOptimization,MergeMeshesOptimization,SceneOptimizerOptions,SceneOptimizer} from 'babylonjs/optimizations';
import {OutlineRenderer,EdgesRenderer,IHighlightLayerOptions,HighlightLayer} from 'babylonjs/highlights';
import {SceneSerializer} from 'babylonjs/serialization';
import {AssetTaskState,AbstractAssetTask,IAssetsProgressEvent,AssetsProgressEvent,MeshAssetTask,TextFileAssetTask,BinaryFileAssetTask,ImageAssetTask,ITextureAssetTask,TextureAssetTask,CubeTextureAssetTask,HDRCubeTextureAssetTask,AssetsManager} from 'babylonjs/assetsManager';
import {ReflectionProbe} from 'babylonjs/probes';
import {BackgroundMaterial} from 'babylonjs/backgroundMaterial';
import {Layer} from 'babylonjs/layer';
import {IEnvironmentHelperOptions,EnvironmentHelper} from 'babylonjs/environmentHelper';
