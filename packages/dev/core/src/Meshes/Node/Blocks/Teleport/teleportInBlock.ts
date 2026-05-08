/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import teleportInBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./teleportInBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { TeleportInBlock } from "./teleportInBlock.pure";

RegisterClass("BABYLON.TeleportInBlock", TeleportInBlock);
