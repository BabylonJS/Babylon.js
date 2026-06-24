/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./statics.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./statics.pure";

import { RegisterGUIStatics } from "./statics.pure";
RegisterGUIStatics();
