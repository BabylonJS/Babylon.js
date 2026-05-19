/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import translationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./translationBlock.pure";

import { RegisterTranslationBlock } from "./translationBlock.pure";
RegisterTranslationBlock();
