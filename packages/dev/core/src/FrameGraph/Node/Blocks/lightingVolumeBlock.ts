/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import lightingVolumeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lightingVolumeBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphLightingVolumeBlock } from "./lightingVolumeBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphLightingVolumeBlock", NodeRenderGraphLightingVolumeBlock);
