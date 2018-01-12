declare module 'babylonjs/backgroundMaterial' {
    /**
     * Background material used to create an efficient environement around your scene.
     */
    class BackgroundMaterial extends PushMaterial {
        /**
         * Standard reflectance value at parallel view angle.
         */
        static standardReflectance0: number;
        /**
         * Standard reflectance value at grazing angle.
         */
        static standardReflectance90: number;
        /**
         * Key light Color (multiply against the R channel of the environement texture)
         */
        protected _primaryColor: Color3;
        primaryColor: Color3;
        /**
         * Key light Level (allowing HDR output of the background)
         */
        protected _primaryLevel: float;
        primaryLevel: float;
        /**
         * Secondary light Color (multiply against the G channel of the environement texture)
         */
        protected _secondaryColor: Color3;
        secondaryColor: Color3;
        /**
         * Secondary light Level (allowing HDR output of the background)
         */
        protected _secondaryLevel: float;
        secondaryLevel: float;
        /**
         * Tertiary light Color (multiply against the B channel of the environement texture)
         */
        protected _tertiaryColor: Color3;
        tertiaryColor: Color3;
        /**
         * Tertiary light Level (allowing HDR output of the background)
         */
        protected _tertiaryLevel: float;
        tertiaryLevel: float;
        /**
         * Reflection Texture used in the material.
         * Should be author in a specific way for the best result (refer to the documentation).
         */
        protected _reflectionTexture: Nullable<BaseTexture>;
        reflectionTexture: Nullable<BaseTexture>;
        /**
         * Reflection Texture level of blur.
         *
         * Can be use to reuse an existing HDR Texture and target a specific LOD to prevent authoring the
         * texture twice.
         */
        protected _reflectionBlur: float;
        reflectionBlur: float;
        /**
         * Diffuse Texture used in the material.
         * Should be author in a specific way for the best result (refer to the documentation).
         */
        protected _diffuseTexture: Nullable<BaseTexture>;
        diffuseTexture: Nullable<BaseTexture>;
        /**
         * Specify the list of lights casting shadow on the material.
         * All scene shadow lights will be included if null.
         */
        protected _shadowLights: Nullable<IShadowLight[]>;
        shadowLights: Nullable<IShadowLight[]>;
        /**
         * For the lights having a blurred shadow generator, this can add a second blur pass in order to reach
         * soft lighting on the background.
         */
        protected _shadowBlurScale: int;
        shadowBlurScale: int;
        /**
         * Helps adjusting the shadow to a softer level if required.
         * 0 means black shadows and 1 means no shadows.
         */
        protected _shadowLevel: float;
        shadowLevel: float;
        /**
         * In case of opacity Fresnel or reflection falloff, this is use as a scene center.
         * It is usually zero but might be interesting to modify according to your setup.
         */
        protected _sceneCenter: Vector3;
        sceneCenter: Vector3;
        /**
         * This helps specifying that the material is falling off to the sky box at grazing angle.
         * This helps ensuring a nice transition when the camera goes under the ground.
         */
        protected _opacityFresnel: boolean;
        opacityFresnel: boolean;
        /**
         * This helps specifying that the material is falling off from diffuse to the reflection texture at grazing angle.
         * This helps adding a mirror texture on the ground.
         */
        protected _reflectionFresnel: boolean;
        reflectionFresnel: boolean;
        /**
         * This helps specifying the falloff radius off the reflection texture from the sceneCenter.
         * This helps adding a nice falloff effect to the reflection if used as a mirror for instance.
         */
        protected _reflectionFalloffDistance: number;
        reflectionFalloffDistance: number;
        /**
         * This specifies the weight of the reflection against the background in case of reflection Fresnel.
         */
        protected _reflectionAmount: number;
        reflectionAmount: number;
        /**
         * This specifies the weight of the reflection at grazing angle.
         */
        protected _reflectionReflectance0: number;
        reflectionReflectance0: number;
        /**
         * This specifies the weight of the reflection at a perpendicular point of view.
         */
        protected _reflectionReflectance90: number;
        reflectionReflectance90: number;
        /**
         * Sets the reflection reflectance fresnel values according to the default standard
         * empirically know to work well :-)
         */
        reflectionStandardFresnelWeight: number;
        /**
         * Helps to directly use the maps channels instead of their level.
         */
        protected _useRGBColor: boolean;
        useRGBColor: boolean;
        /**
         * This helps reducing the banding effect that could occur on the background.
         */
        protected _enableNoise: boolean;
        enableNoise: boolean;
        /**
         * Number of Simultaneous lights allowed on the material.
         */
        private _maxSimultaneousLights;
        maxSimultaneousLights: int;
        /**
         * Default configuration related to image processing available in the Background Material.
         */
        protected _imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Keep track of the image processing observer to allow dispose and replace.
         */
        private _imageProcessingObserver;
        /**
         * Attaches a new image processing configuration to the PBR Material.
         * @param configuration (if null the scene configuration will be use)
         */
        protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void;
        /**
         * Gets the image processing configuration used either in this material.
         */
        /**
         * Sets the Default image processing configuration used either in the this material.
         *
         * If sets to null, the scene one is in use.
         */
        imageProcessingConfiguration: Nullable<ImageProcessingConfiguration>;
        /**
         * Gets wether the color curves effect is enabled.
         */
        /**
         * Sets wether the color curves effect is enabled.
         */
        cameraColorCurvesEnabled: boolean;
        /**
         * Gets wether the color grading effect is enabled.
         */
        /**
         * Gets wether the color grading effect is enabled.
         */
        cameraColorGradingEnabled: boolean;
        /**
         * Gets wether tonemapping is enabled or not.
         */
        /**
         * Sets wether tonemapping is enabled or not
         */
        cameraToneMappingEnabled: boolean;
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        cameraExposure: float;
        /**
         * Gets The camera contrast used on this material.
         */
        /**
         * Sets The camera contrast used on this material.
         */
        cameraContrast: float;
        /**
         * Gets the Color Grading 2D Lookup Texture.
         */
        /**
         * Sets the Color Grading 2D Lookup Texture.
         */
        cameraColorGradingTexture: Nullable<BaseTexture>;
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        cameraColorCurves: Nullable<ColorCurves>;
        private _renderTargets;
        private _reflectionControls;
        /**
         * constructor
         * @param name The name of the material
         * @param scene The scene to add the material to
         */
        constructor(name: string, scene: Scene);
        /**
         * The entire material has been created in order to prevent overdraw.
         * @returns false
         */
        needAlphaTesting(): boolean;
        /**
         * The entire material has been created in order to prevent overdraw.
         * @returns true if blending is enable
         */
        needAlphaBlending(): boolean;
        /**
         * Checks wether the material is ready to be rendered for a given mesh.
         * @param mesh The mesh to render
         * @param subMesh The submesh to check against
         * @param useInstances Specify wether or not the material is used with instances
         */
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        /**
         * Build the uniform buffer used in the material.
         */
        buildUniformLayout(): void;
        /**
         * Unbind the material.
         */
        unbind(): void;
        /**
         * Bind only the world matrix to the material.
         * @param world The world matrix to bind.
         */
        bindOnlyWorldMatrix(world: Matrix): void;
        /**
         * Bind the material for a dedicated submeh (every used meshes will be considered opaque).
         * @param world The world matrix to bind.
         * @param subMesh The submesh to bind for.
         */
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        /**
         * Dispose the material.
         * @forceDisposeEffect Force disposal of the associated effect.
         * @forceDisposeTextures Force disposal of the associated textures.
         */
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
        /**
         * Clones the material.
         * @name The cloned name.
         * @returns The cloned material.
         */
        clone(name: string): BackgroundMaterial;
        /**
         * Serializes the current material to its JSON representation.
         * @returns The JSON representation.
         */
        serialize(): any;
        /**
         * Gets the class name of the material
         * @returns "BackgroundMaterial"
         */
        getClassName(): string;
        /**
         * Parse a JSON input to create back a background material.
         * @param source
         * @param scene
         * @param rootUrl
         * @returns the instantiated BackgroundMaterial.
         */
        static Parse(source: any, scene: Scene, rootUrl: string): BackgroundMaterial;
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
import {Layer} from 'babylonjs/layer';
import {IEnvironmentHelperOptions,EnvironmentHelper} from 'babylonjs/environmentHelper';
