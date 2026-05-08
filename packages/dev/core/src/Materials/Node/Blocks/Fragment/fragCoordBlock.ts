/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import fragCoordBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fragCoordBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FragCoordBlock } from "./fragCoordBlock.pure";

RegisterClass("BABYLON.FragCoordBlock", FragCoordBlock);
