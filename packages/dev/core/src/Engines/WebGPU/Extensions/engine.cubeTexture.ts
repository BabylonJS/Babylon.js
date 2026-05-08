/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.cubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.cubeTexture.pure";

import { registerEnginesWebGPUExtensionsEngineCubeTexture } from "./engine.cubeTexture.pure";
registerEnginesWebGPUExtensionsEngineCubeTexture();
