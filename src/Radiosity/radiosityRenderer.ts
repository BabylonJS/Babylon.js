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
import { Color4, Color3 } from "../Maths/math";
import { Matrix } from "../Maths/math";
import { Camera } from "../Cameras/camera";
import { RadiosityUtils } from "./radiosityUtils";
import { RadiosityEffectsManager } from "./radiosityEffectsManager";

import { Nullable } from "../types";
// import { Tools } from "../misc/tools";

/**
 * Patch, infinitesimal unit when discretizing surfaces
 */
class Patch {
    /**
     * Creates a patch from surface data
     * @param p World position
     * @param n World normal
     * @param id Surface id
     * @param residualEnergy Unshot radiosity energy within this patch
     */
    constructor(p: Vector3, n: Vector3, id: number, residualEnergy: Vector3) {
        // World space
        this.position = p.clone();
        this.normal = n.clone().normalize();
        this.id = id;
        this.residualEnergy = residualEnergy;

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

    /**
     * Gets the sum of residual energy 3 color channels
     * @returns Total energy r+g+b
     */
    public getResidualEnergySum() : number {
        return this.residualEnergy.x + this.residualEnergy.y + this.residualEnergy.z;
    }

    /**
     * Prints the patch
     * @returns Position, normal and id as a string
     */
    public toString() {
        return `Position: ${this.position.x} ${this.position.y} ${this.position.z}\n` +
            `Normal: ${this.normal.x} ${this.normal.y} ${this.normal.z}\n` +
            `Id: ${this.id}\n`;
    }

    /**
     * Parent surface id
     */
    public id: number;
    /**
     * World position
     */
    public position: Vector3;
    /**
     * World normal
     */
    public normal: Vector3;
    /**
     * View matrix for a camera on this patch, directed by `this.normal`
     */
    public viewMatrix: Matrix;
    /**
     * View matrix for a camera on this patch, facing the local positive X axis
     */
    public viewMatrixPX: Matrix;
    /**
     * View matrix for a camera on this patch, facing the local negative X axis
     */
    public viewMatrixNX: Matrix;
    /**
     * View matrix for a camera on this patch, facing the local positive Y axis
     */
    public viewMatrixPY: Matrix;
    /**
     * View matrix for a camera on this patch, facing the local negative Y axis
     */
    public viewMatrixNY: Matrix;
    /**
     * Unshot radiosity energy
     */
    public residualEnergy: Vector3;

    /**
     * Field of view of the patch. Must be Math.PI / 2
     */
    public static readonly Fov: number = Math.PI / 2;
    /**
     * Projection matrix for a camera on a patch
     */
    public static ProjectionMatrix: Matrix;
    /**
     * Projection matrix for a camera on a patch, facing the local positive X axis.
     */
    public static ProjectionMatrixPX: Matrix;
    /**
     * Projection matrix for a camera on a patch, facing the local negative X axis.
     */
    public static ProjectionMatrixNX: Matrix;
    /**
     * Projection matrix for a camera on a patch, facing the local positive Y axis.
     */
    public static ProjectionMatrixPY: Matrix;
    /**
     * Projection matrix for a camera on a patch, facing the local negative X axis.
     */
    public static ProjectionMatrixNY: Matrix;
}

declare module "../meshes/mesh" {
    export interface Mesh {
        /** Object containing radiosity information for this mesh */
        radiosityInfo: {
            /** Size of the lightmap texture */
            lightmapSize: {
                width: number,
                height: number
            };
            /** How much world units a texel represents */
            texelWorldSize: number;
            /** Encoded id of the surface as a color. Internal */
            _lightMapId: Vector3;
            /** Internal */
            _patchOffset: number;
            /** Emissive color of the surface */
            color: Vector3; // TODO color 3
            /** Unused for now. Color multiplier. */
            lightStrength: Vector3; // TODO unused
            /** Multi render target containing all textures used for radiosity calculations */
            residualTexture: Nullable<MultiRenderTarget>;
            /** Radiosity patches */
            radiosityPatches: Patch[];
        };

