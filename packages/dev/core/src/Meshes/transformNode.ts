/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import transformNode.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./transformNode.pure";
export * from "./transformNode.types";

import { RegisterTransformNode } from "./transformNode.pure";
RegisterTransformNode();
