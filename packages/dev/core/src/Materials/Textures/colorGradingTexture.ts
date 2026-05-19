/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorGradingTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorGradingTexture.pure";
export * from "./colorGradingTexture.types";

import { RegisterColorGradingTexture } from "./colorGradingTexture.pure";
RegisterColorGradingTexture();
