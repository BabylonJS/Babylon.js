/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import greasedLinePluginMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./greasedLinePluginMaterial.pure";

import { registerGreasedLinePluginMaterial } from "./greasedLinePluginMaterial.pure";
registerGreasedLinePluginMaterial();
