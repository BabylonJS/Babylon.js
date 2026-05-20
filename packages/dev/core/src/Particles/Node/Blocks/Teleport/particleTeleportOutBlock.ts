/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleTeleportOutBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTeleportOutBlock.pure";

import { RegisterParticleTeleportOutBlock } from "./particleTeleportOutBlock.pure";
RegisterParticleTeleportOutBlock();
