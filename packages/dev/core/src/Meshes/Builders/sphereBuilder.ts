/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sphereBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sphereBuilder.pure";

import { RegisterSphereBuilder } from "./sphereBuilder.pure";
RegisterSphereBuilder();
