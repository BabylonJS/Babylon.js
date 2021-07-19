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

import "../Shaders/postprocess.vertex";
import "../Shaders/oitFinal.fragment";
import "../Shaders/oitBackBlend.fragment";
import { PrePassRenderer } from "./prePassRenderer";
import { InternalTexture } from "../Materials";

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
            // Not supported, print error
            return;
        } else {
            scene.prePassRenderer!.markAsDirty();
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

            // TODO : lower level (move in engine.multiRender)
            this._depthMrts[i].setInternalTexture(depthTexture, 0, 0);
            this._depthMrts[i].setInternalTexture(frontColorTexture, 1, 1);
            this._depthMrts[i].setInternalTexture(backColorTexture, 2, 2);

            this._colorMrts[i].setInternalTexture(frontColorTexture, 0, 0);
            this._colorMrts[i].setInternalTexture(backColorTexture, 1, 1);
            // this._engine.bindTextureFramebuffer(this._depthMrts[i].getInternalTexture()!._framebuffer as WebGLFramebuffer, depthTexture);
            // this._engine.bindTextureFramebuffer(this._depthMrts[i].getInternalTexture()!._framebuffer as WebGLFramebuffer, frontColorTexture, 1);
            // this._engine.bindTextureFramebuffer(this._depthMrts[i].getInternalTexture()!._framebuffer as WebGLFramebuffer, backColorTexture, 2);

            // this._engine.bindTextureFramebuffer(this._colorMrts[i].getInternalTexture()!._framebuffer as WebGLFramebuffer, frontColorTexture);
            // this._engine.bindTextureFramebuffer(this._colorMrts[i].getInternalTexture()!._framebuffer as WebGLFramebuffer, backColorTexture, 1);

            this._thinTextures.push(new ThinTexture(depthTexture), new ThinTexture(frontColorTexture), new ThinTexture(backColorTexture));
        }

        // const blendBackTexture = this._engine._createInternalTexture(size, optionsArray[1]);
        const blendBackTexture = this._engine._createInternalTexture(size, optionsArray[1]);
        this._blendBackTexture = blendBackTexture;
        this._engine.bindTextureFramebuffer(this._blendBackMrt.getInternalTexture()!._framebuffer as WebGLFramebuffer, blendBackTexture);
        this._thinTextures.push(new ThinTexture(blendBackTexture));
    }

    private _updateTextureReferences() {
        const prePassTexture = this._scene.prePassRenderer!.defaultRT.textures?.length ? this._scene.prePassRenderer!.defaultRT.textures[0].getInternalTexture() : null;

        if (prePassTexture && this._blendBackTexture !== prePassTexture) {
            this._blendBackTexture = prePassTexture!;
            this._engine.bindTextureFramebuffer(this._blendBackMrt.getInternalTexture()!._framebuffer as WebGLFramebuffer, this._blendBackTexture);
            this._thinTextures[6].dispose();
            this._thinTextures[6] = new ThinTexture(this._blendBackTexture);
        }
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
        if (!this._blendBackEffectWrapper.effect.isReady() || !this._finalEffectWrapper.effect.isReady()) {
            return;
        }

        this._updateTextureReferences();

        // We bind the opaque depth buffer to correctly occlude fragments that are behind opaque geometry
        // TODO : move into thinengine
        const gl = this._engine._gl;
        const depthStencilBuffer = this._scene.prePassRenderer!.getRenderTarget().getInternalTexture()?._depthStencilBuffer as WebGLRenderbuffer;
        this._engine._bindUnboundFramebuffer(this._depthMrts[0].getInternalTexture()!._framebuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthStencilBuffer);
        this._engine._bindUnboundFramebuffer(null);

        const DEPTH_CLEAR_VALUE = -99999.0;
        const MIN_DEPTH = 0;
        const MAX_DEPTH = 1;

        // TODO
        (this._scene.prePassRenderer! as any)._enabled = false;

        // Clears
        this._engine._bindUnboundFramebuffer(this._depthMrts[0].getInternalTexture()!._framebuffer as WebGLFramebuffer);
        let attachments = this._engine.buildTextureLayout([true]);
        this._engine.bindAttachments(attachments);
        this._engine.clear(new Color4(DEPTH_CLEAR_VALUE, DEPTH_CLEAR_VALUE, 0, 0), true, false, false);

        this._engine._bindUnboundFramebuffer(this._depthMrts[1].getInternalTexture()!._framebuffer as WebGLFramebuffer);
        this._engine.clear(new Color4(-MIN_DEPTH, MAX_DEPTH, 0, 0), true, false, false);

        this._engine._bindUnboundFramebuffer(this._colorMrts[0].getInternalTexture()!._framebuffer as WebGLFramebuffer);
        attachments = this._engine.buildTextureLayout([true, true]);
        this._engine.bindAttachments(attachments);
        this._engine.clear(new Color4(0, 0, 0, 0), true, false, false);

        this._engine._bindUnboundFramebuffer(this._colorMrts[1].getInternalTexture()!._framebuffer as WebGLFramebuffer);
        this._engine.clear(new Color4(0, 0, 0, 0), true, false, false);

        // Draw depth for first pass
        this._engine._bindUnboundFramebuffer(this._depthMrts[0].getInternalTexture()!._framebuffer as WebGLFramebuffer);
        attachments = this._engine.buildTextureLayout([true]);
        this._engine.bindAttachments(attachments);

        // TODO add method in engine
        // TODO : drawElements uses apply states so blendEquation will be overwritten
        // Use engine.states = .... like in effectRenderer.ts
        // Maybe we will need to add a different state because gl.MAX may be unused and not implemented for now in BJS
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.MAX);
        // TODO : depthmask and cullface
        gl.depthMask(false);
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        this._currentPingPongState = 1;
        for (let j = 0; j < transparentSubMeshes.length; j++) {
            const material = transparentSubMeshes.data[j].getMaterial();
            let previousShaderHotSwapping = true;
            if (material) {
                // Test for OIT compat
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

            this._engine._bindUnboundFramebuffer(this._depthMrts[writeId].getInternalTexture()!._framebuffer as WebGLFramebuffer);
            attachments = this._engine.buildTextureLayout([true]);
            this._engine.bindAttachments(attachments);
            this._engine.clear(new Color4(DEPTH_CLEAR_VALUE, DEPTH_CLEAR_VALUE, 0, 0), true, false, false);

            this._engine._bindUnboundFramebuffer(this._colorMrts[writeId].getInternalTexture()!._framebuffer as WebGLFramebuffer);
            attachments = this._engine.buildTextureLayout([true, true]);
            this._engine.bindAttachments(attachments);
            this._engine.clear(new Color4(0, 0, 0, 0), true, false, false);

            this._engine._bindUnboundFramebuffer(this._depthMrts[writeId].getInternalTexture()!._framebuffer as WebGLFramebuffer);
            attachments = this._engine.buildTextureLayout([true, true, true]);
            this._engine.bindAttachments(attachments);

            // TODO : alpha state (engine.setAlphaState + engine.applyStates)
            gl.blendEquation(gl.MAX);
            gl.enable(gl.BLEND);

            for (let j = 0; j < transparentSubMeshes.length; j++) {
                const material = transparentSubMeshes.data[j].getMaterial();
                let previousShaderHotSwapping = true;
                if (material) {
                    // Test for OIT compat
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
            this._engine._bindUnboundFramebuffer(this._blendBackMrt.getInternalTexture()!._framebuffer as WebGLFramebuffer);
            attachments = this._engine.buildTextureLayout([true]);
            this._engine.bindAttachments(attachments);
            // TODO : drawElements uses apply states so blendEquation will be overwritten
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

            // TODO : remove (see above)
            (this._engine.depthCullingState as any)._isDepthTestDirty = false;
            this._engine.enableEffect(this._blendBackEffectWrapper.effect);
            this._blendBackEffectWrapper.effect.setTexture("uBackColor", this._thinTextures[writeId * 3 + 2]);
            this._effectRenderer.render(this._blendBackEffectWrapper);
        }

        // Final composition on default FB
        this._engine._bindUnboundFramebuffer(null);

        // TODO : alpha state (engine.setAlphaState + engine.applyStates)
        gl.disable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // TODO : remove (see above)
        (this._engine.depthCullingState as any)._isDepthTestDirty = false;
        this._engine.enableEffect(this._finalEffectWrapper.effect);
        this._finalEffectWrapper.effect.setTexture("uFrontColor", this._thinTextures[writeId * 3 + 1]);
        this._finalEffectWrapper.effect.setTexture("uBackColor", this._thinTextures[6]);
        this._effectRenderer.render(this._finalEffectWrapper);

        // TODO
        (this._scene.prePassRenderer! as any)._enabled = true;
        gl.depthMask(true);
    }

    public dispose() {
        // TODO
    }
}
