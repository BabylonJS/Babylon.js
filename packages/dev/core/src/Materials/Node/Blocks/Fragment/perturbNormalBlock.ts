/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import perturbNormalBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./perturbNormalBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { PerturbNormalBlock } from "./perturbNormalBlock.pure";

RegisterClass("BABYLON.PerturbNormalBlock", PerturbNormalBlock);
