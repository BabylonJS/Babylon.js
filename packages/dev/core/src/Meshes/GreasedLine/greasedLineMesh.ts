/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import greasedLineMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./greasedLineMesh.pure";

import { registerGreasedLineMesh } from "./greasedLineMesh.pure";
registerGreasedLineMesh();
