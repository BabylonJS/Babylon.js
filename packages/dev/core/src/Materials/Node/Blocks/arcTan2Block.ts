/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import arcTan2Block.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./arcTan2Block.pure";

import { RegisterArcTan2Block } from "./arcTan2Block.pure";
RegisterArcTan2Block();
