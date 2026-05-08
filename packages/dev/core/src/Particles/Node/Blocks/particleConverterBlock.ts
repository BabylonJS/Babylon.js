/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleConverterBlock.pure";

import { registerParticleConverterBlock } from "./particleConverterBlock.pure";
registerParticleConverterBlock();
