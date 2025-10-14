import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Constants } from "core/Engines/constants";
import type { Engine } from "core/Engines/engine";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { IShaderMaterialOptions } from "core/Materials/shaderMaterial";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { Color4 } from "core/Maths/math.color";
import type { IVector2Like } from "core/Maths/math.like";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { VertexBuffer } from "core/Meshes/buffer";
import type { Mesh } from "core/Meshes/mesh";
import type { InstancedMesh } from "core/Meshes/instancedMesh";
import { Logger } from "core/Misc/logger";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";

/**
 * Class used to store the result of a GPU picking operation
 */
export interface IGPUPickingInfo {
    /**
     * Picked mesh
     */
    mesh: AbstractMesh;
    /**
     * Picked thin instance index
     */
    thinInstanceIndex?: number;
}

/**
 * Stores the result of a multi GPU piciking operation
 */
export interface IGPUMultiPickingInfo {
    /**
     * Picked mesh
     */
    meshes: Nullable<AbstractMesh>[];
    /**
     * Picked thin instance index
     */
    thinInstanceIndexes?: number[];
}

/**
 * Class used to perform a picking operation using GPU
 * GPUPIcker can pick meshes, instances and thin instances
 */
export class GPUPicker {
    private static readonly _AttributeName = "instanceMeshID";
    private static readonly _MaxPickingId = 0x00ffffff; // 24 bits unsigned integer max

    private _pickingTexture: Nullable<RenderTargetTexture> = null;

    private readonly _idMap: Array<number> = [];
    private readonly _thinIdMap: Array<{ meshId: number; thinId: number }> = [];
    private readonly _meshUniqueIdToPickerId: Array<number> = [];
    private _idWarningIssued = false;

    private _cachedScene: Nullable<Scene> = null;
    private _engine: Nullable<AbstractEngine> = null;

    private readonly _pickingMaterialCache: Nullable<ShaderMaterial>[] = new Array(9).fill(null);

    private _pickableMeshes: Array<AbstractMesh> = [];
    private readonly _meshMaterialMap: Map<AbstractMesh, ShaderMaterial> = new Map();
    private _readbuffer: Nullable<Uint8Array> = null;

    private _meshRenderingCount: number = 0;
    private _renderWarningIssued = false;
    private _renderPickingTexture = false;

    private _sceneBeforeRenderObserver: Nullable<Observer<Scene>> = null;
    private _pickingTextureAfterRenderObserver: Nullable<Observer<number>> = null;

    private _nextFreeId = 1;

    /** Shader language used by the generator */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language used in this generator.
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    private _pickingInProgress = false;

    /**
     * Gets a boolean indicating if the picking is in progress
     */
    public get pickingInProgress(): boolean {
        return this._pickingInProgress;
    }

    /**
     * Gets the default render materials used by the picker.
     *
     * index is Material filling mode
     */
    public get defaultRenderMaterials(): readonly Nullable<ShaderMaterial>[] {
        return this._pickingMaterialCache;
    }

    private _getColorIdFromReadBuffer(offset: number): number {
        const r = this._readbuffer![offset];
        const g = this._readbuffer![offset + 1];
        const b = this._readbuffer![offset + 2];
        return (r << 16) + (g << 8) + b;
    }

    private _createRenderTarget(scene: Scene, width: number, height: number): void {
        if (this._cachedScene && this._pickingTexture) {
            const index = this._cachedScene.customRenderTargets.indexOf(this._pickingTexture);
            if (index > -1) {
                this._cachedScene.customRenderTargets.splice(index, 1);
                this._renderPickingTexture = false;
            }
        }
        if (this._pickingTexture) {
            this._pickingTexture.dispose();
        }
        this._pickingTexture = new RenderTargetTexture("pickingTexure", { width: width, height: height }, scene, {
            generateMipMaps: false,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samplingMode: Constants.TEXTURE_NEAREST_NEAREST,
        });
    }

    private _clearPickingMaterials(): void {
        for (let i = 0; i < this._pickingMaterialCache.length; i++) {
            const material = this._pickingMaterialCache[i];
            if (material !== null) {
                material.dispose();
                this._pickingMaterialCache[i] = null;
            }
        }
    }

