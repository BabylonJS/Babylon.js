export * from "./audioSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import audioSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./audioSceneComponent.pure";

import { Sound } from "./sound.pure";
import { RegisterAudioSceneComponent } from "./audioSceneComponent.pure";
RegisterAudioSceneComponent(Sound);
