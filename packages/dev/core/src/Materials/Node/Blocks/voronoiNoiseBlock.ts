/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import voronoiNoiseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./voronoiNoiseBlock.pure";

import { registerVoronoiNoiseBlock } from "./voronoiNoiseBlock.pure";
registerVoronoiNoiseBlock();
