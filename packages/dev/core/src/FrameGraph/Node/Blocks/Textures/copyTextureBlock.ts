/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import copyTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./copyTextureBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphCopyTextureBlock } from "./copyTextureBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphCopyTextureBlock", NodeRenderGraphCopyTextureBlock);
