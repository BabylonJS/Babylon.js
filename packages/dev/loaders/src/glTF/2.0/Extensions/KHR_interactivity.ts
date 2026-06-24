/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_interactivity.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_interactivity.types";
export * from "./KHR_interactivity.pure";

import { RegisterKHR_interactivity } from "./KHR_interactivity.pure";
RegisterKHR_interactivity();
