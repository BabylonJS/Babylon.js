/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import collisionCoordinator.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./collisionCoordinator.pure";

import { RegisterCollisionCoordinator } from "./collisionCoordinator.pure";
RegisterCollisionCoordinator();
