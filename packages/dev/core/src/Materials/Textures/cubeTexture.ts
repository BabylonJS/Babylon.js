/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
import "../../Engines/AbstractEngine/abstractEngine.cubeTexture";
export * from "./cubeTexture.pure";
export * from "./cubeTexture.types";

import { RegisterCubeTexture } from "./cubeTexture.pure";
RegisterCubeTexture();
