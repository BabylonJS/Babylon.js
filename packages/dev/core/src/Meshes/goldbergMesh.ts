/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import goldbergMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./goldbergMesh.pure";

import { RegisterGoldbergMesh } from "./goldbergMesh.pure";
RegisterGoldbergMesh();
