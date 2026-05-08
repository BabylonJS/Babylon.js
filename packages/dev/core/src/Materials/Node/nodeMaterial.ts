/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import nodeMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nodeMaterial.pure";

import { RegisterNodeMaterial } from "./nodeMaterial.pure";
RegisterNodeMaterial();
