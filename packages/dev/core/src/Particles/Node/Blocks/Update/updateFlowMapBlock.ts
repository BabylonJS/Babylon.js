/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateFlowMapBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateFlowMapBlock.pure";

import { RegisterUpdateFlowMapBlock } from "./updateFlowMapBlock.pure";
RegisterUpdateFlowMapBlock();
