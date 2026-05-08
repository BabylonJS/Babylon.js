/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import virtualJoysticksCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./virtualJoysticksCamera.pure";

import { registerVirtualJoysticksCamera } from "./virtualJoysticksCamera.pure";
registerVirtualJoysticksCamera();
