/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./splatFileLoader.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./splatFileLoader.types";
export * from "./splatFileLoader.pure";

// The SOG-with-textures path in the pure implementation relies on the prototype-augmented
// updateDynamicTexture engine extension; import its side effect here so it is present at runtime.
import "core/Engines/Extensions/engine.dynamicTexture";

import { RegisterSPLATFileLoader } from "./splatFileLoader.pure";
RegisterSPLATFileLoader();
