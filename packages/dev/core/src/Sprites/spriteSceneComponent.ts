export * from "./spriteSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import spriteSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./spriteSceneComponent.pure";

import { RegisterSpriteSceneComponent } from "./spriteSceneComponent.pure";
RegisterSpriteSceneComponent();
