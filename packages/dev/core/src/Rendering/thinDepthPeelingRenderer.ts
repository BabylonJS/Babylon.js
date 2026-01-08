/**
 * Implementation based on https://medium.com/@shrekshao_71662/dual-depth-peeling-implementation-in-webgl-11baa061ba4b
 */
import { Constants } from "../Engines/constants";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { Effect } from "../Materials/effect";
import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import type { InternalTextureCreationOptions } from "../Materials/Textures/textureCreationOptions";
import { Color4 } from "../Maths/math.color";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { SmartArray } from "../Misc/smartArray";
import type { Scene } from "../scene";
import { ThinTexture } from "../Materials/Textures/thinTexture";
import { EffectRenderer, EffectWrapper } from "../Materials/effectRenderer";
import type { PrePassRenderer } from "./prePassRenderer";
import type { IMaterialContext } from "../Engines/IMaterialContext";
import type { DrawWrapper } from "../Materials/drawWrapper";
import { Material } from "../Materials/material";

import "../Engines/Extensions/engine.multiRender";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { Nullable } from "../types";

/**
 * @internal
 */
export class ThinDepthPeelingRenderer {
    protected _scene: Scene;
    protected _engine: AbstractEngine;
    protected _depthMrts: MultiRenderTarget[] = [];
    protected _thinTextures: ThinTexture[] = [];
    protected _colorMrts: MultiRenderTarget[] = [];
    protected _blendBackMrt: MultiRenderTarget;

    protected _blendBackEffectWrapper: EffectWrapper;
    protected _blendBackEffectWrapperPingPong: EffectWrapper;
    protected _finalEffectWrapper: EffectWrapper;
    protected _effectRenderer: EffectRenderer;

    protected _currentPingPongState: number = 0;

    protected _layoutCacheFormat = [[true], [true, true], [true, true, true]];
    protected _layoutCache: number[][] = [];
    protected _renderPassIds: number[];
    protected _candidateSubMeshes: SmartArray<SubMesh> = new SmartArray(10);
    protected _excludedSubMeshes: SmartArray<SubMesh> = new SmartArray(10);
    protected _excludedMeshes: number[] = [];

    protected static _DEPTH_CLEAR_VALUE = -99999.0;
    protected static _MIN_DEPTH = 0;
    protected static _MAX_DEPTH = 1;

    protected _colorCache = [
        new Color4(ThinDepthPeelingRenderer._DEPTH_CLEAR_VALUE, ThinDepthPeelingRenderer._DEPTH_CLEAR_VALUE, 0, 0),
        new Color4(-ThinDepthPeelingRenderer._MIN_DEPTH, ThinDepthPeelingRenderer._MAX_DEPTH, 0, 0),
        new Color4(0, 0, 0, 0),
    ];

    protected _passCount: number;
    /**
     * Number of depth peeling passes. As we are using dual depth peeling, each pass two levels of transparency are processed.
     */
    public get passCount(): number {
        return this._passCount;
    }

    public set passCount(count: number) {
        if (this._passCount === count) {
            return;
        }
        this._passCount = count;
        this._createRenderPassIds();
    }

    protected _useRenderPasses: boolean;
    /**
     * Instructs the renderer to use render passes. It is an optimization that makes the rendering faster for some engines (like WebGPU) but that consumes more memory, so it is disabled by default.
     */
    public get useRenderPasses() {
        return this._useRenderPasses;
    }

    public set useRenderPasses(usePasses: boolean) {
        if (this._useRenderPasses === usePasses) {
            return;
        }
        this._useRenderPasses = usePasses;
        this._createRenderPassIds();
    }

    /**
     * Add a mesh in the exclusion list to prevent it to be handled by the depth peeling renderer
     * @param mesh The mesh to exclude from the depth peeling renderer
     */
    public addExcludedMesh(mesh: AbstractMesh): void {
        if (this._excludedMeshes.indexOf(mesh.uniqueId) === -1) {
            this._excludedMeshes.push(mesh.uniqueId);
        }
    }

    /**
     * Remove a mesh from the exclusion list of the depth peeling renderer
     * @param mesh The mesh to remove
     */
    public removeExcludedMesh(mesh: AbstractMesh): void {
        const index = this._excludedMeshes.indexOf(mesh.uniqueId);
        if (index !== -1) {
            this._excludedMeshes.splice(index, 1);
        }
    }

