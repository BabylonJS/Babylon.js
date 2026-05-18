/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import groundMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./groundMesh.pure";

import { RegisterGroundMesh } from "./groundMesh.pure";
RegisterGroundMesh();
