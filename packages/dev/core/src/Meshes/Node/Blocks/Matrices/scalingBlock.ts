/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import scalingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./scalingBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ScalingBlock } from "./scalingBlock.pure";

RegisterClass("BABYLON.ScalingBlock", ScalingBlock);
