/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./focusableButton.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./focusableButton.pure";

import { RegisterFocusableButton } from "./focusableButton.pure";
RegisterFocusableButton();
