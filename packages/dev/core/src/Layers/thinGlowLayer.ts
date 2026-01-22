/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Scene } from "../scene";
import { Vector2 } from "../Maths/math.vector";
import { VertexBuffer } from "../Buffers/buffer";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Mesh } from "../Meshes/mesh";
import type { Texture } from "../Materials/Textures/texture";
import type { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { ThinEffectLayer } from "./thinEffectLayer";
import { Constants } from "../Engines/constants";
import { Color4 } from "../Maths/math.color";
import type { PBRMaterial } from "../Materials/PBR/pbrMaterial";

import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { IThinEffectLayerOptions } from "./thinEffectLayer";
import { ThinBlurPostProcess } from "core/PostProcesses/thinBlurPostProcess";

/**
 * Glow layer options. This helps customizing the behaviour
 * of the glow layer.
 */
export interface IThinGlowLayerOptions extends IThinEffectLayerOptions {
    /**
     * How big is the kernel of the blur texture. Default: 32
     */
    blurKernelSize?: number;

    /**
     * Forces the merge step to be done in ldr (clamp values > 1). Default: false
     */
    ldrMerge?: boolean;

    /**
     * Exclude all meshes from the glow layer by default.
     * This is useful if you have dynamic meshes and you want to control them specifically and
     * make sure that there are no "leaking" glowing meshes.
     * Default: false
     */
    excludeByDefault?: boolean;
}

/**
 * @internal
 */
export class ThinGlowLayer extends ThinEffectLayer {
    /**
     * Effect Name of the layer.
     */
    public static readonly EffectName = "GlowLayer";

    /**
     * The default blur kernel size used for the glow.
     */
    public static DefaultBlurKernelSize = 32;

    /**
     * Gets the ldrMerge option.
     */
    public get ldrMerge(): boolean {
        return this._options.ldrMerge;
    }

    /**
     * Sets the kernel size of the blur.
     */
    public set blurKernelSize(value: number) {
        if (value === this._options.blurKernelSize) {
            return;
        }

        this._options.blurKernelSize = value;

        const effectiveKernel = this._getEffectiveBlurKernelSize();
        this._horizontalBlurPostprocess1.kernel = effectiveKernel;
        this._verticalBlurPostprocess1.kernel = effectiveKernel;
        this._horizontalBlurPostprocess2.kernel = effectiveKernel;
        this._verticalBlurPostprocess2.kernel = effectiveKernel;
    }

    /**
     * Gets the kernel size of the blur.
     */
    public get blurKernelSize(): number {
        return this._options.blurKernelSize;
    }

    /**
     * Sets the glow intensity.
     */
    public set intensity(value: number) {
        this._intensity = value;
    }

    /**
     * Gets the glow intensity.
     */
    public get intensity(): number {
        return this._intensity;
    }

    /** @internal */
    public override _options: Required<IThinGlowLayerOptions>;

    private _intensity: number = 1.0;
    private _horizontalBlurPostprocess1: ThinBlurPostProcess;
    private _verticalBlurPostprocess1: ThinBlurPostProcess;
    private _horizontalBlurPostprocess2: ThinBlurPostProcess;
    private _verticalBlurPostprocess2: ThinBlurPostProcess;

    /** @internal */
    public _includedOnlyMeshes: number[] = [];
    /** @internal */
    public _excludedMeshes: number[] = [];
    private _meshesUsingTheirOwnMaterials: number[] = [];

    /**
     * Callback used to let the user override the color selection on a per mesh basis
     */
    public customEmissiveColorSelector: (mesh: Mesh, subMesh: SubMesh, material: Material, result: Color4) => void;
    /**
     * Callback used to let the user override the texture selection on a per mesh basis
     */
    public customEmissiveTextureSelector: (mesh: Mesh, subMesh: SubMesh, material: Material) => Texture;

    /** @internal */
    public _renderPassId = 0;

    /**
     * Instantiates a new glow Layer and references it to the scene.
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param options Sets of none mandatory options to use with the layer (see IGlowLayerOptions for more information)
     * @param dontCheckIfReady Specifies if the layer should disable checking whether all the post processes are ready (default: false). To save performance, this should be set to true and you should call `isReady` manually before rendering to the layer.
     */
    constructor(name: string, scene?: Scene, options?: IThinGlowLayerOptions, dontCheckIfReady = false) {
        super(name, scene, false, dontCheckIfReady);
        this.neutralColor = new Color4(0, 0, 0, 1);

        // Adapt options
        this._options = {
            mainTextureRatio: 0.5,
            mainTextureFixedSize: 0,
            mainTextureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            mainTextureFormat: Constants.TEXTUREFORMAT_RGBA,
            blurKernelSize: 32,
            camera: null,
            renderingGroupId: -1,
            ldrMerge: false,
            alphaBlendingMode: Constants.ALPHA_ADD,
            excludeByDefault: false,
            ...options,
        };

        // Initialize the layer
        this._init(this._options);

        if (dontCheckIfReady) {
            // When dontCheckIfReady is true, we are in the new ThinXXX layer mode, so we must call _createTextureAndPostProcesses ourselves (it is called by EffectLayer otherwise)
            this._createTextureAndPostProcesses();
        }
    }

    /**
     * Gets the class name of the thin glow layer
     * @returns the string with the class name of the glow layer
     */
    public getClassName(): string {
        return "GlowLayer";
    }

    protected override async _importShadersAsync() {
        if (this._shaderLanguage === ShaderLanguage.WGSL) {
            await Promise.all([
                import("../ShadersWGSL/glowMapMerge.fragment"),
                import("../ShadersWGSL/glowMapMerge.vertex"),
                import("../ShadersWGSL/glowBlurPostProcess.fragment"),
            ]);
        } else {
            await Promise.all([import("../Shaders/glowMapMerge.fragment"), import("../Shaders/glowMapMerge.vertex"), import("../Shaders/glowBlurPostProcess.fragment")]);
        }

        await super._importShadersAsync();
    }

    public override getEffectName(): string {
        return ThinGlowLayer.EffectName;
    }

    /** @internal */
    public override _internalShouldRender(): boolean {
        if (this._options.excludeByDefault && !this._includedOnlyMeshes.length) {
            return false;
        }
        return super._internalShouldRender();
    }

    public override _createMergeEffect(): Effect {
        let defines = "#define EMISSIVE \n";
        if (this._options.ldrMerge) {
            defines += "#define LDR \n";
        }

        // Effect
        return this._engine.createEffect(
            "glowMapMerge",
            [VertexBuffer.PositionKind],
            ["offset"],
            ["textureSampler", "textureSampler2"],
            defines,
            undefined,
            undefined,
            undefined,
            undefined,
            this.shaderLanguage,
            this._shadersLoaded
                ? undefined
                : async () => {
                      await this._importShadersAsync();
                      this._shadersLoaded = true;
                  }
        );
    }

    public override _createTextureAndPostProcesses(): void {
        const effectiveKernel = this._getEffectiveBlurKernelSize();
        this._horizontalBlurPostprocess1 = new ThinBlurPostProcess("GlowLayerHBP1", this._scene.getEngine(), new Vector2(1.0, 0), effectiveKernel);
        this._verticalBlurPostprocess1 = new ThinBlurPostProcess("GlowLayerVBP1", this._scene.getEngine(), new Vector2(0, 1.0), effectiveKernel);

        this._horizontalBlurPostprocess2 = new ThinBlurPostProcess("GlowLayerHBP2", this._scene.getEngine(), new Vector2(1.0, 0), effectiveKernel);
        this._verticalBlurPostprocess2 = new ThinBlurPostProcess("GlowLayerVBP2", this._scene.getEngine(), new Vector2(0, 1.0), effectiveKernel);

        this._postProcesses = [this._horizontalBlurPostprocess1, this._verticalBlurPostprocess1, this._horizontalBlurPostprocess2, this._verticalBlurPostprocess2];
    }

    private _getEffectiveBlurKernelSize() {
        return this._options.blurKernelSize / 2;
    }

    public override isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        const material = subMesh.getMaterial();
        const mesh = subMesh.getRenderingMesh();

        if (!material || !mesh) {
            return false;
        }

        const emissiveTexture = (<any>material).emissiveTexture;
        return super._isSubMeshReady(subMesh, useInstances, emissiveTexture);
    }

    public override _canRenderMesh(_mesh: AbstractMesh, _material: Material): boolean {
        return true;
    }

    public override _internalCompose(effect: Effect): void {
        // Texture
        this.bindTexturesForCompose(effect);
        effect.setFloat("offset", this._intensity);

        // Cache
        const engine = this._engine;
        const previousStencilBuffer = engine.getStencilBuffer();

        // Draw order
        engine.setStencilBuffer(false);

        engine.drawElementsType(Material.TriangleFillMode, 0, 6);

        // Draw order
        engine.setStencilBuffer(previousStencilBuffer);
    }

    public override _setEmissiveTextureAndColor(mesh: Mesh, subMesh: SubMesh, material: Material): void {
        let textureLevel = 1.0;

        if (this.customEmissiveTextureSelector) {
            this._emissiveTextureAndColor.texture = this.customEmissiveTextureSelector(mesh, subMesh, material);
        } else {
            if (material) {
                this._emissiveTextureAndColor.texture = (<any>material).emissiveTexture;
                if (this._emissiveTextureAndColor.texture) {
                    textureLevel = this._emissiveTextureAndColor.texture.level;
                }
            } else {
                this._emissiveTextureAndColor.texture = null;
            }
        }

        if (this.customEmissiveColorSelector) {
            this.customEmissiveColorSelector(mesh, subMesh, material, this._emissiveTextureAndColor.color);
        } else {
            if ((<any>material).emissiveColor) {
                const emissiveIntensity = (<PBRMaterial>material).emissiveIntensity ?? 1;
                textureLevel *= emissiveIntensity;
                this._emissiveTextureAndColor.color.set(
                    (<any>material).emissiveColor.r * textureLevel,
                    (<any>material).emissiveColor.g * textureLevel,
                    (<any>material).emissiveColor.b * textureLevel,
                    material.alpha
                );
            } else {
                this._emissiveTextureAndColor.color.set(this.neutralColor.r, this.neutralColor.g, this.neutralColor.b, this.neutralColor.a);
            }
        }
    }

    public override _shouldRenderMesh(mesh: Mesh): boolean {
        return this.hasMesh(mesh);
    }

    public override _addCustomEffectDefines(defines: string[]): void {
        defines.push("#define GLOW");
    }

    /**
     * Add a mesh in the exclusion list to prevent it to impact or being impacted by the glow layer.
     * This will not have an effect if meshes are excluded by default (see setExcludedByDefault).
     * @param mesh The mesh to exclude from the glow layer
     */
    public addExcludedMesh(mesh: Mesh): void {
        if (this._excludedMeshes.indexOf(mesh.uniqueId) === -1) {
            this._excludedMeshes.push(mesh.uniqueId);
        }
    }

    /**
     * Remove a mesh from the exclusion list to let it impact or being impacted by the glow layer.
     * This will not have an effect if meshes are excluded by default (see setExcludedByDefault).
     * @param mesh The mesh to remove
     */
    public removeExcludedMesh(mesh: Mesh): void {
        const index = this._excludedMeshes.indexOf(mesh.uniqueId);
        if (index !== -1) {
            this._excludedMeshes.splice(index, 1);
        }
    }

    /**
     * Add a mesh in the inclusion list to impact or being impacted by the glow layer.
     * @param mesh The mesh to include in the glow layer
     */
    public addIncludedOnlyMesh(mesh: Mesh): void {
        if (this._includedOnlyMeshes.indexOf(mesh.uniqueId) === -1) {
            this._includedOnlyMeshes.push(mesh.uniqueId);
        }
    }

    /**
     * Remove a mesh from the Inclusion list to prevent it to impact or being impacted by the glow layer.
     * @param mesh The mesh to remove
     */
    public removeIncludedOnlyMesh(mesh: Mesh): void {
        const index = this._includedOnlyMeshes.indexOf(mesh.uniqueId);
        if (index !== -1) {
            this._includedOnlyMeshes.splice(index, 1);
        }
    }

    /**
     * Set the excluded by default option.
     * If true, all meshes will be excluded by default unless they are added to the inclusion list.
     * @param value The boolean value to set the excluded by default option to
     */
    public setExcludedByDefault(value: boolean): void {
        this._options.excludeByDefault = value;
    }

    public override hasMesh(mesh: AbstractMesh): boolean {
        if (!super.hasMesh(mesh)) {
            return false;
        }

        // Included Mesh
        if (this._includedOnlyMeshes.length) {
            return this._includedOnlyMeshes.indexOf(mesh.uniqueId) !== -1;
        }

        // Excluded Mesh
        if (this._excludedMeshes.length) {
            return this._excludedMeshes.indexOf(mesh.uniqueId) === -1;
        }

        return true;
    }

    public override _useMeshMaterial(mesh: AbstractMesh): boolean {
        // Specific case of material supporting glow directly
        if (mesh.material?._supportGlowLayer) {
            return true;
        }

        if (this._meshesUsingTheirOwnMaterials.length == 0) {
            return false;
        }

        return this._meshesUsingTheirOwnMaterials.indexOf(mesh.uniqueId) > -1;
    }

    /**
     * Add a mesh to be rendered through its own material and not with emissive only.
     * @param mesh The mesh for which we need to use its material
     */
    public referenceMeshToUseItsOwnMaterial(mesh: AbstractMesh): void {
        mesh.resetDrawCache(this._renderPassId);

        this._meshesUsingTheirOwnMaterials.push(mesh.uniqueId);

        mesh.onDisposeObservable.add(() => {
            this._disposeMesh(mesh as Mesh);
        });
    }

    /**
     * Remove a mesh from being rendered through its own material and not with emissive only.
     * @param mesh The mesh for which we need to not use its material
     * @param renderPassId The render pass id used when rendering the mesh
     */
    public unReferenceMeshFromUsingItsOwnMaterial(mesh: AbstractMesh, renderPassId: number): void {
        let index = this._meshesUsingTheirOwnMaterials.indexOf(mesh.uniqueId);
        while (index >= 0) {
            this._meshesUsingTheirOwnMaterials.splice(index, 1);
            index = this._meshesUsingTheirOwnMaterials.indexOf(mesh.uniqueId);
        }
        mesh.resetDrawCache(renderPassId);
    }

    /** @internal */
    public _disposeMesh(mesh: Mesh): void {
        this.removeIncludedOnlyMesh(mesh);
        this.removeExcludedMesh(mesh);
    }
}
