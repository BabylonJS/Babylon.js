/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import extractHighlightsPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./extractHighlightsPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphExtractHighlightsPostProcessBlock } from "./extractHighlightsPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphExtractHighlightsPostProcessBlock", NodeRenderGraphExtractHighlightsPostProcessBlock);
