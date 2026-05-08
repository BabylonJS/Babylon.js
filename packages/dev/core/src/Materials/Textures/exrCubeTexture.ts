/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import exrCubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./exrCubeTexture.pure";

import { registerExrCubeTexture } from "./exrCubeTexture.pure";
registerExrCubeTexture();
