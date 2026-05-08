/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import worleyNoise3DBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./worleyNoise3DBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { WorleyNoise3DBlock } from "./worleyNoise3DBlock.pure";

RegisterClass("BABYLON.WorleyNoise3DBlock", WorleyNoise3DBlock);
