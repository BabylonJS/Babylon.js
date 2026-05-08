export * from "./observable.extensions.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import observable.extensions.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./observable.extensions.pure";

import { registerObservableExtensions } from "./observable.extensions.pure";
registerObservableExtensions();
