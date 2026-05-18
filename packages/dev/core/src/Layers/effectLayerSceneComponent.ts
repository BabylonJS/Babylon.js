/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import effectLayerSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./effectLayerSceneComponent.pure";

import { EffectLayer } from "./effectLayer";
import { RegisterEffectLayerSceneComponent } from "./effectLayerSceneComponent.pure";
RegisterEffectLayerSceneComponent(EffectLayer);
