/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRHitTest.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRHitTest.pure";

import { registerWebXRHitTest } from "./WebXRHitTest.pure";
registerWebXRHitTest();
