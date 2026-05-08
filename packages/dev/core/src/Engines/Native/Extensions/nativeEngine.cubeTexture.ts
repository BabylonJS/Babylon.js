export * from "./nativeEngine.cubeTexture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import nativeEngine.cubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nativeEngine.cubeTexture.pure";

import { RegisterNativeEngineCubeTexture } from "./nativeEngine.cubeTexture.pure";
RegisterNativeEngineCubeTexture();
