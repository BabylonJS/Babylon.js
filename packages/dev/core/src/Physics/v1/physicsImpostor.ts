/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import physicsImpostor.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./physicsImpostor.pure";

import { RegisterPhysicsImpostor } from "./physicsImpostor.pure";
RegisterPhysicsImpostor();
