/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryReplaceColorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryReplaceColorBlock.pure";

import { registerGeometryReplaceColorBlock } from "./geometryReplaceColorBlock.pure";
registerGeometryReplaceColorBlock();
