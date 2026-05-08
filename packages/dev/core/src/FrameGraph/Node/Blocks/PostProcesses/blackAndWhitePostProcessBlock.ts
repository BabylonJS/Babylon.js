/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import blackAndWhitePostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blackAndWhitePostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlackAndWhitePostProcessBlock } from "./blackAndWhitePostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphBlackAndWhitePostProcessBlock", NodeRenderGraphBlackAndWhitePostProcessBlock);
