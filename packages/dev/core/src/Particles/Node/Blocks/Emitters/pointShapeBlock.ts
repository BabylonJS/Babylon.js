/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pointShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pointShapeBlock.pure";

import { RegisterPointShapeBlock } from "./pointShapeBlock.pure";
RegisterPointShapeBlock();
