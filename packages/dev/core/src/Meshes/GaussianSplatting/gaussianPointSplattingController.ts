/**
 * Re-exports the pure implementation and registers the optional WebGPU compute point-splatting path on
 * GaussianSplattingMesh, pulling in the compute renderer, its shaders, and the blit materials.
 * Import gaussianPointSplattingController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianPointSplattingController.pure";

import { RegisterGaussianPointSplattingController } from "./gaussianPointSplattingController.pure";
RegisterGaussianPointSplattingController();

import "./gaussianPointSplattingRenderer";
import "../../Materials/GaussianSplatting/gaussianPointSplattingBlitMaterial";
import "../../Materials/GaussianSplatting/gaussianPointSplattingDepthBlitMaterial";
