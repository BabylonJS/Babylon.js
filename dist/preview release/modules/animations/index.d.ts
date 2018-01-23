declare module 'babylonjs/animations' {
    class AnimationRange {
        name: string;
        from: number;
        to: number;
        constructor(name: string, from: number, to: number);
        clone(): AnimationRange;
    }
    /**
     * Composed of a frame, and an action function
     */
    class AnimationEvent {
        frame: number;
        action: () => void;
        onlyOnce: boolean | undefined;
        isDone: boolean;
        constructor(frame: number, action: () => void, onlyOnce?: boolean | undefined);
    }
    class PathCursor {
        private path;
        private _onchange;
        value: number;
        animations: Animation[];
        constructor(path: Path2);
        getPoint(): Vector3;
        moveAhead(step?: number): PathCursor;
        moveBack(step?: number): PathCursor;
        move(step: number): PathCursor;
        private ensureLimits();
        private raiseOnChange();
        onchange(f: (cursor: PathCursor) => void): PathCursor;
    }
    class Animation {
        name: string;
        targetProperty: string;
        framePerSecond: number;
        dataType: number;
        loopMode: number | undefined;
        enableBlending: boolean | undefined;
        static AllowMatricesInterpolation: boolean;
        private _keys;
        private _easingFunction;
        _runtimeAnimations: RuntimeAnimation[];
        private _events;
        targetPropertyPath: string[];
        blendingSpeed: number;
        private _ranges;
        static _PrepareAnimation(name: string, targetProperty: string, framePerSecond: number, totalFrame: number, from: any, to: any, loopMode?: number, easingFunction?: EasingFunction): Nullable<Animation>;
        /**
         * Sets up an animation.
         * @param property the property to animate
         * @param animationType the animation type to apply
         * @param easingFunction the easing function used in the animation
         * @returns The created animation
         */
        static CreateAnimation(property: string, animationType: number, framePerSecond: number, easingFunction: EasingFunction): Animation;
        /**
         * Create and start an animation on a node
         * @param {string} name defines the name of the global animation that will be run on all nodes
         * @param {BABYLON.Node} node defines the root node where the animation will take place
         * @param {string} targetProperty defines property to animate
         * @param {number} framePerSecond defines the number of frame per second yo use
         * @param {number} totalFrame defines the number of frames in total
         * @param {any} from defines the initial value
         * @param {any} to defines the final value
         * @param {number} loopMode defines which loop mode you want to use (off by default)
         * @param {BABYLON.EasingFunction} easingFunction defines the easing function to use (linear by default)
         * @param onAnimationEnd defines the callback to call when animation end
         * @returns the animatable created for this animation
         */
        static CreateAndStartAnimation(name: string, node: Node, targetProperty: string, framePerSecond: number, totalFrame: number, from: any, to: any, loopMode?: number, easingFunction?: EasingFunction, onAnimationEnd?: () => void): Nullable<Animatable>;
        /**
         * Create and start an animation on a node and its descendants
         * @param {string} name defines the name of the global animation that will be run on all nodes
         * @param {BABYLON.Node} node defines the root node where the animation will take place
         * @param {boolean} directDescendantsOnly if true only direct descendants will be used, if false direct and also indirect (children of children, an so on in a recursive manner) descendants will be used.
         * @param {string} targetProperty defines property to animate
         * @param {number} framePerSecond defines the number of frame per second yo use
         * @param {number} totalFrame defines the number of frames in total
         * @param {any} from defines the initial value
         * @param {any} to defines the final value
         * @param {number} loopMode defines which loop mode you want to use (off by default)
         * @param {BABYLON.EasingFunction} easingFunction defines the easing function to use (linear by default)
         * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @returns the list of animatables created for all nodes
         * @example https://www.babylonjs-playground.com/#MH0VLI
         */
        static CreateAndStartHierarchyAnimation(name: string, node: Node, directDescendantsOnly: boolean, targetProperty: string, framePerSecond: number, totalFrame: number, from: any, to: any, loopMode?: number, easingFunction?: EasingFunction, onAnimationEnd?: () => void): Nullable<Animatable[]>;
        static CreateMergeAndStartAnimation(name: string, node: Node, targetProperty: string, framePerSecond: number, totalFrame: number, from: any, to: any, loopMode?: number, easingFunction?: EasingFunction, onAnimationEnd?: () => void): Nullable<Animatable>;
        /**
         * Transition property of the Camera to the target Value.
         * @param property The property to transition
         * @param targetValue The target Value of the property
         * @param host The object where the property to animate belongs
         * @param scene Scene used to run the animation
         * @param frameRate Framerate (in frame/s) to use
         * @param transition The transition type we want to use
         * @param duration The duration of the animation, in milliseconds
         * @param onAnimationEnd Call back trigger at the end of the animation.
         */
        static TransitionTo(property: string, targetValue: any, host: any, scene: Scene, frameRate: number, transition: Animation, duration: number, onAnimationEnd?: Nullable<() => void>): Nullable<Animatable>;
        /**
         * Return the array of runtime animations currently using this animation
         */
        readonly runtimeAnimations: RuntimeAnimation[];
        readonly hasRunningRuntimeAnimations: boolean;
        constructor(name: string, targetProperty: string, framePerSecond: number, dataType: number, loopMode?: number | undefined, enableBlending?: boolean | undefined);
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        toString(fullDetails?: boolean): string;
        /**
         * Add an event to this animation.
         */
        addEvent(event: AnimationEvent): void;
        /**
         * Remove all events found at the given frame
         * @param frame
         */
        removeEvents(frame: number): void;
        getEvents(): AnimationEvent[];
        createRange(name: string, from: number, to: number): void;
        deleteRange(name: string, deleteFrames?: boolean): void;
        getRange(name: string): Nullable<AnimationRange>;
        getKeys(): Array<{
            frame: number;
            value: any;
            inTangent?: any;
            outTangent?: any;
        }>;
        getHighestFrame(): number;
        getEasingFunction(): IEasingFunction;
        setEasingFunction(easingFunction: EasingFunction): void;
        floatInterpolateFunction(startValue: number, endValue: number, gradient: number): number;
        floatInterpolateFunctionWithTangents(startValue: number, outTangent: number, endValue: number, inTangent: number, gradient: number): number;
        quaternionInterpolateFunction(startValue: Quaternion, endValue: Quaternion, gradient: number): Quaternion;
        quaternionInterpolateFunctionWithTangents(startValue: Quaternion, outTangent: Quaternion, endValue: Quaternion, inTangent: Quaternion, gradient: number): Quaternion;
        vector3InterpolateFunction(startValue: Vector3, endValue: Vector3, gradient: number): Vector3;
        vector3InterpolateFunctionWithTangents(startValue: Vector3, outTangent: Vector3, endValue: Vector3, inTangent: Vector3, gradient: number): Vector3;
        vector2InterpolateFunction(startValue: Vector2, endValue: Vector2, gradient: number): Vector2;
        vector2InterpolateFunctionWithTangents(startValue: Vector2, outTangent: Vector2, endValue: Vector2, inTangent: Vector2, gradient: number): Vector2;
        sizeInterpolateFunction(startValue: Size, endValue: Size, gradient: number): Size;
        color3InterpolateFunction(startValue: Color3, endValue: Color3, gradient: number): Color3;
        matrixInterpolateFunction(startValue: Matrix, endValue: Matrix, gradient: number): Matrix;
        clone(): Animation;
        setKeys(values: Array<{
            frame: number;
            value: any;
        }>): void;
        serialize(): any;
        private static _ANIMATIONTYPE_FLOAT;
        private static _ANIMATIONTYPE_VECTOR3;
        private static _ANIMATIONTYPE_QUATERNION;
        private static _ANIMATIONTYPE_MATRIX;
        private static _ANIMATIONTYPE_COLOR3;
        private static _ANIMATIONTYPE_VECTOR2;
        private static _ANIMATIONTYPE_SIZE;
        private static _ANIMATIONLOOPMODE_RELATIVE;
        private static _ANIMATIONLOOPMODE_CYCLE;
        private static _ANIMATIONLOOPMODE_CONSTANT;
        static readonly ANIMATIONTYPE_FLOAT: number;
        static readonly ANIMATIONTYPE_VECTOR3: number;
        static readonly ANIMATIONTYPE_VECTOR2: number;
        static readonly ANIMATIONTYPE_SIZE: number;
        static readonly ANIMATIONTYPE_QUATERNION: number;
        static readonly ANIMATIONTYPE_MATRIX: number;
        static readonly ANIMATIONTYPE_COLOR3: number;
        static readonly ANIMATIONLOOPMODE_RELATIVE: number;
        static readonly ANIMATIONLOOPMODE_CYCLE: number;
        static readonly ANIMATIONLOOPMODE_CONSTANT: number;
        static Parse(parsedAnimation: any): Animation;
        static AppendSerializedAnimations(source: IAnimatable, destination: any): any;
    }
}

