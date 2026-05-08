/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingPartProxyMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingPartProxyMesh.pure";

import { RegisterGaussianSplattingPartProxyMesh } from "./gaussianSplattingPartProxyMesh.pure";
RegisterGaussianSplattingPartProxyMesh();
