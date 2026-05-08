/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import bloomMergePostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./bloomMergePostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { BloomMergePostProcess } from "./bloomMergePostProcess.pure";

RegisterClass("BABYLON.BloomMergePostProcess", BloomMergePostProcess);
