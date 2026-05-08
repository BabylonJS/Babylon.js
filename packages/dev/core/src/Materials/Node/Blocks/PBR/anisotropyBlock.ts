/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anisotropyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anisotropyBlock.pure";

import { registerAnisotropyBlock } from "./anisotropyBlock.pure";
registerAnisotropyBlock();
