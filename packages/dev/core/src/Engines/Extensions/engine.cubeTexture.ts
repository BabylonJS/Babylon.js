export * from "./engine.cubeTexture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.cubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.cubeTexture.pure";

import { registerEnginesExtensionsEngineCubeTexture } from "./engine.cubeTexture.pure";
registerEnginesExtensionsEngineCubeTexture();
