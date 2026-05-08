/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.loadFile.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.loadFile.pure";

import { registerAbstractEngineLoadFile } from "./abstractEngine.loadFile.pure";
registerAbstractEngineLoadFile();
