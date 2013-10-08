// babylon.engine.d.ts
interface WebGLProgram {

}

interface WebGLShader {

}

interface WebGLUniformLocation {

}

interface WebGLRenderingContext {

}

interface VertexBuffer {
    [index: number]: number;
}

interface IndexBuffer {
    [index: number]: number;
}

declare module BABYLON {
    interface Capabilities {
        maxTexturesImageUnits: number;
        maxTextureSize: number;
        maxCubemapTextureSize: number;
        maxRenderTextureSize: number;
    }

    class Engine {
        constructor(canvas: HTMLCanvasElement, antialias: boolean);

        forceWireframe: boolean;
        cullBackFaces: boolean;
        scenes: Scene[];
        isPointerLock: boolean;

        getAspectRatio(): number; 
        getRenderWidth(): number;
        getRenderHeight(): number;
        getRenderingCanvas(): HTMLCanvasElement;
        setHardwareScalingLevel(level: number): void;
        getLoadedTexturesCache(): Texture[]; 
        getCaps(): Capabilities;

        stopRenderLoop(): void;
        runRenderLoop(renderFunction: Function): void;

        switchFullscreen(element: HTMLElement);
        clear(color: IColor3, backBuffer: boolean, depthStencil: boolean);

        beginFrame(): void;
        endFrame(): void;
        resize(): void;
        bindFramebuffer(texture: Texture);
        unBindFramebuffer(texture: Texture);
        flushFramebuffer(): void;
        restoreDefaultFramebuffer(): void;

        createVertexBuffer(vertices: number[]): VertexBuffer;
        createVertexBuffer(vertices: ArrayBuffer): VertexBuffer;
        createVertexBuffer(vertices: ArrayBufferView): VertexBuffer;
        createDynamicVertexBuffer(capacity: number): VertexBuffer;
        updateDynamicVertexBuffer(vertexBuffer: VertexBuffer, vertices: number[]): void; 
        updateDynamicVertexBuffer(vertexBuffer: VertexBuffer, vertices: ArrayBuffer): void; 
        updateDynamicVertexBuffer(vertexBuffer: VertexBuffer, vertices: ArrayBufferView): void; 
        createIndexBuffer(indices, is32Bits): IndexBuffer;
        bindBuffers(vb: VertexBuffer, ib: IndexBuffer, vdecl: number[], strideSize: number, effect: Effect);
        bindMultiBuffers(vertexBuffers: VertexBuffer[], indexBuffer: IndexBuffer, effect: Effect): void;
        _releaseBuffer(vb: VertexBuffer);
        draw(useTriangles: boolean, indexStart: number, indexCount: number);
        createEffect(baseName: string, attributesNames: string, uniformsNames: string[],
            samplers: WebGLUniformLocation[],
            defines: string): Effect; 
        createShaderProgram(vertexCode: string, fragmentCode: string, defines: string): WebGLProgram;
        getUniforms(shaderProgram: WebGLProgram, uniformsNames: string[]): WebGLUniformLocation[];
        getAttributes(shaderProgram: WebGLProgram, attributesNames: string[]): number[]; 
        enableEffect(effect: Effect): void;
        setMatrices(uniform: string, matrices: Matrix[]): void;
        setMatrix(uniform: string, matrix: Matrix): void; 
        setVector2(uniform: string, x: number, y: number): void;  
        setVector3(uniform: string, v: Vector3): void; 
        setFloat2(uniform: string, x: number, y: number): void;
        setFloat3(uniform: string, x: number, y: number, z: number): void;
        setBool(uniform: string, val: boolean): void;
        setFloat4(uniform: string, x: number, y: number, z: number, w: number): void;
        setColor3(uniform: string, color: Color3): void; 
        setColor4(uniform: string, color: Color3, alpha: number): void; 
        setState(cullingMode: number): void;
        setDepthBuffer(enable: boolean): void;
        setDepthWrite(enable: boolean): void;
        setColorWrite(enable: boolean): void;
        setAlphaMode(mode: number): void;
        setAlphaTesting(enable: boolean): void;
        getAlphaTesting(): boolean;
        wipeCaches(): void;
        getExponantOfTwo(value: number, max: number): number;
        createTexture(url: string, noMipmap: boolean, invertY: boolean, scene: Scene): Texture;
        createDynamicTexture(size: number, noMipmap: boolean): Texture;
        updateDynamicTexture(texture: Texture, canvas: HTMLCanvasElement, invertY: boolean): void;
        updateVideoTexture(texture: Texture, video: HTMLVideoElement): void;
        createRenderTargetTexture(size: number, generateMipMaps: boolean): Texture;
        createCubeTexture(rootUrl: string, scene: Scene): Texture;
        _releaseTexture(tex: Texture): void;
        bindSamplers(effect: Effect): void;
        setTexture(channel: number, texture: Texture): void; 
        dispose(): void;

        static ShadersRepository: string;

        static ALPHA_DISABLE: number;
        static ALPHA_ADD: number;
        static ALPHA_COMBINE: number;

        static DELAYLOADSTATE_NONE: number;
        static DELAYLOADSTATE_LOADED: number;
        static DELAYLOADSTATE_LOADING: number;
        static DELAYLOADSTATE_NOTLOADED: number;

        static epsilon: number;
        static collisionEpsilon: number;

        static isSupported(): boolean;
    }

    // babylon.scene.d.ts
    interface ScenePickResult {
        hit: boolean;
        distance: number;
        pickedMesh: Mesh;
        pickedPoint: Vector3;
    }

    class Scene {
        constructor(engine: Engine);

        autoClear: boolean;
        clearColor: Color3;
        ambientColor: Color3;

        fogMode: number;
        fogColor: Color3;
        fogDensity: number;
        fogStart: number;
        fogEnd: number;

        lights: Light[];
        cameras: Camera[];
        activeCamera: Camera;
        meshes: Mesh[];
        materials: Material[];
        multiMaterials: MultiMaterial[];
        defaultMaterial: StandardMaterial;
        textures: Texture[];
        particlesEnabled: boolean;
        particleSystems: ParticleSystem[];
        spriteManagers: SpriteManager[];
        layers: Layer[];
        skeletons: Skeleton[];
        collisionsEnabled: boolean;
        gravity: Vector3;
        postProcessManager: PostProcessManager;

