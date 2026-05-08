/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import dumpTools.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./dumpTools.pure";

import { registerDumpTools } from "./dumpTools.pure";
registerDumpTools();
