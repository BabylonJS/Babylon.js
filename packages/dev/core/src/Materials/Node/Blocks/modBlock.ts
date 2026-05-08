/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import modBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./modBlock.pure";

import { registerModBlock } from "./modBlock.pure";
registerModBlock();
