/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRNearInteraction.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRNearInteraction.pure";
export * from "./WebXRNearInteraction.types";

import { RegisterWebXRNearInteraction } from "./WebXRNearInteraction.pure";
RegisterWebXRNearInteraction();
