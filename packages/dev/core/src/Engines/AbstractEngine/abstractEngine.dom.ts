export * from "./abstractEngine.dom.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.dom.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.dom.pure";

import { RegisterAbstractEngineDom } from "./abstractEngine.dom.pure";
RegisterAbstractEngineDom();
