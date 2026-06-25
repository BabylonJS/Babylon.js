/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./multiLine.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./multiLine.pure";

import { RegisterMultiLine } from "./multiLine.pure";
RegisterMultiLine();
