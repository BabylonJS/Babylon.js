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
import { Vector3 } from "../Maths/math";
import { Color4 } from "../Maths/math";
import { Matrix } from "../Maths/math";
import { Camera } from "../Cameras/camera";
import { RadiosityUtils } from "./radiosityUtils";
import { RadiosityEffectsManager } from "./radiosityEffectsManager";

import { Nullable } from "../types";
// import { Tools } from "../misc/tools";

class Patch {
    constructor(p: Vector3, n: Vector3, id: number, residualEnergy: Vector3) {
        // World space
        this.position = p.clone();
        this.normal = n.clone().normalize();
        this.id = id;
        this.residualEnergy = residualEnergy;

        // TODO : for hemicube, orientate with dFdy in tangent space ?
        this.viewMatrix = Matrix.LookAtLH(this.position, this.position.add(this.normal), Vector3.Up());
        let xAxis = new Vector3(this.viewMatrix.m[0], this.viewMatrix.m[4], this.viewMatrix.m[8]); // Tangent
        let yAxis = new Vector3(this.viewMatrix.m[1], this.viewMatrix.m[5], this.viewMatrix.m[9]); // "Up"
        let zAxis = new Vector3(this.viewMatrix.m[2], this.viewMatrix.m[6], this.viewMatrix.m[10]); // depth

        // TODO : could be optimized, but for now this is not the performance bottleneck
        this.viewMatrixPX = Matrix.LookAtLH(this.position, this.position.add(xAxis), yAxis);
        this.viewMatrixNX = Matrix.LookAtLH(this.position, this.position.subtract(xAxis), yAxis);
        this.viewMatrixPY = Matrix.LookAtLH(this.position, this.position.add(yAxis), zAxis.scale(-1));
        this.viewMatrixNY = Matrix.LookAtLH(this.position, this.position.subtract(yAxis), zAxis);
    }

    public getResidualEnergySum() {
        return this.residualEnergy.x + this.residualEnergy.y + this.residualEnergy.z;
    }

    public toString() {
        return `Position: ${this.position.x} ${this.position.y} ${this.position.z}\n` +
            `Normal: ${this.normal.x} ${this.normal.y} ${this.normal.z}\n` +
            `Id: ${this.id}\n`;
    }

    public id: number;
    public position: Vector3;
    public normal: Vector3;
    public viewMatrix: Matrix;
    public viewMatrixPX: Matrix;
    public viewMatrixNX: Matrix;
    public viewMatrixPY: Matrix;
    public viewMatrixNY: Matrix;
    public residualEnergy: Vector3;

    public static readonly fov: number = 90 * Math.PI / 180;
    public static projectionMatrix: Matrix;
    public static projectionMatrixPX: Matrix;
    public static projectionMatrixNX: Matrix;
    public static projectionMatrixPY: Matrix;
    public static projectionMatrixNY: Matrix;
}

declare module "../meshes/mesh" {
    export interface Mesh {
        /** @hidden */
        __lightmapSize: {
            width: number,
            height: number
        };
        __texelWorldSize: number;
        /** @hidden */
        __lightMapId: Vector3;
        /** @hidden */
        __patchOffset: number;
        _color: Vector3; // TODO color 3
        lightStrength: Vector3; // TODO unused
        residualTexture: MultiRenderTarget;
        /** @hidden */
        radiosityPatches: Patch[];
    }
}

/**
 * Patch Renderer
 * Creates patches from uv-mapped (lightmapped) geometry.
 * Renders hemicubes or spheres from patches
 * Shoots light from emissive patches
 * Can be used as direct light baking, or radiosity light baking solution
 */

export class PatchRenderer {

    public useDepthCompare: boolean = true;
    public useHemicube: boolean = true;
    private _cachePatches: boolean = false;
    private _filterMinEnergy: number = 1e-5;
    private _patchMapResolution: number = 1024;

    public static PERFORMANCE_LOGS_LEVEL: number = 1;
    public static RADIOSITY_INFO_LOGS_LEVEL: number = 1;
    public static WARNING_LOGS: number = 1;

    private static DIRECT_PASS = 0;
    private static INDIRECT_PASS = 1;

    private _activeShooters: Mesh[] = [];
    private _scene: Scene;
    private _meshes: Mesh[];
    private _patchMap: RenderTargetTexture;

    private _near: number;
    private _far: number;
    private _frameBuffer0: WebGLFramebuffer;
    private _frameBuffer1: WebGLFramebuffer;

