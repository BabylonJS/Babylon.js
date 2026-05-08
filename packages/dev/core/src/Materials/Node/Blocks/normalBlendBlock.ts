/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import normalBlendBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./normalBlendBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NormalBlendBlock } from "./normalBlendBlock.pure";

RegisterClass("BABYLON.NormalBlendBlock", NormalBlendBlock);
