/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import fogBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fogBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FogBlock } from "./fogBlock.pure";

RegisterClass("BABYLON.FogBlock", FogBlock);
