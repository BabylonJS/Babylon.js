export * from "./postProcessRenderPipelineManagerSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import postProcessRenderPipelineManagerSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./postProcessRenderPipelineManagerSceneComponent.pure";

import { registerPostProcessRenderPipelineManagerSceneComponent } from "./postProcessRenderPipelineManagerSceneComponent.pure";
registerPostProcessRenderPipelineManagerSceneComponent();
