/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import taaPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./taaPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphTAAPostProcessBlock } from "./taaPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphTAAPostProcessBlock", NodeRenderGraphTAAPostProcessBlock);
