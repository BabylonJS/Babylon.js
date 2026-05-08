/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleNumberMathBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleNumberMathBlock.pure";

import { registerParticleNumberMathBlock } from "./particleNumberMathBlock.pure";
registerParticleNumberMathBlock();
