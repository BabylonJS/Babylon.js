/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRLayers.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRLayers.pure";

import { RegisterWebXRLayers } from "./WebXRLayers.pure";
RegisterWebXRLayers();
