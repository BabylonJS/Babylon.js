/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import basicSpriteUpdateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./basicSpriteUpdateBlock.pure";

import { RegisterBasicSpriteUpdateBlock } from "./basicSpriteUpdateBlock.pure";
RegisterBasicSpriteUpdateBlock();
