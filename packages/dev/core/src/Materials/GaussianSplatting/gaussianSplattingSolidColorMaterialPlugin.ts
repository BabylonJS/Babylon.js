/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingSolidColorMaterialPlugin.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingSolidColorMaterialPlugin.pure";

import { registerGaussianSplattingSolidColorMaterialPlugin } from "./gaussianSplattingSolidColorMaterialPlugin.pure";
registerGaussianSplattingSolidColorMaterialPlugin();
