/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleTeleportInBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTeleportInBlock.pure";

import { RegisterParticleTeleportInBlock } from "./particleTeleportInBlock.pure";
RegisterParticleTeleportInBlock();
