/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import scene.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./scene.pure";

import { RegisterClass } from "./Misc/typeStore";
import { Scene } from "./scene.pure";

RegisterClass("BABYLON.Scene", Scene);
