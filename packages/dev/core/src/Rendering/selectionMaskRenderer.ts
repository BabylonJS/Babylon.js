import type { Camera } from "../Cameras/camera";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { Constants } from "../Engines/constants";
import type { Effect } from "../Materials/effect";
import { ShaderLanguage } from "../Materials/shaderLanguage";
import type { IShaderMaterialOptions } from "../Materials/shaderMaterial";
import { ShaderMaterial } from "../Materials/shaderMaterial";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Color4 } from "../Maths/math.color";
import type { Matrix } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { VertexBuffer } from "../Meshes/buffer";
import type { InstancedMesh } from "../Meshes/instancedMesh";
import type { Mesh } from "../Meshes/mesh";
import type { SubMesh } from "../Meshes/subMesh";
import type { Observer } from "../Misc/observable";
import type { Scene } from "../scene";
import type { Nullable } from "../types";

/**
 * Selection material used to generate the selection mask
 *
 * Selection material use r and g channels to store the selection ID and depth information
 */
class SelectionMaterial extends ShaderMaterial {
    private readonly _meshUniqueIdToSelectionId: number[];

    /**
     * Constructs a new selection mask material
     * @param name The name of the material
     * @param scene The scene the material belongs to
     * @param shaderLanguage The shader language to use
     * @param meshUniqueIdToSelectionId Mapping from mesh unique IDs to selection IDs
     */
    public constructor(name: string, scene: Scene, shaderLanguage: ShaderLanguage, meshUniqueIdToSelectionId: number[]) {
        const defines: string[] = [];
        const options: Partial<IShaderMaterialOptions> = {
            attributes: [VertexBuffer.PositionKind, SelectionMaskRenderer.InstanceSelectionIdAttributeName],
            uniforms: ["world", "viewProjection", "view", "selectionId"],
            needAlphaBlending: false,
            defines: defines,
            useClipPlane: null,
            shaderLanguage: shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this.shaderLanguage === ShaderLanguage.WGSL) {
                    await Promise.all([import("../ShadersWGSL/selection.fragment"), import("../ShadersWGSL/selection.vertex")]);
                } else {
                    await Promise.all([import("../Shaders/selection.fragment"), import("../Shaders/selection.vertex")]);
                }
            },
        };
        super(name, scene, "selection", options, false);

        this._meshUniqueIdToSelectionId = meshUniqueIdToSelectionId;
    }

    /**
     * Binds the material to the mesh
     * @param world The world matrix
     * @param mesh The mesh to bind the material to
     * @param effectOverride An optional effect override
     * @param subMesh The submesh to bind the material to
     */
    public override bind(world: Matrix, mesh?: AbstractMesh, effectOverride?: Nullable<Effect>, subMesh?: SubMesh): void {
        super.bind(world, mesh, effectOverride, subMesh);
        if (!mesh) {
            return;
        }

        const storeEffectOnSubMeshes = subMesh && this._storeEffectOnSubMeshes;
        const effect = effectOverride ?? (storeEffectOnSubMeshes ? subMesh.effect : this.getEffect());

        if (!effect) {
            return;
        }

        if (!mesh.hasInstances && !mesh.isAnInstance && this._meshUniqueIdToSelectionId[mesh.uniqueId] !== undefined) {
            const selectionId = this._meshUniqueIdToSelectionId[mesh.uniqueId];
            effect.setFloat("selectionId", selectionId);
        }
    }
}

/**
 * Selection mask renderer
 *
 * Renders selected objects to a mask texture where r and g channels store selection ID and depth information
 */
export class SelectionMaskRenderer {
    /**
     * Name of the instance selection ID attribute
     * @internal
     */
    public static readonly InstanceSelectionIdAttributeName = "instanceSelectionId";

    private readonly _name: string;
    private readonly _scene: Scene;
    private _maskTexture: Nullable<RenderTargetTexture>;
    private _isRttAddedToScene;

    private _resizeObserver: Nullable<Observer<AbstractEngine>>;

    private readonly _meshUniqueIdToSelectionId: number[] = [];

    private readonly _selectionMaterialCache: Nullable<SelectionMaterial>[] = new Array(9).fill(null);
    private readonly _selection: AbstractMesh[] = [];

    private _nextSelectionId = 1;

    /** Shader language used by the generator */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language used in this generator.
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    /**
     * Constructs a new selection mask renderer
     * @param name Name of the render target
     * @param scene The scene the renderer belongs to
     * @param camera The camera to be used to render the depth map (default: scene's active camera)
     */
    public constructor(name: string, scene: Scene, camera: Nullable<Camera> = null) {
        this._name = name;
        this._scene = scene;

        const engine = scene.getEngine();

        if (engine.isWebGPU) {
            this._shaderLanguage = ShaderLanguage.WGSL;
        }

        this._maskTexture = new RenderTargetTexture(name, { width: engine.getRenderWidth(), height: engine.getRenderHeight() }, this._scene, {
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            format: Constants.TEXTUREFORMAT_RG,
        });
        this._maskTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this._maskTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this._maskTexture.refreshRate = 1;
        this._maskTexture.renderParticles = false;
        this._maskTexture.renderList = null;
        this._maskTexture.noPrePassRenderer = true;
        this._maskTexture.clearColor = new Color4(0, 0, 1, 1);

        this._maskTexture.activeCamera = camera;
        this._maskTexture.ignoreCameraViewport = true;
        this._maskTexture.useCameraPostProcesses = false;

        this._isRttAddedToScene = false;
        // this._scene.customRenderTargets.push(this._maskTexture);

        this._resizeObserver = engine.onResizeObservable.add(() => {
            this._maskTexture?.resize({ width: engine.getRenderWidth(), height: engine.getRenderHeight() });
        });
    }

