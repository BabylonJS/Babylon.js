import { Constants } from "core/Engines/constants";
import type { Engine } from "core/Engines/engine";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import type { Material } from "core/Materials/material";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { Color3, Color4 } from "core/Maths/math.color";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { VertexBuffer } from "core/Meshes/buffer";
import type { Mesh } from "core/Meshes/mesh";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

/**
 * Class used to perform a picking operation using GPU
 * Please note that GPUPIcker cannot pick instances, only meshes
 */
export class GPUPicker {
    private _pickingTexure: Nullable<RenderTargetTexture> = null;
    private _idMap: { [key: string]: number } = {};
    private _idColors: Array<Color3> = [];
    private _cachedMaterials: Array<Nullable<Material>> = [];
    private _cachedScene: Nullable<Scene>;
    private _renderMaterial: Nullable<ShaderMaterial>;
    private _pickableMeshes: Array<AbstractMesh>;
    private _readbuffer: Uint8Array;
    private _meshRenderingCount: number = 0;
    private _userDefinedList = false;

    private _createRenderTarget(scene: Scene, width: number, height: number) {
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
        if (this._renderMaterial) {
            this._renderMaterial.dispose();
        }

        const defines: string[] = [];
        const options = {
            attributes: [VertexBuffer.PositionKind],
            uniforms: ["world", "viewProjection", "color"],
            needAlphaBlending: false,
            defines: defines,
            useClipPlane: null,
        };

        this._renderMaterial = new ShaderMaterial("colorShader", scene, "color", options, false);

        const callback = (mesh: AbstractMesh | undefined) => {
            if (!mesh) {
                return;
            }

            const effect = this._renderMaterial!.getEffect();

            if (!mesh.hasInstances && !mesh.isAnInstance) {
                effect.setColor4("color", this._idColors[mesh.uniqueId], 1);
            }

            this._meshRenderingCount++;
        };

        this._renderMaterial.customBindingObservable.add(callback);
    }

    /**
     * Set the list of meshes to pick from
     * @param list defines the list of meshes to pick from
     */
    public setPickingList(list: Nullable<Array<AbstractMesh>>) {
        if (!list) {
            if (this._userDefinedList) {
                for (let index = 0; index < this._pickableMeshes.length; index++) {
                    const mesh = this._pickableMeshes[index];
                    if (mesh.hasInstances) {
                        (mesh as Mesh).removeVerticesData(VertexBuffer.ColorKind);
                    }
                }
            }
            this._userDefinedList = false;
            this._pickableMeshes = [];
            this._idMap = {};
            this._idColors = [];
            return;
        }
        this._userDefinedList = true;
        this._pickableMeshes = list;

        // We will affect colors and create vertex color buffers
        let id = 1;
        for (let index = 0; index < this._pickableMeshes.length; index++) {
            const mesh = this._pickableMeshes[index];
            mesh.useVertexColors = false;

            if (mesh.isAnInstance) {
                continue; // This will be handled by the source mesh
            }

            const r = (id & 0xff0000) >> 16;
            const g = (id & 0x00ff00) >> 8;
            const b = (id & 0x0000ff) >> 0;
            this._idMap[`${r}_${g}_${b}`] = index;
            id++;

            if (mesh.hasInstances) {
                const instances = (mesh as Mesh).instances;
                const colorData = new Float32Array(4 * (instances.length + 1));
                const engine = mesh.getEngine();

                colorData[0] = r / 255.0;
                colorData[1] = g / 255.0;
                colorData[2] = b / 255.0;
                colorData[3] = 1.0;
                for (let i = 0; i < instances.length; i++) {
                    const instance = instances[i];
                    const r = (id & 0xff0000) >> 16;
                    const g = (id & 0x00ff00) >> 8;
                    const b = (id & 0x0000ff) >> 0;
                    this._idMap[`${r}_${g}_${b}`] = this._pickableMeshes.indexOf(instance);

                    colorData[(i + 1) * 4] = r / 255.0;
                    colorData[(i + 1) * 4 + 1] = g / 255.0;
                    colorData[(i + 1) * 4 + 2] = b / 255.0;
                    colorData[(i + 1) * 4 + 3] = 1.0;
                    id++;
                }

                const buffer = new VertexBuffer(engine, colorData, VertexBuffer.ColorKind, false, false, 4, true);
                (mesh as Mesh).setVerticesBuffer(buffer, true);
            } else {
                this._idColors[mesh.uniqueId] = Color3.FromInts(r, g, b);
            }
        }
    }