    private _patchOffset: number = 0;
    private _patchedMeshes: Mesh[] = [];
    private _currentPatch: Patch;
    private _currentRenderedMap: RenderTargetTexture;
    private _nextShooterTexture: RenderTargetTexture;
    private _patchMaps: RenderTargetTexture[] = [];

    private _meshMap: { [key: number]: Mesh } = {};
    private _isBuildingPatches: boolean = false;

    private _radiosityEffectsManager: RadiosityEffectsManager;

    private _renderState: {
        nextPass: number,
        shooterMeshes: Mesh[],
        shooterPatches: Nullable<Patch[]>,
        shooterIndex: number,
        overTime: number
    };

    public getCurrentRenderWidth(): number {
        return this._currentRenderedMap.getRenderWidth();
    }

    public getCurrentRenderHeight(): number {
        return this._currentRenderedMap.getRenderHeight();
    }

    private squareToDiskArea(a: number) {
        return a * a * Math.PI / 4;
    }

    constructor(scene: Scene, meshes: Mesh[]) {
        this._scene = scene;
        this._near = 0.1;
        this._far = 10000;
        this._meshes = meshes;

        this.resetRenderState();

        Patch.projectionMatrix = Matrix.PerspectiveFovLH(Patch.fov,
            1, // squared texture
            this._near,
            this._far,
        );

        Patch.projectionMatrixPX = Patch.projectionMatrix.multiply(Matrix.FromValues(2, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            1, 0, 0, 1
        ));

        Patch.projectionMatrixNX = Patch.projectionMatrix.multiply(Matrix.FromValues(2, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -1, 0, 0, 1
        ));

        Patch.projectionMatrixPY = Patch.projectionMatrix.multiply(Matrix.FromValues(1, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 1, 0,
            0, 1, 0, 1
        ));

        Patch.projectionMatrixNY = Patch.projectionMatrix.multiply(Matrix.FromValues(1, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 1, 0,
            0, -1, 0, 1
        ));

        // scene.getEngine().disableTextureBindingOptimization = true;
        this._frameBuffer0 = <WebGLFramebuffer>(scene.getEngine()._gl.createFramebuffer());
        this._frameBuffer1 = <WebGLFramebuffer>(scene.getEngine()._gl.createFramebuffer());

        this._radiosityEffectsManager = new RadiosityEffectsManager(this._scene, this.useHemicube, this.useDepthCompare);
    }

    public resetRenderState(): void {
        this._renderState = {
            nextPass: PatchRenderer.DIRECT_PASS,
            shooterPatches: null,
            shooterIndex: 0,
            shooterMeshes: [],
            overTime: 0
        };
    }

    public createHTScene(areaThreshold: number) {
        var scene = this._scene;

        for (let i = scene.meshes.length - 1; i >= 0; i--) {
            RadiosityUtils.retesselateMesh(scene.meshes[i], areaThreshold, this._scene);
        }

        this._meshes = <Mesh[]>(scene.meshes);
    }

    private renderPatchInfo = (uniformCallback: (effect: Effect, ...args: any[]) => void,
        subMesh: SubMesh,
        ...args: any[]): boolean => {

        var mesh = subMesh.getRenderingMesh();
        var scene = this._scene;
        var engine = scene.getEngine();
        var batch = mesh._getInstancesRenderList(subMesh._id);

        // Culling and reverse (right handed system)
        engine.setState(false, 0, true, scene.useRightHandedSystem); // TODO : BFC
        engine.setDirectViewport(0, 0, this.getCurrentRenderWidth(), this.getCurrentRenderHeight());

        var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);
        var effect = this._radiosityEffectsManager.radiosityEffect;

        if (!effect || !effect.isReady()) {
            return false;
        }

        engine.enableEffect(effect);
        mesh._bind(subMesh, effect, Material.TriangleFillMode);

        uniformCallback(effect, args);

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

