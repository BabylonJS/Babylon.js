/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./inputTextArea.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./inputTextArea.pure";

import { RegisterInputTextArea } from "./inputTextArea.pure";
RegisterInputTextArea();
