/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import refractionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./refractionBlock.pure";

import { registerRefractionBlock } from "./refractionBlock.pure";
registerRefractionBlock();
