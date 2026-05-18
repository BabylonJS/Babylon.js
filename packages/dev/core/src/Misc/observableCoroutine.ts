export * from "./observableCoroutine.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import observableCoroutine.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./observableCoroutine.pure";

import { RegisterObservableCoroutine } from "./observableCoroutine.pure";
RegisterObservableCoroutine();
