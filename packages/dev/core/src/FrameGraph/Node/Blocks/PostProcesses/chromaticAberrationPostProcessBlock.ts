/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import chromaticAberrationPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./chromaticAberrationPostProcessBlock.pure";

import { registerChromaticAberrationPostProcessBlock } from "./chromaticAberrationPostProcessBlock.pure";
registerChromaticAberrationPostProcessBlock();
