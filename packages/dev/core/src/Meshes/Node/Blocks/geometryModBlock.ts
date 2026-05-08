/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryModBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryModBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryModBlock } from "./geometryModBlock.pure";

RegisterClass("BABYLON.GeometryModBlock", GeometryModBlock);
