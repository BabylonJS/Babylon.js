export * from "./abstractEngine.renderPass.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.renderPass.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.renderPass.pure";

import { RegisterAbstractEngineRenderPass } from "./abstractEngine.renderPass.pure";
RegisterAbstractEngineRenderPass();
