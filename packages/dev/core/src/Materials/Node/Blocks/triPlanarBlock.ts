/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import triPlanarBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./triPlanarBlock.pure";

import { registerTriPlanarBlock } from "./triPlanarBlock.pure";
registerTriPlanarBlock();
