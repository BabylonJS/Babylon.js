/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_node_selectability.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_node_selectability.types";
export * from "./KHR_node_selectability.pure";

import { RegisterKHR_node_selectability } from "./KHR_node_selectability.pure";
RegisterKHR_node_selectability();
