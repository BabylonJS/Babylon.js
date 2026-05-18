export * from "./subMesh.project.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import subMesh.project.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subMesh.project.pure";

import { RegisterSubMeshProject } from "./subMesh.project.pure";
RegisterSubMeshProject();
