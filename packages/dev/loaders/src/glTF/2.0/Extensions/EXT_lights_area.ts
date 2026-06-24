/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./EXT_lights_area.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./EXT_lights_area.types";
export * from "./EXT_lights_area.pure";

import { RegisterEXT_lights_area } from "./EXT_lights_area.pure";
RegisterEXT_lights_area();
