/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pointListBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pointListBlock.pure";

import { RegisterPointListBlock } from "./pointListBlock.pure";
RegisterPointListBlock();
