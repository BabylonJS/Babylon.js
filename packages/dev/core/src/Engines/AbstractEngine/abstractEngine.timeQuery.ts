export * from "./abstractEngine.timeQuery.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.timeQuery.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.timeQuery.pure";

import { RegisterAbstractEngineTimeQuery } from "./abstractEngine.timeQuery.pure";
RegisterAbstractEngineTimeQuery();
