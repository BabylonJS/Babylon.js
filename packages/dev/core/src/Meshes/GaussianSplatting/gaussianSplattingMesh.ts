/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingMesh.pure";

import { registerGaussianSplattingMesh } from "./gaussianSplattingMesh.pure";
registerGaussianSplattingMesh();
