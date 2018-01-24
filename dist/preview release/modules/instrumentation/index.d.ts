interface WebGLRenderingContext {
    readonly RASTERIZER_DISCARD: number;
    readonly TEXTURE_3D: number;
    readonly TEXTURE_2D_ARRAY: number;
    readonly TEXTURE_WRAP_R: number;
    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ArrayBufferView | null): void;
    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ArrayBufferView, offset: number): void;
    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ImageBitmap | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): void;
    compressedTexImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, data: ArrayBufferView, offset?: number, length?: number): void;
    readonly TRANSFORM_FEEDBACK: number;
    readonly INTERLEAVED_ATTRIBS: number;
    readonly TRANSFORM_FEEDBACK_BUFFER: number;
    createTransformFeedback(): WebGLTransformFeedback;
    deleteTransformFeedback(transformFeedbac: WebGLTransformFeedback): void;
    bindTransformFeedback(target: number, transformFeedback: WebGLTransformFeedback | null): void;
    beginTransformFeedback(primitiveMode: number): void;
    endTransformFeedback(): void;
    transformFeedbackVaryings(program: WebGLProgram, varyings: string[], bufferMode: number): void;
}
export interface ImageBitmap {
    readonly width: number;
    readonly height: number;
    close(): void;
}
export interface WebGLQuery extends WebGLObject {
}
declare var WebGLQuery: {
    prototype: WebGLQuery;
    new (): WebGLQuery;
};
export interface WebGLSampler extends WebGLObject {
}
declare var WebGLSampler: {
    prototype: WebGLSampler;
    new (): WebGLSampler;
};
export interface WebGLSync extends WebGLObject {
}
declare var WebGLSync: {
    prototype: WebGLSync;
    new (): WebGLSync;
};
export interface WebGLTransformFeedback extends WebGLObject {
}
declare var WebGLTransformFeedback: {
    prototype: WebGLTransformFeedback;
    new (): WebGLTransformFeedback;
};
export interface WebGLVertexArrayObject extends WebGLObject {
}
declare var WebGLVertexArrayObject: {
    prototype: WebGLVertexArrayObject;
    new (): WebGLVertexArrayObject;
};

declare module 'babylonjs/instrumentation' {
    /**
     * This class can be used to get instrumentation data from a Babylon engine
     */
    class EngineInstrumentation implements IDisposable {
        engine: Engine;
        private _captureGPUFrameTime;
        private _gpuFrameTimeToken;
        private _gpuFrameTime;
        private _captureShaderCompilationTime;
        private _shaderCompilationTime;
        private _onBeginFrameObserver;
        private _onEndFrameObserver;
        private _onBeforeShaderCompilationObserver;
        private _onAfterShaderCompilationObserver;
        /**
         * Gets the perf counter used for GPU frame time
         */
        readonly gpuFrameTimeCounter: PerfCounter;
        /**
         * Gets the GPU frame time capture status
         */
        /**
         * Enable or disable the GPU frame time capture
         */
        captureGPUFrameTime: boolean;
        /**
         * Gets the perf counter used for shader compilation time
         */
        readonly shaderCompilationTimeCounter: PerfCounter;
        /**
         * Gets the shader compilation time capture status
         */
        /**
         * Enable or disable the shader compilation time capture
         */
        captureShaderCompilationTime: boolean;
        constructor(engine: Engine);
        dispose(): void;
    }
}