        getEngine(): Engine;
        getTotalVertices(): number;
        getActiveVertices(): number;
        getActiveParticles(): number;
        getLastFrameDuration(): number;
        getEvaluateActiveMeshesDuration(): number;
        getRenderTargetsDuration(): number;
        getRenderDuration(): number;
        getParticlesDuration(): number;
        getSpritesDuration(): number;
        getAnimationRatio(): number;
        getRenderId: number;

        isReady(): boolean;
        registerBeforeRender(func: Function): void;
        unregisterBeforeRender(func: Function): void;
        executeWhenReady(func: Function): void;
        getWaitingItemsCount(): number;

        beginAnimation(target: string, from: number, to: number, loop: boolean, speedRatio: number, onAnimationEnd: Function): void;
        stopAnimation(target: string);

        getViewMatrix(): Matrix;
        getProjectionMatrix(): Matrix;
        getTransformMatrix(): Matrix;
        setTransformMatrix(view: Matrix, projection: Matrix);
        activeCameraByID(id: number): void;
        getMaterialByID(id: number): Material;
        getLightByID(id: number): Light;
        getMeshByID(id: number): Mesh;
        getLastMeshByID(id: number): Mesh;
        getMeshByName(name: string): Mesh;
        isActiveMesh(mesh: Mesh): boolean;
        getLastSkeletonByID(id: number): Skeleton;
        getSkeletonByID(id: number): Skeleton;
        getSkeletonByName(name: string): Skeleton;

        _evaluateActiveMeshes(): void;
        _localRender(opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, activeMeshes);
        render();
        dispose();
        _getNewPosition(position: Vector3, velocity: Vector3, collider: Sphere, maximumRetries: number): Vector3;
        _collideWithWorld(position: Vector3, velocity: Vector3, collider: Sphere, maximumRetries: number): Vector3;

        createOrUpdateSelectionOctree(): void;
        createPickingRay(x: number, y: number, world: Matrix): Ray;
        pick(x: number, y: number): ScenePickResult;

        static FOGMODE_NONE: number;
        static FOGMODE_EXP: number;
        static FOGMODE_EXP2: number;
        static FOGMODE_LINEAR: number;
    }

    // babylon.math.d.ts
    interface RayTriangleIntersection {
        hit: boolean;
        distance: number;
        bu: number;
        bv: number;
    }

    interface IColor3 {
        r: number;
        g: number;
        b: number;
    }

    interface Size2D 
    {
        width: number;
        height: number;
    }

    interface Sphere {
        center: Vector3;
        radius: number;
    }

    class Ray {
        origin: Vector3;
        direction: Vector3;

        constructor(origin: Vector3, direction: Vector3);

        intersectsBox(box: BoundingBox): boolean;
        intersectsSphere(sphere: Sphere): boolean;
        intersectsTriangle(vertex0: Vector3,
            vertex1: Vector3,
            vertex2: Vector3): RayTriangleIntersection;

        static CreateNew(x: number,
            y: number,
            viewportWidth: number,
            viewportHeight: number,
            world: Matrix,
            view: Matrix,
            projection: Matrix): Ray;

    }

    class Color3 implements IColor3 {
        r: number;
        g: number;
        b: number;

        constructor(intialR: number, initialG: number, initialB: number);

        equals(otherColor: Color3): boolean;
        equals(otherColor: Color4): boolean;
        toString(): string;
        clone(): Color3;

        multiply(otherColor: Color3): Color3;
        mutilplyToRef(otherColor: Color3, result: Color3): void;
        scale(scale: number): Color3;
        scaleToRef(scale: number, result: Color3): void;
        copyFrom(source: Color3): void;
        copyFromFloats(r: number, g: number, b: number): void;
        
        static FromArray(array: number[]): Color3;
    }

    class Color4 implements IColor3 {
        r: number;
        g: number;
        b: number;
        a: number;

        constructor(initialR: number, initialG: number, initialB: number, initialA: number);

        addInPlace(right: Color4): void;
        add(right: Color4): Color4;
        subtract(right: Color4): Color4;
        subtractToRef(right: Color4, result: Color4): void;
        scale(factor: number): Color4;
        scale(factor: number, result: Color4): void;

        toString(): string;
        clone(): Color4;

        static Lerp(left: number, right: number, amount: number): Color4;
        static FromArray(array: number[]): Color4;

    }

    class Vector2 {
        x: number;
        y: number;

        constructor(x: number, y: number);

        toString(): string;

        add(other: Vector2): Vector2;
        subtract(other: Vector2): Vector2;
        negate(): Vector2;
        scaleInPlace(scale: number): void;
        scale(scale: number): Vector2;
        equals(other: Vector2): boolean;
        length(): number;
        lengthSquared(): number;
        normalize();
        clone(): Vector2;

        static Zero(): Vector2;
        static CatmullRom(value1: Vector2, value2: Vector2, value3: Vector2, value4: Vector2, amount: number): Vector2;
        static Clamp(value: Vector2, min: Vector2, max: Vector2): Vector2;
        static Hermite(value1: Vector2, tangent1: Vector2, value2: Vector2, tangent2: Vector2, amount: number): Vector2;
        static Lerp(start: Vector2, end: Vector2, amount: number): Vector2;
        static Dot(left: Vector2, right: Vector2): number;
        static Normalize(vector: Vector2): Vector2;
        static Minimize(left: Vector2, right: Vector2): Vector2;
        static Maximize(left: Vector2, right: Vector2): Vector2;
        static Transform(vector: Vector2, transformation: number[]): Vector2;
        static Distance(value1: Vector2, value2: Vector2): number;
        static DistanceSquared(value1: Vector2, value2: Vector2): number;
    }

    class Vector3 {
        x: number;
        y: number;
        z: number;

        constructor(x: number, y: number, z: number);

        toString(): string;

