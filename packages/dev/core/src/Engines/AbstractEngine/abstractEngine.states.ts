export * from "./abstractEngine.states.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.states.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.states.pure";

import { registerAbstractEngineStates } from "./abstractEngine.states.pure";
registerAbstractEngineStates();
