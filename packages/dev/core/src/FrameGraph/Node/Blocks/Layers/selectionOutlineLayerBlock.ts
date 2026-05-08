/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import selectionOutlineLayerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./selectionOutlineLayerBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphSelectionOutlineLayerBlock } from "./selectionOutlineLayerBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphSelectionOutlineLayerBlock", NodeRenderGraphSelectionOutlineLayerBlock);
