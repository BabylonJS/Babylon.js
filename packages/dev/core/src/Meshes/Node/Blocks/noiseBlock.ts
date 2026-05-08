/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import noiseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./noiseBlock.pure";

import { RegisterNoiseBlock } from "./noiseBlock.pure";
RegisterNoiseBlock();
