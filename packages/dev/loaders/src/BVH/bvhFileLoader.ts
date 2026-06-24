/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./bvhFileLoader.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./bvhFileLoader.types";
export * from "./bvhFileLoader.pure";

import { RegisterBVHFileLoader } from "./bvhFileLoader.pure";
RegisterBVHFileLoader();
