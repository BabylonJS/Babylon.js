/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_node_hoverability.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_node_hoverability.types";
export * from "./KHR_node_hoverability.pure";

import { RegisterKHR_node_hoverability } from "./KHR_node_hoverability.pure";
RegisterKHR_node_hoverability();