declare module 'babylonjs/instrumentation' {
    /**
     * This class can be used to get instrumentation data from a Babylon engine
     */
    class SceneInstrumentation implements IDisposable {
        scene: Scene;
        private _captureActiveMeshesEvaluationTime;
        private _activeMeshesEvaluationTime;
        private _captureRenderTargetsRenderTime;
        private _renderTargetsRenderTime;
        private _captureFrameTime;
        private _frameTime;
        private _captureRenderTime;
        private _renderTime;
        private _captureInterFrameTime;
        private _interFrameTime;
        private _captureParticlesRenderTime;
        private _particlesRenderTime;
        private _captureSpritesRenderTime;
        private _spritesRenderTime;
        private _capturePhysicsTime;
        private _physicsTime;
        private _captureAnimationsTime;
        private _animationsTime;
        private _onBeforeActiveMeshesEvaluationObserver;
        private _onAfterActiveMeshesEvaluationObserver;
        private _onBeforeRenderTargetsRenderObserver;
        private _onAfterRenderTargetsRenderObserver;
        private _onAfterRenderObserver;
        private _onBeforeDrawPhaseObserver;
        private _onAfterDrawPhaseObserver;
        private _onBeforeAnimationsObserver;
        private _onBeforeParticlesRenderingObserver;
        private _onAfterParticlesRenderingObserver;
        private _onBeforeSpritesRenderingObserver;
        private _onAfterSpritesRenderingObserver;
        private _onBeforePhysicsObserver;
        private _onAfterPhysicsObserver;
        private _onAfterAnimationsObserver;
        /**
         * Gets the perf counter used for active meshes evaluation time
         */
        readonly activeMeshesEvaluationTimeCounter: PerfCounter;
        /**
         * Gets the active meshes evaluation time capture status
         */
        /**
         * Enable or disable the active meshes evaluation time capture
         */
        captureActiveMeshesEvaluationTime: boolean;
        /**
         * Gets the perf counter used for render targets render time
         */
        readonly renderTargetsRenderTimeCounter: PerfCounter;
        /**
         * Gets the render targets render time capture status
         */
        /**
         * Enable or disable the render targets render time capture
         */
        captureRenderTargetsRenderTime: boolean;
        /**
         * Gets the perf counter used for particles render time
         */
        readonly particlesRenderTimeCounter: PerfCounter;
        /**
         * Gets the particles render time capture status
         */
        /**
         * Enable or disable the particles render time capture
         */
        captureParticlesRenderTime: boolean;
        /**
         * Gets the perf counter used for sprites render time
         */
        readonly spritesRenderTimeCounter: PerfCounter;
        /**
         * Gets the sprites render time capture status
         */
        /**
         * Enable or disable the sprites render time capture
         */
        captureSpritesRenderTime: boolean;
        /**
         * Gets the perf counter used for physics time
         */
        readonly physicsTimeCounter: PerfCounter;
        /**
         * Gets the physics time capture status
         */
        /**
         * Enable or disable the physics time capture
         */
        capturePhysicsTime: boolean;
        /**
         * Gets the perf counter used for animations time
         */
        readonly animationsTimeCounter: PerfCounter;
        /**
         * Gets the animations time capture status
         */
        /**
         * Enable or disable the animations time capture
         */
        captureAnimationsTime: boolean;
        /**
         * Gets the perf counter used for frame time capture
         */
        readonly frameTimeCounter: PerfCounter;
        /**
         * Gets the frame time capture status
         */
        /**
         * Enable or disable the frame time capture
         */
        captureFrameTime: boolean;
        /**
         * Gets the perf counter used for inter-frames time capture
         */
        readonly interFrameTimeCounter: PerfCounter;
        /**
         * Gets the inter-frames time capture status
         */
        /**
         * Enable or disable the inter-frames time capture
         */
        captureInterFrameTime: boolean;
        /**
         * Gets the perf counter used for render time capture
         */
        readonly renderTimeCounter: PerfCounter;
        /**
         * Gets the render time capture status
         */
        /**
         * Enable or disable the render time capture
         */
        captureRenderTime: boolean;
        /**
         * Gets the perf counter used for draw calls
         */
        readonly drawCallsCounter: PerfCounter;
        /**
         * Gets the perf counter used for texture collisions
         */
        readonly textureCollisionsCounter: PerfCounter;
        constructor(scene: Scene);
        dispose(): void;
    }
}

declare module 'babylonjs/instrumentation' {
    class _TimeToken {
        _startTimeQuery: Nullable<WebGLQuery>;
        _endTimeQuery: Nullable<WebGLQuery>;
        _timeElapsedQuery: Nullable<WebGLQuery>;
        _timeElapsedQueryEnded: boolean;
    }
}

import {EffectFallbacks,EffectCreationOptions,Effect,Nullable,float,double,int,FloatArray,IndicesArray,KeyboardEventTypes,KeyboardInfo,KeyboardInfoPre,PointerEventTypes,PointerInfoBase,PointerInfoPre,PointerInfo,ToGammaSpace,ToLinearSpace,Epsilon,Color3,Color4,Vector2,Vector3,Vector4,ISize,Size,Quaternion,Matrix,Plane,Viewport,Frustum,Space,Axis,BezierCurve,Orientation,Angle,Arc2,Path2,Path3D,Curve3,PositionNormalVertex,PositionNormalTextureVertex,Tmp,Scalar,expandToProperty,serialize,serializeAsTexture,serializeAsColor3,serializeAsFresnelParameters,serializeAsVector2,serializeAsVector3,serializeAsMeshReference,serializeAsColorCurves,serializeAsColor4,serializeAsImageProcessingConfiguration,serializeAsQuaternion,SerializationHelper,EventState,Observer,MultiObserver,Observable,SmartArray,SmartArrayNoDuplicate,IAnimatable,LoadFileError,RetryStrategy,IFileRequest,Tools,PerfCounter,className,AsyncLoop,_AlphaState,_DepthCullingState,_StencilState,InstancingAttributeInfo,RenderTargetCreationOptions,EngineCapabilities,EngineOptions,IDisplayChangedEventArgs,Engine,Node,BoundingSphere,BoundingBox,ICullable,BoundingInfo,TransformNode,AbstractMesh,Light,Camera,RenderingManager,RenderingGroup,IDisposable,IActiveMeshCandidateProvider,RenderingGroupInfo,Scene,Buffer,VertexBuffer,InternalTexture,BaseTexture,Texture,_InstancesBatch,Mesh,BaseSubMesh,SubMesh,MaterialDefines,Material,UniformBuffer,IGetSetVerticesData,VertexData,Geometry,_PrimitiveGeometry,RibbonGeometry,BoxGeometry,SphereGeometry,DiscGeometry,CylinderGeometry,TorusGeometry,GroundGeometry,TiledGroundGeometry,PlaneGeometry,TorusKnotGeometry,PostProcessManager,PerformanceMonitor,RollingAverage,IImageProcessingConfigurationDefines,ImageProcessingConfiguration,ColorGradingTexture,ColorCurves,Behavior,MaterialHelper,PushMaterial,StandardMaterialDefines,StandardMaterial} from 'babylonjs/core';
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