        addInPlace(otherVector: Vector3): void;
        add(other: Vector3): Vector3;
        addToRef(otherVector: Vector3, result: Vector3): void;
        suntractInPlace(otherVector: Vector3): void;
        subtract(other: Vector3): Vector3;
        subtractToRef(otherVector: Vector3, result: Vector3): void;
        subtractFromFloatsTo(x: number, y: number, z: number): Vector3;
        subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3): void;
        negate(): Vector3;
        scaleInPlace(scale: number): void;
        scale(scale: number): Vector3;
        scaleToRef(scale: number, result: Vector3): void;
        equals(other: Vector3): boolean;
        equalsToFloats(x: number, y: number, z: number): boolean;
        multiplyInPlace(other: Vector3): void;
        multiply(other: Vector3): Vector3;
        multiplyToRef(otherVector: Vector3, result: Vector3): void
        multiplyByFloats(x: number, y: number, z: number): Vector3;
        divide(other: Vector3): Vector3;
        divideToRef(otherVector: Vector3, result: Vector3): void; 
        length(): number;
        lengthSquared(): number;
        normalize();
        clone(): Vector3;
        copyFrom(source: Vector3): void;
        copyFromFloats(x: number, y: number, z: number): void;

        static FromArray(array: number[], offset: number);
        static FromArrayToRef(array: number[], offset: number, result: Vector3): void;
        static FromFloatsToRef(x: number, y: number, z: number, result: Vector3): void;
        static Zero(): Vector3;
        static Up(): Vector3;
        static TransformCoordinates(vector: Vector3, transformation: Matrix): Vector3;
        static TransformCoordinatesToRef(vector: Vector3, transformation: Matrix, result: Vector3): void;
        static TransformCoordinatesFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void;
        static TransformNormal(vector: Vector3, transformation: Matrix): Vector3;
        static TransformNormalToRef(vector: Vector3, transformation: Matrix, result: Vector3): void;
        static TransformNormalFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void;

        static CatmullRom(value1: Vector3, value2: Vector3, value3: Vector3, value4: Vector3, amount: number): Vector3;
        static Clamp(value: Vector3, min: Vector3, max: Vector3): Vector3;
        static Hermite(value1: Vector3, tangent1: Vector3, value2: Vector3, tangent2: Vector3, amount: number): Vector3;
        static Lerp(start: Vector3, end: Vector3, amount: number): Vector3;
        static Dot(left: Vector3, right: Vector3): number;
        static Cross(left: Vector3, right: Vector3): Vector3;
        static CrossToRef(left: Vector3, right: Vector3, result: Vector3): void;
        static Normalize(vector: Vector3): Vector3;
        static NormalizeToRef(vector: Vector3, result: Vector3): void;
        static Unproject(source: Vector3,
            viewportWidth: number,
            viewportHeight: number,
            world: Matrix,
            view: Matrix,
            projection: Matrix): Vector3;

