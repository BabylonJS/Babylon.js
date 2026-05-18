/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleMathBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleMathBlock.pure";

import { RegisterParticleMathBlock } from "./particleMathBlock.pure";
RegisterParticleMathBlock();
