/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import teleportInBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./teleportInBlock.pure";

import { registerMaterialsNodeBlocksTeleportTeleportInBlock } from "./teleportInBlock.pure";
registerMaterialsNodeBlocksTeleportTeleportInBlock();
