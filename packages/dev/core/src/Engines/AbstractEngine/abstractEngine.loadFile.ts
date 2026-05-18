export * from "./abstractEngine.loadFile.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.loadFile.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.loadFile.pure";

import { RegisterAbstractEngineLoadFile } from "./abstractEngine.loadFile.pure";
RegisterAbstractEngineLoadFile();
