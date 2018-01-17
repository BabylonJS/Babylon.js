declare module 'babylonjs/shadows' {
    /**
     * Interface to implement to create a shadow generator compatible with BJS.
     */
    interface IShadowGenerator {
        getShadowMap(): Nullable<RenderTargetTexture>;
        getShadowMapForRendering(): Nullable<RenderTargetTexture>;
        isReady(subMesh: SubMesh, useInstances: boolean): boolean;
        prepareDefines(defines: MaterialDefines, lightIndex: number): void;
        bindShadowLight(lightIndex: string, effect: Effect): void;
        getTransformMatrix(): Matrix;
        recreateShadowMap(): void;
        forceCompilation(onCompiled?: (generator: ShadowGenerator) => void, options?: Partial<{
            useInstances: boolean;
        }>): void;
        serialize(): any;
        dispose(): void;
    }
    class ShadowGenerator implements IShadowGenerator {
        private static _FILTER_NONE;
        private static _FILTER_EXPONENTIALSHADOWMAP;
        private static _FILTER_POISSONSAMPLING;
        private static _FILTER_BLUREXPONENTIALSHADOWMAP;
        private static _FILTER_CLOSEEXPONENTIALSHADOWMAP;
        private static _FILTER_BLURCLOSEEXPONENTIALSHADOWMAP;
        static readonly FILTER_NONE: number;
        static readonly FILTER_POISSONSAMPLING: number;
        static readonly FILTER_EXPONENTIALSHADOWMAP: number;
        static readonly FILTER_BLUREXPONENTIALSHADOWMAP: number;
        static readonly FILTER_CLOSEEXPONENTIALSHADOWMAP: number;
        static readonly FILTER_BLURCLOSEEXPONENTIALSHADOWMAP: number;
        private _bias;
        bias: number;
        private _blurBoxOffset;
        blurBoxOffset: number;
        private _blurScale;
        blurScale: number;
        private _blurKernel;
        blurKernel: number;
        private _useKernelBlur;
        useKernelBlur: boolean;
        private _depthScale;
        depthScale: number;
        private _filter;
        filter: number;
        usePoissonSampling: boolean;
        useVarianceShadowMap: boolean;
        useBlurVarianceShadowMap: boolean;
        useExponentialShadowMap: boolean;
        useBlurExponentialShadowMap: boolean;
        useCloseExponentialShadowMap: boolean;
        useBlurCloseExponentialShadowMap: boolean;
        private _darkness;
        /**
         * Returns the darkness value (float).
         */
        getDarkness(): number;
        /**
         * Sets the ShadowGenerator darkness value (float <= 1.0).
         * Returns the ShadowGenerator.
         */
        setDarkness(darkness: number): ShadowGenerator;
        private _transparencyShadow;
        /**
         * Sets the ability to have transparent shadow (boolean).
         * Returns the ShadowGenerator.
         */
        setTransparencyShadow(hasShadow: boolean): ShadowGenerator;
        private _shadowMap;
        private _shadowMap2;
        /**
         * Returns a RenderTargetTexture object : the shadow map texture.
         */
        getShadowMap(): Nullable<RenderTargetTexture>;
        /**
         * Returns the most ready computed shadow map as a RenderTargetTexture object.
         */
        getShadowMapForRendering(): Nullable<RenderTargetTexture>;
        /**
         * Helper function to add a mesh and its descendants to the list of shadow casters
         * @param mesh Mesh to add
         * @param includeDescendants boolean indicating if the descendants should be added. Default to true
         */
        addShadowCaster(mesh: AbstractMesh, includeDescendants?: boolean): ShadowGenerator;
        /**
         * Helper function to remove a mesh and its descendants from the list of shadow casters
         * @param mesh Mesh to remove
         * @param includeDescendants boolean indicating if the descendants should be removed. Default to true
         */
        removeShadowCaster(mesh: AbstractMesh, includeDescendants?: boolean): ShadowGenerator;
        /**
         * Controls the extent to which the shadows fade out at the edge of the frustum
         * Used only by directionals and spots
         */
        frustumEdgeFalloff: number;
        private _light;
        /**
         * Returns the associated light object.
         */
        getLight(): IShadowLight;
        forceBackFacesOnly: boolean;
        private _scene;
        private _lightDirection;
        private _effect;
        private _viewMatrix;
        private _projectionMatrix;
        private _transformMatrix;
        private _cachedPosition;
        private _cachedDirection;
        private _cachedDefines;
        private _currentRenderID;
        private _downSamplePostprocess;
        private _boxBlurPostprocess;
        private _kernelBlurXPostprocess;
        private _kernelBlurYPostprocess;
        private _blurPostProcesses;
        private _mapSize;
        private _currentFaceIndex;
        private _currentFaceIndexCache;
        private _textureType;
        private _defaultTextureMatrix;
        /**
         * Creates a ShadowGenerator object.
         * A ShadowGenerator is the required tool to use the shadows.
         * Each light casting shadows needs to use its own ShadowGenerator.
         * Required parameters :
         * - `mapSize` (integer): the size of the texture what stores the shadows. Example : 1024.
         * - `light`: the light object generating the shadows.
         * - `useFullFloatFirst`: by default the generator will try to use half float textures but if you need precision (for self shadowing for instance), you can use this option to enforce full float texture.
         * Documentation : http://doc.babylonjs.com/tutorials/shadows
         */
        constructor(mapSize: number, light: IShadowLight, useFullFloatFirst?: boolean);
        private _initializeGenerator();
        private _initializeShadowMap();
        private _initializeBlurRTTAndPostProcesses();
        private _renderForShadowMap(opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, depthOnlySubMeshes);
        private _renderSubMeshForShadowMap(subMesh);
        private _applyFilterValues();
        /**
         * Force shader compilation including textures ready check
         */
        forceCompilation(onCompiled?: (generator: ShadowGenerator) => void, options?: Partial<{
            useInstances: boolean;
        }>): void;
        /**
         * Boolean : true when the ShadowGenerator is finally computed.
         */
        isReady(subMesh: SubMesh, useInstances: boolean): boolean;
        /**
         * This creates the defines related to the standard BJS materials.
         */
        prepareDefines(defines: any, lightIndex: number): void;
        /**
         * This binds shadow lights related to the standard BJS materials.
         * It implies the unifroms available on the materials are the standard BJS ones.
         */
        bindShadowLight(lightIndex: string, effect: Effect): void;
        /**
         * Returns a Matrix object : the updated transformation matrix.
         */
        getTransformMatrix(): Matrix;
        recreateShadowMap(): void;
        private _disposeBlurPostProcesses();
        private _disposeRTTandPostProcesses();
        /**
         * Disposes the ShadowGenerator.
         * Returns nothing.
         */
        dispose(): void;
        /**
         * Serializes the ShadowGenerator and returns a serializationObject.
         */
        serialize(): any;
        /**
         * Parses a serialized ShadowGenerator and returns a new ShadowGenerator.
         */
        static Parse(parsedShadowGenerator: any, scene: Scene): ShadowGenerator;
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
