/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import planeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./planeBlock.pure";

import { registerPlaneBlock } from "./planeBlock.pure";
registerPlaneBlock();
