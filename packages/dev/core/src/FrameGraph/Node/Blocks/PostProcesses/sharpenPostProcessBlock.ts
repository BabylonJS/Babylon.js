/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import sharpenPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sharpenPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphSharpenPostProcessBlock } from "./sharpenPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphSharpenPostProcessBlock", NodeRenderGraphSharpenPostProcessBlock);
