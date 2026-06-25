/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./handleMaterial.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./handleMaterial.pure";

import "./shaders/handle.vertex";
import "./shaders/handle.fragment";
