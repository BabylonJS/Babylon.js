export * from "./instancedMesh.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instancedMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instancedMesh.pure";

import { RegisterInstancedMesh } from "./instancedMesh.pure";
RegisterInstancedMesh();
