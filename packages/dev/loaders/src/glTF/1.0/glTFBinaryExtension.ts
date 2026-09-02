/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./glTFBinaryExtension.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./glTFBinaryExtension.pure";

import "./glTFLoader";
import { RegisterGLTFBinaryExtension } from "./glTFBinaryExtension.pure";
RegisterGLTFBinaryExtension();
