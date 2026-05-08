/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import screenSpaceCurvaturePostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSpaceCurvaturePostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphScreenSpaceCurvaturePostProcessBlock } from "./screenSpaceCurvaturePostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphScreenSpaceCurvaturePostProcessBlock", NodeRenderGraphScreenSpaceCurvaturePostProcessBlock);
