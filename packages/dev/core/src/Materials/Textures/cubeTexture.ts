/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cubeTexture.pure";
export * from "./cubeTexture.types";

import { RegisterCubeTexture } from "./cubeTexture.pure";
RegisterCubeTexture();
