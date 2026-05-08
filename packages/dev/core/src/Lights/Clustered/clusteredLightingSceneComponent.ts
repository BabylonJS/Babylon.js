/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clusteredLightingSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clusteredLightingSceneComponent.pure";

import { registerClusteredLightingSceneComponent } from "./clusteredLightingSceneComponent.pure";
registerClusteredLightingSceneComponent();
