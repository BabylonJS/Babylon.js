/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import extractHighlightsPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./extractHighlightsPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { ExtractHighlightsPostProcess } from "./extractHighlightsPostProcess.pure";

RegisterClass("BABYLON.ExtractHighlightsPostProcess", ExtractHighlightsPostProcess);
