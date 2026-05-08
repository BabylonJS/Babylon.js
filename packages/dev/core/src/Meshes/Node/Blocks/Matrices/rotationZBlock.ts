/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import rotationZBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotationZBlock.pure";

import { RegisterRotationZBlock } from "./rotationZBlock.pure";
RegisterRotationZBlock();
