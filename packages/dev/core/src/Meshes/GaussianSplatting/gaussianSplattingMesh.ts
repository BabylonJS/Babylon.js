/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingMesh.pure";

import { RegisterGaussianSplattingMesh } from "./gaussianSplattingMesh.pure";
RegisterGaussianSplattingMesh();

import "../thinInstanceMesh";
import "./gaussianSplattingPartProxyMesh";
import "./gaussianPointSplattingRenderer";
import "../../Materials/GaussianSplatting/gaussianPointSplattingBlitMaterial";
import "../../Materials/GaussianSplatting/gaussianPointSplattingDepthBlitMaterial";
