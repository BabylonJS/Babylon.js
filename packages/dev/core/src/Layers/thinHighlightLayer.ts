import type { Observer, Nullable, Scene, SubMesh, AbstractMesh, Mesh, Effect, IThinEffectLayerOptions, Color3, EffectWrapper } from "core/index";
import { Vector2 } from "../Maths/math.vector";
import { VertexBuffer } from "../Buffers/buffer";
import { Material } from "../Materials/material";
import { ThinPassPostProcess } from "../PostProcesses/thinPassPostProcess";
import { ThinEffectLayer, ThinGlowBlurPostProcess } from "./thinEffectLayer";
import { Constants } from "../Engines/constants";
import { Color4 } from "../Maths/math.color";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ThinBlurPostProcess } from "core/PostProcesses/thinBlurPostProcess";

interface IBlurPostProcess extends EffectWrapper {
    kernel: number;
}

/**
 * Highlight layer options. This helps customizing the behaviour
 * of the highlight layer.
 */
export interface IThinHighlightLayerOptions extends IThinEffectLayerOptions {
    /**
     * Multiplication factor apply to the main texture size in the first step of the blur to reduce the size
     * of the picture to blur (the smaller the faster). Default: 0.5
     */
    blurTextureSizeRatio?: number;

    /**
     * How big in texel of the blur texture is the vertical blur. Default: 1
     */
    blurVerticalSize?: number;

    /**
     * How big in texel of the blur texture is the horizontal blur. Default: 1
     */
    blurHorizontalSize?: number;

    /**
     * Should we display highlight as a solid stroke? Default: false
     */
    isStroke?: boolean;

    /**
     * Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    forceGLSL?: boolean;
}

/**
 * Storage interface grouping all the information required for glowing a mesh.
 */
interface IHighlightLayerMesh {
    /**
     * The glowy mesh
     */
    mesh: Mesh;
    /**
     * The color of the glow
     */
    color: Color3;
    /**
     * The mesh render callback use to insert stencil information
     */
    observerHighlight: Nullable<Observer<Mesh>>;
    /**
     * The mesh render callback use to come to the default behavior
     */
    observerDefault: Nullable<Observer<Mesh>>;
    /**
     * If it exists, the emissive color of the material will be used to generate the glow.
     * Else it falls back to the current color.
     */
    glowEmissiveOnly: boolean;
}

/**
 * Storage interface grouping all the information required for an excluded mesh.
 */
interface IHighlightLayerExcludedMesh {
    /**
     * The glowy mesh
     */
    mesh: Mesh;
    /**
     * The mesh render callback use to prevent stencil use
     */
    beforeBind: Nullable<Observer<Mesh>>;
    /**
     * The mesh render callback use to restore previous stencil use
     */
    afterRender: Nullable<Observer<Mesh>>;
    /**
     * Current stencil state of the engine
     */
    stencilState: boolean;
}

/**
 * @internal
 */
export class ThinHighlightLayer extends ThinEffectLayer {
    /**
     * Effect Name of the highlight layer.
     */
    public static readonly EffectName = "HighlightLayer";

    /**
     * The neutral color used during the preparation of the glow effect.
     * This is black by default as the blend operation is a blend operation.
     */
    public static NeutralColor: Color4 = new Color4(0, 0, 0, 0);

    /**
     * Stencil value used for glowing meshes.
     */
    public static GlowingMeshStencilReference = 0x02;

    /**
     * Stencil value used for the other meshes in the scene.
     */
    public static NormalMeshStencilReference = 0x01;

    /**
     * Specifies whether or not the inner glow is ACTIVE in the layer.
     */
    public innerGlow: boolean = true;

    /**
     * Specifies whether or not the outer glow is ACTIVE in the layer.
     */
    public outerGlow: boolean = true;

    /**
     * Specifies the horizontal size of the blur.
     */
    public set blurHorizontalSize(value: number) {
        this._horizontalBlurPostprocess.kernel = value;
        this._options.blurHorizontalSize = value;
    }

    /**
     * Specifies the vertical size of the blur.
     */
    public set blurVerticalSize(value: number) {
        this._verticalBlurPostprocess.kernel = value;
        this._options.blurVerticalSize = value;
    }

    /**
     * Gets the horizontal size of the blur.
     */
    public get blurHorizontalSize(): number {
        return this._horizontalBlurPostprocess.kernel;
    }

    /**
     * Gets the vertical size of the blur.
     */
    public get blurVerticalSize(): number {
        return this._verticalBlurPostprocess.kernel;
    }

    private _instanceGlowingMeshStencilReference = ThinHighlightLayer.GlowingMeshStencilReference++;

    /** @internal */
    public override _options: Required<IThinHighlightLayerOptions>;

