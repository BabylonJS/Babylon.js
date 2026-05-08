/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import condition.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./condition.pure";

import { RegisterClass } from "../Misc/typeStore";
import { ValueCondition, PredicateCondition, StateCondition } from "./condition.pure";

RegisterClass("BABYLON.ValueCondition", ValueCondition);
RegisterClass("BABYLON.PredicateCondition", PredicateCondition);
RegisterClass("BABYLON.StateCondition", StateCondition);
