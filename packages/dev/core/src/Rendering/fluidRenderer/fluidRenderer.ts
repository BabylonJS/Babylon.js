/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fluidRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fluidRenderer.pure";

import { registerFluidRenderer } from "./fluidRenderer.pure";
registerFluidRenderer();
