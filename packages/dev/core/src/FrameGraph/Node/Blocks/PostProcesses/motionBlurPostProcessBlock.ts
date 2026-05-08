/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import motionBlurPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./motionBlurPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphMotionBlurPostProcessBlock } from "./motionBlurPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphMotionBlurPostProcessBlock", NodeRenderGraphMotionBlurPostProcessBlock);
