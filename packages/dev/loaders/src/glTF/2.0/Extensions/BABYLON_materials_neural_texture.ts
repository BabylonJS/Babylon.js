/**
 * Re-exports the pure implementation and applies runtime registration.
 * Import "./BABYLON_materials_neural_texture.pure" for side-effect-free usage.
 */
export * from "./BABYLON_materials_neural_texture.types";
export * from "./BABYLON_materials_neural_texture.pure";

import { RegisterBABYLON_materials_neural_texture } from "./BABYLON_materials_neural_texture.pure";
RegisterBABYLON_materials_neural_texture();
