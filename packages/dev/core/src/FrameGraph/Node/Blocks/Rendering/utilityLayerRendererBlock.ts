/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import utilityLayerRendererBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./utilityLayerRendererBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphUtilityLayerRendererBlock } from "./utilityLayerRendererBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphUtilityLayerRendererBlock", NodeRenderGraphUtilityLayerRendererBlock);
