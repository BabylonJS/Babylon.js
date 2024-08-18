import { Constants } from "core/Engines/constants";
import type { Engine } from "core/Engines/engine";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { Color3, Color4 } from "core/Maths/math.color";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { VertexBuffer } from "core/Meshes/buffer";
import type { Mesh } from "core/Meshes/mesh";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

import "../Shaders/picking.fragment";
import "../Shaders/picking.vertex";

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
 *
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
 * Please note that GPUPIcker cannot pick instances, only meshes
 */
export class GPUPicker {
    private _pickingTexure: Nullable<RenderTargetTexture> = null;
    private _idMap: Array<number> = [];
    private _thinIdMap: Array<{ meshId: number; thinId: number }> = [];
    private _idColors: Array<Color3> = [];
    private _cachedScene: Nullable<Scene>;
    private _defaultRenderMaterial: Nullable<ShaderMaterial>;
    private _pickableMeshes: Array<AbstractMesh>;
    private _meshMaterialMap: Map<AbstractMesh, ShaderMaterial> = new Map();
    private _readbuffer: Uint8Array;
    private _meshRenderingCount: number = 0;
    private readonly _attributeName = "instanceMeshID";

    private _createRenderTarget(scene: Scene, width: number, height: number) {
        if (this._pickingTexure) {
            this._pickingTexure.dispose();
        }
        this._pickingTexure = new RenderTargetTexture(
            "pickingTexure",
            { width: width, height: height },
            scene,
            false,
            undefined,
            Constants.TEXTURETYPE_UNSIGNED_INT,
            false,
            Constants.TEXTURE_NEAREST_NEAREST
        );
    }

    private _createColorMaterial(scene: Scene) {
        if (this._defaultRenderMaterial) {
            this._defaultRenderMaterial.dispose();
        }

        const defines: string[] = [];
        const options = {
            attributes: [VertexBuffer.PositionKind, this._attributeName, "bakedVertexAnimationSettingsInstanced"],
            uniforms: ["world", "viewProjection", "meshID"],
            needAlphaBlending: false,
            defines: defines,
            useClipPlane: null,
        };

        this._defaultRenderMaterial = new ShaderMaterial("pickingShader", scene, "picking", options, false);

        this._defaultRenderMaterial.onBindObservable.add(this._materialBindCallback, undefined, undefined, this);
    }

    private _materialBindCallback(mesh: AbstractMesh | undefined) {
        if (!mesh) {
            return;
        }

        const material = this._meshMaterialMap.get(mesh)!;
        const effect = material.getEffect()!;

        if (!mesh.hasInstances && !mesh.isAnInstance && !mesh.hasThinInstances) {
            effect.setColor4("meshID", this._idColors[mesh.uniqueId], 1);
        }

        this._meshRenderingCount++;
    }

    private _generateColorData(instanceCount: number, id: number, index: number, r: number, g: number, b: number, onInstance: (i: number, id: number) => void) {
        const colorData = new Float32Array(4 * (instanceCount + 1));

        colorData[0] = r / 255.0;
        colorData[1] = g / 255.0;
        colorData[2] = b / 255.0;
        colorData[3] = 1.0;
        for (let i = 0; i < instanceCount; i++) {
            const r = (id & 0xff0000) >> 16;
            const g = (id & 0x00ff00) >> 8;
            const b = (id & 0x0000ff) >> 0;
            onInstance(i, id);

            colorData[(i + 1) * 4] = r / 255.0;
            colorData[(i + 1) * 4 + 1] = g / 255.0;
            colorData[(i + 1) * 4 + 2] = b / 255.0;
            colorData[(i + 1) * 4 + 3] = 1.0;
            id++;
        }

        return colorData;
    }

