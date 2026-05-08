/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import glowLayerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./glowLayerBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphGlowLayerBlock } from "./glowLayerBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphGlowLayerBlock", NodeRenderGraphGlowLayerBlock);
