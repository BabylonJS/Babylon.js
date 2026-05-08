/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphGamepadCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphGamepadCamera.pure";

import { RegisterAnaglyphGamepadCamera } from "./anaglyphGamepadCamera.pure";
RegisterAnaglyphGamepadCamera();
