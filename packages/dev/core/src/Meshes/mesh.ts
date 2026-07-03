/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mesh.pure";

import { RegisterMesh, Mesh } from "./mesh.pure";
RegisterMesh();

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffect, _MissingSideEffectProperty } from "../Misc/devTools";

Mesh.prototype.registerInstancedBuffer ??= _MissingSideEffect("Mesh", "registerInstancedBuffer") as any;
Mesh.prototype.simplify ??= _MissingSideEffect("Mesh", "simplify") as any;
Mesh.prototype.thinInstanceAdd ??= _MissingSideEffect("Mesh", "thinInstanceAdd") as any;
Mesh.prototype.thinInstanceAddSelf ??= _MissingSideEffect("Mesh", "thinInstanceAddSelf") as any;
Mesh.prototype.thinInstanceRegisterAttribute ??= _MissingSideEffect("Mesh", "thinInstanceRegisterAttribute") as any;
Mesh.prototype.thinInstanceSetMatrixAt ??= _MissingSideEffect("Mesh", "thinInstanceSetMatrixAt") as any;
Mesh.prototype.thinInstanceSetAttributeAt ??= _MissingSideEffect("Mesh", "thinInstanceSetAttributeAt") as any;
Mesh.prototype.thinInstanceSetBuffer ??= _MissingSideEffect("Mesh", "thinInstanceSetBuffer") as any;
Mesh.prototype.thinInstanceGetWorldMatrices ??= _MissingSideEffect("Mesh", "thinInstanceGetWorldMatrices") as any;
Mesh.prototype.thinInstanceBufferUpdated ??= _MissingSideEffect("Mesh", "thinInstanceBufferUpdated") as any;
Mesh.prototype.thinInstancePartialBufferUpdate ??= _MissingSideEffect("Mesh", "thinInstancePartialBufferUpdate") as any;
Mesh.prototype.thinInstanceRefreshBoundingInfo ??= _MissingSideEffect("Mesh", "thinInstanceRefreshBoundingInfo") as any;
Mesh.prototype.getEmittedParticleSystems ??= _MissingSideEffect("Mesh", "getEmittedParticleSystems") as any;
Mesh.prototype.getHierarchyEmittedParticleSystems ??= _MissingSideEffect("Mesh", "getHierarchyEmittedParticleSystems") as any;
if (!Object.getOwnPropertyDescriptor(Mesh.prototype, "edgesShareWithInstances")) {
    Object.defineProperty(Mesh.prototype, "edgesShareWithInstances", _MissingSideEffectProperty("Mesh", "edgesShareWithInstances"));
}
if (!Object.getOwnPropertyDescriptor(Mesh.prototype, "thinInstanceEnablePicking")) {
    Object.defineProperty(Mesh.prototype, "thinInstanceEnablePicking", _MissingSideEffectProperty("Mesh", "thinInstanceEnablePicking"));
}
if (!Object.getOwnPropertyDescriptor(Mesh.prototype, "thinInstanceAllowAutomaticStaticBufferRecreation")) {
    Object.defineProperty(
        Mesh.prototype,
        "thinInstanceAllowAutomaticStaticBufferRecreation",
        _MissingSideEffectProperty("Mesh", "thinInstanceAllowAutomaticStaticBufferRecreation")
    );
}
if (!Object.getOwnPropertyDescriptor(Mesh.prototype, "thinInstanceCount")) {
    Object.defineProperty(Mesh.prototype, "thinInstanceCount", _MissingSideEffectProperty("Mesh", "thinInstanceCount"));
}
// #endregion GENERATED_SIDE_EFFECT_STUBS
