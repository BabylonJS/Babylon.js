/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateFlowMapBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateFlowMapBlock.pure";

import { registerUpdateFlowMapBlock } from "./updateFlowMapBlock.pure";
registerUpdateFlowMapBlock();
