// Shared contract for a per-layer-kind renderer. Each Lottie layer type (shape, text, image) is
// handled by one of these. The player walks layers in z-order, dispatching each to the renderer for
// its kind.
//
// Rendering is imperative: each renderer issues draws directly against the engine it captured at
// construction, so `recordLayer` takes only the opaque token and optional matte token.

import { type Mat2D } from "../../animation/matrix2D";
import { type IParsedLayer } from "../../animation/parse";

export interface ILayerRenderContext {
    /** Current comp frame. */
    frame: number;
    /** Drawing-buffer size in pixels. */
    screenW: number;
    screenH: number;
}

/**
 * A renderer for one Lottie layer kind. Lifecycle per frame:
 *   beginFrame() → emitLayer()* (in z-order) → flush() → recordLayer()* (in z-order).
 * `emitLayer` accumulates CPU-side geometry and returns an opaque token; `flush` uploads
 * GPU buffers + binds shared attributes once; `recordLayer` issues that layer's draws.
 */
export interface ILayerRenderer {
    /** Lottie layer `ty` this renderer handles. */
    readonly kind: number;
    /** True once every GPU effect this renderer owns has compiled and linked. The player
     *  skips rendering until all active renderers report ready (effects compile
     *  asynchronously). */
    isReady(): boolean;
    /** Reset per-frame accumulation. */
    beginFrame(ctx: ILayerRenderContext): void;
    /**
     * Accumulate one layer's draws. `world` is the global projection × the layer transform.
     * Returns an opaque token to pass back to `recordLayer`, or `-1` if nothing was emitted.
     */
    emitLayer(layer: IParsedLayer, world: Mat2D, layerAlpha: number, ctx: ILayerRenderContext): number;
    /** Upload all accumulated GPU buffers for the frame (called once after all emits). */
    flush(ctx: ILayerRenderContext): void;
    /** Issue the draws for a previously-emitted layer token into the current framebuffer. */
    recordLayer(token: number, matteToken?: number): void;
    dispose(): void;
}
