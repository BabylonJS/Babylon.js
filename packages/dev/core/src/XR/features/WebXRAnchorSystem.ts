/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRAnchorSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRAnchorSystem.pure";

import { registerWebXRAnchorSystem } from "./WebXRAnchorSystem.pure";
registerWebXRAnchorSystem();
