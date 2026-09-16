/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./glTFMaterialsCommonExtension.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./glTFMaterialsCommonExtension.pure";

import "./glTFLoader";
import { RegisterGLTFMaterialsCommonExtension } from "./glTFMaterialsCommonExtension.pure";
RegisterGLTFMaterialsCommonExtension();
