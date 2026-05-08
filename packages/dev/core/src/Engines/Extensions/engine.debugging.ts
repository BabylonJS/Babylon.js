export * from "./engine.debugging.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.debugging.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.debugging.pure";

import { RegisterEngineDebugging } from "./engine.debugging.pure";
RegisterEngineDebugging();
