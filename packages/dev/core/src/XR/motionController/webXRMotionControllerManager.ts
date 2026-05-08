/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXRMotionControllerManager.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXRMotionControllerManager.pure";

import { registerWebXRMotionControllerManager } from "./webXRMotionControllerManager.pure";
registerWebXRMotionControllerManager();
