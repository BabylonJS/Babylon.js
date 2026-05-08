/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleSystemComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleSystemComponent.pure";

import { registerParticleSystemComponent } from "./particleSystemComponent.pure";
registerParticleSystemComponent();
