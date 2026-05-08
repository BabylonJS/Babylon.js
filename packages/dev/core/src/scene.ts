/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import scene.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./scene.pure";

import { RegisterScene } from "./scene.pure";
RegisterScene();
