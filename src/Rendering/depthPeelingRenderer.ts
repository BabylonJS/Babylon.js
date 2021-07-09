import { Constants } from "../Engines/constants";
import { Engine } from "../Engines/engine";
import { Effect } from "../Materials/effect";
import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import { Color4 } from "../Maths/math.color";
import { SubMesh } from "../Meshes/subMesh";
import { SmartArray } from "../Misc/smartArray";
import { Scene } from "../scene";

import "../Shaders/postprocess.vertex";
import "../Shaders/oitFinal.fragment";
import "../Shaders/oitBackBlend.fragment";

export class DepthPeelingRenderer {
    private _scene: Scene;
    private _engine: Engine;
    private _depthMrts: MultiRenderTarget[];
    private _colorMrts: MultiRenderTarget[];
    private _blendBackMrt: MultiRenderTarget;

    private _blendBackEffect: Effect;
    private _finalEffect: Effect;

    private _passCount: number;

    constructor(scene: Scene, passCount: number = 5) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._passCount = passCount;
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
            this._engine.bindTextureFramebuffer(this._depthMrts[i].getInternalTexture()!._framebuffer as WebGLFramebuffer, depthTexture);
            this._engine.bindTextureFramebuffer(this._depthMrts[i].getInternalTexture()!._framebuffer as WebGLFramebuffer, frontColorTexture, 1);
            this._engine.bindTextureFramebuffer(this._depthMrts[i].getInternalTexture()!._framebuffer as WebGLFramebuffer, backColorTexture, 2);

            this._engine.bindTextureFramebuffer(this._colorMrts[i].getInternalTexture()!._framebuffer as WebGLFramebuffer, frontColorTexture);
            this._engine.bindTextureFramebuffer(this._colorMrts[i].getInternalTexture()!._framebuffer as WebGLFramebuffer, backColorTexture, 1);
        }

        const blendBackTexture = this._engine._createInternalTexture(size, optionsArray[1]);
        this._engine.bindTextureFramebuffer(this._blendBackMrt.getInternalTexture()!._framebuffer as WebGLFramebuffer, blendBackTexture);
    }

    private _createEffects() {
        this._blendBackEffect = this._scene.getEngine().createEffect(
            {
                vertex: "postprocess",
                fragment: "oitBackBlend",
            },
            {
                attributes: [],
                samplers: [],
                uniformsNames: [],
                uniformBuffersNames: [],
                defines: "",
                fallbacks: null,
                onCompiled: null,
                onError: null,
            },
            this._engine
        );

        this._finalEffect = new Effect(
            {
                vertex: "postprocess",
                fragment: "oitFinal",
            },
            {
                attributes: [],
                samplers: [],
                uniformsNames: [],
                uniformBuffersNames: [],
                defines: "",
                fallbacks: null,
                onCompiled: null,
                onError: null,
            },
            this._engine
        );
    }

    private _updateSize() {
        // TODO
    }

    public render(transparentSubMeshes: SmartArray<SubMesh>) {
        if (!this._blendBackEffect.isReady() || !this._finalEffect.isReady()) {
            return;
        }

        const DEPTH_CLEAR_VALUE = -99999.0;
        const MIN_DEPTH = 0;
        const MAX_DEPTH = 1;

        // Clears
        this._engine._bindUnboundFramebuffer(this._blendBackMrt.getInternalTexture()!._framebuffer as WebGLFramebuffer);
        this._engine.clear(new Color4(0, 0, 0, 0), true, false, false);

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

        // TODO add method in engine
        const gl = this._engine._gl;
        gl.blendEquation(gl.MAX);

        // Bind textures on depth peel shader
        // Render mesh

        // depth peeling ping-pong
        let readId;
        let writeId;

        for (let i = 0; i < this._passCount; i++) {
            readId = i % 2;
            writeId = 1 - readId;

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
            // TODO : Set texture uniform
            for (let j = 0; j < transparentSubMeshes.length; j++) {
                const material = transparentSubMeshes.data[j].getMaterial();
                let previousShaderHotSwapping = true;
                if (material) {
                    // Test for OIT compat
                    previousShaderHotSwapping = material.allowShaderHotSwapping;
                    material.allowShaderHotSwapping = false;
                }

                transparentSubMeshes.data[j].render(false);
                
                if (material) {
                    material.allowShaderHotSwapping = previousShaderHotSwapping;
                }
            }
            
            // Back color
            this._engine._bindUnboundFramebuffer(this._blendBackMrt.getInternalTexture()!._framebuffer as WebGLFramebuffer);
            attachments = this._engine.buildTextureLayout([true]);
            this._engine.bindAttachments(attachments);
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            
            this._engine.enableEffect(this._blendBackEffect);
            
            // Bind uniforms
            // Draw quad
        }

        // Final composition on default FB
        this._engine._bindUnboundFramebuffer(null);

        // TODO : alpha state (engine.setAlphaState + engine.applyStates)
        gl.disable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // TODO : set texture uniform
        // TODO : draw quad with finalProgram
    }

    public dispose() {}
}
