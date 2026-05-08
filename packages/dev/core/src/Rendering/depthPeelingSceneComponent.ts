export * from "./depthPeelingSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthPeelingSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthPeelingSceneComponent.pure";

import { RegisterDepthPeelingSceneComponent } from "./depthPeelingSceneComponent.pure";
RegisterDepthPeelingSceneComponent();
