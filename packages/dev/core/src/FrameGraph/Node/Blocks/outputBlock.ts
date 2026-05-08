/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import outputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./outputBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphOutputBlock } from "./outputBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphOutputBlock", NodeRenderGraphOutputBlock);
