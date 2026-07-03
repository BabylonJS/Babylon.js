/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import transformNode.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./transformNode.pure";
export * from "./transformNode.types";

import { RegisterTransformNode, TransformNode } from "./transformNode.pure";
RegisterTransformNode();

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffect, _MissingSideEffectProperty } from "../Misc/devTools";

TransformNode.prototype.getPhysicsBody ??= _MissingSideEffect("TransformNode", "getPhysicsBody") as any;
TransformNode.prototype.applyImpulse ??= _MissingSideEffect("TransformNode", "applyImpulse") as any;
TransformNode.prototype.applyAngularImpulse ??= _MissingSideEffect("TransformNode", "applyAngularImpulse") as any;
TransformNode.prototype.applyTorque ??= _MissingSideEffect("TransformNode", "applyTorque") as any;
if (!Object.getOwnPropertyDescriptor(TransformNode.prototype, "physicsBody")) {
    Object.defineProperty(TransformNode.prototype, "physicsBody", _MissingSideEffectProperty("TransformNode", "physicsBody"));
}
// #endregion GENERATED_SIDE_EFFECT_STUBS
