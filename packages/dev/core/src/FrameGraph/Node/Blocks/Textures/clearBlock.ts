/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import clearBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clearBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphClearBlock } from "./clearBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphClearBlock", NodeRenderGraphClearBlock);
