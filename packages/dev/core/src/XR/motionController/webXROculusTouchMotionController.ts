/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXROculusTouchMotionController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXROculusTouchMotionController.pure";

import { RegisterWebXROculusTouchMotionController } from "./webXROculusTouchMotionController.pure";
RegisterWebXROculusTouchMotionController();
