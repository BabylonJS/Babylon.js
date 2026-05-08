/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flyCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flyCamera.pure";

import { registerFlyCamera } from "./flyCamera.pure";
registerFlyCamera();
