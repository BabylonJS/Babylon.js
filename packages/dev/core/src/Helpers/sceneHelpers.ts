export * from "./sceneHelpers.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sceneHelpers.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sceneHelpers.pure";

import { registerSceneHelpers } from "./sceneHelpers.pure";
registerSceneHelpers();
