/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import currentScreenBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./currentScreenBlock.pure";

import { registerCurrentScreenBlock } from "./currentScreenBlock.pure";
registerCurrentScreenBlock();
