export * from "./prePassRendererSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import prePassRendererSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./prePassRendererSceneComponent.pure";

import { RegisterPrePassRendererSceneComponent } from "./prePassRendererSceneComponent.pure";
RegisterPrePassRendererSceneComponent();
