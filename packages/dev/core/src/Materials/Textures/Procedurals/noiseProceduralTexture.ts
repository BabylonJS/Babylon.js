/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import noiseProceduralTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./noiseProceduralTexture.pure";

import { RegisterNoiseProceduralTexture } from "./noiseProceduralTexture.pure";
RegisterNoiseProceduralTexture();
