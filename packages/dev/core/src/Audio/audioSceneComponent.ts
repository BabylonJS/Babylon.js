/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import audioSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./audioSceneComponent.pure";

import { registerAudioSceneComponent } from "./audioSceneComponent.pure";
registerAudioSceneComponent();
