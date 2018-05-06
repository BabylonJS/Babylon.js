declare module 'babylonjs/solidParticles' {
    class SolidParticle {
        idx: number;
        color: Nullable<Color4>;
        position: Vector3;
        rotation: Vector3;
        rotationQuaternion: Nullable<Quaternion>;
        scaling: Vector3;
        uvs: Vector4;
        velocity: Vector3;
        pivot: Vector3;
        alive: boolean;
        isVisible: boolean;
        _pos: number;
        _ind: number;
        _model: ModelShape;
        shapeId: number;
        idxInShape: number;
        _modelBoundingInfo: BoundingInfo;
        _boundingInfo: BoundingInfo;
        _sps: SolidParticleSystem;
        _stillInvisible: boolean;
        /**
         * Creates a Solid Particle object.
         * Don't create particles manually, use instead the Solid Particle System internal tools like _addParticle()
         * `particleIndex` (integer) is the particle index in the Solid Particle System pool. It's also the particle identifier.
         * `positionIndex` (integer) is the starting index of the particle vertices in the SPS "positions" array.
         * `indiceIndex` (integer) is the starting index of the particle indices in the SPS "indices" array.
         * `model` (ModelShape) is a reference to the model shape on what the particle is designed.
         * `shapeId` (integer) is the model shape identifier in the SPS.
         * `idxInShape` (integer) is the index of the particle in the current model (ex: the 10th box of addShape(box, 30))
         * `modelBoundingInfo` is the reference to the model BoundingInfo used for intersection computations.
         */
        constructor(particleIndex: number, positionIndex: number, indiceIndex: number, model: Nullable<ModelShape>, shapeId: number, idxInShape: number, sps: SolidParticleSystem, modelBoundingInfo?: Nullable<BoundingInfo>);
        /**
         * legacy support, changed scale to scaling
         */
        scale: Vector3;
        /**
         * legacy support, changed quaternion to rotationQuaternion
         */
        quaternion: Nullable<Quaternion>;
        /**
         * Returns a boolean. True if the particle intersects another particle or another mesh, else false.
         * The intersection is computed on the particle bounding sphere and Axis Aligned Bounding Box (AABB)
         * `target` is the object (solid particle or mesh) what the intersection is computed against.
         */
        intersectsMesh(target: Mesh | SolidParticle): boolean;
    }
    class ModelShape {
        shapeID: number;
        _shape: Vector3[];
        _shapeUV: number[];
        _indicesLength: number;
        _positionFunction: Nullable<(particle: SolidParticle, i: number, s: number) => void>;
        _vertexFunction: Nullable<(particle: SolidParticle, vertex: Vector3, i: number) => void>;
        /**
         * Creates a ModelShape object. This is an internal simplified reference to a mesh used as for a model to replicate particles from by the SPS.
         * SPS internal tool, don't use it manually.
         */
        constructor(id: number, shape: Vector3[], indicesLength: number, shapeUV: number[], posFunction: Nullable<(particle: SolidParticle, i: number, s: number) => void>, vtxFunction: Nullable<(particle: SolidParticle, vertex: Vector3, i: number) => void>);
    }
    class DepthSortedParticle {
        ind: number;
        indicesLength: number;
        sqDistance: number;
    }
}

