declare module 'babylonjs/gamepad' {
    class FreeCameraGamepadInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;
        gamepad: Nullable<Gamepad>;
        private _onGamepadConnectedObserver;
        private _onGamepadDisconnectedObserver;
        gamepadAngularSensibility: number;
        gamepadMoveSensibility: number;
        private _cameraTransform;
        private _deltaTransform;
        private _vector3;
        private _vector2;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: Nullable<HTMLElement>): void;
        checkInputs(): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module 'babylonjs/gamepad' {
    class ArcRotateCameraGamepadInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        gamepad: Nullable<Gamepad>;
        private _onGamepadConnectedObserver;
        private _onGamepadDisconnectedObserver;
        gamepadRotationSensibility: number;
        gamepadMoveSensibility: number;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: Nullable<HTMLElement>): void;
        checkInputs(): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module 'babylonjs/gamepad' {
    class GamepadManager {
        private _scene;
        private _babylonGamepads;
        private _oneGamepadConnected;
        _isMonitoring: boolean;
        private _gamepadEventSupported;
        private _gamepadSupport;
        onGamepadConnectedObservable: Observable<Gamepad>;
        onGamepadDisconnectedObservable: Observable<Gamepad>;
        private _onGamepadConnectedEvent;
        private _onGamepadDisconnectedEvent;
        constructor(_scene?: Scene | undefined);
        readonly gamepads: Gamepad[];
        getGamepadByType(type?: number): Nullable<Gamepad>;
        dispose(): void;
        private _addNewGamepad(gamepad);
        private _startMonitoringGamepads();
        private _stopMonitoringGamepads();
        _checkGamepadsStatus(): void;
        private _updateGamepadObjects();
    }
}

declare module 'babylonjs/gamepad' {
    class StickValues {
        x: number;
        y: number;
        constructor(x: number, y: number);
    }
    interface GamepadButtonChanges {
        changed: boolean;
        pressChanged: boolean;
        touchChanged: boolean;
        valueChanged: boolean;
    }
    class Gamepad {
        id: string;
        index: number;
        browserGamepad: any;
        type: number;
        private _leftStick;
        private _rightStick;
        _isConnected: boolean;
        private _leftStickAxisX;
        private _leftStickAxisY;
        private _rightStickAxisX;
        private _rightStickAxisY;
        private _onleftstickchanged;
        private _onrightstickchanged;
        static GAMEPAD: number;
        static GENERIC: number;
        static XBOX: number;
        static POSE_ENABLED: number;
        protected _invertLeftStickY: boolean;
        readonly isConnected: boolean;
        constructor(id: string, index: number, browserGamepad: any, leftStickX?: number, leftStickY?: number, rightStickX?: number, rightStickY?: number);
        onleftstickchanged(callback: (values: StickValues) => void): void;
        onrightstickchanged(callback: (values: StickValues) => void): void;
        leftStick: StickValues;
        rightStick: StickValues;
        update(): void;
        dispose(): void;
    }
    class GenericPad extends Gamepad {
        private _buttons;
        private _onbuttondown;
        private _onbuttonup;
        onButtonDownObservable: Observable<number>;
        onButtonUpObservable: Observable<number>;
        onbuttondown(callback: (buttonPressed: number) => void): void;
        onbuttonup(callback: (buttonReleased: number) => void): void;
        constructor(id: string, index: number, browserGamepad: any);
        private _setButtonValue(newValue, currentValue, buttonIndex);
        update(): void;
        dispose(): void;
    }
}

declare module 'babylonjs/gamepad' {
    enum Xbox360Button {
        A = 0,
        B = 1,
        X = 2,
        Y = 3,
        Start = 4,
        Back = 5,
        LB = 6,
        RB = 7,
        LeftStick = 8,
        RightStick = 9,
    }
    enum Xbox360Dpad {
        Up = 0,
        Down = 1,
        Left = 2,
        Right = 3,
    }
    class Xbox360Pad extends Gamepad {
        private _leftTrigger;
        private _rightTrigger;
        private _onlefttriggerchanged;
        private _onrighttriggerchanged;
        private _onbuttondown;
        private _onbuttonup;
        private _ondpaddown;
        private _ondpadup;
        onButtonDownObservable: Observable<Xbox360Button>;
        onButtonUpObservable: Observable<Xbox360Button>;
        onPadDownObservable: Observable<Xbox360Dpad>;
        onPadUpObservable: Observable<Xbox360Dpad>;
        private _buttonA;
        private _buttonB;
        private _buttonX;
        private _buttonY;
        private _buttonBack;
        private _buttonStart;
        private _buttonLB;
        private _buttonRB;
        private _buttonLeftStick;
        private _buttonRightStick;
        private _dPadUp;
        private _dPadDown;
        private _dPadLeft;
        private _dPadRight;
        private _isXboxOnePad;
        constructor(id: string, index: number, gamepad: any, xboxOne?: boolean);
        onlefttriggerchanged(callback: (value: number) => void): void;
        onrighttriggerchanged(callback: (value: number) => void): void;
        leftTrigger: number;
        rightTrigger: number;
        onbuttondown(callback: (buttonPressed: Xbox360Button) => void): void;
        onbuttonup(callback: (buttonReleased: Xbox360Button) => void): void;
        ondpaddown(callback: (dPadPressed: Xbox360Dpad) => void): void;
        ondpadup(callback: (dPadReleased: Xbox360Dpad) => void): void;
        private _setButtonValue(newValue, currentValue, buttonType);
        private _setDPadValue(newValue, currentValue, buttonType);
        buttonA: number;
        buttonB: number;
        buttonX: number;
        buttonY: number;
        buttonStart: number;
        buttonBack: number;
        buttonLB: number;
        buttonRB: number;
        buttonLeftStick: number;
        buttonRightStick: number;
        dPadUp: number;
        dPadDown: number;
        dPadLeft: number;
        dPadRight: number;
        update(): void;
        dispose(): void;
    }
}

