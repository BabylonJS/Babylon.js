/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import cullObjectsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cullObjectsBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphCullObjectsBlock } from "./cullObjectsBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphCullObjectsBlock", NodeRenderGraphCullObjectsBlock);
