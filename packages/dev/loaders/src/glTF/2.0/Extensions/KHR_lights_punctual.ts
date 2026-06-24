/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_lights_punctual.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_lights_punctual.types";
export * from "./KHR_lights_punctual.pure";

import { RegisterKHR_lights } from "./KHR_lights_punctual.pure";
RegisterKHR_lights();
