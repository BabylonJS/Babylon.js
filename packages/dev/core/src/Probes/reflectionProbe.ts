/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectionProbe.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionProbe.pure";

import { registerReflectionProbe } from "./reflectionProbe.pure";
registerReflectionProbe();
