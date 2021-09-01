import { Constants } from "../Engines/constants";
import { Engine } from "../Engines/engine";
import { Effect } from "../Materials/effect";
import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import { Color4 } from "../Maths/math.color";
import { SubMesh } from "../Meshes/subMesh";
import { SmartArray } from "../Misc/smartArray";
import { Scene } from "../scene";
import { ThinTexture } from "../Materials/Textures/thinTexture";
import { EffectRenderer, EffectWrapper } from "../Materials/effectRenderer";
import { PrePassEffectConfiguration } from "./prePassEffectConfiguration";
import { PrePassRenderer } from "./prePassRenderer";
import { InternalTexture } from "../Materials/Textures/internalTexture";
import { Logger } from "../Misc/logger";

import "../Shaders/postprocess.vertex";
import "../Shaders/oitFinal.fragment";
import "../Shaders/oitBackBlend.fragment";

class DepthPeelingEffectConfiguration implements PrePassEffectConfiguration {
    /**
     * Is this effect enabled
     */
    public enabled = true;

    /**
     * Name of the configuration
     */
    public name = "depthPeeling";

    /**
     * Textures that should be present in the MRT for this effect to work
     */
    public readonly texturesRequired: number[] = [Constants.PREPASS_COLOR_TEXTURE_TYPE, Constants.PREPASS_ALBEDO_TEXTURE_TYPE];
}

/**
 * The depth peeling renderer that performs
 * Order independant transparency (OIT).
 * This should not be instanciated directly, as it is part of a scene component
 */
export class DepthPeelingRenderer {
    private _scene: Scene;
    private _engine: Engine;
    private _depthMrts: MultiRenderTarget[];
    private _thinTextures: ThinTexture[] = [];
    private _colorMrts: MultiRenderTarget[];
    private _blendBackMrt: MultiRenderTarget;

    private _blendBackEffectWrapper: EffectWrapper;
    private _finalEffectWrapper: EffectWrapper;
    private _effectRenderer: EffectRenderer;

    private _passCount: number;
    private _currentPingPongState: number = 0;
    private _prePassEffectConfiguration: DepthPeelingEffectConfiguration;

    private _blendBackTexture: InternalTexture;

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

        //  We need a depth texture for opaque
        if (!scene.enablePrePassRenderer()) {
            Logger.Warn("Depth peeling for order independant transparency could not enable PrePass, aborting.");
            return;
        }

