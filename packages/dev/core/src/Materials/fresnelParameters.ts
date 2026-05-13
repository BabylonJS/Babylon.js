/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fresnelParameters.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fresnelParameters.pure";
export * from "./fresnelParameters.types";

import { RegisterFresnelParameters } from "./fresnelParameters.pure";
RegisterFresnelParameters();
