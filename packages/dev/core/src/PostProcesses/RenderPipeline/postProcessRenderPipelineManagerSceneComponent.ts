export * from "./postProcessRenderPipelineManagerSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import postProcessRenderPipelineManagerSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./postProcessRenderPipelineManagerSceneComponent.pure";

import { RegisterPostProcessRenderPipelineManagerSceneComponent } from "./postProcessRenderPipelineManagerSceneComponent.pure";
RegisterPostProcessRenderPipelineManagerSceneComponent();
