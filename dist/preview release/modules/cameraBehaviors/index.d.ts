declare module 'babylonjs/cameraBehaviors' {
    class FramingBehavior implements Behavior<ArcRotateCamera> {
        readonly name: string;
        private _mode;
        private _radiusScale;
        private _positionScale;
        private _defaultElevation;
        private _elevationReturnTime;
        private _elevationReturnWaitTime;
        private _zoomStopsAnimation;
        private _framingTime;
        /**
         * The easing function used by animations
         */
        static EasingFunction: ExponentialEase;
        /**
         * The easing mode used by animations
         */
        static EasingMode: number;
        /**
         * Gets current mode used by the behavior.
         */
        /**
         * Sets the current mode used by the behavior
         */
        mode: number;
        /**
         * Gets the scale applied to the radius
         */
        /**
         * Sets the scale applied to the radius (1 by default)
         */
        radiusScale: number;
        /**
         * Gets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
         */
        /**
         * Sets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
         */
        positionScale: number;
        /**
        * Gets the angle above/below the horizontal plane to return to when the return to default elevation idle
        * behaviour is triggered, in radians.
        */
        /**
        * Sets the angle above/below the horizontal plane to return to when the return to default elevation idle
        * behaviour is triggered, in radians.
        */
        defaultElevation: number;
        /**
         * Gets the time (in milliseconds) taken to return to the default beta position.
         * Negative value indicates camera should not return to default.
         */
        /**
         * Sets the time (in milliseconds) taken to return to the default beta position.
         * Negative value indicates camera should not return to default.
         */
        elevationReturnTime: number;
        /**
         * Gets the delay (in milliseconds) taken before the camera returns to the default beta position.
         */
        /**
         * Sets the delay (in milliseconds) taken before the camera returns to the default beta position.
         */
        elevationReturnWaitTime: number;
        /**
        * Gets the flag that indicates if user zooming should stop animation.
        */
        /**
        * Sets the flag that indicates if user zooming should stop animation.
        */
        zoomStopsAnimation: boolean;
        /**
         * Gets the transition time when framing the mesh, in milliseconds
        */
        /**
         * Sets the transition time when framing the mesh, in milliseconds
        */
        framingTime: number;
        private _onPrePointerObservableObserver;
        private _onAfterCheckInputsObserver;
        private _onMeshTargetChangedObserver;
        private _attachedCamera;
        private _isPointerDown;
        private _lastInteractionTime;
        init(): void;
        attach(camera: ArcRotateCamera): void;
        detach(): void;
        private _animatables;
        private _betaIsAnimating;
        private _betaTransition;
        private _radiusTransition;
        private _vectorTransition;
        /**
         * Targets the given mesh and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        zoomOnMesh(mesh: AbstractMesh, focusOnOriginXZ?: boolean, onAnimationEnd?: Nullable<() => void>): void;
        /**
         * Targets the given mesh with its children and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        zoomOnMeshHierarchy(mesh: AbstractMesh, focusOnOriginXZ?: boolean, onAnimationEnd?: Nullable<() => void>): void;
        /**
         * Targets the given meshes with their children and updates zoom level accordingly.
         * @param meshes  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        zoomOnMeshesHierarchy(meshes: AbstractMesh[], focusOnOriginXZ?: boolean, onAnimationEnd?: Nullable<() => void>): void;
        /**
         * Targets the given mesh and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        zoomOnBoundingInfo(minimumWorld: Vector3, maximumWorld: Vector3, focusOnOriginXZ?: boolean, onAnimationEnd?: Nullable<() => void>): void;
        /**
         * Calculates the lowest radius for the camera based on the bounding box of the mesh.
         * @param mesh The mesh on which to base the calculation. mesh boundingInfo used to estimate necessary
         *			  frustum width.
         * @return The minimum distance from the primary mesh's center point at which the camera must be kept in order
         *		 to fully enclose the mesh in the viewing frustum.
         */
        protected _calculateLowerRadiusFromModelBoundingSphere(minimumWorld: Vector3, maximumWorld: Vector3): number;
        /**
         * Keeps the camera above the ground plane. If the user pulls the camera below the ground plane, the camera
         * is automatically returned to its default position (expected to be above ground plane).
         */
        private _maintainCameraAboveGround();
        /**
         * Returns the frustum slope based on the canvas ratio and camera FOV
         * @returns The frustum slope represented as a Vector2 with X and Y slopes
         */
        private _getFrustumSlope();
        /**
         * Removes all animation locks. Allows new animations to be added to any of the arcCamera properties.
         */
        private _clearAnimationLocks();
        /**
         *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
         */
        private _applyUserInteraction();
        /**
         * Stops and removes all animations that have been applied to the camera
         */
        stopAllAnimations(): void;
        /**
         * Gets a value indicating if the user is moving the camera
         */
        readonly isUserIsMoving: boolean;
        /**
         * The camera can move all the way towards the mesh.
         */
        static IgnoreBoundsSizeMode: number;
        /**
         * The camera is not allowed to zoom closer to the mesh than the point at which the adjusted bounding sphere touches the frustum sides
         */
        static FitFrustumSidesMode: number;
    }
}

