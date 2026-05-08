/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ssrRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssrRenderingPipeline.pure";

import { registerSsrRenderingPipeline } from "./ssrRenderingPipeline.pure";
registerSsrRenderingPipeline();
