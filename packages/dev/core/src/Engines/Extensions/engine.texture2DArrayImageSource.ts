export * from "./engine.texture2DArrayImageSource.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.texture2DArrayImageSource.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.texture2DArrayImageSource.pure";

import { RegisterEnginesExtensionsEngineTexture2DArrayImageSource } from "./engine.texture2DArrayImageSource.pure";
RegisterEnginesExtensionsEngineTexture2DArrayImageSource();
