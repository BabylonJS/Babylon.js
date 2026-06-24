/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./container.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./container.pure";

import { RegisterContainer } from "./container.pure";
RegisterContainer();
