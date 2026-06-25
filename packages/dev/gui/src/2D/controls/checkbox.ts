/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./checkbox.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./checkbox.pure";

import { RegisterCheckbox } from "./checkbox.pure";
RegisterCheckbox();
