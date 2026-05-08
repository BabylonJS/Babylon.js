/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import babylonFileLoader.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./babylonFileLoader.pure";

import { registerBabylonFileLoader } from "./babylonFileLoader.pure";
registerBabylonFileLoader();
