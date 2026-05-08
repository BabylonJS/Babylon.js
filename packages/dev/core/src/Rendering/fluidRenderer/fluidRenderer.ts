export * from "./fluidRenderer.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fluidRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fluidRenderer.pure";

import { RegisterFluidRenderer } from "./fluidRenderer.pure";
RegisterFluidRenderer();