    private _getPickingMaterial(scene: Scene, fillMode: number): ShaderMaterial {
        if (fillMode < 0 || 8 < fillMode) {
            fillMode = Constants.MATERIAL_TriangleFillMode;
        }

        const cachedMaterial = this._pickingMaterialCache[fillMode];
        if (cachedMaterial) {
            return cachedMaterial;
        }

        const engine = scene.getEngine();

        if (engine.isWebGPU) {
            this._shaderLanguage = ShaderLanguage.WGSL;
        }

        const defines: string[] = [];
        const options: Partial<IShaderMaterialOptions> = {
            attributes: [VertexBuffer.PositionKind, GPUPicker._AttributeName],
            uniforms: ["world", "viewProjection", "meshID"],
            needAlphaBlending: false,
            defines: defines,
            useClipPlane: null,
            shaderLanguage: this._shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this.shaderLanguage === ShaderLanguage.WGSL) {
                    await Promise.all([import("../ShadersWGSL/picking.fragment"), import("../ShadersWGSL/picking.vertex")]);
                } else {
                    await Promise.all([import("../Shaders/picking.fragment"), import("../Shaders/picking.vertex")]);
                }
            },
        };

        const newMaterial = new ShaderMaterial("pickingShader", scene, "picking", options, false);
        newMaterial.fillMode = fillMode;
        newMaterial.onBindObservable.add(this._materialBindCallback, undefined, undefined, this);

        this._pickingMaterialCache[fillMode] = newMaterial;
        return newMaterial;
    }

    private _materialBindCallback(mesh: AbstractMesh | undefined): void {
        if (!mesh) {
            return;
        }

        const material = this._meshMaterialMap.get(mesh)!;

        if (!material) {
            if (!this._renderWarningIssued) {
                this._renderWarningIssued = true;
                Logger.Warn("GPUPicker issue: Mesh not found in the material map. This may happen when the root mesh of an instance is not in the picking list.");
            }
            return;
        }

        const effect = material.getEffect();

        if (!mesh.hasInstances && !mesh.isAnInstance && !mesh.hasThinInstances && this._meshUniqueIdToPickerId[mesh.uniqueId] !== undefined) {
            effect.setFloat("meshID", this._meshUniqueIdToPickerId[mesh.uniqueId]);
        }

        this._meshRenderingCount++;
    }

    /**
     * Set the list of meshes to pick from
     * Set that value to null to clear the list (and avoid leaks)
     * The module will read and delete from the array provided by reference. Disposing the module or setting the value to null will clear the array.
     * @param list defines the list of meshes to pick from
     */
    public setPickingList(list: Nullable<Array<AbstractMesh | { mesh: AbstractMesh; material: ShaderMaterial }>>): void {
        this.clearPickingList();

        if (!list || list.length === 0) {
            return;
        }

        this._pickableMeshes = list as Array<AbstractMesh>;

        // Prepare target
        const scene = ("mesh" in list[0] ? list[0].mesh : list[0]).getScene();
        if (!this._cachedScene || this._cachedScene !== scene) {
            this._clearPickingMaterials();
        }

        this.addPickingList(list);
    }

    /**
     * Clear the current picking list and free resources
     */
    public clearPickingList(): void {
        if (this._pickableMeshes) {
            // Cleanup
            for (let index = 0; index < this._pickableMeshes.length; index++) {
                const mesh = this._pickableMeshes[index];
                if (mesh.hasInstances) {
                    (mesh as Mesh).removeVerticesData(GPUPicker._AttributeName);
                }
                if (mesh.hasThinInstances) {
                    (mesh as Mesh).thinInstanceSetBuffer(GPUPicker._AttributeName, null);
                }
                if (this._pickingTexture) {
                    this._pickingTexture.setMaterialForRendering(mesh, undefined);
                }

                const material = this._meshMaterialMap.get(mesh)!;
                if (!this._pickingMaterialCache.includes(material)) {
                    material.onBindObservable.removeCallback(this._materialBindCallback);
                }
            }
            this._pickableMeshes.length = 0;
            this._meshMaterialMap.clear();
            this._idMap.length = 0;
            this._thinIdMap.length = 0;
            this._meshUniqueIdToPickerId.length = 0;
            if (this._pickingTexture) {
                this._pickingTexture.renderList = [];
            }
        }

        this._nextFreeId = 1;
    }

    /**
     * Add array of meshes to the current picking list
     * @param list defines the array of meshes to add to the current picking list
     */
    public addPickingList(list: Array<AbstractMesh | { mesh: AbstractMesh; material: ShaderMaterial }>): void {
        if (!list || list.length === 0) {
            return;
        }

        // Prepare target
        const scene = ("mesh" in list[0] ? list[0].mesh : list[0]).getScene();
        const engine = scene.getEngine();
        const rttSizeW = engine.getRenderWidth();
        const rttSizeH = engine.getRenderHeight();
        if (!this._pickingTexture) {
            this._createRenderTarget(scene, rttSizeW, rttSizeH);
        } else {
            const size = this._pickingTexture.getSize();

            if (size.width !== rttSizeW || size.height !== rttSizeH || this._cachedScene !== scene) {
                this._createRenderTarget(scene, rttSizeW, rttSizeH);
            }
        }

        this._sceneBeforeRenderObserver?.remove();
        this._sceneBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
            if (scene.frameGraph && this._renderPickingTexture && this._cachedScene && this._pickingTexture) {
                this._cachedScene._renderRenderTarget(this._pickingTexture, this._cachedScene.cameras?.[0] ?? null);
                this._cachedScene.activeCamera = null;
            }
        });

        this._cachedScene = scene;
        this._engine = scene.getEngine();
        if (!this._pickingTexture!.renderList) {
            this._pickingTexture!.renderList = [];
        }

        const newPickableMeshes: AbstractMesh[] = new Array(list.length);
        const pickableMeshOffset = this._pickableMeshes?.length ?? 0;

        this._cachedScene = scene;
        this._engine = scene.getEngine();

        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if ("mesh" in item) {
                this._meshMaterialMap.set(item.mesh, item.material);
                newPickableMeshes[i] = item.mesh;
            } else {
                const material = this._getPickingMaterial(scene, item.material?.fillMode ?? Constants.MATERIAL_TriangleFillMode);
                this._meshMaterialMap.set(item, material);
                newPickableMeshes[i] = item;
            }
        }

        if (this._pickableMeshes !== null) {
            this._pickableMeshes = [...this._pickableMeshes, ...newPickableMeshes];
        } else {
            this._pickableMeshes = newPickableMeshes;
        }

        // We will affect colors and create vertex color buffers
        let nextFreeid = this._nextFreeId;
        for (let index = 0; index < newPickableMeshes.length; index++) {
            const mesh = newPickableMeshes[index];
            const material = this._meshMaterialMap.get(mesh)!;

            if (!this._pickingMaterialCache.includes(material)) {
                material.onBindObservable.add(this._materialBindCallback, undefined, undefined, this);
            }
            this._pickingTexture!.setMaterialForRendering(mesh, material);
            this._pickingTexture!.renderList.push(mesh);

            if (mesh.isAnInstance) {
                continue; // This will be handled by the source mesh
            }

            const globalIndex = index + pickableMeshOffset;

            if (mesh.hasThinInstances) {
                const thinInstanceCount = (mesh as Mesh).thinInstanceCount;
                const instanceIdData = new Float32Array(thinInstanceCount);
                for (let i = 0; i < thinInstanceCount; i++) {
                    instanceIdData[i] = nextFreeid;
                    this._thinIdMap[nextFreeid] = { meshId: globalIndex, thinId: i };
                    nextFreeid++;
                }
                (mesh as Mesh).thinInstanceSetBuffer(GPUPicker._AttributeName, instanceIdData, 1);
            } else {
                const currentMeshId = nextFreeid;
                this._idMap[currentMeshId] = globalIndex;
                nextFreeid++;

                if (mesh.hasInstances) {
                    // find index of instances of that mesh
                    const instancesForPick: number[] = [];
                    for (let pickableMeshIndex = 0; pickableMeshIndex < newPickableMeshes.length; ++pickableMeshIndex) {
                        const m = newPickableMeshes[pickableMeshIndex];
                        if (m.isAnInstance && (m as InstancedMesh).sourceMesh === mesh) {
                            instancesForPick.push(pickableMeshIndex);
                        }
                    }
                    const instanceIdData = new Float32Array(instancesForPick.length + 1); // +1 for the source mesh

                    instanceIdData[0] = currentMeshId;
                    for (let i = 0; i < instancesForPick.length; i++) {
                        instanceIdData[i + 1] = nextFreeid;
                        const globalInstanceIndex = instancesForPick[i] + pickableMeshOffset;
                        this._idMap[nextFreeid] = globalInstanceIndex;
                        nextFreeid++;
                    }

                    const engine = mesh.getEngine();
                    const buffer = new VertexBuffer(engine, instanceIdData, GPUPicker._AttributeName, false, false, 1, true);
                    (mesh as Mesh).setVerticesBuffer(buffer, true);
                } else {
                    this._meshUniqueIdToPickerId[mesh.uniqueId] = currentMeshId;
                }
            }
        }

        if (GPUPicker._MaxPickingId < nextFreeid - 1) {
            if (!this._idWarningIssued) {
                this._idWarningIssued = true;
                Logger.Warn(`GPUPicker maximum number of pickable meshes and instances is ${GPUPicker._MaxPickingId}. Some meshes or instances won't be pickable.`);
            }
        }

        this._nextFreeId = nextFreeid;
    }

    /**
     * Execute a picking operation
     * @param x defines the X coordinates where to run the pick
     * @param y defines the Y coordinates where to run the pick
     * @param disposeWhenDone defines a boolean indicating we do not want to keep resources alive (false by default)
     * @returns A promise with the picking results
     */
    public async pickAsync(x: number, y: number, disposeWhenDone = false): Promise<Nullable<IGPUPickingInfo>> {
        if (this._pickingInProgress) {
            return null;
        }

        if (!this._pickableMeshes || this._pickableMeshes.length === 0) {
            return null;
        }

        const { rttSizeW, rttSizeH, devicePixelRatio } = this._getRenderInfo();

        const { x: adjustedX, y: adjustedY } = this._prepareForPicking(x, y, devicePixelRatio);
        if (adjustedX < 0 || adjustedY < 0 || adjustedX >= rttSizeW || adjustedY >= rttSizeH) {
            return null;
        }

        this._pickingInProgress = true;

        // Invert Y
        const invertedY = rttSizeH - adjustedY - 1;
        this._preparePickingBuffer(this._engine!, rttSizeW, rttSizeH, adjustedX, invertedY);

        return await this._executePickingAsync(adjustedX, invertedY, disposeWhenDone);
    }

    /**
     * Execute a picking operation on multiple coordinates
     * @param xy defines the X,Y coordinates where to run the pick
     * @param disposeWhenDone defines a boolean indicating we do not want to keep resources alive (false by default)
     * @returns A promise with the picking results. Always returns an array with the same length as the number of coordinates. The mesh or null at the index where no mesh was picked.
     */
    public async multiPickAsync(xy: IVector2Like[], disposeWhenDone = false): Promise<Nullable<IGPUMultiPickingInfo>> {
        if (this._pickingInProgress) {
            return null;
        }

        if (!this._pickableMeshes || this._pickableMeshes.length === 0 || xy.length === 0) {
            return null;
        }

        if (xy.length === 1) {
            const pi = await this.pickAsync(xy[0].x, xy[0].y, disposeWhenDone);
            return {
                meshes: [pi?.mesh ?? null],
                thinInstanceIndexes: pi?.thinInstanceIndex ? [pi.thinInstanceIndex] : undefined,
            };
        }

        this._pickingInProgress = true;

        const processedXY = new Array(xy.length);

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        const { rttSizeW, rttSizeH, devicePixelRatio } = this._getRenderInfo();

        // Process screen coordinates adjust to dpr
        for (let i = 0; i < xy.length; i++) {
            const item = xy[i];
            const { x, y } = item;

            const { x: adjustedX, y: adjustedY } = this._prepareForPicking(x, y, devicePixelRatio);

            processedXY[i] = {
                ...item,
                x: adjustedX,
                y: adjustedY,
            };

            minX = Math.min(minX, adjustedX);
            maxX = Math.max(maxX, adjustedX);
            minY = Math.min(minY, adjustedY);
            maxY = Math.max(maxY, adjustedY);
        }

        const w = Math.max(maxX - minX, 1);
        const h = Math.max(maxY - minY, 1);
        const partialCutH = rttSizeH - maxY - 1;

        this._preparePickingBuffer(this._engine!, rttSizeW, rttSizeH, minX, partialCutH, w, h);

        return await this._executeMultiPickingAsync(processedXY, minX, maxY, rttSizeH, w, h, disposeWhenDone);
    }

    /**
     * Execute a picking operation on box defined by two screen coordinates
     * @param x1 defines the X coordinate of the first corner of the box where to run the pick
     * @param y1 defines the Y coordinate of the first corner of the box where to run the pick
     * @param x2 defines the X coordinate of the opposite corner of the box where to run the pick
     * @param y2 defines the Y coordinate of the opposite corner of the box where to run the pick
     * @param disposeWhenDone defines a boolean indicating we do not want to keep resources alive (false by default)
     * @returns A promise with the picking results. Always returns an array with the same length as the number of coordinates. The mesh or null at the index where no mesh was picked.
     */
    public async boxPickAsync(x1: number, y1: number, x2: number, y2: number, disposeWhenDone = false): Promise<Nullable<IGPUMultiPickingInfo>> {
        if (this._pickingInProgress) {
            return null;
        }

        if (!this._pickableMeshes || this._pickableMeshes.length === 0) {
            return null;
        }

        this._pickingInProgress = true;

        const { rttSizeW, rttSizeH, devicePixelRatio } = this._getRenderInfo();

        const { x: adjustedX1, y: adjustedY1 } = this._prepareForPicking(x1, y1, devicePixelRatio);
        const { x: adjustedX2, y: adjustedY2 } = this._prepareForPicking(x2, y2, devicePixelRatio);

        const minX = Math.max(Math.min(adjustedX1, adjustedX2), 0);
        const maxX = Math.min(Math.max(adjustedX1, adjustedX2), rttSizeW - 1);
        const minY = Math.max(Math.min(adjustedY1, adjustedY2), 0);
        const maxY = Math.min(Math.max(adjustedY1, adjustedY2), rttSizeH - 1);

        if (minX >= rttSizeW || minY >= rttSizeH || maxX < 0 || maxY < 0) {
            this._pickingInProgress = false;
            return null;
        }

        const w = Math.max(maxX - minX, 1);
        const h = Math.max(maxY - minY, 1);
        const partialCutH = rttSizeH - maxY - 1;

        this._preparePickingBuffer(this._engine!, rttSizeW, rttSizeH, minX, partialCutH, w, h);

        return await this._executeBoxPickingAsync(minX, partialCutH, w, h, disposeWhenDone);
    }

    private _getRenderInfo(): { rttSizeW: number; rttSizeH: number; devicePixelRatio: number } {
        const engine = this._cachedScene!.getEngine();
        const rttSizeW = engine.getRenderWidth();
        const rttSizeH = engine.getRenderHeight();
        const devicePixelRatio = 1 / engine._hardwareScalingLevel;

        return {
            rttSizeW,
            rttSizeH,
            devicePixelRatio,
        };
    }

    private _prepareForPicking(x: number, y: number, devicePixelRatio: number): IVector2Like {
        return { x: (devicePixelRatio * x) >> 0, y: (devicePixelRatio * y) >> 0 };
    }

    private _preparePickingBuffer(engine: AbstractEngine, rttSizeW: number, rttSizeH: number, x: number, y: number, w = 1, h = 1): void {
        this._meshRenderingCount = 0;

        const requiredBufferSize = engine.isWebGPU ? (4 * w * h + 255) & ~255 : 4 * w * h;
        if (!this._readbuffer || this._readbuffer.length < requiredBufferSize) {
            this._readbuffer = new Uint8Array(requiredBufferSize);
        }

        // Do we need to rebuild the RTT?
        const size = this._pickingTexture!.getSize();
        if (size.width !== rttSizeW || size.height !== rttSizeH) {
            this._createRenderTarget(this._cachedScene!, rttSizeW, rttSizeH);
            this._updateRenderList();
        }

        this._pickingTexture!.clearColor = new Color4(0, 0, 0, 0);

        this._pickingTexture!.onBeforeRender = (): void => {
            this._enableScissor(x, y, w, h);
        };

        this._pickingTextureAfterRenderObserver?.remove();
        this._pickingTextureAfterRenderObserver = this._pickingTexture!.onAfterRenderObservable.add(() => {
            this._disableScissor();
        });

        this._cachedScene!.customRenderTargets.push(this._pickingTexture!);
        this._renderPickingTexture = true;
    }

    // pick one pixel
    private async _executePickingAsync(x: number, y: number, disposeWhenDone: boolean): Promise<Nullable<IGPUPickingInfo>> {
        return await new Promise((resolve, reject) => {
            if (!this._pickingTexture) {
                this._pickingInProgress = false;
                reject(new Error("Picking texture not created"));
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            this._pickingTexture.onAfterRender = async (): Promise<void> => {
                if (this._checkRenderStatus()) {
                    this._pickingTexture!.onAfterRender = null as any;
                    let pickedMesh: Nullable<AbstractMesh> = null;
                    let thinInstanceIndex: number | undefined = undefined;

                    // Remove from the active RTTs
                    const index = this._cachedScene!.customRenderTargets.indexOf(this._pickingTexture!);
                    if (index > -1) {
                        this._cachedScene!.customRenderTargets.splice(index, 1);
                        this._renderPickingTexture = false;
                    }

                    // Do the actual picking
                    if (await this._readTexturePixelsAsync(x, y)) {
                        const colorId = this._getColorIdFromReadBuffer(0);
                        // Thin?
                        if (this._thinIdMap[colorId]) {
                            pickedMesh = this._pickableMeshes[this._thinIdMap[colorId].meshId];
                            thinInstanceIndex = this._thinIdMap[colorId].thinId;
                        } else {
                            pickedMesh = this._pickableMeshes[this._idMap[colorId]];
                        }
                    }

                    if (disposeWhenDone) {
                        this.dispose();
                    }

                    this._pickingInProgress = false;
                    if (pickedMesh) {
                        resolve({ mesh: pickedMesh, thinInstanceIndex: thinInstanceIndex });
                    } else {
                        resolve(null);
                    }
                }
            };
        });
    }

    // pick multiple pixels
    private async _executeMultiPickingAsync(
        xy: IVector2Like[],
        minX: number,
        maxY: number,
        rttSizeH: number,
        w: number,
        h: number,
        disposeWhenDone: boolean
    ): Promise<Nullable<IGPUMultiPickingInfo>> {
        return await new Promise((resolve, reject) => {
            if (!this._pickingTexture) {
                this._pickingInProgress = false;
                reject(new Error("Picking texture not created"));
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            this._pickingTexture.onAfterRender = async (): Promise<void> => {
                if (this._checkRenderStatus()) {
                    this._pickingTexture!.onAfterRender = null as any;
                    const pickedMeshes: Nullable<AbstractMesh>[] = [];
                    const thinInstanceIndexes: number[] = [];

                    if (await this._readTexturePixelsAsync(minX, rttSizeH - maxY - 1, w, h)) {
                        for (let i = 0; i < xy.length; i++) {
                            const { pickedMesh, thinInstanceIndex } = this._getMeshFromMultiplePoints(xy[i].x, xy[i].y, minX, maxY, w);
                            pickedMeshes.push(pickedMesh);
                            thinInstanceIndexes.push(thinInstanceIndex ?? 0);
                        }
                    }

                    if (disposeWhenDone) {
                        this.dispose();
                    }

                    this._pickingInProgress = false;
                    resolve({ meshes: pickedMeshes, thinInstanceIndexes: thinInstanceIndexes });
                }
            };
        });
    }

    // pick box area
    private async _executeBoxPickingAsync(x: number, y: number, w: number, h: number, disposeWhenDone: boolean): Promise<IGPUMultiPickingInfo> {
        return await new Promise((resolve, reject) => {
            if (!this._pickingTexture) {
                this._pickingInProgress = false;
                reject(new Error("Picking texture not created"));
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            this._pickingTexture.onAfterRender = async (): Promise<void> => {
                if (this._checkRenderStatus()) {
                    this._pickingTexture!.onAfterRender = null as any;
                    const pickedMeshes: Nullable<AbstractMesh>[] = [];
                    const thinInstanceIndexes: number[] = [];

                    if (await this._readTexturePixelsAsync(x, y, w, h)) {
                        for (let offsetY = 0; offsetY < h; ++offsetY) {
                            for (let offsetX = 0; offsetX < w; ++offsetX) {
                                const colorId = this._getColorIdFromReadBuffer((offsetY * w + offsetX) * 4);
                                if (colorId > 0) {
                                    // Thin?
                                    if (this._thinIdMap[colorId]) {
                                        const pickedMesh = this._pickableMeshes[this._thinIdMap[colorId].meshId];
                                        const thinInstanceIndex = this._thinIdMap[colorId].thinId;
                                        pickedMeshes.push(pickedMesh);
                                        thinInstanceIndexes.push(thinInstanceIndex);
                                    } else {
                                        const pickedMesh = this._pickableMeshes[this._idMap[colorId]];
                                        pickedMeshes.push(pickedMesh);
                                        thinInstanceIndexes.push(0);
                                    }
                                }
                            }
                        }
                    }

                    if (disposeWhenDone) {
                        this.dispose();
                    }

                    this._pickingInProgress = false;
                    resolve({ meshes: pickedMeshes, thinInstanceIndexes: thinInstanceIndexes });
                }
            };
        });
    }

    private _enableScissor(x: number, y: number, w = 1, h = 1): void {
        if ((this._engine as WebGPUEngine | Engine).enableScissor) {
            (this._engine as WebGPUEngine | Engine).enableScissor(x, y, w, h);
        }
    }
    private _disableScissor(): void {
        if ((this._engine as WebGPUEngine | Engine).disableScissor) {
            (this._engine as WebGPUEngine | Engine).disableScissor();
        }
    }

    /**
     * @returns true if rendering if the picking texture has finished, otherwise false
     */
    private _checkRenderStatus(): boolean {
        const wasSuccessful = this._meshRenderingCount > 0;
        if (wasSuccessful) {
            // Remove from the active RTTs
            const index = this._cachedScene!.customRenderTargets.indexOf(this._pickingTexture!);
            if (index > -1) {
                this._cachedScene!.customRenderTargets.splice(index, 1);
                this._renderPickingTexture = false;
            }
            return true;
        }

        this._meshRenderingCount = 0;
        return false; // Wait for shaders to be ready
    }

    private _getMeshFromMultiplePoints(x: number, y: number, minX: number, maxY: number, w: number): { pickedMesh: Nullable<AbstractMesh>; thinInstanceIndex: number | undefined } {
        let offsetX = (x - minX - 1) * 4;
        let offsetY = (maxY - y - 1) * w * 4;

        offsetX = Math.max(offsetX, 0);
        offsetY = Math.max(offsetY, 0);

        const colorId = this._getColorIdFromReadBuffer(offsetX + offsetY);

        let pickedMesh: Nullable<AbstractMesh> = null;
        let thinInstanceIndex: number | undefined;

        if (colorId > 0) {
            if (this._thinIdMap[colorId]) {
                pickedMesh = this._pickableMeshes[this._thinIdMap[colorId].meshId];
                thinInstanceIndex = this._thinIdMap[colorId].thinId;
            } else {
                pickedMesh = this._pickableMeshes[this._idMap[colorId]];
            }
        }

        return { pickedMesh, thinInstanceIndex };
    }

    /**
     * Updates the render list with the current pickable meshes.
     */
    private _updateRenderList(): void {
        this._pickingTexture!.renderList = [];
        for (const mesh of this._pickableMeshes) {
            this._pickingTexture!.setMaterialForRendering(mesh, this._meshMaterialMap.get(mesh));
            this._pickingTexture!.renderList.push(mesh);
        }
    }

    private async _readTexturePixelsAsync(x: number, y: number, w = 1, h = 1): Promise<boolean> {
        if (!this._cachedScene || !this._pickingTexture?._texture) {
            return false;
        }
        const engine = this._cachedScene.getEngine();
        await engine._readTexturePixels(this._pickingTexture._texture, w, h, -1, 0, this._readbuffer, true, true, x, y);

        return true;
    }

    /** Release the resources */
    public dispose(): void {
        this.setPickingList(null);
        this._cachedScene = null;

        // Cleaning up
        this._pickingTexture?.dispose();
        this._pickingTexture = null;
        this._clearPickingMaterials();
        this._sceneBeforeRenderObserver?.remove();
        this._sceneBeforeRenderObserver = null;
    }
}
