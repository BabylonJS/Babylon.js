/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import volumetricLightingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./volumetricLightingBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphVolumetricLightingBlock } from "./volumetricLightingBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphVolumetricLightingBlock", NodeRenderGraphVolumetricLightingBlock);
