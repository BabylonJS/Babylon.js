/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import debugLayer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./debugLayer.pure";

import { registerDebugLayer } from "./debugLayer.pure";
registerDebugLayer();
