/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import trigonometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./trigonometryBlock.pure";

import { registerTrigonometryBlock } from "./trigonometryBlock.pure";
registerTrigonometryBlock();
