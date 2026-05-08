export * from "./particleSystemComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleSystemComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleSystemComponent.pure";

import { RegisterParticleSystemComponent } from "./particleSystemComponent.pure";
RegisterParticleSystemComponent();
