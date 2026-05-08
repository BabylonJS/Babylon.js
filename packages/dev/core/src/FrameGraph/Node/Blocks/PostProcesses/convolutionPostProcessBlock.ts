/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import convolutionPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./convolutionPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphConvolutionPostProcessBlock } from "./convolutionPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphConvolutionPostProcessBlock", NodeRenderGraphConvolutionPostProcessBlock);
