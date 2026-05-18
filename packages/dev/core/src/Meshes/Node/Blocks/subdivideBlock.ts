/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import subdivideBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subdivideBlock.pure";

import { RegisterSubdivideBlock } from "./subdivideBlock.pure";
RegisterSubdivideBlock();
