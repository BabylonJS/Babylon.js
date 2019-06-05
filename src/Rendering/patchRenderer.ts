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
import { Vector3 } from "../Maths/math"
import { Color4 } from "../Maths/math"
import { Matrix } from "../Maths/math"
import { Camera } from "../Cameras/camera"
import { RadiosityUtils } from "./radiosityUtils";
import { RadiosityEffectsManager } from "./radiosityEffectsManager";

import { Nullable } from "../types";
import { Tools } from "../misc/tools"
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
        // this.viewMatrix.invert();

        // this.viewProjectionMatrix = this.viewMatrix.multiply(Patch.projectionMatrix);
        // this.viewProjectionPX = viewMatrixPX.multiply(Patch.projectionMatrix).multiply(Patch.projectionMatrixPX);
        // this.viewProjectionNX = viewMatrixNX.multiply(Patch.projectionMatrix).multiply(Patch.projectionMatrixNX);
        // this.viewProjectionPY = viewMatrixPY.multiply(Patch.projectionMatrix).multiply(Patch.projectionMatrixPY);
        // this.viewProjectionNY = viewMatrixNY.multiply(Patch.projectionMatrix).multiply(Patch.projectionMatrixNY);
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

    public useDepthCompare: boolean = true;
    public useHemicube: boolean = true;
    private _cachePatches: boolean = false;
    private _patchMapResolution: number = 512;

    public static PERFORMANCE_LOGS_LEVEL: number = 1;
    public static RADIOSITY_INFO_LOGS_LEVEL: number = 1;
    public static WARNING_LOGS: number = 1;

    private _scene: Scene;
    // private _htScene: Scene; // Higher tesselated scene
    private _meshes: Mesh[];
    private _patchMap: RenderTargetTexture;

    private _near: number;
    private _far: number;
    private _texelSize: number;
    private _frameBuffer0: WebGLFramebuffer;
    private _frameBuffer1: WebGLFramebuffer;

    // private _patches: Patch[] = [];
    private _patchOffset: number = 0;
    private _patchedSubMeshes: SubMesh[] = [];
    private _currentPatch: Patch;
    private _currentRenderedMap: RenderTargetTexture;
    private _nextShooterTexture: RenderTargetTexture;
    private _patchMaps: RenderTargetTexture[] = [];

    private _submeshMap: { [key: number]: SubMesh } = {};
    private _isCurrentlyGathering: boolean = false;
    private _isBuildingPatches: boolean = false;

    private _radiosityEffectsManager: RadiosityEffectsManager;

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

        // this.createMaps();

        scene.getEngine().disableTextureBindingOptimization = true;
        this._frameBuffer0 = <WebGLFramebuffer>(scene.getEngine()._gl.createFramebuffer());
        this._frameBuffer1 = <WebGLFramebuffer>(scene.getEngine()._gl.createFramebuffer());

        // this.createHTScene();

        this._radiosityEffectsManager = new RadiosityEffectsManager(this._scene, this.useHemicube, this.useDepthCompare);
    }

    public createHTScene(areaThreshold: number) {
        var scene = this._scene;

        for (let i = scene.meshes.length - 1; i >= 0; i--) {
            RadiosityUtils.retesselateMesh(scene.meshes[i], areaThreshold, this._scene);
        }

        this._meshes = <Mesh[]>(scene.meshes);
    }

    private _renderRadiosity = (uniformCallback: (effect: Effect, ...args: any[]) => void,
        subMesh: SubMesh,
        ...args: any[]): boolean => {

        var mesh = subMesh.getRenderingMesh();
        var scene = this._scene;
        var engine = scene.getEngine();
        var batch = mesh._getInstancesRenderList(subMesh._id);

        // Culling and reverse (right handed system)
        engine.setState(false, 0, true, scene.useRightHandedSystem); // TODO : BFC
        engine.setDirectViewport(0, 0, this.getCurrentRenderWidth(), this.getCurrentRenderHeight())

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
    };

    public createMaps() {
        this._nextShooterTexture = new RenderTargetTexture("nextShooter", 1, this._scene, false, true, Constants.TEXTURETYPE_FLOAT);
        this._isBuildingPatches = true;
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
            // TODO : prettify these <any>)
            (<any>mesh).residualTexture = residualTexture;
            residualTexture.renderList = [mesh];
            residualTexture.refreshRate = 1;
            residualTexture.ignoreCameraViewport = true;
            (<any>residualTexture).patchOffset = this._patchOffset;
            meshes[i].subMeshes[0].surfaceId = this._patchOffset;
            this._submeshMap[this._patchOffset] = meshes[i].subMeshes[0];
            (<any>meshes[i]).__lightMapId = RadiosityUtils.encodeId(this._patchOffset).scaleInPlace(1 / 255);

            // TODO : merge functions ?
            var uniformCb = (effect: Effect, data: any[]): void => {
                var mesh = (<SubMesh>data[0]).getMesh();
                var width = (<any>mesh).__lightmapSize.width; // TODO : necessary only on individual patches mode
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
                    if (this._renderRadiosity(uniformCb, opaqueSubMeshes.data[index], opaqueSubMeshes.data[index])) {
                        this._scene.onAfterRenderObservable.add(this.buildPatchesForSubMesh.bind(this, opaqueSubMeshes.data[index]), -1, false, null, true);
                    }

                }

                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    this._currentRenderedMap = (<any>alphaTestSubMeshes.data[index].getMesh()).residualTexture;
                    if (this._renderRadiosity(uniformCb, alphaTestSubMeshes.data[index], alphaTestSubMeshes.data[index])) {
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

    public renderToRadiosityTexture(subMesh: SubMesh, patch: Patch) {
        var mesh = subMesh.getRenderingMesh();
        var area = this._texelSize * this._texelSize * Math.PI / 8; // TODO : check why /4 diverges
        var mrt: MultiRenderTarget = (<any>mesh).residualTexture;
        var destResidualTexture = mrt.textures[5]._texture as InternalTexture;
        var destGatheringTexture = mrt.textures[6]._texture as InternalTexture;
        var engine = this._scene.getEngine();
        engine.enableEffect(this._radiosityEffectsManager.shootEffect);

        this._radiosityEffectsManager.shootEffect.setTexture("itemBuffer", this._patchMap);
        this._radiosityEffectsManager.shootEffect.setTexture("worldPosBuffer", mrt.textures[0]);
        this._radiosityEffectsManager.shootEffect.setTexture("worldNormalBuffer", mrt.textures[1]);
        this._radiosityEffectsManager.shootEffect.setTexture("idBuffer", mrt.textures[2]);
        this._radiosityEffectsManager.shootEffect.setTexture("residualBuffer", mrt.textures[3]);
        this._radiosityEffectsManager.shootEffect.setTexture("gatheringBuffer", mrt.textures[4]);
        this._radiosityEffectsManager.shootEffect.setFloat2("nearFar", this._near, this._far);

        this._radiosityEffectsManager.shootEffect.setVector3("shootPos", patch.position);
        this._radiosityEffectsManager.shootEffect.setVector3("shootNormal", patch.normal);
        this._radiosityEffectsManager.shootEffect.setVector3("shootEnergy", patch.residualEnergy);
        this._radiosityEffectsManager.shootEffect.setFloat("shootDArea", area); // TODO
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
        var batch = mesh._getInstancesRenderList(subMesh._id);

        if (batch.mustReturn) {
            return;
        }

        var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);
        mesh._bind(subMesh, this._radiosityEffectsManager.shootEffect, Material.TriangleFillMode);
        mesh._processRendering(subMesh, this._radiosityEffectsManager.shootEffect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
            (isInstance, world) => this._radiosityEffectsManager.shootEffect.setMatrix("world", world));

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

    public gatherRadiosity(directOnly = false): boolean {
        if (this._isCurrentlyGathering) {
            if (PatchRenderer.WARNING_LOGS) {
                console.log("Still gathering radiosity for current submesh. Skipping.");
            }
            return true;
        }

        if (!this._radiosityEffectsManager.isReady() || this._isBuildingPatches) {
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

        var { patches, energyLeft } = this.updatePatches(shooter);

        if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
            duration = Date.now() - updatePatchDate;
            console.log(`Updating patches for shooter took ${duration}ms.`);
        }

        if (energyLeft < 0.01) {
            return false;
        }

        this._isCurrentlyGathering = true;

        let consumeEnergyDate = Date.now();

        this.consumeEnergyInTexture(shooter);

        if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
            duration = Date.now() - consumeEnergyDate;
            console.log(`Consuming energy for shooter took ${duration}ms.`);
            console.log(`Now shooting radiosity for ${patches.length} patches.`)
        }

        let shootingDate = Date.now();

        for (let i = 0; i < patches.length; i++) {
            this._currentPatch = patches[i];

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
            for (let j = 0; j < this._patchedSubMeshes.length; j++) {
                if (this._patchedSubMeshes[j] === shooter) {
                    continue;
                }

                let subMeshDate = Date.now();
                this.renderToRadiosityTexture(this._patchedSubMeshes[j], patches[i]);

                if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 3) {
                    duration = Date.now() - subMeshDate;
                    console.log(`Shooting radiosity for ${this._patchedSubMeshes[j].getMesh().name} took ${duration}ms.`);
                }
            }

            // return false;

            if (PatchRenderer.PERFORMANCE_LOGS_LEVEL >= 2) {
                duration = Date.now() - patchShooting;
                console.log(`Total shooting radiosity for ${this._patchedSubMeshes.length} submeshes took ${duration}ms.`);
            }
        }

        if (directOnly) {
            // TODO : this is wrong, only takes 1 shooter mesh into account
            // find and merge code from desktop, where passes are separated
            return false;
        }

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
        // TODO : turn into postprocess
        var engine = this._scene.getEngine();
        engine.enableEffect(this._radiosityEffectsManager.nextShooterEffect);
        engine.setState(false);
        engine.bindFramebuffer(<InternalTexture>(this._nextShooterTexture._texture));
        engine.clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);

        let vb: any = {};
        vb[VertexBuffer.PositionKind] = this._radiosityEffectsManager.screenQuadVB;
        engine.bindBuffers(vb, this._radiosityEffectsManager.screenQuadIB, this._radiosityEffectsManager.nextShooterEffect);

        for (let i = 0; i < this._meshes.length; i++) {
            var mesh = this._meshes[i];
            var mrt: MultiRenderTarget = (<any>mesh).residualTexture;

            if (!mrt) {
                continue;
            }

            var unshotTexture: Texture = mrt.textures[3];
            var polygonId = (<any>mesh).__lightMapId; // TODO : prettify
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

        return this._submeshMap[id];
    }

    public dilate(padding: number = 1, origin: Texture, dest: Texture) {
        // TODO : turn into postprocess
        var engine = this._scene.getEngine();
        engine.enableEffect(this._radiosityEffectsManager.dilateEffect);
        engine.setState(false);
        let gl = engine._gl;
        let fb = this._frameBuffer1;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
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

    public buildPatchesForSubMesh(subMesh: SubMesh) {
        if (this._patchedSubMeshes.indexOf(subMesh) !== -1) {
            return;
        }

        var mesh = subMesh.getMesh();
        var map = (<MultiRenderTarget>(<any>mesh).residualTexture);

        if (this._cachePatches) {
            subMesh.radiosityPatches = [];

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
                subMesh.radiosityPatches.push(new Patch(new Vector3(positions[i], positions[i + 1], positions[i + 2]),
                    new Vector3(normals[i], normals[i + 1], normals[i + 2]),
                    RadiosityUtils.decodeId(new Vector3(ids[i], ids[i + 1], ids[i + 2])),
                    new Vector3(residualEnergy[i] / 255., residualEnergy[i + 1] / 255., residualEnergy[i + 2] / 255.)));
            }
        }

        this._patchedSubMeshes.push(subMesh);
        this._scene.customRenderTargets.splice(this._scene.customRenderTargets.indexOf(map), 1);
        this._patchMaps.splice(this._patchMaps.indexOf(map), 1);
        if (!this._patchMaps.length) {
            this._isBuildingPatches = false;
        }
    }

    public updatePatches(subMesh: SubMesh) {
        // Requires residualTexture to be filled
        var mesh = subMesh.getMesh();
        var map = (<MultiRenderTarget>(<any>mesh).residualTexture);
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
            patches = subMesh.radiosityPatches;
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
            console.log("Residual energy gathered from surface : " + energyLeft);
        }

        return { patches, energyLeft };
    }

    public buildVisibilityMapCube() {
        this._patchMap = new RenderTargetTexture("patch", this._patchMapResolution, this._scene, false, true, this.useDepthCompare ? Constants.TEXTURETYPE_FLOAT : Constants.TEXTURETYPE_UNSIGNED_INT, true, Texture.NEAREST_SAMPLINGMODE, true, false, false, Constants.TEXTUREFORMAT_RGBA, false)
        this._patchMap.renderParticles = false;
        this._patchMap.renderList = this._meshes;
        this._patchMap.activeCamera = null;
        this._patchMap.ignoreCameraViewport = true;
        this._patchMap.useCameraPostProcesses = false;
    }

    public renderVisibilityMapCube() {
        let scene = this._scene;
        let engine = this._scene.getEngine();

        var uniformCb = (effect: Effect, data: any[]) => {
            var patch = data[0] as Patch;
            var mesh = data[1].getMesh();

            if (this.useHemicube) {
                effect.setMatrix("view", data[2]);
                effect.setMatrix("projection", data[3]);
            } else {
                effect.setMatrix("view", patch.viewMatrix);
            }
            effect.setFloat2("nearFar", this._near, this._far);
            effect.setTexture("itemBuffer", mesh.residualTexture.textures[2]);

        };

        var renderWithDepth = (subMesh: SubMesh, patch: Patch, view: Matrix, projection: Matrix) => {
            engine.enableEffect(this._radiosityEffectsManager.uV2Effect);

            let mesh = subMesh.getRenderingMesh();
            mesh._bind(subMesh, this._radiosityEffectsManager.uV2Effect, Material.TriangleFillMode);
            uniformCb(this._radiosityEffectsManager.uV2Effect, [this._currentPatch, subMesh, view, projection]);

            var batch = mesh._getInstancesRenderList(subMesh._id);

            if (batch.mustReturn) {
                return;
            }

            // Draw triangles
            var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);
            mesh._processRendering(subMesh, this._radiosityEffectsManager.uV2Effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                (isInstance, world) => this._radiosityEffectsManager.uV2Effect.setMatrix("world", world));
        }



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
        for (let j = 0; j < 5; j++) {
            // Full cube viewport when rendering the front face
            engine.setDirectViewport(viewportOffsets[j][0] * this._patchMap.getRenderWidth(), viewportOffsets[j][1] * this._patchMap.getRenderHeight(), this._patchMap.getRenderWidth() * viewportMultipliers[j][0], this._patchMap.getRenderHeight() * viewportMultipliers[j][1]);
            // Render on each face of the hemicube
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, cubeSides[j], internalTexture._webGLTexture, 0);
            engine.clear(new Color4(0, 0, 0, 0), true, true);
            for (let i = 0; i < this._meshes.length; i++) {
                // TODO : mesh ? submesh ?
                renderWithDepth(this._meshes[i].subMeshes[0], this._currentPatch, viewMatrices[j], projectionMatrices[j]);
            }
            // console.log(engine.readPixelsFloat(0, 0, this._currentRenderedMap.getRenderWidth(), this._currentRenderedMap.getRenderHeight()));
            // Tools.DumpFramebuffer(this._patchMap.getRenderWidth(), this._patchMap.getRenderHeight(), this._scene.getEngine());
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    }

    public buildVisibilityMap() {
        this._patchMap = new RenderTargetTexture("patch", 512, this._scene, false, true,
            this.useDepthCompare ? Constants.TEXTURETYPE_FLOAT : Constants.TEXTURETYPE_UNSIGNED_INT, false, Texture.NEAREST_SAMPLINGMODE);
        this._patchMap.renderParticles = false;
        this._patchMap.renderList = this._meshes;
        this._patchMap.activeCamera = null;
        this._patchMap.ignoreCameraViewport = true;
        this._patchMap.useCameraPostProcesses = false;

        let scene = this._scene;
        let engine = this._scene.getEngine();

        var uniformCb = (effect: Effect, data: any[]) => {
            var patch = data[0];
            var mesh = data[1].getMesh();

            effect.setMatrix("view", patch.viewMatrix);
            effect.setFloat2("nearFar", this._near, this._far);
            effect.setTexture("itemBuffer", mesh.residualTexture.textures[2]);
        };

        var renderWithDepth = (subMesh: SubMesh, patch: Patch) => {
            engine.setState(false, 0, true, scene.useRightHandedSystem); // TODO : BFC
            engine.setDirectViewport(0, 0, this.getCurrentRenderWidth(), this.getCurrentRenderHeight())
            engine.enableEffect(this._radiosityEffectsManager.uV2Effect);

            let mesh = subMesh.getRenderingMesh();
            mesh._bind(subMesh, this._radiosityEffectsManager.uV2Effect, Material.TriangleFillMode);
            uniformCb(this._radiosityEffectsManager.uV2Effect, [this._currentPatch, subMesh]);

            var batch = mesh._getInstancesRenderList(subMesh._id);

            if (batch.mustReturn) {
                return;
            }

            // Draw triangles
            var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);
            mesh._processRendering(subMesh, this._radiosityEffectsManager.uV2Effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                (isInstance, world) => this._radiosityEffectsManager.uV2Effect.setMatrix("world", world));
        }

        this._patchMap.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
            var index;
            this._currentRenderedMap = this._patchMap;
            this._scene.getEngine().clear(new Color4(0, 0, 0, 0), true, true);

            for (index = 0; index < opaqueSubMeshes.length; index++) {
                renderWithDepth(opaqueSubMeshes.data[index], this._currentPatch);
            }

            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                renderWithDepth(alphaTestSubMeshes.data[index], this._currentPatch);
            }

            // console.log(engine.readPixelsFloat(0, 0, this._currentRenderedMap.getRenderWidth(), this._currentRenderedMap.getRenderHeight()));
            // Tools.DumpFramebuffer(this._currentRenderedMap.getRenderWidth(), this._currentRenderedMap.getRenderHeight(), this._scene.getEngine());
        };

    }

    /**
     * Disposes of the depth renderer.
     */
    public dispose(): void {
        this._patchMap.dispose();
    }
}
