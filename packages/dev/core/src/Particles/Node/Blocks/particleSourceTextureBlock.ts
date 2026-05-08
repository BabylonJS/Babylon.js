/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleSourceTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleSourceTextureBlock.pure";

import { registerParticleSourceTextureBlock } from "./particleSourceTextureBlock.pure";
registerParticleSourceTextureBlock();
