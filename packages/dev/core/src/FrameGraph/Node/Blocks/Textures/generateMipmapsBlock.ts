/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import generateMipmapsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./generateMipmapsBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphGenerateMipmapsBlock } from "./generateMipmapsBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphGenerateMipmapsBlock", NodeRenderGraphGenerateMipmapsBlock);
