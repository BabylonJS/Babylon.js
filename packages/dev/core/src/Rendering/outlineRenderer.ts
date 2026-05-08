export * from "./outlineRenderer.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import outlineRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./outlineRenderer.pure";

import { registerOutlineRenderer } from "./outlineRenderer.pure";
registerOutlineRenderer();
