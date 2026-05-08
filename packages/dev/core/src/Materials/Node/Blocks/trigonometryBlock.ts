/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import trigonometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./trigonometryBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { TrigonometryBlock } from "./trigonometryBlock.pure";

RegisterClass("BABYLON.TrigonometryBlock", TrigonometryBlock);
