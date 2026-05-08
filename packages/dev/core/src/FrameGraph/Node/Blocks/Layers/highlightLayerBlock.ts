/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import highlightLayerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./highlightLayerBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphHighlightLayerBlock } from "./highlightLayerBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphHighlightLayerBlock", NodeRenderGraphHighlightLayerBlock);