declare module 'babylonjs/solidParticles' {
    /**
    * Full documentation here : http://doc.babylonjs.com/overviews/Solid_Particle_System
    */
    class SolidParticleSystem implements IDisposable {
        /**
        *  The SPS array of Solid Particle objects. Just access each particle as with any classic array.
        *  Example : var p = SPS.particles[i];
        */
        particles: SolidParticle[];
        /**
        * The SPS total number of particles. Read only. Use SPS.counter instead if you need to set your own value.
        */
        nbParticles: number;
        /**
        * If the particles must ever face the camera (default false). Useful for planar particles.
        */
        billboard: boolean;
        /**
         * Recompute normals when adding a shape
         */
        recomputeNormals: boolean;
        /**
        * This a counter ofr your own usage. It's not set by any SPS functions.
        */
        counter: number;
        /**
        * The SPS name. This name is also given to the underlying mesh.
        */
        name: string;
        /**
        * The SPS mesh. It's a standard BJS Mesh, so all the methods from the Mesh class are avalaible.
        */
        mesh: Mesh;
        /**
        * This empty object is intended to store some SPS specific or temporary values in order to lower the Garbage Collector activity.
        * Please read : http://doc.babylonjs.com/overviews/Solid_Particle_System#garbage-collector-concerns
        */
        vars: any;
        /**
        * This array is populated when the SPS is set as 'pickable'.
        * Each key of this array is a `faceId` value that you can get from a pickResult object.
        * Each element of this array is an object `{idx: int, faceId: int}`.
        * `idx` is the picked particle index in the `SPS.particles` array
        * `faceId` is the picked face index counted within this particle.
        * Please read : http://doc.babylonjs.com/overviews/Solid_Particle_System#pickable-particles
        */
        pickedParticles: {
            idx: number;
            faceId: number;
        }[];
        /**
        * This array is populated when `enableDepthSort` is set to true.
        * Each element of this array is an instance of the class DepthSortedParticle.
        */
        depthSortedParticles: DepthSortedParticle[];
        private _scene;
        private _positions;
        private _indices;
        private _normals;
        private _colors;
        private _uvs;
        private _indices32;
        private _positions32;
        private _normals32;
        private _fixedNormal32;
        private _colors32;
        private _uvs32;
        private _index;
        private _updatable;
        private _pickable;
        private _isVisibilityBoxLocked;
        private _alwaysVisible;
        private _depthSort;
        private _shapeCounter;
        private _copy;
        private _shape;
        private _shapeUV;
        private _color;
        private _computeParticleColor;
        private _computeParticleTexture;
        private _computeParticleRotation;
        private _computeParticleVertex;
        private _computeBoundingBox;
        private _depthSortParticles;
        private _cam_axisZ;
        private _cam_axisY;
        private _cam_axisX;
        private _axisZ;
        private _camera;
        private _particle;
        private _camDir;
        private _camInvertedPosition;
        private _rotMatrix;
        private _invertMatrix;
        private _rotated;
        private _quaternion;
        private _vertex;
        private _normal;
        private _yaw;
        private _pitch;
        private _roll;
        private _halfroll;
        private _halfpitch;
        private _halfyaw;
        private _sinRoll;
        private _cosRoll;
        private _sinPitch;
        private _cosPitch;
        private _sinYaw;
        private _cosYaw;
        private _mustUnrotateFixedNormals;
        private _minimum;
        private _maximum;
        private _minBbox;
        private _maxBbox;
        private _particlesIntersect;
        private _depthSortFunction;
        private _needs32Bits;
        _bSphereOnly: boolean;
        _bSphereRadiusFactor: number;
        /**
        * Creates a SPS (Solid Particle System) object.
        * `name` (String) is the SPS name, this will be the underlying mesh name.
        * `scene` (Scene) is the scene in which the SPS is added.
        * `updatable` (optional boolean, default true) : if the SPS must be updatable or immutable.
        * `isPickable` (optional boolean, default false) : if the solid particles must be pickable.
        * `enableDepthSort` (optional boolean, default false) : if the solid particles must be sorted in the geometry according to their distance to the camera.
        * `particleIntersection` (optional boolean, default false) : if the solid particle intersections must be computed.
        * `boundingSphereOnly` (optional boolean, default false) : if the particle intersection must be computed only with the bounding sphere (no bounding box computation, so faster).
        * `bSphereRadiusFactor` (optional float, default 1.0) : a number to multiply the boundind sphere radius by in order to reduce it for instance.
        *  Example : bSphereRadiusFactor = 1.0 / Math.sqrt(3.0) => the bounding sphere exactly matches a spherical mesh.
        */
        constructor(name: string, scene: Scene, options?: {
            updatable?: boolean;
            isPickable?: boolean;
            enableDepthSort?: boolean;
            particleIntersection?: boolean;
            boundingSphereOnly?: boolean;
            bSphereRadiusFactor?: number;
        });
        /**
        * Builds the SPS underlying mesh. Returns a standard Mesh.
        * If no model shape was added to the SPS, the returned mesh is just a single triangular plane.
        */
        buildMesh(): Mesh;
        /**
        * Digests the mesh and generates as many solid particles in the system as wanted. Returns the SPS.
        * These particles will have the same geometry than the mesh parts and will be positioned at the same localisation than the mesh original places.
        * Thus the particles generated from `digest()` have their property `position` set yet.
        * `mesh` ( Mesh ) is the mesh to be digested
        * `facetNb` (optional integer, default 1) is the number of mesh facets per particle, this parameter is overriden by the parameter `number` if any
        * `delta` (optional integer, default 0) is the random extra number of facets per particle , each particle will have between `facetNb` and `facetNb + delta` facets
        * `number` (optional positive integer) is the wanted number of particles : each particle is built with `mesh_total_facets / number` facets
        */
        digest(mesh: Mesh, options?: {
            facetNb?: number;
            number?: number;
            delta?: number;
        }): SolidParticleSystem;
        private _unrotateFixedNormals();
        private _resetCopy();
        private _meshBuilder(p, shape, positions, meshInd, indices, meshUV, uvs, meshCol, colors, meshNor, normals, idx, idxInShape, options);
        private _posToShape(positions);
        private _uvsToShapeUV(uvs);
        private _addParticle(idx, idxpos, idxind, model, shapeId, idxInShape, bInfo?);
        /**
        * Adds some particles to the SPS from the model shape. Returns the shape id.
        * Please read the doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#create-an-immutable-sps
        * `mesh` is any Mesh object that will be used as a model for the solid particles.
        * `nb` (positive integer) the number of particles to be created from this model
        * `positionFunction` is an optional javascript function to called for each particle on SPS creation.
        * `vertexFunction` is an optional javascript function to called for each vertex of each particle on SPS creation
        */
        addShape(mesh: Mesh, nb: number, options?: {
            positionFunction?: any;
            vertexFunction?: any;
        }): number;
        private _rebuildParticle(particle);
        /**
        * Rebuilds the whole mesh and updates the VBO : custom positions and vertices are recomputed if needed.
        * Returns the SPS.
        */
        rebuildMesh(): SolidParticleSystem;
        /**
        *  Sets all the particles : this method actually really updates the mesh according to the particle positions, rotations, colors, textures, etc.
        *  This method calls `updateParticle()` for each particle of the SPS.
        *  For an animated SPS, it is usually called within the render loop.
        * @param start The particle index in the particle array where to start to compute the particle property values _(default 0)_
        * @param end The particle index in the particle array where to stop to compute the particle property values _(default nbParticle - 1)_
        * @param update If the mesh must be finally updated on this call after all the particle computations _(default true)_
        * Returns the SPS.
        */
        setParticles(start?: number, end?: number, update?: boolean): SolidParticleSystem;
        private _quaternionRotationYPR();
        private _quaternionToRotationMatrix();
        /**
        * Disposes the SPS.
        * Returns nothing.
        */
        dispose(): void;
        /**
        * Visibilty helper : Recomputes the visible size according to the mesh bounding box
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
        * Returns the SPS.
        */
        refreshVisibleSize(): SolidParticleSystem;
        /**
        * Visibility helper : Sets the size of a visibility box, this sets the underlying mesh bounding box.
        * @param size the size (float) of the visibility box
        * note : this doesn't lock the SPS mesh bounding box.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
        */
        setVisibilityBox(size: number): void;
        /**
        * Sets the SPS as always visible or not
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
        */
        isAlwaysVisible: boolean;
        /**
        * Sets the SPS visibility box as locked or not. This enables/disables the underlying mesh bounding box updates.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
        */
        isVisibilityBoxLocked: boolean;
        /**
        * Tells to `setParticles()` to compute the particle rotations or not.
        * Default value : true. The SPS is faster when it's set to false.
        * Note : the particle rotations aren't stored values, so setting `computeParticleRotation` to false will prevents the particle to rotate.
        */
        computeParticleRotation: boolean;
        /**
        * Tells to `setParticles()` to compute the particle colors or not.
        * Default value : true. The SPS is faster when it's set to false.
        * Note : the particle colors are stored values, so setting `computeParticleColor` to false will keep yet the last colors set.
        */
        computeParticleColor: boolean;
        /**
        * Tells to `setParticles()` to compute the particle textures or not.
        * Default value : true. The SPS is faster when it's set to false.
        * Note : the particle textures are stored values, so setting `computeParticleTexture` to false will keep yet the last colors set.
        */
        computeParticleTexture: boolean;
        /**
        * Tells to `setParticles()` to call the vertex function for each vertex of each particle, or not.
        * Default value : false. The SPS is faster when it's set to false.
        * Note : the particle custom vertex positions aren't stored values.
        */
        computeParticleVertex: boolean;
        /**
        * Tells to `setParticles()` to compute or not the mesh bounding box when computing the particle positions.
        */
        computeBoundingBox: boolean;
        /**
        * Tells to `setParticles()` to sort or not the distance between each particle and the camera.
        * Skipped when `enableDepthSort` is set to `false` (default) at construction time.
        * Default : `true`
        */
        depthSortParticles: boolean;
        /**
        * This function does nothing. It may be overwritten to set all the particle first values.
        * The SPS doesn't call this function, you may have to call it by your own.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
        */
        initParticles(): void;
        /**
        * This function does nothing. It may be overwritten to recycle a particle.
        * The SPS doesn't call this function, you may have to call it by your own.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
        */
        recycleParticle(particle: SolidParticle): SolidParticle;
        /**
        * Updates a particle : this function should  be overwritten by the user.
        * It is called on each particle by `setParticles()`. This is the place to code each particle behavior.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
        * ex : just set a particle position or velocity and recycle conditions
        */
        updateParticle(particle: SolidParticle): SolidParticle;
        /**
        * Updates a vertex of a particle : it can be overwritten by the user.
        * This will be called on each vertex particle by `setParticles()` if `computeParticleVertex` is set to true only.
        * @param particle the current particle
        * @param vertex the current index of the current particle
        * @param pt the index of the current vertex in the particle shape
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#update-each-particle-shape
        * ex : just set a vertex particle position
        */
        updateParticleVertex(particle: SolidParticle, vertex: Vector3, pt: number): Vector3;
        /**
        * This will be called before any other treatment by `setParticles()` and will be passed three parameters.
        * This does nothing and may be overwritten by the user.
        * @param start the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param update the boolean update value actually passed to setParticles()
        */
        beforeUpdateParticles(start?: number, stop?: number, update?: boolean): void;
        /**
        * This will be called  by `setParticles()` after all the other treatments and just before the actual mesh update.
        * This will be passed three parameters.
        * This does nothing and may be overwritten by the user.
        * @param start the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param update the boolean update value actually passed to setParticles()
        */
        afterUpdateParticles(start?: number, stop?: number, update?: boolean): void;
    }
}

