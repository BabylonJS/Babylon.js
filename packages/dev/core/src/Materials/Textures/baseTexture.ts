export * from "./baseTexture.pure";

import "../../Misc/fileTools";

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffect, _MissingSideEffectProperty } from "../../Misc/devTools";
import { BaseTexture } from "./baseTexture.pure";

BaseTexture.prototype.forceSphericalPolynomialsRecompute ??= _MissingSideEffect("BaseTexture", "forceSphericalPolynomialsRecompute") as any;
if (!Object.getOwnPropertyDescriptor(BaseTexture.prototype, "sphericalPolynomial")) {
    Object.defineProperty(BaseTexture.prototype, "sphericalPolynomial", _MissingSideEffectProperty("BaseTexture", "sphericalPolynomial"));
}
// #endregion GENERATED_SIDE_EFFECT_STUBS
