/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ribbonBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ribbonBuilder.pure";

import { registerRibbonBuilder } from "./ribbonBuilder.pure";
registerRibbonBuilder();
