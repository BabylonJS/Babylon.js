/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./virtualKeyboard.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./virtualKeyboard.pure";

import { RegisterVirtualKeyboard } from "./virtualKeyboard.pure";
RegisterVirtualKeyboard();
