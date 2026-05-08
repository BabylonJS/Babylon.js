/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import elbowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./elbowBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphElbowBlock } from "./elbowBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphElbowBlock", NodeRenderGraphElbowBlock);