import {EffectFallbacks,EffectCreationOptions,Effect,Nullable,float,double,int,FloatArray,IndicesArray,KeyboardEventTypes,KeyboardInfo,KeyboardInfoPre,PointerEventTypes,PointerInfoBase,PointerInfoPre,PointerInfo,ToGammaSpace,ToLinearSpace,Epsilon,Color3,Color4,Vector2,Vector3,Vector4,ISize,Size,Quaternion,Matrix,Plane,Viewport,Frustum,Space,Axis,BezierCurve,Orientation,Angle,Arc2,Path2,Path3D,Curve3,PositionNormalVertex,PositionNormalTextureVertex,Tmp,Scalar,expandToProperty,serialize,serializeAsTexture,serializeAsColor3,serializeAsFresnelParameters,serializeAsVector2,serializeAsVector3,serializeAsMeshReference,serializeAsColorCurves,serializeAsColor4,serializeAsImageProcessingConfiguration,serializeAsQuaternion,SerializationHelper,EventState,Observer,MultiObserver,Observable,SmartArray,SmartArrayNoDuplicate,IAnimatable,LoadFileError,RetryStrategy,IFileRequest,Tools,PerfCounter,className,AsyncLoop,_AlphaState,_DepthCullingState,_StencilState,InstancingAttributeInfo,RenderTargetCreationOptions,EngineCapabilities,EngineOptions,IDisplayChangedEventArgs,Engine,Node,BoundingSphere,BoundingBox,ICullable,BoundingInfo,TransformNode,AbstractMesh,Light,Camera,RenderingManager,RenderingGroup,IDisposable,IActiveMeshCandidateProvider,RenderingGroupInfo,Scene,Buffer,VertexBuffer,InternalTexture,BaseTexture,Texture,_InstancesBatch,Mesh,BaseSubMesh,SubMesh,MaterialDefines,Material,UniformBuffer,IGetSetVerticesData,VertexData,Geometry,_PrimitiveGeometry,RibbonGeometry,BoxGeometry,SphereGeometry,DiscGeometry,CylinderGeometry,TorusGeometry,GroundGeometry,TiledGroundGeometry,PlaneGeometry,TorusKnotGeometry,PostProcessManager,PerformanceMonitor,RollingAverage,IImageProcessingConfigurationDefines,ImageProcessingConfiguration,ColorGradingTexture,ColorCurves,Behavior,MaterialHelper,PushMaterial,StandardMaterialDefines,StandardMaterial} from 'babylonjs/core';
import {EngineInstrumentation,SceneInstrumentation,_TimeToken} from 'babylonjs/instrumentation';
import {Particle,IParticleSystem,ParticleSystem,BoxParticleEmitter,ConeParticleEmitter,SphereParticleEmitter,SphereDirectedParticleEmitter,IParticleEmitterType} from 'babylonjs/particles';
import {GPUParticleSystem} from 'babylonjs/gpuParticles';
import {FramingBehavior,BouncingBehavior,AutoRotationBehavior} from 'babylonjs/cameraBehaviors';
import {NullEngineOptions,NullEngine} from 'babylonjs/nullEngine';
import {TextureTools} from 'babylonjs/textureTools';
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
