/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import ssrPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssrPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphSSRPostProcessBlock } from "./ssrPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphSSRPostProcessBlock", NodeRenderGraphSSRPostProcessBlock);
