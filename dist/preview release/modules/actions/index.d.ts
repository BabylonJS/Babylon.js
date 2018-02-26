declare module 'babylonjs/actions' {
    class Condition {
        _actionManager: ActionManager;
        _evaluationId: number;
        _currentResult: boolean;
        constructor(actionManager: ActionManager);
        isValid(): boolean;
        _getProperty(propertyPath: string): string;
        _getEffectiveTarget(target: any, propertyPath: string): any;
        serialize(): any;
        protected _serialize(serializedCondition: any): any;
    }
    class ValueCondition extends Condition {
        propertyPath: string;
        value: any;
        operator: number;
        private static _IsEqual;
        private static _IsDifferent;
        private static _IsGreater;
        private static _IsLesser;
        static readonly IsEqual: number;
        static readonly IsDifferent: number;
        static readonly IsGreater: number;
        static readonly IsLesser: number;
        _actionManager: ActionManager;
        private _target;
        private _effectiveTarget;
        private _property;
        constructor(actionManager: ActionManager, target: any, propertyPath: string, value: any, operator?: number);
        isValid(): boolean;
        serialize(): any;
        static GetOperatorName(operator: number): string;
    }
    class PredicateCondition extends Condition {
        predicate: () => boolean;
        _actionManager: ActionManager;
        constructor(actionManager: ActionManager, predicate: () => boolean);
        isValid(): boolean;
    }
    class StateCondition extends Condition {
        value: string;
        _actionManager: ActionManager;
        private _target;
        constructor(actionManager: ActionManager, target: any, value: string);
        isValid(): boolean;
        serialize(): any;
    }
}

declare module 'babylonjs/actions' {
    class Action {
        triggerOptions: any;
        trigger: number;
        _actionManager: ActionManager;
        private _nextActiveAction;
        private _child;
        private _condition?;
        private _triggerParameter;
        onBeforeExecuteObservable: Observable<Action>;
        constructor(triggerOptions: any, condition?: Condition);
        _prepare(): void;
        getTriggerParameter(): any;
        _executeCurrent(evt?: ActionEvent): void;
        execute(evt?: ActionEvent): void;
        skipToNextActiveAction(): void;
        then(action: Action): Action;
        _getProperty(propertyPath: string): string;
        _getEffectiveTarget(target: any, propertyPath: string): any;
        serialize(parent: any): any;
        protected _serialize(serializedAction: any, parent?: any): any;
        static _SerializeValueAsString: (value: any) => string;
        static _GetTargetProperty: (target: Node | Scene) => {
            name: string;
            targetType: string;
            value: string;
        };
    }
}