    /**
     * Disposes the selection mask renderer
     */
    public dispose(): void {
        this.clearSelection();

        if (this._maskTexture !== null) {
            this._removeRenderTargetFromScene();
            this._maskTexture.dispose();
            this._maskTexture = null;
        }
        this._clearSelectionMaterials();

        this._resizeObserver?.remove();
        this._resizeObserver = null;
    }

    private _clearSelectionMaterials(): void {
        for (let i = 0; i < this._selectionMaterialCache.length; ++i) {
            const material = this._selectionMaterialCache[i];
            if (material !== null) {
                material.dispose();
                this._selectionMaterialCache[i] = null;
            }
        }
    }

    private _getSelectionMaterial(scene: Scene, fillMode: number): SelectionMaterial {
        if (fillMode < 0 || 8 < fillMode) {
            fillMode = Constants.MATERIAL_TriangleFillMode;
        }

        const cachedMaterial = this._selectionMaterialCache[fillMode];
        if (cachedMaterial) {
            return cachedMaterial;
        }

        const engine = scene.getEngine();

        if (engine.isWebGPU) {
            this._shaderLanguage = ShaderLanguage.WGSL;
        }

        const newMaterial = new SelectionMaterial(this._name + "_selection_material", scene, this._shaderLanguage, this._meshUniqueIdToSelectionId);
        newMaterial.fillMode = fillMode;
        newMaterial.backFaceCulling = false;

        this._selectionMaterialCache[fillMode] = newMaterial;
        return newMaterial;
    }

    private _addRenderTargetToScene(): void {
        if (this._isRttAddedToScene) {
            return;
        }
        this._scene.customRenderTargets.push(this._maskTexture!);
        this._isRttAddedToScene = true;
    }

    private _removeRenderTargetFromScene(): void {
        if (!this._isRttAddedToScene) {
            return;
        }
        const index = this._scene.customRenderTargets.indexOf(this._maskTexture!);
        if (index !== -1) {
            this._scene.customRenderTargets.splice(index, 1);
        }
        this._isRttAddedToScene = false;
    }

    /**
     * Clears the current selection
     * @param removeRenderTargetFromScene If true, removes the render target from the scene's custom render targets
     */
    public clearSelection(removeRenderTargetFromScene = true): void {
        if (this._selection.length === 0) {
            return;
        }

        for (let index = 0; index < this._selection.length; ++index) {
            const mesh = this._selection[index];
            if (mesh.hasInstances) {
                (mesh as Mesh).removeVerticesData(SelectionMaskRenderer.InstanceSelectionIdAttributeName);
            }
            if (this._maskTexture) {
                this._maskTexture.setMaterialForRendering(mesh, undefined);
            }
        }
        this._selection.length = 0;
        this._meshUniqueIdToSelectionId.length = 0;
        if (this._maskTexture) {
            this._maskTexture.renderList = [];
        }

        this._nextSelectionId = 1;
        if (removeRenderTargetFromScene) {
            this._removeRenderTargetFromScene();
        }
    }

    /**
     * Adds meshe or group of meshes to the current selection
     *
     * If a group of meshes is provided, they will outline as a single unit
     * @param meshes Meshes to add to the selection
     */
    public addSelection(meshes: (AbstractMesh | AbstractMesh[])[]): void {
        if (meshes.length === 0) {
            return;
        }

        // prepare target texture
        const maskTexture = this._maskTexture;
        if (!maskTexture) {
            return; // if disposed
        }

        let nextId = this._nextSelectionId;
        for (let groupIndex = 0; groupIndex < meshes.length; ++groupIndex) {
            const meshOrGroup = meshes[groupIndex];
            const id = nextId;
            nextId += 1;

            const group = Array.isArray(meshOrGroup) ? meshOrGroup : [meshOrGroup];
            for (let meshIndex = 0; meshIndex < group.length; ++meshIndex) {
                const mesh = group[meshIndex];

                const material = this._getSelectionMaterial(this._scene, mesh.material?.fillMode ?? Constants.MATERIAL_TriangleFillMode);
                maskTexture.setMaterialForRendering(group, material);
                this._selection.push(mesh); // add to render list

                if (mesh.hasInstances || mesh.isAnInstance) {
                    const sourceMesh = (mesh as InstancedMesh).sourceMesh ?? (mesh as Mesh);

                    if (sourceMesh.instancedBuffers?.[SelectionMaskRenderer.InstanceSelectionIdAttributeName] === undefined) {
                        sourceMesh.registerInstancedBuffer(SelectionMaskRenderer.InstanceSelectionIdAttributeName, 1);
                        // todo: consider unregistering buffer on dispose
                    }

                    mesh.instancedBuffers[SelectionMaskRenderer.InstanceSelectionIdAttributeName] = id;
                } else {
                    this._meshUniqueIdToSelectionId[mesh.uniqueId] = id;
                }
            }
        }
        this._nextSelectionId = nextId;

        maskTexture.renderList = [...this._selection];
        this._addRenderTargetToScene();
    }

    /**
     * Sets the current selection, replacing any previous selection
     *
     * If a group of meshes is provided, they will outline as a single unit
     * @param meshes Meshes to set as the current selection
     */
    public setSelection(meshes: (AbstractMesh | AbstractMesh[])[]): void {
        this.clearSelection(false);
        this.addSelection(meshes);
    }

    /**
     * Gets the mask texture. if renderer has been disposed, null is returned
     * @returns The mask texture
     */
    public getMaskTexture(): Nullable<RenderTargetTexture> {
        return this._maskTexture;
    }
}
