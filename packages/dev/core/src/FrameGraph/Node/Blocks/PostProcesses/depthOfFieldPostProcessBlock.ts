/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import depthOfFieldPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthOfFieldPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphDepthOfFieldPostProcessBlock } from "./depthOfFieldPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphDepthOfFieldPostProcessBlock", NodeRenderGraphDepthOfFieldPostProcessBlock);
