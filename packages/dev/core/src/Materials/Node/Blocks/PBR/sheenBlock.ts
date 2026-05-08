/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sheenBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sheenBlock.pure";

import { registerSheenBlock } from "./sheenBlock.pure";
registerSheenBlock();
