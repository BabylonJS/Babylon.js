/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import meshBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshBlock.pure";

import { registerMeshBlock } from "./meshBlock.pure";
registerMeshBlock();
