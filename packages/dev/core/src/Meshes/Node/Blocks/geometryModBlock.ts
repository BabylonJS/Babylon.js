/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryModBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryModBlock.pure";

import { registerGeometryModBlock } from "./geometryModBlock.pure";
registerGeometryModBlock();
