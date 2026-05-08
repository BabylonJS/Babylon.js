/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import resourceContainerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./resourceContainerBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphResourceContainerBlock } from "./resourceContainerBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphResourceContainerBlock", NodeRenderGraphResourceContainerBlock);