    /**
     * Execute a picking operation
     * @param x defines the X coordinates where to run the pick
     * @param y defines the Y coordinates where to run the pick
     * @param scene defines the scene to pick from
     * @param disposeWhenDone defines a boolean indicating we do not want to keep resources alive
     * @returns A promise with the picking results
     */
    public pickAsync(x: number, y: number, scene: Scene, disposeWhenDone = true): Promise<Nullable<AbstractMesh>> {
        const engine = scene.getEngine();
        const rttSizeW = engine.getRenderWidth();
        const rttSizeH = engine.getRenderHeight();

        if (!this._readbuffer) {
            this._readbuffer = new Uint8Array(engine.isWebGPU ? 256 : 4); // Because of block alignment in WebGPU
        }

        this._meshRenderingCount = 0;
        // Ensure ints
        x = x >> 0;
        y = y >> 0;

        if (x < 0 || y < 0 || x >= rttSizeW || y >= rttSizeH) {
            return Promise.resolve(null);
        }

        // Invert Y
        y = rttSizeH - y;

        if (!this._pickingTexure) {
            this._createRenderTarget(scene, rttSizeW, rttSizeH);
        } else {
            const size = this._pickingTexure.getSize();

            if (size.width !== rttSizeW || size.height !== rttSizeH || this._cachedScene !== scene) {
                this._pickingTexure.dispose();
                this._createRenderTarget(scene, rttSizeW, rttSizeH);
            }
        }

        if (!this._cachedScene || this._cachedScene !== scene) {
            this._createColorMaterial(scene);
        }

        this._cachedScene = scene;
        scene.customRenderTargets.push(this._pickingTexure!);
        this._pickingTexure!.renderList = [];
        this._pickingTexure!.clearColor = new Color4(0, 0, 0, 0);

        // We need to give every mesh an unique color (when there is no picking list)
        this._pickingTexure!.onBeforeRender = () => {
            if (!this._userDefinedList) {
                this._pickableMeshes = scene.meshes.filter((m) => (m as Mesh).geometry && m.isPickable) as Mesh[];
            }

            for (let index = 0; index < this._pickableMeshes.length; index++) {
                const mesh = this._pickableMeshes[index];
                if (!mesh.isAnInstance) {
                    this._cachedMaterials[index] = mesh.material;
                    if (!this._userDefinedList) {
                        // We need to define the color for each mesh as it was not previously defined
                        const id = index + 1;
                        const r = (id & 0xff0000) >> 16;
                        const g = (id & 0x00ff00) >> 8;
                        const b = (id & 0x0000ff) >> 0;
                        this._idMap[`${r}_${g}_${b}`] = index;

                        this._idColors[mesh.uniqueId] = Color3.FromInts(r, g, b);
                    } else {
                        mesh.useVertexColors = true; // In that case we will be using vertex colors and not an uniform to support instances
                    }
                    mesh.material = this._renderMaterial;
                }
                this._pickingTexure?.renderList?.push(mesh);
            }

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
                const wasSuccessfull = this._meshRenderingCount > 0;

                // Restore materials
                for (let index = 0; index < this._pickableMeshes.length; index++) {
                    const mesh = this._pickableMeshes[index];
                    if (!mesh.isAnInstance) {
                        mesh.material = this._cachedMaterials[index];

                        if (this._userDefinedList) {
                            mesh.useVertexColors = false;
                        }
                    }
                }

                if (wasSuccessfull) {
                    // Remove from the active RTTs
                    const index = scene.customRenderTargets.indexOf(this._pickingTexure!);
                    if (index > -1) {
                        scene.customRenderTargets.splice(index, 1);
                    }

                    // Do the actual picking
                    if (await this._readTexturePixelsAsync(x, y)) {
                        const colorId = `${this._readbuffer[0]}_${this._readbuffer[1]}_${this._readbuffer[2]}`;
                        pickedMesh = this._pickableMeshes[this._idMap[colorId]];
                    }
                }

                // Clean-up
                if (!this._userDefinedList) {
                    this._idMap = {};
                    this._idColors = [];

                    this._pickableMeshes = [];
                }
                this._pickingTexure!.renderList = [];

                if (!wasSuccessfull) {
                    this._meshRenderingCount = 0;
                    return; // We need to wait for the shaders to be ready
                } else {
                    if (disposeWhenDone) {
                        this.dispose();
                    }
                    resolve(pickedMesh);
                }
            };
        });
    }

    private async _readTexturePixelsAsync(x: number, y: number) {
        if (!this._cachedScene || !this._pickingTexure?._texture) {
            return false;
        }
        const engine = this._cachedScene.getEngine();
        await engine._readTexturePixels(this._pickingTexure._texture, 1, 1, -1, 0, this._readbuffer, true, true, x, y);

        return true;
    }

    /** Release the resources */
    public dispose() {
        if (this._userDefinedList) {
            this.setPickingList(null);
        }
        this._pickableMeshes = [];
        this._cachedScene = null;

        // Cleaning up
        this._pickingTexure?.dispose();
        this._pickingTexure = null;
        this._renderMaterial?.dispose();
        this._renderMaterial = null;
    }
}
