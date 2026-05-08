/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import stepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stepBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { StepBlock } from "./stepBlock.pure";

RegisterClass("BABYLON.StepBlock", StepBlock);
