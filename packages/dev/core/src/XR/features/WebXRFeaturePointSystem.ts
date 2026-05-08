/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRFeaturePointSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRFeaturePointSystem.pure";

import { registerWebXRFeaturePointSystem } from "./WebXRFeaturePointSystem.pure";
registerWebXRFeaturePointSystem();
