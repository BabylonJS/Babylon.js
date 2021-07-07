import { Constants, Engine } from "../Engines";
import { IMultiRenderTargetOptions, MultiRenderTarget, Texture } from "../Materials";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import { Scene } from "../scene";

export class DepthPeelingRenderer {
    private _scene: Scene;
    private _engine: Engine;
    private _depthMrts: MultiRenderTarget[];
    private _colorMrts: MultiRenderTarget[];
    private _blendBackMrt: MultiRenderTarget;

    private _depthLayersCount: number;

    constructor(scene: Scene, depthLayersCount: number = 5) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._depthLayersCount = depthLayersCount;
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

    public dispose() {}
}
