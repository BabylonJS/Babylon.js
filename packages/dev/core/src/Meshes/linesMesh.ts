/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import linesMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./linesMesh.pure";

import { RegisterLinesMesh, InstancedLinesMesh, LinesMesh } from "./linesMesh.pure";
RegisterLinesMesh();

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffect } from "../Misc/devTools";

LinesMesh.prototype.enableEdgesRendering ??= _MissingSideEffect("LinesMesh", "enableEdgesRendering") as any;
InstancedLinesMesh.prototype.enableEdgesRendering ??= _MissingSideEffect("InstancedLinesMesh", "enableEdgesRendering") as any;
// #endregion GENERATED_SIDE_EFFECT_STUBS
