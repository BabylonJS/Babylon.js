/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import freeCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./freeCamera.pure";

import { RegisterClass } from "../Misc/typeStore";
import { FreeCamera } from "./freeCamera.pure";

RegisterClass("BABYLON.FreeCamera", FreeCamera);
