/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphGamepadCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphGamepadCamera.pure";

import { registerAnaglyphGamepadCamera } from "./anaglyphGamepadCamera.pure";
registerAnaglyphGamepadCamera();
