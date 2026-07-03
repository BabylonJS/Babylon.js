/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractMesh.pure";

import { RegisterAbstractMesh, AbstractMesh } from "./abstractMesh.pure";
RegisterAbstractMesh();

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffect, _MissingSideEffectProperty } from "../Misc/devTools";

AbstractMesh.prototype.createOrUpdateSubmeshesOctree ??= _MissingSideEffect("AbstractMesh", "createOrUpdateSubmeshesOctree") as any;
AbstractMesh.prototype.getPhysicsImpostor ??= _MissingSideEffect("AbstractMesh", "getPhysicsImpostor") as any;
AbstractMesh.prototype.setPhysicsLinkWith ??= _MissingSideEffect("AbstractMesh", "setPhysicsLinkWith") as any;
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "occlusionRetryCount")) {
    Object.defineProperty(AbstractMesh.prototype, "occlusionRetryCount", _MissingSideEffectProperty("AbstractMesh", "occlusionRetryCount"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "occlusionType")) {
    Object.defineProperty(AbstractMesh.prototype, "occlusionType", _MissingSideEffectProperty("AbstractMesh", "occlusionType"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "occlusionQueryAlgorithmType")) {
    Object.defineProperty(AbstractMesh.prototype, "occlusionQueryAlgorithmType", _MissingSideEffectProperty("AbstractMesh", "occlusionQueryAlgorithmType"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "isOccluded")) {
    Object.defineProperty(AbstractMesh.prototype, "isOccluded", _MissingSideEffectProperty("AbstractMesh", "isOccluded"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "isOcclusionQueryInProgress")) {
    Object.defineProperty(AbstractMesh.prototype, "isOcclusionQueryInProgress", _MissingSideEffectProperty("AbstractMesh", "isOcclusionQueryInProgress"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "forceRenderingWhenOccluded")) {
    Object.defineProperty(AbstractMesh.prototype, "forceRenderingWhenOccluded", _MissingSideEffectProperty("AbstractMesh", "forceRenderingWhenOccluded"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "occlusionForRenderPassId")) {
    Object.defineProperty(AbstractMesh.prototype, "occlusionForRenderPassId", _MissingSideEffectProperty("AbstractMesh", "occlusionForRenderPassId"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "decalMap")) {
    Object.defineProperty(AbstractMesh.prototype, "decalMap", _MissingSideEffectProperty("AbstractMesh", "decalMap"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "instancedBuffers")) {
    Object.defineProperty(AbstractMesh.prototype, "instancedBuffers", _MissingSideEffectProperty("AbstractMesh", "instancedBuffers"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "physicsImpostor")) {
    Object.defineProperty(AbstractMesh.prototype, "physicsImpostor", _MissingSideEffectProperty("AbstractMesh", "physicsImpostor"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "showBoundingBox")) {
    Object.defineProperty(AbstractMesh.prototype, "showBoundingBox", _MissingSideEffectProperty("AbstractMesh", "showBoundingBox"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "edgesRenderer")) {
    Object.defineProperty(AbstractMesh.prototype, "edgesRenderer", _MissingSideEffectProperty("AbstractMesh", "edgesRenderer"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "renderOutline")) {
    Object.defineProperty(AbstractMesh.prototype, "renderOutline", _MissingSideEffectProperty("AbstractMesh", "renderOutline"));
}
if (!Object.getOwnPropertyDescriptor(AbstractMesh.prototype, "renderOverlay")) {
    Object.defineProperty(AbstractMesh.prototype, "renderOverlay", _MissingSideEffectProperty("AbstractMesh", "renderOverlay"));
}
// #endregion GENERATED_SIDE_EFFECT_STUBS
