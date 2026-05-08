/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateSpriteCellIndexBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateSpriteCellIndexBlock.pure";

import { registerUpdateSpriteCellIndexBlock } from "./updateSpriteCellIndexBlock.pure";
registerUpdateSpriteCellIndexBlock();
