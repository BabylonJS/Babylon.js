/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import meshDebugPluginMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshDebugPluginMaterial.pure";

import { registerMeshDebugPluginMaterial } from "./meshDebugPluginMaterial.pure";
registerMeshDebugPluginMaterial();
