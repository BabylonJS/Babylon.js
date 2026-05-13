/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import defaultRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./defaultRenderingPipeline.pure";
export * from "./defaultRenderingPipeline.types";

import { RegisterDefaultRenderingPipeline } from "./defaultRenderingPipeline.pure";
RegisterDefaultRenderingPipeline();
