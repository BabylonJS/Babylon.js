export * from "./abstractMesh.decalMap.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractMesh.decalMap.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractMesh.decalMap.pure";

import { registerAbstractMeshDecalMap } from "./abstractMesh.decalMap.pure";
registerAbstractMeshDecalMap();
