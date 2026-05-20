/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingSolidColorMaterialPlugin.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingSolidColorMaterialPlugin.pure";

import { RegisterGaussianSplattingSolidColorMaterialPlugin } from "./gaussianSplattingSolidColorMaterialPlugin.pure";
RegisterGaussianSplattingSolidColorMaterialPlugin();
