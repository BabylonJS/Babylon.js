/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import teleportOutBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./teleportOutBlock.pure";

import { registerFrameGraphNodeBlocksTeleportTeleportOutBlock } from "./teleportOutBlock.pure";
registerFrameGraphNodeBlocksTeleportTeleportOutBlock();
