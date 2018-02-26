declare module 'babylonjs/additionalRenderingPipeline' {
    class SSAORenderingPipeline extends PostProcessRenderPipeline {
        /**
        * The PassPostProcess id in the pipeline that contains the original scene color
        * @type {string}
        */
        SSAOOriginalSceneColorEffect: string;
        /**
        * The SSAO PostProcess id in the pipeline
        * @type {string}
        */
        SSAORenderEffect: string;
        /**
        * The horizontal blur PostProcess id in the pipeline
        * @type {string}
        */
        SSAOBlurHRenderEffect: string;
        /**
        * The vertical blur PostProcess id in the pipeline
        * @type {string}
        */
        SSAOBlurVRenderEffect: string;
        /**
        * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
        * @type {string}
        */
        SSAOCombineRenderEffect: string;
        /**
        * The output strength of the SSAO post-process. Default value is 1.0.
        * @type {number}
        */
        totalStrength: number;
        /**
        * The radius around the analyzed pixel used by the SSAO post-process. Default value is 0.0006
        * @type {number}
        */
        radius: number;
        /**
        * Related to fallOff, used to interpolate SSAO samples (first interpolate function input) based on the occlusion difference of each pixel
        * Must not be equal to fallOff and superior to fallOff.
        * Default value is 0.975
        * @type {number}
        */
        area: number;
        /**
        * Related to area, used to interpolate SSAO samples (second interpolate function input) based on the occlusion difference of each pixel
        * Must not be equal to area and inferior to area.
        * Default value is 0.0
        * @type {number}
        */
        fallOff: number;
        /**
        * The base color of the SSAO post-process
        * The final result is "base + ssao" between [0, 1]
        * @type {number}
        */
        base: number;
        private _scene;
        private _depthTexture;
        private _randomTexture;
        private _originalColorPostProcess;
        private _ssaoPostProcess;
        private _blurHPostProcess;
        private _blurVPostProcess;
        private _ssaoCombinePostProcess;
        private _firstUpdate;
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, combineRatio: 1.0 }
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, scene: Scene, ratio: any, cameras?: Camera[]);
        /**
         * Removes the internal pipeline assets and detatches the pipeline from the scene cameras
         */
        dispose(disableDepthRender?: boolean): void;
        private _createBlurPostProcess(ratio);
        _rebuild(): void;
        private _createSSAOPostProcess(ratio);
        private _createSSAOCombinePostProcess(ratio);
        private _createRandomTexture();
    }
}

declare module 'babylonjs/additionalRenderingPipeline' {
    class SSAO2RenderingPipeline extends PostProcessRenderPipeline {
        /**
        * The PassPostProcess id in the pipeline that contains the original scene color
        * @type {string}
        */
        SSAOOriginalSceneColorEffect: string;
        /**
        * The SSAO PostProcess id in the pipeline
        * @type {string}
        */
        SSAORenderEffect: string;
        /**
        * The horizontal blur PostProcess id in the pipeline
        * @type {string}
        */
        SSAOBlurHRenderEffect: string;
        /**
        * The vertical blur PostProcess id in the pipeline
        * @type {string}
        */
        SSAOBlurVRenderEffect: string;
        /**
        * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
        * @type {string}
        */
        SSAOCombineRenderEffect: string;
        /**
        * The output strength of the SSAO post-process. Default value is 1.0.
        * @type {number}
        */
        totalStrength: number;
        /**
        * Maximum depth value to still render AO. A smooth falloff makes the dimming more natural, so there will be no abrupt shading change.
        * @type {number}
        */
        maxZ: number;
        /**
        * In order to save performances, SSAO radius is clamped on close geometry. This ratio changes by how much
        * @type {number}
        */
        minZAspect: number;
        /**
        * Number of samples used for the SSAO calculations. Default value is 8
        * @type {number}
        */
        private _samples;
        /**
        * Dynamically generated sphere sampler.
        * @type {number[]}
        */
        private _sampleSphere;
        /**
        * Blur filter offsets
        * @type {number[]}
        */
        private _samplerOffsets;
        samples: number;
        /**
        * Are we using bilateral blur ?
        * @type {boolean}
        */
        private _expensiveBlur;
        expensiveBlur: boolean;
        /**
        * The radius around the analyzed pixel used by the SSAO post-process. Default value is 2.0
        * @type {number}
        */
        radius: number;
        /**
        * The base color of the SSAO post-process
        * The final result is "base + ssao" between [0, 1]
        * @type {number}
        */
        base: number;
        /**
        *  Support test.
        * @type {boolean}
        */
        static readonly IsSupported: boolean;
        private _scene;
        private _depthTexture;
        private _normalTexture;
        private _randomTexture;
        private _originalColorPostProcess;
        private _ssaoPostProcess;
        private _blurHPostProcess;
        private _blurVPostProcess;
        private _ssaoCombinePostProcess;
        private _firstUpdate;
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, blurRatio: 1.0 }
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, scene: Scene, ratio: any, cameras?: Camera[]);
        /**
         * Removes the internal pipeline assets and detatches the pipeline from the scene cameras
         */
        dispose(disableGeometryBufferRenderer?: boolean): void;
        private _createBlurPostProcess(ssaoRatio, blurRatio);
        _rebuild(): void;
        private _generateHemisphere();
        private _createSSAOPostProcess(ratio);
        private _createSSAOCombinePostProcess(ratio);
        private _createRandomTexture();
    }
}

