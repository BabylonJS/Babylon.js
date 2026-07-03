/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import standardMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./standardMaterial.pure";

import { RegisterStandardMaterial, StandardMaterial } from "./standardMaterial.pure";
RegisterStandardMaterial();

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffectProperty } from "../Misc/devTools";

if (!Object.getOwnPropertyDescriptor(StandardMaterial.prototype, "decalMap")) {
    Object.defineProperty(StandardMaterial.prototype, "decalMap", _MissingSideEffectProperty("StandardMaterial", "decalMap"));
}
// #endregion GENERATED_SIDE_EFFECT_STUBS