    private _downSamplePostprocess: ThinPassPostProcess;
    private _horizontalBlurPostprocess: IBlurPostProcess;
    private _verticalBlurPostprocess: IBlurPostProcess;

    /** @internal */
    public _meshes: Nullable<{ [id: string]: Nullable<IHighlightLayerMesh> }> = {};
    /** @internal */
    public _excludedMeshes: Nullable<{ [id: string]: Nullable<IHighlightLayerExcludedMesh> }> = {};

    /** @internal */
    public _mainObjectRendererRenderPassId = -1;

    /**
     * Instantiates a new highlight Layer and references it to the scene..
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param options Sets of none mandatory options to use with the layer (see IHighlightLayerOptions for more information)
     * @param dontCheckIfReady Specifies if the layer should disable checking whether all the post processes are ready (default: false). To save performance, this should be set to true and you should call `isReady` manually before rendering to the layer.
     */
    constructor(name: string, scene?: Scene, options?: Partial<IThinHighlightLayerOptions>, dontCheckIfReady = false) {
        super(name, scene, options !== undefined ? !!options.forceGLSL : false);

        this.neutralColor = ThinHighlightLayer.NeutralColor;

        // Adapt options
        this._options = {
            mainTextureRatio: 0.5,
            blurTextureSizeRatio: 0.5,
            mainTextureFixedSize: 0,
            blurHorizontalSize: 1.0,
            blurVerticalSize: 1.0,
            alphaBlendingMode: Constants.ALPHA_COMBINE,
            camera: null,
            renderingGroupId: -1,
            forceGLSL: false,
            mainTextureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            mainTextureFormat: Constants.TEXTUREFORMAT_RGBA,
            isStroke: false,
            ...options,
        };

        // Initialize the layer
        this._init(this._options);

        // Do not render as long as no meshes have been added
        this._shouldRender = false;

        if (dontCheckIfReady) {
            // When dontCheckIfReady is true, we are in the new ThinXXX layer mode, so we must call _createTextureAndPostProcesses ourselves (it is called by EffectLayer otherwise)
            this._createTextureAndPostProcesses();
        }
    }

    /**
     * Gets the class name of the effect layer
     * @returns the string with the class name of the effect layer
     */
    public getClassName(): string {
        return "HighlightLayer";
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
        return ThinHighlightLayer.EffectName;
    }

    public override _numInternalDraws(): number {
        return 2; // we need two rendering, one for the inner glow and the other for the outer glow
    }

    public override _createMergeEffect(): Effect {
        return this._engine.createEffect(
            "glowMapMerge",
            [VertexBuffer.PositionKind],
            ["offset"],
            ["textureSampler"],
            this._options.isStroke ? "#define STROKE \n" : undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            this._shaderLanguage,
            this._shadersLoaded
                ? undefined
                : async () => {
                      await this._importShadersAsync();
                      this._shadersLoaded = true;
                  }
        );
    }

    public override _createTextureAndPostProcesses(): void {
        if (this._options.alphaBlendingMode === Constants.ALPHA_COMBINE) {
            this._downSamplePostprocess = new ThinPassPostProcess("HighlightLayerPPP", this._scene.getEngine());
            this._horizontalBlurPostprocess = new ThinGlowBlurPostProcess("HighlightLayerHBP", this._scene.getEngine(), new Vector2(1.0, 0), this._options.blurHorizontalSize);
            this._verticalBlurPostprocess = new ThinGlowBlurPostProcess("HighlightLayerVBP", this._scene.getEngine(), new Vector2(0, 1.0), this._options.blurVerticalSize);
            this._postProcesses = [this._downSamplePostprocess, this._horizontalBlurPostprocess, this._verticalBlurPostprocess];
        } else {
            this._horizontalBlurPostprocess = new ThinBlurPostProcess("HighlightLayerHBP", this._scene.getEngine(), new Vector2(1.0, 0), this._options.blurHorizontalSize / 2);
            this._verticalBlurPostprocess = new ThinBlurPostProcess("HighlightLayerVBP", this._scene.getEngine(), new Vector2(0, 1.0), this._options.blurVerticalSize / 2);
            this._postProcesses = [this._horizontalBlurPostprocess, this._verticalBlurPostprocess];
        }
    }

    public override needStencil(): boolean {
        return true;
    }

    public override isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        const material = subMesh.getMaterial();
        const mesh = subMesh.getRenderingMesh();

        if (!material || !mesh || !this._meshes) {
            return false;
        }

        let emissiveTexture: Nullable<any> = null;
        const highlightLayerMesh = this._meshes[mesh.uniqueId];

        if (highlightLayerMesh && highlightLayerMesh.glowEmissiveOnly && material) {
            emissiveTexture = (<any>material).emissiveTexture;
        }
        return super._isSubMeshReady(subMesh, useInstances, emissiveTexture);
    }

