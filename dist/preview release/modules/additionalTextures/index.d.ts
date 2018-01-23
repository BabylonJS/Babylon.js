declare module 'babylonjs/additionalTextures' {
    class CubeTexture extends BaseTexture {
        url: string;
        coordinatesMode: number;
        private _noMipmap;
        private _files;
        private _extensions;
        private _textureMatrix;
        private _format;
        private _prefiltered;
        static CreateFromImages(files: string[], scene: Scene, noMipmap?: boolean): CubeTexture;
        static CreateFromPrefilteredData(url: string, scene: Scene, forcedExtension?: any): CubeTexture;
        constructor(rootUrl: string, scene: Scene, extensions?: Nullable<string[]>, noMipmap?: boolean, files?: Nullable<string[]>, onLoad?: Nullable<() => void>, onError?: Nullable<(message?: string, exception?: any) => void>, format?: number, prefiltered?: boolean, forcedExtension?: any);
        delayLoad(): void;
        getReflectionTextureMatrix(): Matrix;
        setReflectionTextureMatrix(value: Matrix): void;
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): CubeTexture;
        clone(): CubeTexture;
    }
}

declare module 'babylonjs/additionalTextures' {
    class RenderTargetTexture extends Texture {
        isCube: boolean;
        static _REFRESHRATE_RENDER_ONCE: number;
        static _REFRESHRATE_RENDER_ONEVERYFRAME: number;
        static _REFRESHRATE_RENDER_ONEVERYTWOFRAMES: number;
        static readonly REFRESHRATE_RENDER_ONCE: number;
        static readonly REFRESHRATE_RENDER_ONEVERYFRAME: number;
        static readonly REFRESHRATE_RENDER_ONEVERYTWOFRAMES: number;
        /**
        * Use this predicate to dynamically define the list of mesh you want to render.
        * If set, the renderList property will be overwritten.
        */
        renderListPredicate: (AbstractMesh: AbstractMesh) => boolean;
        /**
        * Use this list to define the list of mesh you want to render.
        */
        renderList: Nullable<Array<AbstractMesh>>;
        renderParticles: boolean;
        renderSprites: boolean;
        coordinatesMode: number;
        activeCamera: Nullable<Camera>;
        customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>, beforeTransparents?: () => void) => void;
        useCameraPostProcesses: boolean;
        ignoreCameraViewport: boolean;
        private _postProcessManager;
        private _postProcesses;
        private _resizeObserver;
        /**
        * An event triggered when the texture is unbind.
        * @type {BABYLON.Observable}
        */
        onBeforeBindObservable: Observable<RenderTargetTexture>;
        /**
        * An event triggered when the texture is unbind.
        * @type {BABYLON.Observable}
        */
        onAfterUnbindObservable: Observable<RenderTargetTexture>;
        private _onAfterUnbindObserver;
        onAfterUnbind: () => void;
        /**
        * An event triggered before rendering the texture
        * @type {BABYLON.Observable}
        */
        onBeforeRenderObservable: Observable<number>;
        private _onBeforeRenderObserver;
        onBeforeRender: (faceIndex: number) => void;
        /**
        * An event triggered after rendering the texture
        * @type {BABYLON.Observable}
        */
        onAfterRenderObservable: Observable<number>;
        private _onAfterRenderObserver;
        onAfterRender: (faceIndex: number) => void;
        /**
        * An event triggered after the texture clear
        * @type {BABYLON.Observable}
        */
        onClearObservable: Observable<Engine>;
        private _onClearObserver;
        onClear: (Engine: Engine) => void;
        clearColor: Color4;
        protected _size: number | {
            width: number;
            height: number;
        };
        protected _initialSizeParameter: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        };
        protected _sizeRatio: Nullable<number>;
        _generateMipMaps: boolean;
        protected _renderingManager: RenderingManager;
        _waitingRenderList: string[];
        protected _doNotChangeAspectRatio: boolean;
        protected _currentRefreshId: number;
        protected _refreshRate: number;
        protected _textureMatrix: Matrix;
        protected _samples: number;
        protected _renderTargetOptions: RenderTargetCreationOptions;
        readonly renderTargetOptions: RenderTargetCreationOptions;
        protected _engine: Engine;
        protected _onRatioRescale(): void;
        constructor(name: string, size: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        }, scene: Nullable<Scene>, generateMipMaps?: boolean, doNotChangeAspectRatio?: boolean, type?: number, isCube?: boolean, samplingMode?: number, generateDepthBuffer?: boolean, generateStencilBuffer?: boolean, isMulti?: boolean);
        private _processSizeParameter(size);
        samples: number;
        resetRefreshCounter(): void;
        refreshRate: number;
        addPostProcess(postProcess: PostProcess): void;
        clearPostProcesses(dispose?: boolean): void;
        removePostProcess(postProcess: PostProcess): void;
        _shouldRender(): boolean;
        getRenderSize(): number;
        getRenderWidth(): number;
        getRenderHeight(): number;
        readonly canRescale: boolean;
        scale(ratio: number): void;
        getReflectionTextureMatrix(): Matrix;
        resize(size: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        }): void;
        render(useCameraPostProcess?: boolean, dumpForDebug?: boolean): void;
        private _bestReflectionRenderTargetDimension(renderDimension, scale);
        protected unbindFrameBuffer(engine: Engine, faceIndex: number): void;
        private renderToTarget(faceIndex, currentRenderList, currentRenderListLength, useCameraPostProcess, dumpForDebug);
        /**
         * Overrides the default sort function applied in the renderging group to prepare the meshes.
         * This allowed control for front to back rendering or reversly depending of the special needs.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
         * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
         * @param transparentSortCompareFn The transparent queue comparison function use to sort.
         */
        setRenderingOrder(renderingGroupId: number, opaqueSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, alphaTestSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, transparentSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>): void;
        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         */
        setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean): void;
        clone(): RenderTargetTexture;
        serialize(): any;
        disposeFramebufferObjects(): void;
        dispose(): void;
        _rebuild(): void;
    }
}