declare module 'babylonjs/cameraBehaviors' {
    /**
     * Add a bouncing effect to an ArcRotateCamera when reaching a specified minimum and maximum radius
     */
    class BouncingBehavior implements Behavior<ArcRotateCamera> {
        readonly name: string;
        /**
         * The easing function used by animations
         */
        static EasingFunction: BackEase;
        /**
         * The easing mode used by animations
         */
        static EasingMode: number;
        /**
         * The duration of the animation, in milliseconds
         */
        transitionDuration: number;
        /**
         * Length of the distance animated by the transition when lower radius is reached
         */
        lowerRadiusTransitionRange: number;
        /**
         * Length of the distance animated by the transition when upper radius is reached
         */
        upperRadiusTransitionRange: number;
        private _autoTransitionRange;
        /**
         * Gets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
         */
        /**
         * Sets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
         * Transition ranges will be set to 5% of the bounding box diagonal in world space
         */
        autoTransitionRange: boolean;
        private _attachedCamera;
        private _onAfterCheckInputsObserver;
        private _onMeshTargetChangedObserver;
        init(): void;
        attach(camera: ArcRotateCamera): void;
        detach(): void;
        private _radiusIsAnimating;
        private _radiusBounceTransition;
        private _animatables;
        private _cachedWheelPrecision;
        /**
         * Checks if the camera radius is at the specified limit. Takes into account animation locks.
         * @param radiusLimit The limit to check against.
         * @return Bool to indicate if at limit.
         */
        private _isRadiusAtLimit(radiusLimit);
        /**
         * Applies an animation to the radius of the camera, extending by the radiusDelta.
         * @param radiusDelta The delta by which to animate to. Can be negative.
         */
        private _applyBoundRadiusAnimation(radiusDelta);
        /**
         * Removes all animation locks. Allows new animations to be added to any of the camera properties.
         */
        protected _clearAnimationLocks(): void;
        /**
         * Stops and removes all animations that have been applied to the camera
         */
        stopAllAnimations(): void;
    }
}

