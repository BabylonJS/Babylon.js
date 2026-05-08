/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shadowGeneratorSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shadowGeneratorSceneComponent.pure";

import { RegisterShadowGeneratorSceneComponent } from "./shadowGeneratorSceneComponent.pure";
RegisterShadowGeneratorSceneComponent();
