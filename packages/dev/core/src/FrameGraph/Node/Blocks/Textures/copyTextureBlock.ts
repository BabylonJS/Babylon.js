/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import copyTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./copyTextureBlock.pure";

import { registerCopyTextureBlock } from "./copyTextureBlock.pure";
registerCopyTextureBlock();
