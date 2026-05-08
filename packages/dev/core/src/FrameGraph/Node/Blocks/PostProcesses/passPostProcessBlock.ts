/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import passPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./passPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphPassPostProcessBlock, NodeRenderGraphPassCubePostProcessBlock } from "./passPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphPassPostProcessBlock", NodeRenderGraphPassPostProcessBlock);
RegisterClass("BABYLON.NodeRenderGraphPassCubePostProcessBlock", NodeRenderGraphPassCubePostProcessBlock);
