/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import filterPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./filterPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphFilterPostProcessBlock } from "./filterPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphFilterPostProcessBlock", NodeRenderGraphFilterPostProcessBlock);
