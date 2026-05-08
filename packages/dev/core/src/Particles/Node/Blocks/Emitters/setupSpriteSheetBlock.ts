/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setupSpriteSheetBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setupSpriteSheetBlock.pure";

import { RegisterSetupSpriteSheetBlock } from "./setupSpriteSheetBlock.pure";
RegisterSetupSpriteSheetBlock();
