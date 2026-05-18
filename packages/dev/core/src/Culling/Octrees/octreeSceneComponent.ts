export * from "./octreeSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import octreeSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./octreeSceneComponent.pure";

import { RegisterOctreeSceneComponent } from "./octreeSceneComponent.pure";
RegisterOctreeSceneComponent();