    public override _canRenderMesh(_mesh: AbstractMesh, _material: Material): boolean {
        // all meshes can be rendered in the highlight layer, even transparent ones
        return true;
    }

    public override _internalCompose(effect: Effect, renderIndex: number): void {
        // Texture
        this.bindTexturesForCompose(effect);

        // Cache
        const engine = this._engine;
        engine.cacheStencilState();

        // Stencil operations
        engine.setStencilOperationPass(Constants.REPLACE);
        engine.setStencilOperationFail(Constants.KEEP);
        engine.setStencilOperationDepthFail(Constants.KEEP);

        // Draw order
        engine.setStencilMask(0x00);
        engine.setStencilBuffer(true);
        engine.setStencilFunctionReference(this._instanceGlowingMeshStencilReference);

        // 2 passes inner outer
        if (this.outerGlow && renderIndex === 0) {
            // the outer glow is rendered the first time _internalRender is called, so when renderIndex == 0 (and only if outerGlow is enabled)
            effect.setFloat("offset", 0);
            engine.setStencilFunction(Constants.NOTEQUAL);
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }
        if (this.innerGlow && renderIndex === 1) {
            // the inner glow is rendered the second time _internalRender is called, so when renderIndex == 1 (and only if innerGlow is enabled)
            effect.setFloat("offset", 1);
            engine.setStencilFunction(Constants.EQUAL);
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }

        // Restore Cache
        engine.restoreStencilState();
    }

    public override _setEmissiveTextureAndColor(mesh: Mesh, _subMesh: SubMesh, material: Material): void {
        const highlightLayerMesh = this._meshes![mesh.uniqueId];
        if (highlightLayerMesh) {
            this._emissiveTextureAndColor.color.set(highlightLayerMesh.color.r, highlightLayerMesh.color.g, highlightLayerMesh.color.b, 1.0);
        } else {
            this._emissiveTextureAndColor.color.set(this.neutralColor.r, this.neutralColor.g, this.neutralColor.b, this.neutralColor.a);
        }

        if (highlightLayerMesh && highlightLayerMesh.glowEmissiveOnly && material) {
            this._emissiveTextureAndColor.texture = (<any>material).emissiveTexture;
            this._emissiveTextureAndColor.color.set(1.0, 1.0, 1.0, 1.0);
        } else {
            this._emissiveTextureAndColor.texture = null;
        }
    }

    public override shouldRender(): boolean {
        return this._meshes && super.shouldRender() ? true : false;
    }

    public override _shouldRenderMesh(mesh: Mesh): boolean {
        if (this._excludedMeshes && this._excludedMeshes[mesh.uniqueId]) {
            return false;
        }

        return super.hasMesh(mesh);
    }

    public override _addCustomEffectDefines(defines: string[]): void {
        defines.push("#define HIGHLIGHT");
    }

    /**
     * Add a mesh in the exclusion list to prevent it to impact or being impacted by the highlight layer.
     * @param mesh The mesh to exclude from the highlight layer
     */
    public addExcludedMesh(mesh: Mesh) {
        if (!this._excludedMeshes) {
            return;
        }

        const meshExcluded = this._excludedMeshes[mesh.uniqueId];
        if (!meshExcluded) {
            const obj: IHighlightLayerExcludedMesh = {
                mesh: mesh,
                beforeBind: null,
                afterRender: null,
                stencilState: false,
            };

            obj.beforeBind = mesh.onBeforeBindObservable.add((mesh: Mesh) => {
                if (this._mainObjectRendererRenderPassId !== -1 && this._mainObjectRendererRenderPassId !== this._engine.currentRenderPassId) {
                    return;
                }
                obj.stencilState = mesh.getEngine().getStencilBuffer();
                mesh.getEngine().setStencilBuffer(false);
            });

            obj.afterRender = mesh.onAfterRenderObservable.add((mesh: Mesh) => {
                if (this._mainObjectRendererRenderPassId !== -1 && this._mainObjectRendererRenderPassId !== this._engine.currentRenderPassId) {
                    return;
                }
                mesh.getEngine().setStencilBuffer(obj.stencilState);
            });

            this._excludedMeshes[mesh.uniqueId] = obj;
        }
    }

    /**
     * Remove a mesh from the exclusion list to let it impact or being impacted by the highlight layer.
     * @param mesh The mesh to highlight
     */
    public removeExcludedMesh(mesh: Mesh) {
        if (!this._excludedMeshes) {
            return;
        }

        const meshExcluded = this._excludedMeshes[mesh.uniqueId];
        if (meshExcluded) {
            if (meshExcluded.beforeBind) {
                mesh.onBeforeBindObservable.remove(meshExcluded.beforeBind);
            }

            if (meshExcluded.afterRender) {
                mesh.onAfterRenderObservable.remove(meshExcluded.afterRender);
            }
        }

        this._excludedMeshes[mesh.uniqueId] = null;
    }

