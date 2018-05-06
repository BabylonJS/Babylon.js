declare module 'babylonjs/environmentHelper' {
    /**
     * Represents the different options available during the creation of
     * a Environment helper.
     *
     * This can control the default ground, skybox and image processing setup of your scene.
     */
    interface IEnvironmentHelperOptions {
        /**
         * Specifies wether or not to create a ground.
         * True by default.
         */
        createGround: boolean;
        /**
         * Specifies the ground size.
         * 15 by default.
         */
        groundSize: number;
        /**
         * The texture used on the ground for the main color.
         * Comes from the BabylonJS CDN by default.
         *
         * Remarks: Can be either a texture or a url.
         */
        groundTexture: string | BaseTexture;
        /**
         * The color mixed in the ground texture by default.
         * BabylonJS clearColor by default.
         */
        groundColor: Color3;
        /**
         * Specifies the ground opacity.
         * 1 by default.
         */
        groundOpacity: number;
        /**
         * Enables the ground to receive shadows.
         * True by default.
         */
        enableGroundShadow: boolean;
        /**
         * Helps preventing the shadow to be fully black on the ground.
         * 0.5 by default.
         */
        groundShadowLevel: number;
        /**
         * Creates a mirror texture attach to the ground.
         * false by default.
         */
        enableGroundMirror: boolean;
        /**
         * Specifies the ground mirror size ratio.
         * 0.3 by default as the default kernel is 64.
         */
        groundMirrorSizeRatio: number;
        /**
         * Specifies the ground mirror blur kernel size.
         * 64 by default.
         */
        groundMirrorBlurKernel: number;
        /**
         * Specifies the ground mirror visibility amount.
         * 1 by default
         */
        groundMirrorAmount: number;
        /**
         * Specifies the ground mirror reflectance weight.
         * This uses the standard weight of the background material to setup the fresnel effect
         * of the mirror.
         * 1 by default.
         */
        groundMirrorFresnelWeight: number;
        /**
         * Specifies the ground mirror Falloff distance.
         * This can helps reducing the size of the reflection.
         * 0 by Default.
         */
        groundMirrorFallOffDistance: number;
        /**
         * Specifies the ground mirror texture type.
         * Unsigned Int by Default.
         */
        groundMirrorTextureType: number;
        /**
         * Specifies a bias applied to the ground vertical position to prevent z-fighyting with
         * the shown objects.
         */
        groundYBias: number;
        /**
         * Specifies wether or not to create a skybox.
         * True by default.
         */
        createSkybox: boolean;
        /**
         * Specifies the skybox size.
         * 20 by default.
         */
        skyboxSize: number;
        /**
         * The texture used on the skybox for the main color.
         * Comes from the BabylonJS CDN by default.
         *
         * Remarks: Can be either a texture or a url.
         */
        skyboxTexture: string | BaseTexture;
        /**
         * The color mixed in the skybox texture by default.
         * BabylonJS clearColor by default.
         */
        skyboxColor: Color3;
        /**
         * The background rotation around the Y axis of the scene.
         * This helps aligning the key lights of your scene with the background.
         * 0 by default.
         */
        backgroundYRotation: number;
        /**
         * Compute automatically the size of the elements to best fit with the scene.
         */
        sizeAuto: boolean;
        /**
         * Default position of the rootMesh if autoSize is not true.
         */
        rootPosition: Vector3;
        /**
         * Sets up the image processing in the scene.
         * true by default.
         */
        setupImageProcessing: boolean;
        /**
         * The texture used as your environment texture in the scene.
         * Comes from the BabylonJS CDN by default and in use if setupImageProcessing is true.
         *
         * Remarks: Can be either a texture or a url.
         */
        environmentTexture: string | BaseTexture;
        /**
         * The value of the exposure to apply to the scene.
         * 0.6 by default if setupImageProcessing is true.
         */
        cameraExposure: number;
        /**
         * The value of the contrast to apply to the scene.
         * 1.6 by default if setupImageProcessing is true.
         */
        cameraContrast: number;
        /**
         * Specifies wether or not tonemapping should be enabled in the scene.
         * true by default if setupImageProcessing is true.
         */
        toneMappingEnabled: boolean;
    }
    /**
     * The Environment helper class can be used to add a fully featuread none expensive background to your scene.
     * It includes by default a skybox and a ground relying on the BackgroundMaterial.
     * It also helps with the default setup of your imageProcessing configuration.
     */
    class EnvironmentHelper {
        /**
         * Default ground texture URL.
         */
        private static _groundTextureCDNUrl;
        /**
         * Default skybox texture URL.
         */
        private static _skyboxTextureCDNUrl;
        /**
         * Default environment texture URL.
         */
        private static _environmentTextureCDNUrl;
        /**
         * Creates the default options for the helper.
         */
        private static _getDefaultOptions();
        private _rootMesh;
        /**
         * Gets the root mesh created by the helper.
         */
        readonly rootMesh: Mesh;
        private _skybox;
        /**
         * Gets the skybox created by the helper.
         */
        readonly skybox: Nullable<Mesh>;
        private _skyboxTexture;
        /**
         * Gets the skybox texture created by the helper.
         */
        readonly skyboxTexture: Nullable<BaseTexture>;
        private _skyboxMaterial;
        /**
         * Gets the skybox material created by the helper.
         */
        readonly skyboxMaterial: Nullable<BackgroundMaterial>;
        private _ground;
        /**
         * Gets the ground mesh created by the helper.
         */
        readonly ground: Nullable<Mesh>;
        private _groundTexture;
        /**
         * Gets the ground texture created by the helper.
         */
        readonly groundTexture: Nullable<BaseTexture>;
        private _groundMirror;
        /**
         * Gets the ground mirror created by the helper.
         */
        readonly groundMirror: Nullable<MirrorTexture>;
        /**
         * Gets the ground mirror render list to helps pushing the meshes
         * you wish in the ground reflection.
         */
        readonly groundMirrorRenderList: Nullable<AbstractMesh[]>;
        private _groundMaterial;
        /**
         * Gets the ground material created by the helper.
         */
        readonly groundMaterial: Nullable<BackgroundMaterial>;
        /**
         * Stores the creation options.
         */
        private readonly _scene;
        private _options;
        /**
         * constructor
         * @param options
         * @param scene The scene to add the material to
         */
        constructor(options: Partial<IEnvironmentHelperOptions>, scene: Scene);
        /**
         * Updates the background according to the new options
         * @param options
         */
        updateOptions(options: Partial<IEnvironmentHelperOptions>): void;
        /**
         * Sets the primary color of all the available elements.
         * @param color
         */
        setMainColor(color: Color3): void;
        /**
         * Setup the image processing according to the specified options.
         */
        private _setupImageProcessing();
        /**
         * Setup the environment texture according to the specified options.
         */
        private _setupEnvironmentTexture();
        /**
         * Setup the background according to the specified options.
         */
        private _setupBackground();
        /**
         * Get the scene sizes according to the setup.
         */
        private _getSceneSize();
        /**
         * Setup the ground according to the specified options.
         */
        private _setupGround(sceneSize);
        /**
         * Setup the ground material according to the specified options.
         */
        private _setupGroundMaterial();
        /**
         * Setup the ground diffuse texture according to the specified options.
         */
        private _setupGroundDiffuseTexture();
        /**
         * Setup the ground mirror texture according to the specified options.
         */
        private _setupGroundMirrorTexture(sceneSize);
        /**
         * Setup the ground to receive the mirror texture.
         */
        private _setupMirrorInGroundMaterial();
        /**
         * Setup the skybox according to the specified options.
         */
        private _setupSkybox(sceneSize);
        /**
         * Setup the skybox material according to the specified options.
         */
        private _setupSkyboxMaterial();
        /**
         * Setup the skybox reflection texture according to the specified options.
         */
        private _setupSkyboxReflectionTexture();
        /**
         * Dispose all the elements created by the Helper.
         */
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
