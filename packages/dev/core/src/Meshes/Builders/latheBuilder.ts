/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import latheBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./latheBuilder.pure";

import { RegisterLatheBuilder } from "./latheBuilder.pure";
RegisterLatheBuilder();
