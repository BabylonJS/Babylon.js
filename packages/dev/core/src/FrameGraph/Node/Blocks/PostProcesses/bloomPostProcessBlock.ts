/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import bloomPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./bloomPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBloomPostProcessBlock } from "./bloomPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphBloomPostProcessBlock", NodeRenderGraphBloomPostProcessBlock);