    public override hasMesh(mesh: AbstractMesh): boolean {
        if (!this._meshes || !super.hasMesh(mesh)) {
            return false;
        }

        return !!this._meshes[mesh.uniqueId];
    }

    /**
     * Add a mesh in the highlight layer in order to make it glow with the chosen color.
     * @param mesh The mesh to highlight
     * @param color The color of the highlight
     * @param glowEmissiveOnly Extract the glow from the emissive texture
     */
    public addMesh(mesh: Mesh, color: Color3, glowEmissiveOnly = false) {
        if (!this._meshes) {
            return;
        }

        const meshHighlight = this._meshes[mesh.uniqueId];
        if (meshHighlight) {
            meshHighlight.color = color;
        } else {
            this._meshes[mesh.uniqueId] = {
                mesh: mesh,
                color: color,
                // Lambda required for capture due to Observable this context
                observerHighlight: mesh.onBeforeBindObservable.add((mesh: Mesh) => {
                    if (this._mainObjectRendererRenderPassId !== -1 && this._mainObjectRendererRenderPassId !== this._engine.currentRenderPassId) {
                        return;
                    }
                    if (this.isEnabled) {
                        if (this._excludedMeshes && this._excludedMeshes[mesh.uniqueId]) {
                            this._defaultStencilReference(mesh);
                        } else {
                            mesh.getScene().getEngine().setStencilFunctionReference(this._instanceGlowingMeshStencilReference);
                        }
                    }
                }),
                observerDefault: mesh.onAfterRenderObservable.add((mesh: Mesh) => {
                    if (this._mainObjectRendererRenderPassId !== -1 && this._mainObjectRendererRenderPassId !== this._engine.currentRenderPassId) {
                        return;
                    }
                    if (this.isEnabled) {
                        this._defaultStencilReference(mesh);
                    }
                }),
                glowEmissiveOnly: glowEmissiveOnly,
            };

            mesh.onDisposeObservable.add(() => {
                this._disposeMesh(mesh);
            });
        }

        this._shouldRender = true;
    }

    /**
     * Remove a mesh from the highlight layer in order to make it stop glowing.
     * @param mesh The mesh to highlight
     */
    public removeMesh(mesh: Mesh) {
        if (!this._meshes) {
            return;
        }

        const meshHighlight = this._meshes[mesh.uniqueId];
        if (meshHighlight) {
            if (meshHighlight.observerHighlight) {
                mesh.onBeforeBindObservable.remove(meshHighlight.observerHighlight);
            }

            if (meshHighlight.observerDefault) {
                mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
            }
            delete this._meshes[mesh.uniqueId];
        }

        this._shouldRender = false;
        for (const meshHighlightToCheck in this._meshes) {
            if (this._meshes[meshHighlightToCheck]) {
                this._shouldRender = true;
                break;
            }
        }
    }

    /**
     * Remove all the meshes currently referenced in the highlight layer
     */
    public removeAllMeshes(): void {
        if (!this._meshes) {
            return;
        }

        for (const uniqueId in this._meshes) {
            if (Object.prototype.hasOwnProperty.call(this._meshes, uniqueId)) {
                const mesh = this._meshes[uniqueId];
                if (mesh) {
                    this.removeMesh(mesh.mesh);
                }
            }
        }
    }

    private _defaultStencilReference(mesh: Mesh) {
        mesh.getScene().getEngine().setStencilFunctionReference(ThinHighlightLayer.NormalMeshStencilReference);
    }

    public _disposeMesh(mesh: Mesh): void {
        this.removeMesh(mesh);
        this.removeExcludedMesh(mesh);
    }

    public override dispose(): void {
        if (this._meshes) {
            // Clean mesh references
            for (const id in this._meshes) {
                const meshHighlight = this._meshes[id];
                if (meshHighlight && meshHighlight.mesh) {
                    if (meshHighlight.observerHighlight) {
                        meshHighlight.mesh.onBeforeBindObservable.remove(meshHighlight.observerHighlight);
                    }

                    if (meshHighlight.observerDefault) {
                        meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
                    }
                }
            }
            this._meshes = null;
        }

        if (this._excludedMeshes) {
            for (const id in this._excludedMeshes) {
                const meshHighlight = this._excludedMeshes[id];
                if (meshHighlight) {
                    if (meshHighlight.beforeBind) {
                        meshHighlight.mesh.onBeforeBindObservable.remove(meshHighlight.beforeBind);
                    }

                    if (meshHighlight.afterRender) {
                        meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.afterRender);
                    }
                }
            }
            this._excludedMeshes = null;
        }

        super.dispose();
    }
}
