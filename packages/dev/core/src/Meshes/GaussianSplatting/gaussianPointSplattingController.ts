/**
 * Re-exports the pure implementation and registers point splatting on GaussianSplattingMesh.
 * Import gaussianPointSplattingController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianPointSplattingController.pure";

import { RegisterGaussianPointSplattingController } from "./gaussianPointSplattingController.pure";
RegisterGaussianPointSplattingController();

import "./gaussianPointSplattingRenderer";
import "../../Materials/GaussianSplatting/gaussianPointSplattingBlitMaterial";
import "../../Materials/GaussianSplatting/gaussianPointSplattingDepthBlitMaterial";
