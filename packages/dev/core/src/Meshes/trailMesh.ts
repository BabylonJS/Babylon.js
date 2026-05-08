/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import trailMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./trailMesh.pure";

import { registerTrailMesh } from "./trailMesh.pure";
registerTrailMesh();
