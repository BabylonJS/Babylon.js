/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRHitTest.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRHitTest.pure";

import { RegisterWebXRHitTest } from "./WebXRHitTest.pure";
RegisterWebXRHitTest();
