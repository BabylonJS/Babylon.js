/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import iblShadowsPluginMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./iblShadowsPluginMaterial.pure";

import { RegisterIblShadowsPluginMaterial } from "./iblShadowsPluginMaterial.pure";
RegisterIblShadowsPluginMaterial();