declare module 'babylonjs/additionalRenderingPipeline' {
    class LensRenderingPipeline extends PostProcessRenderPipeline {
        /**
        * The chromatic aberration PostProcess id in the pipeline
        * @type {string}
        */
        LensChromaticAberrationEffect: string;
        /**
        * The highlights enhancing PostProcess id in the pipeline
        * @type {string}
        */
        HighlightsEnhancingEffect: string;
        /**
        * The depth-of-field PostProcess id in the pipeline
        * @type {string}
        */
        LensDepthOfFieldEffect: string;
        private _scene;
        private _depthTexture;
        private _grainTexture;
        private _chromaticAberrationPostProcess;
        private _highlightsPostProcess;
        private _depthOfFieldPostProcess;
        private _edgeBlur;
        private _grainAmount;
        private _chromaticAberration;
        private _distortion;
        private _highlightsGain;
        private _highlightsThreshold;
        private _dofDistance;
        private _dofAperture;
        private _dofDarken;
        private _dofPentagon;
        private _blurNoise;
        /**
         * @constructor
         *
         * Effect parameters are as follow:
         * {
         *      chromatic_aberration: number;       // from 0 to x (1 for realism)
         *      edge_blur: number;                  // from 0 to x (1 for realism)
         *      distortion: number;                 // from 0 to x (1 for realism)
         *      grain_amount: number;               // from 0 to 1
         *      grain_texture: BABYLON.Texture;     // texture to use for grain effect; if unset, use random B&W noise
         *      dof_focus_distance: number;         // depth-of-field: focus distance; unset to disable (disabled by default)
         *      dof_aperture: number;               // depth-of-field: focus blur bias (default: 1)
         *      dof_darken: number;                 // depth-of-field: darken that which is out of focus (from 0 to 1, disabled by default)
         *      dof_pentagon: boolean;              // depth-of-field: makes a pentagon-like "bokeh" effect
         *      dof_gain: number;                   // depth-of-field: highlights gain; unset to disable (disabled by default)
         *      dof_threshold: number;              // depth-of-field: highlights threshold (default: 1)
         *      blur_noise: boolean;                // add a little bit of noise to the blur (default: true)
         * }
         * Note: if an effect parameter is unset, effect is disabled
         *
         * @param {string} name - The rendering pipeline name
         * @param {object} parameters - An object containing all parameters (see above)
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {number} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, parameters: any, scene: Scene, ratio?: number, cameras?: Camera[]);
        setEdgeBlur(amount: number): void;
        disableEdgeBlur(): void;
        setGrainAmount(amount: number): void;
        disableGrain(): void;
        setChromaticAberration(amount: number): void;
        disableChromaticAberration(): void;
        setEdgeDistortion(amount: number): void;
        disableEdgeDistortion(): void;
        setFocusDistance(amount: number): void;
        disableDepthOfField(): void;
        setAperture(amount: number): void;
        setDarkenOutOfFocus(amount: number): void;
        enablePentagonBokeh(): void;
        disablePentagonBokeh(): void;
        enableNoiseBlur(): void;
        disableNoiseBlur(): void;
        setHighlightsGain(amount: number): void;
        setHighlightsThreshold(amount: number): void;
        disableHighlights(): void;
        /**
         * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
         */
        dispose(disableDepthRender?: boolean): void;
        private _createChromaticAberrationPostProcess(ratio);
        private _createHighlightsPostProcess(ratio);
        private _createDepthOfFieldPostProcess(ratio);
        private _createGrainTexture();
    }
}

