export * from "./abstractEngine.query.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.query.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.query.pure";

import { RegisterAbstractEngineQuery } from "./abstractEngine.query.pure";
RegisterAbstractEngineQuery();
