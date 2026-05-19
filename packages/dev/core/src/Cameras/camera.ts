/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import camera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./camera.pure";
export * from "./camera.types";

import { RegisterCamera } from "./camera.pure";
RegisterCamera();
