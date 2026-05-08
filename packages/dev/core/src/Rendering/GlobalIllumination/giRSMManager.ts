/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import giRSMManager.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./giRSMManager.pure";

import { registerGiRSMManager } from "./giRSMManager.pure";
registerGiRSMManager();
