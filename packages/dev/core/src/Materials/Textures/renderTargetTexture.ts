export * from "./renderTargetTexture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import renderTargetTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./renderTargetTexture.pure";

import { RegisterRenderTargetTexture, RenderTargetTexture } from "./renderTargetTexture.pure";
RegisterRenderTargetTexture();

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffectProperty } from "../../Misc/devTools";

if (!Object.getOwnPropertyDescriptor(RenderTargetTexture.prototype, "noPrePassRenderer")) {
    Object.defineProperty(RenderTargetTexture.prototype, "noPrePassRenderer", _MissingSideEffectProperty("RenderTargetTexture", "noPrePassRenderer"));
}
// #endregion GENERATED_SIDE_EFFECT_STUBS
