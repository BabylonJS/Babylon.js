/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import spriteSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./spriteSceneComponent.pure";

import { registerSpriteSceneComponent } from "./spriteSceneComponent.pure";
registerSpriteSceneComponent();
