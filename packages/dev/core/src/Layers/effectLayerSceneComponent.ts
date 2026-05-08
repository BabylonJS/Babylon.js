/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import effectLayerSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./effectLayerSceneComponent.pure";

import { registerEffectLayerSceneComponent } from "./effectLayerSceneComponent.pure";
registerEffectLayerSceneComponent();
