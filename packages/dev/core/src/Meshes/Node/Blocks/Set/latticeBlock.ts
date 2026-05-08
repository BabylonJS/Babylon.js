/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import latticeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./latticeBlock.pure";

import { RegisterLatticeBlock } from "./latticeBlock.pure";
RegisterLatticeBlock();
