/** Pure barrel — re-exports only side-effect-free modules */
/* eslint-disable @typescript-eslint/no-restricted-imports */
export { PhysicsEngine as PhysicsEngineV2 } from "./physicsEngine";
export * from "./physicsBody";
export * from "./physicsShape";
export * from "./physicsConstraint";
export * from "./physicsMaterial";
export * from "./physicsAggregate";
export * from "./ragdoll";
export * from "./IPhysicsEnginePlugin";
export * from "./characterController";
export * from "./Plugins/pure";
export * from "./physicsEngineComponent.pure";
