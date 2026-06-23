/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import standardRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./standardRenderingPipeline.pure";
export * from "./standardRenderingPipeline.types";

import "../../../Shaders/standard.fragment";

import { RegisterStandardRenderingPipeline } from "./standardRenderingPipeline.pure";
RegisterStandardRenderingPipeline();
