/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boxShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boxShapeBlock.pure";

import { registerBoxShapeBlock } from "./boxShapeBlock.pure";
registerBoxShapeBlock();