declare module 'babylonjs/cameraBehaviors' {
    class AutoRotationBehavior implements Behavior<ArcRotateCamera> {
        readonly name: string;
        private _zoomStopsAnimation;
        private _idleRotationSpeed;
        private _idleRotationWaitTime;
        private _idleRotationSpinupTime;
        /**
        * Gets the flag that indicates if user zooming should stop animation.
        */
        /**
        * Sets the flag that indicates if user zooming should stop animation.
        */
        zoomStopsAnimation: boolean;
        /**
        * Gets the default speed at which the camera rotates around the model.
        */
        /**
        * Sets the default speed at which the camera rotates around the model.
        */
        idleRotationSpeed: number;
        /**
        * Gets the time (milliseconds) to wait after user interaction before the camera starts rotating.
        */
        /**
        * Sets the time (in milliseconds) to wait after user interaction before the camera starts rotating.
        */
        idleRotationWaitTime: number;
        /**
        * Gets the time (milliseconds) to take to spin up to the full idle rotation speed.
        */
        /**
        * Sets the time (milliseconds) to take to spin up to the full idle rotation speed.
        */
        idleRotationSpinupTime: number;
        /**
         * Gets a value indicating if the camera is currently rotating because of this behavior
         */
        readonly rotationInProgress: boolean;
        private _onPrePointerObservableObserver;
        private _onAfterCheckInputsObserver;
        private _attachedCamera;
        private _isPointerDown;
        private _lastFrameTime;
        private _lastInteractionTime;
        private _cameraRotationSpeed;
        init(): void;
        attach(camera: ArcRotateCamera): void;
        detach(): void;
        /**
         * Returns true if user is scrolling.
         * @return true if user is scrolling.
         */
        private _userIsZooming();
        private _lastFrameRadius;
        private _shouldAnimationStopForInteraction();
        /**
         *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
         */
        private _applyUserInteraction();
        private _userIsMoving();
    }
}

import {EffectFallbacks,EffectCreationOptions,Effect,Nullable,float,double,int,FloatArray,IndicesArray,KeyboardEventTypes,KeyboardInfo,KeyboardInfoPre,PointerEventTypes,PointerInfoBase,PointerInfoPre,PointerInfo,ToGammaSpace,ToLinearSpace,Epsilon,Color3,Color4,Vector2,Vector3,Vector4,ISize,Size,Quaternion,Matrix,Plane,Viewport,Frustum,Space,Axis,BezierCurve,Orientation,Angle,Arc2,Path2,Path3D,Curve3,PositionNormalVertex,PositionNormalTextureVertex,Tmp,Scalar,expandToProperty,serialize,serializeAsTexture,serializeAsColor3,serializeAsFresnelParameters,serializeAsVector2,serializeAsVector3,serializeAsMeshReference,serializeAsColorCurves,serializeAsColor4,serializeAsImageProcessingConfiguration,serializeAsQuaternion,SerializationHelper,EventState,Observer,MultiObserver,Observable,SmartArray,SmartArrayNoDuplicate,IAnimatable,LoadFileError,RetryStrategy,IFileRequest,Tools,PerfCounter,className,AsyncLoop,_AlphaState,_DepthCullingState,_StencilState,InstancingAttributeInfo,RenderTargetCreationOptions,EngineCapabilities,EngineOptions,IDisplayChangedEventArgs,Engine,Node,BoundingSphere,BoundingBox,ICullable,BoundingInfo,TransformNode,AbstractMesh,Light,Camera,RenderingManager,RenderingGroup,IDisposable,IActiveMeshCandidateProvider,RenderingGroupInfo,Scene,Buffer,VertexBuffer,InternalTexture,BaseTexture,Texture,_InstancesBatch,Mesh,BaseSubMesh,SubMesh,MaterialDefines,Material,UniformBuffer,IGetSetVerticesData,VertexData,Geometry,_PrimitiveGeometry,RibbonGeometry,BoxGeometry,SphereGeometry,DiscGeometry,CylinderGeometry,TorusGeometry,GroundGeometry,TiledGroundGeometry,PlaneGeometry,TorusKnotGeometry,PostProcessManager,PerformanceMonitor,RollingAverage,IImageProcessingConfigurationDefines,ImageProcessingConfiguration,ColorGradingTexture,ColorCurves,Behavior,MaterialHelper,PushMaterial,StandardMaterialDefines,StandardMaterial} from 'babylonjs/core';
import {EngineInstrumentation,SceneInstrumentation,_TimeToken} from 'babylonjs/instrumentation';
import {Particle,IParticleSystem,ParticleSystem,BoxParticleEmitter,ConeParticleEmitter,SphereParticleEmitter,SphereDirectedParticleEmitter,IParticleEmitterType} from 'babylonjs/particles';
import {GPUParticleSystem} from 'babylonjs/gpuParticles';
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
