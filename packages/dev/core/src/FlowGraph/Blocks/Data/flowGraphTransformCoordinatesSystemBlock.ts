/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphTransformCoordinatesSystemBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphTransformCoordinatesSystemBlock.pure";

import { registerFlowGraphTransformCoordinatesSystemBlock } from "./flowGraphTransformCoordinatesSystemBlock.pure";
registerFlowGraphTransformCoordinatesSystemBlock();
