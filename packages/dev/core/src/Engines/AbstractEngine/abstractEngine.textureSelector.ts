export * from "./abstractEngine.textureSelector.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.textureSelector.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.textureSelector.pure";

import { RegisterAbstractEngineTextureSelector } from "./abstractEngine.textureSelector.pure";
RegisterAbstractEngineTextureSelector();
