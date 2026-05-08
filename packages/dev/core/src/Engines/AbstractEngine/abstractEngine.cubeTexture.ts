/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.cubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.cubeTexture.pure";

import { registerAbstractEngineCubeTexture } from "./abstractEngine.cubeTexture.pure";
registerAbstractEngineCubeTexture();
