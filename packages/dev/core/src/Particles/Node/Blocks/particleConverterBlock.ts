/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleConverterBlock.pure";

import { RegisterParticleConverterBlock } from "./particleConverterBlock.pure";
RegisterParticleConverterBlock();
