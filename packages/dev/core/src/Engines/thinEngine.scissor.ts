export * from "./thinEngine.scissor.pure";
/**
 * Re-exports the pure implementation and applies the ThinEngine scissor side effects.
 * Import thinEngine.scissor.pure for tree-shakeable, side-effect-free usage.
 */
import "./AbstractEngine/abstractEngine.scissor";

import { RegisterThinEngineScissor } from "./thinEngine.scissor.pure";
RegisterThinEngineScissor();