        /** Inits the `radiosityInfo` object */
        initForRadiosity() : void;
        /** Gets radiosity texture
         * @return the radiosity texture. Can be fully black if the radiosity process has not been run yet.
         */
        getRadiosityTexture(): Nullable<Texture>;
    }
}

Mesh.prototype.initForRadiosity = function() {
    this.radiosityInfo = {
        lightmapSize: {
            width: 256,
            height: 256
        },
        texelWorldSize: 1,
        color: new Vector3(0, 0, 0),
        lightStrength: new Vector3(0, 0, 0),
        _lightMapId: new Vector3(0, 0, 0),
        _patchOffset: 0,
        residualTexture: null,
        radiosityPatches: []
    };
};

Mesh.prototype.getRadiosityTexture = function() {
    return this.radiosityInfo && this.radiosityInfo.residualTexture ? this.radiosityInfo.residualTexture.textures[4] : null;
};

declare interface RadiosityRendererOptions {
    near?: number,
    far?: number,
    bias?: number,
    normalBias?: number,
}

/**
 * Radiosity Renderer
 * Creates patches from uv-mapped (lightmapped) geometry.
 * Renders hemicubes or spheres from patches
 * Shoots light from emissive patches
 * Can be used as direct light baking, or radiosity light baking solution
 */
export class RadiosityRenderer {
    /**
     * Meshes involved in the radiosity solution process. Scene meshes that are not in this list will be ignored,
     * and therefore will not occlude or receive radiance.
     */
    public meshes: Mesh[];
    private _cachePatches: boolean = false;
    private _filterMinEnergy: number = 1e-5;
    private _patchMapResolution: number = 1024;

    private _options: RadiosityRendererOptions;
    /**
     * Verbosity level for performance of the renderer
     * Accepted values are 0, 1, 2 or 3
     */
    public static PERFORMANCE_LOGS_LEVEL: number = 1;
    /**
     * Verbosity level for information about current radiosity solving
     * Accepted values are 0, 1 or 2
     */
    public static RADIOSITY_INFO_LOGS_LEVEL: number = 1;
    /**
     * Verbosity level for warnings
     * Accepted values are 0 or 1
     */
    public static WARNING_LOGS: number = 1;

    private static DIRECT_PASS = 0;
    private static INDIRECT_PASS = 1;

    private _activeShooters: Mesh[] = [];
    private _scene: Scene;
    private _patchMap: RenderTargetTexture;

    private _near: number;
    private _far: number;
    private _bias: number;
    private _normalBias: number;
    private _frameBuffer0: WebGLFramebuffer;
    private _frameBuffer1: WebGLFramebuffer;

    private _patchOffset: number = 0;
    private _patchedMeshes: Mesh[] = [];
    private _currentPatch: Patch;
    private _currentRenderedMap: RenderTargetTexture;
    private _nextShooterTexture: RenderTargetTexture;
    private _patchMapsUnbuilt: RenderTargetTexture[] = [];
    private _patchMaps: MultiRenderTarget[] = [];

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

    private getCurrentRenderWidth(): number {
        return this._currentRenderedMap.getRenderWidth();
    }

    private getCurrentRenderHeight(): number {
        return this._currentRenderedMap.getRenderHeight();
    }

    private squareToDiskArea(a: number) {
        return a * a * Math.PI / 4;
    }


    /**
     * Instanciates a radiosity renderer
     * @param scene The current scene
     * @param meshes The meshes to include in the radiosity solver
     */
    constructor(scene: Scene, meshes?: Mesh[], options?: RadiosityRendererOptions) {
        this._options = options || {};
        this._scene = scene;
        this._near = this._options.near || 0.1;
        this._far = this._options.far || 10000;
        this._bias = this._options.bias || 1e-4;
        this._normalBias = this._options.normalBias || 1e-4;
        this.meshes = meshes || [];

        this.resetRenderState();

        Patch.ProjectionMatrix = Matrix.PerspectiveFovLH(Patch.Fov,
            1, // squared texture
            this._near,
            this._far,
        );

        Patch.ProjectionMatrixPX = Patch.ProjectionMatrix.multiply(Matrix.FromValues(2, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            1, 0, 0, 1
        ));

        Patch.ProjectionMatrixNX = Patch.ProjectionMatrix.multiply(Matrix.FromValues(2, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -1, 0, 0, 1
        ));

        Patch.ProjectionMatrixPY = Patch.ProjectionMatrix.multiply(Matrix.FromValues(1, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 1, 0,
            0, 1, 0, 1
        ));

        Patch.ProjectionMatrixNY = Patch.ProjectionMatrix.multiply(Matrix.FromValues(1, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 1, 0,
            0, -1, 0, 1
        ));

        this._frameBuffer0 = <WebGLFramebuffer>(scene.getEngine()._gl.createFramebuffer());
        this._frameBuffer1 = <WebGLFramebuffer>(scene.getEngine()._gl.createFramebuffer());

        this._radiosityEffectsManager = new RadiosityEffectsManager(this._scene);
    }

