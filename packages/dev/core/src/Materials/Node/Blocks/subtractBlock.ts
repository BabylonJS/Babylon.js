/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import subtractBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subtractBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { SubtractBlock } from "./subtractBlock.pure";

RegisterClass("BABYLON.SubtractBlock", SubtractBlock);
