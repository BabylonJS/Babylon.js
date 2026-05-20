/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphPostProcess.pure";

import { RegisterAnaglyphPostProcess } from "./anaglyphPostProcess.pure";
RegisterAnaglyphPostProcess();
