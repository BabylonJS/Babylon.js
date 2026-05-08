/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import displayPassPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./displayPassPostProcess.pure";

import { registerDisplayPassPostProcess } from "./displayPassPostProcess.pure";
registerDisplayPassPostProcess();
