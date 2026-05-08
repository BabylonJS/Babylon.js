/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthPeelingSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthPeelingSceneComponent.pure";

import { registerDepthPeelingSceneComponent } from "./depthPeelingSceneComponent.pure";
registerDepthPeelingSceneComponent();
