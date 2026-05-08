/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import linesMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./linesMesh.pure";

import { registerLinesMesh } from "./linesMesh.pure";
registerLinesMesh();
