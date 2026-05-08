/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractMesh.pure";

import { registerAbstractMesh } from "./abstractMesh.pure";
registerAbstractMesh();
