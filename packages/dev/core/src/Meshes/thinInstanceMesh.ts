/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import thinInstanceMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./thinInstanceMesh.pure";

import { registerThinInstanceMesh } from "./thinInstanceMesh.pure";
registerThinInstanceMesh();
