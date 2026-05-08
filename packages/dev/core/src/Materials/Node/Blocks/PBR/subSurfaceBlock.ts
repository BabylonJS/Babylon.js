/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import subSurfaceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subSurfaceBlock.pure";

import { registerSubSurfaceBlock } from "./subSurfaceBlock.pure";
registerSubSurfaceBlock();
