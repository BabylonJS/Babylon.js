/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./glTFLoader.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./glTFLoader.pure";

import { RegisterGLTF1Loader } from "./glTFLoader.pure";
import { RegisterGLTFFileLoader } from "../glTFFileLoader.pure";
RegisterGLTF1Loader();
RegisterGLTFFileLoader();
