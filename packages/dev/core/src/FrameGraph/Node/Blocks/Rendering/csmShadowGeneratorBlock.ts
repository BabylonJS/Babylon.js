/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import csmShadowGeneratorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./csmShadowGeneratorBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphCascadedShadowGeneratorBlock } from "./csmShadowGeneratorBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphCascadedShadowGeneratorBlock", NodeRenderGraphCascadedShadowGeneratorBlock);
