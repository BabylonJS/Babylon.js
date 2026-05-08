/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import objectRendererBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./objectRendererBlock.pure";

import { RegisterObjectRendererBlock } from "./objectRendererBlock.pure";
RegisterObjectRendererBlock();
