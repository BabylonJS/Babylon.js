/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import rotationXBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotationXBlock.pure";

import { registerRotationXBlock } from "./rotationXBlock.pure";
registerRotationXBlock();
