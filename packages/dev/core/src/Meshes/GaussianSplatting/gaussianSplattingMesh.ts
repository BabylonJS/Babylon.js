/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingMesh.pure";

import { RegisterGaussianSplattingMesh } from "./gaussianSplattingMesh.pure";
RegisterGaussianSplattingMesh();

import "../thinInstanceMesh";
import "./gaussianSplattingPartProxyMesh";
// Keeps point splatting available for legacy (non-pure) and @babylonjs/core root-index consumers.
// Tree-shaking users import gaussianSplattingMesh.pure and opt in separately.
import "./gaussianPointSplattingController";
