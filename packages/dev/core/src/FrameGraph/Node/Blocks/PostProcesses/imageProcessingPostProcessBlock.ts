/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import imageProcessingPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./imageProcessingPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphImageProcessingPostProcessBlock } from "./imageProcessingPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphImageProcessingPostProcessBlock", NodeRenderGraphImageProcessingPostProcessBlock);
