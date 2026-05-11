/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import defaultRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./defaultRenderingPipeline.pure";

import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";
import { RegisterDefaultRenderingPipeline } from "./defaultRenderingPipeline.pure";
RegisterDefaultRenderingPipeline();