declare module 'babylonjs/animations' {
    /**
     * This class defines the direct association between an animation and a target
     */
    class TargetedAnimation {
        animation: Animation;
        target: any;
    }
    /**
     * Use this class to create coordinated animations on multiple targets
     */
    class AnimationGroup implements IDisposable {
        name: string;
        private _scene;
        private _targetedAnimations;
        private _animatables;
        private _from;
        private _to;
        private _isStarted;
        private _speedRatio;
        onAnimationEndObservable: Observable<TargetedAnimation>;
        /**
         * Define if the animations are started
         */
        readonly isStarted: boolean;
        /**
         * Gets or sets the speed ratio to use for all animations
         */
        /**
         * Gets or sets the speed ratio to use for all animations
         */
        speedRatio: number;
        constructor(name: string, scene?: Nullable<Scene>);
        /**
         * Add an animation (with its target) in the group
         * @param animation defines the animation we want to add
         * @param target defines the target of the animation
         * @returns the {BABYLON.TargetedAnimation} object
         */
        addTargetedAnimation(animation: Animation, target: any): TargetedAnimation;
        /**
         * This function will normalize every animation in the group to make sure they all go from beginFrame to endFrame
         * It can add constant keys at begin or end
         * @param beginFrame defines the new begin frame for all animations. It can't be bigger than the smaller begin frame of all animations
         * @param endFrame defines the new end frame for all animations. It can't be smaller than the larger end frame of all animations
         */
        normalize(beginFrame: number, endFrame: number): AnimationGroup;
        /**
         * Start all animations on given targets
         * @param loop defines if animations must loop
         * @param speedRatio defines the ratio to apply to animation speed (1 by default)
         */
        start(loop?: boolean, speedRatio?: number): AnimationGroup;
        /**
         * Pause all animations
         */
        pause(): AnimationGroup;
        /**
         * Play all animations to initial state
         * This function will start() the animations if they were not started or will restart() them if they were paused
         * @param loop defines if animations must loop
         */
        play(loop?: boolean): AnimationGroup;
        /**
         * Reset all animations to initial state
         */
        reset(): AnimationGroup;
        /**
         * Restart animations from key 0
         */
        restart(): AnimationGroup;
        /**
         * Stop all animations
         */
        stop(): AnimationGroup;
        /**
         * Dispose all associated resources
         */
        dispose(): void;
    }
}

