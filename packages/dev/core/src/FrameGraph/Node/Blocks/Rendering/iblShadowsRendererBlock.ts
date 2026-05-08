/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import iblShadowsRendererBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./iblShadowsRendererBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphIblShadowsRendererBlock } from "./iblShadowsRendererBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphIblShadowsRendererBlock", NodeRenderGraphIblShadowsRendererBlock);
