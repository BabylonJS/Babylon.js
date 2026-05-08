/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXRHTCViveMotionController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXRHTCViveMotionController.pure";

import { RegisterWebXRHTCViveMotionController } from "./webXRHTCViveMotionController.pure";
RegisterWebXRHTCViveMotionController();
