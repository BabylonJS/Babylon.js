/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryModBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryModBlock.pure";

import { RegisterGeometryModBlock } from "./geometryModBlock.pure";
RegisterGeometryModBlock();
