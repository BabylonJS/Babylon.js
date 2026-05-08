/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXRMicrosoftMixedRealityController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXRMicrosoftMixedRealityController.pure";

import { registerWebXRMicrosoftMixedRealityController } from "./webXRMicrosoftMixedRealityController.pure";
registerWebXRMicrosoftMixedRealityController();
