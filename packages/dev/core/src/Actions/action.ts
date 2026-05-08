/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import action.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./action.pure";

import { RegisterClass } from "../Misc/typeStore";
import { Action } from "./action.pure";

RegisterClass("BABYLON.Action", Action);
