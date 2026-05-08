/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boxShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boxShapeBlock.pure";

import { RegisterBoxShapeBlock } from "./boxShapeBlock.pure";
RegisterBoxShapeBlock();
