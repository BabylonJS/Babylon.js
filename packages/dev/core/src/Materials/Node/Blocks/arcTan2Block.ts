/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import arcTan2Block.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./arcTan2Block.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ArcTan2Block } from "./arcTan2Block.pure";

RegisterClass("BABYLON.ArcTan2Block", ArcTan2Block);
