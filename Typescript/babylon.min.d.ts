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

        getAspectRatio(): number;
        getRenderWidth(): number;
        getRenderHeight(): number;
        getRenderingCanvas(): HTMLCanvasElement;
        setHardwareScalingLevel(level: number): void;
        getLoadedTexturesCache(): Texture[];
        getCaps(): Capabilities;

        switchFullscreen(element: HTMLElement);
        clear(color: IColor3, backBuffer: bool, depthStencil: bool);

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
        _releaseBuffer(vb: VertexBuffer);
        draw(useTriangles: bool, indexStart: number, indexCount: number);
        createEffect(baseName: string, attributesNames: string, uniformsNames: string[],
            samplers: WebGLUniformLocation[],
            defines: string): Effect;
        createShaderProgram(vertexCode: string, fragmentCode: string, defines: string): WebGLProgram;
        getUniforms(shaderProgram: WebGLProgram, uniformsNames: string[]): WebGLUniformLocation[];
        getAttributes(shaderProgram: WebGLProgram, attributesNames: string[]): number[];
        enableEffect(effect: Effect): void;
        setMatrix(uniform: string, matrix: Matrix): void;
        setVector2(uniform: string, x: number, y: number): void;
        setVector3(uniform: string, v: Vector3): void;
        setBool(uniform: string, val: bool): void;
        setVector4(uniform: string, x: number, y: number, z: number, w: number): void;
        setColor3(uniform: string, color: Color3): void;
        setColor4(uniform: string, color: Color3, alpha: number): void;
        setState(cullingMode: number): void;
        setDepthBuffer(enable: bool): void;
        setDepthWrite(enable: bool): void;
        setColorWrite(enable: bool): void;
        setAlphaMode(mode: number): void;
        setAlphaTesting(enable: bool): void;
        getAlphaTesting(): bool;
        wipeCaches(): void;
        createTexture(url: string, noMipmap: bool, invertY: bool): Texture;
        createDynamicTexture(size: number, noMipmap: bool): Texture;
        updateDynamicTexture(texture: Texture, canvas: HTMLCanvasElement): void;
        createRenderTargetTexture(size: number, generateMipMaps: bool): Texture;
        createCubeTexture(rootUrl: string): Texture;
        _releaseTexture(tex: Texture): void;
        bindSamplers(effect: Effect): void;
        setTexture(channel: number, texture: Texture): void;
        dispose(): void;

        static ShadersRepository: string;
        static ALPHA_DISABLE: number;
        static ALPHA_ADD: number;
        static ALPHA_COMBINE: number;
        static epsilon: number;
        static collisionEpsilon: number;
        static isSupported(): bool;
    }

    // babylon.scene.d.ts
    interface ScenePickResult {
        hit: bool;
        distance: number;
        pickedMesh: Mesh;
        pickedPoint: Vector3;
    }
    class Scene {
        constructor(engine: Engine);

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

        isReady(): bool;
        executeWhenReady(func: Function): void;
        // TODO: Animations
        getViewMatrix(): Matrix;
        getProjectionMatrix(): Matrix;
        getTransformMatrix(): Matrix;
        setTransformMatrix(view: Matrix, projection: Matrix);
        activeCameraByID(id: number): void;
        getMaterialByID(id: number): Material;
        getMeshByID(id: number): Mesh;
        getLastMeshByID(id: number): Mesh;
        getMeshByName(name: string): Mesh;
        isActiveMesh(mesh: Mesh): bool;
        _evaluateActiveMeshes(): void;
        _localRender(opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, activeMeshes);
        render();
        dispose();
        _getNewPosition(position: Vector3, velocity: Vector3, collider: Sphere, maximumRetries: number): Vector3;
        _collideWithWorld(position: Vector3, velocity: Vector3, collider: Sphere, maximumRetries: number): Vector3;
        createPickingRay(x: number, y: number, world: Matrix): Ray;
        pick(x: number, y: number): ScenePickResult;
    }

    // babylon.math.d.ts
    interface RayTriangleIntersection {
        hit: bool;
        distance: number;
        bu: number;
        bv: number;
    }

    interface IColor3 {
        r: number;
        g: number;
        b: number;
    }

    interface Size2D {
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

        intersectsSphere(sphere: Sphere): bool;
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

        equals(otherColor: Color3): bool;
        equals(otherColor: Color4): bool;
        toString(): string;
        clone(): Color3;

        multiply(otherColor: Color3): Color3;
        scale(scale: number): Color3;

        static FromArray(values: number[]): Color3;
    }

    class Color4 implements IColor3 {
        r: number;
        g: number;
        b: number;
        a: number;

        constructor(initialR: number, initialG: number, initialB: number, initialA: number);

        add(right: Color4): Color4;
        subtract(right: Color4): Color4;
        scale(factor: number): Color4;

        toString(): string;
        clone(): Color4;

        static Lerp(left: number, right: number, amount: number): Color4;
        static FromArray(values: number[]): Color4;

    }

    class Vector2 {
        x: number;
        y: number;

        constructor(x: number, y: number);

        toString(): string;

        add(other: Vector2): Vector2;
        subtract(other: Vector2): Vector2;
        negate(): Vector2;
        scale(factor: number): Vector2;
        equals(other: Vector2): bool;
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

        add(other: Vector3): Vector3;
        subtract(other: Vector3): Vector3;
        negate(): Vector3;
        scale(factor: number): Vector3;
        equals(other: Vector3): bool;
        multiply(other: Vector3): Vector3;
        divide(other: Vector3): Vector3;
        length(): number;
        lengthSquared(): number;
        normalize();
        clone(): Vector3;

        static FromArray(array: number[], offset?: number);
        static Zero(): Vector3;
        static Up(): Vector3;
        static TransformCoordinates(vector: Vector3, transformation: Matrix);
        static TransformNormal(vector: Vector3, transformation: Matrix);

        static CatmullRom(value1: Vector3, value2: Vector3, value3: Vector3, value4: Vector3, amount: number): Vector3;
        static Clamp(value: Vector3, min: Vector3, max: Vector3): Vector3;
        static Hermite(value1: Vector3, tangent1: Vector3, value2: Vector3, tangent2: Vector3, amount: number): Vector3;
        static Lerp(start: Vector3, end: Vector3, amount: number): Vector3;
        static Dot(left: Vector3, right: Vector3): number;
        static Normalize(vector: Vector3): Vector3;
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

        constructor(x: number, y: number, z: number, w: number);

        clone(): Quaternion;
        add(other: Quaternion): Quaternion;
        scale(factor: number): Quaternion;
        toEulerAngles(): Vector3;

        static FromArray(array: number[], offset?: number): Quaternion;
        static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion;
    }

    class Matrix {
        m: number[];

        constructor();

        isIdentity(): bool;
        determinant(): number;
        toArray(): number[];
        invert(): void;
        multiply(other: Matrix): Matrix;
        equals(other: Matrix): Matrix;
        clone(): Matrix;

        static FromValues(m11: number, m12: number, m13: number, m14: number,
            m21: number, m22: number, m23: number, m24: number,
            m31: number, m32: number, m33: number, m34: number,
            m41: number, m42: number, m43: number, m44: number): Matrix;
        static Identity(): Matrix;
        static Zero(): Matrix;
        static RotationX(angle: number): Matrix;
        static RotationY(angle: number): Matrix;
        static RotationZ(angle: number): Matrix;
        static RotationAxis(axis: Vector3, angle: number): Matrix;
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Matrix;
        static Scaling(scaleX: number, scaleY: number, scaleZ: number): Matrix;
        static Translation(x: number, y: number, z: number): Matrix;
        static LookAtLH(eye: Vector3, target: Vector3, up: Vector3): Matrix;
        static OrthoLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix;
        static PerspectiveLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number): Matrix;
        static AffineTransformation(scaling: number, rotationCenter: Vector3, rotation: Quaternion, translation: Vector3): Matrix;
        static GetFinalMatrix(viewport: Size2D, world: Matrix, view: Matrix, projection: Matrix): Matrix;
        static Transpose(matrix: Matrix): Matrix;
        static Reflection(plane: Plane): Matrix;
    }

    class Plane {
        normal: Vector3;
        d: number;

        normalize(): void;
        transform(transformation: Matrix): Plane;
        dotCoordinate(point: Vector3): number;

        static FromArray(array: number[]): Plane;
        static FromPoints(point1: Vector3, point2: Vector3, point3: Vector3): Plane;
    }

    class Frustum {
        static GetPlanes(transform: Matrix): Plane[];
    }

    // babylon.tools.d.ts
    function QueueNewFrame(func: Function): void;
    function RequestFullscreen(element: HTMLElement): void;
    function ExitFullscreen(): void;
    var BaseUrl: string;
    function LoadFile(url: string, callback: Function, progressCallback: Function): void;
    function WithinEpsilon(a: number, b: number);
    function DeepCopy(source: Object, destination: Object, doNotCopyList: string[], mustCopyList: string[]);
    function GetFps(): number;
    function GetDeltaTime(): number;
    function _MeasureFps(): void;

    //babylon.tools.dds.d.ts
    function LoadDDSTexture(gl: WebGLRenderingContext, ext: any, data: ArrayBuffer): number; 

    //babylon.sceneLoader.d.ts
    function ImportMesh(meshName: string, rootUrl: string, sceneFilename: string, scene: Scene, then: Function);
    function Load(rootUrl: string, sceneFilename: string, engine: Engine, then: Function, progressCallback: Function);

    // babylon.animation.d.ts
    class _Animatable {
        target: Object;
        fromFrame: number;
        toFrame: number;
        loopAnimation: bool;
        animationStartDate: Date;
        speedRatio: number;

        constructor(target: Object, from: number, to: number, loop: bool, speedRatio?: number);

        _animate(): bool;
    }

    class Animation {
        name: string;
        targetPropertyPath: string[];
        framePerSecond: number;
        dataType: string;
        loopMode: number;
        _keys: number[];

        constructor(name: string, targetProperty: string, framePerSecond: number, dataType: string, loopMode: number);

        clone(): Animation;
        setKeys(values: number[]);
        _interpolate(currentFrame: number, repeatCount: number, loopMode: number, offsetValue: number, highLimitValue: number);
        animate(target: Object, delay: number, from: number, to: number, loop: bool, speedRatio: number): bool;

        static ANIMATIONTYPE_FLOAT: number;
        static ANIMATIONTYPE_VECTOR3: number;
        static ANIMATIONTYPE_QUATERNION: number;

        static ANIMATIONLOOPMODE_RELATIVE: number;
        static ANIMATIONLOOPMODE_CYCLE: number;
        static ANIMATIONLOOPMODE_CONSTANT: number;
    }

    // babylon.camera.d.ts
    class Camera {
        name: string;
        id: string;
        position: Vector3;
        _scene: Scene;

        constructor(name: string, position: Vector3, scene: Scene);

        fov: number;
        minZ: number;
        maxZ: number;
        intertia: number;

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
        _needsMoveForGravity: bool;
        animations: Animation[];

        constructor(name: string, position: Vector3, scene: Scene);

        speed: number;
        checkCollisions: bool;
        applyGravity: bool;

        _computeLocalCameraSpeed(): number;
        setTarget(target: Vector3): void;
        _collideWithWorld(velocity: Vector3): void;
        _checkInputs();
    }

    class TouchCamera extends FreeCamera {
        _offsetX: number;
        _offsetY: number;
        _pointerCount: number;
        _pointerPressed: number[];

        constructor(name: string, position: Vector3, scene: Scene);
    }

    class ArcRotateCamera extends Camera {
        alpha: number;
        beta: number;
        radius: number;
        target: Vector3;

        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene);

        inertialAlphaOffset: number;
        interialBetaOffset: number;
        setPosition(position: Vector3): void;
    }

    // babylon.collider.d.ts
    interface CollisionResponse {
        position: Vector3;
        velocity: Vector3;
    }

    class Collider {
        radius: Vector3;
        retry: number;

        constructor();

        _initialize(source: Vector3, dir: Vector3, e: number): void;
        _canDoCollision(sphereCenter: Vector3, sphereRadius: number, vecMin: Vector3, vecMax: Vector3): bool;
        _testTriangle(subMesh: SubMesh, p1: Vector3, p2: Vector3, p3: Vector3): void;
        _collide(subMesh: SubMesh, pts: VertexBuffer, indices: IndexBuffer, indexStart: number, indexEnd: number, decal: number);
        _getResponse(pos: Vector3, vel: Vector3): CollisionResponse;
    }

    class CollisionPlane {
        normal: Vector3;
        origin: Vector3;
        equation: number[];

        constructor(origin: Vector3, normal: Vector3);

        isFrontFactingTo(direction: Vector3, epsilon: number): bool;
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

        constructor(vertices: VertexBuffer, stride: number, start: number, count: number);

        _update(world: Matrix): void;
        isInFrustrum(frustrumPlanes: Plane[]): bool;
        intersectsPoint(point: Vector3): bool;

        static intersects(box0: BoundingBox, box1: BoundingBox): bool;
    }

    class BoundingSphere {
        minimum: Vector3;
        maximum: Vector3;
        center: Vector3;
        radius: number;

        constructor(vertices: VertexBuffer, stride: number, start: number, count: number);

        _update(world: Matrix, scale: number): void;
        isInFrustrum(frustrumPlanes: Plane[]): bool;
        intersectsPoint(point: Vector3): bool;

        static intersects(sphere0: BoundingSphere, sphere1: BoundingSphere): bool;
    }

    class BoundingInfo {
        boundingBox: BoundingBox;
        boundingSphere: BoundingSphere;

        constructor(vertices: VertexBuffer, stride: number, start: number, count: number);

        _update(world: Matrix, scale: number): void;
        isInFrustrum(frustrumPlanes: Plane[]): bool;
        _checkCollision(collider: Collider): bool;
        intersectsPoint(point: Vector3): bool;
        intersects(boundingInfo: BoundingInfo, precise: bool): bool;

    }

    // babylon.layer.d.ts
    class Layer {
        name: string;
        texture: Texture;
        isBackground: bool;

        constructor(name: string, imgUrl: string, scene: Scene, isBackground: bool);

        onDispose: () => void;
        render(): void;
        dispose(): void;
    }

    // babylon.light.d.ts
    class Light {
        name: string;
        id: string;
        diffuse: Color3;
        specular: Color3;
        private _scene: Scene;

        constructor(name: string, scene: Scene);

        intensity: number;
        isEnabled: bool;
    }

    class PointLight extends Light {
        position: Vector3;
        animations: Animation[];

        constructor(name: string, position: Vector3, scene: Scene);
    }

    class DirectionalLight extends Light {
        direction: Vector3;
        animations: Animation[];

        constructor(name: string, direction: Vector3, scene: Scene);
    }

    // babylon.effect.d.ts
    class Effect {
        name: string;
        defines: string;

        constructor(baseName: string, attributesNames: string[], uniformsNames: string[], samplers: WebGLUniformLocation[], engine: Engine, defines: string);

        isReady(): bool;
        getProgram(): WebGLProgram;
        getAttribute(index: number): string;
        getAttributesCount(): number;
        getUniformIndex(uniformName: string): number;
        getUniform(uniformName: string): string;
        getSamplers(): WebGLUniformLocation[];

        _prepareEffect(vertexSourceCode: string, fragmentSourceCode: string, attributeNames: string[], defines: string): void;
        setTexture(channel: string, texture: Texture): void;
        setMatrix(uniformName: string, matrix: Matrix): void;
        setBool(uniformName: string, val: bool): void;
        setVector2(uniformName: string, x: number, y: number): void;
        setVector3(uniformName: string, val: Vector3): void;
        setVector4(uniformName: string, x: number, y: number, z: number, w: number): void;
        setColor3(uniformName: string, color: Color3): void;
        setColor4(uniformName: string, color: Color4): void;

        static ShadersStore: Object;
    }

    // babylon.material.d.ts
    class Material {
        name: string;
        id: string;
        private _scene: Scene;

        constructor(name: string, scene: Scene);

        alpha: number;
        wireframe: bool;
        backFaceCulling: bool;
        _effect: Effect;

        onDispose: () => void;

        isReady(): bool;
        getEffect(): Effect;
        needAlphaBlending(): bool;
        needAlphaTesting(): bool;

        _preBind(): void;
        bind(world: Matrix, mesh: Mesh): void;
        unbind(): void;

        dispose(): void;
    }

    class MultiMaterial extends Material {
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
        ambientColor: Color3;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        emissiveColor: Color3;

        getRenderTargetTextures(): Texture[];
        getAnimatables(): Texture[];
    }

    // babylon.texture.d.ts
    class BaseTexture {
        _scene: Scene;

        constructor(url: string, scene: Scene);

        hasAlpha: bool;
        level: number;
        onDispose: () => void;
        getInternalTexture(): BaseTexture;
        isReady(): bool;
        getSize(): Size2D;
        getBaseSize(): Size2D;
        _getFromCache(url: string, noMipmap: bool): BaseTexture;
        dispose(): void;
    }

    class Texture extends BaseTexture {
        name: string;

        constructor(url: string, scene: Scene, noMipmap: bool, invertY: bool);

        static EXPLICIT_MODE: number;
        static SPHERICAL_MODE: number;
        static PLANAR_MODE: number;
        static CUBIC_MODE: number;
        static PROJECTION_MODE: number;

        uOffset: number;
        vOffset: number;
        uScale: number;
        vScale: number;
        uAng: number;
        vAng: number;
        wAng: number;
        wrapU: bool;
        wrapV: bool;
        coordinatesIndex: number;
        coordinatesMode: number;

        _prepareRowForTextureGeneration(t: Vector3): Vector3;
        _computeTextureMatrix(): Matrix;
    }

    class CubeTexture extends BaseTexture {
        constructor(rootUrl: string, scene: Scene);
    }

    class DynamicTexture extends Texture {
        wrapU: bool;
        wrapV: bool;
        _canvas: HTMLCanvasElement;
        _context: CanvasRenderingContext2D;

        constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: bool);

        getContext(): CanvasRenderingContext2D;
        update(): void;
    }

    class RenderTargetTexture extends Texture {
        constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: bool);

        renderList: any[];
        isRenderTarget: bool;
        coordinatesMode: number;

        _onBeforeRender: () => void;
        _onAfterRender: () => void;

        render(): void;
    }

    class MirrorTexture extends RenderTargetTexture {
        constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: bool);

        mirrorPlane: Plane;

        _onBeforeRender: () => void;
        _onAfterRender: () => void;
    }

    // babylon.mesh.d.ts
    interface MeshRayHitTest { hit: bool; distance: number }

    class Mesh {
        name: string;
        id: string;
        private _scene: Scene;
        private _vertexDeclaration: number[];
        private _vertexStrideSize: number;
        private _totalVertices: number;
        private _worldMatrix: Matrix;
        position: Vector3;
        rotation: Vector3;
        scaling: Vector3;
        subMeshes: SubMesh[];
        animations: Animation[];

        constructor(name: string, vertexDeclaration: number[], scene: Scene);

        static BILLBOARDMODE_NONE: number;
        static BILLBOARDMODE_X: number;
        static BILLBOARDMODE_Y: number;
        static BILLBOARDMODE_Z: number;
        static BILLBOARDMODE_ALL: number;

        material: Material;
        parent: Mesh;
        _isEnabled: bool;
        isVisible: bool;
        visibility: number;
        billboardMode: number;
        checkCollisions: bool;

        onDispose: () => void;

        getScene(): Scene;
        getWorldMatrix: Matrix;
        getTotalVertices: number;
        getVertices: VertexBuffer;
        getVertexStride(): number;
        getFloatVertexStrideSize(): number;
        _needToSynchronizeChildren(): bool;
        isSynchronized(): bool;
        isEnabled(): bool;
        setEnabled(value: bool): void;
        isAnimated(): bool;
        computeWorldMatrix(): Matrix;
        _createGlobalSubMesh(): SubMesh;
        setVertices(vertices: VertexBuffer, uvCount: number): void;
        setIndices(indices: number[]): void;
        render(subMesh: SubMesh): void;
        isDescendantOf(ancestor: Mesh): bool;
        getDescendants(): Mesh[];
        getEmittedParticleSystems(): ParticleSystem[];
        getHierarchyEmittedParticleSystems(): ParticleSystem[];
        getChildren(): Mesh[];
        isInFrustrum(frustumPlanes: Plane[]): bool;
        setMaterialByID(id: string);
        getAnimatables(): Material;

        intersectsMesh(mesh: Mesh, precise: bool): bool;
        intersectsPoint(point: Vector3): bool;
        intersects(ray: Ray): MeshRayHitTest;
        clone(name: string, newParent: Mesh): Mesh;

        dispose(): void;

        static createBox(name: string, size: number, scene: Scene): Mesh;
        static createSphere(name: string, segments: number, diameter: number, scene: Scene): Mesh;
        static createPlane(name: string, size: number, scene: Scene): Mesh;
    }

    class SubMesh {
        materialIndex: number;
        verticesStart: number;
        verticesCount: number;
        indexStart: number;
        indexCount: number;

        constructor(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: Mesh);

        getMaterial(): Material;
        updateBoundingInfo(world: Matrix, scale: Vector3): void;
        isInFrustrum(frustumPlanes: Plane[]): bool;
        render(): void;
        getLinesIndexBuffer(indices: number[], engine: Engine): IndexBuffer;
        canIntersects(ray: Ray): bool;
        intersects(ray: Ray, positions: Vector3[], indices: number[]): MeshRayHitTest;
        clone(newMesh: Mesh): SubMesh;
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

        emitter: any; // needs update
        emitRate: number;
        manualEmitCount: number;
        updateSpeed: number;
        targetStopDuration: number;
        disposeOnStop: bool;
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

        isAlive(): bool;
        start(): void;
        stop(): void;
        animate(): void;
        render(): number;
        dispose(): void;
        clone(name: string, newEmitter: any): ParticleSystem; // needs update (newEmitter)

        static BLENDMODE_ONEONE: number;
        static BLENDMODE_STANDARD: number;
    }

    // babylon.sprite.d.ts
    class Sprite {
        name: string;
        position: Vector3;
        size: number;
        angle: number;
        cellIndex: number;
        invertU: number;
        invertV: number;

        constructor(name: string, manager: SpriteManager);

        playAnimation(from: number, to: number, loop: bool, delay: number);
        stopAnimation(): void;

    }

    class SpriteManager {
        name: string;
        cellSize: number;

        constructor(name: string, imgUrl: string, capacity: number, cellSize: number, scene: Scene, epsilon: number);

        onDispose: () => void;

        render(): void;
        dispose(): void;

    }
}