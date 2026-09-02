/**
 * Re-exports the pure implementation and applies runtime side effects.
 * Import WebXRTrackedSources.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRTrackedSources.pure";

import { RegisterWebXRTrackedSources } from "./WebXRTrackedSources.pure";
RegisterWebXRTrackedSources();
