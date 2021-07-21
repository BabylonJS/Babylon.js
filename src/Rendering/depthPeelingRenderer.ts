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
        this._createTexturesAndFrameBuffers();
        this._createEffects();
    }

    private _createTexturesAndFrameBuffers() {
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

            this._depthMrts[i].setInternalTexture(depthTexture, 0, 0);
            this._depthMrts[i].setInternalTexture(frontColorTexture, 1, 1);
            this._depthMrts[i].setInternalTexture(backColorTexture, 2, 2);

            this._colorMrts[i].setInternalTexture(frontColorTexture, 0, 0);
            this._colorMrts[i].setInternalTexture(backColorTexture, 1, 1);

            this._thinTextures.push(new ThinTexture(depthTexture), new ThinTexture(frontColorTexture), new ThinTexture(backColorTexture));
        }
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
            this._blendBackMrt.setInternalTexture(this._blendBackTexture, 0, 0);

            if (this._thinTextures[6]) {
                this._thinTextures[6].dispose();
            }
            this._thinTextures[6] = new ThinTexture(this._blendBackTexture);

            // We bind the opaque depth buffer to correctly occlude fragments that are behind opaque geometry
            const depthStencilBuffer = prePassTexture._depthStencilBuffer;
            const framebuffer = this._depthMrts[0]._getFrameBuffer();
            if (!depthStencilBuffer || !framebuffer) {
                return false;
            }

            this._engine.bindFramebufferRenderbuffer(framebuffer, depthStencilBuffer);
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

    public setPrePassRenderer(prePassRenderer: PrePassRenderer) {
        prePassRenderer.addEffectConfiguration(this._prePassEffectConfiguration);
    }

    public _updateSize() {
        // TODO
    }

    public bind(effect: Effect) {
        effect.setTexture("oitDepthSampler", this._thinTextures[this._currentPingPongState * 3]);
        effect.setTexture("oitFrontColorSampler", this._thinTextures[this._currentPingPongState * 3 + 1]);
    }

    public render(transparentSubMeshes: SmartArray<SubMesh>) {
        if (!this._blendBackEffectWrapper.effect.isReady() || !this._finalEffectWrapper.effect.isReady() || !this._updateTextureReferences()) {
            return;
        }

        const DEPTH_CLEAR_VALUE = -99999.0;
        const MIN_DEPTH = 0;
        const MAX_DEPTH = 1;
        const gl = this._engine._gl;

        // TODO
        (this._scene.prePassRenderer! as any)._enabled = false;

        // Clears
        this._engine._bindUnboundFramebuffer(this._depthMrts[0]._getFrameBuffer());
        let attachments = this._engine.buildTextureLayout([true]);
        this._engine.bindAttachments(attachments);
        this._engine.clear(new Color4(DEPTH_CLEAR_VALUE, DEPTH_CLEAR_VALUE, 0, 0), true, false, false);

        this._engine._bindUnboundFramebuffer(this._depthMrts[1]._getFrameBuffer());
        this._engine.clear(new Color4(-MIN_DEPTH, MAX_DEPTH, 0, 0), true, false, false);

        this._engine._bindUnboundFramebuffer(this._colorMrts[0]._getFrameBuffer());
        attachments = this._engine.buildTextureLayout([true, true]);
        this._engine.bindAttachments(attachments);
        this._engine.clear(new Color4(0, 0, 0, 0), true, false, false);

        this._engine._bindUnboundFramebuffer(this._colorMrts[1]._getFrameBuffer());
        this._engine.clear(new Color4(0, 0, 0, 0), true, false, false);

        // Draw depth for first pass
        this._engine._bindUnboundFramebuffer(this._depthMrts[0]._getFrameBuffer());
        attachments = this._engine.buildTextureLayout([true]);
        this._engine.bindAttachments(attachments);

        this._engine.setAlphaEquation(Constants.ALPHA_EQUATION_MAX);
        this._engine._alphaState.alphaBlend = true;
        this._engine.depthCullingState.depthMask = false;
        this._engine.depthCullingState.depthTest = true;
        this._engine.depthCullingState.cull = false;
        this._engine.applyStates();

        this._currentPingPongState = 1;
        for (let j = 0; j < transparentSubMeshes.length; j++) {
            const material = transparentSubMeshes.data[j].getMaterial();
            let previousShaderHotSwapping = true;
            if (material) {
                previousShaderHotSwapping = material.allowShaderHotSwapping;
                material.allowShaderHotSwapping = false;
            }
            // TODO : remove
            gl.disable(gl.CULL_FACE);

            transparentSubMeshes.data[j].render(false);

            if (material) {
                material.allowShaderHotSwapping = previousShaderHotSwapping;
            }
        }

        // depth peeling ping-pong
        let readId = 0;
        let writeId = 0;

        for (let i = 0; i < this._passCount; i++) {
            readId = i % 2;
            writeId = 1 - readId;
            this._currentPingPongState = readId;

            this._engine._bindUnboundFramebuffer(this._depthMrts[writeId]._getFrameBuffer());
            attachments = this._engine.buildTextureLayout([true]);
            this._engine.bindAttachments(attachments);
            this._engine.clear(new Color4(DEPTH_CLEAR_VALUE, DEPTH_CLEAR_VALUE, 0, 0), true, false, false);

            this._engine._bindUnboundFramebuffer(this._colorMrts[writeId]._getFrameBuffer());
            attachments = this._engine.buildTextureLayout([true, true]);
            this._engine.bindAttachments(attachments);
            this._engine.clear(new Color4(0, 0, 0, 0), true, false, false);

            this._engine._bindUnboundFramebuffer(this._depthMrts[writeId]._getFrameBuffer());
            attachments = this._engine.buildTextureLayout([true, true, true]);
            this._engine.bindAttachments(attachments);

            this._engine.setAlphaEquation(Constants.ALPHA_EQUATION_MAX);
            this._engine._alphaState.alphaBlend = true;
            this._engine.applyStates();

            for (let j = 0; j < transparentSubMeshes.length; j++) {
                const material = transparentSubMeshes.data[j].getMaterial();
                let previousShaderHotSwapping = true;
                if (material) {
                    previousShaderHotSwapping = material.allowShaderHotSwapping;
                    material.allowShaderHotSwapping = false;
                }
                // TODO : remove
                gl.disable(gl.CULL_FACE);

                transparentSubMeshes.data[j].render(false);

                if (material) {
                    material.allowShaderHotSwapping = previousShaderHotSwapping;
                }
            }

            // Back color
            this._engine._bindUnboundFramebuffer(this._blendBackMrt._getFrameBuffer());
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
        this._engine._bindUnboundFramebuffer(null);

        this._engine.setAlphaMode(Constants.ALPHA_SRC_DSTONEMINUSSRCALPHA);
        this._engine._alphaState.alphaBlend = false;
        this._engine.applyStates();

        this._engine.enableEffect(this._finalEffectWrapper.effect);
        this._finalEffectWrapper.effect.setTexture("uFrontColor", this._thinTextures[writeId * 3 + 1]);
        this._finalEffectWrapper.effect.setTexture("uBackColor", this._thinTextures[6]);
        this._effectRenderer.render(this._finalEffectWrapper);

        // TODO
        (this._scene.prePassRenderer! as any)._enabled = true;
        this._engine.depthCullingState.depthMask = true;
    }

    public dispose() {
        // TODO
    }
}
