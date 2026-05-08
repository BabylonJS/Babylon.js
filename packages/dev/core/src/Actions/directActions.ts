/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import directActions.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./directActions.pure";

import { RegisterClass } from "../Misc/typeStore";
import {
    SetParentAction,
    ExecuteCodeAction,
    DoNothingAction,
    StopAnimationAction,
    PlayAnimationAction,
    IncrementValueAction,
    SetValueAction,
    SetStateAction,
    SwitchBooleanAction,
    CombineAction,
} from "./directActions.pure";

RegisterClass("BABYLON.SetParentAction", SetParentAction);
RegisterClass("BABYLON.ExecuteCodeAction", ExecuteCodeAction);
RegisterClass("BABYLON.DoNothingAction", DoNothingAction);
RegisterClass("BABYLON.StopAnimationAction", StopAnimationAction);
RegisterClass("BABYLON.PlayAnimationAction", PlayAnimationAction);
RegisterClass("BABYLON.IncrementValueAction", IncrementValueAction);
RegisterClass("BABYLON.SetValueAction", SetValueAction);
RegisterClass("BABYLON.SetStateAction", SetStateAction);
RegisterClass("BABYLON.SetParentAction", SetParentAction);
RegisterClass("BABYLON.SwitchBooleanAction", SwitchBooleanAction);
RegisterClass("BABYLON.CombineAction", CombineAction);
