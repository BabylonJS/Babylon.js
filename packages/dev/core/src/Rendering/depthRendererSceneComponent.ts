export * from "./depthRendererSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthRendererSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthRendererSceneComponent.pure";

import { RegisterDepthRendererSceneComponent } from "./depthRendererSceneComponent.pure";
RegisterDepthRendererSceneComponent();
