import { Constants } from "core/Engines/constants";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import type { Material } from "core/Materials/material";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Color3, Color4 } from "core/Maths/math.color";
import type { Mesh } from "core/Meshes/mesh";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

/**
 * Class used to perform a picking operation using GPU
 */
export class GPUPicker {
    private _pickingTexure: Nullable<RenderTargetTexture> = null;
    private _idMap: { [key: string]: number } = {};
    private _idColors: Array<Color3> = [];
    private _cachedMaterials: Array<Nullable<Material>> = [];
    private _cachedScene: Nullable<Scene>;
    private _renderMaterial: Nullable<StandardMaterial>;
    private _pickableMeshes: Array<Mesh>;

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

    /**
     * Execute a picking operation
     * @param x defines the X coordinates where to run the pick
     * @param y defines the Y coordinates where to run the pick
     * @param scene defines the scene to pick from
     * @param disposeWhenDone defines a boolean indicating we do not want to keep resources alive
     * @returns A promise with the picking results
     */
    public pickAsync(x: number, y: number, scene: Scene, disposeWhenDone = true): Promise<Nullable<Mesh>> {
        const engine = scene.getEngine();
        const rttSizeW = engine.getRenderWidth();
        const rttSizeH = engine.getRenderHeight();
        let meshRenderingCount = 0;

        if (x < 0 || y < 0 || x >= rttSizeW || y >= rttSizeH) {
            return Promise.resolve(null);
        }

        // Invert Y
        y = rttSizeH - y;

        if (!this._pickingTexure) {
            this._createRenderTarget(scene, rttSizeH, rttSizeH);
        } else {
            const size = this._pickingTexure.getSize();

            if (size.width !== rttSizeW || size.height !== rttSizeW || this._cachedScene !== scene) {
                this._pickingTexure.dispose();
                this._createRenderTarget(scene, rttSizeH, rttSizeH);
            }
        }

        if (!this._cachedScene || this._cachedScene !== scene) {
            this._renderMaterial = new StandardMaterial("pickingMaterial", scene);
            this._renderMaterial.disableLighting = true;
            this._renderMaterial.emissiveColor = Color3.White();
        }

        this._cachedScene = scene;
        scene.customRenderTargets.push(this._pickingTexure!);
        this._pickingTexure!.renderList = [];
        this._pickingTexure!.clearColor = new Color4(0, 0, 0, 0);

        const callback = (mesh: Mesh) => {
            if (!this._renderMaterial) {
                return;
            }
            this._renderMaterial.emissiveColor = this._idColors[mesh.uniqueId];
        };

        const countCallback = () => {
            meshRenderingCount++;
        };

        // We need to give every mesh an unique color
        this._pickingTexure!.onBeforeRender = () => {
            this._pickableMeshes = scene.meshes.filter((m) => (m as Mesh).geometry && m.isPickable && (m as Mesh).onBeforeRenderObservable) as Mesh[];
            let r = 1;
            let g = 1;
            let b = 1;

            for (let index = 0; index < this._pickableMeshes.length; index++) {
                const mesh = this._pickableMeshes[index];
                this._idMap[`${r}_${g}_${b}`] = index;

                this._cachedMaterials[index] = mesh.material;
                this._idColors[mesh.uniqueId] = Color3.FromInts(r, g, b);

                mesh.onBeforeRenderObservable.add(callback);
                mesh.onBeforeDrawObservable.add(countCallback);

                mesh.material = this._renderMaterial;
                mesh.useVertexColors = true;
                mesh.hasVertexAlpha = false;

                this._pickingTexure?.renderList?.push(mesh);

                if (r < 255) {
                    r++;
                    continue;
                }
                if (g < 255) {
                    g++;
                    continue;
                }
                if (b < 255) {
                    b++;
                    continue;
                }
            }
        };

        return new Promise((resolve, reject) => {
            this._pickingTexure!.onAfterRender = () => {
                if (!this._pickingTexure) {
                    reject();
                }

                let pickedMesh: Nullable<Mesh> = null;
                const wasSuccessfull = meshRenderingCount > 0;

                // Restore materials
                for (let index = 0; index < this._pickableMeshes.length; index++) {
                    const mesh = this._pickableMeshes[index];
                    mesh.onBeforeRenderObservable.removeCallback(callback);
                    mesh.onBeforeDrawObservable.removeCallback(countCallback);
                    mesh.material = this._cachedMaterials[index];
                }

                if (wasSuccessfull) {
                    // Remove from the active RTTs
                    const index = scene.customRenderTargets.indexOf(this._pickingTexure!);
                    if (index > -1) {
                        scene.customRenderTargets.splice(index, 1);
                    }

                    // Do the actual picking
                    const pixels = this._readTexturePixels(x, y);
                    if (pixels) {
                        const colorId = `${pixels[0]}_${pixels[1]}_${pixels[2]}`;
                        console.log(colorId);
                        pickedMesh = this._pickableMeshes[this._idMap[colorId]];
                    }
                }

                // Clean-up
                this._idMap = {};
                this._idColors = [];

                this._pickableMeshes = [];
                this._pickingTexure!.renderList = [];

                if (!wasSuccessfull) {
                    meshRenderingCount = 0;
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

    private _readTexturePixels(x: number, y: number): Nullable<Uint8Array> {
        if (!this._cachedScene || !this._pickingTexure?._texture) {
            return null;
        }
        const engine = this._cachedScene.getEngine();
        const buffer = engine._readTexturePixelsSync(this._pickingTexure._texture, 1, 1, -1, 0, null, true, false, x, y);

        return buffer as Uint8Array;
    }

    /** Release the resources */
    public dispose() {
        this._cachedScene = null;

        // Cleaning up
        this._pickingTexure?.dispose();
        this._pickingTexure = null;
        this._renderMaterial?.dispose();
        this._renderMaterial = null;
    }
}
