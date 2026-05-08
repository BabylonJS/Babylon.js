/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import objectRendererBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./objectRendererBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphObjectRendererBlock } from "./objectRendererBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphObjectRendererBlock", NodeRenderGraphObjectRendererBlock);