declare module 'babylonjs/additionalRenderingPipeline' {
    class StandardRenderingPipeline extends PostProcessRenderPipeline implements IDisposable, IAnimatable {
        /**
        * Public members
        */
        originalPostProcess: Nullable<PostProcess>;
        downSampleX4PostProcess: Nullable<PostProcess>;
        brightPassPostProcess: Nullable<PostProcess>;
        blurHPostProcesses: PostProcess[];
        blurVPostProcesses: PostProcess[];
        textureAdderPostProcess: Nullable<PostProcess>;
        volumetricLightPostProcess: Nullable<PostProcess>;
        volumetricLightSmoothXPostProcess: Nullable<BlurPostProcess>;
        volumetricLightSmoothYPostProcess: Nullable<BlurPostProcess>;
        volumetricLightMergePostProces: Nullable<PostProcess>;
        volumetricLightFinalPostProcess: Nullable<PostProcess>;
        luminancePostProcess: Nullable<PostProcess>;
        luminanceDownSamplePostProcesses: PostProcess[];
        hdrPostProcess: Nullable<PostProcess>;
        textureAdderFinalPostProcess: Nullable<PostProcess>;
        lensFlareFinalPostProcess: Nullable<PostProcess>;
        hdrFinalPostProcess: Nullable<PostProcess>;
        lensFlarePostProcess: Nullable<PostProcess>;
        lensFlareComposePostProcess: Nullable<PostProcess>;
        motionBlurPostProcess: Nullable<PostProcess>;
        depthOfFieldPostProcess: Nullable<PostProcess>;
        brightThreshold: number;
        blurWidth: number;
        horizontalBlur: boolean;
        exposure: number;
        lensTexture: Nullable<Texture>;
        volumetricLightCoefficient: number;
        volumetricLightPower: number;
        volumetricLightBlurScale: number;
        sourceLight: Nullable<SpotLight | DirectionalLight>;
        hdrMinimumLuminance: number;
        hdrDecreaseRate: number;
        hdrIncreaseRate: number;
        lensColorTexture: Nullable<Texture>;
        lensFlareStrength: number;
        lensFlareGhostDispersal: number;
        lensFlareHaloWidth: number;
        lensFlareDistortionStrength: number;
        lensStarTexture: Nullable<Texture>;
        lensFlareDirtTexture: Nullable<Texture>;
        depthOfFieldDistance: number;
        depthOfFieldBlurWidth: number;
        motionStrength: number;
        animations: Animation[];
        /**
        * Private members
        */
        private _scene;
        private _currentDepthOfFieldSource;
        private _basePostProcess;
        private _hdrCurrentLuminance;
        private _floatTextureType;
        private _ratio;
        private _bloomEnabled;
        private _depthOfFieldEnabled;
        private _vlsEnabled;
        private _lensFlareEnabled;
        private _hdrEnabled;
        private _motionBlurEnabled;
        private _motionBlurSamples;
        private _volumetricLightStepsCount;
        BloomEnabled: boolean;
        DepthOfFieldEnabled: boolean;
        LensFlareEnabled: boolean;
        HDREnabled: boolean;
        VLSEnabled: boolean;
        MotionBlurEnabled: boolean;
        volumetricLightStepsCount: number;
        motionBlurSamples: number;
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.PostProcess} originalPostProcess - the custom original color post-process. Must be "reusable". Can be null.
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, scene: Scene, ratio: number, originalPostProcess?: Nullable<PostProcess>, cameras?: Camera[]);
        private _buildPipeline();
        private _createDownSampleX4PostProcess(scene, ratio);
        private _createBrightPassPostProcess(scene, ratio);
        private _createBlurPostProcesses(scene, ratio, indice, blurWidthKey?);
        private _createTextureAdderPostProcess(scene, ratio);
        private _createVolumetricLightPostProcess(scene, ratio);
        private _createLuminancePostProcesses(scene, textureType);
        private _createHdrPostProcess(scene, ratio);
        private _createLensFlarePostProcess(scene, ratio);
        private _createDepthOfFieldPostProcess(scene, ratio);
        private _createMotionBlurPostProcess(scene, ratio);
        private _getDepthTexture();
        private _disposePostProcesses();
        dispose(): void;
        serialize(): any;
        /**
         * Static members
         */
        static Parse(source: any, scene: Scene, rootUrl: string): StandardRenderingPipeline;
        static LuminanceSteps: number;
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
