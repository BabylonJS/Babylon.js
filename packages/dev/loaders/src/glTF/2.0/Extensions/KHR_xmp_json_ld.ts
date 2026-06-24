/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_xmp_json_ld.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_xmp_json_ld.types";
export * from "./KHR_xmp_json_ld.pure";

import { RegisterKHR_xmp_json_ld } from "./KHR_xmp_json_ld.pure";
RegisterKHR_xmp_json_ld();
