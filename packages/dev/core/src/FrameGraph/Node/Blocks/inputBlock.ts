/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import inputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./inputBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphInputBlock } from "./inputBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphInputBlock", NodeRenderGraphInputBlock);
