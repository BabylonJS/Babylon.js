/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import rotationXBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotationXBlock.pure";

import { RegisterRotationXBlock } from "./rotationXBlock.pure";
RegisterRotationXBlock();
