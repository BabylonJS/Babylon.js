/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import colorCorrectionPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorCorrectionPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphColorCorrectionPostProcessBlock } from "./colorCorrectionPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphColorCorrectionPostProcessBlock", NodeRenderGraphColorCorrectionPostProcessBlock);
