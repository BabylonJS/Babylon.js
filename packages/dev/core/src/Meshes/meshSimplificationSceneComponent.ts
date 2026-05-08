export * from "./meshSimplificationSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import meshSimplificationSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshSimplificationSceneComponent.pure";

import { RegisterMeshSimplificationSceneComponent } from "./meshSimplificationSceneComponent.pure";
RegisterMeshSimplificationSceneComponent();
