import { Constants, Engine } from "../Engines";
import { IMultiRenderTargetOptions, MultiRenderTarget, Texture } from "../Materials";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import { Color4 } from "../Maths";
import { Scene } from "../scene";

export class DepthPeelingRenderer {
    private _scene: Scene;
    private _engine: Engine;
    private _depthMrts: MultiRenderTarget[];
    private _colorMrts: MultiRenderTarget[];
    private _blendBackMrt: MultiRenderTarget;

    private _passCount: number;

    constructor(scene: Scene, passCount: number = 5) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._passCount = passCount;
        this._createTexturesAndFrameBuffers();
    }

    private _createTexturesAndFrameBuffers() {
        const size = {
            width: this._engine.getRenderWidth(),
            height: this._engine.getRenderHeight(),
        };

        // 2 for ping pong
        this._depthMrts = [new MultiRenderTarget("depthPeelingDepth0", size, 0, this._scene), new MultiRenderTarget("depthPeelingDepth1", size, 0, this._scene)];
        this._colorMrts = [new MultiRenderTarget("depthPeelingColor0", size, 0, this._scene), new MultiRenderTarget("depthPeelingColor1", size, 0, this._scene)];
        this._blendBackMrt = new MultiRenderTarget("depthPeelingBack", size, 0, this._scene);

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

    private _updateSize() {
        // TODO
    }

    public render() {
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
            gl.blendEquation(gl.MAX);

            // TODO : Set texture uniform

            // TODO : draw mesh

            // Back color
        }
    }

    public dispose() {}
}
