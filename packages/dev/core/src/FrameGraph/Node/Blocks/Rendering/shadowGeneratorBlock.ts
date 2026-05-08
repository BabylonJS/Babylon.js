/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import shadowGeneratorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shadowGeneratorBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphShadowGeneratorBlock } from "./shadowGeneratorBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphShadowGeneratorBlock", NodeRenderGraphShadowGeneratorBlock);
