export * from "./observable.extensions.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import observable.extensions.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./observable.extensions.pure";

import { RegisterObservableExtensions } from "./observable.extensions.pure";
RegisterObservableExtensions();
