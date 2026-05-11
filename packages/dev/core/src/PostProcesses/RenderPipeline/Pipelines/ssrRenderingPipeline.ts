/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ssrRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssrRenderingPipeline.pure";

import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";
import { RegisterSsrRenderingPipeline } from "./ssrRenderingPipeline.pure";
RegisterSsrRenderingPipeline();
