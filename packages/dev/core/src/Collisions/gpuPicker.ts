import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Constants } from "core/Engines/constants";
import type { Engine } from "core/Engines/engine";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { IShaderMaterialOptions } from "core/Materials/shaderMaterial";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { Color3, Color4 } from "core/Maths/math.color";
import type { IColor3Like, IVector2Like } from "core/Maths/math.like";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { VertexBuffer } from "core/Meshes/buffer";
import type { Mesh } from "core/Meshes/mesh";
import { Logger } from "core/Misc/logger";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

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
    private _pickingTexture: Nullable<RenderTargetTexture> = null;
    private _idMap: Array<number> = [];
    private _thinIdMap: Array<{ meshId: number; thinId: number }> = [];
    private _idColors: Array<Color3> = [];
    private _cachedScene: Nullable<Scene>;
    private _engine: Nullable<AbstractEngine>;
    private _defaultRenderMaterial: Nullable<ShaderMaterial>;
    private _pickableMeshes: Array<AbstractMesh>;
    private _meshMaterialMap: Map<AbstractMesh, ShaderMaterial> = new Map();
    private _readbuffer: Uint8Array;
    private _meshRenderingCount: number = 0;
    private readonly _attributeName = "instanceMeshID";
    private _warningIssued = false;

    /** Shader language used by the generator */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    private static _TempColor: IColor3Like = {
        r: 0,
        g: 0,
        b: 0,
    };

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
    public get pickingInProgress() {
        return this._pickingInProgress;
    }

    private static _IdToRgb(id: number) {
        GPUPicker._TempColor.r = (id & 0xff0000) >> 16;
        GPUPicker._TempColor.g = (id & 0x00ff00) >> 8;
        GPUPicker._TempColor.b = (id & 0x0000ff) >> 0;
    }

    private _getColorIdFromReadBuffer(offset: number) {
        const r = this._readbuffer[offset];
        const g = this._readbuffer[offset + 1];
        const b = this._readbuffer[offset + 2];
        return (r << 16) + (g << 8) + b;
    }

    private static _SetColorData(buffer: Float32Array, i: number, r: number, g: number, b: number) {
        buffer[i] = r / 255.0;
        buffer[i + 1] = g / 255.0;
        buffer[i + 2] = b / 255.0;
        buffer[i + 3] = 1.0;
    }

    private _createRenderTarget(scene: Scene, width: number, height: number) {
        if (this._pickingTexture) {
            this._pickingTexture.dispose();
        }
        this._pickingTexture = new RenderTargetTexture(
            "pickingTexure",
            { width: width, height: height },
            scene,
            false,
            undefined,
            Constants.TEXTURETYPE_UNSIGNED_BYTE,
            false,
            Constants.TEXTURE_NEAREST_NEAREST
        );
    }

    private async _createColorMaterialAsync(scene: Scene) {
        if (this._defaultRenderMaterial) {
            this._defaultRenderMaterial.dispose();
        }

        this._defaultRenderMaterial = null;

        const engine = scene.getEngine();

        if (engine.isWebGPU) {
            this._shaderLanguage = ShaderLanguage.WGSL;
        }

        const defines: string[] = [];
        const options: Partial<IShaderMaterialOptions> = {
            attributes: [VertexBuffer.PositionKind, this._attributeName, "bakedVertexAnimationSettingsInstanced"],
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

        this._defaultRenderMaterial = new ShaderMaterial("pickingShader", scene, "picking", options, false);

        this._defaultRenderMaterial.onBindObservable.add(this._materialBindCallback, undefined, undefined, this);
    }

    private _materialBindCallback(mesh: AbstractMesh | undefined) {
        if (!mesh) {
            return;
        }

        const material = this._meshMaterialMap.get(mesh)!;

        if (!material) {
            if (!this._warningIssued) {
                this._warningIssued = true;
                Logger.Warn("GPUPicker issue: Mesh not found in the material map. This may happen when the root mesh of an instance is not in the picking list.");
            }
            return;
        }

        const effect = material.getEffect()!;

        if (!mesh.hasInstances && !mesh.isAnInstance && !mesh.hasThinInstances) {
            effect.setColor4("meshID", this._idColors[mesh.uniqueId], 1);
        }

        this._meshRenderingCount++;
    }

    private _generateColorData(instanceCount: number, id: number, index: number, r: number, g: number, b: number, onInstance: (i: number, id: number) => void) {
        const colorData = new Float32Array(4 * (instanceCount + 1));

        GPUPicker._SetColorData(colorData, 0, r, g, b);

        for (let i = 0; i < instanceCount; i++) {
            GPUPicker._IdToRgb(id);

            onInstance(i, id);
            GPUPicker._SetColorData(colorData, (i + 1) * 4, GPUPicker._TempColor.r, GPUPicker._TempColor.g, GPUPicker._TempColor.b);
            id++;
        }

        return colorData;
    }

    private _generateThinInstanceColorData(instanceCount: number, id: number, onInstance: (i: number, id: number) => void) {
        const colorData = new Float32Array(4 * instanceCount);

        for (let i = 0; i < instanceCount; i++) {
            GPUPicker._IdToRgb(id);

            onInstance(i, id);
            GPUPicker._SetColorData(colorData, i * 4, GPUPicker._TempColor.r, GPUPicker._TempColor.g, GPUPicker._TempColor.b);

            id++;
        }

        return colorData;
    }

    /**
     * Set the list of meshes to pick from
     * Set that value to null to clear the list (and avoid leaks)
     * The module will read and delete from the array provided by reference. Disposing the module or setting the value to null will clear the array.
     * @param list defines the list of meshes to pick from
     */
    public setPickingList(list: Nullable<Array<AbstractMesh | { mesh: AbstractMesh; material: ShaderMaterial }>>) {
        if (this._pickableMeshes) {
            // Cleanup
            for (let index = 0; index < this._pickableMeshes.length; index++) {
                const mesh = this._pickableMeshes[index];
                if (mesh.hasInstances) {
                    (mesh as Mesh).removeVerticesData(this._attributeName);
                }
                if (mesh.hasThinInstances) {
                    (mesh as Mesh).thinInstanceSetBuffer(this._attributeName, null);
                }
                if (this._pickingTexture) {
                    this._pickingTexture.setMaterialForRendering(mesh, undefined);
                }

                const material = this._meshMaterialMap.get(mesh)!;
                if (material !== this._defaultRenderMaterial) {
                    material.onBindObservable.removeCallback(this._materialBindCallback);
                }
            }
            this._pickableMeshes.length = 0;
            this._meshMaterialMap.clear();
            this._idMap.length = 0;
            this._thinIdMap.length = 0;
            this._idColors.length = 0;
            if (this._pickingTexture) {
                this._pickingTexture.renderList = [];
            }
        }
        if (!list || list.length === 0) {
            return;
        }

        this._pickableMeshes = list as Array<AbstractMesh>;

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

        if (!this._cachedScene || this._cachedScene !== scene) {
            this._createColorMaterialAsync(scene);
        }

        this._cachedScene = scene;
        this._engine = scene.getEngine();

        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if ("mesh" in item) {
                this._meshMaterialMap.set(item.mesh, item.material);
                list[i] = item.mesh;
            } else {
                this._meshMaterialMap.set(item, this._defaultRenderMaterial!);
            }
        }

        this._pickingTexture!.renderList = [];

        // We will affect colors and create vertex color buffers
        let id = 1;
        for (let index = 0; index < this._pickableMeshes.length; index++) {
            const mesh = this._pickableMeshes[index];
            const material = this._meshMaterialMap.get(mesh)!;

            if (material !== this._defaultRenderMaterial) {
                material.onBindObservable.add(this._materialBindCallback, undefined, undefined, this);
            }
            this._pickingTexture!.setMaterialForRendering(mesh, material);
            this._pickingTexture!.renderList.push(mesh);

            if (mesh.isAnInstance) {
                continue; // This will be handled by the source mesh
            }

            GPUPicker._IdToRgb(id);

            if (mesh.hasThinInstances) {
                const colorData = this._generateThinInstanceColorData((mesh as Mesh).thinInstanceCount, id, (i, id) => {
                    this._thinIdMap[id] = { meshId: index, thinId: i };
                });
                id += (mesh as Mesh).thinInstanceCount;
                (mesh as Mesh).thinInstanceSetBuffer(this._attributeName, colorData, 4);
            } else {
                this._idMap[id] = index;
                id++;

                if (mesh.hasInstances) {
                    const instances = (mesh as Mesh).instances;
                    const colorData = this._generateColorData(instances.length, id, index, GPUPicker._TempColor.r, GPUPicker._TempColor.g, GPUPicker._TempColor.b, (i, id) => {
                        const instance = instances[i];
                        this._idMap[id] = this._pickableMeshes.indexOf(instance);
                    });

                    id += instances.length;
                    const engine = mesh.getEngine();

                    const buffer = new VertexBuffer(engine, colorData, this._attributeName, false, false, 4, true);
                    (mesh as Mesh).setVerticesBuffer(buffer, true);
                } else {
                    this._idColors[mesh.uniqueId] = Color3.FromInts(GPUPicker._TempColor.r, GPUPicker._TempColor.g, GPUPicker._TempColor.b);
                }
            }
        }
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

        const { x: adjustedX, y: adjustedY, rttSizeW, rttSizeH } = this._prepareForPicking(x, y);
        if (adjustedX < 0 || adjustedY < 0 || adjustedX >= rttSizeW || adjustedY >= rttSizeH) {
            return null;
        }

        this._pickingInProgress = true;

        // Invert Y
        const invertedY = rttSizeH - adjustedY - 1;
        this._preparePickingBuffer(this._engine!, rttSizeW, rttSizeH, adjustedX, invertedY);

        return this._executePicking(adjustedX, invertedY, disposeWhenDone);
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

        let minX = xy[0].x,
            maxX = xy[0].x,
            minY = xy[0].y,
            maxY = xy[0].y;

        for (let i = 1; i < xy.length; i++) {
            const { x, y } = xy[i];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        const { rttSizeW, rttSizeH } = this._prepareForPicking(minX, minY);
        const w = Math.max(maxX - minX, 1);
        const h = Math.max(maxY - minY, 1);
        const partialCutH = rttSizeH - maxY - 1;

        this._preparePickingBuffer(this._engine!, rttSizeW, rttSizeH, minX, partialCutH, w, h);

        return this._executeMultiPicking(xy, minX, maxY, rttSizeH, w, h, disposeWhenDone);
    }

    private _prepareForPicking(x: number, y: number) {
        const scene = this._cachedScene!;
        const engine = scene.getEngine();
        const rttSizeW = engine.getRenderWidth();
        const rttSizeH = engine.getRenderHeight();
        const devicePixelRatio = 1 / engine._hardwareScalingLevel;

        const intX = (devicePixelRatio * x) >> 0;
        const intY = (devicePixelRatio * y) >> 0;

        return { x: intX, y: intY, rttSizeW, rttSizeH };
    }

    private _preparePickingBuffer(engine: AbstractEngine, rttSizeW: number, rttSizeH: number, x: number, y: number, w = 1, h = 1) {
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

        this._pickingTexture!.onBeforeRender = () => {
            this._enableScissor(x, y, w, h);
        };

        this._cachedScene!.customRenderTargets.push(this._pickingTexture!);
    }

    // pick one pixel
    private _executePicking(x: number, y: number, disposeWhenDone: boolean): Promise<Nullable<IGPUPickingInfo>> {
        return new Promise((resolve, reject) => {
            if (!this._pickingTexture) {
                this._pickingInProgress = false;
                reject();
                return;
            }

            this._pickingTexture!.onAfterRender = async () => {
                this._disableScissor();

                if (this._checkRenderStatus()) {
                    this._pickingTexture!.onAfterRender = null as any;
                    let pickedMesh: Nullable<AbstractMesh> = null;
                    let thinInstanceIndex: number | undefined = undefined;

                    // Remove from the active RTTs
                    const index = this._cachedScene!.customRenderTargets.indexOf(this._pickingTexture!);
                    if (index > -1) {
                        this._cachedScene!.customRenderTargets.splice(index, 1);
                    }

                    // Do the actual picking
                    if (await this._readTexturePixelsAsync(x, y)) {
                        const colorId = this._getColorIdFromReadBuffer(0);

                        // Thin?
                        if (this._thinIdMap[colorId]) {
                            pickedMesh = this._pickableMeshes![this._thinIdMap[colorId].meshId];
                            thinInstanceIndex = this._thinIdMap[colorId].thinId;
                        } else {
                            pickedMesh = this._pickableMeshes![this._idMap[colorId]];
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
    private _executeMultiPicking(
        xy: IVector2Like[],
        minX: number,
        maxY: number,
        rttSizeH: number,
        w: number,
        h: number,
        disposeWhenDone: boolean
    ): Promise<Nullable<IGPUMultiPickingInfo>> {
        return new Promise((resolve, reject) => {
            if (!this._pickingTexture) {
                this._pickingInProgress = false;
                reject();
                return;
            }

            this._pickingTexture!.onAfterRender = async () => {
                this._disableScissor();

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

    private _enableScissor(x: number, y: number, w = 1, h = 1) {
        if ((this._engine as WebGPUEngine | Engine).enableScissor) {
            (this._engine as WebGPUEngine | Engine).enableScissor(x, y, w, h);
        }
    }
    private _disableScissor() {
        if ((this._engine as WebGPUEngine | Engine).disableScissor) {
            (this._engine as WebGPUEngine | Engine).disableScissor();
        }
    }

    /**
     * @returns true if rendering if the picking texture has finished, otherwise false
     */
    private _checkRenderStatus(): boolean {
        const wasSuccessfull = this._meshRenderingCount > 0;
        if (wasSuccessfull) {
            // Remove from the active RTTs
            const index = this._cachedScene!.customRenderTargets.indexOf(this._pickingTexture!);
            if (index > -1) {
                this._cachedScene!.customRenderTargets.splice(index, 1);
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
                pickedMesh = this._pickableMeshes![this._thinIdMap[colorId].meshId];
                thinInstanceIndex = this._thinIdMap[colorId].thinId;
            } else {
                pickedMesh = this._pickableMeshes![this._idMap[colorId]];
            }
        }

        return { pickedMesh, thinInstanceIndex };
    }

    /**
     * Updates the render list with the current pickable meshes.
     */
    private _updateRenderList() {
        this._pickingTexture!.renderList = [];
        for (const mesh of this._pickableMeshes!) {
            this._pickingTexture!.setMaterialForRendering(mesh, this._meshMaterialMap.get(mesh));
            this._pickingTexture!.renderList.push(mesh);
        }
    }

    private async _readTexturePixelsAsync(x: number, y: number, w = 1, h = 1) {
        if (!this._cachedScene || !this._pickingTexture?._texture) {
            return false;
        }
        const engine = this._cachedScene.getEngine();
        await engine._readTexturePixels(this._pickingTexture._texture, w, h, -1, 0, this._readbuffer, true, true, x, y);

        return true;
    }

    /** Release the resources */
    public dispose() {
        this.setPickingList(null);
        this._cachedScene = null;

        // Cleaning up
        this._pickingTexture?.dispose();
        this._pickingTexture = null;
        this._defaultRenderMaterial?.dispose();
        this._defaultRenderMaterial = null;
    }
}
