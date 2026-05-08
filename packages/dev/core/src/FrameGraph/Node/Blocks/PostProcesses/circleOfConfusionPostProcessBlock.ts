/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import circleOfConfusionPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./circleOfConfusionPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphCircleOfConfusionPostProcessBlock } from "./circleOfConfusionPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphCircleOfConfusionPostProcessBlock", NodeRenderGraphCircleOfConfusionPostProcessBlock);
