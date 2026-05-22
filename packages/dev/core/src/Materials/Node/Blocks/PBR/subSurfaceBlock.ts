/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import subSurfaceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subSurfaceBlock.pure";

import { RegisterSubSurfaceBlock } from "./subSurfaceBlock.pure";
RegisterSubSurfaceBlock();