declare module 'babylonjs/gamepad' {
    enum PoseEnabledControllerType {
        VIVE = 0,
        OCULUS = 1,
        WINDOWS = 2,
        GENERIC = 3,
    }
    interface MutableGamepadButton {
        value: number;
        touched: boolean;
        pressed: boolean;
    }
    interface ExtendedGamepadButton extends GamepadButton {
        readonly pressed: boolean;
        readonly touched: boolean;
        readonly value: number;
    }
    class PoseEnabledControllerHelper {
        static InitiateController(vrGamepad: any): OculusTouchController | WindowsMotionController | ViveController | GenericController;
    }
    class PoseEnabledController extends Gamepad implements PoseControlled {
        private _deviceRoomPosition;
        private _deviceRoomRotationQuaternion;
        devicePosition: Vector3;
        deviceRotationQuaternion: Quaternion;
        deviceScaleFactor: number;
        position: Vector3;
        rotationQuaternion: Quaternion;
        controllerType: PoseEnabledControllerType;
        private _calculatedPosition;
        private _calculatedRotation;
        rawPose: DevicePose;
        _mesh: Nullable<AbstractMesh>;
        private _poseControlledCamera;
        private _leftHandSystemQuaternion;
        _deviceToWorld: Matrix;
        constructor(browserGamepad: any);
        private _workingMatrix;
        update(): void;
        updateFromDevice(poseData: DevicePose): void;
        attachToMesh(mesh: AbstractMesh): void;
        attachToPoseControlledCamera(camera: TargetCamera): void;
        dispose(): void;
        readonly mesh: Nullable<AbstractMesh>;
        getForwardRay(length?: number): Ray;
    }
}

declare module 'babylonjs/gamepad' {
    abstract class WebVRController extends PoseEnabledController {
        protected _defaultModel: AbstractMesh;
        onTriggerStateChangedObservable: Observable<ExtendedGamepadButton>;
        onMainButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        onSecondaryButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        onPadStateChangedObservable: Observable<ExtendedGamepadButton>;
        onPadValuesChangedObservable: Observable<StickValues>;
        protected _buttons: Array<MutableGamepadButton>;
        private _onButtonStateChange;
        onButtonStateChange(callback: (controlledIndex: number, buttonIndex: number, state: ExtendedGamepadButton) => void): void;
        pad: StickValues;
        hand: string;
        readonly defaultModel: AbstractMesh;
        constructor(vrGamepad: any);
        update(): void;
        protected abstract handleButtonChange(buttonIdx: number, value: ExtendedGamepadButton, changes: GamepadButtonChanges): void;
        abstract initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void): void;
        private _setButtonValue(newState, currentState, buttonIndex);
        private _changes;
        private _checkChanges(newState, currentState);
        dispose(): void;
    }
}

declare module 'babylonjs/gamepad' {
    class OculusTouchController extends WebVRController {
        static MODEL_BASE_URL: string;
        static MODEL_LEFT_FILENAME: string;
        static MODEL_RIGHT_FILENAME: string;
        onSecondaryTriggerStateChangedObservable: Observable<ExtendedGamepadButton>;
        onThumbRestChangedObservable: Observable<ExtendedGamepadButton>;
        constructor(vrGamepad: any);
        initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void): void;
        readonly onAButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onBButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onXButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onYButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges): void;
    }
}

declare module 'babylonjs/gamepad' {
    class ViveController extends WebVRController {
        static MODEL_BASE_URL: string;
        static MODEL_FILENAME: string;
        constructor(vrGamepad: any);
        initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void): void;
        readonly onLeftButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onRightButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onMenuButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        /**
         * Vive mapping:
         * 0: touchpad
         * 1: trigger
         * 2: left AND right buttons
         * 3: menu button
         */
        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges): void;
    }
}

