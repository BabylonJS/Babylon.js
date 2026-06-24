/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./EXT_lights_image_based.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./EXT_lights_image_based.types";
export * from "./EXT_lights_image_based.pure";

import { RegisterEXT_lights_image_based } from "./EXT_lights_image_based.pure";
RegisterEXT_lights_image_based();