    private resetRenderState(): void {
        this._renderState = {
            nextPass: RadiosityRenderer.DIRECT_PASS,
            shooterPatches: null,
            shooterIndex: 0,
            shooterMeshes: [],
            overTime: 0
        };
    }

    /**
     * Retesselates the meshes, so no triangle is above `areaThreshold`
     * Useful for hemispherical visibilty rendering
     * Meshes are replaced in `this.meshes` list
     * @param areaThreshold Maximum area of a triangle in the resulting scene
     */
    public createHTScene(areaThreshold: number) {
        let htMeshes = [];

        for (let i = this.meshes.length - 1; i >= 0; i--) {
            htMeshes.push(RadiosityUtils.RetesselateMesh(this.meshes[i], areaThreshold, this._scene));
        }
        this.meshes = <Mesh[]>htMeshes;
    }

    private renderPatchInfo = (uniformCallback: (effect: Effect, ...args: any[]) => void,
        subMesh: SubMesh,
        ...args: any[]): boolean => {

        var mesh = subMesh.getRenderingMesh();
        var scene = this._scene;
        var engine = scene.getEngine();
        var batch = mesh._getInstancesRenderList(subMesh._id);

        engine.setState(false);
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
        mesh._processRendering(mesh, subMesh, effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
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

    /**
     * Prepare textures for radiosity
     */
    public createMaps() {
        this._nextShooterTexture = new RenderTargetTexture("nextShooter", 1, this._scene, false, true, Constants.TEXTURETYPE_FLOAT);
        var meshes = this.meshes;
        this._isBuildingPatches = true;

        for (let i = 0; i < meshes.length; i++) {
            var mesh = meshes[i];
            var size = mesh.radiosityInfo.lightmapSize;

            if (!size) {
                continue;
            }

            var residualTexture = new MultiRenderTarget("patch",
                size,
                7,
                this._scene,
                {
                    samplingModes: [Texture.NEAREST_NEAREST, Texture.NEAREST_NEAREST, Texture.NEAREST_NEAREST, Texture.LINEAR_LINEAR, Texture.LINEAR_LINEAR, Texture.LINEAR_LINEAR, Texture.LINEAR_LINEAR],
                    types: [Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_UNSIGNED_INT, Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_FLOAT],
                    generateMipMaps: false
                }
            );

            mesh.radiosityInfo.residualTexture = residualTexture;
            mesh.radiosityInfo._patchOffset = this._patchOffset;
            residualTexture.renderList = [mesh];
            residualTexture.refreshRate = 1;
            residualTexture.ignoreCameraViewport = true;

            this._meshMap[this._patchOffset] = meshes[i];
            mesh.radiosityInfo._lightMapId = RadiosityUtils.EncodeId(this._patchOffset).scaleInPlace(1 / 255);

            var uniformCb = (effect: Effect, data: any[]): void => {
                var mesh = (<SubMesh>data[0]).getRenderingMesh();
                var width = mesh.radiosityInfo.lightmapSize.width;

                effect.setFloat("texSize", width);
                effect.setFloat("patchOffset", mesh.radiosityInfo._patchOffset);

                if (mesh.radiosityInfo.color) {
                    effect.setVector3("color", mesh.radiosityInfo.color);
                } else {
                    effect.setVector3("color", new Vector3(0, 0, 0));
                }
                if (mesh.radiosityInfo.lightStrength) {
                    effect.setVector3("lightStrength", mesh.radiosityInfo.lightStrength);
                } else {
                    effect.setFloat("lightStrength", 0.0);
                }
            };

            residualTexture.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
                var index;
                this._scene.getEngine().clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);

                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    this._currentRenderedMap = opaqueSubMeshes.data[index].getRenderingMesh().radiosityInfo.residualTexture as MultiRenderTarget;
                    if (this.renderPatchInfo(uniformCb, opaqueSubMeshes.data[index], opaqueSubMeshes.data[index])) {
                        this._scene.onAfterRenderObservable.add(this.buildPatchesForSubMesh.bind(this, opaqueSubMeshes.data[index]), -1, false, null, true);
                    }

                }

                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    this._currentRenderedMap = alphaTestSubMeshes.data[index].getRenderingMesh().radiosityInfo.residualTexture as MultiRenderTarget;
                    if (this.renderPatchInfo(uniformCb, alphaTestSubMeshes.data[index], alphaTestSubMeshes.data[index])) {
                        this._scene.onAfterRenderObservable.add(this.buildPatchesForSubMesh.bind(this, alphaTestSubMeshes.data[index]), -1, false, null, true);
                    }
                }

                for (index = 0; index < transparentSubMeshes.length; index++) {
                    this._currentRenderedMap = transparentSubMeshes.data[index].getRenderingMesh().radiosityInfo.residualTexture as MultiRenderTarget;
                    if (this.renderPatchInfo(uniformCb, transparentSubMeshes.data[index], transparentSubMeshes.data[index])) {
                        this._scene.onAfterRenderObservable.add(this.buildPatchesForSubMesh.bind(this, transparentSubMeshes.data[index]), -1, false, null, true);
                    }
                }

            };