    /** Shader language used by the renderer */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language used in this renderer
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    private _blendOutput: Nullable<RenderTargetWrapper>;
    /**
     * Sets the render target wrapper we will blend the transparent objects onto
     */
    public get blendOutput(): Nullable<RenderTargetWrapper> {
        return this._blendOutput;
    }

    public set blendOutput(blendOutput: Nullable<RenderTargetWrapper>) {
        this._blendOutput = blendOutput;
        this._disposeTextures();
        if (blendOutput) {
            this._createTextures();
        }
    }

    /**
     * Instanciates the depth peeling renderer
     * @param scene Scene to attach to
     * @param passCount Number of depth layers to peel
     * @returns The depth peeling renderer
     */
    constructor(scene: Scene, passCount: number = 5) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._passCount = passCount;

        for (let i = 0; i < this._layoutCacheFormat.length; ++i) {
            this._layoutCache[i] = this._engine.buildTextureLayout(this._layoutCacheFormat[i]);
        }

        this._renderPassIds = [];
        this.useRenderPasses = false;

        if (this._engine.isWebGPU) {
            this._shaderLanguage = ShaderLanguage.WGSL;
        }

        this._createEffects("oitFinalSimpleBlend", ["uFrontColor"]);
    }

    private _createRenderPassIds(): void {
        this._releaseRenderPassIds();
        if (this._useRenderPasses) {
            for (let i = 0; i < this._passCount + 1; ++i) {
                if (!this._renderPassIds[i]) {
                    this._renderPassIds[i] = this._engine.createRenderPassId(`DepthPeelingRenderer - pass #${i}`);
                }
            }
        }
    }

    private _releaseRenderPassIds(): void {
        for (let i = 0; i < this._renderPassIds.length; ++i) {
            this._engine.releaseRenderPassId(this._renderPassIds[i]);
        }
        this._renderPassIds = [];
    }

    protected _getTextureSize(): { width: number; height: number } {
        if (this._blendOutput) {
            return {
                width: this._blendOutput.width,
                height: this._blendOutput.height,
            };
        }
        return { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() };
    }

    protected _createTextures() {
        const size = this._getTextureSize();

        // 2 for ping pong
        this._depthMrts = [
            new MultiRenderTarget("depthPeelingDepth0MRT", size, 3, this._scene, undefined, [
                "depthPeelingDepth0MRT_depth",
                "depthPeelingDepth0MRT_frontColor",
                "depthPeelingDepth0MRT_backColor",
            ]),
            new MultiRenderTarget("depthPeelingDepth1MRT", size, 3, this._scene, undefined, [
                "depthPeelingDepth1MRT_depth",
                "depthPeelingDepth1MRT_frontColor",
                "depthPeelingDepth1MRT_backColor",
            ]),
        ];
        this._colorMrts = [
            new MultiRenderTarget("depthPeelingColor0MRT", size, 2, this._scene, { generateDepthBuffer: false }, [
                "depthPeelingColor0MRT_frontColor",
                "depthPeelingColor0MRT_backColor",
            ]),
            new MultiRenderTarget("depthPeelingColor1MRT", size, 2, this._scene, { generateDepthBuffer: false }, [
                "depthPeelingColor1MRT_frontColor",
                "depthPeelingColor1MRT_backColor",
            ]),
        ];
        this._blendBackMrt = new MultiRenderTarget("depthPeelingBackMRT", size, 1, this._scene, { generateDepthBuffer: false }, ["depthPeelingBackMRT_blendBack"]);
        if (this._blendOutput) {
            this._blendBackMrt.setInternalTexture(this._blendOutput.texture!, 0);
        }

        // 0 is a depth texture
        // 1 is a color texture
        const optionsArray = [
            {
                format: Constants.TEXTUREFORMAT_RG,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                type: this._engine.getCaps().textureFloatLinearFiltering ? Constants.TEXTURETYPE_FLOAT : Constants.TEXTURETYPE_HALF_FLOAT,
                label: "DepthPeelingRenderer-DepthTexture",
            } as InternalTextureCreationOptions,
            {
                format: Constants.TEXTUREFORMAT_RGBA,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                type: Constants.TEXTURETYPE_HALF_FLOAT,
                label: "DepthPeelingRenderer-ColorTexture",
            } as InternalTextureCreationOptions,
        ];

        for (let i = 0; i < 2; i++) {
            const depthTexture = this._engine._createInternalTexture(size, optionsArray[0], false);
            const frontColorTexture = this._engine._createInternalTexture(size, optionsArray[1], false);
            const backColorTexture = this._engine._createInternalTexture(size, optionsArray[1], false);

            this._depthMrts[i].setInternalTexture(depthTexture, 0);
            this._depthMrts[i].setInternalTexture(frontColorTexture, 1);
            this._depthMrts[i].setInternalTexture(backColorTexture, 2);
            this._colorMrts[i].setInternalTexture(frontColorTexture, 0);
            this._colorMrts[i].setInternalTexture(backColorTexture, 1);

            this._thinTextures.push(new ThinTexture(depthTexture), new ThinTexture(frontColorTexture), new ThinTexture(backColorTexture));
        }

        if (this._blendOutput) {
            this._blendOutput.shareDepth(this._depthMrts[0].renderTarget!);
        }
    }

    protected _disposeTextures() {
        for (let i = 0; i < this._thinTextures.length; i++) {
            this._thinTextures[i].dispose();
        }

        for (let i = 0; i < this._depthMrts.length; i++) {
            this._depthMrts[i].dispose(true);
            this._colorMrts[i].dispose(true);
            this._blendBackMrt.dispose(true);
        }

        this._thinTextures = [];
        this._colorMrts = [];
        this._depthMrts = [];
    }

    protected _createEffects(finalEffectFragmentShaderName: string, finalEffectSamplerNames: string[]) {
        this._blendBackEffectWrapper = new EffectWrapper({
            fragmentShader: "oitBackBlend",
            useShaderStore: true,
            engine: this._engine,
            samplerNames: ["uBackColor"],
            uniformNames: [],
            shaderLanguage: this._shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this._shaderLanguage === ShaderLanguage.WGSL) {
                    await import("../ShadersWGSL/oitBackBlend.fragment");
                } else {
                    await import("../Shaders/oitBackBlend.fragment");
                }
            },
        });
        this._blendBackEffectWrapperPingPong = new EffectWrapper({
            fragmentShader: "oitBackBlend",
            useShaderStore: true,
            engine: this._engine,
            samplerNames: ["uBackColor"],
            uniformNames: [],
            shaderLanguage: this._shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this._shaderLanguage === ShaderLanguage.WGSL) {
                    await import("../ShadersWGSL/oitBackBlend.fragment");
                } else {
                    await import("../Shaders/oitBackBlend.fragment");
                }
            },
        });

        this._finalEffectWrapper = new EffectWrapper({
            fragmentShader: finalEffectFragmentShaderName,
            useShaderStore: true,
            engine: this._engine,
            samplerNames: finalEffectSamplerNames,
            uniformNames: [],
            shaderLanguage: this._shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this._shaderLanguage === ShaderLanguage.WGSL) {
                    await import("../ShadersWGSL/oitFinalSimpleBlend.fragment");
                } else {
                    await import("../Shaders/oitFinalSimpleBlend.fragment");
                }
            },
        });

        this._effectRenderer = new EffectRenderer(this._engine);
    }

    /**
     * Links to the prepass renderer
     * @param _prePassRenderer The scene PrePassRenderer
     */
    public setPrePassRenderer(_prePassRenderer: PrePassRenderer) {}

    /**
     * Binds depth peeling textures on an effect
     * @param effect The effect to bind textures on
     */
    public bind(effect: Effect) {
        effect.setTexture("oitDepthSampler", this._thinTextures[this._currentPingPongState * 3]);
        effect.setTexture("oitFrontColorSampler", this._thinTextures[this._currentPingPongState * 3 + 1]);
    }

    private _renderSubMeshes(transparentSubMeshes: SmartArray<SubMesh>) {
        let mapMaterialContext: { [uniqueId: number]: IMaterialContext | undefined };
        if (this._useRenderPasses) {
            mapMaterialContext = {};
        }
        for (let j = 0; j < transparentSubMeshes.length; j++) {
            const material = transparentSubMeshes.data[j].getMaterial();
            let previousShaderHotSwapping = true;
            let previousBFC = false;

            const subMesh = transparentSubMeshes.data[j];
            let drawWrapper: DrawWrapper | undefined;
            let firstDraw = false;

            if (this._useRenderPasses) {
                drawWrapper = subMesh._getDrawWrapper();
                firstDraw = !drawWrapper;
            }

            if (material) {
                previousShaderHotSwapping = material.allowShaderHotSwapping;
                previousBFC = material.backFaceCulling;
                material.allowShaderHotSwapping = false;
                material.backFaceCulling = false;
            }

            subMesh.render(false);

            if (firstDraw) {
                // first time we draw this submesh: we replace the material context
                drawWrapper = subMesh._getDrawWrapper()!; // we are sure it is now non empty as we just rendered the submesh
                if (drawWrapper.materialContext) {
                    let newMaterialContext = mapMaterialContext![drawWrapper.materialContext.uniqueId];
                    if (!newMaterialContext) {
                        newMaterialContext = mapMaterialContext![drawWrapper.materialContext.uniqueId] = this._engine.createMaterialContext();
                    }
                    subMesh._getDrawWrapper()!.materialContext = newMaterialContext;
                }
            }

            if (material) {
                material.allowShaderHotSwapping = previousShaderHotSwapping;
                material.backFaceCulling = previousBFC;
            }
        }
    }

    protected _finalCompose(writeId: number) {
        this._engine.bindFramebuffer(this._blendOutput!);

        this._engine.setAlphaMode(Constants.ALPHA_PREMULTIPLIED);
        this._engine.depthCullingState.depthMask = false;
        this._engine.depthCullingState.depthTest = false;
        this._engine.applyStates();

        this._engine.enableEffect(this._finalEffectWrapper.drawWrapper);
        this._finalEffectWrapper.effect.setTexture("uFrontColor", this._thinTextures[writeId * 3 + 1]);
        this._effectRenderer.render(this._finalEffectWrapper);
    }

    /**
     * Checks if the depth peeling renderer is ready to render transparent meshes
     * @returns true if the depth peeling renderer is ready to render the transparent meshes
     */
    public isReady() {
        return this._blendBackEffectWrapper.effect.isReady() && this._blendBackEffectWrapperPingPong.effect.isReady() && this._finalEffectWrapper.effect.isReady();
    }

    protected _beforeRender() {}

    protected _afterRender() {}

    protected _noTransparentMeshes() {}

    /**
     * Renders transparent submeshes with depth peeling
     * @param transparentSubMeshes List of transparent meshes to render
     * @returns The array of submeshes that could not be handled by this renderer
     */
    public render(transparentSubMeshes: SmartArray<SubMesh>): SmartArray<SubMesh> {
        this._candidateSubMeshes.length = 0;
        this._excludedSubMeshes.length = 0;
        if (!this.isReady()) {
            return this._excludedSubMeshes;
        }

        if (this._scene.activeCamera) {
            this._engine.setViewport(this._scene.activeCamera.viewport);
        }

        for (let i = 0; i < transparentSubMeshes.length; i++) {
            const subMesh = transparentSubMeshes.data[i];
            const material = subMesh.getMaterial();
            const fillMode = material && subMesh.getRenderingMesh()._getRenderingFillMode(material.fillMode);

            if (
                material &&
                (fillMode === Material.TriangleFanDrawMode || fillMode === Material.TriangleFillMode || fillMode === Material.TriangleStripDrawMode) &&
                this._excludedMeshes.indexOf(subMesh.getMesh().uniqueId) === -1
            ) {
                this._candidateSubMeshes.push(subMesh);
            } else {
                this._excludedSubMeshes.push(subMesh);
            }
        }

        if (!this._candidateSubMeshes.length) {
            this._noTransparentMeshes();
            return this._excludedSubMeshes;
        }

        const currentRenderPassId = this._engine.currentRenderPassId;

        this._beforeRender();

        if (this._useRenderPasses) {
            this._engine.currentRenderPassId = this._renderPassIds[0];
        }

        // Clears
        this._engine.bindFramebuffer(this._depthMrts[0].renderTarget!);
        this._engine.bindAttachments(this._layoutCache[0]);
        this._engine.clear(this._colorCache[0], true, false, false);
        this._engine.unBindFramebuffer(this._depthMrts[0].renderTarget!);

        this._engine.bindFramebuffer(this._depthMrts[1].renderTarget!);
        this._engine.bindAttachments(this._layoutCache[0]);
        this._engine.clear(this._colorCache[1], true, false, false);
        this._engine.unBindFramebuffer(this._depthMrts[1].renderTarget!);

        this._engine.bindFramebuffer(this._colorMrts[0].renderTarget!);
        this._engine.bindAttachments(this._layoutCache[1]);
        this._engine.clear(this._colorCache[2], true, false, false);
        this._engine.unBindFramebuffer(this._colorMrts[0].renderTarget!);

        this._engine.bindFramebuffer(this._colorMrts[1].renderTarget!);
        this._engine.bindAttachments(this._layoutCache[1]);
        this._engine.clear(this._colorCache[2], true, false, false);
        this._engine.unBindFramebuffer(this._colorMrts[1].renderTarget!);

        // Draw depth for first pass
        this._engine.bindFramebuffer(this._depthMrts[0].renderTarget!);
        this._engine.bindAttachments(this._layoutCache[0]);

        this._engine.setAlphaMode(Constants.ALPHA_ONEONE_ONEONE); // in WebGPU, when using MIN or MAX equation, the src / dst color factors should not use SRC_ALPHA and the src / dst alpha factors must be 1 else WebGPU will throw a validation error
        this._engine.setAlphaEquation(Constants.ALPHA_EQUATION_MAX);
        this._engine.depthCullingState.depthMask = false;
        this._engine.depthCullingState.depthTest = true;
        this._engine.applyStates();

        this._currentPingPongState = 1;
        // Render
        this._renderSubMeshes(this._candidateSubMeshes);
        this._engine.unBindFramebuffer(this._depthMrts[0].renderTarget!);

        this._scene.resetCachedMaterial();

        // depth peeling ping-pong
        let readId = 0;
        let writeId = 0;

        for (let i = 0; i < this._passCount; i++) {
            readId = i % 2;
            writeId = 1 - readId;
            this._currentPingPongState = readId;

            if (this._useRenderPasses) {
                this._engine.currentRenderPassId = this._renderPassIds[i + 1];
            }

            if (this._scene.activeCamera) {
                this._engine.setViewport(this._scene.activeCamera.viewport);
            }

            // Clears
            this._engine.bindFramebuffer(this._depthMrts[writeId].renderTarget!);
            this._engine.bindAttachments(this._layoutCache[0]);
            this._engine.clear(this._colorCache[0], true, false, false);
            this._engine.unBindFramebuffer(this._depthMrts[writeId].renderTarget!);

            this._engine.bindFramebuffer(this._colorMrts[writeId].renderTarget!);
            this._engine.bindAttachments(this._layoutCache[1]);
            this._engine.clear(this._colorCache[2], true, false, false);
            this._engine.unBindFramebuffer(this._colorMrts[writeId].renderTarget!);

            this._engine.bindFramebuffer(this._depthMrts[writeId].renderTarget!);
            this._engine.bindAttachments(this._layoutCache[2]);

            this._engine.setAlphaMode(Constants.ALPHA_ONEONE_ONEONE); // the value does not matter (as MAX operation does not use them) but the src and dst color factors should not use SRC_ALPHA else WebGPU will throw a validation error
            this._engine.setAlphaEquation(Constants.ALPHA_EQUATION_MAX);
            this._engine.depthCullingState.depthTest = false;
            this._engine.applyStates();

            // Render
            this._renderSubMeshes(this._candidateSubMeshes);
            this._engine.unBindFramebuffer(this._depthMrts[writeId].renderTarget!);

            this._scene.resetCachedMaterial();

            // Back color
            this._engine.bindFramebuffer(this._blendBackMrt.renderTarget!);
            this._engine.bindAttachments(this._layoutCache[0]);
            this._engine.setAlphaEquation(Constants.ALPHA_EQUATION_ADD);
            this._engine.setAlphaMode(Constants.ALPHA_LAYER_ACCUMULATE);
            this._engine.applyStates();

            const blendBackEffectWrapper = writeId === 0 || !this._useRenderPasses ? this._blendBackEffectWrapper : this._blendBackEffectWrapperPingPong;
            this._engine.enableEffect(blendBackEffectWrapper.drawWrapper);
            blendBackEffectWrapper.effect.setTexture("uBackColor", this._thinTextures[writeId * 3 + 2]);
            this._effectRenderer.render(blendBackEffectWrapper);
            this._engine.unBindFramebuffer(this._blendBackMrt.renderTarget!);
        }

        this._engine.currentRenderPassId = currentRenderPassId;

        // Final composition on default FB
        this._finalCompose(writeId);

        this._engine.setAlphaMode(Constants.ALPHA_DISABLE);

        this._engine.depthCullingState.depthMask = true;
        this._engine.depthCullingState.depthTest = true;

        this._afterRender();

        return this._excludedSubMeshes;
    }

    /**
     * Disposes the depth peeling renderer and associated resources
     */
    public dispose() {
        this._disposeTextures();
        this._blendBackEffectWrapper.dispose();
        this._finalEffectWrapper.dispose();
        this._effectRenderer.dispose();
        this._releaseRenderPassIds();
    }
}
