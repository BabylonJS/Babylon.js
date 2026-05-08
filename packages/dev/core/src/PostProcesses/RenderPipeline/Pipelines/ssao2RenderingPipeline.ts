/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ssao2RenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssao2RenderingPipeline.pure";

import { registerSsao2RenderingPipeline } from "./ssao2RenderingPipeline.pure";
registerSsao2RenderingPipeline();