declare module 'babylonjs/animations' {
    class RuntimeAnimation {
        currentFrame: number;
        private _animation;
        private _target;
        private _originalBlendValue;
        private _offsetsCache;
        private _highLimitsCache;
        private _stopped;
        private _blendingFactor;
        constructor(target: any, animation: Animation);
        readonly animation: Animation;
        reset(): void;
        isStopped(): boolean;
        dispose(): void;
        private _getKeyValue(value);
        private _interpolate(currentFrame, repeatCount, loopMode?, offsetValue?, highLimitValue?);
        setValue(currentValue: any, blend?: boolean): void;
        goToFrame(frame: number): void;
        _prepareForSpeedRatioChange(newSpeedRatio: number): void;
        private _ratioOffset;
        private _previousDelay;
        private _previousRatio;
        animate(delay: number, from: number, to: number, loop: boolean, speedRatio: number, blend?: boolean): boolean;
    }
}

declare module 'babylonjs/animations' {
    class Animatable {
        target: any;
        fromFrame: number;
        toFrame: number;
        loopAnimation: boolean;
        onAnimationEnd: (() => void) | null | undefined;
        private _localDelayOffset;
        private _pausedDelay;
        private _runtimeAnimations;
        private _paused;
        private _scene;
        private _speedRatio;
        animationStarted: boolean;
        speedRatio: number;
        constructor(scene: Scene, target: any, fromFrame?: number, toFrame?: number, loopAnimation?: boolean, speedRatio?: number, onAnimationEnd?: (() => void) | null | undefined, animations?: any);
        getAnimations(): RuntimeAnimation[];
        appendAnimations(target: any, animations: Animation[]): void;
        getAnimationByTargetProperty(property: string): Nullable<Animation>;
        getRuntimeAnimationByTargetProperty(property: string): Nullable<RuntimeAnimation>;
        reset(): void;
        enableBlending(blendingSpeed: number): void;
        disableBlending(): void;
        goToFrame(frame: number): void;
        pause(): void;
        restart(): void;
        stop(animationName?: string): void;
        _animate(delay: number): boolean;
    }
}

declare module 'babylonjs/animations' {
    interface IEasingFunction {
        ease(gradient: number): number;
    }
    class EasingFunction implements IEasingFunction {
        private static _EASINGMODE_EASEIN;
        private static _EASINGMODE_EASEOUT;
        private static _EASINGMODE_EASEINOUT;
        static readonly EASINGMODE_EASEIN: number;
        static readonly EASINGMODE_EASEOUT: number;
        static readonly EASINGMODE_EASEINOUT: number;
        private _easingMode;
        setEasingMode(easingMode: number): void;
        getEasingMode(): number;
        easeInCore(gradient: number): number;
        ease(gradient: number): number;
    }
    class CircleEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class BackEase extends EasingFunction implements IEasingFunction {
        amplitude: number;
        constructor(amplitude?: number);
        easeInCore(gradient: number): number;
    }
    class BounceEase extends EasingFunction implements IEasingFunction {
        bounces: number;
        bounciness: number;
        constructor(bounces?: number, bounciness?: number);
        easeInCore(gradient: number): number;
    }
    class CubicEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class ElasticEase extends EasingFunction implements IEasingFunction {
        oscillations: number;
        springiness: number;
        constructor(oscillations?: number, springiness?: number);
        easeInCore(gradient: number): number;
    }
    class ExponentialEase extends EasingFunction implements IEasingFunction {
        exponent: number;
        constructor(exponent?: number);
        easeInCore(gradient: number): number;
    }
    class PowerEase extends EasingFunction implements IEasingFunction {
        power: number;
        constructor(power?: number);
        easeInCore(gradient: number): number;
    }
    class QuadraticEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class QuarticEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class QuinticEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class SineEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class BezierCurveEase extends EasingFunction implements IEasingFunction {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        constructor(x1?: number, y1?: number, x2?: number, y2?: number);
        easeInCore(gradient: number): number;
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
