/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import setPositionsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setPositionsBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SetPositionsBlock } from "./setPositionsBlock.pure";

RegisterClass("BABYLON.SetPositionsBlock", SetPositionsBlock);
