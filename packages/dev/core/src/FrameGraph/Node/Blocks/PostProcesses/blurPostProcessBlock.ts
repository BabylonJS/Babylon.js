/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import blurPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blurPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlurPostProcessBlock } from "./blurPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphBlurPostProcessBlock", NodeRenderGraphBlurPostProcessBlock);
