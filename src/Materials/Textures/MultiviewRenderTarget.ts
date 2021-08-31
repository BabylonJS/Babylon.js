import { RenderTargetTexture } from '../Textures/renderTargetTexture';
import { Scene } from '../../scene';
import { Constants } from '../../Engines/constants';

/**
 * Renders to multiple views with a single draw call
 * @see https://www.khronos.org/registry/webgl/extensions/WEBGL_multiview/
 */
export class MultiviewRenderTarget extends RenderTargetTexture {
    /**
     * Creates a multiview render target
     * @param scene scene used with the render target
     * @param size the size of the render target (used for each view)
     */
    constructor(scene: Scene, size: number | { width: number, height: number } | { ratio: number } = 512) {
        super("multiview rtt", size, scene, false, true, Constants.TEXTURETYPE_UNSIGNED_INT, false, undefined, false, false, true, undefined, true);
        var rtWrapper = scene.getEngine().createMultiviewRenderTargetTexture(this.getRenderWidth(), this.getRenderHeight());
        this._texture = rtWrapper.texture!;
        this._texture.isMultiview = true;
        this._texture.format = Constants.TEXTUREFORMAT_RGBA;
        this.samples = this._getEngine()!.getCaps().maxSamples || this.samples;
    }

    /**
     * @hidden
     * @param faceIndex the face index, if its a cube texture
     */
    public _bindFrameBuffer(faceIndex: number = 0) {
        if (!this._renderTarget) {
            return;
        }
        this.getScene()!.getEngine().bindMultiviewFramebuffer(this._renderTarget);
    }

    /**
     * Gets the number of views the corresponding to the texture (eg. a MultiviewRenderTarget will have > 1)
     * @returns the view count
     */
    public getViewCount() {
        return 2;
    }
}