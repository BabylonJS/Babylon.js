// Per-frame render lifecycle for the stencil-then-cover vector renderer.
//
// The WebGL2 default framebuffer is natively multisampled when the ThinEngine is created with
// `antialias: true` and carries a stencil attachment when created with `stencil: true`.
// Stencil-then-cover therefore renders directly to the canvas with no offscreen resolve; this
// module owns viewport setup, the clear, and the composition-bounds scissor.

import "core/Engines/thinEngine.scissor";

import { type ThinEngine } from "core/Engines/thinEngine";
import { type IColor4Like, type IViewportLike } from "core/Maths/math.like";

/** A clip rectangle in WebGL (lower-left origin) drawing-buffer pixels. */
export interface IVectorScissorRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Normalized full-target viewport. Module-level so the render loop allocates nothing. */
const FullViewport: IViewportLike = { x: 0, y: 0, width: 1, height: 1 };

/**
 * Begins a frame: resets the viewport to the full drawing buffer, clears color and stencil (to 0)
 * across the whole canvas, then clips subsequent draws to the comp bounds.
 *
 * The clear must reset stencil, so the stencil write mask is forced open first — a clear
 * respects the current write mask. Scissor is disabled during the clear so the letterbox
 * margins are cleared too, then enabled for the comp-bounds draws.
 * @param engine The engine to render with.
 * @param scissor The composition-bounds clip rectangle, in lower-left-origin drawing-buffer pixels.
 * @param clearColor The color to clear the canvas to. Pass an alpha of 0 for a transparent canvas.
 */
export function BeginVectorFrame(engine: ThinEngine, scissor: IVectorScissorRect, clearColor: IColor4Like): void {
    engine.setViewport(FullViewport);
    engine.disableScissor();

    // A clear respects the stencil write mask; force it open so stencil actually resets to 0.
    engine.stencilState.stencilTest = true;
    engine.stencilState.stencilMask = 0xff;
    engine.clear(clearColor, true, false, true);

    engine.enableScissor(scissor.x, scissor.y, scissor.width, scissor.height);
}

/**
 * Ends a frame: drops the comp-bounds clip so the next frame's full-canvas clear is not clipped.
 * @param engine The engine that rendered the frame.
 */
export function EndVectorFrame(engine: ThinEngine): void {
    engine.disableScissor();
}
