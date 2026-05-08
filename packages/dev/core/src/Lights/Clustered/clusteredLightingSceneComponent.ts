/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clusteredLightingSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clusteredLightingSceneComponent.pure";

import { RegisterClusteredLightingSceneComponent } from "./clusteredLightingSceneComponent.pure";
RegisterClusteredLightingSceneComponent();