        this._prePassEffectConfiguration = new DepthPeelingEffectConfiguration();
        this._createTextures();
        this._createEffects();
    }

    private _createTextures() {
        const size = {
            width: this._engine.getRenderWidth(),
            height: this._engine.getRenderHeight(),
        };

        // 2 for ping pong
        this._depthMrts = [new MultiRenderTarget("depthPeelingDepth0", size, 1, this._scene), new MultiRenderTarget("depthPeelingDepth1", size, 1, this._scene)];
        this._colorMrts = [new MultiRenderTarget("depthPeelingColor0", size, 1, this._scene), new MultiRenderTarget("depthPeelingColor1", size, 1, this._scene)];
        this._blendBackMrt = new MultiRenderTarget("depthPeelingBack", size, 1, this._scene);

        // 0 is a depth texture
        // 1 is a color texture
        const optionsArray = [
            {
                format: Constants.TEXTUREFORMAT_RG,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                type: Constants.TEXTURETYPE_FLOAT,
            } as RenderTargetCreationOptions,
            {
                format: Constants.TEXTUREFORMAT_RGBA,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                type: Constants.TEXTURETYPE_HALF_FLOAT,
            } as RenderTargetCreationOptions,
        ];

        for (let i = 0; i < 2; i++) {
            const depthTexture = this._engine._createInternalTexture(size, optionsArray[0]);
            const frontColorTexture = this._engine._createInternalTexture(size, optionsArray[1]);
            const backColorTexture = this._engine._createInternalTexture(size, optionsArray[1]);

            this._depthMrts[i].setInternalTexture(depthTexture, 0);
            this._depthMrts[i].setInternalTexture(frontColorTexture, 1);
            this._depthMrts[i].setInternalTexture(backColorTexture, 2);

            this._colorMrts[i].setInternalTexture(frontColorTexture, 0);
            this._colorMrts[i].setInternalTexture(backColorTexture, 1);

            this._thinTextures.push(new ThinTexture(depthTexture), new ThinTexture(frontColorTexture), new ThinTexture(backColorTexture));
        }
    }

    private _disposeTextures() {
        for (let i = 0; i < this._thinTextures.length; i++) {
            if (i === 6) {
                // Do not dispose the shared texture with the prepass
                continue;
            }
            this._thinTextures[i].dispose();
        }

        for (let i = 0; i < 2; i++) {
            this._depthMrts[i].dispose(true);
            this._colorMrts[i].dispose(true);
            this._blendBackMrt.dispose(true);
        }

        this._thinTextures = [];
        this._colorMrts = [];
        this._depthMrts = [];
    }

    private _updateTextures() {
        if (this._depthMrts[0].getSize().width !== this._engine.getRenderWidth() || this._depthMrts[0].getSize().height !== this._engine.getRenderHeight()) {
            this._disposeTextures();
            this._createTextures();
        }
        return this._updateTextureReferences();
    }

    private _updateTextureReferences() {
        const prePassRenderer = this._scene.prePassRenderer;

        if (!prePassRenderer) {
            return false;
        }

        // Retrieve opaque color texture
        const textureIndex = prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE);
        const prePassTexture = prePassRenderer.defaultRT.textures?.length ? prePassRenderer.defaultRT.textures[textureIndex].getInternalTexture() : null;

        if (!prePassTexture) {
            return false;
        }

        if (this._blendBackTexture !== prePassTexture) {
            this._blendBackTexture = prePassTexture;
            this._blendBackMrt.setInternalTexture(this._blendBackTexture, 0);

            if (this._thinTextures[6]) {
                this._thinTextures[6].dispose();
            }
            this._thinTextures[6] = new ThinTexture(this._blendBackTexture);

            this._engine.shareDepth(prePassRenderer.defaultRT.renderTarget!, this._depthMrts[0].renderTarget!);
        }

        return true;
    }

    private _createEffects() {
        this._blendBackEffectWrapper = new EffectWrapper({
            fragmentShader: "oitBackBlend",
            useShaderStore: true,
            engine: this._engine,
            samplerNames: ["uBackColor"],
            uniformNames: [],
        });

        this._finalEffectWrapper = new EffectWrapper({
            fragmentShader: "oitFinal",
            useShaderStore: true,
            engine: this._engine,
            samplerNames: ["uFrontColor", "uBackColor"],
            uniformNames: [],
        });

        this._effectRenderer = new EffectRenderer(this._engine);
    }

    /**
     * Links to the prepass renderer
     * @param prePassRenderer The scene PrePassRenderer
     */
    public setPrePassRenderer(prePassRenderer: PrePassRenderer) {
        prePassRenderer.addEffectConfiguration(this._prePassEffectConfiguration);
    }

    /**
     * Binds depth peeling textures on an effect
     * @param effect The effect to bind textures on
     */
    public bind(effect: Effect) {
        effect.setTexture("oitDepthSampler", this._thinTextures[this._currentPingPongState * 3]);
        effect.setTexture("oitFrontColorSampler", this._thinTextures[this._currentPingPongState * 3 + 1]);
    }

    private _renderSubMeshes(transparentSubMeshes: SmartArray<SubMesh>) {
        for (let j = 0; j < transparentSubMeshes.length; j++) {
            const material = transparentSubMeshes.data[j].getMaterial();
            let previousShaderHotSwapping = true;
            let previousBFC = false;

            if (material) {
                previousShaderHotSwapping = material.allowShaderHotSwapping;
                previousBFC = material.backFaceCulling;
                material.allowShaderHotSwapping = false;
                material.backFaceCulling = false;
            }

            transparentSubMeshes.data[j].render(false);

            if (material) {
                material.allowShaderHotSwapping = previousShaderHotSwapping;
                material.backFaceCulling = previousBFC;
            }
        }
    }

    private _finalCompose(writeId: number) {
        this._engine.bindRenderTarget(null);

        this._engine.setAlphaMode(Constants.ALPHA_SRC_DSTONEMINUSSRCALPHA);
        this._engine._alphaState.alphaBlend = false;
        this._engine.applyStates();

        this._engine.enableEffect(this._finalEffectWrapper.effect);
        this._finalEffectWrapper.effect.setTexture("uFrontColor", this._thinTextures[writeId * 3 + 1]);
        this._finalEffectWrapper.effect.setTexture("uBackColor", this._thinTextures[6]);
        this._effectRenderer.render(this._finalEffectWrapper);
    }

    /**
     * Renders transparent submeshes with depth peeling
     * @param transparentSubMeshes List of transparent meshes to render
     */
    public render(transparentSubMeshes: SmartArray<SubMesh>): void {
        if (!this._blendBackEffectWrapper.effect.isReady() || !this._finalEffectWrapper.effect.isReady() || !this._updateTextures()) {
            return;
        }

        if (!transparentSubMeshes.length) {
            this._finalCompose(1);
            return;
        }

        const DEPTH_CLEAR_VALUE = -99999.0;
        const MIN_DEPTH = 0;
        const MAX_DEPTH = 1;

        // TODO
        (this._scene.prePassRenderer! as any)._enabled = false;

        // Clears
        this._engine.bindRenderTarget(this._depthMrts[0].renderTarget);
        let attachments = this._engine.buildTextureLayout([true]);
        this._engine.bindAttachments(attachments);
        this._engine.clear(new Color4(DEPTH_CLEAR_VALUE, DEPTH_CLEAR_VALUE, 0, 0), true, false, false);

        this._engine.bindRenderTarget(this._depthMrts[1].renderTarget);
        this._engine.clear(new Color4(-MIN_DEPTH, MAX_DEPTH, 0, 0), true, false, false);

        this._engine.bindRenderTarget(this._colorMrts[0].renderTarget);
        attachments = this._engine.buildTextureLayout([true, true]);
        this._engine.bindAttachments(attachments);
        this._engine.clear(new Color4(0, 0, 0, 0), true, false, false);

        this._engine.bindRenderTarget(this._colorMrts[1].renderTarget);
        this._engine.clear(new Color4(0, 0, 0, 0), true, false, false);

        // Draw depth for first pass
        this._engine.bindRenderTarget(this._depthMrts[0].renderTarget);
        attachments = this._engine.buildTextureLayout([true]);
        this._engine.bindAttachments(attachments);

        this._engine.setAlphaEquation(Constants.ALPHA_EQUATION_MAX);
        this._engine._alphaState.alphaBlend = true;
        this._engine.depthCullingState.depthMask = false;
        this._engine.depthCullingState.depthTest = true;
        this._engine.depthCullingState.cull = false;
        this._engine.applyStates();

        this._currentPingPongState = 1;
        // Render
        this._renderSubMeshes(transparentSubMeshes);

        // depth peeling ping-pong
        let readId = 0;
        let writeId = 0;

        for (let i = 0; i < this._passCount; i++) {
            readId = i % 2;
            writeId = 1 - readId;
            this._currentPingPongState = readId;

            // Clears
            this._engine.bindRenderTarget(this._depthMrts[writeId].renderTarget);
            attachments = this._engine.buildTextureLayout([true]);
            this._engine.bindAttachments(attachments);
            this._engine.clear(new Color4(DEPTH_CLEAR_VALUE, DEPTH_CLEAR_VALUE, 0, 0), true, false, false);

            this._engine.bindRenderTarget(this._colorMrts[writeId].renderTarget);
            attachments = this._engine.buildTextureLayout([true, true]);
            this._engine.bindAttachments(attachments);
            this._engine.clear(new Color4(0, 0, 0, 0), true, false, false);

            this._engine.bindRenderTarget(this._depthMrts[writeId].renderTarget);
            attachments = this._engine.buildTextureLayout([true, true, true]);
            this._engine.bindAttachments(attachments);

            this._engine.setAlphaEquation(Constants.ALPHA_EQUATION_MAX);
            this._engine._alphaState.alphaBlend = true;
            this._engine.applyStates();

            // Render
            this._renderSubMeshes(transparentSubMeshes);

            // Back color
            this._engine.bindRenderTarget(this._blendBackMrt.renderTarget);
            attachments = this._engine.buildTextureLayout([true]);
            this._engine.bindAttachments(attachments);
            this._engine.setAlphaEquation(Constants.ALPHA_EQUATION_ADD);
            this._engine.setAlphaMode(Constants.ALPHA_LAYER_ACCUMULATE);
            this._engine.applyStates();

            this._engine.enableEffect(this._blendBackEffectWrapper.effect);
            this._blendBackEffectWrapper.effect.setTexture("uBackColor", this._thinTextures[writeId * 3 + 2]);
            this._effectRenderer.render(this._blendBackEffectWrapper);
        }

        // Final composition on default FB
        this._finalCompose(writeId);

        // TODO
        (this._scene.prePassRenderer! as any)._enabled = true;
        this._engine.depthCullingState.depthMask = true;
    }

    /**
     * Disposes the depth peeling renderer and associated ressources
     */
    public dispose() {
        this._disposeTextures();
        this._blendBackEffectWrapper.dispose();
        this._finalEffectWrapper.dispose();
        this._effectRenderer.dispose();
    }
}
