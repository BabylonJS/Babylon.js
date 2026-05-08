/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import sound.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sound.pure";

import { RegisterClass } from "../Misc/typeStore";
import { Sound } from "./sound.pure";

RegisterClass("BABYLON.Sound", Sound);
