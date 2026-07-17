/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.texture2DArrayImageSource.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.texture2DArrayImageSource.pure";

import { RegisterEnginesWebGPUExtensionsEngineTexture2DArrayImageSource } from "./engine.texture2DArrayImageSource.pure";
RegisterEnginesWebGPUExtensionsEngineTexture2DArrayImageSource();
