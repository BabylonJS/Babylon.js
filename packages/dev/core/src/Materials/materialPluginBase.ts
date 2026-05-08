/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import materialPluginBase.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./materialPluginBase.pure";

import { registerMaterialPluginBase } from "./materialPluginBase.pure";
registerMaterialPluginBase();
