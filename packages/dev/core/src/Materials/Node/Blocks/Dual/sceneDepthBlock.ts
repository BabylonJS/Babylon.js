/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sceneDepthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sceneDepthBlock.pure";

import { RegisterSceneDepthBlock } from "./sceneDepthBlock.pure";
RegisterSceneDepthBlock();
