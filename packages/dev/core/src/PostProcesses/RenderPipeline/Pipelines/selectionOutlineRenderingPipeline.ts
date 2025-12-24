import { Camera } from "../../../Cameras/camera";
import type { AbstractEngine } from "../../../Engines/abstractEngine";
import { Constants } from "../../../Engines/constants";
import type { Effect } from "../../../Materials/effect";
import { ShaderLanguage } from "../../../Materials/shaderLanguage";
import type { IShaderMaterialOptions } from "../../../Materials/shaderMaterial";
import { ShaderMaterial } from "../../../Materials/shaderMaterial";
import { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture";
import { Color3, Color4 } from "../../../Maths/math.color";
import type { Matrix } from "../../../Maths/math.vector";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import { VertexBuffer } from "../../../Meshes/buffer";
import type { InstancedMesh } from "../../../Meshes/instancedMesh";
import type { Mesh } from "../../../Meshes/mesh";
import type { SubMesh } from "../../../Meshes/subMesh";
import type { Observer } from "../../../Misc/observable";
import type { DepthRenderer } from "../../../Rendering/depthRenderer";
import type { Scene } from "../../../scene";
import type { Nullable } from "../../../types";

import "../../../Rendering/depthRendererSceneComponent";
import { SelectionOutlinePostProcess } from "../../selectionOutlinePostProcess";

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
            attributes: [VertexBuffer.PositionKind, SelectionOutlineRenderingPipeline.InstanceSelectionIdAttributeName],
            uniforms: ["world", "viewProjection", "selectionId", "depthValues"],
            needAlphaBlending: false,
            defines: defines,
            useClipPlane: null,
            shaderLanguage: shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this.shaderLanguage === ShaderLanguage.WGSL) {
                    await Promise.all([import("../../../ShadersWGSL/selection.fragment"), import("../../../ShadersWGSL/selection.vertex")]);
                } else {
                    await Promise.all([import("../../../Shaders/selection.fragment"), import("../../../Shaders/selection.vertex")]);
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

        const engine = this.getScene().getEngine();

        const camera = this.getScene().activeCamera;
        let minZ: number = 1;
        let maxZ: number = 10000;
        if (camera) {
            const cameraIsOrtho = camera.mode === Camera.ORTHOGRAPHIC_CAMERA;

            if (cameraIsOrtho) {
                minZ = !engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
                maxZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
            } else {
                minZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? camera.minZ : engine.isNDCHalfZRange ? 0 : camera.minZ;
                maxZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : camera.maxZ;
            }
        }
        effect.setFloat2("depthValues", minZ, minZ + maxZ);
    }
}

/**
 * Options for the selection outline rendering pipeline
 */
export interface ISelectionOutlineRenderingPipelineOptions {
    /**
     * Color of the outline (default: (1, 0.5, 0) - orange)
     */
    outlineColor?: Color3;
    /**
     * Number of samples for the final post process (default: 4)
     */
    samples?: number;
}

/**
 * Selection outline rendering pipeline
 *
 * Use optimized brute force approach to render outlines around selected objects
 *
 * The selection rendering pipeline use two main steps:
 * 1. Render selected objects to a mask texture where r and g channels store selection ID and depth information
 * 2. Apply a post process that will use the mask texture to render outlines around selected objects
 */
export class SelectionOutlineRenderingPipeline {
    /**
     * Name of the instance selection ID attribute
     * @internal
     */
    public static readonly InstanceSelectionIdAttributeName = "instanceSelectionId";

    private readonly _name: string;
    private readonly _camera: Camera;
    private readonly _scene: Scene;
    private readonly _depthRenderer: DepthRenderer;

    private _samples: number = 4;
    /**
     * Gets or sets the number of samples used for the outline post process (default: 4)
     */
    public get samples(): number {
        return this._samples;
    }
    public set samples(value: number) {
        this._samples = value;
        if (this._outlineProcess) {
            this._outlineProcess.samples = value;
        }
    }

    private _outlineColor: Color3 = new Color3(1, 0.5, 0);
    /**
     * Gets or sets the outline color (default: (1, 0.5, 0) - orange)
     */
    public get outlineColor(): Color3 {
        return this._outlineColor;
    }
    public set outlineColor(value: Color3) {
        this._outlineColor = value;
        if (this._outlineProcess) {
            this._outlineProcess.outlineColor = value;
        }
    }

    private _outlineThickness: number = 2.0;
    /**
     * Gets or sets the outline thickness (default: 2.0)
     */
    public get outlineThickness(): number {
        return this._outlineThickness;
    }
    public set outlineThickness(value: number) {
        this._outlineThickness = value;
        if (this._outlineProcess) {
            this._outlineProcess.outlineThickness = value;
        }
    }

    private _occlusionStrength: number = 0.8;
    /**
     * Gets or sets the occlusion strength (default: 0.8)
     */
    public get occlusionStrength(): number {
        return this._occlusionStrength;
    }
    public set occlusionStrength(value: number) {
        this._occlusionStrength = value;
        if (this._outlineProcess) {
            this._outlineProcess.occlusionStrength = value;
        }
    }

    private readonly _meshUniqueIdToSelectionId: number[] = [];

    private readonly _selectionMaterialCache: Nullable<SelectionMaterial>[] = new Array(9).fill(null);
    private readonly _selection: AbstractMesh[] = [];

    private _maskTexture: Nullable<RenderTargetTexture> = null;
    private _outlineProcess: Nullable<SelectionOutlinePostProcess> = null;
    private _isOutlineProcessAttached: boolean = false;

