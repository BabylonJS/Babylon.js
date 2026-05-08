/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import grainPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./grainPostProcessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphGrainPostProcessBlock } from "./grainPostProcessBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphGrainPostProcessBlock", NodeRenderGraphGrainPostProcessBlock);
