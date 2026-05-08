/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import tonemapPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tonemapPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphTonemapPostProcessBlock } from "./tonemapPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphTonemapPostProcessBlock", NodeRenderGraphTonemapPostProcessBlock);
