/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mesh.pure";

import { registerMesh } from "./mesh.pure";
registerMesh();
