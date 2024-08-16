import { Constants } from "core/Engines/constants";
import type { Engine } from "core/Engines/engine";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { IShaderMaterialOptions } from "core/Materials/shaderMaterial";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { Color3, Color4 } from "core/Maths/math.color";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { VertexBuffer } from "core/Meshes/buffer";
import type { Mesh } from "core/Meshes/mesh";
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
 * Class used to perform a picking operation using GPU
 * Please note that GPUPIcker cannot pick instances, only meshes
 */
export class GPUPicker {
    private _pickingTexture: Nullable<RenderTargetTexture> = null;
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

    /** Shader language used by the generator */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language used in this generator.
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
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
            Constants.TEXTURETYPE_UNSIGNED_INT,
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
    public async pickAsync(x: number, y: number, disposeWhenDone = false): Promise<Nullable<IGPUPickingInfo>> {
        if (!this._pickableMeshes || this._pickableMeshes.length === 0) {
            return Promise.resolve(null);
        }

        const scene = this._cachedScene!;
        const engine = scene.getEngine();
        const rttSizeW = engine.getRenderWidth();
        const rttSizeH = engine.getRenderHeight();
        const devicePixelRatio = 1 / engine._hardwareScalingLevel;

        this._meshRenderingCount = 0;

        // Ensure ints and adapt to screen resolution
        x = (devicePixelRatio * x) >> 0;
        y = (devicePixelRatio * y) >> 0;

        if (x < 0 || y < 0 || x >= rttSizeW || y >= rttSizeH) {
            return Promise.resolve(null);
        }

        if (!this._readbuffer) {
            this._readbuffer = new Uint8Array(engine.isWebGPU ? 256 : 4); // Because of block alignment in WebGPU
        }

        // Invert Y
        y = rttSizeH - y;

        this._pickingTexture!.clearColor = new Color4(0, 0, 0, 0);

        this._pickingTexture!.onBeforeRender = () => {
            // Enable scissor
            if ((engine as WebGPUEngine | Engine).enableScissor) {
                (engine as WebGPUEngine | Engine).enableScissor(x, y, 1, 1);
            }
        };

        scene.customRenderTargets.push(this._pickingTexture!);

        // Do we need to rebuild the RTT?
        const size = this._pickingTexture!.getSize();

        if (size.width !== rttSizeW || size.height !== rttSizeH) {
            this._createRenderTarget(scene, rttSizeW, rttSizeH);

            this._pickingTexture!.renderList = [];
            for (let index = 0; index < this._pickableMeshes.length; index++) {
                const mesh = this._pickableMeshes[index];
                this._pickingTexture!.setMaterialForRendering(mesh, this._meshMaterialMap.get(mesh)!);
                this._pickingTexture!.renderList.push(mesh);
            }
        }

        return new Promise((resolve, reject) => {
            this._pickingTexture!.onAfterRender = async () => {
                // Disable scissor
                if ((engine as WebGPUEngine | Engine).disableScissor) {
                    (engine as WebGPUEngine | Engine).disableScissor();
                }

                if (!this._pickingTexture) {
                    reject();
                }

                let pickedMesh: Nullable<AbstractMesh> = null;
                let thinInstanceIndex: number | undefined = undefined;
                const wasSuccessfull = this._meshRenderingCount > 0;

                if (wasSuccessfull) {
                    // Remove from the active RTTs
                    const index = scene.customRenderTargets.indexOf(this._pickingTexture!);
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

    private async _readTexturePixelsAsync(x: number, y: number) {
        if (!this._cachedScene || !this._pickingTexture?._texture) {
            return false;
        }
        const engine = this._cachedScene.getEngine();
        await engine._readTexturePixels(this._pickingTexture._texture, 1, 1, -1, 0, this._readbuffer, true, true, x, y);

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
