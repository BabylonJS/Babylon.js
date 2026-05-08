/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRFeaturePointSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRFeaturePointSystem.pure";

import { RegisterWebXRFeaturePointSystem } from "./WebXRFeaturePointSystem.pure";
RegisterWebXRFeaturePointSystem();
