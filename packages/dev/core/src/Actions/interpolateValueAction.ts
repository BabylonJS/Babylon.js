/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import interpolateValueAction.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./interpolateValueAction.pure";

import { RegisterClass } from "../Misc/typeStore";
import { InterpolateValueAction } from "./interpolateValueAction.pure";

RegisterClass("BABYLON.InterpolateValueAction", InterpolateValueAction);
