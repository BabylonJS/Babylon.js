/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import virtualJoysticksCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./virtualJoysticksCamera.pure";

import { RegisterVirtualJoysticksCamera } from "./virtualJoysticksCamera.pure";
RegisterVirtualJoysticksCamera();
