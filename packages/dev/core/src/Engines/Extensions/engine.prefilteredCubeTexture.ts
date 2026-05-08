export * from "./engine.prefilteredCubeTexture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.prefilteredCubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.prefilteredCubeTexture.pure";

import { registerEnginePrefilteredCubeTexture } from "./engine.prefilteredCubeTexture.pure";
registerEnginePrefilteredCubeTexture();
