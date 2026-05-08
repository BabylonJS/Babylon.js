/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import computeShaderBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./computeShaderBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphComputeShaderBlock } from "./computeShaderBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphComputeShaderBlock", NodeRenderGraphComputeShaderBlock);
