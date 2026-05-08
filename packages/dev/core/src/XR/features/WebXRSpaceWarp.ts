/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRSpaceWarp.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRSpaceWarp.pure";

import { registerWebXRSpaceWarp } from "./WebXRSpaceWarp.pure";
registerWebXRSpaceWarp();
