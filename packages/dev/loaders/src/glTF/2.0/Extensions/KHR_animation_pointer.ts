/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_animation_pointer.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_animation_pointer.types";
export * from "./KHR_animation_pointer.pure";

import "./KHR_animation_pointer.data";

import { RegisterKHR_animation_pointer } from "./KHR_animation_pointer.pure";
RegisterKHR_animation_pointer();
