/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cleanGeometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cleanGeometryBlock.pure";

import { RegisterCleanGeometryBlock } from "./cleanGeometryBlock.pure";
RegisterCleanGeometryBlock();
