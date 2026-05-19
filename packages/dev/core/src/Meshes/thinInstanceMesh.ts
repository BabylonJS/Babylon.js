export * from "./thinInstanceMesh.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import thinInstanceMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./thinInstanceMesh.pure";

import { RegisterThinInstanceMesh } from "./thinInstanceMesh.pure";
RegisterThinInstanceMesh();
