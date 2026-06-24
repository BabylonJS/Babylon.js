/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_node_visibility.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_node_visibility.types";
export * from "./KHR_node_visibility.pure";

import { RegisterKHR_node_visibility } from "./KHR_node_visibility.pure";
RegisterKHR_node_visibility();
