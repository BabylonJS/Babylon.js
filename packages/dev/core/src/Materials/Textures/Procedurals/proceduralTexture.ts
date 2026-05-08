/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import proceduralTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./proceduralTexture.pure";

import { registerProceduralTexture } from "./proceduralTexture.pure";
registerProceduralTexture();
