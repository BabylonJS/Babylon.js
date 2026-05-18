/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import imageProcessingConfiguration.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./imageProcessingConfiguration.pure";
export * from "./imageProcessingConfiguration.types";

import { RegisterImageProcessingConfiguration } from "./imageProcessingConfiguration.pure";
RegisterImageProcessingConfiguration();

import "./colorCurves";
