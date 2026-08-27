// Register the 2D-array upload extensions for both engines (side effects). Each extension only
// patches its own engine's prototype, so importing both is harmless regardless of which engine is
// used. This makes the plain `MultiTexture` export work on WebGL2 and WebGPU out of the box.
import "../../Engines/Extensions/engine.texture2DArrayImageSource";
import "../../Engines/WebGPU/Extensions/engine.texture2DArrayImageSource";

/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import multiTexture.pure for tree-shakeable, side-effect-free usage.
 */

export * from "./multiTexture.pure";

import { RegisterMultiTexture } from "./multiTexture.pure";
RegisterMultiTexture();
