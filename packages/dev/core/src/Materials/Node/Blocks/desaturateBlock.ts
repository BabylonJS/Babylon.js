/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import desaturateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./desaturateBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { DesaturateBlock } from "./desaturateBlock.pure";

RegisterClass("BABYLON.DesaturateBlock", DesaturateBlock);