    private _resizeObserver: Nullable<Observer<AbstractEngine>> = null;

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
     * @param name name of the process
     * @param camera  camera used for post process
     * @param options options for the outline renderer
     *
     */
    public constructor(name: string, camera: Camera, options: ISelectionOutlineRenderingPipelineOptions = {}) {
        this._name = name;
        this._camera = camera;
        this._scene = camera.getScene();

        this._depthRenderer = this._scene.enableDepthRenderer(camera);

        if (options.outlineColor) {
            this._outlineColor = options.outlineColor;
        }
        if (options.samples) {
            this._samples = options.samples;
        }

        const engine = this._scene.getEngine();

        if (engine.isWebGPU) {
            this._shaderLanguage = ShaderLanguage.WGSL;
        }

        // handle resize
        this._resizeObserver = engine.onResizeObservable.add(this._resizeBuffer, undefined, undefined, this);
    }

    private _resizeBuffer(): void {
        const engine = this._scene.getEngine();
        const width = engine.getRenderWidth();
        const height = engine.getRenderHeight();

        if (this._maskTexture !== null) {
            const size = this._maskTexture.getSize();
            if (size.width !== width || size.height !== height) {
                this._maskTexture.resize({ width: width, height: height });
            }
        }

        if (this._depthRenderer !== null) {
            const depthMap = this._depthRenderer.getDepthMap();
            const depthSize = depthMap.getSize();
            if (depthSize.width !== width || depthSize.height !== height) {
                depthMap.resize({ width: width, height: height });
            }
        }
    }

    private _createRenderTargetTexture(): RenderTargetTexture {
        if (this._maskTexture) {
            return this._maskTexture;
        }

        const engine = this._scene.getEngine();

        this._maskTexture = new RenderTargetTexture(this._name + "_mask", { width: engine.getRenderWidth(), height: engine.getRenderHeight() }, this._scene, {
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            format: Constants.TEXTUREFORMAT_RG,
        });
        this._maskTexture.noPrePassRenderer = true;
        this._maskTexture.clearColor = new Color4(0, 1, 1, 1);
        this._maskTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this._maskTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;

        this._scene.customRenderTargets.push(this._maskTexture);

        return this._maskTexture;
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

    private _prepareSelectionOutlinePostProcess(): void {
        if (this._outlineProcess) {
            return;
        }

        if (!this._maskTexture) {
            throw new Error("Mask texture not created before preparing outline post process");
        }

        this._outlineProcess = new SelectionOutlinePostProcess(this._name + "_outline", this._maskTexture, this._depthRenderer.getDepthMap(), {
            camera: this._camera,
            engine: this._scene.getEngine(),
        });
        this._outlineProcess.outlineColor = this._outlineColor;
        this._outlineProcess.outlineThickness = this._outlineThickness;
        this._outlineProcess.occlusionStrength = this._occlusionStrength;
        this._outlineProcess.samples = this._samples;

        this._isOutlineProcessAttached = true;
    }

    /**
     * Clears the current selection
     */
    public clearSelection(): void {
        if (this._selection.length === 0) {
            return;
        }

        for (let index = 0; index < this._selection.length; ++index) {
            const mesh = this._selection[index];
            if (mesh.hasInstances) {
                (mesh as Mesh).removeVerticesData(SelectionOutlineRenderingPipeline.InstanceSelectionIdAttributeName);
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

        if (this._outlineProcess && this._isOutlineProcessAttached) {
            this._camera.detachPostProcess(this._outlineProcess);
            this._isOutlineProcessAttached = false;
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
        const maskTexture = this._createRenderTargetTexture();

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

                    if (sourceMesh.instancedBuffers?.[SelectionOutlineRenderingPipeline.InstanceSelectionIdAttributeName] === undefined) {
                        sourceMesh.registerInstancedBuffer(SelectionOutlineRenderingPipeline.InstanceSelectionIdAttributeName, 1);
                        // todo: consider unregistering buffer on dispose
                    }

                    mesh.instancedBuffers[SelectionOutlineRenderingPipeline.InstanceSelectionIdAttributeName] = id;
                } else {
                    this._meshUniqueIdToSelectionId[mesh.uniqueId] = id;
                }
            }
        }
        this._nextSelectionId = nextId;

        maskTexture.renderList = [...this._selection];

        // set up outline post process
        this._prepareSelectionOutlinePostProcess();
        if (!this._isOutlineProcessAttached) {
            this._camera.attachPostProcess(this._outlineProcess!);
            this._isOutlineProcessAttached = true;
        }
    }

    /**
     * Sets the current selection, replacing any previous selection
     *
     * If a group of meshes is provided, they will outline as a single unit
     * @param meshes Meshes to set as the current selection
     */
    public setSelection(meshes: (AbstractMesh | AbstractMesh[])[]): void {
        this.clearSelection();
        this.addSelection(meshes);
    }

    /**
     * Disposes the rendering pipeline
     */
    public dispose(): void {
        this.clearSelection();

        if (this._maskTexture !== null) {
            const index = this._scene.customRenderTargets.indexOf(this._maskTexture);
            if (index !== -1) {
                this._scene.customRenderTargets.splice(index, 1);
            }
            this._maskTexture.dispose();
            this._maskTexture = null;
        }
        this._clearSelectionMaterials();

        if (this._outlineProcess) {
            if (this._isOutlineProcessAttached) {
                this._camera.detachPostProcess(this._outlineProcess);
                this._isOutlineProcessAttached = false;
            }
        }

        this._outlineProcess?.dispose();
        this._outlineProcess = null;

        this._resizeObserver?.remove();
        this._resizeObserver = null;
    }
}
