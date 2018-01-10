declare module 'babylonjs/additionalMeshes' {
    class GroundMesh extends Mesh {
        generateOctree: boolean;
        private _heightQuads;
        _subdivisionsX: number;
        _subdivisionsY: number;
        _width: number;
        _height: number;
        _minX: number;
        _maxX: number;
        _minZ: number;
        _maxZ: number;
        constructor(name: string, scene: Scene);
        getClassName(): string;
        readonly subdivisions: number;
        readonly subdivisionsX: number;
        readonly subdivisionsY: number;
        optimize(chunksCount: number, octreeBlocksSize?: number): void;
        /**
         * Returns a height (y) value in the Worl system :
         * the ground altitude at the coordinates (x, z) expressed in the World system.
         * Returns the ground y position if (x, z) are outside the ground surface.
         */
        getHeightAtCoordinates(x: number, z: number): number;
        /**
         * Returns a normalized vector (Vector3) orthogonal to the ground
         * at the ground coordinates (x, z) expressed in the World system.
         * Returns Vector3(0.0, 1.0, 0.0) if (x, z) are outside the ground surface.
         */
        getNormalAtCoordinates(x: number, z: number): Vector3;
        /**
         * Updates the Vector3 passed a reference with a normalized vector orthogonal to the ground
         * at the ground coordinates (x, z) expressed in the World system.
         * Doesn't uptade the reference Vector3 if (x, z) are outside the ground surface.
         * Returns the GroundMesh.
         */
        getNormalAtCoordinatesToRef(x: number, z: number, ref: Vector3): GroundMesh;
        /**
        * Force the heights to be recomputed for getHeightAtCoordinates() or getNormalAtCoordinates()
        * if the ground has been updated.
        * This can be used in the render loop.
        * Returns the GroundMesh.
        */
        updateCoordinateHeights(): GroundMesh;
        private _getFacetAt(x, z);
        private _initHeightQuads();
        private _computeHeightQuads();
        serialize(serializationObject: any): void;
        static Parse(parsedMesh: any, scene: Scene): GroundMesh;
    }
}

declare module 'babylonjs/additionalMeshes' {
    /**
     * Creates an instance based on a source mesh.
     */
    class InstancedMesh extends AbstractMesh {
        private _sourceMesh;
        private _currentLOD;
        constructor(name: string, source: Mesh);
        /**
         * Returns the string "InstancedMesh".
         */
        getClassName(): string;
        readonly receiveShadows: boolean;
        readonly material: Nullable<Material>;
        readonly visibility: number;
        readonly skeleton: Nullable<Skeleton>;
        readonly renderingGroupId: number;
        /**
         * Returns the total number of vertices (integer).
         */
        getTotalVertices(): number;
        readonly sourceMesh: Mesh;
        /**
         * Returns a float array or a Float32Array of the requested kind of data : positons, normals, uvs, etc.
         */
        getVerticesData(kind: string, copyWhenShared?: boolean): Nullable<FloatArray>;
        /**
         * Sets the vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.
         * The `data` are either a numeric array either a Float32Array.
         * The parameter `updatable` is passed as is to the underlying Geometry object constructor (if initianilly none) or updater.
         * The parameter `stride` is an optional positive integer, it is usually automatically deducted from the `kind` (3 for positions or normals, 2 for UV, etc).
         * Note that a new underlying VertexBuffer object is created each call.
         * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): Mesh;
        /**
         * Updates the existing vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, it is simply returned as it is.
         * The `data` are either a numeric array either a Float32Array.
         * No new underlying VertexBuffer object is created.
         * If the `kind` is the `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         * If the parameter `makeItUnique` is true, a new global geometry is created from this positions and is set to the mesh.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): Mesh;
        /**
         * Sets the mesh indices.
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array).
         * If the mesh has no geometry, a new Geometry object is created and set to the mesh.
         * This method creates a new index buffer each call.
         * Returns the Mesh.
         */
        setIndices(indices: IndicesArray, totalVertices?: Nullable<number>): Mesh;
        /**
         * Boolean : True if the mesh owns the requested kind of data.
         */
        isVerticesDataPresent(kind: string): boolean;
        /**
         * Returns an array of indices (IndicesArray).
         */
        getIndices(): Nullable<IndicesArray>;
        readonly _positions: Nullable<Vector3[]>;
        /**
         * Sets a new updated BoundingInfo to the mesh.
         * Returns the mesh.
         */
        refreshBoundingInfo(): InstancedMesh;
        _preActivate(): InstancedMesh;
        _activate(renderId: number): InstancedMesh;
        /**
         * Returns the current associated LOD AbstractMesh.
         */
        getLOD(camera: Camera): AbstractMesh;
        _syncSubMeshes(): InstancedMesh;
        _generatePointsArray(): boolean;
        /**
         * Creates a new InstancedMesh from the current mesh.
         * - name (string) : the cloned mesh name
         * - newParent (optional Node) : the optional Node to parent the clone to.
         * - doNotCloneChildren (optional boolean, default `false`) : if `true` the model children aren't cloned.
         *
         * Returns the clone.
         */
        clone(name: string, newParent: Node, doNotCloneChildren?: boolean): InstancedMesh;
        /**
         * Disposes the InstancedMesh.
         * Returns nothing.
         */
        dispose(doNotRecurse?: boolean): void;
    }
}

declare module 'babylonjs/additionalMeshes' {
    class LinesMesh extends Mesh {
        useVertexColor: boolean | undefined;
        useVertexAlpha: boolean | undefined;
        color: Color3;
        alpha: number;
        /**
         * The intersection Threshold is the margin applied when intersection a segment of the LinesMesh with a Ray.
         * This margin is expressed in world space coordinates, so its value may vary.
         * Default value is 0.1
         * @returns the intersection Threshold value.
         */
        /**
         * The intersection Threshold is the margin applied when intersection a segment of the LinesMesh with a Ray.
         * This margin is expressed in world space coordinates, so its value may vary.
         * @param value the new threshold to apply
         */
        intersectionThreshold: number;
        private _intersectionThreshold;
        private _colorShader;
        constructor(name: string, scene?: Nullable<Scene>, parent?: Nullable<Node>, source?: LinesMesh, doNotCloneChildren?: boolean, useVertexColor?: boolean | undefined, useVertexAlpha?: boolean | undefined);
        /**
         * Returns the string "LineMesh"
         */
        getClassName(): string;
        material: Material;
        readonly checkCollisions: boolean;
        createInstance(name: string): InstancedMesh;
        _bind(subMesh: SubMesh, effect: Effect, fillMode: number): LinesMesh;
        _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number): LinesMesh;
        dispose(doNotRecurse?: boolean): void;
        /**
         * Returns a new LineMesh object cloned from the current one.
         */
        clone(name: string, newParent?: Node, doNotCloneChildren?: boolean): LinesMesh;
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
