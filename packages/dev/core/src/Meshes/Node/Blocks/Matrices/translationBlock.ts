/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import translationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./translationBlock.pure";

import { registerTranslationBlock } from "./translationBlock.pure";
registerTranslationBlock();
