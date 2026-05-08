/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import imageProcessingConfiguration.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./imageProcessingConfiguration.pure";

import { RegisterImageProcessingConfiguration } from "./imageProcessingConfiguration.pure";
RegisterImageProcessingConfiguration();
