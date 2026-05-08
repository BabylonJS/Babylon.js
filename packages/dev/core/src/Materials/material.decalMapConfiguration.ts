/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import material.decalMapConfiguration.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./material.decalMapConfiguration.pure";

import { RegisterMaterialDecalMapConfiguration } from "./material.decalMapConfiguration.pure";
RegisterMaterialDecalMapConfiguration();
