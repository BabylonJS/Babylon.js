/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryRotate2dBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryRotate2dBlock.pure";

import { registerGeometryRotate2dBlock } from "./geometryRotate2dBlock.pure";
registerGeometryRotate2dBlock();
