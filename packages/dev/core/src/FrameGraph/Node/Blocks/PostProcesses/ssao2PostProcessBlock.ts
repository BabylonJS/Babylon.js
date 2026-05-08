/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import ssao2PostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssao2PostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphSSAO2PostProcessBlock } from "./ssao2PostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphSSAO2PostProcessBlock", NodeRenderGraphSSAO2PostProcessBlock);
