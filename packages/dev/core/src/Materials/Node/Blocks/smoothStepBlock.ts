/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import smoothStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./smoothStepBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { SmoothStepBlock } from "./smoothStepBlock.pure";

RegisterClass("BABYLON.SmoothStepBlock", SmoothStepBlock);
