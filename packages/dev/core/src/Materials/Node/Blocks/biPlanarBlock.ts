/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import biPlanarBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./biPlanarBlock.pure";

import { registerBiPlanarBlock } from "./biPlanarBlock.pure";
registerBiPlanarBlock();
