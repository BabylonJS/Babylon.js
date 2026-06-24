/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./stlFileLoader.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./stlFileLoader.types";
export * from "./stlFileLoader.pure";

import "core/Materials/standardMaterial";

import { RegisterSTLFileLoader } from "./stlFileLoader.pure";
RegisterSTLFileLoader();