    public createMaps() {
        this._nextShooterTexture = new RenderTargetTexture("nextShooter", 1, this._scene, false, true, Constants.TEXTURETYPE_FLOAT);
        this._isBuildingPatches = true;
        var meshes = this._meshes;

        for (let i = 0; i < meshes.length; i++) {
            var mesh = meshes[i];
            var size = mesh.__lightmapSize;

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

            mesh.residualTexture = residualTexture;
            mesh.__patchOffset = this._patchOffset;

            residualTexture.renderList = [mesh];
            residualTexture.refreshRate = 1;
            residualTexture.ignoreCameraViewport = true;

            this._meshMap[this._patchOffset] = meshes[i];
            mesh.__lightMapId = RadiosityUtils.encodeId(this._patchOffset).scaleInPlace(1 / 255);

            // TODO : merge functions ?
            var uniformCb = (effect: Effect, data: any[]): void => {
                var mesh = (<SubMesh>data[0]).getRenderingMesh();
                var width = mesh.__lightmapSize.width;

                effect.setFloat("texSize", width);
                effect.setFloat("patchOffset", mesh.__patchOffset);

                if (mesh._color) {
                    effect.setVector3("color", mesh._color);
                } else {
                    effect.setVector3("color", new Vector3(0, 0, 0));
                }
                if (mesh.lightStrength) {
                    effect.setVector3("lightStrength", mesh.lightStrength);
                } else {
                    effect.setFloat("lightStrength", 0.0);
                }
            };

            residualTexture.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
                var index;
                this._scene.getEngine().clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);

                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    this._currentRenderedMap = opaqueSubMeshes.data[index].getRenderingMesh().residualTexture;
                    if (this.renderPatchInfo(uniformCb, opaqueSubMeshes.data[index], opaqueSubMeshes.data[index])) {
                        this._scene.onAfterRenderObservable.add(this.buildPatchesForSubMesh.bind(this, opaqueSubMeshes.data[index]), -1, false, null, true);
                    }

                }

                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    this._currentRenderedMap = alphaTestSubMeshes.data[index].getRenderingMesh().residualTexture;
                    if (this.renderPatchInfo(uniformCb, alphaTestSubMeshes.data[index], alphaTestSubMeshes.data[index])) {
                        this._scene.onAfterRenderObservable.add(this.buildPatchesForSubMesh.bind(this, alphaTestSubMeshes.data[index]), -1, false, null, true);
                    }
                }

            };

            this._scene.customRenderTargets.push(residualTexture);
            this._patchMaps.push(residualTexture);

            if (PatchRenderer.RADIOSITY_INFO_LOGS_LEVEL >= 2) {
                console.log(`Offset ${this._patchOffset} is for mesh : ${mesh.name}.`);
            }
            this._patchOffset += 1;

        }
        if (this.useHemicube) {
            this.buildVisibilityMapCube();
        } else {
            this.buildVisibilityMap();
        }
    }

    private renderToRadiosityTexture(mesh: Mesh, patch: Patch, patchArea: number, doNotWriteToGathering = false) {
        var deltaArea = patchArea;
        var mrt: MultiRenderTarget = mesh.residualTexture;
        var destResidualTexture = mrt.textures[5]._texture as InternalTexture;
        var destGatheringTexture = mrt.textures[6]._texture as InternalTexture;
        var engine = this._scene.getEngine();
        engine.enableEffect(this._radiosityEffectsManager.shootEffect);

        this._radiosityEffectsManager.shootEffect.setTexture("itemBuffer", this._patchMap);
        this._radiosityEffectsManager.shootEffect.setTexture("worldPosBuffer", mrt.textures[0]);
        this._radiosityEffectsManager.shootEffect.setTexture("worldNormalBuffer", mrt.textures[1]);
        this._radiosityEffectsManager.shootEffect.setTexture("idBuffer", mrt.textures[2]);
        this._radiosityEffectsManager.shootEffect.setTexture("residualBuffer", mrt.textures[3]);
        this._radiosityEffectsManager.shootEffect.setFloat("gatheringScale", doNotWriteToGathering ? 0.0 : 1.0);
        this._radiosityEffectsManager.shootEffect.setFloat("residualScale", 1.0);
        this._radiosityEffectsManager.shootEffect.setTexture("gatheringBuffer", mrt.textures[4]);
        this._radiosityEffectsManager.shootEffect.setFloat2("nearFar", this._near, this._far);

        this._radiosityEffectsManager.shootEffect.setVector3("shootPos", patch.position);
        this._radiosityEffectsManager.shootEffect.setVector3("shootNormal", patch.normal);
        this._radiosityEffectsManager.shootEffect.setVector3("shootEnergy", patch.residualEnergy);
        this._radiosityEffectsManager.shootEffect.setFloat("shootDArea", deltaArea);
        this._radiosityEffectsManager.shootEffect.setMatrix("view", patch.viewMatrix);

        if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 3) {
            console.log(`Lightmap size for this submesh : ${mrt.getSize().width} x ${mrt.getSize().height}`);
        }

        engine.setDirectViewport(0, 0, destResidualTexture.width, destResidualTexture.height);
        engine.setState(false); // TODO : no BFC ?
        var gl = engine._gl;
        let fb = this._frameBuffer0;

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, destResidualTexture._webGLTexture, 0);
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, destGatheringTexture._webGLTexture, 0);
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1
        ]);

        var subMeshes = mesh.subMeshes;

        for (let i = 0; i < subMeshes.length; i++) {
            var subMesh = subMeshes[i];
            var batch = mesh._getInstancesRenderList(subMesh._id);

            if (batch.mustReturn) {
                return;
            }

            var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);
            mesh._bind(subMesh, this._radiosityEffectsManager.shootEffect, Material.TriangleFillMode);
            mesh._processRendering(subMesh, this._radiosityEffectsManager.shootEffect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                (isInstance, world) => this._radiosityEffectsManager.shootEffect.setMatrix("world", world));
        }

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

    private cleanAfterRender(dateBegin = 0, duration = 0) {
        var engine = this._scene.getEngine();
        engine.restoreDefaultFramebuffer();
        engine.setViewport((<Camera>this._scene.activeCamera).viewport);

        if (dateBegin) {
            this._renderState.overTime -= duration - (Date.now() - dateBegin);
        }
    }

    public gatherFor(duration: number, energyLeftThreshold = 1): boolean {
        let dateBegin = Date.now();

        if (!this._renderState.shooterPatches || !this._renderState.shooterPatches.length) {
            if (!this._renderState.shooterMeshes.length) {
                if (this._renderState.nextPass === PatchRenderer.DIRECT_PASS) {
                    this.nextShooter(true);
                    this._renderState.shooterMeshes = this._activeShooters.slice();
                    this._renderState.nextPass = PatchRenderer.INDIRECT_PASS;
                } else {
                    let m = this.nextShooter(false);
                    if (!m) {
                        this.cleanAfterRender(dateBegin, duration);
                        return false;
                    }
                    this._renderState.shooterMeshes = [m];
                }
            }

            this._renderState.shooterPatches = this.getNextPatches(this._renderState.shooterMeshes[0], energyLeftThreshold);

            if (!this._renderState.shooterPatches) {
                // Gathering is over
                this.cleanAfterRender(dateBegin, duration);
                return false;
            }
        }

        while (Date.now() - dateBegin < (duration - this._renderState.overTime)) {
            if (this._renderState.shooterIndex >= this._renderState.shooterPatches.length) {
                // We are over with this emitting mesh
                this._renderState.shooterMeshes.shift();
                this._renderState.shooterPatches = null;
                this._renderState.shooterIndex = 0;
                // We are shortening this pass to avoid being out of time budget
                this.cleanAfterRender(dateBegin, duration);
                return true;
            }
            this.renderPatches(this._renderState.shooterPatches, this._renderState.shooterMeshes[0], this._renderState.shooterIndex, this._renderState.shooterIndex + 1);
            this._renderState.shooterIndex++;
        }


        this.cleanAfterRender(dateBegin, duration);
        return true;
    }

    private getNextPatches(mesh: Mesh, energyLeftThreshold: number) {
        let o = this.updatePatches(mesh);
        let patches = o.patches;
        let energyLeft = o.energyLeft;

        if (energyLeft < energyLeftThreshold) {
            return null;
        }
        this.consumeEnergyInTexture(mesh);

        return patches;
    }

    public isReady() {
        return (this._radiosityEffectsManager.isReady() && !this._isBuildingPatches);
    }

    public gatherDirectLightOnly(energyLeftThreshold = 1): boolean {
        if (!this.isReady()) {
            if (PatchRenderer.WARNING_LOGS) {
                console.log("Not ready yet");
            }

            return true;
        }

        this.nextShooter(true);

        let emissiveMeshes = this._activeShooters;

        // Shooting ALL direct light in no particular order
        let shooter;
        let hasShot = false;
        for (let k = 0; k < emissiveMeshes.length; k++) {
            shooter = emissiveMeshes[k];

            let patches = this.getNextPatches(shooter, energyLeftThreshold);

            if (patches) {
                this.renderPatches(patches, shooter);
                hasShot = true;
            } 
        }

        this.cleanAfterRender();

        return hasShot;
    }


    public gatherRadiosity(energyLeftThreshold = 1): boolean {
        if (!this.isReady()) {
            if (PatchRenderer.WARNING_LOGS) {
                console.log("Not ready yet");
            }
            return true;
        }

        let duration;
        let dateBegin = Date.now();
        let nextShooterDate = Date.now();

        if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
            console.log(`BEGINNING RADIOSITY PASS FOR ${this._meshes.length} MESHES...`);
        }

        var shooter = this.nextShooter();

        if (!shooter) {
            if (PatchRenderer.WARNING_LOGS) {
                console.log("No shooter");
            }
            return true;
        }

        if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
            duration = Date.now() - nextShooterDate;
            console.log(`Find next shooter took ${duration}ms.`);
        }

        let updatePatchDate = Date.now();

        let patches = this.getNextPatches(shooter, energyLeftThreshold);

        if (!patches) {
            return false;
        }

        if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
            duration = Date.now() - updatePatchDate;
            console.log(`Updating patches and consuming energy for shooter took ${duration}ms.`);
            console.log(`Now shooting radiosity for ${patches.length} patches.`);
        }

        let shootingDate = Date.now();

        this.renderPatches(patches, shooter);

        if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
            duration = Date.now() - shootingDate;
            console.log(`Shooting radiosity for all patches took ${duration}ms.`);
            console.log(`Currently shooting ${patches.length * 1000 / duration} patches/s.`);
            console.log("\n========================")
            console.log("ENDING RADIOSITY PASS")
            console.log("========================")
            duration = Date.now() - dateBegin;
            console.log(`Total pass took : ${duration / 1000}s.`)
        }

        this.cleanAfterRender();
        return true;
    }

    private renderPatches(patches: Patch[], shooter: Mesh, indexBegin = 0, indexEnd = patches.length) {
        let duration;

        for (let i = indexBegin; i < indexEnd; i++) {
            this._currentPatch = patches[i];

            if (this._filterMinEnergy && !this._cachePatches && this._currentPatch.getResidualEnergySum() * shooter.__texelWorldSize * shooter.__texelWorldSize < this._filterMinEnergy) {
                if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
                    this._renderState.shooterIndex = patches.length;
                    console.log(`Ended pass early after treating ${i} shooters amongst ${patches.length} shooters.`);
                    return;
                }
            }

            let patchMapDate = Date.now();

            if (this.useHemicube) {
                this.renderVisibilityMapCube();
            } else {
                this._patchMap.render(false);
            }

            if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 2) {
                duration = Date.now() - patchMapDate;
                console.log(`Rendering patch map for 1 patch took ${duration}ms.`);
            }

            // this._scene.customRenderTargets.push(this._patchMap);
            // return false;

            let patchShooting = Date.now();
            for (let j = 0; j < this._patchedMeshes.length; j++) {

                let subMeshDate = Date.now();
                this.renderToRadiosityTexture(this._patchedMeshes[j], patches[i], this.squareToDiskArea(shooter.__texelWorldSize));

                if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 3) {
                    duration = Date.now() - subMeshDate;
                    console.log(`Shooting radiosity for ${this._patchedMeshes[j].name} took ${duration}ms.`);
                }
            }

            // return false;

            if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 2) {
                duration = Date.now() - patchShooting;
                console.log(`Total shooting radiosity for ${this._patchedMeshes.length} submeshes took ${duration}ms.`);
            }
        }
    }

    private consumeEnergyInTexture(shooter: Mesh) {
        var mrt = shooter.residualTexture as MultiRenderTarget;
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

    private nextShooter(trackShooters = false): Nullable<Mesh> {
        var engine = this._scene.getEngine();
        engine.enableEffect(this._radiosityEffectsManager.nextShooterEffect);
        engine.setState(false);
        engine.bindFramebuffer(<InternalTexture>(this._nextShooterTexture._texture));
        engine.clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);

        let vb: any = {};
        vb[VertexBuffer.PositionKind] = this._radiosityEffectsManager.screenQuadVB;
        engine.bindBuffers(vb, this._radiosityEffectsManager.screenQuadIB, this._radiosityEffectsManager.nextShooterEffect);

        if (trackShooters) {
            this._activeShooters.length = 0;
        }

        for (let i = 0; i < this._meshes.length; i++) {
            var mesh = this._meshes[i];
            var mrt: MultiRenderTarget = mesh.residualTexture;

            if (!mrt) {
                continue;
            }

            var unshotTexture: Texture = mrt.textures[3];
            var polygonId = mesh.__lightMapId; // TODO : prettify
            var lod = Math.round(Math.log(mrt.getRenderWidth()) / Math.log(2));
            this._radiosityEffectsManager.nextShooterEffect.setVector3("polygonId", polygonId);
            this._radiosityEffectsManager.nextShooterEffect.setTexture("unshotRadiositySampler", unshotTexture);
            this._radiosityEffectsManager.nextShooterEffect.setFloat("lod", lod);
            this._radiosityEffectsManager.nextShooterEffect.setFloat("area", mrt.getRenderWidth() * mrt.getRenderHeight()); // TODO : REAL POLYGON AREA

            engine.setDirectViewport(0, 0, 1, 1);
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);

            if (PatchRenderer.RADIOSITY_INFO_LOGS_LEVEL >= 2) {
                console.log(`Mesh ${mesh.name} has for Lod ${lod} and dimensions : ${mrt.getRenderWidth()} x ${mrt.getRenderWidth()}`);
                console.log("Current value of the nextShooter texture readback : ");
                console.log(engine.readPixelsFloat(0, 0, 1, 1));
            }

            if (trackShooters) {
                let invEnergy = engine.readPixelsFloat(0, 0, 1, 1)[3];
                if (invEnergy !== 1) {
                    this._activeShooters.push(this._meshes[i]);
                }
                engine.clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);
            }
        }
        // Read result directly after render
        var pixels = engine.readPixelsFloat(0, 0, 1, 1);
        let id = Math.round(RadiosityUtils.decodeId(Vector3.FromArray(pixels)) * 255);
        let shaderValue = (1 / (pixels[3] / 255) - 1) / 3;
        if (PatchRenderer.RADIOSITY_INFO_LOGS_LEVEL >= 1) {
            console.log("Next shooter ID : " + id);
            console.log("Residual energy gathered from shader : " + shaderValue);
        }

        engine.unBindFramebuffer(<InternalTexture>(this._nextShooterTexture._texture));

        return this._meshMap[id];
    }

    private dilate(padding: number = 1, origin: Texture, dest: Texture) {
        // TODO padding unused
        var engine = this._scene.getEngine();
        engine.enableEffect(this._radiosityEffectsManager.dilateEffect);
        engine.setState(false);
        let gl = engine._gl;
        let fb = this._frameBuffer1;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, (<InternalTexture>dest._texture)._webGLTexture, 0);

        engine.clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);
        let vb: any = {};
        vb[VertexBuffer.PositionKind] = this._radiosityEffectsManager.screenQuadVB;
        this._radiosityEffectsManager.dilateEffect.setTexture("inputTexture", origin);
        this._radiosityEffectsManager.dilateEffect.setFloat2("texelSize", 1 / dest.getSize().width, 1 / dest.getSize().height);
        engine.bindBuffers(vb, this._radiosityEffectsManager.screenQuadIB, this._radiosityEffectsManager.dilateEffect);

        engine.setDirectViewport(0, 0, dest.getSize().width, dest.getSize().height);
        engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    private buildPatchesForSubMesh(subMesh: SubMesh) {
        var mesh = subMesh.getRenderingMesh();

        if (this._patchedMeshes.indexOf(mesh) !== -1) {
            return;
        }
        var map = (<MultiRenderTarget>mesh.residualTexture);

        if (this._cachePatches && !mesh.radiosityPatches) {
            mesh.radiosityPatches = [];

            var size = map.getSize();
            var width = size.width;
            var height = size.height;
            var engine = this._scene.getEngine();

            var positions = <Float32Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[0], width, height);
            var normals = <Float32Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[1], width, height);
            var ids = <Uint8Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[2], width, height);
            var residualEnergy = <Uint8Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[3], width, height);

            for (let i = 0; i < positions.length; i += 4) {
                if (positions[i + 3] === 0) {
                    // add only rendered patches
                    continue;
                }
                mesh.radiosityPatches.push(new Patch(new Vector3(positions[i], positions[i + 1], positions[i + 2]),
                    new Vector3(normals[i], normals[i + 1], normals[i + 2]),
                    RadiosityUtils.decodeId(new Vector3(ids[i], ids[i + 1], ids[i + 2])),
                    new Vector3(residualEnergy[i] / 255., residualEnergy[i + 1] / 255., residualEnergy[i + 2] / 255.)));
            }
        }

        this._patchedMeshes.push(mesh);
        this._scene.customRenderTargets.splice(this._scene.customRenderTargets.indexOf(map), 1);
        this._patchMaps.splice(this._patchMaps.indexOf(map), 1);
        if (!this._patchMaps.length) {
            this._isBuildingPatches = false;
        }
    }

    private updatePatches(mesh: Mesh) {
        // Requires residualTexture to be filled
        var map = (<MultiRenderTarget>mesh.residualTexture);
        var size = map.getSize();
        var width = size.width;
        var height = size.height;
        var engine = this._scene.getEngine();
        var residualEnergy = <Float32Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[3], width, height);
        var positions, normals, ids;
        var patches: Patch[];

        if (!this._cachePatches) {
            positions = <Float32Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[0], width, height);
            normals = <Float32Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[1], width, height);
            ids = <Uint8Array>engine._readTexturePixels(<InternalTexture>map.internalTextures[2], width, height);
            patches = [];
        } else {
            patches = mesh.radiosityPatches;
        }

        var energyLeft = 0;
        var currentIndex = 0;

        if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
            console.log(`Updating ${residualEnergy.length / 4} patches...`);
        }

        for (let i = 0; i < residualEnergy.length; i += 4) {
            if (residualEnergy[i + 3] === 0) {
                // add only rendered patches
                continue;
            }

            if (this._cachePatches) {
                patches[currentIndex].residualEnergy.copyFromFloats(residualEnergy[i], residualEnergy[i + 1], residualEnergy[i + 2]);
            } else {
                patches.push(new Patch(new Vector3((<Float32Array>positions)[i], (<Float32Array>positions)[i + 1], (<Float32Array>positions)[i + 2]),
                    new Vector3((<Float32Array>normals)[i], (<Float32Array>normals)[i + 1], (<Float32Array>normals)[i + 2]),
                    RadiosityUtils.decodeId(new Vector3((<Float32Array>ids)[i], (<Float32Array>ids)[i + 1], (<Float32Array>ids)[i + 2])),
                    new Vector3(residualEnergy[i], residualEnergy[i + 1], residualEnergy[i + 2]))); // TODO : why not /255 ?
            }

            energyLeft += (residualEnergy[i] + residualEnergy[i + 1] + residualEnergy[i + 2]) / 3;
            currentIndex++;
        }

        if (PatchRenderer.RADIOSITY_INFO_LOGS_LEVEL >= 1) {
            console.log("Residual energy gathered from surface : " + (energyLeft * this.squareToDiskArea(mesh.__texelWorldSize)));
        }

        if (this._filterMinEnergy && ! this._cachePatches) {
            patches.sort((a: Patch, b: Patch) => b.getResidualEnergySum() - a.getResidualEnergySum());
        }

        return { patches, energyLeft };
    }

    private renderSubMesh = (subMesh: SubMesh, effect: Effect) => {
        let engine = this._scene.getEngine();
        let mesh = subMesh.getRenderingMesh();
        mesh._bind(subMesh, effect, Material.TriangleFillMode);

        var batch = mesh._getInstancesRenderList(subMesh._id);

        if (batch.mustReturn) {
            return;
        }

        // Draw triangles
        var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);
        mesh._processRendering(subMesh, effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
            (isInstance, world) => effect.setMatrix("world", world));
    };

    private buildVisibilityMapCube() {
        this._patchMap = new RenderTargetTexture("patch", this._patchMapResolution, this._scene, false, true, this.useDepthCompare ? Constants.TEXTURETYPE_FLOAT : Constants.TEXTURETYPE_UNSIGNED_INT, true, Texture.NEAREST_SAMPLINGMODE, true, false, false, Constants.TEXTUREFORMAT_RGBA, false);
        this._patchMap.renderParticles = false;
        this._patchMap.renderList = this._meshes;
        this._patchMap.activeCamera = null;
        this._patchMap.ignoreCameraViewport = true;
        this._patchMap.useCameraPostProcesses = false;
    }

    private _setCubeVisibilityUniforms(effect: Effect, patch: Patch, mesh: Mesh, view: Matrix, projection: Matrix) {
        if (this.useHemicube) {
            effect.setMatrix("view", view);
            effect.setMatrix("projection", projection);
        } else {
            effect.setMatrix("view", patch.viewMatrix);
        }
        effect.setFloat2("nearFar", this._near, this._far);
        effect.setTexture("itemBuffer", mesh.residualTexture.textures[2]);
    }

    private renderVisibilityMapCube() {
        let scene = this._scene;
        let engine = this._scene.getEngine();

        let gl = engine._gl;
        let internalTexture = <InternalTexture>this._patchMap._texture;

        gl.bindFramebuffer(gl.FRAMEBUFFER, internalTexture._framebuffer);
        engine.setState(false, 0, true, scene.useRightHandedSystem); // TODO : BFC

        let viewMatrices = [this._currentPatch.viewMatrix,
        this._currentPatch.viewMatrixPX,
        this._currentPatch.viewMatrixNX,
        this._currentPatch.viewMatrixPY,
        this._currentPatch.viewMatrixNY
        ];

        let projectionMatrices = [Patch.projectionMatrix,
        Patch.projectionMatrixPX,
        Patch.projectionMatrixNX,
        Patch.projectionMatrixPY,
        Patch.projectionMatrixNY
        ];

        let viewportMultipliers = [
            [1, 1],
            [0.5, 1],
            [0.5, 1],
            [1, 0.5],
            [1, 0.5],
        ];
        let viewportOffsets = [
            [0, 0],
            [0, 0],
            [0.5, 0],
            [0, 0],
            [0, 0.5],
        ];
        let cubeSides = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        ];

        engine.enableEffect(this._radiosityEffectsManager.uV2Effect);

        for (let j = 0; j < 5; j++) {
            // Full cube viewport when rendering the front face
            engine.setDirectViewport(viewportOffsets[j][0] * this._patchMap.getRenderWidth(), viewportOffsets[j][1] * this._patchMap.getRenderHeight(), this._patchMap.getRenderWidth() * viewportMultipliers[j][0], this._patchMap.getRenderHeight() * viewportMultipliers[j][1]);
            // Render on each face of the hemicube
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, cubeSides[j], internalTexture._webGLTexture, 0);
            engine.clear(new Color4(0, 0, 0, 0), true, true);
            for (let i = 0; i < this._meshes.length; i++) {
                for (let k = 0; k < this._meshes[i].subMeshes.length; k++) {
                    this._setCubeVisibilityUniforms(this._radiosityEffectsManager.uV2Effect, this._currentPatch, this._meshes[i], viewMatrices[j], projectionMatrices[j]);
                    this.renderSubMesh(this._meshes[i].subMeshes[k], this._radiosityEffectsManager.uV2Effect);
                }
            }
            // Tools.DumpFramebuffer(this._patchMap.getRenderWidth(), this._patchMap.getRenderHeight(), this._scene.getEngine());
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    private setVisibilityUniforms(effect: Effect, patch: Patch, mesh: Mesh) {
        effect.setMatrix("view", patch.viewMatrix);
        effect.setFloat2("nearFar", this._near, this._far);
        effect.setTexture("itemBuffer", mesh.residualTexture.textures[2]);
    }

    private buildVisibilityMap() {
        this._patchMap = new RenderTargetTexture(
            "patch",
            512,
            this._scene,
            false,
            true,
            this.useDepthCompare ? Constants.TEXTURETYPE_FLOAT : Constants.TEXTURETYPE_UNSIGNED_INT,
            false,
            Texture.NEAREST_SAMPLINGMODE);
        this._patchMap.renderParticles = false;
        this._patchMap.renderList = this._meshes;
        this._patchMap.activeCamera = null;
        this._patchMap.ignoreCameraViewport = true;
        this._patchMap.useCameraPostProcesses = false;

        this._patchMap.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
            let index;
            let scene = this._scene;
            let engine = this._scene.getEngine();
            engine.setState(false, 0, true, scene.useRightHandedSystem); // TODO : BFC
            engine.setDirectViewport(0, 0, this.getCurrentRenderWidth(), this.getCurrentRenderHeight());
            engine.clear(new Color4(0, 0, 0, 0), true, true);

            this._currentRenderedMap = this._patchMap;

            for (index = 0; index < opaqueSubMeshes.length; index++) {
                this.setVisibilityUniforms(this._radiosityEffectsManager.uV2Effect, this._currentPatch, opaqueSubMeshes.data[index].getRenderingMesh());
                this.renderSubMesh(opaqueSubMeshes.data[index], this._radiosityEffectsManager.uV2Effect);
            }

            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                this.setVisibilityUniforms(this._radiosityEffectsManager.uV2Effect, this._currentPatch, opaqueSubMeshes.data[index].getRenderingMesh());
                this.renderSubMesh(alphaTestSubMeshes.data[index],this._radiosityEffectsManager.uV2Effect);
            }
        };

    }

    /**
     * Disposes of the patch renderer.
     */
    public dispose(): void {
        this._patchMap.dispose();
    }
}
