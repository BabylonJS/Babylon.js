/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectionProbe.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionProbe.pure";
export * from "./reflectionProbe.types";

import { RegisterReflectionProbe } from "./reflectionProbe.pure";
RegisterReflectionProbe();