declare module 'babylonjs/actions' {
    /**
     * ActionEvent is the event beint sent when an action is triggered.
     */
    class ActionEvent {
        source: any;
        pointerX: number;
        pointerY: number;
        meshUnderPointer: Nullable<AbstractMesh>;
        sourceEvent: any;
        additionalData: any;
        /**
         * @param source The mesh or sprite that triggered the action.
         * @param pointerX The X mouse cursor position at the time of the event
         * @param pointerY The Y mouse cursor position at the time of the event
         * @param meshUnderPointer The mesh that is currently pointed at (can be null)
         * @param sourceEvent the original (browser) event that triggered the ActionEvent
         */
        constructor(source: any, pointerX: number, pointerY: number, meshUnderPointer: Nullable<AbstractMesh>, sourceEvent?: any, additionalData?: any);
        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source The source mesh that triggered the event
         * @param evt {Event} The original (browser) event
         */
        static CreateNew(source: AbstractMesh, evt?: Event, additionalData?: any): ActionEvent;
        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source The source sprite that triggered the event
         * @param scene Scene associated with the sprite
         * @param evt {Event} The original (browser) event
         */
        static CreateNewFromSprite(source: Sprite, scene: Scene, evt?: Event, additionalData?: any): ActionEvent;
        /**
         * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
         * @param scene the scene where the event occurred
         * @param evt {Event} The original (browser) event
         */
        static CreateNewFromScene(scene: Scene, evt: Event): ActionEvent;
        static CreateNewFromPrimitive(prim: any, pointerPos: Vector2, evt?: Event, additionalData?: any): ActionEvent;
    }
    /**
     * Action Manager manages all events to be triggered on a given mesh or the global scene.
     * A single scene can have many Action Managers to handle predefined actions on specific meshes.
     */
    class ActionManager {
        private static _NothingTrigger;
        private static _OnPickTrigger;
        private static _OnLeftPickTrigger;
        private static _OnRightPickTrigger;
        private static _OnCenterPickTrigger;
        private static _OnPickDownTrigger;
        private static _OnDoublePickTrigger;
        private static _OnPickUpTrigger;
        private static _OnLongPressTrigger;
        private static _OnPointerOverTrigger;
        private static _OnPointerOutTrigger;
        private static _OnEveryFrameTrigger;
        private static _OnIntersectionEnterTrigger;
        private static _OnIntersectionExitTrigger;
        private static _OnKeyDownTrigger;
        private static _OnKeyUpTrigger;
        private static _OnPickOutTrigger;
        static readonly NothingTrigger: number;
        static readonly OnPickTrigger: number;
        static readonly OnLeftPickTrigger: number;
        static readonly OnRightPickTrigger: number;
        static readonly OnCenterPickTrigger: number;
        static readonly OnPickDownTrigger: number;
        static readonly OnDoublePickTrigger: number;
        static readonly OnPickUpTrigger: number;
        static readonly OnPickOutTrigger: number;
        static readonly OnLongPressTrigger: number;
        static readonly OnPointerOverTrigger: number;
        static readonly OnPointerOutTrigger: number;
        static readonly OnEveryFrameTrigger: number;
        static readonly OnIntersectionEnterTrigger: number;
        static readonly OnIntersectionExitTrigger: number;
        static readonly OnKeyDownTrigger: number;
        static readonly OnKeyUpTrigger: number;
        static Triggers: {
            [key: string]: number;
        };
        actions: Action[];
        hoverCursor: string;
        private _scene;
        constructor(scene: Scene);
        dispose(): void;
        getScene(): Scene;
        /**
         * Does this action manager handles actions of any of the given triggers
         * @param {number[]} triggers - the triggers to be tested
         * @return {boolean} whether one (or more) of the triggers is handeled
         */
        hasSpecificTriggers(triggers: number[]): boolean;
        /**
         * Does this action manager handles actions of a given trigger
         * @param {number} trigger - the trigger to be tested
         * @return {boolean} whether the trigger is handeled
         */
        hasSpecificTrigger(trigger: number): boolean;
        /**
         * Does this action manager has pointer triggers
         * @return {boolean} whether or not it has pointer triggers
         */
        readonly hasPointerTriggers: boolean;
        /**
         * Does this action manager has pick triggers
         * @return {boolean} whether or not it has pick triggers
         */
        readonly hasPickTriggers: boolean;
        /**
         * Does exist one action manager with at least one trigger
         * @return {boolean} whether or not it exists one action manager with one trigger
        **/
        static readonly HasTriggers: boolean;
        /**
         * Does exist one action manager with at least one pick trigger
         * @return {boolean} whether or not it exists one action manager with one pick trigger
        **/
        static readonly HasPickTriggers: boolean;
        /**
         * Does exist one action manager that handles actions of a given trigger
         * @param {number} trigger - the trigger to be tested
         * @return {boolean} whether the trigger is handeled by at least one action manager
        **/
        static HasSpecificTrigger(trigger: number): boolean;
        /**
         * Registers an action to this action manager
         * @param {BABYLON.Action} action - the action to be registered
         * @return {BABYLON.Action} the action amended (prepared) after registration
         */
        registerAction(action: Action): Nullable<Action>;
        /**
         * Process a specific trigger
         * @param {number} trigger - the trigger to process
         * @param evt {BABYLON.ActionEvent} the event details to be processed
         */
        processTrigger(trigger: number, evt?: ActionEvent): void;
        _getEffectiveTarget(target: any, propertyPath: string): any;
        _getProperty(propertyPath: string): string;
        serialize(name: string): any;
        static Parse(parsedActions: any, object: Nullable<AbstractMesh>, scene: Scene): void;
        static GetTriggerName(trigger: number): string;
    }
}

declare module 'babylonjs/actions' {
    class InterpolateValueAction extends Action {
        propertyPath: string;
        value: any;
        duration: number;
        stopOtherAnimations: boolean | undefined;
        onInterpolationDone: (() => void) | undefined;
        private _target;
        private _effectiveTarget;
        private _property;
        onInterpolationDoneObservable: Observable<InterpolateValueAction>;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, duration?: number, condition?: Condition, stopOtherAnimations?: boolean | undefined, onInterpolationDone?: (() => void) | undefined);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
}

declare module 'babylonjs/actions' {
    class SwitchBooleanAction extends Action {
        propertyPath: string;
        private _target;
        private _effectiveTarget;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class SetStateAction extends Action {
        value: string;
        private _target;
        constructor(triggerOptions: any, target: any, value: string, condition?: Condition);
        execute(): void;
        serialize(parent: any): any;
    }
    class SetValueAction extends Action {
        propertyPath: string;
        value: any;
        private _target;
        private _effectiveTarget;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class IncrementValueAction extends Action {
        propertyPath: string;
        value: any;
        private _target;
        private _effectiveTarget;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class PlayAnimationAction extends Action {
        from: number;
        to: number;
        loop: boolean | undefined;
        private _target;
        constructor(triggerOptions: any, target: any, from: number, to: number, loop?: boolean | undefined, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class StopAnimationAction extends Action {
        private _target;
        constructor(triggerOptions: any, target: any, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class DoNothingAction extends Action {
        constructor(triggerOptions?: any, condition?: Condition);
        execute(): void;
        serialize(parent: any): any;
    }
    class CombineAction extends Action {
        children: Action[];
        constructor(triggerOptions: any, children: Action[], condition?: Condition);
        _prepare(): void;
        execute(evt: ActionEvent): void;
        serialize(parent: any): any;
    }
    class ExecuteCodeAction extends Action {
        func: (evt: ActionEvent) => void;
        constructor(triggerOptions: any, func: (evt: ActionEvent) => void, condition?: Condition);
        execute(evt: ActionEvent): void;
    }
    class SetParentAction extends Action {
        private _parent;
        private _target;
        constructor(triggerOptions: any, target: any, parent: any, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class PlaySoundAction extends Action {
        private _sound;
        constructor(triggerOptions: any, sound: Sound, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class StopSoundAction extends Action {
        private _sound;
        constructor(triggerOptions: any, sound: Sound, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
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
