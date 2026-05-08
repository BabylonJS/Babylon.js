export * from "./abstractEngine.stencil.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.stencil.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.stencil.pure";

import { RegisterAbstractEngineStencil } from "./abstractEngine.stencil.pure";
RegisterAbstractEngineStencil();
