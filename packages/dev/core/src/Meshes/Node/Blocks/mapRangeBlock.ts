/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import mapRangeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mapRangeBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { MapRangeBlock } from "./mapRangeBlock.pure";

RegisterClass("BABYLON.MapRangeBlock", MapRangeBlock);
