/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import createParticleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./createParticleBlock.pure";

import { registerCreateParticleBlock } from "./createParticleBlock.pure";
registerCreateParticleBlock();
