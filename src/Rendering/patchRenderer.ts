import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { SubMesh } from "../Meshes/subMesh";
import { VertexBuffer } from "../Meshes/buffer";
import { SmartArray } from "../Misc/smartArray";
import { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import { InternalTexture } from "../Materials/Textures/internalTexture";
import { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { Constants } from "../Engines/constants";
import { Vector2, Vector3 } from "../Maths/math"
import { Color4 } from "../Maths/math"
import { Matrix } from "../Maths/math"
import { Camera } from "../Cameras/camera"

import { Nullable } from "../types";
// import { Tools } from "../misc/tools"
import "../Shaders/depth.fragment";
import "../Shaders/depth.vertex";
import { _DevTools } from '../Misc/devTools';

/**
 * This represents a depth renderer in Babylon.
 * A depth renderer will render to it's depth map every frame which can be displayed or used in post processing
 */

class Patch {

    constructor(p: Vector3, n: Vector3, id: number, residualEnergy: Vector3) {
        // World space
        this.position = p.clone();
        this.normal = n.clone().normalize();
        this.id = id;
        this.residualEnergy = residualEnergy;

        // TODO : test is LH or RH
        this.viewMatrix = Matrix.LookAtLH(this.position, this.position.add(this.normal), Vector3.Up());
        // this.viewMatrix.invert();

        this.viewProjectionMatrix = this.viewMatrix.multiply(Patch.projectionMatrix);
    }

    public toString() {
        return `Position: ${this.position.x} ${this.position.y} ${this.position.z}\n` +
            `Normal: ${this.normal.x} ${this.normal.y} ${this.normal.z}\n` +
            `Id: ${this.id}\n`;
    }

    public id: number;
    public position: Vector3
    public normal: Vector3;
    public viewMatrix: Matrix;
    public viewProjectionMatrix: Matrix;
    public residualEnergy: Vector3;

    public static readonly fov: number = 120 * Math.PI / 180;
    public static projectionMatrix: Matrix;
}
declare module "../meshes/submesh" {
    export interface SubMesh {
        /** @hidden (Backing field) */
        residualTexture: MultiRenderTarget;

        /**
         * Gets or Sets the current geometry buffer associated to the scene.
         */
        radiosityPatches: Patch[];
        surfaceId: number;
    }

}

// Scene.prototype.disableGeometryBufferRenderer = function(): void {

export class PatchRenderer {
    private _scene: Scene;
    // private _htScene: Scene; // Higher tesselated scene
    private _meshes: Mesh[];
    private _patchMap: RenderTargetTexture;
    private _uV2Effect: Effect;
    private _radiosityEffect: Effect;
    private _shootEffect: Effect;
    private _nextShooterEffect: Effect;
    private _dilateEffect: Effect;
    private _near: number;
    private _far: number;
    private _texelSize: number;

    // private _patches: Patch[] = [];
    private _patchOffset: number = 0;
    private _patchedSubMeshes: SubMesh[] = [];
    private _currentPatch: Patch;
    private _cachedDefines: string;
    private _currentRenderedMap: RenderTargetTexture;
    private _nextShooterTexture: RenderTargetTexture;

    private _vertexBuffer: VertexBuffer;
    private _indexBuffer: WebGLBuffer;

    private _submeshMap: { [key: number]: SubMesh } = {};
    private _isCurrentlyGathering: boolean = false;

    private _tempEdgeBuffer: number[] = [-1, -1];

    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _DevTools.WarnImport("patchRendererSceneComponent");
    }

    public getCurrentRenderWidth(): number {
        return this._currentRenderedMap.getRenderWidth()
    }

    public getCurrentRenderHeight(): number {
        return this._currentRenderedMap.getRenderHeight()
    }

    /**
     * Instantiates a depth renderer
     * @param scene The scene the renderer belongs to
     * @param type The texture type of the depth map (default: Engine.TEXTURETYPE_FLOAT)
     * @param camera The camera to be used to render the depth map (default: scene's active camera)
     */
    constructor(scene: Scene, meshes: Mesh[], texelSize: number) {
        this._scene = scene;
        this._near = 0.1;
        this._far = 1000;
        this._texelSize = texelSize;
        this._meshes = meshes;

        // PatchRenderer._SceneComponentInitialization(this._scene);
        Patch.projectionMatrix = Matrix.PerspectiveFovLH(Patch.fov,
            1, // squared texture
            this._near,
            this._far,
        );

        // this.createMaps();

        scene.getEngine().disableTextureBindingOptimization = true;

        // this.createHTScene();
    }

    public createHTScene(areaThreshold: number) {
        var scene = this._scene;

        for (let i = scene.meshes.length - 1; i >= 0; i--) {
            this.retesselateMesh(scene.meshes[i], areaThreshold);
        }

        this._meshes = <Mesh[]>(scene.meshes);
    }

    private retesselateMesh(mesh: AbstractMesh, areaThreshold: number): AbstractMesh {
        // TODO : edge length threshold should be more adapted
        var indices = mesh.getIndices();
        var vertices = mesh.getVerticesData(VertexBuffer.PositionKind);
        var normals = mesh.getVerticesData(VertexBuffer.NormalKind);
        var uvs = mesh.getVerticesData(VertexBuffer.UVKind);
        var worldMat = mesh.computeWorldMatrix(true);

        if (!indices || !vertices || !normals || !uvs || !vertices.length) {
            return mesh;
        }

        var v0 = new Vector3(),
            v1 = new Vector3(),
            v2 = new Vector3();
        var n0 = new Vector3(),
            n1 = new Vector3(),
            n2 = new Vector3();
        var uv0 = new Vector2(),
            uv1 = new Vector2(),
            uv2 = new Vector2();

        var i0, i1, i2: number;

        var newPositions = [];
        var newNormals = [];
        var newUvs = [];

        var oldPositions = new Float32Array(vertices.length);
        var oldNormals = new Float32Array(normals.length);
        var oldUVs = uvs.slice(0);

        var newIndices: number[] = [];
        var tempPositionBuffer: Vector3[] = [];
        var tempNormalBuffer: Vector3[] = [];
        var tempUVBuffer: Vector2[] = [];
        var indexPointer = vertices.length / 3 - 1;

        for (let i = 0; i < indices.length; i += 3) {
            i0 = indices[i];
            i1 = indices[i + 1];
            i2 = indices[i + 2];
            uv0.copyFromFloats(uvs[i0 * 2], uvs[i0 * 2 + 1]);
            uv1.copyFromFloats(uvs[i1 * 2], uvs[i1 * 2 + 1]);
            uv2.copyFromFloats(uvs[i2 * 2], uvs[i2 * 2 + 1]);
            Vector3.TransformCoordinatesFromFloatsToRef(vertices[i0 * 3], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2], worldMat, v0);
            Vector3.TransformCoordinatesFromFloatsToRef(vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2], worldMat, v1);
            Vector3.TransformCoordinatesFromFloatsToRef(vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2], worldMat, v2);
            Vector3.TransformNormalFromFloatsToRef(normals[i0 * 3], normals[i0 * 3 + 1], normals[i0 * 3 + 2], worldMat, n0);
            Vector3.TransformNormalFromFloatsToRef(normals[i1 * 3], normals[i1 * 3 + 1], normals[i1 * 3 + 2], worldMat, n1);
            Vector3.TransformNormalFromFloatsToRef(normals[i2 * 3], normals[i2 * 3 + 1], normals[i2 * 3 + 2], worldMat, n2);

            oldPositions[i0 * 3] = v0.x;
            oldPositions[i0 * 3 + 1] = v0.y;
            oldPositions[i0 * 3 + 2] = v0.z;
            oldPositions[i1 * 3] = v1.x;
            oldPositions[i1 * 3 + 1] = v1.y;
            oldPositions[i1 * 3 + 2] = v1.z;
            oldPositions[i2 * 3] = v2.x;
            oldPositions[i2 * 3 + 1] = v2.y;
            oldPositions[i2 * 3 + 2] = v2.z;

            oldNormals[i0 * 3] = n0.x;
            oldNormals[i0 * 3 + 1] = n0.y;
            oldNormals[i0 * 3 + 2] = n0.z;
            oldNormals[i1 * 3] = n1.x;
            oldNormals[i1 * 3 + 1] = n1.y;
            oldNormals[i1 * 3 + 2] = n1.z;
            oldNormals[i2 * 3] = n2.x;
            oldNormals[i2 * 3 + 1] = n2.y;
            oldNormals[i2 * 3 + 2] = n2.z;

            tempPositionBuffer.length = 0;
            tempNormalBuffer.length = 0;
            tempUVBuffer.length = 0;

            indexPointer = this._subdiviseRec(v0, v1, v2, n0, n1, n2, uv0, uv1, uv2, i0, i1, i2, areaThreshold, tempPositionBuffer, tempNormalBuffer, tempUVBuffer, newIndices, indexPointer);

            for (let j = 0; j < tempPositionBuffer.length; j++) {
                newPositions.push(tempPositionBuffer[j].x, tempPositionBuffer[j].y, tempPositionBuffer[j].z);
                newNormals.push(tempNormalBuffer[j].x, tempNormalBuffer[j].y, tempNormalBuffer[j].z);
            }
            
            for (let j = 0; j < tempUVBuffer.length; j++) {
                newUvs.push(tempUVBuffer[j].x, tempUVBuffer[j].y);
            }
        }

        var m = new Mesh(mesh.name, this._scene);
        m.setIndices(newIndices, (oldPositions.length + newPositions.length) / 3);
        m.setVerticesData(VertexBuffer.PositionKind, this._appendToNew(oldPositions, newPositions));
        m.setVerticesData(VertexBuffer.NormalKind, this._appendToNew(oldNormals, newNormals));
        m.setVerticesData(VertexBuffer.UVKind, this._appendToNew(oldUVs, newUvs));
        (<any>m).color = (<any>mesh).color;

        mesh.dispose();

        return m;
    }

    private _appendToNew(arr: Float32Array | number[], newValues: number[]): Float32Array {
        var newArr = new Float32Array(arr.length + newValues.length);

        for (let i = 0; i < arr.length; i++) {
            newArr[i] = arr[i];
        }

        for (let i = 0; i < newValues.length; i++) {
            newArr[i + arr.length] = newValues[i];
        }

        return newArr;
    }

    private _subdiviseRec(v0: Vector3,
        v1: Vector3,
        v2: Vector3,
        n0: Vector3, 
        n1: Vector3, 
        n2: Vector3, 
        uv0: Vector2, 
        uv1: Vector2, 
        uv2: Vector2, 
        i0: number, 
        i1: number, 
        i2: number, 
        areaThreshold: number, 
        buffer: Vector3[], 
        normBuffer: Vector3[], 
        uvBuffer: Vector2[], 
        indices: number[], 
        indexPointer: number): number {

        if (this._triangleArea(v0, v1, v2) <= areaThreshold) {
            indices.push(i0, i1, i2);
            return indexPointer;
        }

        // Subdivision
        var side = this._findBiggestSide(v0, v1, v2);
        let vecs = [v0, v1, v2];
        let norms = [n0, n1, n2];
        let uvs = [uv0, uv1, uv2];
        let e0 = vecs[side[0]];
        let e1 = vecs[side[1]];
        let norm0 = norms[side[0]];
        let norm1 = norms[side[1]];
        let uvFor0 = uvs[side[0]];
        let uvFor1 = uvs[side[1]];
        let middle = e1.add(e0).scaleInPlace(0.5);
        let interpNormal = norm1.add(norm0).normalize();
        let interpUv = uvFor0.add(uvFor1).scaleInPlace(0.5);

        indexPointer++;
        let ni0 = [i0, i1, i2];
        let ni1 = [i0, i1, i2];
        let nv0 = vecs.slice(0);
        let nv1 = vecs.slice(0);
        let nn0 = norms.slice(0);
        let nn1 = norms.slice(0);
        let nuv0 = uvs.slice(0);
        let nuv1 = uvs.slice(0);

        ni0[side[0]] = indexPointer;
        ni1[side[1]] = indexPointer;
        nv0[side[0]] = middle;
        nv1[side[1]] = middle;
        nn0[side[0]] = interpNormal;
        nn1[side[1]] = interpNormal;
        nuv0[side[0]] = interpUv;
        nuv1[side[1]] = interpUv;

        buffer.push(middle);
        normBuffer.push(interpNormal);
        uvBuffer.push(interpUv);

        indexPointer = this._subdiviseRec(nv0[0], nv0[1], nv0[2], nn0[0], nn0[1], nn0[2], nuv0[0], nuv0[1], nuv0[2], ni0[0], ni0[1], ni0[2], areaThreshold, buffer, normBuffer, uvBuffer, indices, indexPointer);
        return this._subdiviseRec(nv1[0], nv1[1], nv1[2], nn1[0], nn1[1], nn1[2], nuv1[0], nuv1[1], nuv1[2], ni1[0], ni1[1], ni1[2], areaThreshold, buffer, normBuffer, uvBuffer, indices, indexPointer);
    }

    private _findBiggestSide(v0: Vector3, v1: Vector3, v2: Vector3): number[] {
        // TODO : buffer this
        let l10 = v1.subtract(v0).lengthSquared();
        let l20 = v2.subtract(v0).lengthSquared();
        let l21 = v2.subtract(v1).lengthSquared();

        if (l10 >= l20 && l10 >= l21) {
            this._tempEdgeBuffer = [1, 0];
        }

        if (l20 >= l10 && l20 >= l21) {
            this._tempEdgeBuffer = [2, 0];
        }

        if (l21 >= l10 && l21 >= l20) {
            this._tempEdgeBuffer = [2, 1];
        }

        return this._tempEdgeBuffer;
    }

    private _triangleArea(v0: Vector3, v1: Vector3, v2: Vector3) {
        // TODO : buffer this
        let v10 = v1.subtract(v0);
        let v20 = v2.subtract(v0);
        let c = Vector3.Cross(v10, v20);
        return 0.5 * c.length();
    }

    private _renderSubMeshWithEffect = (uniformCallback: (effect: Effect, ...args: any[]) => void,
        isEffectReady: (subMesh: SubMesh, ...args: any[]) => Effect,
        subMesh: SubMesh,
        ...args: any[]): boolean => {

        var mesh = subMesh.getRenderingMesh();
        var scene = this._scene;
        var engine = scene.getEngine();
        let material = subMesh.getMaterial();

        if (!material) {
            return false;
        }

        // Culling and reverse (right handed system)
        engine.setState(false, 0, true, scene.useRightHandedSystem); // TODO : BFC
        engine.setDirectViewport(0, 0, this.getCurrentRenderWidth(), this.getCurrentRenderHeight())
        // Managing instances
        var batch = mesh._getInstancesRenderList(subMesh._id);

        if (batch.mustReturn) {
            return false;
        }

        var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);
        var effect: Effect;

        if (effect = isEffectReady(subMesh, hardwareInstancedRendering)) {
            engine.enableEffect(effect);
            mesh._bind(subMesh, effect, Material.TriangleFillMode);

            uniformCallback(effect, args);

            // Alpha test
            if (material && material.needAlphaTesting()) {
                var alphaTexture = material.getAlphaTestTexture();

                if (alphaTexture) {
                    effect.setTexture("diffuseSampler", alphaTexture);
                    effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                }
            }

            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
            }

            // Draw triangles
            mesh._processRendering(subMesh, effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                (isInstance, world) => effect.setMatrix("world", world));

            // render edges
            // mesh._bind(subMesh, effect, Material.WireFrameFillMode);
            // mesh._processRendering(subMesh, effect, Material.WireFrameFillMode, batch, hardwareInstancedRendering,
            //     (isInstance, world) => effect.setMatrix("world", world));

            // // render points
            // mesh._bind(subMesh, effect, Material.PointFillMode);
            // mesh._processRendering(subMesh, effect, Material.PointFillMode, batch, hardwareInstancedRendering,
            //     (isInstance, world) => effect.setMatrix("world", world));

            return true;
        }

        return false;
    };

    public createMaps() {
        this._nextShooterTexture = new RenderTargetTexture("nextShooter", 1, this._scene, false, true, Constants.TEXTURETYPE_FLOAT);
        var meshes = this._meshes;

        for (let i = 0; i < meshes.length; i++) {
            var mesh = meshes[i];

            var size = (<any>mesh).__lightmapSize; // todo : clean that up

            if (!size) {
                continue;
            }

            var residualTexture = new MultiRenderTarget("patch",
                size,
                7,
                this._scene,
                {
                    samplingModes: [Texture.NEAREST_NEAREST, Texture.NEAREST_NEAREST, Texture.NEAREST_NEAREST, Texture.LINEAR_LINEAR_MIPNEAREST, Texture.LINEAR_LINEAR_MIPNEAREST, Texture.LINEAR_LINEAR_MIPNEAREST, Texture.LINEAR_LINEAR_MIPNEAREST],
                    types: [Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_UNSIGNED_INT, Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_FLOAT],
                    generateMipMaps: true
                }
            );
            (<any>mesh).residualTexture = residualTexture;
            residualTexture.renderList = [mesh];
            residualTexture.refreshRate = 1;
            residualTexture.ignoreCameraViewport = true;
            (<any>residualTexture).patchOffset = this._patchOffset;
            meshes[i].subMeshes[0].surfaceId = this._patchOffset;
            this._submeshMap[this._patchOffset] = meshes[i].subMeshes[0];

            // TODO : merge functions ?
            var uniformCb = (effect: Effect, data: any[]): void => {
                var mesh = (<SubMesh>data[0]).getMesh();
                var width = (<any>mesh).__lightmapSize.width; // TODO : necessary only or individual patches mode
                var res = (<any>mesh).residualTexture;
                effect.setFloat("texSize", width);
                effect.setFloat("patchOffset", res.patchOffset);
                if ((<any>mesh).color) {
                    effect.setVector3("color", (<any>mesh).color);
                } else {
                    effect.setVector3("color", new Vector3(0, 0, 0));
                }
                if ((<any>mesh).lightStrength) {
                    effect.setVector3("lightStrength", (<any>mesh).lightStrength);
                } else {
                    effect.setFloat("lightStrength", 0.0);
                }
            }

            residualTexture.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
                var index;
                this._scene.getEngine().clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);

                // var testPatch = new Patch(this._scene.activeCamera ? this._scene.activeCamera.position : new Vector3(0, 0, 0), new Vector3(0, -1, 0));
                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    this._currentRenderedMap = (<any>opaqueSubMeshes.data[index].getMesh()).residualTexture;
                    if (this._renderSubMeshWithEffect(uniformCb, this.isRadiosityDataEffectReady.bind(this), opaqueSubMeshes.data[index], opaqueSubMeshes.data[index])) {
                        this._scene.onAfterRenderObservable.add(this.buildPatchesForSubMesh.bind(this, opaqueSubMeshes.data[index]), -1, false, null, true);
                    }
                }

                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    this._currentRenderedMap = (<any>alphaTestSubMeshes.data[index].getMesh()).residualTexture;
                    if (this._renderSubMeshWithEffect(uniformCb, this.isRadiosityDataEffectReady.bind(this), alphaTestSubMeshes.data[index], opaqueSubMeshes.data[index])) {
                        this._scene.onAfterRenderObservable.add(this.buildPatchesForSubMesh.bind(this, alphaTestSubMeshes.data[index]), -1, false, null, true);
                    }
                }

            };

            this._scene.customRenderTargets.push(residualTexture);

            // Upper bound of what indexes could be taken by patch filling
            this._patchOffset += size.width * size.height;

            this.buildVisibilityMap();
        }
    }

    public renderToRadiosityTexture(subMesh: SubMesh, patch: Patch) {
        if (!this.isGatheringEffectReady()) {
            return;
        }

        var mesh = subMesh.getRenderingMesh();
        var area = this._texelSize * this._texelSize * Math.PI / 8; // TODO : check why /4 diverges
        var mrt: MultiRenderTarget = (<any>mesh).residualTexture;
        var destResidualTexture = mrt.textures[5]._texture as InternalTexture;
        var destGatheringTexture = mrt.textures[6]._texture as InternalTexture;
        var engine = this._scene.getEngine();
        engine.enableEffect(this._shootEffect);
        this._shootEffect.setTexture("itemBuffer", this._patchMap);
        this._shootEffect.setTexture("worldPosBuffer", mrt.textures[0]);
        this._shootEffect.setTexture("worldNormalBuffer", mrt.textures[1]);
        this._shootEffect.setTexture("idBuffer", mrt.textures[2]);
        this._shootEffect.setTexture("residualBuffer", mrt.textures[3]);
        this._shootEffect.setTexture("gatheringBuffer", mrt.textures[4]);

        this._shootEffect.setVector3("shootPos", patch.position);
        this._shootEffect.setVector3("shootNormal", patch.normal);
        this._shootEffect.setVector3("shootEnergy", patch.residualEnergy);
        this._shootEffect.setFloat("shootDArea", area); // TODO
        this._shootEffect.setMatrix("view", patch.viewMatrix);

        engine.setDirectViewport(0, 0, destResidualTexture.width, destResidualTexture.height);
        engine.setState(false); // TODO : no BFC ?
        var gl = engine._gl;
        let fb = gl.createFramebuffer();

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, destResidualTexture._webGLTexture, 0);
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, destGatheringTexture._webGLTexture, 0);
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1
        ]);
        var batch = mesh._getInstancesRenderList(subMesh._id);

        if (batch.mustReturn) {
            return;
        }

        var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);
        mesh._bind(subMesh, this._shootEffect, Material.TriangleFillMode);
        mesh._processRendering(subMesh, this._shootEffect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
            (isInstance, world) => this._shootEffect.setMatrix("world", world));

        // Twice, for mipmaps
        engine.unBindFramebuffer(destResidualTexture);
        engine.unBindFramebuffer(destGatheringTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Dilates to origin, swapping buffers in the process
        this.dilate(1, mrt.textures[6], mrt.textures[4]);

        // Swap buffers that should not be dilated
        var t = mrt.textures[3];
        mrt.textures[3] = mrt.textures[5];
        mrt.textures[5] = t;

        var it = mrt.internalTextures[3];
        mrt.internalTextures[3] = mrt.internalTextures[5];
        mrt.internalTextures[5] = it;

        // t = mrt.textures[4];
        // mrt.textures[4] = mrt.textures[6];
        // mrt.textures[6] = t;

        // it = mrt.internalTextures[4];
        // mrt.internalTextures[4] = mrt.internalTextures[6];
        // mrt.internalTextures[6] = it;
    }

    public isGatheringEffectReady() {
        // var material: any = subMesh.getMaterial();
        // var defines = [];

        var attribs = [VertexBuffer.PositionKind, VertexBuffer.UV2Kind];
        var uniforms = ["view", "shootPos", "shootNormal", "shootEnergy", "shootDArea"]; // ["world", "mBones", "view", "nearFar"]
        var samplers = ["itemBuffer", "worldPosBuffer", "worldNormalBuffer", "idBuffer", "residualBuffer", "gatheringBuffer"];
        // var mesh = subMesh.getMesh();

        // Bones
        // if (mesh.useBones && mesh.computeBonesUsingShaders) {
        //     attribs.push(VertexBuffer.MatricesIndicesKind);
        //     attribs.push(VertexBuffer.MatricesWeightsKind);
        //     if (mesh.numBoneInfluencers > 4) {
        //         attribs.push(VertexBuffer.MatricesIndicesExtraKind);
        //         attribs.push(VertexBuffer.MatricesWeightsExtraKind);
        //     }
        //     defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
        //     defines.push("#define BonesPerMesh " + (mesh.skeleton ? mesh.skeleton.bones.length + 1 : 0));
        // } else {
        //     defines.push("#define NUM_BONE_INFLUENCERS 0");
        // }

        // // Instances
        // if (useInstances) {
        //     defines.push("#define INSTANCES");
        //     attribs.push("world0");
        //     attribs.push("world1");
        //     attribs.push("world2");
        //     attribs.push("world3");
        // }

        // Get correct effect
        // var join = defines.join("\n");
        // if (this._cachedDefines !== join) {
        //     this._cachedDefines = join;
        this._shootEffect = this._scene.getEngine().createEffect("radiosity",
            attribs,
            uniforms,
            samplers);
        // }

        if (this._shootEffect.isReady()) {
            return this._shootEffect;
        }

        return null;
    }

    public gatherRadiosity(): boolean {
        if (this._isCurrentlyGathering) {
            console.log("Still gathering radiosity for current submesh. Skipping.");
            return true;
        }
        var shooter = this.nextShooter();

        if (!shooter || !this.isRadiosityDataEffectReady() || !this.isGatheringEffectReady() || !this.isPatchEffectReady() || !this.isDilateEffectReady()) {
            console.log("No shooter yet");
            return true;
        }

        var energyLeft = this.updatePatches(shooter);
        if (energyLeft < 10) {
            return false;
        }

        this._isCurrentlyGathering = true;
        this.consumeEnergyInTexture(shooter);

        for (let i = 0; i < shooter.radiosityPatches.length; i++) {
            this._currentPatch = shooter.radiosityPatches[i];
            this._patchMap.render(false);
            // this._scene.customRenderTargets.push(this._patchMap);
            // return;
            for (let j = 0; j < this._patchedSubMeshes.length; j++) {
                if (this._patchedSubMeshes[j] === shooter) {
                    continue;
                }
                this.renderToRadiosityTexture(this._patchedSubMeshes[j], shooter.radiosityPatches[i]);
            }
        }
        var engine = this._scene.getEngine();
        engine.restoreDefaultFramebuffer();
        engine.setViewport((<Camera>this._scene.activeCamera).viewport);
        this._isCurrentlyGathering = false;
        return true;
    }

    public consumeEnergyInTexture(shooter: SubMesh) {
        var mrt = (<any>shooter.getMesh()).residualTexture as MultiRenderTarget;
        var residualEnergyTexture = mrt.textures[3];
        var engine = this._scene.getEngine();
        var gl = engine._gl;
        var data = [];
        for (let i = 0; i < mrt.getRenderWidth(); i++) {
            for (let j = 0; j < mrt.getRenderHeight(); j++) {
                data.push(0, 0, 0, 1.0);
            }
        }
        var buffer = new Float32Array(data);
        gl.bindTexture(gl.TEXTURE_2D, (<InternalTexture>residualEnergyTexture._texture)._webGLTexture);
        gl.texSubImage2D(
            gl.TEXTURE_2D, 0, 0, 0, mrt.getRenderWidth(), mrt.getRenderHeight(), gl.RGBA,
            gl.FLOAT, buffer);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    public nextShooter(): Nullable<SubMesh> {
        if (!this.isNextShooterEffectReady()) {
            return null;
        }

        // TODO : turn into postprocess
        var engine = this._scene.getEngine();
        engine.enableEffect(this._nextShooterEffect);
        engine.setState(false);
        engine.bindFramebuffer(<InternalTexture>(this._nextShooterTexture._texture));
        engine.clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);

        this._prepareBuffers();
        let vb: any = {};
        vb[VertexBuffer.PositionKind] = this._vertexBuffer;
        engine.bindBuffers(vb, this._indexBuffer, this._nextShooterEffect);

        for (let i = 0; i < this._meshes.length; i++) {
            var mesh = this._meshes[i];
            var mrt: MultiRenderTarget = (<any>mesh).residualTexture;

            if (!mrt) {
                continue;
            }

            var unshotTexture: Texture = mrt.textures[3];
            var idTexture: Texture = mrt.textures[2];

            this._nextShooterEffect.setTexture("polygonIdSampler", idTexture);
            this._nextShooterEffect.setTexture("unshotRadiositySampler", unshotTexture);
            this._nextShooterEffect.setFloat("lod", Math.round(Math.log(mrt.getRenderWidth()) / Math.log(2)));
            this._nextShooterEffect.setFloat("area", mrt.getRenderWidth() * mrt.getRenderHeight()); // TODO : REAL POLYGON AREA

            engine.setDirectViewport(0, 0, 1, 1);
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }
        // Read result directly after render
        var pixels = engine.readPixelsFloat(0, 0, 1, 1);

        let id = Math.round(this.decodeId(Vector3.FromArray(pixels)) * 255);
        let shaderValue = (1 / (pixels[3] / 255) - 1) / 3;
        console.log("Next shooter ID : " + id);
        console.log("Residual energy gathered from shader : " + shaderValue);

        engine.unBindFramebuffer(<InternalTexture>(this._nextShooterTexture._texture));

        return this._submeshMap[id];
    }

    public dilate(padding: number = 1, origin: Texture, dest: Texture) {
        if (!this.isDilateEffectReady()) {
            return;
        }

        // TODO : turn into postprocess
        var engine = this._scene.getEngine();
        engine.enableEffect(this._dilateEffect);
        engine.setState(false);
        let gl = engine._gl;
        let fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, (<InternalTexture>dest._texture)._webGLTexture, 0);

        engine.clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);
        this._prepareBuffers();
        let vb: any = {};
        vb[VertexBuffer.PositionKind] = this._vertexBuffer;
        this._dilateEffect.setTexture("inputTexture", origin);
        this._dilateEffect.setFloat2("texelSize", 1 / dest.getSize().width, 1 / dest.getSize().height);
        engine.bindBuffers(vb, this._indexBuffer, this._dilateEffect);

        engine.setDirectViewport(0, 0, dest.getSize().width, dest.getSize().height);
        engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    private _prepareBuffers(): void {
        if (this._vertexBuffer) {
            return;
        }

        // VBO
        var vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        this._vertexBuffer = new VertexBuffer(this._scene.getEngine(), vertices, VertexBuffer.PositionKind, false, false, 2);

        this._buildIndexBuffer();
    }

    private _buildIndexBuffer(): void {
        // Indices
        var indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
    }


    /**
     * Creates the patch rendering effect and checks if the effect is ready.
     * @param subMesh The submesh to be used to render the depth map of
     * @param useInstances If multiple world instances should be used
     * @returns if the depth renderer is ready to render the depth map
     */
    public isPatchEffectReady(): Nullable<Effect> {
        // var material: any = subMesh.getMaterial();
        // var defines = [];

        var attribs = [VertexBuffer.PositionKind, VertexBuffer.UV2Kind];

        // var mesh = subMesh.getMesh();

        // Alpha test
        // if (material && material.needAlphaTesting() && material.getAlphaTestTexture()) {
        //     defines.push("#define ALPHATEST");
        //     if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
        //         attribs.push(VertexBuffer.UVKind);
        //         defines.push("#define UV1");
        //     }
        //     if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
        //         attribs.push(VertexBuffer.UV2Kind);
        //         defines.push("#define UV2");
        //     }
        // }

        // Bones
        // if (mesh.useBones && mesh.computeBonesUsingShaders) {
        //     attribs.push(VertexBuffer.MatricesIndicesKind);
        //     attribs.push(VertexBuffer.MatricesWeightsKind);
        //     if (mesh.numBoneInfluencers > 4) {
        //         attribs.push(VertexBuffer.MatricesIndicesExtraKind);
        //         attribs.push(VertexBuffer.MatricesWeightsExtraKind);
        //     }
        //     defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
        //     defines.push("#define BonesPerMesh " + (mesh.skeleton ? mesh.skeleton.bones.length + 1 : 0));
        // } else {
        //     defines.push("#define NUM_BONE_INFLUENCERS 0");
        // }

        // Instances
        // if (useInstances) {
        //     defines.push("#define INSTANCES");
        //     attribs.push("world0");
        //     attribs.push("world1");
        //     attribs.push("world2");
        //     attribs.push("world3");
        // }

        // Get correct effect
        // var join = defines.join("\n");
        // if (this._cachedDefines !== join) {
        //     this._cachedDefines = join;
        this._uV2Effect = this._scene.getEngine().createEffect("uv2mat",
            attribs,
            ["world", "mBones", "view", "nearFar"],
            ["diffuseSampler", "itemBuffer"], "");
        // }

        if (this._uV2Effect.isReady()) {
            return this._uV2Effect;
        }

        return null;
    }

    public isRadiosityDataEffectReady(): Nullable<Effect> {
        // var mesh = subMesh.getMesh();
        // if (!mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
        //     return null;
        // }

        var defines: any[] = [];
        var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind, VertexBuffer.UV2Kind];

        // Instances
        // if (useInstances) {
        //     defines.push("#define INSTANCES");
        //     attribs.push("world0");
        //     attribs.push("world1");
        //     attribs.push("world2");
        //     attribs.push("world3");
        // }

        // Get correct effect
        var join = defines.join("\n");

        if (this._cachedDefines !== join) {
            this._cachedDefines = join;
            this._radiosityEffect = this._scene.getEngine().createEffect("buildRadiosity",
                attribs,
                ["world", "texSize", "worldTexelRatio", "patchOffset", "color", "lightStrength"],
                [], join);
        }

        if (this._radiosityEffect.isReady()) {
            return this._radiosityEffect;
        }

        return null;
    }

    public isNextShooterEffectReady(): boolean {
        this._nextShooterEffect = this._scene.getEngine().createEffect("nextShooter",
            [VertexBuffer.PositionKind],
            ["lod", "area"],
            ["polygonIdSampler", "unshotRadiositySampler"], "");

        return this._nextShooterEffect.isReady();
    }

    public isDilateEffectReady(): boolean {
        this._dilateEffect = this._scene.getEngine().createEffect("dilate",
            [VertexBuffer.PositionKind],
            ["offset", "texelSize"],
            ["inputTexture"], "");

        return this._dilateEffect.isReady();
    }

    public encodeId(n: number) {
        var id = new Vector3();
        var remain = n;
        id.x = remain % 256;
        remain = Math.floor(remain / 256);
        id.y = remain % 256;
        remain = Math.floor(remain / 256);
        id.z = remain % 256;

        return id;
    }

    public decodeId(v: Vector3) {
        return (v.x + 256 * v.y + 65536 * v.z);
    }

    public buildPatchesForSubMesh(subMesh: SubMesh) {
        if (this._patchedSubMeshes.indexOf(subMesh) !== -1) {
            return;
        }
        subMesh.radiosityPatches = [];

        // Read pixels
        var mesh = subMesh.getMesh();
        var map = (<MultiRenderTarget>(<any>mesh).residualTexture);
        var size = map.getSize();
        var width = size.width;
        var height = size.height;
        var engine = this._scene.getEngine();

        var positions = <Float32Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[0], width, height);
        var normals = <Float32Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[1], width, height);
        var ids = <Uint8Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[2], width, height);
        var residualEnergy = <Uint8Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[3], width, height);

        for (let i = 0; i < positions.length; i += 4) {
            subMesh.radiosityPatches.push(new Patch(new Vector3(positions[i], positions[i + 1], positions[i + 2]),
                new Vector3(normals[i], normals[i + 1], normals[i + 2]),
                this.decodeId(new Vector3(ids[i], ids[i + 1], ids[i + 2])),
                new Vector3(residualEnergy[i] / 255., residualEnergy[i + 1] / 255., residualEnergy[i + 2] / 255.)));
        }
        this._patchedSubMeshes.push(subMesh);
        this._scene.customRenderTargets.splice(this._scene.customRenderTargets.indexOf(map), 1);
    }

    public updatePatches(subMesh: SubMesh): number {
        // Requires residualTexture to be filled
        var mesh = subMesh.getMesh();
        var map = (<MultiRenderTarget>(<any>mesh).residualTexture);
        var size = map.getSize();
        var width = size.width;
        var height = size.height;
        var engine = this._scene.getEngine();
        var residualEnergy = <Float32Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[3], width, height);
        var sum = 0;
        for (let i = 0; i < residualEnergy.length; i += 4) {
            subMesh.radiosityPatches[i / 4].residualEnergy.copyFromFloats(residualEnergy[i], residualEnergy[i + 1], residualEnergy[i + 2]);
            sum += (residualEnergy[i] + residualEnergy[i + 1] + residualEnergy[i + 2]) / 3;
        }
        console.log("Residual energy gathered from surface : " + sum);

        return sum;
    }

    public buildVisibilityMap() {
        this._patchMap = new RenderTargetTexture("patch", 512, this._scene, false, true, Constants.TEXTURETYPE_UNSIGNED_INT, false, Texture.NEAREST_SAMPLINGMODE);
        this._patchMap.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._patchMap.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._patchMap.renderParticles = false;
        this._patchMap.renderList = this._meshes;
        this._patchMap.activeCamera = null;
        this._patchMap.ignoreCameraViewport = true;
        this._patchMap.useCameraPostProcesses = false;

        var uniformCb = (effect: Effect, data: any[]) => {
            var patch = data[0];
            var mesh = data[1].getMesh();

            effect.setMatrix("view", patch.viewMatrix);
            effect.setFloat2("nearFar", this._near, this._far);
            effect.setTexture("itemBuffer", mesh.residualTexture.textures[2]);
        };

        this._patchMap.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
            var index;
            this._currentRenderedMap = this._patchMap;
            this._scene.getEngine().clear(new Color4(0, 0, 0, 0), true, true);
            for (index = 0; index < opaqueSubMeshes.length; index++) {
                this._renderSubMeshWithEffect(uniformCb, this.isPatchEffectReady.bind(this), opaqueSubMeshes.data[index], this._currentPatch, opaqueSubMeshes.data[index]);
            }

            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                this._renderSubMeshWithEffect(uniformCb, this.isPatchEffectReady.bind(this), alphaTestSubMeshes.data[index], this._currentPatch, alphaTestSubMeshes.data[index]);
            }
        };

    }

    /**
     * Gets the texture which the depth map will be written to.
     * @returns The depth map texture
     */
    public getDepthMap(): RenderTargetTexture {
        return this._patchMap;
    }

    /**
     * Disposes of the depth renderer.
     */
    public dispose(): void {
        this._patchMap.dispose();
    }
}
