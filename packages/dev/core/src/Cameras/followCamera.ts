/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import followCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./followCamera.pure";

import { RegisterFollowCamera } from "./followCamera.pure";
RegisterFollowCamera();