declare module 'babylonjs/gamepad' {
    class GenericController extends WebVRController {
        static readonly MODEL_BASE_URL: string;
        static readonly MODEL_FILENAME: string;
        constructor(vrGamepad: any);
        initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void): void;
        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges): void;
    }
}

declare module 'babylonjs/gamepad' {
    class WindowsMotionController extends WebVRController {
        static MODEL_BASE_URL: string;
        static MODEL_LEFT_FILENAME: string;
        static MODEL_RIGHT_FILENAME: string;
        static readonly GAMEPAD_ID_PREFIX: string;
        private static readonly GAMEPAD_ID_PATTERN;
        private _loadedMeshInfo;
        private readonly _mapping;
        onTrackpadChangedObservable: Observable<ExtendedGamepadButton>;
        onTrackpadValuesChangedObservable: Observable<StickValues>;
        trackpad: StickValues;
        constructor(vrGamepad: any);
        readonly onTriggerButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onMenuButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onGripButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onThumbstickButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onTouchpadButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onTouchpadValuesChangedObservable: Observable<StickValues>;
        /**
         * Called once per frame by the engine.
         */
        update(): void;
        /**
         * Called once for each button that changed state since the last frame
         * @param buttonIdx Which button index changed
         * @param state New state of the button
         * @param changes Which properties on the state changed since last frame
         */
        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges): void;
        protected lerpButtonTransform(buttonName: string, buttonValue: number): void;
        protected lerpAxisTransform(axis: number, axisValue: number): void;
        /**
         * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
         * @param scene scene in which to add meshes
         * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
         */
        initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void, forceDefault?: boolean): void;
        /**
         * Takes a list of meshes (as loaded from the glTF file) and finds the root node, as well as nodes that
         * can be transformed by button presses and axes values, based on this._mapping.
         *
         * @param scene scene in which the meshes exist
         * @param meshes list of meshes that make up the controller model to process
         * @return structured view of the given meshes, with mapping of buttons and axes to meshes that can be transformed.
         */
        private processModel(scene, meshes);
        private createMeshInfo(rootNode);
        getForwardRay(length?: number): Ray;
        dispose(): void;
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
import {VRDistortionCorrectionPostProcess,AnaglyphPostProcess,StereoscopicInterlacePostProcess,FreeCameraDeviceOrientationInput,ArcRotateCameraVRDeviceOrientationInput,VRCameraMetrics,DevicePose,PoseControlled,WebVROptions,WebVRFreeCamera,DeviceOrientationCamera,VRDeviceOrientationFreeCamera,VRDeviceOrientationGamepadCamera,VRDeviceOrientationArcRotateCamera,AnaglyphFreeCamera,AnaglyphArcRotateCamera,AnaglyphGamepadCamera,AnaglyphUniversalCamera,StereoscopicFreeCamera,StereoscopicArcRotateCamera,StereoscopicGamepadCamera,StereoscopicUniversalCamera,VRTeleportationOptions,VRExperienceHelperOptions,VRExperienceHelper} from 'babylonjs/vr';
import {JoystickAxis,VirtualJoystick,VirtualJoysticksCamera,FreeCameraVirtualJoystickInput} from 'babylonjs/virtualJoystick';
import {ISimplifier,ISimplificationSettings,SimplificationSettings,ISimplificationTask,SimplificationQueue,SimplificationType,DecimationTriangle,DecimationVertex,QuadraticMatrix,Reference,QuadraticErrorSimplification,MeshLODLevel,SceneOptimization,TextureOptimization,HardwareScalingOptimization,ShadowsOptimization,PostProcessesOptimization,LensFlaresOptimization,ParticlesOptimization,RenderTargetsOptimization,MergeMeshesOptimization,SceneOptimizerOptions,SceneOptimizer} from 'babylonjs/optimizations';
import {OutlineRenderer,EdgesRenderer,IHighlightLayerOptions,HighlightLayer} from 'babylonjs/highlights';
import {SceneSerializer} from 'babylonjs/serialization';
import {AssetTaskState,AbstractAssetTask,IAssetsProgressEvent,AssetsProgressEvent,MeshAssetTask,TextFileAssetTask,BinaryFileAssetTask,ImageAssetTask,ITextureAssetTask,TextureAssetTask,CubeTextureAssetTask,HDRCubeTextureAssetTask,AssetsManager} from 'babylonjs/assetsManager';
import {ReflectionProbe} from 'babylonjs/probes';
import {BackgroundMaterial} from 'babylonjs/backgroundMaterial';
import {Layer} from 'babylonjs/layer';
import {IEnvironmentHelperOptions,EnvironmentHelper} from 'babylonjs/environmentHelper';
