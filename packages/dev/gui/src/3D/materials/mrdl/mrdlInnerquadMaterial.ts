/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./mrdlInnerquadMaterial.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./mrdlInnerquadMaterial.pure";

import "./shaders/mrdlInnerquad.fragment";
import "./shaders/mrdlInnerquad.vertex";

import { RegisterMRDLInnerquadMaterial } from "./mrdlInnerquadMaterial.pure";
RegisterMRDLInnerquadMaterial();
