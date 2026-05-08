/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import greasedLineRibbonMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./greasedLineRibbonMesh.pure";

import { RegisterGreasedLineRibbonMesh } from "./greasedLineRibbonMesh.pure";
RegisterGreasedLineRibbonMesh();
