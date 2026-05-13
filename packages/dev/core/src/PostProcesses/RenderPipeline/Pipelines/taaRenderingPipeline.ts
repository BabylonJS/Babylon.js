/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import taaRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./taaRenderingPipeline.pure";
export * from "./taaRenderingPipeline.types";

import { RegisterTaaRenderingPipeline } from "./taaRenderingPipeline.pure";
RegisterTaaRenderingPipeline();
