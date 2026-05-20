/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ssrRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssrRenderingPipeline.pure";
export * from "./ssrRenderingPipeline.types";

import { RegisterSsrRenderingPipeline } from "./ssrRenderingPipeline.pure";
RegisterSsrRenderingPipeline();
