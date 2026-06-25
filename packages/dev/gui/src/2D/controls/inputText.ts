/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./inputText.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./inputText.pure";

import { RegisterInputText } from "./inputText.pure";
RegisterInputText();
