export * from "./engine.query.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.query.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.query.pure";

import { RegisterEnginesExtensionsEngineQuery } from "./engine.query.pure";
RegisterEnginesExtensionsEngineQuery();
