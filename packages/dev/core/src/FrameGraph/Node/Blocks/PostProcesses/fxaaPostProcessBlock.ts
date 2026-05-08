/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import fxaaPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fxaaPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphFXAAPostProcessBlock } from "./fxaaPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphFXAAPostProcessBlock", NodeRenderGraphFXAAPostProcessBlock);
