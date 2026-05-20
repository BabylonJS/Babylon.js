/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import proceduralTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./proceduralTexture.pure";

import { RegisterProceduralTexture } from "./proceduralTexture.pure";
RegisterProceduralTexture();
