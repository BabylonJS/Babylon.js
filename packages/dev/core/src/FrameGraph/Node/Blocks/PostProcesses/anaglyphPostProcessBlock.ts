/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphPostProcessBlock.pure";

import { registerAnaglyphPostProcessBlock } from "./anaglyphPostProcessBlock.pure";
registerAnaglyphPostProcessBlock();
