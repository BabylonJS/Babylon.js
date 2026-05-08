/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import conditionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./conditionBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ConditionBlock } from "./conditionBlock.pure";

RegisterClass("BABYLON.ConditionBlock", ConditionBlock);
