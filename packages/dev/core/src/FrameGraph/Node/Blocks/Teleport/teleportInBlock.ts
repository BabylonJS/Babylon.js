/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import teleportInBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./teleportInBlock.pure";

import { registerFrameGraphNodeBlocksTeleportTeleportInBlock } from "./teleportInBlock.pure";
registerFrameGraphNodeBlocksTeleportTeleportInBlock();
