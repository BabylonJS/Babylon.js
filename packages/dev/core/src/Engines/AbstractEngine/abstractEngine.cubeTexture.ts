export * from "./abstractEngine.cubeTexture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.cubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.cubeTexture.pure";

import { RegisterAbstractEngineCubeTexture } from "./abstractEngine.cubeTexture.pure";
RegisterAbstractEngineCubeTexture();
