/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./ExtrasAsMetadata.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./ExtrasAsMetadata.types";
export * from "./ExtrasAsMetadata.pure";

import { RegisterExtrasAsMetadata } from "./ExtrasAsMetadata.pure";
RegisterExtrasAsMetadata();
