/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleTeleportOutBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTeleportOutBlock.pure";

import { registerParticleTeleportOutBlock } from "./particleTeleportOutBlock.pure";
registerParticleTeleportOutBlock();
