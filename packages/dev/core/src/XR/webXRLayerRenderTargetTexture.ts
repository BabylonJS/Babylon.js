import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.pure";

/**
 * A render target texture for a WebXR layer that renders into a specific array layer of its underlying
 * texture (e.g. one layer per eye of a layered projection-layer texture array).
 *
 * The array-layer index is kept here, in the XR area, rather than on the general-purpose
 * {@link RenderTargetTexture}. It mirrors how {@link MultiviewRenderTarget} keeps its XR-specific bind
 * behavior in a subclass that overrides {@link _bindFrameBuffer}: the scene binds a camera's
 * `outputRenderTarget` with no arguments, so the target itself must know which layer to bind.
 * @internal
 */
export class WebXRLayerRenderTargetTexture extends RenderTargetTexture {
    /**
     * The array layer index this render target binds when the scene binds it with no explicit layer.
     * Defaults to 0. Set per eye by the WebGPU XR layer provider so each eye renders into its own layer.
     */
    public layerIndex = 0;

    /**
     * @internal
     * @param faceIndex face index to bind to if this is a cubetexture
     * @param layer defines the index of the texture to bind in the array; defaults to {@link layerIndex}
     */
    public override _bindFrameBuffer(faceIndex: number = 0, layer: number = this.layerIndex) {
        super._bindFrameBuffer(faceIndex, layer);
    }
}