            this._scene.customRenderTargets.push(residualTexture);
            this._patchMapsUnbuilt.push(residualTexture);

            if (RadiosityRenderer.RADIOSITY_INFO_LOGS_LEVEL >= 2) {
                console.log(`Offset ${this._patchOffset} is for mesh : ${mesh.name}.`);
            }
            this._patchOffset += 1;

        }

        this.buildVisibilityMapCube();

    }

    private renderToRadiosityTexture(mesh: Mesh, patch: Patch, patchArea: number, doNotWriteToGathering = false) {
        var deltaArea = patchArea;
        var mrt: MultiRenderTarget = mesh.radiosityInfo.residualTexture as MultiRenderTarget;
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
        this._radiosityEffectsManager.shootEffect.setFloat("normalBias", this._normalBias);
        this._radiosityEffectsManager.shootEffect.setMatrix("view", patch.viewMatrix);

        if (RadiosityRenderer.PERFORMANCE_LOGS_LEVEL >= 3) {
            console.log(`Lightmap size for this submesh : ${mrt.getSize().width} x ${mrt.getSize().height}`);
        }

        engine.setDirectViewport(0, 0, destResidualTexture.width, destResidualTexture.height);
        engine.setState(false);
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
            mesh._processRendering(mesh, subMesh, this._radiosityEffectsManager.shootEffect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                (isInstance, world) => this._radiosityEffectsManager.shootEffect.setMatrix("world", world));
        }

        // Twice, for mipmaps
        engine.unBindFramebuffer(destResidualTexture);
        engine.unBindFramebuffer(destGatheringTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Dilates to origin, swapping buffers in the process
        this.dilate(1, mrt.textures[6], mrt.textures[4]);

        // Swap buffers that should not be dilated
        this.swap(mrt.textures, 3, 5);
        this.swap(mrt.internalTextures, 3, 5);
    }

    private swap<T>(textureArray: T[], i: number, j: number) {
        var t = textureArray[i];
        textureArray[i] = textureArray[j];
        textureArray[j] = t;
    }

    private cleanAfterRender(dateBegin = 0, duration = 0) {
        var engine = this._scene.getEngine();
        engine.restoreDefaultFramebuffer();
        engine.setViewport((<Camera>this._scene.activeCamera).viewport);

        if (dateBegin) {
            this._renderState.overTime -= duration - (Date.now() - dateBegin);
        }
    }

    /**
     * Gathers radiance for a limited duration
     * @param duration duration
     * @param energyLeftThreshold radiance threshold for stopping the process
     * @returns true if there is still remaining radiance to shoot
     */
    public gatherFor(duration: number, energyLeftThreshold = 1): boolean {
        let dateBegin = Date.now();

        if (!this._renderState.shooterPatches || !this._renderState.shooterPatches.length) {
            if (!this._renderState.shooterMeshes.length) {
                if (this._renderState.nextPass === RadiosityRenderer.DIRECT_PASS) {
                    this.nextShooter(true);
                    this._renderState.shooterMeshes = this._activeShooters.slice();
                    this._renderState.nextPass = RadiosityRenderer.INDIRECT_PASS;
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
            // return false;
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

    private postProcessLightmap(texture: MultiRenderTarget) {
        var textureArray = texture.textures;
        // var internalTextureArray = texture.internalTextures;

        this.toneMap(textureArray[4], textureArray[6]);
        this.swap(textureArray, 4, 6);
    }

    /**
     * Bakes only direct light on lightmaps
     * @returns true if energy has been shot. (false meaning that there was no emitter)
     */
    public gatherDirectLightOnly(): boolean {
        if (!this.isReady()) {
            if (RadiosityRenderer.WARNING_LOGS) {
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

            let patches = this.getNextPatches(shooter, 0);

            if (patches) {
                this.renderPatches(patches, shooter);
                hasShot = true;
            }
        }

        for (let i = 0; i < this._patchMaps.length; i++) {
            this.postProcessLightmap(this._patchMaps[i]);
        }

        this.cleanAfterRender();
        return hasShot;
    }

    /**
     * Gathers radiance the next "most bright" mesh
     * @param energyLeftThreshold radiance threshold for stopping the process
     * @returns true if there is still remaining radiance to shoot
     */
    public gatherRadiosity(energyLeftThreshold = 1): boolean {
        if (!this.isReady()) {
            if (RadiosityRenderer.WARNING_LOGS) {
                console.log("Not ready yet");
            }
            return true;
        }

        let duration;
        let dateBegin = Date.now();
        let nextShooterDate = Date.now();

        if (RadiosityRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
            console.log(`BEGINNING RADIOSITY PASS FOR ${this.meshes.length} MESHES...`);
        }

        var shooter = this.nextShooter();

        if (!shooter) {
            if (RadiosityRenderer.WARNING_LOGS) {
                console.log("No shooter");
            }
            return true;
        }

        if (RadiosityRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
            duration = Date.now() - nextShooterDate;
            console.log(`Find next shooter took ${duration}ms.`);
        }

        let updatePatchDate = Date.now();

        let patches = this.getNextPatches(shooter, energyLeftThreshold);

        if (!patches) {
            return false;
        }

        if (RadiosityRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
            duration = Date.now() - updatePatchDate;
            console.log(`Updating patches and consuming energy for shooter took ${duration}ms.`);
            console.log(`Now shooting radiosity for ${patches.length} patches.`);
        }

        let shootingDate = Date.now();

        this.renderPatches(patches, shooter);

        if (RadiosityRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
            duration = Date.now() - shootingDate;
            console.log(`Shooting radiosity for all patches took ${duration}ms.`);
            console.log(`Currently shooting ${patches.length * 1000 / duration} patches/s.`);
            console.log("\n========================");
            console.log("ENDING RADIOSITY PASS");
            console.log("========================");
            duration = Date.now() - dateBegin;
            console.log(`Total pass took : ${duration / 1000}s.`);
        }

        this.cleanAfterRender();
        return true;
    }

    /**
     * Checks if the renderer is ready
     * @returns True if the renderer is ready
     */
    public isReady() {
        return (this._radiosityEffectsManager.isReady() && !this._isBuildingPatches);
    }

    private renderPatches(patches: Patch[], shooter: Mesh, indexBegin = 0, indexEnd = patches.length) {
        let duration;

        for (let i = indexBegin; i < indexEnd; i++) {
            this._currentPatch = patches[i];

            if (this._filterMinEnergy && !this._cachePatches && this._currentPatch.getResidualEnergySum() * shooter.radiosityInfo.texelWorldSize * shooter.radiosityInfo.texelWorldSize < this._filterMinEnergy) {
                if (RadiosityRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
                    this._renderState.shooterIndex = patches.length;
                    console.log(`Ended pass early after treating ${i} shooters amongst ${patches.length} shooters.`);
                    return;
                }
            }

            let patchMapDate = Date.now();

            this.renderVisibilityMapCube();

            if (RadiosityRenderer.PERFORMANCE_LOGS_LEVEL >= 2) {
                duration = Date.now() - patchMapDate;
                console.log(`Rendering patch map for 1 patch took ${duration}ms.`);
            }

            // this._scene.customRenderTargets.push(this._patchMap);
            // return false;

            let patchShooting = Date.now();
            for (let j = 0; j < this._patchedMeshes.length; j++) {

                let subMeshDate = Date.now();
                this.renderToRadiosityTexture(this._patchedMeshes[j], patches[i], this.squareToDiskArea(shooter.radiosityInfo.texelWorldSize));

                if (RadiosityRenderer.PERFORMANCE_LOGS_LEVEL >= 3) {
                    duration = Date.now() - subMeshDate;
                    console.log(`Shooting radiosity for ${this._patchedMeshes[j].name} took ${duration}ms.`);
                }
            }

            // return false;

            if (RadiosityRenderer.PERFORMANCE_LOGS_LEVEL >= 2) {
                duration = Date.now() - patchShooting;
                console.log(`Total shooting radiosity for ${this._patchedMeshes.length} submeshes took ${duration}ms.`);
            }
        }
    }

    private consumeEnergyInTexture(shooter: Mesh) {
        var mrt = shooter.radiosityInfo.residualTexture as MultiRenderTarget;
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
        engine._bindTextureDirectly(gl.TEXTURE_2D, residualEnergyTexture._texture!);
        gl.texSubImage2D(
            gl.TEXTURE_2D, 0, 0, 0, mrt.getRenderWidth(), mrt.getRenderHeight(), gl.RGBA,
            gl.FLOAT, buffer);
        gl.generateMipmap(gl.TEXTURE_2D);
        engine._bindTextureDirectly(gl.TEXTURE_2D, null);
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

        for (let i = 0; i < this.meshes.length; i++) {
            var mesh = this.meshes[i];
            var mrt: MultiRenderTarget = mesh.radiosityInfo.residualTexture as MultiRenderTarget;

            if (!mrt) {
                continue;
            }

            var unshotTexture: Texture = mrt.textures[3];
            var polygonId = mesh.radiosityInfo._lightMapId;
            var lod = Math.round(Math.log(mrt.getRenderWidth()) / Math.log(2));
            this._radiosityEffectsManager.nextShooterEffect.setVector3("polygonId", polygonId);
            this._radiosityEffectsManager.nextShooterEffect.setTexture("unshotRadiositySampler", unshotTexture);
            this._radiosityEffectsManager.nextShooterEffect.setFloat("lod", lod);
            this._radiosityEffectsManager.nextShooterEffect.setFloat("area", mrt.getRenderWidth() * mrt.getRenderHeight()); // TODO : REAL POLYGON AREA

            engine.setDirectViewport(0, 0, 1, 1);
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);

            if (RadiosityRenderer.RADIOSITY_INFO_LOGS_LEVEL >= 2) {
                console.log(`Mesh ${mesh.name} has for Lod ${lod} and dimensions : ${mrt.getRenderWidth()} x ${mrt.getRenderWidth()}`);
                console.log("Current value of the nextShooter texture readback : ");
                console.log(engine.readPixelsFloat(0, 0, 1, 1));
            }

            if (trackShooters) {
                let invEnergy = engine.readPixelsFloat(0, 0, 1, 1)[3];
                if (invEnergy !== 1) {
                    this._activeShooters.push(this.meshes[i]);
                }
                engine.clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);
            }
        }
        // Read result directly after render
        var pixels = engine.readPixelsFloat(0, 0, 1, 1);
        let id = Math.round(RadiosityUtils.DecodeId(Vector3.FromArray(pixels)) * 255);
        let shaderValue = (1 / (pixels[3] / 255) - 1) / 3;
        if (RadiosityRenderer.RADIOSITY_INFO_LOGS_LEVEL >= 1) {
            console.log("Next shooter ID : " + id);
            console.log("Residual energy gathered from shader : " + shaderValue);
        }

        engine.unBindFramebuffer(<InternalTexture>(this._nextShooterTexture._texture));

        return this._meshMap[id];
    }

    private dilate(padding: number = 1, origin: Texture, dest: Texture) {
        // TODO padding unused
        var engine = this._scene.getEngine();
        var effect = this._radiosityEffectsManager.dilateEffect;
        engine.enableEffect(effect);
        engine.setState(false);
        let gl = engine._gl;
        let fb = this._frameBuffer1;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, (<InternalTexture>dest._texture)._webGLTexture, 0);

        engine.clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);
        let vb: any = {};
        vb[VertexBuffer.PositionKind] = this._radiosityEffectsManager.screenQuadVB;
        effect.setTexture("inputTexture", origin);
        effect.setFloat2("texelSize", 1 / dest.getSize().width, 1 / dest.getSize().height);
        engine.bindBuffers(vb, this._radiosityEffectsManager.screenQuadIB, effect);

        engine.setDirectViewport(0, 0, dest.getSize().width, dest.getSize().height);
        engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    private toneMap(origin: Texture, dest: Texture) {
        var engine = this._scene.getEngine();
        var effect = this._radiosityEffectsManager.radiosityPostProcessEffect;
        engine.enableEffect(effect);
        engine.setState(false);
        let gl = engine._gl;
        let fb = this._frameBuffer1;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, (<InternalTexture>dest._texture)._webGLTexture, 0);

        engine.clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true, true);
        let vb: any = {};
        vb[VertexBuffer.PositionKind] = this._radiosityEffectsManager.screenQuadVB;
        effect.setTexture("inputTexture", origin);
        effect.setFloat("_ExposureAdjustment", 0.5); // TODO
        effect.setColor3("ambientColor", new Color3(0.4, 0.4, 0.4)); // TODO
        engine.bindBuffers(vb, this._radiosityEffectsManager.screenQuadIB, effect);

        engine.setDirectViewport(0, 0, dest.getSize().width, dest.getSize().height);
        engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        // Tools.DumpFramebuffer(dest.getSize().width, dest.getSize().height, engine);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    private buildPatchesForSubMesh(subMesh: SubMesh) {
        var mesh = subMesh.getRenderingMesh();
        var map = (<MultiRenderTarget>mesh.radiosityInfo.residualTexture);

        if (this._patchedMeshes.indexOf(mesh) === -1) {
            if (this._cachePatches && !mesh.radiosityInfo.radiosityPatches) {
                mesh.radiosityInfo.radiosityPatches = [];

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
                    mesh.radiosityInfo.radiosityPatches.push(new Patch(new Vector3(positions[i], positions[i + 1], positions[i + 2]),
                        new Vector3(normals[i], normals[i + 1], normals[i + 2]),
                        RadiosityUtils.DecodeId(new Vector3(ids[i], ids[i + 1], ids[i + 2])),
                        new Vector3(residualEnergy[i] / 255., residualEnergy[i + 1] / 255., residualEnergy[i + 2] / 255.)));
                }
            }

            this._patchedMeshes.push(mesh);
            this._patchMaps.push(map);
        }

        let index = this._scene.customRenderTargets.indexOf(map);
        if (index !== -1) {
            this._scene.customRenderTargets.splice(index, 1);
        }

        index = this._patchMapsUnbuilt.indexOf(map);
        if (index !== -1) {
            this._patchMapsUnbuilt.splice(index, 1);
        }

        if (!this._patchMapsUnbuilt.length) {
            this._isBuildingPatches = false;
        }
    }

    private updatePatches(mesh: Mesh) {
        // Requires residualTexture to be filled
        var map = (<MultiRenderTarget>mesh.radiosityInfo.residualTexture);
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
            patches = mesh.radiosityInfo.radiosityPatches;
        }

        var energyLeft = 0;
        var currentIndex = 0;

        if (RadiosityRenderer.PERFORMANCE_LOGS_LEVEL >= 1) {
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
                    RadiosityUtils.DecodeId(new Vector3((<Float32Array>ids)[i], (<Float32Array>ids)[i + 1], (<Float32Array>ids)[i + 2])),
                    new Vector3(residualEnergy[i], residualEnergy[i + 1], residualEnergy[i + 2])));
            }

            energyLeft += (residualEnergy[i] + residualEnergy[i + 1] + residualEnergy[i + 2]) / 3;
            currentIndex++;
        }

        energyLeft *= this.squareToDiskArea(mesh.radiosityInfo.texelWorldSize);
        if (RadiosityRenderer.RADIOSITY_INFO_LOGS_LEVEL >= 1) {
            console.log("Residual energy gathered from surface : " + energyLeft);
        }

        if (this._filterMinEnergy && ! this._cachePatches) {
            patches.sort((a: Patch, b: Patch) => b.getResidualEnergySum() - a.getResidualEnergySum());
        }

        return { patches, energyLeft };
    }

    private renderSubMesh = (subMesh: SubMesh, effect: Effect) => {
        let engine = this._scene.getEngine();
        let mesh = subMesh.getRenderingMesh();
        let material = subMesh.getMaterial();

        if (!material || subMesh.verticesCount === 0) {
            return;
        }

        mesh._bind(subMesh, effect, Material.TriangleFillMode);
        engine.setState(material.backFaceCulling);

        var batch = mesh._getInstancesRenderList(subMesh._id);

        if (batch.mustReturn) {
            return;
        }

        // Draw triangles
        var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);
        mesh._processRendering(mesh, subMesh, effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
            (isInstance, world) => effect.setMatrix("world", world));
    }

    private buildVisibilityMapCube() {
        this._patchMap = new RenderTargetTexture("patch", this._patchMapResolution, this._scene, false, true, Constants.TEXTURETYPE_FLOAT, true, Texture.NEAREST_SAMPLINGMODE, true, false, false, Constants.TEXTUREFORMAT_RGBA, false);
        // this._patchMap = new RenderTargetTexture("patch", this._patchMapResolution, this._scene, false, true, Constants.TEXTURETYPE_FLOAT, true, undefined, true, false);
        // this._patchMap.createDepthStencilTexture(Constants.LESS, true);
        this._patchMap.renderList = this.meshes;
        this._patchMap.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._patchMap.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._patchMap.anisotropicFilteringLevel = 1;
        // this._patchMap.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        this._patchMap.renderParticles = false;
        this._patchMap.ignoreCameraViewport = true;
        this._patchMap.activeCamera = null;
        this._patchMap.useCameraPostProcesses = false;
    }

    private _setCubeVisibilityUniforms(effect: Effect, patch: Patch, mesh: Mesh, view: Matrix, projection: Matrix) {
        effect.setMatrix("view", view);
        effect.setMatrix("projection", projection);
        effect.setFloat2("nearFar", this._near, this._far);
        effect.setFloat("bias", this._bias);
    }

    private renderVisibilityMapCube() {
        let engine = this._scene.getEngine();

        let gl = engine._gl;
        let internalTexture = <InternalTexture>this._patchMap._texture;

        gl.bindFramebuffer(gl.FRAMEBUFFER, internalTexture._framebuffer);

        let viewMatrices = [this._currentPatch.viewMatrix,
            this._currentPatch.viewMatrixPX,
            this._currentPatch.viewMatrixNX,
            this._currentPatch.viewMatrixPY,
            this._currentPatch.viewMatrixNY
        ];

        let projectionMatrices = [Patch.ProjectionMatrix,
        Patch.ProjectionMatrixPX,
        Patch.ProjectionMatrixNX,
        Patch.ProjectionMatrixPY,
        Patch.ProjectionMatrixNY
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

        engine.enableEffect(this._radiosityEffectsManager.visibilityEffect);

        for (let j = 0; j < 5; j++) {
            // Full cube viewport when rendering the front face
            engine.setDirectViewport(viewportOffsets[j][0] * this._patchMap.getRenderWidth(), viewportOffsets[j][1] * this._patchMap.getRenderHeight(), this._patchMap.getRenderWidth() * viewportMultipliers[j][0], this._patchMap.getRenderHeight() * viewportMultipliers[j][1]);
            // Render on each face of the hemicube
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, cubeSides[j], internalTexture._webGLTexture, 0);
            engine.clear(new Color4(0, 0, 0, 0), true, true);
            for (let i = 0; i < this.meshes.length; i++) {
                for (let k = 0; k < this.meshes[i].subMeshes.length; k++) {
                    this._setCubeVisibilityUniforms(this._radiosityEffectsManager.visibilityEffect, this._currentPatch, this.meshes[i], viewMatrices[j], projectionMatrices[j]);
                    this.renderSubMesh(this.meshes[i].subMeshes[k], this._radiosityEffectsManager.visibilityEffect);
                }
            }
            // Tools.DumpFramebuffer(this._patchMap.getRenderWidth(), this._patchMap.getRenderHeight(), this._scene.getEngine());
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * Disposes of the radiosity renderer.
     */
    public dispose(): void {
        var gl = this._scene.getEngine()._gl;
        this._patchMap.dispose();
        this._nextShooterTexture.dispose();
        gl.deleteFramebuffer(this._frameBuffer0);
        gl.deleteFramebuffer(this._frameBuffer1);
    }
}
