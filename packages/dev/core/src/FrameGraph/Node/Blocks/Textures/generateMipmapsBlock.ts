/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import generateMipmapsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./generateMipmapsBlock.pure";

import { registerGenerateMipmapsBlock } from "./generateMipmapsBlock.pure";
registerGenerateMipmapsBlock();