        static Minimize(left: Vector3, right: Vector3): Vector3;
        static Maximize(left: Vector3, right: Vector3): Vector3;
        static Distance(value1: Vector3, value2: Vector3): number;
        static DistanceSquared(value1: Vector3, value2: Vector3): number;
    }

    class Quaternion {
        x: number;
        y: number;
        z: number;
        w: number;

        toString(): string;

        constructor(x: number, y: number, z: number, w: number);

        equals(otherQuaternion: Quaternion): boolean;
        clone(): Quaternion;
        copyFrom(other: Quaternion): void;
        add(other: Quaternion): Quaternion;
        scale(factor: number): Quaternion;
        multiply(q1: Quaternion): Quaternion;
        multiplyToRef(q1: Quaternion, result: Quaternion): void;
        length(): number;
        normalize(): void;
        toEulerAngles(): Vector3;
        toRotationMatrix(result: Quaternion): void;

        static FromArray(array: number[], offset: number): Quaternion;
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Quaternion;
        static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Quaternion): void;
        static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion;
    }

    class Matrix {
        m: number[];

        constructor();

        isIdentity(): boolean;
        determinant(): number;
        toArray(): number[];
        invert(): void;
        invertToRef(other: Matrix): void;
        setTranslations(vector3: Vector3): void;
        multiply(other: Matrix): Matrix;
        copyFrom(other: Matrix): void;
        multiplyToRef(other: Matrix, result: Matrix): void;
        multiplyToArray(other: Matrix, result: number[], offset: number): void;
        equals(other: Matrix): boolean;
        clone(): Matrix;

        static FromArray(array: number[], offset: number): Matrix;
        static FromArrayToRef(array: number[], offset: number, result: Matrix): void;
        static FromValues(m11: number, m12: number, m13: number, m14: number,
            m21: number, m22: number, m23: number, m24: number,
            m31: number, m32: number, m33: number, m34: number,
            m41: number, m42: number, m43: number, m44: number): Matrix;
        static FromValuesToRef(m11: number, m12: number, m13: number, m14: number,
            m21: number, m22: number, m23: number, m24: number,
            m31: number, m32: number, m33: number, m34: number,
            m41: number, m42: number, m43: number, m44: number, result: Matrix): void;
        static Identity(): Matrix;
        static IdentityToRef(result: Matrix): void;
        static Zero(): Matrix;
        static RotationX(angle: number): Matrix;
        static RotationXToRef(angle: number, result: Matrix): void;
        static RotationY(angle: number): Matrix;
        static RotationYToRef(angle: number, result: Matrix): void;
        static RotationZ(angle: number): Matrix;
        static RotationZToRef(angle: number, result: Matrix): void;
        static RotationAxis(axis: Vector3, angle: number): Matrix;
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Matrix;
        static Scaling(scaleX: number, scaleY: number, scaleZ: number): Matrix;
        static ScalingToRef(scaleX: number, scaleY: number, scaleZ: number, result: Matrix): void;
        static Translation(x: number, y: number, z: number): Matrix;
        static TranslationToRef(x: number, y: number, z: number, result: Matrix): void;
        static LookAtLH(eye: Vector3, target: Vector3, up: Vector3): Matrix;
        static LookAtLHToRef(eye: Vector3, target: Vector3, up: Vector3, result: Matrix): void;
        static OrthoLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix;
        static OrthoOffCenterLHToRef(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void;
        static PerspectiveLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number): Matrix;
        static PerspectiveFovLHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix): void;
        static AffineTransformation(scaling: number, rotationCenter: Vector3, rotation: Quaternion, translation: Vector3): Matrix;
        static GetFinalMatrix(viewport: Size2D, world: Matrix, view: Matrix, projection: Matrix): Matrix;
        static Transpose(matrix: Matrix): Matrix;
        static Reflection(plane: Plane): Matrix;
        static ReflectionToRef(plane: Plane, result: Matrix): void;
    }

    class Plane {
        normal: Vector3;
        d: number;

        constructor(a: number, b: number, c: number, d: number);

        normalize(): void;
        transform(transformation: Matrix): Plane;
        dotCoordinate(point: Vector3): number;
        copyFromPoints(point1: Vector3, point2: Vector3, point3: Vector3): void;
        isFrontFacingTo(direction: Vector3, epsilon: Vector3): boolean;
        signedDistanceTo(point: Vector3): number;

        static FromArray(array: number[]): Plane;
        static FromPoints(point1: Vector3, point2: Vector3, point3: Vector3): Plane;
        static FromPositionAndNormal(origin: Vector3, normal: Vector2): Plane;
        static SignedDistanceToPlaneFromPositionAndNormal(origin: Vector3, normal: Vector3, point): number;
    }

    class Frustum {
        frustrumPlanes: Plane[];

        constructor(transform: Matrix);

        static GetPlanes(transform: Matrix): Plane[];
    }

    // babylon.tools.d.ts
	class Tools {
		function ExtractMinAndMax(positions: number[], start: number, count: number): Object;
		function GetPointerPrefix(): string;
		function QueueNewFrame(func: Function): void;
		function RequestFullscreen(element: HTMLElement): void;
		function ExitFullscreen(): void;
		var BaseUrl: string;
		function LoadImage(url: string, onload: Function, onerror: Function, database: Database): HTMLImageElement;
		function LoadFile(url: string, callback: Function, progressCallback: Function): void;
		function isIE(): boolean;
		function WithinEpsilon(a: number, b: number);
		function cloneValue(source: Object, destinationObject: Object): void;
		function DeepCopy(source: Object, destination: Object, doNotCopyList: string[], mustCopyList: string[]);
		var fpsRange: number;
		var previousFramesDuration: number[];
		function GetFps(): number;
		function GetDeltaTime(): number;
		function _MeasureFps(): void;
	
		class SmartArray {
			data: Array;
			length: number;

			constructor(capacity: number);

			push(value: Object): void;
			pushNoDuplicate(value: Object): void;
			reset(): void;
			concat(array: SmartArray): void;
			concatWithNoDuplicate(array: SmartArray): void;
			indexOf(value: Object): number;
		}
	}

    //babylon.sceneLoader.d.ts
	function loadCubeTexture(rootUrl: string, parsedTexture: JSON, scene: Scene): CubeTexture;
    function loadTexture(rootUrl: string, parsedTexture: JSON, scene: Scene): Texture;
    function parseSkeleton(parsedSkeleton: JSON, scene: Scene): Skeleton;
    function parseMaterial(parsedMaterial: JSON, scene: Scene, rootUrl: string): Material;
    function parseMaterialById(id: number, parsedData: JSON, scene: Scene, rootUrl: string): Material;
    function parseMultiMaterial(parsedMultiMaterial: JSON, scene: Scene): MultiMaterial;
    function parseParticleSystem(parsedParticleSystem: JSON, scene: Scene, rootUrl: string): ParticleSystem;
    function parseShadowGenerator(parsedShadowGenerator: JSON, scene: Scene): ShadowGenerator;
    function parseAnimation(parsedAnimation: JSON): Animation;
    function parseLight(parsedLight: JSON, scene: Scene): Light;
    function parseMesh(parsedMesh: JSON, scene: Scene, rootUrl: string): Mesh;
    function isDescendantOf(mesh: Mesh, name: string, hierarchyIds: number[]): boolean;

    class SceneLoader {
        _ImportGeometry(parsedGeometry, mesh): void;
        ImportMesh(meshName: string, rootUrl: string, sceneFilename: string, scene: Scene, then: Function): void;
        Load(rootUrl: string, sceneFilename: string, engine: Engine, then: Function, progressCallback: Function): void;
    }
	
	// babylon.database.d.ts
	 class Database {
        currentSceneUrl: string;
        db: Database;
        enableSceneOffline: boolean;
        enableTexturesOffline: boolean;
        manifestVersionFound: number;
        mustUpdateRessources: boolean;
        hasReachedQuota: boolean;

        constructor(urlToScene: string);

        isUASupportingBlobStorage: boolean;

        parseURL(url: string): string;
        ReturnFullUrlLocation(url: string): string;
        checkManifestFile(): void;
        openAsync(successCallback: Function, errorCallback: Function): void;
        loadImageFromDB(url: string, image: HTMLImageElement): void;
        _loadImageFromDBAsync(url: string, image: HTMLImageElement, notInDBCallback: Function);
        _saveImageIntoDBAsync(url: string, image: HTMLImageElement): void;
        _checkVersionFromDB(url: string, versionLoaded: number): void;
        _loadVersionFromDBAsync(url: string, callback, updateInDBCallback: Function): void;
        _saveVersionIntoDBAsync(url: string, callback: Function): void;
        loadSceneFromDB(url: string, sceneLoaded: Scene, progressCallBack: Function): void;
        _loadSceneFromDBAsync(url: string, callback: Function, notInDBCallback: Function): void;
        _saveSceneFromDBAsync(url: string, callback: Function, progressCallback: Function): void;
    }
	
    // babylon.animation.d.ts
	 class Animation {
        name: string;
        targetProperty: string;
        targetPropertyPath: string[];
        framePerSecond: number;
        dataType: string;
        loopMode: number;
        _keys: number[];
        _offsetCache: Object;
        _highLimitsCache: Object;

        constructor(name: string, targetProperty: string, framePerSecond: number, dataType: string, loopMode: number);

        clone(): Animation;
        setKeys(values: number[]);
        _interpolate(currentFrame: number, repeatCount: number, loopMode: number, offsetValue: number, highLimitValue: number);
        animate(target: Object, delay: number, from: number, to: number, loop: boolean, speedRatio: number): boolean;
        
        static ANIMATIONTYPE_FLOAT: number;
        static ANIMATIONTYPE_VECTOR3: number;
        static ANIMATIONTYPE_QUATERNION: number;
        static ANIMATIONTYPE_MATRIX: number;

        static ANIMATIONLOOPMODE_RELATIVE: number;
        static ANIMATIONLOOPMODE_CYCLE: number;
        static ANIMATIONLOOPMODE_CONSTANT: number;
    }
	
	    class _Animatable {
        target: Object;
        fromFrame: number;
        toFrame: number;
        loopAnimation: boolean;
        animationStartDate: Date;
        speedRatio: number;
        onAnimationEnd: Function;

        constructor(target: Object, from: number, to: number, loop: boolean, speedRatio: number, onAnimationEnd: Function);

        animationStarted: boolean;

        _animate(delay: number): boolean;
    }
	
	// babylon.bones.d.ts
	    class Bone {
        name: string;
        _skeleton: Skeleton;
        _matrix: Matrix;
        _baseMatrix: Matrix;
        _worldTransform: Matrix;
        _absoluteTransform: Matrix;
        _invertedAbsoluteTransform: Matrix;
        children: Bone[];
        animation: Animation[];

        constructor(name: string, skeleton: Skeleton, parentBone: Bone, matrix: Matrix);

        getParent(): Bone;
        getLocalMatrix: Matrix;
        getAbsoluteMatrix: Matrix;
        _updateDifferenceMatrix(): void ;
        updateMatrix(matrix: Matrix): void;
        markAsDirty(): void;
    }
	
	 class Skeleton {
        id: number;
        name: string;
        bones: Bone[];
        _scene: Scene;
        _isDirty: boolean;

        constructor(name: string, id: number, scene: Scene);

        getTransformMatrices(): Matrix[];
        prepare(): void;
        getAnimatables(): Animation[];
        clone(name: string, id: number): Skeleton;
    }
	
    // babylon.camera.d.ts
	  class Camera {
        name: string;
        id: string;
        position: Vector3;
        _scene: Scene;

        constructor(name: string, position: Vector3, scene: Scene);

        static PERSPECTIVE_CAMERA: number;
        static ORTHOGRAPHIC_CAMERA: number;

        fov: number;
        orthoLeft: number;
        orthoRight: number;
        orthoBottom: number;
        orthoTop: number;
        minZ: number;
        maxZ: number;
        intertia: number;
        mode: number;

        attachControl(canvas: HTMLCanvasElement): void;
        detachControl(canvas: HTMLCanvasElement): void;
        _update();
        getViewMatrix(): Matrix;
        getProjectionMatrix(): Matrix;
    }
	
	 class FreeCamera extends Camera {
        cameraDirection: Vector3;
        cameraRotation: Vector2;
        rotation: Vector3;
        ellipsoid: Vector3;
        _keys: number[];
        keysUp: number[];
        keysDown: number[];
        keysLeft: number[];
        keysRight: number[];
        _collider: Collider;
        _needsMoveForGravity: boolean;
        animations: Animation[];

        constructor(name: string, position: Vector3, scene: Scene);

        speed: number;
        checkCollisions: boolean;
        applyGravity: boolean;

        _computeLocalCameraSpeed(): number;
        setTarget(target: Vector3): void;
        _collideWithWorld(velocity: Vector3): void;
        _checkInputs();
    }
	
	 class ArcRotateCamera extends Camera {
        alpha: number;
        beta: number;
        radius: number;
        target: Vector3;

        _keys: number[];
        keysUp: number[];
        keysDown: number[];
        keysLeft: number[];
        keysRight: number[];
        _viewMatrix: Matrix;

        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene);

        inertialAlphaOffset: number;
        interialBetaOffset: number;
        lowerAlphaLimit: number;
        upperAlphaLimit: number;
        lowerBetaLimit: number;
        upperBetaLimit: number;
        lowerRadiusLimit: number;
        upperRadiusLimit: number;
        setPosition(position: Vector3): void;
    }
	
	 class DeviceOrientationCamera extends FreeCamera {
        angularSensibility: number;
        moveSensibility: number;

        constructor(name: string, position: Vector3, scene: Scene);

        _offsetX: number;
        _offsetY: number;
        _orientationGamma: number;
        _orientationBeta: number;
        _initialOrientationGamma: number;
        _initialOrientationBeta: number;
    }
	
	  class TouchCamera extends FreeCamera {
        _offsetX: number;
        _offsetY: number;
        _pointerCount: number;
        _pointerPressed: number[];
        angularSensibility: number;
        moveSensibility: number;

        constructor(name: string, position: Vector3, scene: Scene);
    }
	
    // babylon.collider.d.ts
	 interface CollisionResponse {
        position: Vector3;
        velocity: Vector3;
    }

    class Collider {
        radius: Vector3;
        retry: number;

        basePointWorld: Vector3;
        velocityWorld: Vector3;
        normalizedVelocity: Vector3;

        constructor();

        _initialize(source: Vector3, dir: Vector3, e: number): void;
        _checkPontInTriangle(point: Vector3, pa: Vector3, pb: Vector3, pc: Vector3, n: Vector3): boolean;
        intersectBoxAASphere(boxMin: Vector3, boxMax: Vector3, sphereCenter: Vector3, sphereRadius: number): boolean;
        getLowestRoot(a: number, b: number, c: number, maxR: number): Object;
        _canDoCollision(sphereCenter: Vector3, sphereRadius: number, vecMin: Vector3, vecMax: Vector3): boolean;
        _testTriangle(subMesh: SubMesh, p1: Vector3, p2: Vector3, p3: Vector3): void;
        _collide(subMesh: SubMesh, pts: VertexBuffer, indices: IndexBuffer, indexStart: number, indexEnd: number, decal: number);
        _getResponse(pos: Vector3, vel: Vector3): CollisionResponse;
    }
	
	 class CollisionPlane {
        normal: Vector3;
        origin: Vector3;
        equation: number[];

        constructor(origin: Vector3, normal: Vector3);

        isFrontFactingTo(direction: Vector3, epsilon: number): boolean;
        signedDistanceTo(point: Vector3): number;

        static CreateFromPoints(p1: Vector3, p2: Vector3, p3: Vector3): CollisionPlane;
    }
	
    // babylon.bounding.d.ts
    class BoundingBox {
        minimum: Vector3;
        maximum: Vector3;
        vectors: Vector3[];
        center: Vector3;
        extends: Vector3;
        directions: Vector3[];
        vectorsWorld: Vector3[];
        minimumWorld: Vector3;
        maximumWorld: Vector3;

        constructor(minimum: Vector3, maximum: Vector3);

        _update(world: Matrix): void;
        isInFrustrum(frustrumPlanes: Plane[]): boolean;
        intersectsPoint(point: Vector3): boolean;
        intersectsSphere(sphere: Sphere): boolean;
        intersectsMinMax(min: Vector3, max: Vector3): boolean;
        IsInFrustrum(boundingVectors: Vector3[], frustrumPlanes: Plane[]): boolean;

        static intersects(box0: BoundingBox, box1: BoundingBox): boolean;
    }
	
	class BoundingInfo {
        boundingBox: BoundingBox;
        boundingSphere: BoundingSphere;

        constructor(minimum: Vector3, maximum, Vector3);

        _update(world: Matrix, scale: number): void;

        extentsOverlap(min0, max0, min1, max1): boolean;
        computeBoxExtents(axis: Vector3, box: BoundingBox): Object;
        axisOverlap(axis: Vector3, box0: BoundingBox, box1: BoundingBox): boolean;
        isInFrustrum(frustrumPlanes: Plane[]): boolean;
        _checkCollision(collider: Collider): boolean;
        intersectsPoint(point: Vector3): boolean;
        intersects(boundingInfo: BoundingInfo, precise: boolean): boolean;

    }
	
	class BoundingSphere {
        minimum: Vector3;
        maximum: Vector3;
        center: Vector3;
        radius: number;
        distance: number;
        centerWorld: Vector3;

        constructor(minimum: Vector3, maximum: Vector3);

        _update(world: Matrix, scale: number): void;
        isInFrustrum(frustrumPlanes: Plane[]): boolean;
        intersectsPoint(point: Vector3): boolean;

        static intersects(sphere0: BoundingSphere, sphere1: BoundingSphere): boolean;
    }
	
	class Octree {
        blocks: OctreeBlock[];
        _maxBlockCapacity: number;
        _selection: Tools.SmartArray;

        constructor(maxBlockCapacity: number);

        update(worldMin: Vector3, worldMax: Vector3, meshes: Mesh[]): void;
        addMesh(mesh: Mesh): void;
        select(frustrumPlanes: Plane[]): void;

        static _CreateBlocks(worldMin: Vector3, worldMax: Vector3, meshes: Mesh[], maxBlockCapacity: number, target: OctreeBlock): void;
    }
	
	class OctreeBlock {
        subMeshes: Mesh[];
        meshes: Mesh[];
        _capacity: number;
        _minPoint: Vector3;
        _maxPoint: Vector3;
        _boundingVector: Vector3[];

        constructor(minPoint: Vector3, maxPoint: Vector3, capacity: number)

        addMesh(mesh: Mesh): void;
        addEntries(meshes: Mesh[]): void;
        select(frustrumPlanes: Plane[], selection: Tools.SmartArray): void;
    }
	
    // babylon.layer.d.ts
	class Layer {
        name: string;
        texture: Texture;
        isBackground: boolean;
        color: Color4;
        _scene: Scene;
        vertices: number[];
        indicies: number[];
        _indexBuffer: IndexBuffer;
        _effect: Effect;

        constructor(name: string, imgUrl: string, scene: Scene, isBackground: boolean, color: Color4);

        onDispose: () => void;
        render(): void;
        dispose(): void;
    }
	

    // babylon.light.d.ts
    class Light {
        name: string;
        id: string;

        constructor(name: string, scene: Scene);

        intensity: number;
        isEnabled: boolean;

        getScene(): Scene;
        getShadowGenerator: ShadowGenerator;
        dispose(): void;
    }

	class PointLight extends Light {
        position: Vector3;
        diffuse: Color3;
        specular: Color3;
        animations: Animation[];

        constructor(name: string, position: Vector3, scene: Scene)
    }
	class SpotLight {
        position: Vector3;
        direction: Vector3;
        angle: number;
        exponent: number;
        diffuse: Color3;
        specular: Color3;
        animations: Animation[];

        constructor(name: string, position: Vector3, direction: Vector3, angle: number, exponsent: number, scene: Scene);
    }
	
	 class HemisphericLight {
        direction: Vector3;
        diffuse: Color3;
        specular: Color3;
        groundColor: Color3;
        animations: Animation[];

        constructor(name: string, direction: Vector3, scene: Scene);

        getShadowGenerator(): void;
    }
	
	class DirectionalLight extends Light {
        direction: Vector3;
        animations: Animation[];
        position: Vector3;
        diffuse: Color3;
        specular: Color3;

        constructor(name: string, direction: Vector3, scene: Scene);
    }
	
	    class ShadowGenerator {
        _light: Light;
        _scene: Scene;

        _shadowMap: RenderTargetTexture;

        constructor(mapSize: number, light: Light);

        renderSubMesh(subMesh: Mesh): void;

        useVarianceShadowMap: boolean;

        isReady(mesh: Mesh): boolean;
        getShadowMap(): RenderTargetTexture;
        getLight(): Light;
        getTransformMatrix(): Matrix;
        dispose(): void;
    }
	
    // babylon.effect.d.ts
    class Effect {
        name: string;
        defines: string;

        constructor(baseName: string, attributesNames: string[], uniformsNames: string[], samplers: WebGLUniformLocation[], engine: Engine, defines: string);

        isReady(): boolean;
        getProgram(): WebGLProgram;
        getAttribute(index: number): string;
        getAttributesNames(): string;
        getAttributesCount(): number;
        getUniformIndex(uniformName: string): number;
        getUniform(uniformName: string): string;
        getSamplers(): WebGLUniformLocation[];
        getCompilationError(): string;

        _prepareEffect(vertexSourceCode: string, fragmentSourceCode: string, attributeNames: string[], defines: string): void;
        setTexture(channel: string, texture: Texture): void;
        setMatrices(uniformName: string, matrices: Matrix[]): void;
        setMatrix(uniformName: string, matrix: Matrix): void;
        setBool(uniformName: string, val: boolean): void;
        setVector3(uniformName: string, val: Vector3): void;
        setFloat2(uniformName: string, x: number, y: number);
        setFloat3(uniformName: string, x: number, y: number, z: number);
        setFloat4(uniformName: string, x: number, y: number, z: number, w: number);
        setColor3(uniformName: string, color: Color3): void;
        setColor4(uniformName: string, color: Color4): void;

        static ShadersStore: Object;
    }

    // babylon.material.d.ts
	class Material {
        name: string;
        id: string;

        constructor(name: string, scene: Scene);

        checkReadyOnEveryCall: boolean;
        alpha: number;
        wireframe: boolean;
        backFaceCulling: boolean;
        _effect: Effect;

        onDispose: () => void;

        isReady(): boolean;
        getEffect(): Effect;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;

        _preBind(): void;
        bind(world: Matrix, mesh: Mesh): void;
        unbind(): void;
        baseDispose(): void;

        dispose(): void;
    }
	
	class MultiMaterial extends Material {
        subMaterials: Material[];

        constructor(name: string, scene: Scene);

        getSubMaterial(index: number): Material;
    }
	
	class StandardMaterial extends Material {
        diffuseTexture: Texture;
        ambientTexture: Texture;
        opacityTexture: Texture;
        reflectionTexture: Texture;
        emissiveTexture: Texture;
        specularTexture: Texture;
        bumpTexture: Texture;

        ambientColor: Color3;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        emissiveColor: Color3;

        getRenderTargetTextures(): Texture[];
        getAnimatables(): Texture[];
        clone(name: string): StandardMaterial;
    }
   
    // babylon.texture.d.ts
    class BaseTexture {
        _scene: Scene;

        constructor(url: string, scene: Scene);

        delayLoadState: number;
        hasAlpha: boolean;
        level: number;
        onDispose: () => void;

        getInternalTexture(): BaseTexture;
        isReady(): boolean;
        getSize(): Size2D;
        getBaseSize(): Size2D;
        _getFromCache(url: string, noMipmap: boolean): BaseTexture;
        delayLoad(): void;
        releaseInternalTexture(): void;
        dispose(): void;
    }
	
	class Texture extends BaseTexture {
        name: string;
        url: string
        animations: Animation[];

        constructor(url: string, scene: Scene, noMipmap: boolean, invertY: boolean);

        static EXPLICIT_MODE: number;
        static SPHERICAL_MODE: number;
        static PLANAR_MODE: number;
        static CUBIC_MODE: number;
        static PROJECTION_MODE: number;
        static SKYBOX_MODE: number;

        static CLAMP_ADDRESSMODE: number;
        static WRAP_ADDRESSMODE: number;
        static MIRROR_ADDRESSMODE: number;

        uOffset: number;
        vOffset: number;
        uScale: number;
        vScale: number;
        uAng: number;
        vAng: number;
        wAng: number;
        wrapU: number;
        wrapV: number;
        coordinatesIndex: number;
        coordinatesMode: number;

        _prepareRowForTextureGeneration(t: Vector3): Vector3;
        _computeTextureMatrix(): Matrix;
        _computeReflectionTextureMatrix: Matrix;
        clone(): Texture;
    }
	
	class CubeTexture extends BaseTexture {
        constructor(rootUrl: string, scene: Scene);

        isCube: boolean;
        _computeReflectionTextureMatrix(): Matrix;
    }
	
	class DynamicTexture extends Texture {
        _canvas: HTMLCanvasElement;
        _context: CanvasRenderingContext2D;

        constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: boolean);

        getContext(): CanvasRenderingContext2D;
        drawText(text: string, x: number, y: number, font: string, color: string, clearColor: string, invertY: boolean): void;
        update(): void;
    }
	
	class RenderTargetTexture extends Texture {
       constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: boolean);

       renderList: any[];
       isRenderTarget: boolean;
       coordinatesMode: number;
       renderParticles: boolean;

       _onBeforeRender: () => void;
       _onAfterRender: () => void;

       resize(size: Size2D, generateMipMaps: boolean): void;
       render(): void;
    }
	
	class MirrorTexture extends RenderTargetTexture {
        constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: boolean);

        mirrorPlane: Plane;

        onBeforeRender(): void;
        onAfterRender(): void;
    }
	
	class VideoTexture extends Texture {
        constructor(name: string, urls: string[], size: Size2D, scene: Scene, generateMipMaps: boolean);

        video: HTMLVideoElement;
        _autoLaunch: boolean;
        textureSize: Size2D;

        _update(): boolean;
    }

    // babylon.mesh.d.ts
	interface MeshRayHitTest { hit: boolean; distance: number }

    class Mesh {
        name: string;
        id: string;

        position: Vector3;
        rotation: Vector3;
        scaling: Vector3;
        rotationQuaternion: Quaternion;
        subMeshes: SubMesh[];
        animations: Animation[];

        constructor(name: string, vertexDeclaration: number[], scene: Scene);

        static BILLBOARDMODE_NONE: number;
        static BILLBOARDMODE_X: number;
        static BILLBOARDMODE_Y: number;
        static BILLBOARDMODE_Z: number;
        static BILLBOARDMODE_ALL: number;

        delayLoadState: boolean;
        material: Material;
        parent: Mesh;
        _isReady: boolean;
        _isEnabled: boolean;
        isVisible: boolean;
        isPickable: boolean;
        visibility: number;
        billboardMode: number;
        checkCollisions: boolean;
        receiveShadows: boolean;

        isDisposed: boolean;
        onDispose: () => void;
        skeleton: Skeleton;
        renderingGroupId: number;

        getBoundingInfo(): BoundingInfo;
        getScene(): Scene;
        getWorldMatrix: Matrix;
        getTotalVertices: number;
        getVerticesData(kind: string): any[];
        isVerticesDataPresent(kind: string): boolean;
        getTotalIndicies(): number;
        getIndices(): number[];
        getVertexStrideSize(): number;
        _needToSynchronizeChildren(): boolean;
        setPivotMatrix(matrix: Matrix): void;
        getPivotMatrix(): Matrix;
        isSynchronized(): boolean;
        isReady(): boolean;
        isEnabled(): boolean;
        setEnabled(value: boolean): void;
        isAnimated(): boolean;
        markAsDirty(property: string): void;
        refreshBoudningInfo(): void;
        computeWorldMatrix(): Matrix;
        _createGlobalSubMesh(): SubMesh;
        subdivide(count: number): void;
        setVerticesData(data: any[], kind: string, updatable: boolean): void;
        updateVerticesData(kind: string, data: any[]);
        setIndices(indices: number[]): void;
        bindAndDraw(subMesh: SubMesh, effect: Effect, wireframe: boolean): void;
        registerBeforeRender(func: Function): void;
        unregisterBeforeRender(func: Function): void;
        render(subMesh: SubMesh): void;
        isDescendantOf(ancestor: Mesh): boolean;
        getDescendants(): Mesh[];
        getEmittedParticleSystems(): ParticleSystem[];
        getHierarchyEmittedParticleSystems(): ParticleSystem[];
        getChildren(): Mesh[];
        isInFrustrum(frustumPlanes: Plane[]): boolean;
        setMaterialByID(id: string);
        getAnimatables(): Material;
        setLocalTranslation(vector3: Vector3): void;
        getLocalTranslation(): Vector3;
        bakeTransformIntoVertices(transform: Matrix): void;

        intersectsMesh(mesh: Mesh, precise: boolean): boolean;
        intersectsPoint(point: Vector3): boolean;
        intersects(ray: Ray): MeshRayHitTest;
        clone(name: string, newParent: Mesh): Mesh;

        dispose(): void;

        static CreateBox(name: string, size: number, scene: Scene): Mesh;
        static CreateCylinder(name: string, height: number, diameterTop: number, diameterBottom: number, tessellation: number, scene: Scene, updatable: boolean): Mesh;
        static CreateTorus(name: string, diameter: number, thickness: number, tessellation: number, scene: Scene, updatable: boolean): Mesh;
        static CreateSphere(name: string, segments: number, diameter: number, scene: Scene): Mesh;
        static CreatePlane(name: string, size: number, scene: Scene): Mesh;
        static CreateGround(name: string, width: number, height: number, subdivisions: number, scene: Scene, updatable: boolean): Mesh;
        static CreateGroundFromHeightMap(name: string, url: string, width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, scene: Scene, updatable: boolean): Mesh;
        static ComputeNormal(positions: number[], normals: number[], indices: number[]);
    }
	
	class SubMesh {
        materialIndex: number;
        verticesStart: number;
        verticesCount: number;
        indexStart: number;
        indexCount: number;

        constructor(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: Mesh);

        getBoundingInfo(): BoundingInfo;
        getMaterial(): Material;
        refreshBoundingInfo(): void;
        updateBoundingInfo(world: Matrix, scale: Vector3): void;
        isInFrustrum(frustumPlanes: Plane[]): boolean;
        render(): void;
        getLinesIndexBuffer(indices: number[], engine: Engine): IndexBuffer;
        canIntersects(ray: Ray): boolean;
        intersects(ray: Ray, positions: Vector3[], indices: number[]): MeshRayHitTest;
        clone(newMesh: Mesh): SubMesh;

        static CreateFromIndices(materialIndex: number, startIndex: number, indexCount: number, mesh: Mesh): SubMesh;
    }
	
	class VertexBuffer {
        constructor(mesh: Mesh, data: any[], kind: string, updatable: boolean);

        isUpdatable(): boolean;
        getData(): any[];
        getStrideSize(): number;
        update(data: any[]): void;
        dispose(): void;

        PositionKind: string;
        NormalKind: string;
        UVKind: string;
        UV2Kind: string;
        ColorKind: string;
        MatricesIndicesKind: string;
        MatricesWeightsKind: string;
    }

    // babylon.particle.d.ts
    class Particle {
        position: Vector3;
        direction: Vector3;
        lifetime: number;
        age: number;
        size: number;
        angle: number;
        angularSpeed: number;
        color: Color4;
        colorStep: Color4;

        constructor();

    }
	
	class ParticleSystem {
        name: string;
        id: string;

        gravity: Vector3;
        direction1: Vector3;
        direction2: Vector3;
        minEmitBox: Vector3;
        maxEmitBox: Vector3;
        color1: Color4;
        color2: Color4;
        colorDead: Color4;
        deadAlpha: number;
        textureMask: Color4;

        particles: Particle[];
        indices: number[];

        renderingGroupId: number;
        emitter: any; // needs update
        emitRate: number;
        manualEmitCount: number;
        updateSpeed: number;
        targetStopDuration: number;
        disposeOnStop: boolean;

        minEmitPower: number;
        maxEmitPower: number;

        minLifeTime: number;
        maxLifeTime: number;

        minSize: number;
        maxSize: number;
        minAngularSpeed: number;
        maxAngularSpeed: number;

        particleTexture: Texture;

        onDispose: () => void;

        blendMode: number;

        constructor(name: string, capacity: number, scene: Scene);

        isAlive(): boolean;
        start(): void;
        stop(): void;
        animate(): void;
        render(): number;
        dispose(): void;
        clone(name: string, newEmitter: any): ParticleSystem; // needs update (newEmitter)

        static BLENDMODE_ONEONE: number;
        static BLENDMODE_STANDARD: number;
    }

	// PostProcess
	class PostProcess {
    }
	
	class PostProcessManager {
        constructor();
        postProcesses: any[];
    }
	
    // babylon.sprite.d.ts
	class Sprite {
        name: string;
        color: Color4;

        position: Vector3;
        size: number;
        angle: number;
        cellIndex: number;
        invertU: number;
        invertV: number;
        disposeWhenFinishedAnimating: boolean;

        constructor(name: string, manager: SpriteManager);

        playAnimation(from: number, to: number, loop: boolean, delay: number);
        stopAnimation(): void;
        dispose(): void;
    }
	
	class SpriteManager {
        name: string;
        cellSize: number;

        constructor(name: string, imgUrl: string, capacity: number, cellSize: number, scene: Scene, epsilon: number);

        indicies: number[];
        index: number;
        sprites: Sprite[];

        onDispose: () => void;

        render(): void;
        dispose(): void;

    }
}