/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.query.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.query.pure";

import { registerEnginesExtensionsEngineQuery } from "./engine.query.pure";
registerEnginesExtensionsEngineQuery();
