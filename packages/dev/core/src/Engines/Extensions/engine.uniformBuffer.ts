export * from "./engine.uniformBuffer.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.uniformBuffer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.uniformBuffer.pure";

import { RegisterEngineUniformBuffer } from "./engine.uniformBuffer.pure";
RegisterEngineUniformBuffer();
