/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import noiseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./noiseBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NoiseBlock } from "./noiseBlock.pure";

RegisterClass("BABYLON.NoiseBlock", NoiseBlock);