declare module 'babylonjs/additionalTextures' {
    interface IMultiRenderTargetOptions {
        generateMipMaps?: boolean;
        types?: number[];
        samplingModes?: number[];
        generateDepthBuffer?: boolean;
        generateStencilBuffer?: boolean;
        generateDepthTexture?: boolean;
        textureCount?: number;
        doNotChangeAspectRatio?: boolean;
        defaultType?: number;
    }
    class MultiRenderTarget extends RenderTargetTexture {
        private _internalTextures;
        private _textures;
        readonly isSupported: boolean;
        private _multiRenderTargetOptions;
        readonly textures: Texture[];
        readonly depthTexture: Texture;
        wrapU: number;
        wrapV: number;
        constructor(name: string, size: any, count: number, scene: Scene, options?: IMultiRenderTargetOptions);
        _rebuild(): void;
        private _createInternalTextures();
        private _createTextures();
        samples: number;
        resize(size: any): void;
        protected unbindFrameBuffer(engine: Engine, faceIndex: number): void;
        dispose(): void;
        releaseInternalTextures(): void;
    }
}

declare module 'babylonjs/additionalTextures' {
    class MirrorTexture extends RenderTargetTexture {
        mirrorPlane: Plane;
        private _transformMatrix;
        private _mirrorMatrix;
        private _savedViewMatrix;
        private _blurX;
        private _blurY;
        private _adaptiveBlurKernel;
        private _blurKernelX;
        private _blurKernelY;
        private _blurRatio;
        blurRatio: number;
        adaptiveBlurKernel: number;
        blurKernel: number;
        blurKernelX: number;
        blurKernelY: number;
        private _autoComputeBlurKernel();
        protected _onRatioRescale(): void;
        constructor(name: string, size: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        }, scene: Scene, generateMipMaps?: boolean, type?: number, samplingMode?: number, generateDepthBuffer?: boolean);
        private _preparePostProcesses();
        clone(): MirrorTexture;
        serialize(): any;
    }
}

declare module 'babylonjs/additionalTextures' {
    /**
    * Creates a refraction texture used by refraction channel of the standard material.
    * @param name the texture name
    * @param size size of the underlying texture
    * @param scene root scene
    */
    class RefractionTexture extends RenderTargetTexture {
        refractionPlane: Plane;
        depth: number;
        constructor(name: string, size: number, scene: Scene, generateMipMaps?: boolean);
        clone(): RefractionTexture;
        serialize(): any;
    }
}

declare module 'babylonjs/additionalTextures' {
    class DynamicTexture extends Texture {
        private _generateMipMaps;
        private _canvas;
        private _context;
        private _engine;
        constructor(name: string, options: any, scene: Scene | null | undefined, generateMipMaps: boolean, samplingMode?: number, format?: number);
        readonly canRescale: boolean;
        private _recreate(textureSize);
        scale(ratio: number): void;
        scaleTo(width: number, height: number): void;
        getContext(): CanvasRenderingContext2D;
        clear(): void;
        update(invertY?: boolean): void;
        drawText(text: string, x: number, y: number, font: string, color: string, clearColor: string, invertY?: boolean, update?: boolean): void;
        clone(): DynamicTexture;
        _rebuild(): void;
    }
}

declare module 'babylonjs/additionalTextures' {
    class VideoTexture extends Texture {
        video: HTMLVideoElement;
        private _autoLaunch;
        private _lastUpdate;
        private _generateMipMaps;
        private _setTextureReady;
        private _engine;
        /**
         * Creates a video texture.
         * Sample : https://doc.babylonjs.com/tutorials/01._Advanced_Texturing
         * @param {Array} urlsOrVideo can be used to provide an array of urls or an already setup HTML video element.
         * @param {BABYLON.Scene} scene is obviously the current scene.
         * @param {boolean} generateMipMaps can be used to turn on mipmaps (Can be expensive for videoTextures because they are often updated).
         * @param {boolean} invertY is false by default but can be used to invert video on Y axis
         * @param {number} samplingMode controls the sampling method and is set to TRILINEAR_SAMPLINGMODE by default
         */
        constructor(name: string, urlsOrVideo: string[] | HTMLVideoElement, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number);
        private __setTextureReady();
        private _createTexture();
        _rebuild(): void;
        update(): boolean;
        dispose(): void;
        static CreateFromWebCam(scene: Scene, onReady: (videoTexture: VideoTexture) => void, constraints: {
            minWidth: number;
            maxWidth: number;
            minHeight: number;
            maxHeight: number;
            deviceId: string;
        }): void;
    }
}

declare module 'babylonjs/additionalTextures' {
    class RawTexture extends Texture {
        format: number;
        private _engine;
        constructor(data: ArrayBufferView, width: number, height: number, format: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number, type?: number);
        update(data: ArrayBufferView): void;
        static CreateLuminanceTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateLuminanceAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateRGBTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number, type?: number): RawTexture;
        static CreateRGBATexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number, type?: number): RawTexture;
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