    private _generateThinInstanceColorData(instanceCount: number, id: number, onInstance: (i: number, id: number) => void) {
        const colorData = new Float32Array(4 * instanceCount);

        for (let i = 0; i < instanceCount; i++) {
            const r = (id & 0xff0000) >> 16;
            const g = (id & 0x00ff00) >> 8;
            const b = (id & 0x0000ff) >> 0;
            onInstance(i, id);

            colorData[i * 4] = r / 255.0;
            colorData[i * 4 + 1] = g / 255.0;
            colorData[i * 4 + 2] = b / 255.0;
            colorData[i * 4 + 3] = 1.0;
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
                if (this._pickingTexure) {
                    this._pickingTexure.setMaterialForRendering(mesh, undefined);
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
            if (this._pickingTexure) {
                this._pickingTexure.renderList = [];
            }
        }
        if (!list || list.length === 0) {
            return;
        }

        // Prepare target
        const scene = ("mesh" in list[0] ? list[0].mesh : list[0]).getScene();
        const engine = scene.getEngine();
        const rttSizeW = engine.getRenderWidth();
        const rttSizeH = engine.getRenderHeight();
        if (!this._pickingTexure) {
            this._createRenderTarget(scene, rttSizeW, rttSizeH);
        } else {
            const size = this._pickingTexure.getSize();

            if (size.width !== rttSizeW || size.height !== rttSizeH || this._cachedScene !== scene) {
                this._createRenderTarget(scene, rttSizeW, rttSizeH);
            }
        }

        if (!this._cachedScene || this._cachedScene !== scene) {
            this._createColorMaterial(scene);
        }

        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if ("mesh" in item) {
                this._meshMaterialMap.set(item.mesh, item.material);
                list[i] = item.mesh;
            } else {
                this._meshMaterialMap.set(item, this._defaultRenderMaterial!);
            }
        }
        this._pickableMeshes = list as Array<AbstractMesh>;

        this._cachedScene = scene;
        this._pickingTexure!.renderList = [];

        // We will affect colors and create vertex color buffers
        let id = 1;
        for (let index = 0; index < this._pickableMeshes.length; index++) {
            const mesh = this._pickableMeshes[index];
            const material = this._meshMaterialMap.get(mesh)!;

            if (material !== this._defaultRenderMaterial) {
                material.onBindObservable.add(this._materialBindCallback, undefined, undefined, this);
            }
            this._pickingTexure!.setMaterialForRendering(mesh, material);
            this._pickingTexure!.renderList.push(mesh);

            if (mesh.isAnInstance) {
                continue; // This will be handled by the source mesh
            }

            const r = (id & 0xff0000) >> 16;
            const g = (id & 0x00ff00) >> 8;
            const b = (id & 0x0000ff) >> 0;

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
                    const colorData = this._generateColorData(instances.length, id, index, r, g, b, (i, id) => {
                        const instance = instances[i];
                        this._idMap[id] = this._pickableMeshes.indexOf(instance);
                    });
                    id += instances.length;
                    const engine = mesh.getEngine();

                    const buffer = new VertexBuffer(engine, colorData, this._attributeName, false, false, 4, true);
                    (mesh as Mesh).setVerticesBuffer(buffer, true);
                } else {
                    this._idColors[mesh.uniqueId] = Color3.FromInts(r, g, b);
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
    public pickAsync(x: number, y: number, disposeWhenDone = false): Promise<Nullable<IGPUPickingInfo>> {
        if (!this._pickableMeshes || this._pickableMeshes.length === 0) {
            return Promise.resolve(null);
        }

        const scene = this._cachedScene!;
        const engine = scene.getEngine();
        const rttSizeW = engine.getRenderWidth();
        const rttSizeH = engine.getRenderHeight();
        const devicePixelRatio = 1 / engine._hardwareScalingLevel;

        if (!this._readbuffer) {
            this._readbuffer = new Uint8Array(engine.isWebGPU ? 256 : 4); // Because of block alignment in WebGPU
        }

        // Do we need to rebuild the RTT?
        const size = this._pickingTexure!.getSize();

        if (size.width !== rttSizeW || size.height !== rttSizeH) {
            this._createRenderTarget(scene, rttSizeW, rttSizeH);

            this._pickingTexure!.renderList = [];
            for (let index = 0; index < this._pickableMeshes.length; index++) {
                const mesh = this._pickableMeshes[index];
                this._pickingTexure!.setMaterialForRendering(mesh, this._meshMaterialMap.get(mesh)!);
                this._pickingTexure!.renderList.push(mesh);
            }
        }

        this._meshRenderingCount = 0;
        // Ensure ints and adapt to screen resolution
        x = (devicePixelRatio * x) >> 0;
        y = (devicePixelRatio * y) >> 0;

        if (x < 0 || y < 0 || x >= rttSizeW || y >= rttSizeH) {
            return Promise.resolve(null);
        }

        // Invert Y
        y = rttSizeH - y - 1;

        this._pickingTexure!.clearColor = new Color4(0, 0, 0, 0);

        scene.customRenderTargets.push(this._pickingTexure!);
        this._pickingTexure!.onBeforeRender = () => {
            // Enable scissor
            if ((engine as WebGPUEngine | Engine).enableScissor) {
                (engine as WebGPUEngine | Engine).enableScissor(x, y, 1, 1);
            }
        };

        return new Promise((resolve, reject) => {
            this._pickingTexure!.onAfterRender = async () => {
                // Disable scissor
                if ((engine as WebGPUEngine | Engine).disableScissor) {
                    (engine as WebGPUEngine | Engine).disableScissor();
                }

                if (!this._pickingTexure) {
                    reject();
                }

                let pickedMesh: Nullable<AbstractMesh> = null;
                let thinInstanceIndex: number | undefined = undefined;
                const wasSuccessfull = this._meshRenderingCount > 0;

                if (wasSuccessfull) {
                    // Remove from the active RTTs
                    const index = scene.customRenderTargets.indexOf(this._pickingTexure!);
                    if (index > -1) {
                        scene.customRenderTargets.splice(index, 1);
                    }

                    // Do the actual picking
                    if (await this._readTexturePixelsAsync(x, y)) {
                        const r = this._readbuffer[0];
                        const g = this._readbuffer[1];
                        const b = this._readbuffer[2];
                        const colorId = (r << 16) + (g << 8) + b;

                        // Thin?
                        if (this._thinIdMap[colorId]) {
                            pickedMesh = this._pickableMeshes[this._thinIdMap[colorId].meshId];
                            thinInstanceIndex = this._thinIdMap[colorId].thinId;
                        } else {
                            pickedMesh = this._pickableMeshes[this._idMap[colorId]];
                        }
                    }
                }

                // Clean-up
                if (!wasSuccessfull) {
                    this._meshRenderingCount = 0;
                    return; // We need to wait for the shaders to be ready
                } else {
                    if (disposeWhenDone) {
                        this.dispose();
                    }
                    if (pickedMesh) {
                        resolve({ mesh: pickedMesh, thinInstanceIndex: thinInstanceIndex });
                    } else {
                        resolve(null);
                    }
                }
            };
        });
    }

    /**
     * Execute a picking operation on multiple coordinates
     * @param xy defines the X,Y coordinates where to run the pick
     * @param disposeWhenDone defines a boolean indicating we do not want to keep resources alive (false by default)
     * @returns A promise with the picking results. Always returns an array with the same length as the number of coordinates. The mesh or null at the the index where no mesh was picked.
     */
    public async multiPickAsync(xy: { x: number; y: number }[], disposeWhenDone = false): Promise<Nullable<IGPUMultiPickingInfo>> {
        if (!this._pickableMeshes || this._pickableMeshes.length === 0) {
            return Promise.resolve(null);
        }

        if (xy.length === 0) {
            Promise.resolve(null);
        }

        if (xy.length === 1) {
            Promise.resolve([await this.pickAsync(xy[0].x, xy[0].y, disposeWhenDone)]);
        }

        // get min, max to do a partial cut
        let minX = xy[0].x;
        let maxX = xy[0].x;
        let minY = xy[0].y;
        let maxY = xy[0].y;

        for (let i = 1; i < xy.length; i++) {
            const point = xy[i];
            if (point.x < minX) minX = point.x;
            if (point.x > maxX) maxX = point.x;
            if (point.y < minY) minY = point.y;
            if (point.y > maxY) maxY = point.y;
        }

        const scene = this._cachedScene!;
        const engine = scene.getEngine();
        const devicePixelRatio = 1 / engine._hardwareScalingLevel;

        // Ensure ints and adapt to screen resolution
        minX = (devicePixelRatio * minX) >> 0;
        maxX = (devicePixelRatio * maxX) >> 0;
        minY = (devicePixelRatio * minY) >> 0;
        maxY = (devicePixelRatio * maxY) >> 0;

        let w = maxX - minX;
        let h = maxY - minY;
        w = w === 0 ? 1 : w;
        h = h === 0 ? 1 : h;

        const rttSizeW = engine.getRenderWidth();
        const rttSizeH = engine.getRenderHeight();

        const partialCutH = rttSizeH - maxY - 1;

        if (!this._readbuffer || this._readbuffer.length < 4 * w * h) {
            // TODO: calc webgpu Math.ceil(bytesPerRow / 256) * 256
            this._readbuffer = new Uint8Array(engine.isWebGPU ? 256 : 4 * w * h); // Because of block alignment in WebGPU
        }

        // Do we need to rebuild the RTT?
        const size = this._pickingTexure!.getSize();

        if (size.width !== rttSizeW || size.height !== rttSizeH) {
            this._createRenderTarget(scene, rttSizeW, rttSizeH);

            this._pickingTexure!.renderList = [];
            for (let index = 0; index < this._pickableMeshes.length; index++) {
                const mesh = this._pickableMeshes[index];
                this._pickingTexure!.setMaterialForRendering(mesh, this._meshMaterialMap.get(mesh)!);
                this._pickingTexure!.renderList.push(mesh);
            }
        }

        this._meshRenderingCount = 0;
        this._pickingTexure!.clearColor = new Color4(0, 0, 0, 0);

        scene.customRenderTargets.push(this._pickingTexure!);
        this._pickingTexure!.onBeforeRender = () => {
            // Enable scissor
            if ((engine as WebGPUEngine | Engine).enableScissor) {
                (engine as WebGPUEngine | Engine).enableScissor(minX, partialCutH, w, h);
            }
        };

        return new Promise((resolve, reject) => {
            this._pickingTexure!.onAfterRender = async () => {
                // Disable scissor
                if ((engine as WebGPUEngine | Engine).disableScissor) {
                    (engine as WebGPUEngine | Engine).disableScissor();
                }

                if (!this._pickingTexure) {
                    reject();
                }

                const pickedMeshes: Nullable<AbstractMesh>[] = [];
                const thinInstanceIndexes: number[] = [];
                const wasSuccessfull = this._meshRenderingCount > 0;

                if (wasSuccessfull) {
                    // Remove from the active RTTs
                    const index = scene.customRenderTargets.indexOf(this._pickingTexure!);
                    if (index > -1) {
                        scene.customRenderTargets.splice(index, 1);
                    }

                    // Do the actual picking
                    if (await this._readTexturePixelsAsync(minX, partialCutH, w, h)) {
                        // if (await this._readTexturePixelsAsync(0, 0, rttSizeW, rttSizeH)) {
                        const idxs = [];
                        for (let i = 0; i < this._readbuffer.length; i++) {
                            if (this._readbuffer[i] > 0) {
                                idxs.push(i);
                            }
                        }

                        for (let i = 0; i < xy.length; i++) {
                            let x = xy[i].x;
                            let y = xy[i].y;

                            // Ensure ints and adapt to screen resolution
                            x = (devicePixelRatio * x) >> 0;
                            y = (devicePixelRatio * y) >> 0;

                            if (x < 0 || y < 0 || x >= rttSizeW || y >= rttSizeH) {
                                continue;
                            }

                            let offsetX = x - minX - 1;
                            offsetX = offsetX < 0 ? 0 : offsetX;
                            const offset = offsetX * 4 + (maxY - y) * w * 4;

                            const r = this._readbuffer[offset];
                            const g = this._readbuffer[offset + 1];
                            const b = this._readbuffer[offset + 2];
                            const colorId = (r << 16) + (g << 8) + b;

                            // Thin?
                            if (colorId > 0) {
                                if (this._thinIdMap[colorId]) {
                                    pickedMeshes.push(this._pickableMeshes[this._thinIdMap[colorId].meshId]);
                                    thinInstanceIndexes.push(this._thinIdMap[colorId].thinId);
                                } else {
                                    pickedMeshes.push(this._pickableMeshes[this._idMap[colorId]]);
                                }
                            } else {
                                pickedMeshes.push(null);
                            }
                        }
                    }
                }

                // Clean-up
                if (!wasSuccessfull) {
                    this._meshRenderingCount = 0;
                    return; // We need to wait for the shaders to be ready
                } else {
                    if (disposeWhenDone) {
                        this.dispose();
                    }
                    resolve({ meshes: pickedMeshes, thinInstanceIndexes: thinInstanceIndexes });
                }
            };
        });
    }

    private async _readTexturePixelsAsync(x: number, y: number, w = 1, h = 1) {
        if (!this._cachedScene || !this._pickingTexure?._texture) {
            return false;
        }
        const engine = this._cachedScene.getEngine();
        await engine._readTexturePixels(this._pickingTexure._texture, w, h, -1, 0, this._readbuffer, true, true, x, y);

        return true;
    }

    /** Release the resources */
    public dispose() {
        this.setPickingList(null);
        this._cachedScene = null;

        // Cleaning up
        this._pickingTexure?.dispose();
        this._pickingTexure = null;
        this._defaultRenderMaterial?.dispose();
        this._defaultRenderMaterial = null;
    }
}
