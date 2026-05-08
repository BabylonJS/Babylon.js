/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import octreeSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./octreeSceneComponent.pure";

import { registerOctreeSceneComponent } from "./octreeSceneComponent.pure";
registerOctreeSceneComponent();
