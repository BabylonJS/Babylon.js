/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingCompoundMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingCompoundMesh.pure";

import { registerGaussianSplattingCompoundMesh } from "./gaussianSplattingCompoundMesh.pure";
registerGaussianSplattingCompoundMesh();
