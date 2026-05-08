/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.transformFeedback.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.transformFeedback.pure";

import { registerEngineTransformFeedback } from "./engine.transformFeedback.pure";
registerEngineTransformFeedback();
