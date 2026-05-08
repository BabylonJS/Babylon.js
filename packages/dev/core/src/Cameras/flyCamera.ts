/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flyCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flyCamera.pure";

import { RegisterClass } from "../Misc/typeStore";
import { FlyCamera } from "./flyCamera.pure";

RegisterClass("BABYLON.FlyCamera", FlyCamera);
